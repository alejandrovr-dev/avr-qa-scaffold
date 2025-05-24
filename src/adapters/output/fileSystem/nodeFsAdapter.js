/**
 * @module src/adapters/output/fileSystem/nodeFsAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Node.js filesystem implementation of the FileSystemPort
 * Provides access to the local filesystem using Node.js fs module
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';
import { isFileSystem } from '../../../ports/output/fileSystemPort.js';

// Get current directory info for package root calculations
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates a file system interface using Node.js fs module
 * @returns {import('../../../ports/output/fileSystemPort.js').FileSystemPort} A Node.js filesystem
 */
export function createNodeFileSystem() {
  const fileSystem = {
    /**
     * Create directory if it doesn't exist
     * @param {string} dirPath - Path to the directory
     * @returns {Promise<boolean>} Whether directory was created
     */
    async createDirIfNotExists(dirPath) {
      try {
        await fs.mkdir(dirPath, { recursive: true });
        return true;
      } catch (error) {
        if (error.code === 'EEXIST') {
          return false; // Directory already exists
        }
        throw error;
      }
    },

    /**
     * Check if a file exists
     * @param {string} filePath - Path to the file
     * @returns {Promise<boolean>} Whether the file exists
     */
    async fileExists(filePath) {
      try {
        await fs.access(filePath);
        return true;
      } catch (error) {
        return false;
      }
    },

    /**
     * Get absolute path from a relative path
     * @param {string} relativePath - Relative path
     * @returns {string} Absolute path
     */
    getAbsolutePath(relativePath) {
      return path.resolve(process.cwd(), relativePath);
    },

    /**
     * Format a file path for display (makes it relative if possible)
     * @param {string} filePath - Path to format
     * @returns {string} Formatted path
     */
    formatPath(filePath) {
      const cwd = process.cwd();

      if (filePath.startsWith(cwd)) {
        return filePath.substring(cwd.length + 1);
      }

      return filePath;
    },

    /**
     * Get the root directory of the package
     * @returns {string} Root directory
     */
    getPackageRoot() {
      // Navigate up to the package root:
      // src/adapters/output/fileSystem -> src/adapters/output -> src -> root
      return path.join(dirname(dirname(dirname(dirname(__dirname)))));
    },
  };

  // Verify that this implementation satisfies the interface
  if (!isFileSystem(fileSystem)) {
    throw new Error('Node filesystem adapter does not implement FileSystemPort correctly');
  }

  return fileSystem;
}