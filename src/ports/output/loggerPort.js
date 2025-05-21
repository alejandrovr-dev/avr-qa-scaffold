/**
 * @module src/ports/output/loggerPort.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Interface for logging functionality
 * Defines the contract that any logger adapter must respect
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-18
 * @lastModified 2025-05-18
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Contract definition
 * @typedef {Object} LoggerPort
 * @property {function(string): void} success - Log a success message
 * @property {function(string): void} info - Log an informational message
 * @property {function(string): void} warning - Log a warning message
 * @property {function(string): void} error - Log an error message
 * @property {function(string, string=): void} showHeader - Show a formatted header
 */

/**
 * Validates that an object implements the LoggerPort interface
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if the object implements LoggerPort
 */
export function isLogger(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.success === 'function' &&
    typeof obj.info === 'function' &&
    typeof obj.warning === 'function' &&
    typeof obj.error === 'function' &&
    typeof obj.showHeader === 'function'
  );
}

/**
 * Creates a null logger that does nothing when called
 * @returns {LoggerPort} A logger that does nothing
 */
export function createNullLogger() {
  return {
    success: () => {},
    info: () => {},
    warning: () => {},
    error: () => {},
    showHeader: () => {},
  };
}
