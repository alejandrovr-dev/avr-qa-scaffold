/**
 * @module src/ports/output/packageManagerPort.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Interface for package manager operations
 * Defines the contract that any package manager adapter must respect
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Contract definition
 * @typedef {Object} PackageManagerPort
 * @property {function(string): Promise<boolean>} isInstalled - Check if a package is installed
 * @property {function(string[]): Promise<boolean>} install - Install multiple packages
 * @property {function(string[]): Promise<boolean>} installDev - Install multiple packages as dev dependencies
 * @property {function(string, string=): Promise<Object>} readPackageJson - Read and parse package.json file
 * @property {function(string, Object): Promise<boolean>} writePackageJson - Write package.json file
 * @property {function(string): Promise<string|null>} getInstalledVersion - Get installed version of a package
 */

/**
 * Validates that an object implements the PackageManagerPort interface
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if the object implements PackageManagerPort
 */
export function isPackageManager(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.isInstalled === 'function' &&
    typeof obj.install === 'function' &&
    typeof obj.installDev === 'function' &&
    typeof obj.readPackageJson === 'function' &&
    typeof obj.writePackageJson === 'function' &&
    typeof obj.getInstalledVersion === 'function'
  );
}

/**
 * Creates a null package manager that returns default values
 * @returns {PackageManagerPort} A package manager that does nothing
 */
export function createNullPackageManager() {
  return {
    isInstalled: async () => false,
    install: async () => true,
    installDev: async () => true,
    readPackageJson: async () => ({}),
    writePackageJson: async () => true,
    getInstalledVersion: async () => null,
  };
}