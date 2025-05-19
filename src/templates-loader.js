/**
 * @module lib/templates-loader.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Handles loading template files for different project types
 * Resolves and merges templates from common and project-specific directories
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-09
 * @lastModified 2025-05-12
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';

import { getProjectTypeConfig } from './project-types.js';
import { logInfo, logWarning, logError } from './utils.js';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = path.join(dirname(__dirname), 'templates');

/**
 * Load templates for a specific project type
 * @param {string} projectType - Type of project (node, react, next)
 * @param {boolean} verbose - Whether to show verbose output
 * @returns {Promise<Object>} Object containing templates data
 */
export async function loadTemplates(projectType, verbose = false) {
  // Get project configuration
  const projectConfig = getProjectTypeConfig(projectType);
  if (!projectConfig) {
    throw new Error(`Invalid project type: ${projectType}`);
  }
  
  const { templates: templateConfig } = projectConfig;
  
  // Define template directories to look in
  const baseTemplateDir = path.join(TEMPLATES_DIR, templateConfig.base);
  const specificTemplateDir = path.join(TEMPLATES_DIR, templateConfig.specific);
  
  // Check if directories exist
  try {
    await fs.access(baseTemplateDir);
  } catch (error) {
    throw new Error(`Base template directory not found: ${baseTemplateDir}`);
  }
  
  try {
    await fs.access(specificTemplateDir);
  } catch (error) {
    logWarning(`Project-specific template directory not found: ${specificTemplateDir}`);
    // Continue without project-specific templates
  }
  
  // Load templates from base directory
  if (verbose) {
    logInfo(`Loading base templates from: ${chalk.cyan(baseTemplateDir)}`);
  }
  
  const templatesResult = {};
  
  // Load base templates first
  const baseFiles = await loadTemplateFiles(baseTemplateDir, verbose);
  Object.assign(templatesResult, baseFiles);
  
  // Load and merge project-specific templates (they override base templates)
  try {
    if (verbose) {
      logInfo(`Loading project-specific templates from: ${chalk.cyan(specificTemplateDir)}`);
    }
    
    const specificFiles = await loadTemplateFiles(specificTemplateDir, verbose);
    Object.assign(templatesResult, specificFiles); // Override with project-specific templates
  } catch (error) {
    // Project-specific templates are optional, so just log a warning
    if (verbose) {
      logWarning(`Could not load project-specific templates: ${error.message}`);
    }
  }
  
  return templatesResult;
}

/**
 * Load all template files from a directory
 * @param {string} directory - Directory path to load templates from
 * @param {boolean} verbose - Whether to show verbose output
 * @returns {Promise<Object>} Object with filename:content pairs
 */
async function loadTemplateFiles(directory, verbose = false) {
  try {
    const files = await fs.readdir(directory);
    const templates = {};
    
    // Read all files in the directory
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        // Handle subdirectories (e.g., husky hooks)
        if (verbose) {
          logInfo(`Found template subdirectory: ${chalk.cyan(file)}`);
        }
        
        // Recursively load templates from subdirectory
        const subTemplates = await loadTemplateFiles(filePath, verbose);
        
        // Add subdirectory path to keys
        for (const [subFile, content] of Object.entries(subTemplates)) {
          templates[`${file}/${subFile}`] = content;
        }
      } else {
        // It's a file, read its content
        const content = await fs.readFile(filePath, 'utf8');
        
        if (verbose) {
          logInfo(`Loaded template: ${chalk.cyan(file)}`);
        }
        
        templates[file] = content;
      }
    }
    
    return templates;
  } catch (error) {
    throw new Error(`Failed to load templates from ${directory}: ${error.message}`);
  }
}

/**
 * Get a specific template by filename
 * @param {Object} templates - Templates object returned by loadTemplates
 * @param {string} filename - Name of the template file
 * @returns {string|null} Template content or null if not found
 */
export function getTemplate(templates, filename) {
  return templates[filename] || null;
}

/**
 * List all available templates
 * @param {Object} templates - Templates object returned by loadTemplates
 * @returns {string[]} Array of template filenames
 */
export function listTemplates(templates) {
  return Object.keys(templates);
}

/**
 * Checks if a template exists
 * @param {Object} templates - Templates object returned by loadTemplates
 * @param {string} filename - Name of the template file
 * @returns {boolean} Whether the template exists
 */
export function hasTemplate(templates, filename) {
  return !!templates[filename];
}

/**
 * Process a template with variables
 * @param {string} template - Template content
 * @param {Object} variables - Variables to replace in template
 * @returns {string} Processed template
 */
export function processTemplate(template, variables = {}) {
  let result = template;
  
  // Replace variables in the format {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}