/**
 * @module src/ports/output/gitPort.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Interface for Git operations
 * Defines the contract that any Git adapter must respect
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-25
 * @lastModified 2025-05-25
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Contract definition
 * @typedef {Object} GitPort
 * @property {function(string=): Promise<boolean>} isRepository - Check if directory is a Git repository
 * @property {function(string=): Promise<boolean>} init - Initialize a Git repository
 */

/**
 * Validates that an object implements the GitPort interface
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if the object implements GitPort
 */
export function isGit(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.isRepository === 'function' &&
    typeof obj.init === 'function'
  );
}

/**
 * Creates a null Git interface that returns default values
 * @returns {GitPort} A Git interface that does nothing
 */
export function createNullGit() {
  return {
    isRepository: async () => false,
    init: async () => true,
  };
}