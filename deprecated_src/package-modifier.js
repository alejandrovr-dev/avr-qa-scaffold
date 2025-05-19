/**
 * @module lib/package-modifier.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Handles modifications to package.json including dependency management
 * and script configuration for the quality system
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-12
 * @lastModified 2025-05-12
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execaCommand } from 'execa';
import chalk from 'chalk';

import { getProjectDependencies } from './project-types.js';
import { logSuccess, logInfo, logWarning, logError } from './utils.js';

/**
 * Check if a package is already installed
 * @param {string} packageName - Name of the package to check (without version)
 * @returns {Promise<boolean>} Whether the package is installed
 */
export async function isPackageInstalled(packageName) {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    // Extract package name from "@org/package" or "package@version"
    const name = packageName.split('@')[0] || packageName;
    
    return (
      (packageJson.dependencies && packageJson.dependencies[name]) ||
      (packageJson.devDependencies && packageJson.devDependencies[name])
    );
  } catch (error) {
    logError(`Error checking if ${packageName} is installed: ${error.message}`);
    return false;
  }
}

/**
 * Install all dependencies needed for the quality system
 * @param {Object} options - Options for installation
 * @param {string} options.projectType - Type of project
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether installation was successful
 */
export async function installDependencies(options = {}) {
  const { projectType = 'node', verbose = false } = options;
  
  try {
    // Get the list of dependencies for this project type
    const dependencies = getProjectDependencies(projectType);
    
    logInfo('Checking for missing dependencies...');
    
    // Check which packages are already installed
    const packagesToInstall = [];
    for (const dependency of dependencies) {
      // Extract package name without version
      const packageName = dependency.split('@')[0];
      
      if (!await isPackageInstalled(packageName)) {
        packagesToInstall.push(dependency);
      } else if (verbose) {
        logInfo(`Package ${chalk.cyan(packageName)} is already installed.`);
      }
    }
    
    if (packagesToInstall.length === 0) {
      logSuccess('All dependencies are already installed.');
      return true;
    }
    
    // Install missing dependencies
    logInfo(`Installing dependencies: ${packagesToInstall.join(', ')}`);
    
    const installCommand = `npm install --save-dev ${packagesToInstall.join(' ')}`;
    
    if (verbose) {
      logInfo(`Running: ${chalk.cyan(installCommand)}`);
    }
    
    await execaCommand(installCommand, { stdio: verbose ? 'inherit' : 'pipe' });
    logSuccess('Dependencies installed successfully.');
    
    return true;
  } catch (error) {
    logError(`Failed to install dependencies: ${error.message}`);
    throw error;
  }
}

/**
 * Add dev dependencies to the project
 * @param {string[]} dependencies - Array of dependencies to add
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether the operation was successful
 */
export async function addDevDependencies(dependencies, options = {}) {
  const { verbose = false } = options;
  
  if (!dependencies || dependencies.length === 0) {
    return true; // Nothing to do
  }
  
  try {
    const installCommand = `npm install --save-dev ${dependencies.join(' ')}`;
    
    if (verbose) {
      logInfo(`Running: ${chalk.cyan(installCommand)}`);
    }
    
    await execaCommand(installCommand, { stdio: verbose ? 'inherit' : 'pipe' });
    logSuccess('Dev dependencies added successfully.');
    
    return true;
  } catch (error) {
    logError(`Failed to add dev dependencies: ${error.message}`);
    throw error;
  }
}

/**
 * Modify package.json with provided values
 * @param {Object} values - Values to add or update in package.json
 * @returns {Promise<boolean>} Whether the modification was successful
 */
export async function modifyPackageJson(values) {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    // Deep merge values into packageJson
    const merged = deepMerge(packageJson, values);
    
    // Write the updated package.json
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(merged, null, 2) + '\n'
    );
    
    return true;
  } catch (error) {
    logError(`Failed to modify package.json: ${error.message}`);
    throw error;
  }
}

/**
 * Add scripts to package.json for the quality system
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether the operation was successful
 */
export async function addScriptsToPackageJson(options = {}) {
  const { verbose = false } = options;
  
  try {
    // Define scripts to add
    const scripts = {
      'lint': 'eslint --ignore-path .gitignore --ext .js .',
      'lint:fix': 'eslint --ignore-path .gitignore --ext .js . --fix',
      'format': 'prettier --ignore-path .gitignore --write "**/*.{js,json,md}"',
      'commit': 'cz',
      'prepare': 'husky',
      
      // Testing scripts
      'test': 'node --experimental-vm-modules node_modules/jest/bin/jest.js',
      'test:watch': 'node --experimental-vm-modules node_modules/jest/bin/jest.js --watch',
      
      // Unit test scripts
      'test:unit': 'node --experimental-vm-modules node_modules/jest/bin/jest.js src',
      'test:unit:watch': 'node --experimental-vm-modules node_modules/jest/bin/jest.js src --watch',
      'test:unit:coverage': 'node --experimental-vm-modules node_modules/jest/bin/jest.js src --coverage',
      
      // Integration test scripts
      'test:integration': 'node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration',
      'test:integration:watch': 'node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration --watch',
      
      // E2E test scripts
      'test:e2e': 'node --experimental-vm-modules node_modules/jest/bin/jest.js tests/e2e',
      'test:e2e:watch': 'node --experimental-vm-modules node_modules/jest/bin/jest.js tests/e2e --watch',
      
      // CI test script
      'test:ci': 'node --experimental-vm-modules node_modules/jest/bin/jest.js --ci --runInBand --forceExit --coverage src tests/integration',
      
      // Coverage script
      'test:coverage': 'node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage'
    };
    
    // Configure Commitizen
    const config = {
      config: {
        commitizen: {
          path: './node_modules/cz-conventional-changelog'
        }
      }
    };
    
    // Update package.json
    const values = {
      scripts,
      ...config
    };
    
    await modifyPackageJson(values);
    
    logSuccess('Scripts added to package.json');
    if (verbose) {
      logInfo('Added the following scripts:');
      for (const [name, command] of Object.entries(scripts)) {
        logInfo(`  - ${chalk.cyan(name)}: ${command}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Failed to add scripts to package.json: ${error.message}`);
    throw error;
  }
}

/**
 * Utility function to perform deep merge of objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 * @private
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // If the value is an object, recursively merge
      if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key], value);
      } else {
        result[key] = { ...value };
      }
    } else {
      // For primitives and arrays, simply replace
      result[key] = value;
    }
  }
  
  return result;
}