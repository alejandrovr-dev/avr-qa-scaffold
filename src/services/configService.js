/**
 * @module src/services/configService.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Core business logic for configuration file management
 * Handles creation of configuration files, project structure, and Git hooks setup
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-24
 * @lastModified 2025-05-24
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Standard configuration files to create with their template mappings
 * @constant {Object}
 * @private
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
  '.gitignore': 'gitignore',
};

/**
 * Husky hooks configuration
 * @constant {Array<Object>}
 * @private
 */
const HUSKY_HOOKS = [
  { file: 'pre-commit', template: 'husky/pre-commit' },
  { file: 'commit-msg', template: 'husky/commit-msg' },
  { file: 'prepare-commit-msg', template: 'husky/prepare-commit-msg' },
  { file: 'pre-push', template: 'husky/pre-push' },
];

/**
 * Creates a configuration service for managing project configuration files
 * @param {Object} dependencies - Dependencies for the service
 * @param {import('../ports/output/fileSystemPort.js').FileSystemPort} dependencies.fileSystem - File system adapter
 * @param {Object} dependencies.templateService - Template service for processing templates
 * @param {Object} dependencies.projectService - Project service for project configurations
 * @param {import('../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger adapter
 * @returns {Object} Configuration service instance
 */
export function createConfigService({ fileSystem, templateService, projectService, logger }) {
  return {
    /**
     * Create all configuration files for a project
     * @param {string} projectType - Type of project (node, react, next)
     * @param {Object} options - Configuration options
     * @param {Object} [options.templates] - Pre-loaded templates (optional, will load if not provided)
     * @param {boolean} [options.force=false] - Whether to override existing configurations
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @param {string} [options.projectName] - Name of the project for template variables
     * @returns {Promise<boolean>} Whether configuration was successful
     */
    async createProjectConfig(projectType, options = {}) {
      const { force = false, verbose = false, projectName, templates } = options;

      try {
        // Validate project type
        const projectConfig = projectService.getProjectTypeConfig(projectType);
        if (!projectConfig) {
          throw new Error(`Invalid project type: ${projectType}`);
        }

        if (verbose) {
          logger.info(`Creating configuration for ${projectConfig.name} project`);
        }

        // Load templates if not provided
        const projectTemplates = templates || await templateService.loadProjectTemplates(projectType, { verbose });

        // Generate template variables
        const templateVariables = this.generateConfigVariables(projectName, projectType);

        // Create standard configuration files
        let allSuccessful = true;
        for (const [filename, templateName] of Object.entries(STANDARD_CONFIG_FILES)) {
          const success = await this.createConfigFile(filename, templateName, projectTemplates, templateVariables, {
            force,
            verbose,
          });
          if (!success) allSuccessful = false;
        }

        // Create Husky hooks
        const hooksSuccess = await this.createHuskyHooks(projectTemplates, { force, verbose });
        if (!hooksSuccess) allSuccessful = false;

        // Create project directory structure
        const dirsSuccess = await this.createProjectDirectories(projectType, { verbose });
        if (!dirsSuccess) allSuccessful = false;

        // Create sample test files
        const samplesSuccess = await this.createSampleFiles(projectType, projectTemplates, { force, verbose });
        if (!samplesSuccess) allSuccessful = false;

        if (verbose) {
          if (allSuccessful) {
            logger.info(`Configuration created successfully for ${projectType} project`);
          } else {
            logger.warning(`Configuration completed with some issues for ${projectType} project`);
          }
        }

        return allSuccessful;
      } catch (error) {
        const errorMessage = `Failed to create project configuration: ${error.message}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    },

    /**
     * Create a single configuration file
     * @param {string} filename - Output filename
     * @param {string} templateName - Template name to use
     * @param {Object} templates - Templates collection
     * @param {Object} variables - Variables to replace in the template
     * @param {Object} options - Creation options
     * @param {boolean} [options.force=false] - Whether to override existing file
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @returns {Promise<boolean>} Whether file was created successfully
     */
    async createConfigFile(filename, templateName, templates, variables = {}, options = {}) {
      const { force = false, verbose = false } = options;

      if (!filename || !templateName) {
        logger.error('Filename and template name are required');
        return false;
      }

      try {
        // Check if file already exists
        const exists = await fileSystem.fileExists(filename);

        if (exists && !force) {
          if (verbose) {
            logger.info(`File ${fileSystem.formatPath(filename)} already exists, skipping.`);
          }
          return true; // Consider this successful since file exists
        }

        // Get template content
        const templateContent = templateService.getTemplate(templates, templateName);

        if (!templateContent) {
          logger.warning(`Template ${templateName} not found, skipping ${fileSystem.formatPath(filename)}.`);
          return false;
        }

        // Process template with variables
        const processedContent = templateService.processTemplate(templateContent, variables);

        // Write the file
        await this.writeFile(filename, processedContent);

        logger.info(`Created ${fileSystem.formatPath(filename)}`);
        return true;
      } catch (error) {
        logger.error(`Failed to create ${fileSystem.formatPath(filename)}: ${error.message}`);
        return false;
      }
    },

    /**
     * Create Husky Git hooks
     * @param {Object} templates - Templates collection
     * @param {Object} options - Creation options
     * @param {boolean} [options.force=false] - Whether to override existing hooks
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @returns {Promise<boolean>} Whether hooks were created successfully
     */
    async createHuskyHooks(templates, options = {}) {
      const { force = false, verbose = false } = options;

      try {
        // Make sure .husky directory exists
        await fileSystem.createDirIfNotExists('.husky');

        let allSuccessful = true;

        // Create each hook
        for (const { file, template } of HUSKY_HOOKS) {
          const filePath = `.husky/${file}`;
          const templateContent = templateService.getTemplate(templates, template);

          if (!templateContent) {
            logger.warning(`Template ${template} not found, skipping hook ${file}.`);
            allSuccessful = false;
            continue;
          }

          // Check if hook already exists
          const exists = await fileSystem.fileExists(filePath);

          if (exists && !force) {
            if (verbose) {
              logger.info(`Hook ${file} already exists, skipping.`);
            }
            continue;
          }

          try {
            // Write the hook file
            await this.writeFile(filePath, templateContent);

            // Make the hook executable (Unix systems)
            await this.makeExecutable(filePath);

            logger.info(`Created hook ${file}`);
          } catch (error) {
            logger.error(`Failed to create hook ${file}: ${error.message}`);
            allSuccessful = false;
          }
        }

        return allSuccessful;
      } catch (error) {
        logger.error(`Failed to create Husky hooks: ${error.message}`);
        return false;
      }
    },

    /**
     * Create project directory structure
     * @param {string} projectType - Type of project
     * @param {Object} options - Creation options
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @returns {Promise<boolean>} Whether directories were created successfully
     */
    async createProjectDirectories(projectType, options = {}) {
      const { verbose = false } = options;

      try {
        // Get directories for this project type
        const directories = projectService.getProjectDirectories(projectType);

        let allSuccessful = true;

        // Create each directory
        for (const dir of directories) {
          try {
            const created = await fileSystem.createDirIfNotExists(dir);

            if (created) {
              logger.info(`Created directory ${fileSystem.formatPath(dir)}`);
            } else if (verbose) {
              logger.info(`Directory ${fileSystem.formatPath(dir)} already exists.`);
            }
          } catch (error) {
            logger.error(`Failed to create directory ${fileSystem.formatPath(dir)}: ${error.message}`);
            allSuccessful = false;
          }
        }

        return allSuccessful;
      } catch (error) {
        logger.error(`Failed to create project directories: ${error.message}`);
        return false;
      }
    },

    /**
     * Create sample test files for the project
     * @param {string} projectType - Type of project
     * @param {Object} templates - Templates collection
     * @param {Object} options - Creation options
     * @param {boolean} [options.force=false] - Whether to override existing files
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @returns {Promise<boolean>} Whether sample files were created successfully
     */
    async createSampleFiles(projectType, templates, options = {}) {
      const { force = false, verbose = false } = options;

      // Define sample test files based on project type
      const sampleFiles = [
        {
          path: 'tests/unit/sample.test.js',
          template: `tests/${projectType}/sample.test.js`,
          fallback: 'tests/sample.test.js',
        },
        {
          path: 'tests/integration/sample.integration.test.js',
          template: `tests/${projectType}/sample.integration.test.js`,
          fallback: 'tests/sample.integration.test.js',
        },
      ];

      let allSuccessful = true;

      // Create each sample file
      for (const { path: filePath, template, fallback } of sampleFiles) {
        try {
          // Check if directories exist
          const dirPath = this.getDirectoryPath(filePath);
          if (dirPath) {
            await fileSystem.createDirIfNotExists(dirPath);
          }

          // Check if file already exists
          const exists = await fileSystem.fileExists(filePath);

          if (exists && !force) {
            if (verbose) {
              logger.info(`File ${fileSystem.formatPath(filePath)} already exists, skipping.`);
            }
            continue;
          }

          // Try to get template content
          let templateContent = templateService.getTemplate(templates, template);

          // If specific template not found, use fallback
          if (!templateContent && fallback) {
            templateContent = templateService.getTemplate(templates, fallback);
          }

          // If still no template, skip
          if (!templateContent) {
            if (verbose) {
              logger.warning(`Template for ${fileSystem.formatPath(filePath)} not found, skipping.`);
            }
            continue;
          }

          // Write the file
          await this.writeFile(filePath, templateContent);

          logger.info(`Created sample test ${fileSystem.formatPath(filePath)}`);
        } catch (error) {
          logger.error(`Failed to create sample test ${fileSystem.formatPath(filePath)}: ${error.message}`);
          allSuccessful = false;
        }
      }

      return allSuccessful;
    },

    /**
     * Get standard configuration files mapping
     * @returns {Object} Standard configuration files
     */
    getStandardConfigFiles() {
      return { ...STANDARD_CONFIG_FILES };
    },

    /**
     * Get Husky hooks configuration
     * @returns {Array<Object>} Husky hooks configuration
     */
    getHuskyHooksConfig() {
      return [...HUSKY_HOOKS];
    },

    /**
     * Generate template variables for configuration files
     * @param {string} projectName - Name of the project
     * @param {string} projectType - Type of project
     * @returns {Object} Template variables
     */
    generateConfigVariables(projectName, projectType) {
      // Use current working directory name as default project name
      const defaultProjectName = process.cwd().split('/').pop() || 'my-project';
      
      return projectService.generateTemplateVariables(
        projectName || defaultProjectName,
        projectType
      );
    },

    /**
     * Check if configuration files exist for a project
     * @param {string[]} [filenames] - Specific filenames to check (optional)
     * @returns {Promise<Object>} Object with filename:exists pairs
     */
    async checkConfigFilesExist(filenames) {
      const filesToCheck = filenames || Object.keys(STANDARD_CONFIG_FILES);
      const results = {};

      for (const filename of filesToCheck) {
        try {
          results[filename] = await fileSystem.fileExists(filename);
        } catch (error) {
          logger.error(`Error checking existence of ${filename}: ${error.message}`);
          results[filename] = false;
        }
      }

      return results;
    },

    /**
     * Validate configuration setup
     * @param {string} projectType - Type of project
     * @returns {Promise<Object>} Validation results
     */
    async validateConfigSetup(projectType) {
      const validation = {
        valid: true,
        issues: [],
        warnings: [],
        summary: {
          configFiles: 0,
          missingFiles: 0,
          directories: 0,
          missingDirectories: 0
        }
      };

      try {
        // Check configuration files
        const configStatus = await this.checkConfigFilesExist();
        for (const [filename, exists] of Object.entries(configStatus)) {
          validation.summary.configFiles++;
          if (!exists) {
            validation.summary.missingFiles++;
            validation.issues.push(`Missing configuration file: ${filename}`);
            validation.valid = false;
          }
        }

        // Check project directories
        const directories = projectService.getProjectDirectories(projectType);
        for (const dir of directories) {
          validation.summary.directories++;
          const exists = await fileSystem.fileExists(dir);
          if (!exists) {
            validation.summary.missingDirectories++;
            validation.warnings.push(`Missing directory: ${dir}`);
          }
        }

        // Check Husky hooks
        for (const { file } of HUSKY_HOOKS) {
          const hookPath = `.husky/${file}`;
          const exists = await fileSystem.fileExists(hookPath);
          if (!exists) {
            validation.warnings.push(`Missing Git hook: ${file}`);
          }
        }

      } catch (error) {
        validation.valid = false;
        validation.issues.push(`Validation error: ${error.message}`);
      }

      return validation;
    },

    /**
     * Write file content using the file system adapter
     * @param {string} filePath - Path to write to
     * @param {string} content - Content to write
     * @returns {Promise<void>}
     * @private
     */
    async writeFile(filePath, content) {
      await fileSystem.writeFile(filePath, content);
    },

    /**
     * Make a file executable (Unix systems)
     * @param {string} filePath - Path to make executable
     * @returns {Promise<void>}
     * @private
     */
    async makeExecutable(filePath) {
      try {
        await fileSystem.chmod(filePath, 0o755);
      } catch (error) {
        // On Windows or if chmod fails, log but don't throw
        logger.warning(`Could not make ${filePath} executable: ${error.message}`);
      }
    },

    /**
     * Get directory path from a file path
     * @param {string} filePath - Full file path
     * @returns {string|null} Directory path or null if no directory
     * @private
     */
    getDirectoryPath(filePath) {
      const path = filePath.split('/');
      if (path.length <= 1) return null;
      return path.slice(0, -1).join('/');
    }
  };
}