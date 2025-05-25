/**
 * @module src/services/versionService.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Core business logic for version management and compatibility checking
 * Handles version comparison, compatibility validation, and update recommendations
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import semver from 'semver';

/**
 * Known compatibility issues between packages
 * @constant {Array<Object>}
 * @private
 */
const COMPATIBILITY_ISSUES = [
  {
    packages: [
      { name: 'eslint', version: '8.x+' },
      { name: 'eslint-config-prettier', version: '<8.0.0' },
    ],
    message: 'ESLint 8+ works best with eslint-config-prettier 8+',
    severity: 'warning'
  },
  {
    packages: [
      { name: 'prettier', version: '3.x+' },
      { name: 'eslint-plugin-prettier', version: '<5.0.0' },
    ],
    message: 'Prettier 3+ requires eslint-plugin-prettier 5+',
    severity: 'error'
  },
  {
    packages: [
      { name: 'husky', version: '8.x+' },
      { name: 'lint-staged', version: '<10.0.0' },
    ],
    message: 'Husky 8+ works best with lint-staged 10+',
    severity: 'warning'
  },
  {
    packages: [
      { name: 'jest', version: '29.x+' },
      { name: '@testing-library/jest-dom', version: '<6.0.0' },
    ],
    message: 'Jest 29+ works best with @testing-library/jest-dom 6+',
    severity: 'warning'
  }
];

/**
 * Minimum version requirements for Node.js compatibility
 * @constant {Object}
 * @private
 */
const MINIMUM_VERSIONS = {
  node: '20.0.0',
  npm: '8.0.0',
  eslint: '8.0.0',
  prettier: '3.0.0',
  jest: '29.0.0',
};

/**
 * Creates a version service for managing version compatibility and comparisons
 * @param {Object} dependencies - Dependencies for the service
 * @param {import('../ports/output/packageManagerPort.js').PackageManagerPort} dependencies.packageManager - Package manager adapter
 * @param {import('../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger adapter
 * @returns {Object} Version service instance
 */
export function createVersionService({ packageManager, logger }) {
  return {
    /**
     * Check if a version matches a pattern like '8.x+', '<8.0.0', etc.
     * @param {string} version - Version to check
     * @param {string} pattern - Pattern to match against
     * @returns {boolean} Whether version matches pattern
     */
    versionMatchesPattern(version, pattern) {
      if (!version || !pattern) {
        return false;
      }

      try {
        // Clean version (remove leading 'v' if present)
        const cleanVersion = semver.clean(version);
        if (!cleanVersion) {
          return false;
        }

        // Pattern like '8.x+'
        if (pattern.includes('x+')) {
          const major = parseInt(pattern.split('.')[0], 10);
          return semver.major(cleanVersion) >= major;
        }

        // Pattern like '8.x'
        if (pattern.includes('x')) {
          const major = parseInt(pattern.split('.')[0], 10);
          return semver.major(cleanVersion) === major;
        }

        // Pattern like '>=8.0.0'
        if (pattern.startsWith('>=')) {
          const compareVersion = pattern.substring(2);
          return semver.gte(cleanVersion, compareVersion);
        }

        // Pattern like '<=8.0.0'
        if (pattern.startsWith('<=')) {
          const compareVersion = pattern.substring(2);
          return semver.lte(cleanVersion, compareVersion);
        }

        // Pattern like '<8.0.0'
        if (pattern.startsWith('<')) {
          const compareVersion = pattern.substring(1);
          return semver.lt(cleanVersion, compareVersion);
        }

        // Pattern like '>8.0.0'
        if (pattern.startsWith('>')) {
          const compareVersion = pattern.substring(1);
          return semver.gt(cleanVersion, compareVersion);
        }

        // Exact version match
        return semver.eq(cleanVersion, pattern);
      } catch (error) {
        logger.error(`Error matching version ${version} against pattern ${pattern}: ${error.message}`);
        return false;
      }
    },

    /**
     * Compare two version strings using semver
     * @param {string} version1 - First version
     * @param {string} version2 - Second version
     * @param {string} [operator='>='] - Comparison operator (>, <, >=, <=, =, !=)
     * @returns {boolean} Result of the comparison
     */
    compareVersions(version1, version2, operator = '>=') {
      if (!version1 || !version2) {
        return false;
      }

      try {
        const clean1 = semver.clean(version1);
        const clean2 = semver.clean(version2);

        if (!clean1 || !clean2) {
          return false;
        }

        switch (operator) {
          case '>':
            return semver.gt(clean1, clean2);
          case '>=':
            return semver.gte(clean1, clean2);
          case '<':
            return semver.lt(clean1, clean2);
          case '<=':
            return semver.lte(clean1, clean2);
          case '=':
          case '==':
            return semver.eq(clean1, clean2);
          case '!=':
            return !semver.eq(clean1, clean2);
          default:
            throw new Error(`Invalid operator: ${operator}`);
        }
      } catch (error) {
        logger.error(`Error comparing versions ${version1} and ${version2}: ${error.message}`);
        return false;
      }
    },

    /**
     * Check if a package meets minimum version requirements
     * @param {string} packageName - Name of the package
     * @param {string} installedVersion - Installed version
     * @param {string} [minVersion] - Minimum version required (uses defaults if not provided)
     * @returns {Object} Compatibility check result
     */
    checkMinimumVersion(packageName, installedVersion, minVersion) {
      const requiredVersion = minVersion || MINIMUM_VERSIONS[packageName];
      
      if (!requiredVersion) {
        return {
          compatible: true,
          packageName,
          installedVersion,
          requiredVersion: null,
          message: `No minimum version requirement for ${packageName}`
        };
      }

      if (!installedVersion) {
        return {
          compatible: false,
          packageName,
          installedVersion: null,
          requiredVersion,
          message: `${packageName} is not installed`
        };
      }

      const isCompatible = this.compareVersions(installedVersion, requiredVersion, '>=');
      
      return {
        compatible: isCompatible,
        packageName,
        installedVersion,
        requiredVersion,
        message: isCompatible 
          ? `${packageName} version ${installedVersion} meets requirement (>= ${requiredVersion})`
          : `${packageName} version ${installedVersion} is below minimum required version ${requiredVersion}`
      };
    },

    /**
     * Check compatibility between installed packages
     * @param {Object} installedVersions - Object with package names as keys and versions as values
     * @param {boolean} [verbose=false] - Show verbose output
     * @returns {Promise<Object>} Compatibility check results
     */
    async checkPackageCompatibility(installedVersions, verbose = false) {
      const results = {
        compatible: true,
        issues: [],
        warnings: [],
        summary: {
          totalChecks: 0,
          compatibilityIssues: 0,
          warnings: 0
        }
      };

      for (const issue of COMPATIBILITY_ISSUES) {
        const [package1, package2] = issue.packages;
        
        // Get installed versions
        const version1 = installedVersions[package1.name];
        const version2 = installedVersions[package2.name];

        // Skip if either package is not installed
        if (!version1 || !version2) {
          if (verbose) {
            logger.info(`Skipping compatibility check for ${package1.name} and ${package2.name} (one or both not installed)`);
          }
          continue;
        }

        results.summary.totalChecks++;

        // Check if versions match the problematic patterns
        const package1Matches = this.versionMatchesPattern(version1, package1.version);
        const package2Matches = this.versionMatchesPattern(version2, package2.version);

        if (package1Matches && package2Matches) {
          const compatibilityIssue = {
            type: issue.severity,
            message: issue.message,
            packages: [
              { name: package1.name, version: version1, expectedPattern: package1.version },
              { name: package2.name, version: version2, expectedPattern: package2.version }
            ],
            recommendation: `Consider updating ${package2.name} to resolve compatibility issue`
          };

          if (issue.severity === 'error') {
            results.issues.push(compatibilityIssue);
            results.compatible = false;
            results.summary.compatibilityIssues++;
          } else {
            results.warnings.push(compatibilityIssue);
            results.summary.warnings++;
          }

          logger.warning(`${issue.severity.toUpperCase()}: ${issue.message}`);
          logger.warning(`  ${package1.name}@${version1} and ${package2.name}@${version2} may have compatibility issues`);
        } else {
          if (verbose) {
            logger.info(`✓ ${package1.name}@${version1} and ${package2.name}@${version2} are compatible`);
          }
        }
      }

      return results;
    },

    /**
     * Get update recommendations based on compatibility issues
     * @param {Object} compatibilityResults - Results from checkPackageCompatibility
     * @returns {Array<Object>} Array of update recommendations
     */
    getUpdateRecommendations(compatibilityResults) {
      const recommendations = [];
      const processedPackages = new Set();

      // Process compatibility issues
      [...compatibilityResults.issues, ...compatibilityResults.warnings].forEach(issue => {
        issue.packages.forEach(pkg => {
          if (!processedPackages.has(pkg.name)) {
            recommendations.push({
              packageName: pkg.name,
              currentVersion: pkg.version,
              reason: issue.message,
              severity: issue.type,
              action: 'update'
            });
            processedPackages.add(pkg.name);
          }
        });
      });

      return recommendations;
    },

    /**
     * Check if a version string is valid semver
     * @param {string} version - Version string to validate
     * @returns {boolean} Whether the version is valid
     */
    isValidVersion(version) {
      if (!version || typeof version !== 'string') {
        return false;
      }
      return semver.valid(version) !== null;
    },

    /**
     * Get the latest version from a range (e.g., "^1.2.3" -> "1.2.3")
     * @param {string} versionRange - Version range string
     * @returns {string|null} Clean version or null if invalid
     */
    cleanVersionRange(versionRange) {
      if (!versionRange || typeof versionRange !== 'string') {
        return null;
      }

      // Handle range prefixes
      const cleaned = versionRange.replace(/^[\^~>=<]+/, '');
      return semver.clean(cleaned);
    },

    /**
     * Check if an update is available for a package
     * @param {string} packageName - Name of the package
     * @param {string} currentVersion - Current installed version
     * @param {string} [cwd=process.cwd()] - Working directory
     * @returns {Promise<Object>} Update availability information
     */
    async checkForUpdates(packageName, currentVersion, cwd = process.cwd()) {
      try {
        // This would typically involve checking npm registry
        // For now, we'll implement a basic version comparison
        // In a real implementation, you'd use npm API or similar
        
        const result = {
          packageName,
          currentVersion,
          hasUpdate: false,
          latestVersion: null,
          updateType: null // major, minor, patch
        };

        // Placeholder for actual npm registry check
        // This would be implemented with actual package manager calls
        logger.info(`Checking for updates for ${packageName}@${currentVersion}`);
        
        return result;
      } catch (error) {
        logger.error(`Error checking updates for ${packageName}: ${error.message}`);
        return {
          packageName,
          currentVersion,
          hasUpdate: false,
          latestVersion: null,
          updateType: null,
          error: error.message
        };
      }
    },

    /**
     * Get known compatibility issues
     * @returns {Array<Object>} Array of known compatibility issues
     */
    getKnownCompatibilityIssues() {
      return [...COMPATIBILITY_ISSUES];
    },

    /**
     * Get minimum version requirements
     * @returns {Object} Object with minimum version requirements
     */
    getMinimumVersionRequirements() {
      return { ...MINIMUM_VERSIONS };
    },

    /**
     * Validate Node.js compatibility for a project
     * @param {string} nodeVersion - Node.js version to check
     * @param {string} [requiredVersion] - Required Node.js version
     * @returns {Object} Node.js compatibility result
     */
    validateNodeCompatibility(nodeVersion, requiredVersion) {
      const minNodeVersion = requiredVersion || MINIMUM_VERSIONS.node;
      return this.checkMinimumVersion('node', nodeVersion, minNodeVersion);
    }
  };
}