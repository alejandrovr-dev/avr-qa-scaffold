/**
 * @module src/adapters/output/templateRepository/filesystemAdapter.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Filesystem implementation of the TemplateRepositoryPort
 * Provides access to templates stored in the local filesystem
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-20
 * @lastModified 2025-05-20
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import path from 'path';
import { promises as fs } from 'fs';
import { isTemplateRepository } from '../../../ports/output/templateRepositoryPort.js';

/**
 * Creates a template repository using the local filesystem
 * @param {Object} dependencies - Dependencies for the adapter
 * @param {import('../../ports/loggerPort.js').LoggerPort} dependencies.logger - Logger to use
 * @param {import('../../ports/fileSystemPort.js').FileSystemPort} dependencies.fileSystem - FileSystem to use
 * @returns {import('../../ports/templateRepositoryPort.js').TemplateRepositoryPort} A filesystem-based template repository
 */
export function createFilesystemTemplateRepository({ logger, fileSystem }) {
  // Directory where templates are stored
  const getTemplatesDir = () => {
    return path.join(fileSystem.getPackageRoot(), 'templates');
  };

  const templateRepository = {
    /**
     * Get template content by type and name
     * @param {string} projectType - Project type (node, react, next, common)
     * @param {string} templateName - Template filename
     * @returns {Promise<string>} Template content
     */
    async getTemplate(projectType, templateName) {
      try {
        const templatesDir = getTemplatesDir();

        // Try project-specific template first
        let templatePath = path.join(templatesDir, projectType, templateName);
        let exists = await fileSystem.fileExists(templatePath);

        // If not found, try common template
        if (!exists && projectType !== 'common') {
          templatePath = path.join(templatesDir, 'common', templateName);
          exists = await fileSystem.fileExists(templatePath);
        }

        if (!exists) {
          logger.warning(`Template not found: ${projectType}/${templateName}`);
          return '';
        }

        const content = await fs.readFile(templatePath, 'utf8');
        return content;
      } catch (error) {
        logger.error(`Error loading template ${projectType}/${templateName}: ${error.message}`);
        return '';
      }
    },

    /**
     * List available templates for a project type
     * @param {string} projectType - Project type (node, react, next, common)
     * @returns {Promise<string[]>} List of template names
     */
    async listTemplates(projectType) {
      try {
        const templatesDir = getTemplatesDir();
        const typeDir = path.join(templatesDir, projectType);

        if (!await fileSystem.fileExists(typeDir)) {
          return [];
        }

        // Read directory and filter out directories
        const items = await fs.readdir(typeDir, { withFileTypes: true });
        const files = items
          .filter(item => item.isFile())
          .map(item => item.name);

        return files;
      } catch (error) {
        logger.error(`Error listing templates for ${projectType}: ${error.message}`);
        return [];
      }
    },

    /**
     * List all available project types
     * @returns {Promise<string[]>} List of project types
     */
    async listProjectTypes() {
      try {
        const templatesDir = getTemplatesDir();

        if (!await fileSystem.fileExists(templatesDir)) {
          return [];
        }

        // Read directory and filter out files
        const items = await fs.readdir(templatesDir, { withFileTypes: true });
        const directories = items
          .filter(item => item.isDirectory())
          .map(item => item.name);

        return directories;
      } catch (error) {
        logger.error(`Error listing project types: ${error.message}`);
        return [];
      }
    },

    /**
     * Check if templates exist for a project type
     * @param {string} projectType - Project type (node, react, next, common)
     * @returns {Promise<boolean>} Whether templates exist for the project type
     */
    async hasTemplatesForType(projectType) {
      try {
        const templatesDir = getTemplatesDir();
        const typeDir = path.join(templatesDir, projectType);

        const exists = await fileSystem.fileExists(typeDir);
        if (!exists) {
          return false;
        }

        // Check if the directory has at least one file
        const templates = await this.listTemplates(projectType);
        return templates.length > 0;
      } catch (error) {
        logger.error(`Error checking templates for ${projectType}: ${error.message}`);
        return false;
      }
    },
  };

  // Verify that this implementation satisfies the interface
  if (!isTemplateRepository(templateRepository)) {
    throw new Error('Filesystem template repository adapter does not implement TemplateRepositoryPort correctly');
  }

  return templateRepository;
}