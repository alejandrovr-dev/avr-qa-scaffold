/**
 * @module lib/setup-quality-system.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Core functionality for setting up the quality system tools
 * Handles the installation of dependencies and creation of configuration files
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-09
 * @lastModified 2025-05-09
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { existsSync } from 'fs';
import { execaCommand } from 'execa';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { installDependencies, addScriptsToPackageJson } from './package-modifier.js';
import { createConfigFiles } from './config-generator.js';
import { checkVersionCompatibility } from './version-checker.js';
import { logSuccess, logInfo, logWarning, logError } from './utils.js';

/**
 * Core function to set up the entire quality system
 * @param {Object} options - Setup options
 * @param {string} options.projectType - Type of project (node, react, next)
 * @param {Object} options.templates - Loaded templates for configuration files
 * @param {boolean} options.force - Whether to override existing configurations
 * @param {boolean} options.skipInstall - Skip installing npm dependencies
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Promise<boolean>} Whether setup was successful
 */
export async function setupQualitySystem(options) {
  const {
    projectType = 'node',
    templates,
    force = false,
    skipInstall = false,
    verbose = false
  } = options;
  
  try {
    // Step 1: Install dependencies if not skipped
    if (!skipInstall) {
      logInfo('Step 1: Installing dependencies...');
      await installDependencies({ verbose });
    } else {
      logInfo('Step 1: Skipping dependency installation (--skip-install)');
    }
    
    // Step 2: Check version compatibility
    logInfo('Step 2: Checking version compatibility...');
    await checkVersionCompatibility({ verbose });
    
    // Step 3: Create configuration files
    logInfo('Step 3: Creating configuration files...');
    await createConfigFiles({
      projectType,
      templates,
      force,
      verbose
    });
    
    // Step 4: Add quality scripts to package.json
    logInfo('Step 4: Updating package.json...');
    await addScriptsToPackageJson({ verbose });
    
    // Step 5: Initialize Git and Husky
    logInfo('Step 5: Configuring Git hooks with Husky...');
    await setupHusky({ verbose });
    
    // Step 6: Create test directory structure if needed
    logInfo('Step 6: Setting up test directory structure...');
    await setupTestDirectories({ projectType, verbose });
    
    logSuccess('Quality system setup completed successfully!');
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
 * Set up Husky for Git hooks
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<void>}
 */
async function setupHusky({ verbose = false }) {
  // Check if Git is initialized
  if (!existsSync('.git')) {
    logWarning('Git repository not found. Initializing...');
    await execaCommand('git init', { stdio: verbose ? 'inherit' : 'pipe' });
  } else if (verbose) {
    logSuccess('Git repository already initialized');
  }
  
  // Initialize Husky
  logInfo('Initializing Husky...');
  try {
    await execaCommand('npx husky init', { stdio: verbose ? 'inherit' : 'pipe' });
    
    // Create pre-commit hook
    logInfo('Creating Git hooks...');
    
    // These hooks will come from the templates directory based on project type
    // and will be handled by the config-generator module
    
    // Make hooks executable
    await execaCommand('chmod +x .husky/pre-commit .husky/commit-msg .husky/prepare-commit-msg .husky/pre-push', 
      { stdio: verbose ? 'inherit' : 'pipe' });
    
    logSuccess('Git hooks configured successfully');
  } catch (error) {
    logError(`Failed to configure Husky: ${error.message}`);
    
    // Ask user if they want to continue despite the error
    const { shouldContinue } = await inquirer.prompt([{
      type: 'confirm',
      name: 'shouldContinue',
      message: 'Do you want to continue with setup despite Husky configuration error?',
      default: true
    }]);
    
    if (!shouldContinue) {
      throw new Error('Setup aborted due to Husky configuration error');
    }
    
    logWarning('Continuing despite Husky configuration error...');
  }
}

/**
 * Set up test directory structure based on project type
 * @param {Object} options - Options
 * @param {string} options.projectType - Type of project (node, react, next)
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<void>}
 */
async function setupTestDirectories({ projectType, verbose = false }) {
  // The actual directory creation will be handled by the config-generator
  // based on the project type. This function exists as a placeholder for any
  // additional test-specific setup that might be needed in the future.
  
  if (verbose) {
    logInfo(`Setting up test directories for ${projectType} project...`);
  }
  
  // Note: The actual creation of test directories and sample files
  // is handled in the config-generator.js module
}

/**
 * Run post-setup tasks
 * @param {Object} options - Options
 * @param {string} options.projectType - Type of project (node, react, next)
 * @param {boolean} options.verbose - Whether to show verbose output
 * @returns {Promise<void>}
 */
export async function runPostSetupTasks({ projectType, verbose = false }) {
  try {
    // Format all files with Prettier
    logInfo('Formatting files with Prettier...');
    await execaCommand('npm run format', { stdio: verbose ? 'inherit' : 'pipe' });
    
    // Run initial lint
    logInfo('Running initial lint check...');
    const { failed } = await execaCommand('npm run lint', { 
      stdio: verbose ? 'inherit' : 'pipe',
      reject: false // Don't reject on lint errors
    });
    
    if (failed) {
      logWarning('Lint check detected issues. You can fix them with: npm run lint:fix');
    } else {
      logSuccess('Lint check passed successfully');
    }
    
  } catch (error) {
    logWarning(`Post-setup tasks failed: ${error.message}`);
    // We don't re-throw here since these are optional post-setup tasks
  }
}