/**
 * @module lib/utils.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Shared utility functions used across the quality scaffold tools
 * Provides logging, error handling, and common helper functions
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-12
 * @lastModified 2025-05-12
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import chalk from 'chalk';
import figures from 'figures';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';

// Version number - keep this in sync with package.json
export const VERSION = '0.1.0';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Log a success message
 * @param {string} message - Message to log
 */
export function logSuccess(message) {
  console.log(chalk.green(`${figures.tick} ${message}`));
}

/**
 * Log an informational message
 * @param {string} message - Message to log
 */
export function logInfo(message) {
  console.log(chalk.blue(`${figures.info} ${message}`));
}

/**
 * Log a warning message
 * @param {string} message - Message to log
 */
export function logWarning(message) {
  console.log(chalk.yellow(`${figures.warning} ${message}`));
}

/**
 * Log an error message
 * @param {string} message - Message to log
 */
export function logError(message) {
  console.log(chalk.red(`${figures.cross} ${message}`));
}

/**
 * Extract package name from dependency string
 * @param {string} dependency - Dependency string (e.g. 'package@1.0.0')
 * @returns {string} Package name
 */
export function extractPackageName(dependency) {
  // Handle scoped packages like @org/package
  if (dependency.startsWith('@')) {
    const scopedParts = dependency.split('@', 3); // ['', 'org', 'version'] or ['', 'org/package', 'version']
    
    if (scopedParts.length === 3) {
      // It has a version: @org/package@1.0.0
      const [_, scopedName, __] = scopedParts;
      return `@${scopedName}`;
    }
    
    // No version: @org/package
    return dependency;
  }
  
  // Handle regular packages
  return dependency.split('@')[0];
}

/**
 * Extract version from dependency string
 * @param {string} dependency - Dependency string (e.g. 'package@1.0.0')
 * @returns {string|null} Version string or null if not specified
 */
export function extractPackageVersion(dependency) {
  // Handle scoped packages like @org/package
  if (dependency.startsWith('@')) {
    const scopedParts = dependency.split('@', 3); // ['', 'org', 'version'] or ['', 'org/package', 'version']
    
    if (scopedParts.length === 3) {
      // It has a version: @org/package@1.0.0
      const [_, __, version] = scopedParts;
      return version;
    }
    
    // No version: @org/package
    return null;
  }
  
  // Handle regular packages
  const parts = dependency.split('@');
  
  if (parts.length >= 2) {
    return parts[1];
  }
  
  return null;
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<boolean>} Whether directory was created
 */
export async function createDirIfNotExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      return false; // Directory already exists
    }
    throw error;
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} Whether the file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get absolute path from a relative path
 * @param {string} relativePath - Relative path
 * @returns {string} Absolute path
 */
export function getAbsolutePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

/**
 * Show a formatted header in the console
 * @param {string} title - Header title
 * @param {string} [color='blue'] - Color to use (blue, green, yellow, red)
 */
export function showHeader(title, color = 'blue') {
  const colorFunction = {
    blue: chalk.blue.bold,
    green: chalk.green.bold,
    yellow: chalk.yellow.bold,
    red: chalk.red.bold,
  }[color] || chalk.blue.bold;
  
  const line = '='.repeat(title.length + 4);
  console.log('\n' + colorFunction(line));
  console.log(colorFunction(`  ${title}  `));
  console.log(colorFunction(line) + '\n');
}

/**
 * Format a file path for display (makes it relative if possible)
 * @param {string} filePath - Path to format
 * @returns {string} Formatted path
 */
export function formatPath(filePath) {
  const cwd = process.cwd();
  
  if (filePath.startsWith(cwd)) {
    return filePath.substring(cwd.length + 1);
  }
  
  return filePath;
}

/**
 * Get the root directory of the package
 * @returns {string} Root directory
 */
export function getPackageRoot() {
  return path.join(dirname(__dirname));
}

/**
 * Print available commands
 */
export function printAvailableCommands() {
  console.log(chalk.bold('\nAvailable Commands:'));
  console.log(`  ${chalk.cyan('avr-qa-scaffold')}                    - Set up quality tools in current project`);
  console.log(`  ${chalk.cyan('avr-qa-scaffold --type react')}       - Set up for React project`);
  console.log(`  ${chalk.cyan('avr-qa-scaffold init my-project')}    - Create new Node.js project`);
  console.log(`  ${chalk.cyan('avr-qa-scaffold init my-app --type next')} - Create new Next.js project`);
  console.log(`  ${chalk.cyan('avr-qa-scaffold list')}               - List available project types`);
  console.log(`  ${chalk.cyan('avr-qa-scaffold --help')}             - Show help\n`);
}

/**
 * Print project types
 */
export function printProjectTypes() {
  console.log(chalk.bold('\nAvailable Project Types:'));
  console.log(`  ${chalk.cyan('node')}  - Node.js application or library`);
  console.log(`  ${chalk.cyan('react')} - React application`);
  console.log(`  ${chalk.cyan('next')}  - Next.js application\n`);
}