/**
 * @module src/ports/output/fileSystemPort.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Interface for file system operations
 * Defines the contract that any file system adapter must respect
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Contract definition
 * @typedef {Object} FileSystemPort
 * @property {function(string): Promise<boolean>} createDirIfNotExists - Create directory if it doesn't exist
 * @property {function(string): Promise<boolean>} fileExists - Check if a file exists
 * @property {function(string): string} getAbsolutePath - Get absolute path from a relative path
 * @property {function(string): string} formatPath - Format a file path for display
 * @property {function(): string} getPackageRoot - Get the root directory of the package
 */

/**
 * Validates that an object implements the FileSystemPort interface
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if the object implements FileSystemPort
 */
export function isFileSystem(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.createDirIfNotExists === 'function' &&
    typeof obj.fileExists === 'function' &&
    typeof obj.getAbsolutePath === 'function' &&
    typeof obj.formatPath === 'function' &&
    typeof obj.getPackageRoot === 'function'
  );
}

/**
 * Creates a null file system that returns default values
 * @returns {FileSystemPort} A file system that does nothing
 */
export function createNullFileSystem() {
  return {
    createDirIfNotExists: async () => false,
    fileExists: async () => false,
    getAbsolutePath: (path) => path,
    formatPath: (path) => path,
    getPackageRoot: () => '',
  };
}