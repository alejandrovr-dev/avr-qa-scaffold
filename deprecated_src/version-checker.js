/**
 * @module lib/version-checker.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Checks package version compatibility and handles updates
 * Ensures all tools work together without compatibility issues
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-12
 * @lastModified 2025-05-12
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { execaCommand } from 'execa';
import semver from 'semver';
import inquirer from 'inquirer';
import chalk from 'chalk';

import { logSuccess, logInfo, logWarning, logError, extractPackageName } from './utils.js';

/**
 * Known compatibility issues between packages
 * @constant {Array<Object>}
 */
const COMPATIBILITY_ISSUES = [
  {
    packages: [
      { name: 'eslint', version: '8.x+' },
      { name: 'eslint-config-prettier', version: '<8.0.0' }
    ],
    message: 'ESLint 8+ works best with eslint-config-prettier 8+'
  },
  {
    packages: [
      { name: 'prettier', version: '3.x+' },
      { name: 'eslint-plugin-prettier', version: '<5.0.0' }
    ],
    message: 'Prettier 3+ requires eslint-plugin-prettier 5+'
  },
  {
    packages: [
      { name: 'husky', version: '8.x+' },
      { name: 'lint-staged', version: '<10.0.0' }
    ],
    message: 'Husky 8+ works best with lint-staged 10+'
  }
];

/**
 * Get the installed version of a package
 * @param {string} packageName - Name of the package
 * @returns {Promise<string|null>} - Version string or null if not installed
 */
export async function getInstalledVersion(packageName) {
  try {
    const { stdout } = await execaCommand(`npm list ${packageName} --depth=0 --json`, {
      reject: false,
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    // Try to parse JSON output
    try {
      const npmListOutput = JSON.parse(stdout);
      if (npmListOutput.dependencies && npmListOutput.dependencies[packageName]) {
        return npmListOutput.dependencies[packageName].version;
      }
    } catch (parseError) {
      // Fallback to regex parsing if JSON parsing fails
      const versionMatch = stdout.match(new RegExp(`${packageName}@([\\d\\.]+)`));
      return versionMatch ? versionMatch[1] : null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a version matches a pattern like '8.x+' or '<8.0.0'
 * @param {string} version - Version to check
 * @param {string} pattern - Pattern to match against
 * @returns {boolean} - True if version matches pattern
 */
export function versionMatchesPattern(version, pattern) {
  if (!version) return false;
  
  // Pattern like '8.x+'
  if (pattern.includes('x+')) {
    const major = parseInt(pattern.split('.')[0], 10);
    return semver.major(version) >= major;
  }
  
  // Pattern like '8.x'
  if (pattern.includes('x')) {
    const major = parseInt(pattern.split('.')[0], 10);
    return semver.major(version) === major;
  }
  
  // Pattern like '<8.0.0'
  if (pattern.startsWith('<')) {
    const compareVersion = pattern.substring(1);
    return semver.lt(version, compareVersion);
  }
  
  // Pattern like '>8.0.0'
  if (pattern.startsWith('>')) {
    const compareVersion = pattern.substring(1);
    return semver.gt(version, compareVersion);
  }
  
  // Exact version match
  return semver.eq(version, pattern);
}

/**
 * Update a package to the latest version
 * @param {string} packageName - Name of the package to update
 * @param {boolean} verbose - Whether to show verbose output
 * @returns {Promise<boolean>} - True if update was successful
 */
export async function updatePackage(packageName, verbose = false) {
  try {
    logInfo(`Updating ${packageName} to latest version...`);
    
    await execaCommand(`npm install --save-dev ${packageName}@latest`, {
      stdio: verbose ? 'inherit' : 'pipe'
    });
    
    logSuccess(`Package ${packageName} updated successfully`);
    return true;
  } catch (error) {
    logError(`Failed to update ${packageName}: ${error.message}`);
    return false;
  }
}

/**
 * Check individual package versions against defined compatibility issues
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} - True if all versions are compatible
 */
export async function checkVersionCompatibility(options = {}) {
  const { verbose = false } = options;
  
  logInfo('Checking package version compatibility...');
  let allCompatible = true;
  
  // Check for known compatibility issues between packages
  for (const issue of COMPATIBILITY_ISSUES) {
    const [package1, package2] = issue.packages;
    
    // Get installed versions of both packages
    const version1 = await getInstalledVersion(package1.name);
    const version2 = await getInstalledVersion(package2.name);
    
    // Skip if either package is not installed
    if (!version1 || !version2) {
      if (verbose) {
        logInfo(`Skipping compatibility check for ${chalk.cyan(package1.name)} and ${chalk.cyan(package2.name)} (one or both not installed)`);
      }
      continue;
    }
    
    // Check if versions match the compatibility issue patterns
    const package1Matches = versionMatchesPattern(version1, package1.version);
    const package2Matches = versionMatchesPattern(version2, package2.version);
    
    if (package1Matches && package2Matches) {
      logWarning(`Compatibility issue detected: ${issue.message}`);
      logWarning(`  ${package1.name}@${version1} and ${package2.name}@${version2} may have compatibility issues`);
      allCompatible = false;
      
      // Ask user if they want to update the second package
      const { shouldUpdate } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldUpdate',
        message: `Do you want to update ${package2.name}?`,
        default: true
      }]);
      
      if (shouldUpdate) {
        await updatePackage(package2.name, verbose);
      } else {
        logWarning(`Continuing with potentially incompatible versions of ${package1.name} and ${package2.name}`);
      }
    } else if (verbose) {
      logSuccess(`✓ ${package1.name}@${version1} and ${package2.name}@${version2} are compatible`);
    }
  }
  
  if (allCompatible) {
    logSuccess('All package versions are compatible');
  } else {
    logWarning('Some compatibility issues were detected and addressed');
  }
  
  return allCompatible;
}

/**
 * Compare two version strings
 * @param {string} version1 - First version
 * @param {string} version2 - Second version
 * @param {string} operator - Comparison operator (>, <, >=, <=, =)
 * @returns {boolean} - Result of the comparison
 */
export function compareVersions(version1, version2, operator = '>=') {
  switch (operator) {
    case '>':
      return semver.gt(version1, version2);
    case '>=':
      return semver.gte(version1, version2);
    case '<':
      return semver.lt(version1, version2);
    case '<=':
      return semver.lte(version1, version2);
    case '=':
    case '==':
      return semver.eq(version1, version2);
    case '!=':
      return !semver.eq(version1, version2);
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
}

/**
 * Check if a package meets minimum version requirements
 * @param {string} packageName - Name of the package
 * @param {string} minVersion - Minimum version required
 * @param {boolean} verbose - Whether to show verbose output
 * @returns {Promise<boolean>} - True if the package meets requirements
 */
export async function checkPackageVersion(packageName, minVersion, verbose = false) {
  const installedVersion = await getInstalledVersion(packageName);
  
  if (!installedVersion) {
    if (verbose) {
      logWarning(`Package ${chalk.cyan(packageName)} is not installed`);
    }
    return false;
  }
  
  const isCompatible = semver.gte(installedVersion, minVersion);
  
  if (isCompatible) {
    if (verbose) {
      logSuccess(`✓ ${packageName} version ${installedVersion} is compatible (>= ${minVersion})`);
    }
    return true;
  }
  
  logWarning(`Package ${packageName} version ${installedVersion} is below the minimum required version ${minVersion}`);
  
  // Ask user if they want to update
  const { shouldUpdate } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldUpdate',
    message: `Do you want to update ${packageName} to the latest version?`,
    default: true
  }]);
  
  if (shouldUpdate) {
    return await updatePackage(packageName, verbose);
  }
  
  logWarning(`Continuing with older version of ${packageName}`);
  return false;
}