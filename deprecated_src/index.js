/**
 * @module src/index.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Main entry point for the avr-qa-scaffold library
 * Coordinates the setup and initialization processes
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-09
 * @lastModified 2025-05-09
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import local modules
import { setupQualitySystem } from './setup-quality-system.js';
import { modifyPackageJson, addDevDependencies } from './package-modifier.js';
import { getProjectTypeConfig } from './project-types.js';
import { loadTemplates } from './templates-loader.js';
import { logSuccess, logInfo, logWarning, logError, VERSION } from './utils.js';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Set up quality tools in an existing project
 * @param {Object} options - Setup options
 * @param {string} options.projectType - Type of project (node, react, next)
 * @param {boolean} options.force - Whether to override existing configurations
 * @param {boolean} options.skipInstall - Skip installing npm dependencies
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Promise<boolean>} - Whether setup was successful
 */
export async function setup(options = {}) {
  const {
    projectType = 'node',
    force = false,
    skipInstall = false,
    verbose = false
  } = options;
  
  try {
    // 1. Validate current directory contains a package.json
    if (!existsSync('package.json')) {
      logError('No package.json found. Are you in a Node.js project directory?');
      logInfo('Run "npm init" first or use "avr-qa-scaffold init" to create a new project.');
      return false;
    }
    
    // 2. Load project type configuration
    const projectConfig = getProjectTypeConfig(projectType);
    if (!projectConfig) {
      logError(`Invalid project type: ${projectType}`);
      logInfo('Available project types: node, react, next');
      return false;
    }
    
    if (verbose) {
      logInfo(`Setting up quality system for ${chalk.bold(projectConfig.name)}`);
    }
    
    // 3. Load appropriate templates based on project type
    const templates = await loadTemplates(projectType);
    
    // 4. Set up the quality system with appropriate configs
    await setupQualitySystem({
      projectType,
      templates,
      force,
      skipInstall,
      verbose
    });
    
    // 5. Display success message
    logSuccess(`Quality system successfully set up for ${chalk.bold(projectConfig.name)} project!`);
    logInfo('Run the following commands to see what\'s available:');
    logInfo(` - ${chalk.cyan('npm run lint')} - Check for code issues`);
    logInfo(` - ${chalk.cyan('npm run format')} - Fix formatting issues`);
    logInfo(` - ${chalk.cyan('npm run commit')} - Create a standardized commit message`);
    logInfo(` - ${chalk.cyan('npm test')} - Run tests`);
    
    return true;
  } catch (error) {
    logError(`Failed to set up quality system: ${error.message}`);
    if (verbose) {
      console.error(error);
    }
    return false;
  }
}

/**
 * Initialize a new project with quality tools
 * @param {Object} options - Initialization options
 * @param {string} options.projectType - Type of project (node, react, next)
 * @param {string} options.directory - Directory to create project in
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function init(options = {}) {
  const {
    projectType = 'node',
    directory = '.',
    verbose = false
  } = options;
  
  try {
    // 1. Validate project type
    const projectConfig = getProjectTypeConfig(projectType);
    if (!projectConfig) {
      logError(`Invalid project type: ${projectType}`);
      logInfo('Available project types: node, react, next');
      return false;
    }
    
    // 2. Create directory if it doesn't exist
    if (directory !== '.' && !existsSync(directory)) {
      logInfo(`Creating directory: ${directory}`);
      mkdirSync(directory, { recursive: true });
    }
    
    // 3. Create or change to the project directory
    const projectDir = path.resolve(directory);
    
    if (directory !== '.') {
      process.chdir(projectDir);
      logInfo(`Working in directory: ${projectDir}`);
    }
    
    // 4. Initialize Node.js project if package.json doesn't exist
    if (!existsSync('package.json')) {
      logInfo('Initializing Node.js project...');
      await execaCommand('npm init -y', { stdio: verbose ? 'inherit' : 'pipe' });
      
      // Update package.json with project type specific values
      logInfo('Configuring package.json...');
      await modifyPackageJson({
        type: 'module', // Always use ES modules
        ...projectConfig.packageJsonDefaults
      });
    }
    
    // 5. Initialize git repository if not already initialized
    if (!existsSync('.git')) {
      logInfo('Initializing git repository...');
      await execaCommand('git init', { stdio: verbose ? 'inherit' : 'pipe' });
    }
    
    // 6. Create directory structure based on project type
    logInfo('Creating project structure...');
    for (const dir of projectConfig.directories) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        if (verbose) {
          logInfo(`Created directory: ${dir}`);
        }
      }
    }
    
    // 7. Set up the quality system
    logInfo('Setting up quality system...');
    await setup({
      projectType,
      force: true, // Always override in new projects
      skipInstall: false, // Always install dependencies for new projects
      verbose
    });
    
    // 8. Install project type specific dependencies
    if (projectConfig.dependencies && projectConfig.dependencies.length > 0) {
      logInfo(`Installing ${projectConfig.name} dependencies...`);
      await addDevDependencies(projectConfig.dependencies, { verbose });
    }
    
    // 9. Final success message
    logSuccess(`${chalk.bold(projectConfig.name)} project initialized successfully in ${chalk.bold(projectDir)}`);
    logInfo('Next steps:');
    logInfo(` - ${chalk.cyan('cd ' + (directory === '.' ? '.' : directory))}`);
    logInfo(` - ${chalk.cyan('npm install')} (if needed)`);
    logInfo(` - ${chalk.cyan('git add .')}`);
    logInfo(` - ${chalk.cyan('npm run commit')}`);
    
    return true;
  } catch (error) {
    logError(`Failed to initialize project: ${error.message}`);
    if (verbose) {
      console.error(error);
    }
    return false;
  }
}

// Export other modules for direct access if needed
export * from './setup-quality-system.js';
export * from './package-modifier.js';
export * from './project-types.js';
export * from './templates-loader.js';
export * from './utils.js';