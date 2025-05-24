/**
 * @module src/adapters/input/cli/cliDisplayAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * CLI display implementation of the CLIPort
 * Provides functions to display information to the console
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import chalk from 'chalk';
import { isCLI } from '../../../ports/input/cliPort.js';

/**
 * Creates a CLI display interface for showing information
 * @returns {import('../../../ports/input/cliPort.js').CLIPort} A CLI display interface
 */
export function createCLIDisplay() {
  const cliDisplay = {
    /**
     * Print available commands to the console
     */
    printAvailableCommands() {
      console.log(chalk.bold('\nAvailable Commands:'));
      console.log(
        `  ${chalk.cyan('avr-qa-scaffold')}                    - Set up quality tools in current project`,
      );
      console.log(`  ${chalk.cyan('avr-qa-scaffold --type react')}       - Set up for React project`);
      console.log(`  ${chalk.cyan('avr-qa-scaffold init my-project')}    - Create new Node.js project`);
      console.log(
        `  ${chalk.cyan('avr-qa-scaffold init my-app --type next')} - Create new Next.js project`,
      );
      console.log(
        `  ${chalk.cyan('avr-qa-scaffold list')}               - List available project types`,
      );
      console.log(`  ${chalk.cyan('avr-qa-scaffold --help')}             - Show help\n`);
    },

    /**
     * Print available project types to the console
     */
    printProjectTypes() {
      console.log(chalk.bold('\nAvailable Project Types:'));
      console.log(`  ${chalk.cyan('node')}  - Node.js application or library`);
      console.log(`  ${chalk.cyan('react')} - React application`);
      console.log(`  ${chalk.cyan('next')}  - Next.js application\n`);
    },
  };

  // Verify that this implementation satisfies the interface
  if (!isCLI(cliDisplay)) {
    throw new Error('CLI display adapter does not implement CLIPort correctly');
  }

  return cliDisplay;
}