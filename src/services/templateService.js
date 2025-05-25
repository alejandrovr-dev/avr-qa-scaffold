/**
 * @module src/services/templateService.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Core business logic for template management and processing
 * Handles template loading, variable interpolation, and project-specific template resolution
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-24
 * @lastModified 2025-05-24
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Creates a template service for managing templates and processing
 * @param {Object} dependencies - Dependencies for the service
 * @param {import('../ports/output/templateRepositoryPort.js').TemplateRepositoryPort} dependencies.templateRepository - Template repository adapter
 * @param {Object} dependencies.projectService - Project service for project type configurations
 * @param {import('../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger adapter
 * @returns {Object} Template service instance
 */
export function createTemplateService({ templateRepository, projectService, logger }) {
  return {
    /**
     * Load all templates for a specific project type
     * Combines common templates with project-specific overrides
     * @param {string} projectType - Type of project (node, react, next)
     * @param {Object} options - Loading options
     * @param {boolean} [options.verbose=false] - Show verbose output
     * @returns {Promise<Object>} Object containing all templates for the project type
     */
    async loadProjectTemplates(projectType, options = {}) {
      const { verbose = false } = options;

      // Validate project type
      const projectConfig = projectService.getProjectTypeConfig(projectType);
      if (!projectConfig) {
        throw new Error(`Invalid project type: ${projectType}`);
      }

      const { templates: templateConfig } = projectConfig;

      if (verbose) {
        logger.info(`Loading templates for ${projectConfig.name} project`);
      }

      try {
        const templates = {};

        // Load base (common) templates first
        if (verbose) {
          logger.info(`Loading base templates from: ${templateConfig.base}`);
        }

        const baseTemplates = await this.loadTemplatesFromType(templateConfig.base);
        Object.assign(templates, baseTemplates);

        // Load and merge project-specific templates (they override base templates)
        if (templateConfig.specific && templateConfig.specific !== templateConfig.base) {
          if (verbose) {
            logger.info(`Loading project-specific templates from: ${templateConfig.specific}`);
          }

          try {
            const specificTemplates = await this.loadTemplatesFromType(templateConfig.specific);
            Object.assign(templates, specificTemplates); // Override with project-specific templates
          } catch (error) {
            // Project-specific templates are optional, so just log a warning
            if (verbose) {
              logger.warning(`Could not load project-specific templates: ${error.message}`);
            }
          }
        }

        if (verbose) {
          const templateCount = Object.keys(templates).length;
          logger.info(`Loaded ${templateCount} templates for ${projectType} project`);
        }

        return templates;
      } catch (error) {
        const errorMessage = `Failed to load templates for ${projectType}: ${error.message}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    },

    /**
     * Load templates from a specific project type directory
     * @param {string} projectType - Project type directory name
     * @returns {Promise<Object>} Object with template name:content pairs
     * @private
     */
    async loadTemplatesFromType(projectType) {
      const templates = {};
      const templateList = await templateRepository.listTemplates(projectType);

      for (const templateName of templateList) {
        try {
          const content = await templateRepository.getTemplate(projectType, templateName);
          if (content) {
            templates[templateName] = content;
          }
        } catch (error) {
          logger.warning(`Failed to load template ${projectType}/${templateName}: ${error.message}`);
        }
      }

      return templates;
    },

    /**
     * Process a template with variables using interpolation
     * @param {string} template - Template content
     * @param {Object} variables - Variables to replace in template
     * @returns {string} Processed template with variables replaced
     */
    processTemplate(template, variables = {}) {
      if (!template || typeof template !== 'string') {
        return '';
      }

      if (!variables || typeof variables !== 'object') {
        return template;
      }

      let result = template;

      // Replace variables in the format {{variable}}
      for (const [key, value] of Object.entries(variables)) {
        if (value !== null && value !== undefined) {
          const regex = new RegExp(`\\{\\{\\s*${this.escapeRegExp(key)}\\s*\\}\\}`, 'g');
          result = result.replace(regex, String(value));
        }
      }

      return result;
    },

    /**
     * Get a specific template from a templates collection
     * @param {Object} templates - Templates object
     * @param {string} filename - Name of the template file
     * @returns {string|null} Template content or null if not found
     */
    getTemplate(templates, filename) {
      if (!templates || typeof templates !== 'object') {
        return null;
      }

      return templates[filename] || null;
    },

    /**
     * List all available templates in a collection
     * @param {Object} templates - Templates object
     * @returns {string[]} Array of template filenames
     */
    listAvailableTemplates(templates) {
      if (!templates || typeof templates !== 'object') {
        return [];
      }

      return Object.keys(templates);
    },

    /**
     * Check if a template exists in a collection
     * @param {Object} templates - Templates object
     * @param {string} filename - Name of the template file
     * @returns {boolean} Whether the template exists
     */
    hasTemplate(templates, filename) {
      if (!templates || typeof templates !== 'object') {
        return false;
      }

      return filename in templates && templates[filename] !== null && templates[filename] !== undefined;
    },

    /**
     * Get a processed template for a specific project type and template name
     * @param {string} projectType - Type of project
     * @param {string} templateName - Name of the template
     * @param {Object} variables - Variables for template processing
     * @param {Object} options - Processing options
     * @param {boolean} [options.verbose=false] - Show verbose output
     * @returns {Promise<string>} Processed template content
     */
    async getProcessedTemplate(projectType, templateName, variables = {}, options = {}) {
      const { verbose = false } = options;

      try {
        // Load all templates for the project type
        const templates = await this.loadProjectTemplates(projectType, { verbose });

        // Get the specific template
        const template = this.getTemplate(templates, templateName);
        if (!template) {
          throw new Error(`Template '${templateName}' not found for project type '${projectType}'`);
        }

        // Process with variables
        const processed = this.processTemplate(template, variables);

        if (verbose) {
          logger.info(`Processed template ${templateName} for ${projectType} project`);
        }

        return processed;
      } catch (error) {
        const errorMessage = `Failed to get processed template ${templateName} for ${projectType}: ${error.message}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    },

    /**
     * Get all processed templates for a project with variables
     * @param {string} projectType - Type of project
     * @param {Object} variables - Variables for template processing
     * @param {Object} options - Processing options
     * @param {boolean} [options.verbose=false] - Show verbose output
     * @returns {Promise<Object>} Object with processed templates
     */
    async getAllProcessedTemplates(projectType, variables = {}, options = {}) {
      const { verbose = false } = options;

      try {
        // Load all templates for the project type
        const templates = await this.loadProjectTemplates(projectType, { verbose });

        // Process all templates
        const processedTemplates = {};
        for (const [templateName, templateContent] of Object.entries(templates)) {
          processedTemplates[templateName] = this.processTemplate(templateContent, variables);
        }

        if (verbose) {
          const count = Object.keys(processedTemplates).length;
          logger.info(`Processed ${count} templates for ${projectType} project`);
        }

        return processedTemplates;
      } catch (error) {
        const errorMessage = `Failed to get all processed templates for ${projectType}: ${error.message}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    },

    /**
     * Generate template variables for a project
     * @param {string} projectName - Name of the project
     * @param {string} projectType - Type of project
     * @returns {Object} Template variables object
     */
    generateTemplateVariables(projectName, projectType) {
      // Delegate to project service for consistency
      return projectService.generateTemplateVariables(projectName, projectType);
    },

    /**
     * Validate template content
     * @param {string} template - Template content to validate
     * @returns {Object} Validation result with issues found
     */
    validateTemplate(template) {
      const result = {
        valid: true,
        issues: [],
        variables: []
      };

      if (!template || typeof template !== 'string') {
        result.valid = false;
        result.issues.push('Template content is empty or not a string');
        return result;
      }

      // Find all template variables
      const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
      let match;
      const foundVariables = new Set();

      while ((match = variableRegex.exec(template)) !== null) {
        foundVariables.add(match[1]);
      }

      result.variables = Array.from(foundVariables);

      // Check for malformed variables
      const malformedRegex = /\{\{[^}]*$/g;
      if (malformedRegex.test(template)) {
        result.valid = false;
        result.issues.push('Template contains malformed variable syntax');
      }

      return result;
    },

    /**
     * Escape special regex characters in a string
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     * @private
     */
    escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  };
}