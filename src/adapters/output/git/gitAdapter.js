/**
 * @module src/adapters/output/git/gitAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Git implementation using execa for command execution
 * Provides Git operations for the quality system setup
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-25
 * @lastModified 2025-05-25
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { execa } from 'execa';
import path from 'path';
import { isGit } from '../../../ports/output/gitPort.js';

/**
 * Creates a Git interface using execa for command execution
 * @param {Object} dependencies - Dependencies for the adapter
 * @param {import('../../../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger to use
 * @param {import('../../../ports/output/fileSystemPort.js').FileSystemPort} dependencies.fileSystem - FileSystem to use
 * @returns {import('../../../ports/output/gitPort.js').GitPort} A Git interface using execa
 */
export function createGitAdapter({ logger, fileSystem }) {
  const gitAdapter = {
    /**
     * Check if directory is a Git repository
     * @param {string} [cwd=process.cwd()] - Directory to check
     * @returns {Promise<boolean>} Whether the directory is a Git repository
     */
    async isRepository(cwd = process.cwd()) {
      try {
        const gitDir = path.join(cwd, '.git');
        return await fileSystem.fileExists(gitDir);
      } catch (error) {
        logger.error(`Error checking if ${cwd} is a Git repository: ${error.message}`);
        return false;
      }
    },

    /**
     * Initialize a Git repository
     * @param {string} [cwd=process.cwd()] - Directory to initialize repository in
     * @returns {Promise<boolean>} Whether the initialization was successful
     */
    async init(cwd = process.cwd()) {
      try {
        // Check if already a repository
        if (await this.isRepository(cwd)) {
          logger.info('Git repository already initialized');
          return true;
        }

        // Initialize the repository
        await execa('git', ['init'], {
          cwd,
          stdio: 'pipe'
        });

        logger.info('Git repository initialized successfully');
        return true;
      } catch (error) {
        logger.error(`Failed to initialize Git repository: ${error.message}`);
        return false;
      }
    },
  };

  // Verify that this implementation satisfies the interface
  if (!isGit(gitAdapter)) {
    throw new Error('Git adapter does not implement GitPort correctly');
  }

  return gitAdapter;
}