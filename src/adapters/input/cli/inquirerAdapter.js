/**
 * @module src/adapters/input/cli/inquirerAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Inquirer.js implementation of the CLICommandsPort for interactive prompts
 * Provides interactive command line prompts and confirmations using Inquirer.js
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import inquirer from 'inquirer';
import { isCLICommands } from '../../../ports/input/cliCommandsPort.js';

/**
 * Creates a CLI commands interface using Inquirer.js for interactive prompts
 * @param {Object} dependencies - Dependencies for the adapter
 * @param {import('../../../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger to use
 * @returns {import('../../../ports/input/cliCommandsPort.js').CLICommandsPort} An Inquirer CLI commands interface
 */
export function createInquirerAdapter({ logger }) {
  const inquirerAdapter = {
    /**
     * Parse command line arguments (simple implementation for interactive mode)
     * @param {string[]} args - Command line arguments (typically process.argv)
     * @returns {import('../../../ports/input/cliCommandsPort.js').CommandArgs} Parsed command arguments
     */
    parseArguments(args) {
      // Simple implementation - inquirer is mainly for interactive prompts
      // Real parsing should be done by Commander adapter
      return {
        command: 'interactive',
        positional: args.slice(2), // Remove 'node' and script name
        options: {}
      };
    },

    /**
     * Execute a command in interactive mode
     * @param {import('../../../ports/input/cliCommandsPort.js').CommandArgs} commandArgs - Parsed command arguments
     * @returns {Promise<void>} Execution result
     */
    async executeCommand(commandArgs) {
      try {
        logger.info('Starting interactive mode...');
        
        // This is a placeholder - actual execution will be handled by application layer
        // The inquirer adapter focuses on prompts and user interaction
        const responses = await this.prompt();
        
        logger.info('Interactive session completed');
        return responses;
      } catch (error) {
        logger.error(`Error in interactive mode: ${error.message}`);
        throw error;
      }
    },

    /**
     * Display interactive prompts to gather user input
     * @returns {Promise<Object>} User responses
     */
    async prompt() {
      try {
        const questions = [
          {
            type: 'list',
            name: 'projectType',
            message: 'What type of project are you setting up?',
            choices: [
              { name: 'Node.js application or library', value: 'node' },
              { name: 'React application', value: 'react' },
              { name: 'Next.js application', value: 'next' }
            ],
            default: 'node'
          },
          {
            type: 'confirm',
            name: 'includeTests',
            message: 'Include test configuration?',
            default: true
          },
          {
            type: 'confirm',
            name: 'includeHusky',
            message: 'Set up Git hooks with Husky?',
            default: true
          },
          {
            type: 'confirm',
            name: 'includeCommitizen',
            message: 'Set up Commitizen for standardized commit messages?',
            default: true
          },
          {
            type: 'confirm',
            name: 'overrideExisting',
            message: 'Override existing configuration files?',
            default: false,
            when: (answers) => {
              // This would typically check for existing files
              // For now, always ask
              return true;
            }
          }
        ];

        const answers = await inquirer.prompt(questions);
        
        logger.info('User preferences collected successfully');
        return answers;
      } catch (error) {
        logger.error(`Error during prompts: ${error.message}`);
        return {};
      }
    },

    /**
     * Ask for user confirmation
     * @param {string} message - Confirmation message
     * @returns {Promise<boolean>} User confirmation
     */
    async confirmAction(message) {
      try {
        const question = {
          type: 'confirm',
          name: 'confirmed',
          message: message,
          default: false
        };

        const answer = await inquirer.prompt([question]);
        return answer.confirmed;
      } catch (error) {
        logger.error(`Error during confirmation: ${error.message}`);
        return false;
      }
    },

    /**
     * Prompt for project initialization details
     * @param {string} [defaultDirectory] - Default directory name
     * @returns {Promise<Object>} Project initialization details
     */
    async promptProjectInit(defaultDirectory = 'my-project') {
      try {
        const questions = [
          {
            type: 'input',
            name: 'directory',
            message: 'Project directory name:',
            default: defaultDirectory,
            validate: (input) => {
              if (!input || input.trim().length === 0) {
                return 'Directory name cannot be empty';
              }
              if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                return 'Directory name can only contain letters, numbers, hyphens, and underscores';
              }
              return true;
            }
          },
          {
            type: 'list',
            name: 'projectType',
            message: 'Project type:',
            choices: [
              { name: 'Node.js application or library', value: 'node' },
              { name: 'React application', value: 'react' },
              { name: 'Next.js application', value: 'next' }
            ],
            default: 'node'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Project description (optional):',
            default: ''
          },
          {
            type: 'input',
            name: 'author',
            message: 'Author name (optional):',
            default: ''
          }
        ];

        const answers = await inquirer.prompt(questions);

        logger.info('Project initialization details collected');
        return answers;
      } catch (error) {
        logger.error(`Error during project init prompts: ${error.message}`);
        return {
          directory: defaultDirectory,
          projectType: 'node',
          description: '',
          author: ''
        };
      }
    }
  };

  // Verify that this implementation satisfies the interface
  if (!isCLICommands(inquirerAdapter)) {
    throw new Error('Inquirer adapter does not implement CLICommandsPort correctly');
  }

  return inquirerAdapter;
}