/**
 * @module src/ports/input/cliCommandsPort.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Interface for CLI command parsing and execution
 * Defines the contract that any CLI commands adapter must respect
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Command arguments object
 * @typedef {Object} CommandArgs
 * @property {string} command - Main command
 * @property {string[]} positional - Positional arguments
 * @property {Object} options - Named options
 */

/**
 * Contract definition
 * @typedef {Object} CLICommandsPort
 * @property {function(string[]): CommandArgs} parseArguments - Parse command line arguments
 * @property {function(CommandArgs): Promise<void>} executeCommand - Execute a command
 * @property {function(): Promise<Object>} prompt - Display interactive prompts and get user input
 * @property {function(string): Promise<boolean>} confirmAction - Ask for user confirmation
 */

/**
 * Validates that an object implements the CLICommandsPort interface
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if the object implements CLICommandsPort
 */
export function isCLICommands(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.parseArguments === 'function' &&
    typeof obj.executeCommand === 'function' &&
    typeof obj.prompt === 'function' &&
    typeof obj.confirmAction === 'function'
  );
}

/**
 * Creates a null CLI commands object that returns default values
 * @returns {CLICommandsPort} A CLI commands object that does nothing
 */
export function createNullCLICommands() {
  return {
    parseArguments: () => ({ command: '', positional: [], options: {} }),
    executeCommand: async () => {},
    prompt: async () => ({}),
    confirmAction: async () => false,
  };
}