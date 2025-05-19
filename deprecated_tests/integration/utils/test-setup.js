/**
 * @module tests/integration/utils/test-setup.js
 * @version 0.1.0
 * @description Utility functions for integration tests
 * Provides common setup, teardown, and helper functions
 * 
 * @status READY
 * @createdAt 2025-05-14
 * @lastModified 2025-05-14
 * @author Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Create test environment with temporary directory and mocks
 * @returns {Object} Helper functions and mocks
 */
export async function setupTestEnvironment() {
  // Create mock functions
  const mockExecaCommand = jest.fn().mockResolvedValue({ stdout: '' });
  const mockIsPackageInstalled = jest.fn().mockResolvedValue(false);
  
  // Set up mocks for commonly used modules
  jest.unstable_mockModule('execa', () => ({
    execaCommand: mockExecaCommand
  }));
  
  jest.unstable_mockModule('../../src/package-modifier.js', () => ({
    isPackageInstalled: mockIsPackageInstalled,
    modifyPackageJson: jest.fn().mockResolvedValue(true),
    addScriptsToPackageJson: jest.fn().mockResolvedValue(true),
    addDevDependencies: jest.fn().mockResolvedValue(true),
    installDependencies: jest.fn().mockResolvedValue(true)
  }));
  
  // Local state for resource management
  let tempDir = null;
  const originalCwd = process.cwd();
  
  // Helper functions for tests
  return {
    // Mock functions that tests might want to configure
    mocks: {
      execaCommand: mockExecaCommand,
      isPackageInstalled: mockIsPackageInstalled
    },
    
    /**
     * Setup temporary test directory and change working directory
     * @returns {string} Path to temporary directory
     */
    async setupTempDir() {
      // Create temporary directory for testing
      tempDir = path.join(os.tmpdir(), `avr-qa-test-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      process.chdir(tempDir);
      return tempDir;
    },
    
    /**
     * Clean up temporary test directory and restore working directory
     */
    async cleanupTempDir() {
      // Restore original working directory
      process.chdir(originalCwd);
      
      // Clean up temporary directory
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          tempDir = null;
        } catch (error) {
          console.error(`Failed to clean up temp directory: ${error.message}`);
        }
      }
    },
    
    /**
     * Create sample package.json file
     * @param {Object} content - Content to include in package.json
     * @returns {Promise<void>}
     */
    async createPackageJson(content = {}) {
      const defaultContent = {
        name: 'test-project',
        version: '1.0.0'
      };
      
      const packageJson = {
        ...defaultContent,
        ...content
      };
      
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    },
    
    /**
     * Create config file with specified content
     * @param {string} filename - Name of the config file
     * @param {Object} content - Content to include in the file
     * @returns {Promise<void>}
     */
    async createConfigFile(filename, content) {
      await fs.writeFile(filename, JSON.stringify(content, null, 2));
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
     * Check if a directory exists
     * @param {string} dirPath - Path to the directory
     * @returns {Promise<boolean>} Whether the directory exists
     */
    async dirExists(dirPath) {
      try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
      } catch (error) {
        return false;
      }
    },
    
    /**
     * Read a JSON file and parse its contents
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise<Object>} Parsed JSON content
     */
    async readJsonFile(filePath) {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    },
    
    /**
     * Reset all mocks to their initial state
     */
    resetMocks() {
      jest.clearAllMocks();
    }
  };
}

/**
 * Load modules used in tests after setting up mocks
 * @returns {Promise<Object>} Imported modules
 */
export async function loadTestModules() {
  const { init, setup } = await import('../../src/index.js');
  
  return {
    init,
    setup
  };
}