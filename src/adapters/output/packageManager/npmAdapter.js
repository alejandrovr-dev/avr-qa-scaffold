/**
 * @module src/adapters/output/packageManager/npmAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * NPM implementation of the PackageManagerPort
 * Provides operations for managing Node.js packages using npm
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-20
 * @lastModified 2025-05-20
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { execa } from 'execa';
import path from 'path';
import { promises as fs } from 'fs';
import { isPackageManager } from '../../../ports/output/packageManagerPort.js';

/**
 * Creates a package manager interface using npm
 * @param {Object} dependencies - Dependencies for the adapter
 * @param {import('../../ports/loggerPort.js').LoggerPort} dependencies.logger - Logger to use
 * @param {import('../../ports/fileSystemPort.js').FileSystemPort} dependencies.fileSystem - FileSystem to use
 * @returns {import('../../ports/packageManagerPort.js').PackageManagerPort} An npm package manager
 */
export function createNpmPackageManager({ logger, fileSystem }) {
  const packageManager = {
    /**
     * Check if a package is installed
     * @param {string} packageName - Name of the package to check
     * @param {string} [cwd=process.cwd()] - Directory to check in
     * @returns {Promise<boolean>} Whether the package is installed
     */
    async isInstalled(packageName, cwd = process.cwd()) {
      try {
        const packageJsonPath = path.join(cwd, 'package.json');
        const packageLockPath = path.join(cwd, 'package-lock.json');
        const nodeModulesPath = path.join(cwd, 'node_modules', packageName);

        // Check if package.json exists
        if (!await fileSystem.fileExists(packageJsonPath)) {
          return false;
        }

        // Parse package.json
        const packageJson = await this.readPackageJson(packageJsonPath);

        // Check in dependencies and devDependencies
        const isDependency = packageName in (packageJson.dependencies || {});
        const isDevDependency = packageName in (packageJson.devDependencies || {});

        if (!isDependency && !isDevDependency) {
          return false;
        }

        // Check if package is actually installed in node_modules
        return await fileSystem.fileExists(nodeModulesPath);
      } catch (error) {
        logger.error(`Error checking if ${packageName} is installed: ${error.message}`);
        return false;
      }
    },

    /**
     * Install multiple packages
     * @param {string[]} packages - Packages to install
     * @param {string} [cwd=process.cwd()] - Directory to install in
     * @returns {Promise<boolean>} Whether the installation was successful
     */
    async install(packages, cwd = process.cwd()) {
      if (!packages || !packages.length) {
        return true; // Nothing to install
      }

      try {
        logger.info(`Installing packages: ${packages.join(', ')}`);

        await execa('npm', ['install', '--save', ...packages], {
          cwd,
          stdio: 'pipe', // Capture output
        });

        logger.success('Packages installed successfully');
        return true;
      } catch (error) {
        logger.error(`Failed to install packages: ${error.message}`);
        return false;
      }
    },

    /**
     * Install multiple packages as dev dependencies
     * @param {string[]} packages - Packages to install
     * @param {string} [cwd=process.cwd()] - Directory to install in
     * @returns {Promise<boolean>} Whether the installation was successful
     */
    async installDev(packages, cwd = process.cwd()) {
      if (!packages || !packages.length) {
        return true; // Nothing to install
      }

      try {
        logger.info(`Installing dev packages: ${packages.join(', ')}`);

        await execa('npm', ['install', '--save-dev', ...packages], {
          cwd,
          stdio: 'pipe', // Capture output
        });

        logger.success('Dev packages installed successfully');
        return true;
      } catch (error) {
        logger.error(`Failed to install dev packages: ${error.message}`);
        return false;
      }
    },

    /**
     * Read and parse package.json file
     * @param {string} filePath - Path to package.json
     * @param {string} [cwd=process.cwd()] - Working directory
     * @returns {Promise<Object>} Parsed package.json content
     */
    async readPackageJson(filePath, cwd = process.cwd()) {
      try {
        const packagePath = path.isAbsolute(filePath) 
          ? filePath 
          : path.resolve(cwd, filePath);

        const content = await fs.readFile(packagePath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        logger.error(`Error reading package.json: ${error.message}`);
        return {};
      }
    },

    /**
     * Write package.json file
     * @param {string} filePath - Path to package.json
     * @param {Object} content - Content to write
     * @param {string} [cwd=process.cwd()] - Working directory
     * @returns {Promise<boolean>} Whether the write was successful
     */
    async writePackageJson(filePath, content, cwd = process.cwd()) {
      try {
        const packagePath = path.isAbsolute(filePath) 
          ? filePath 
          : path.resolve(cwd, filePath);

        const formatted = JSON.stringify(content, null, 2);
        await fs.writeFile(packagePath, formatted, 'utf8');
        return true;
      } catch (error) {
        logger.error(`Error writing package.json: ${error.message}`);
        return false;
      }
    },

    /**
     * Get installed version of a package
     * @param {string} packageName - Name of the package
     * @param {string} [cwd=process.cwd()] - Directory to check in
     * @returns {Promise<string|null>} Installed version or null if not installed
     */
    async getInstalledVersion(packageName, cwd = process.cwd()) {
      try {
        // Check if package is installed
        if (!await this.isInstalled(packageName, cwd)) {
          return null;
        }

        // Try to read the version from package.json in node_modules
        const packageJsonPath = path.join(cwd, 'node_modules', packageName, 'package.json');

        if (await fileSystem.fileExists(packageJsonPath)) {
          const packageJson = await this.readPackageJson(packageJsonPath);
          return packageJson.version || null;
        }

        // Fallback: try to get the version from the main package.json
        const mainPackageJsonPath = path.join(cwd, 'package.json');
        const mainPackageJson = await this.readPackageJson(mainPackageJsonPath);

        if (mainPackageJson.dependencies && mainPackageJson.dependencies[packageName]) {
          return mainPackageJson.dependencies[packageName].replace(/^\^|~/, '');
        }

        if (mainPackageJson.devDependencies && mainPackageJson.devDependencies[packageName]) {
          return mainPackageJson.devDependencies[packageName].replace(/^\^|~/, '');
        }

        return null;
      } catch (error) {
        logger.error(`Error getting installed version of ${packageName}: ${error.message}`);
        return null;
      }
    },
  };

  // Verify that this implementation satisfies the interface
  if (!isPackageManager(packageManager)) {
    throw new Error('Npm package manager adapter does not implement PackageManagerPort correctly');
  }

  return packageManager;
}