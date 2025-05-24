/**
 * @module src/adapters/output/logger/consoleAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Console implementation of the LoggerPort
 * Following the contract that logger.port defines
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-18
 * @lastModified 2025-05-18
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import chalk from 'chalk';
import figures from 'figures';
import { isLogger } from '../../../ports/output/loggerPort.js';

/**
 * Creates a logger that outputs to the console
 * @returns {import('../../../ports/loggerPort.js').LoggerPort} A console logger
 */
export function createConsoleLogger() {
  const logger = {
    /**
     * Log a success message
     * @param {string} message - Message to log
     */
    success(message) {
      console.log(chalk.green(`${figures.tick} ${message}`));
    },

    /**
     * Log an informational message
     * @param {string} message - Message to log
     */
    info(message) {
      console.log(chalk.blue(`${figures.info} ${message}`));
    },

    /**
     * Log a warning message
     * @param {string} message - Message to log
     */
    warning(message) {
      console.log(chalk.yellow(`${figures.warning} ${message}`));
    },

    /**
     * Log an error message
     * @param {string} message - Message to log
     */
    error(message) {
      console.log(chalk.red(`${figures.cross} ${message}`));
    },

    /**
     * Show a formatted header in the console
     * @param {string} title - Header title
     * @param {string} [color='blue'] - Color to use (blue, green, yellow, red)
     */
    showHeader(title, color = 'blue') {
      const colorFunction =
        {
          blue: chalk.blue.bold,
          green: chalk.green.bold,
          yellow: chalk.yellow.bold,
          red: chalk.red.bold,
        }[color] || chalk.blue.bold;

      const line = '='.repeat(title.length + 4);
      console.log('\n' + colorFunction(line));
      console.log(colorFunction(`  ${title}  `));
      console.log(colorFunction(line) + '\n');
    },
  };

  // Verify that this implementation satisfies the interface
  if (!isLogger(logger)) {
    throw new Error('Console logger does not implement LoggerPort correctly');
  }

  return logger;
}
