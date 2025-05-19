/**
 * @module tests/utils/test-utils.js
 * @version 0.1.0
 * @description Common utility functions for unit and integration tests
 * 
 * @status READY
 * @createdAt 2025-05-15
 * @lastModified 2025-05-15
 * @author Alejandro Valencia <dev@alejandrovr.com>
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory paths for project
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

/**
 * Creates a temporary directory for testing
 * @returns {Promise<string>} Path to the temporary directory
 */
export const createTempDir = async () => {
  const tempDir = path.join(os.tmpdir(), `avr-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
};

/**
 * Cleans up a temporary directory
 * @param {string} dirPath - Path to the directory to remove
 * @returns {Promise<void>}
 */
export const cleanupTempDir = async (dirPath) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to clean up temp directory: ${error.message}`);
  }
};

/**
 * Checks if a file exists in a directory
 * @param {string} dir - Base directory
 * @param {string} file - File name to check
 * @returns {Promise<boolean>} Whether the file exists
 */
export const fileExists = async (dir, file) => {
  try {
    await fs.access(path.join(dir, file));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Checks if a directory exists
 * @param {string} dir - Base directory
 * @param {string} subdir - Subdirectory name to check
 * @returns {Promise<boolean>} Whether the directory exists
 */
export const dirExists = async (dir, subdir) => {
  try {
    const stats = await fs.stat(path.join(dir, subdir));
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

/**
 * Reads a file and parses it as JSON
 * @param {string} dir - Base directory
 * @param {string} file - File name to read
 * @returns {Promise<Object>} Parsed JSON content
 */
export const readJsonFile = async (dir, file) => {
  const content = await fs.readFile(path.join(dir, file), 'utf8');
  return JSON.parse(content);
};

/**
 * Writes an object to a file as JSON
 * @param {string} dir - Base directory
 * @param {string} file - File name to write
 * @param {Object} data - Data to write
 * @param {number} [indent=2] - JSON indentation
 * @returns {Promise<void>}
 */
export const writeJsonFile = async (dir, file, data, indent = 2) => {
  await fs.writeFile(
    path.join(dir, file),
    JSON.stringify(data, null, indent)
  );
};

/**
 * Creates a basic package.json file in the specified directory
 * @param {string} dir - Directory to create the file in
 * @param {Object} [options] - Options
 * @param {string} [options.name='test-project'] - Project name
 * @param {string} [options.version='1.0.0'] - Project version
 * @param {Object} [options.scripts] - Scripts to include
 * @param {Object} [options.additionalFields] - Additional fields to include
 * @returns {Promise<Object>} The created package.json object
 */
export const createPackageJson = async (dir, options = {}) => {
  const {
    name = 'test-project',
    version = '1.0.0',
    scripts = {},
    additionalFields = {}
  } = options;

  const packageJson = {
    name,
    version,
    scripts,
    ...additionalFields
  };

  await writeJsonFile(dir, 'package.json', packageJson);
  return packageJson;
};

/**
 * Copies template files to a target directory
 * @param {string} targetDir - Directory to copy to
 * @param {string} projectType - Project type (node, react, next)
 * @param {string[]} [files] - Specific files to copy, or all if not specified
 * @returns {Promise<Object>} Object with results of the copy operation
 */
export const copyTemplateFiles = async (targetDir, projectType, files) => {
  const commonTemplateDir = path.join(TEMPLATES_DIR, 'common');
  const specificTemplateDir = path.join(TEMPLATES_DIR, projectType);
  
  const results = {
    copied: [],
    failed: []
  };

  // Helper function to copy a template file
  const copyTemplateFile = async (templateFile, destFile, templateDir) => {
    try {
      const templatePath = path.join(templateDir, templateFile);
      const destPath = path.join(targetDir, destFile);
      
      // Make sure directory exists
      const destDir = dirname(destPath);
      await fs.mkdir(destDir, { recursive: true });
      
      // Copy file
      const content = await fs.readFile(templatePath, 'utf8');
      await fs.writeFile(destPath, content);
      results.copied.push(destFile);
    } catch (error) {
      results.failed.push(templateFile);
    }
  };

  // Common mapping of template files to destination files
  const commonFiles = {
    'eslintrc.json': '.eslintrc.json',
    'prettierrc.json': '.prettierrc.json',
    'lintstagedrc.json': '.lintstagedrc.json',
    'jest.config.js': 'jest.config.js',
    'gitignore': '.gitignore'
  };

  // Project-specific files
  const specificFiles = {
    node: {},
    react: {
      'jest.setup.js': 'jest.setup.js'
    },
    next: {
      'next.config.js': 'next.config.js',
      'jest.setup.js': 'jest.setup.js'
    }
  };

  // Copy common files
  for (const [templateFile, destFile] of Object.entries(commonFiles)) {
    if (!files || files.includes(destFile)) {
      await copyTemplateFile(templateFile, destFile, commonTemplateDir);
    }
  }

  // Copy project-specific files
  for (const [templateFile, destFile] of Object.entries(specificFiles[projectType] || {})) {
    if (!files || files.includes(destFile)) {
      await copyTemplateFile(templateFile, destFile, specificTemplateDir);
    }
  }

  return results;
};

/**
 * Creates a project directory structure based on project type
 * @param {string} targetDir - Directory to create in
 * @param {string} projectType - Project type (node, react, next)
 * @returns {Promise<string[]>} Array of created directories
 */
export const createProjectStructure = async (targetDir, projectType) => {
  const directoryStructure = {
    node: [
      'src',
      'tests',
      'tests/unit',
      'tests/integration'
    ],
    react: [
      'src',
      'src/components',
      'src/hooks',
      'src/assets',
      'tests',
      'public'
    ],
    next: [
      'src',
      'src/app',
      'src/components',
      'src/lib',
      'tests',
      'public'
    ]
  };

  const directories = directoryStructure[projectType] || directoryStructure.node;
  const createdDirs = [];

  for (const dir of directories) {
    const fullPath = path.join(targetDir, dir);
    await fs.mkdir(fullPath, { recursive: true });
    createdDirs.push(dir);
  }

  return createdDirs;
};

/**
 * Sets up a basic test project environment
 * @param {Object} options - Options
 * @param {string} [options.projectType='node'] - Project type
 * @param {Object} [options.packageJson] - Package.json options
 * @param {boolean} [options.setupStructure=true] - Whether to set up directory structure
 * @param {boolean} [options.copyTemplates=true] - Whether to copy template files
 * @returns {Promise<Object>} Project setup details
 */
export const setupTestProject = async (options = {}) => {
  const {
    projectType = 'node',
    packageJson = {},
    setupStructure = true,
    copyTemplates = true
  } = options;

  // Create temporary directory
  const tempDir = await createTempDir();
  
  // Create results object
  const result = {
    projectDir: tempDir,
    projectType,
    createdDirs: [],
    copiedFiles: []
  };

  // Create package.json
  await createPackageJson(tempDir, packageJson);
  
  // Create project structure if requested
  if (setupStructure) {
    result.createdDirs = await createProjectStructure(tempDir, projectType);
  }
  
  // Copy templates if requested
  if (copyTemplates) {
    const copyResults = await copyTemplateFiles(tempDir, projectType);
    result.copiedFiles = copyResults.copied;
  }
  
  return result;
};