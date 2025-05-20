/**
 * @module src/ports/cliPort.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Interface for CLI functionality
 * Defines the contract that any CLI adapter must respect
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Contract definition
 * @typedef {Object} CLIPort
 * @property {function(): void} printAvailableCommands - Print available commands
 * @property {function(): void} printProjectTypes - Print project types
 */

/**
 * Validates that an object implements the CLIPort interface
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if the object implements CLIPort
 */
export function isCLI(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.printAvailableCommands === 'function' &&
    typeof obj.printProjectTypes === 'function'
  );
}

/**
 * Creates a null CLI interface that does nothing when called
 * @returns {CLIPort} A CLI interface that does nothing
 */
export function createNullCLI() {
  return {
    printAvailableCommands: () => {},
    printProjectTypes: () => {},
  };
}