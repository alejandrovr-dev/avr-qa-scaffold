/**
 * @module src/services/packageService.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Core business logic for package management operations
 * Handles package name/version extraction, dependency management, and package.json operations
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-24
 * @lastModified 2025-05-24
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Standard scripts to be added to package.json for quality system
 * @constant {Object}
 * @private
 */
const STANDARD_SCRIPTS = {
  lint: 'eslint --ignore-path .gitignore --ext .js .',
  'lint:fix': 'eslint --ignore-path .gitignore --ext .js . --fix',
  format: 'prettier --ignore-path .gitignore --write "**/*.{js,json,md}"',
  commit: 'cz',
  prepare: 'husky',

  // Testing scripts
  test: 'node --experimental-vm-modules node_modules/jest/bin/jest.js',
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
  'test:coverage': 'node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage',
};

/**
 * Commitizen configuration for package.json
 * @constant {Object}
 * @private
 */
const COMMITIZEN_CONFIG = {
  config: {
    commitizen: {
      path: './node_modules/cz-conventional-changelog',
    },
  },
};

/**
 * Creates a package service for managing packages and dependencies
 * @param {Object} dependencies - Dependencies for the service
 * @param {import('../ports/output/packageManagerPort.js').PackageManagerPort} dependencies.packageManager - Package manager adapter
 * @param {import('../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger adapter
 * @returns {Object} Package service instance
 */
export function createPackageService({ packageManager, logger }) {
  return {
    /**
     * Extract package name from dependency string
     * @param {string} dependency - Dependency string (e.g. 'package@1.0.0' or '@org/package@1.0.0')
     * @returns {string} Package name without version
     */
    extractPackageName(dependency) {
      if (!dependency || typeof dependency !== 'string') {
        return '';
      }

      // Handle scoped packages like @org/package
      if (dependency.startsWith('@')) {
        const scopedParts = dependency.split('@', 3); // ['', 'org/package', 'version'] or ['', 'org/package']

        if (scopedParts.length === 3) {
          // It has a version: @org/package@1.0.0
          const [, scopedName] = scopedParts;
          return `@${scopedName}`;
        }

        // No version: @org/package
        return dependency;
      }

      // Handle regular packages: package@1.0.0 -> package
      return dependency.split('@')[0];
    },

    /**
     * Extract version from dependency string
     * @param {string} dependency - Dependency string (e.g. 'package@1.0.0')
     * @returns {string|null} Version string or null if not specified
     */
    extractPackageVersion(dependency) {
      if (!dependency || typeof dependency !== 'string') {
        return null;
      }

      // Handle scoped packages like @org/package
      if (dependency.startsWith('@')) {
        const scopedParts = dependency.split('@', 3); // ['', 'org/package', 'version'] or ['', 'org/package']

        if (scopedParts.length === 3) {
          // It has a version: @org/package@1.0.0
          const [, , version] = scopedParts;
          return version;
        }

        // No version: @org/package
        return null;
      }

      // Handle regular packages
      const parts = dependency.split('@');

      if (parts.length >= 2) {
        return parts[1];
      }

      return null;
    },

    /**
     * Check if packages are installed in the project
     * @param {string[]} packages - Array of package names to check
     * @param {string} [cwd=process.cwd()] - Working directory
     * @returns {Promise<Object>} Object with package names as keys and boolean installation status as values
     */
    async checkPackagesInstalled(packages, cwd = process.cwd()) {
      if (!Array.isArray(packages)) {
        return {};
      }

      const results = {};

      for (const pkg of packages) {
        const packageName = this.extractPackageName(pkg);
        try {
          results[packageName] = await packageManager.isInstalled(packageName, cwd);
        } catch (error) {
          logger.error(`Error checking if ${packageName} is installed: ${error.message}`);
          results[packageName] = false;
        }
      }

      return results;
    },

    /**
     * Install missing packages from a list
     * @param {string[]} packages - Array of packages to install
     * @param {Object} options - Installation options
     * @param {boolean} [options.dev=true] - Install as dev dependencies
     * @param {string} [options.cwd=process.cwd()] - Working directory
     * @param {boolean} [options.verbose=false] - Show verbose output
     * @returns {Promise<Object>} Installation results with success status and installed packages
     */
    async installMissingPackages(packages, options = {}) {
      const { dev = true, cwd = process.cwd(), verbose = false } = options;

      if (!Array.isArray(packages) || packages.length === 0) {
        return { success: true, installed: [], skipped: [] };
      }

      try {
        // Check which packages are already installed
        const installationStatus = await this.checkPackagesInstalled(packages, cwd);
        const packagesToInstall = packages.filter(pkg => {
          const packageName = this.extractPackageName(pkg);
          return !installationStatus[packageName];
        });
        const alreadyInstalled = packages.filter(pkg => {
          const packageName = this.extractPackageName(pkg);
          return installationStatus[packageName];
        });

        if (verbose && alreadyInstalled.length > 0) {
          logger.info(`Already installed: ${alreadyInstalled.map(pkg => this.extractPackageName(pkg)).join(', ')}`);
        }

        if (packagesToInstall.length === 0) {
          logger.info('All packages are already installed');
          return { success: true, installed: [], skipped: alreadyInstalled };
        }

        // Install missing packages
        logger.info(`Installing ${packagesToInstall.length} missing packages...`);
        
        const installResult = dev 
          ? await packageManager.installDev(packagesToInstall)
          : await packageManager.install(packagesToInstall);

        if (installResult) {
          logger.info('Package installation completed successfully');
          return { 
            success: true, 
            installed: packagesToInstall, 
            skipped: alreadyInstalled 
          };
        } else {
          throw new Error('Package installation failed');
        }
      } catch (error) {
        logger.error(`Failed to install packages: ${error.message}`);
        return { success: false, installed: [], skipped: [], error: error.message };
      }
    },

    /**
     * Get standard quality system scripts
     * @returns {Object} Object containing standard npm scripts
     */
    getStandardScripts() {
      return { ...STANDARD_SCRIPTS };
    },

    /**
     * Get commitizen configuration
     * @returns {Object} Commitizen configuration object
     */
    getCommitizenConfig() {
      return { ...COMMITIZEN_CONFIG };
    },

    /**
     * Merge package.json configurations
     * @param {Object} target - Target package.json object
     * @param {Object} source - Source configuration to merge
     * @returns {Object} Merged configuration
     */
    mergePackageJsonConfig(target, source) {
      if (!target || typeof target !== 'object') {
        return { ...source };
      }

      if (!source || typeof source !== 'object') {
        return { ...target };
      }

      const result = { ...target };

      for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // If the value is an object, recursively merge
          if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
            result[key] = this.mergePackageJsonConfig(result[key], value);
          } else {
            result[key] = { ...value };
          }
        } else {
          // For primitives and arrays, simply replace
          result[key] = value;
        }
      }

      return result;
    },

    /**
     * Create package.json configuration for quality system
     * @param {Object} existingPackageJson - Existing package.json content
     * @param {Object} options - Configuration options
     * @param {boolean} [options.includeScripts=true] - Include standard scripts
     * @param {boolean} [options.includeCommitizen=true] - Include commitizen config
     * @returns {Object} Updated package.json configuration
     */
    createQualitySystemConfig(existingPackageJson = {}, options = {}) {
      const { includeScripts = true, includeCommitizen = true } = options;

      let config = { ...existingPackageJson };

      // Add standard scripts
      if (includeScripts) {
        const scriptsToAdd = this.getStandardScripts();
        config = this.mergePackageJsonConfig(config, { scripts: scriptsToAdd });
      }

      // Add commitizen configuration
      if (includeCommitizen) {
        const commitizenConfig = this.getCommitizenConfig();
        config = this.mergePackageJsonConfig(config, commitizenConfig);
      }

      return config;
    },

    /**
     * Validate package name format
     * @param {string} packageName - Package name to validate
     * @returns {boolean} Whether the package name is valid
     */
    isValidPackageName(packageName) {
      if (!packageName || typeof packageName !== 'string') {
        return false;
      }

      // Basic npm package name validation
      // Allows: lowercase letters, numbers, hyphens, underscores, dots, and scoped packages
      const packageNameRegex = /^(@[a-z0-9-_]+\/)?[a-z0-9-_.]+$/;
      return packageNameRegex.test(packageName);
    },

    /**
     * Parse dependency list and extract package information
     * @param {string[]} dependencies - Array of dependency strings
     * @returns {Object[]} Array of parsed dependency objects
     */
    parseDependencies(dependencies) {
      if (!Array.isArray(dependencies)) {
        return [];
      }

      return dependencies.map(dep => ({
        original: dep,
        name: this.extractPackageName(dep),
        version: this.extractPackageVersion(dep),
        isValid: this.isValidPackageName(this.extractPackageName(dep))
      })).filter(dep => dep.isValid);
    },

    /**
     * Get package versions for installed packages
     * @param {string[]} packageNames - Array of package names
     * @param {string} [cwd=process.cwd()] - Working directory
     * @returns {Promise<Object>} Object with package names as keys and versions as values
     */
    async getPackageVersions(packageNames, cwd = process.cwd()) {
      if (!Array.isArray(packageNames)) {
        return {};
      }

      const versions = {};

      for (const packageName of packageNames) {
        try {
          const version = await packageManager.getInstalledVersion(packageName, cwd);
          versions[packageName] = version;
        } catch (error) {
          logger.error(`Error getting version for ${packageName}: ${error.message}`);
          versions[packageName] = null;
        }
      }

      return versions;
    }
  };
}