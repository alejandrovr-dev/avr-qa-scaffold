/**
 * @module src/config-generator.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Generates configuration files for the quality system
 * Handles creation of ESLint, Prettier, Jest, and other configuration files
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-12
 * @lastModified 2025-05-12
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  logSuccess, 
  logInfo, 
  logWarning, 
  logError,
  createDirIfNotExists,
  fileExists,
  formatPath
} from './utils.js';
import { getProjectTypeConfig, getProjectDirectories } from './project-types.js';
import { processTemplate } from './templates-loader.js';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Map of standard files to create with their template filenames
 * @constant {Object}
 */
const STANDARD_CONFIG_FILES = {
  // ESLint configuration
  '.eslintrc.json': 'eslintrc.json',
  
  // Prettier configuration
  '.prettierrc.json': 'prettierrc.json',
  
  // Jest configuration
  'jest.config.js': 'jest.config.js',
  
  // Lint-staged configuration
  '.lintstagedrc.json': 'lintstagedrc.json',
  
  // Commitlint configuration
  'commitlint.config.js': 'commitlint.config.js',
  
  // Git ignore file
  '.gitignore': 'gitignore'
};

/**
 * Create all configuration files for the project
 * @param {Object} options - Options
 * @param {string} options.projectType - Type of project (node, react, next)
 * @param {Object} options.templates - Templates loaded from template loader
 * @param {boolean} options.force - Whether to override existing configurations
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether configuration was successful
 */
export async function createConfigFiles(options) {
  const {
    projectType = 'node',
    templates,
    force = false,
    verbose = false
  } = options;
  
  if (!templates) {
    throw new Error('No templates provided. Make sure to load templates first.');
  }
  
  // Get project configuration
  const projectConfig = getProjectTypeConfig(projectType);
  if (!projectConfig) {
    throw new Error(`Invalid project type: ${projectType}`);
  }
  
  const templateVariables = {
    projectName: path.basename(process.cwd()),
    projectType: projectConfig.id,
    year: new Date().getFullYear(),
    nodeVersion: process.version
  };
  
  // Create standard configuration files
  for (const [filename, templateName] of Object.entries(STANDARD_CONFIG_FILES)) {
    await createConfigFile(filename, templateName, templates, templateVariables, { force, verbose });
  }
  
  // Create Husky hooks
  await createHuskyHooks(templates, { force, verbose });
  
  // Create directory structure
  await createProjectStructure(projectType, { verbose });
  
  // Create sample test files
  await createSampleTestFiles(projectType, templates, { force, verbose });
  
  return true;
}

/**
 * Create a single configuration file
 * @param {string} filename - Output filename
 * @param {string} templateName - Template name to use
 * @param {Object} templates - Templates loaded from template loader
 * @param {Object} variables - Variables to replace in the template
 * @param {Object} options - Options
 * @param {boolean} options.force - Whether to override existing file
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether file was created
 */
async function createConfigFile(filename, templateName, templates, variables, options) {
  const { force = false, verbose = false } = options;
  
  // Check if file already exists
  const exists = await fileExists(filename);
  
  if (exists && !force) {
    if (verbose) {
      logInfo(`File ${chalk.cyan(formatPath(filename))} already exists, skipping.`);
    }
    return false;
  }
  
  // Get template content
  const templateContent = templates[templateName];
  
  if (!templateContent) {
    logWarning(`Template ${chalk.yellow(templateName)} not found, skipping ${chalk.cyan(formatPath(filename))}.`);
    return false;
  }
  
  try {
    // Process template with variables
    const processedContent = processTemplate(templateContent, variables);
    
    // Write the file
    await fs.writeFile(filename, processedContent);
    
    logSuccess(`Created ${chalk.cyan(formatPath(filename))}`);
    return true;
  } catch (error) {
    logError(`Failed to create ${chalk.cyan(formatPath(filename))}: ${error.message}`);
    return false;
  }
}

/**
 * Create Husky hooks
 * @param {Object} templates - Templates loaded from template loader
 * @param {Object} options - Options
 * @param {boolean} options.force - Whether to override existing hooks
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether hooks were created
 */
async function createHuskyHooks(templates, options) {
  const { force = false, verbose = false } = options;
  
  // Make sure .husky directory exists
  await createDirIfNotExists('.husky');
  
  // Create hooks from templates
  const hooks = [
    { file: 'pre-commit', template: 'husky/pre-commit' },
    { file: 'commit-msg', template: 'husky/commit-msg' },
    { file: 'prepare-commit-msg', template: 'husky/prepare-commit-msg' },
    { file: 'pre-push', template: 'husky/pre-push' }
  ];
  
  let successful = true;
  
  // Create each hook
  for (const { file, template } of hooks) {
    const filePath = path.join('.husky', file);
    const templateContent = templates[template];
    
    if (!templateContent) {
      logWarning(`Template ${chalk.yellow(template)} not found, skipping hook ${chalk.cyan(file)}.`);
      successful = false;
      continue;
    }
    
    // Check if hook already exists
    const exists = await fileExists(filePath);
    
    if (exists && !force) {
      if (verbose) {
        logInfo(`Hook ${chalk.cyan(file)} already exists, skipping.`);
      }
      continue;
    }
    
    try {
      // Write the hook file
      await fs.writeFile(filePath, templateContent);
      
      // Make the hook executable
      await fs.chmod(filePath, 0o755);
      
      logSuccess(`Created hook ${chalk.cyan(file)}`);
    } catch (error) {
      logError(`Failed to create hook ${chalk.cyan(file)}: ${error.message}`);
      successful = false;
    }
  }
  
  return successful;
}

/**
 * Create project directory structure
 * @param {string} projectType - Type of project
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether directories were created
 */
async function createProjectStructure(projectType, options) {
  const { verbose = false } = options;
  
  // Get directories for this project type
  const directories = getProjectDirectories(projectType);
  
  let successful = true;
  
  // Create each directory
  for (const dir of directories) {
    try {
      const created = await createDirIfNotExists(dir);
      
      if (created) {
        logSuccess(`Created directory ${chalk.cyan(formatPath(dir))}`);
      } else if (verbose) {
        logInfo(`Directory ${chalk.cyan(formatPath(dir))} already exists.`);
      }
    } catch (error) {
      logError(`Failed to create directory ${chalk.cyan(formatPath(dir))}: ${error.message}`);
      successful = false;
    }
  }
  
  return successful;
}

/**
 * Create sample test files
 * @param {string} projectType - Type of project
 * @param {Object} templates - Templates loaded from template loader
 * @param {Object} options - Options
 * @param {boolean} options.force - Whether to override existing files
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<boolean>} Whether files were created
 */
async function createSampleTestFiles(projectType, templates, options) {
  const { force = false, verbose = false } = options;
  
  // Define sample test files based on project type
  const sampleFiles = [
    {
      path: 'tests/unit/sample.test.js',
      template: `tests/${projectType}/sample.test.js`,
      fallback: 'tests/sample.test.js'
    },
    {
      path: 'tests/integration/sample.integration.test.js',
      template: `tests/${projectType}/sample.integration.test.js`,
      fallback: 'tests/sample.integration.test.js'
    }
  ];
  
  let successful = true;
  
  // Create each sample file
  for (const { path: filePath, template, fallback } of sampleFiles) {
    // Check if directories exist
    await createDirIfNotExists(dirname(filePath));
    
    // Check if file already exists
    const exists = await fileExists(filePath);
    
    if (exists && !force) {
      if (verbose) {
        logInfo(`File ${chalk.cyan(formatPath(filePath))} already exists, skipping.`);
      }
      continue;
    }
    
    // Try to get template content
    let templateContent = templates[template];
    
    // If specific template not found, use fallback
    if (!templateContent && fallback) {
      templateContent = templates[fallback];
    }
    
    // If still no template, skip
    if (!templateContent) {
      logWarning(`Template for ${chalk.yellow(filePath)} not found, skipping.`);
      continue;
    }
    
    try {
      // Write the file
      await fs.writeFile(filePath, templateContent);
      
      logSuccess(`Created sample test ${chalk.cyan(formatPath(filePath))}`);
    } catch (error) {
      logError(`Failed to create sample test ${chalk.cyan(formatPath(filePath))}: ${error.message}`);
      successful = false;
    }
  }
  
  return successful;
}