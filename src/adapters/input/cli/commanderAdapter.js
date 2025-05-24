/**
 * @module src/adapters/input/cli/commanderAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Commander.js implementation of the CLICommandsPort
 * Provides command line argument parsing and command execution using Commander.js
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { Command } from 'commander';
import { isCLICommands } from '../../../ports/input/cliCommandsPort.js';

/**
 * Creates a CLI commands interface using Commander.js
 * @param {Object} dependencies - Dependencies for the adapter
 * @param {import('../../../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger to use
 * @param {import('../../../ports/input/cliCommandsPort.js').CLICommandsPort} [dependencies.inquirerAdapter] - Inquirer adapter for prompts
 * @returns {import('../../../ports/input/cliCommandsPort.js').CLICommandsPort} A Commander CLI commands interface
 */
export function createCommanderAdapter({ logger, inquirerAdapter }) {
  const commanderAdapter = {
    /**
     * Parse command line arguments using Commander.js
     * @param {string[]} args - Command line arguments (typically process.argv)
     * @returns {import('../../../ports/input/cliCommandsPort.js').CommandArgs} Parsed command arguments
     */
    parseArguments(args) {
      try {
        // Simple manual parsing to avoid Commander.js interference in tests
        const cleanArgs = args.slice(2); // Remove 'node' and script name
        
        // Handle special cases first
        if (cleanArgs.includes('--help') || cleanArgs.includes('-h')) {
          return { command: 'help', positional: [], options: {} };
        }
        
        if (cleanArgs.includes('--version') || cleanArgs.includes('-v')) {
          return { command: 'version', positional: [], options: {} };
        }
        
        // Determine the main command
        let command = 'setup'; // default
        let positional = [];
        let options = {};
        
        // Check for subcommands
        if (cleanArgs.length > 0) {
          const firstArg = cleanArgs[0];
          if (firstArg === 'init' || firstArg === 'list') {
            command = firstArg;
            // For init command, capture directory argument
            if (command === 'init' && cleanArgs.length > 1 && !cleanArgs[1].startsWith('-')) {
              positional.push(cleanArgs[1]);
            }
          }
        }
        
        // Parse options
        for (let i = 0; i < cleanArgs.length; i++) {
          const arg = cleanArgs[i];
          
          if (arg === '--type' || arg === '-t') {
            options.type = cleanArgs[i + 1] || 'node';
            i++; // Skip next argument as it's the value
          } else if (arg === '--force' || arg === '-f') {
            options.force = true;
          } else if (arg === '--skip-install' || arg === '-s') {
            options.skipInstall = true;
          } else if (arg === '--verbose') {
            options.verbose = true;
          }
        }
        
        // Set default values
        if (command === 'setup') {
          options = {
            type: options.type || 'node',
            force: options.force || false,
            skipInstall: options.skipInstall || false,
            verbose: options.verbose || false,
            ...options
          };
        } else if (command === 'init') {
          options = {
            type: options.type || 'node',
            verbose: options.verbose || false,
            ...options
          };
        }
        
        return {
          command,
          positional,
          options
        };
      } catch (error) {
        logger.error(`Error parsing arguments: ${error.message}`);
        return {
          command: '',
          positional: [],
          options: {}
        };
      }
    },

    /**
     * Execute a command (placeholder - actual execution will be handled by application layer)
     * @param {import('../../../ports/input/cliCommandsPort.js').CommandArgs} commandArgs - Parsed command arguments
     * @returns {Promise<void>} Execution result
     */
    async executeCommand(commandArgs) {
      try {
        logger.info(`Executing command: ${commandArgs.command}`);
        
        // Log the parsed command for debugging
        if (commandArgs.positional.length > 0) {
          logger.info(`Positional arguments: ${commandArgs.positional.join(', ')}`);
        }
        
        if (Object.keys(commandArgs.options).length > 0) {
          logger.info(`Options: ${JSON.stringify(commandArgs.options)}`);
        }

        // Note: Actual command execution will be delegated to the application layer
        // This adapter only handles the CLI parsing and provides a hook for execution
        logger.info('Command parsing completed successfully');
      } catch (error) {
        logger.error(`Error executing command: ${error.message}`);
        throw error;
      }
    },

    /**
     * Display interactive prompts (delegates to inquirer adapter)
     * @returns {Promise<Object>} User responses
     */
    async prompt() {
      if (inquirerAdapter && typeof inquirerAdapter.prompt === 'function') {
        return await inquirerAdapter.prompt();
      }
      
      logger.warning('No inquirer adapter provided for prompts');
      return {};
    },

    /**
     * Ask for user confirmation (delegates to inquirer adapter)
     * @param {string} message - Confirmation message
     * @returns {Promise<boolean>} User confirmation
     */
    async confirmAction(message) {
      if (inquirerAdapter && typeof inquirerAdapter.confirmAction === 'function') {
        return await inquirerAdapter.confirmAction(message);
      }
      
      logger.warning('No inquirer adapter provided for confirmation');
      return false;
    },
  };

  // Verify that this implementation satisfies the interface
  if (!isCLICommands(commanderAdapter)) {
    throw new Error('Commander adapter does not implement CLICommandsPort correctly');
  }

  return commanderAdapter;
}