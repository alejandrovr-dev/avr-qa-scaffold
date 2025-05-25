/**
 * @module src/services/qualityService.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Core business logic for quality system setup and orchestration
 * Handles the complete setup process including dependencies, configuration, and Git hooks
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-25
 * @lastModified 2025-05-25
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Creates a quality service for orchestrating the complete quality system setup
 * @param {Object} dependencies - Dependencies for the service
 * @param {Object} dependencies.packageService - Package service for dependency management
 * @param {Object} dependencies.versionService - Version service for compatibility checking
 * @param {Object} dependencies.configService - Config service for creating configuration files
 * @param {Object} dependencies.projectService - Project service for project type configurations
 * @param {import('../ports/output/packageManagerPort.js').PackageManagerPort} dependencies.packageManager - Package manager adapter
 * @param {import('../ports/output/gitPort.js').GitPort} dependencies.git - Git adapter
 * @param {import('../ports/output/cliCommandsPort.js').CLICommandsPort} dependencies.cliCommands - CLI commands adapter for prompts
 * @param {import('../ports/output/loggerPort.js').LoggerPort} dependencies.logger - Logger adapter
 * @returns {Object} Quality service instance
 */
export function createQualityService({
  packageService,
  versionService,
  configService,
  projectService,
  packageManager,
  git,
  cliCommands,
  logger
}) {
  return {
    /**
     * Set up the complete quality system for a project
     * @param {string} projectType - Type of project (node, react, next)
     * @param {Object} options - Setup options
     * @param {boolean} [options.force=false] - Whether to override existing configurations
     * @param {boolean} [options.skipInstall=false] - Skip installing npm dependencies
     * @param {boolean} [options.verbose=false] - Show detailed output
     * @param {string} [options.projectName] - Name of the project for template variables
     * @param {Object} [options.templates] - Pre-loaded templates (optional)
     * @returns {Promise<Object>} Setup results with success status and details
     */
    async setupQualitySystem(projectType, options = {}) {
      const {
        force = false,
        skipInstall = false,
        verbose = false,
        projectName,
        templates
      } = options;

      // Validate project type
      const projectConfig = projectService.getProjectTypeConfig(projectType);
      if (!projectConfig) {
        throw new Error(`Invalid project type: ${projectType}`);
      }

      if (verbose) {
        logger.info(`Setting up quality system for ${projectConfig.name} project`);
      }

      const results = {
        success: true,
        steps: {
          dependencies: { success: false, details: null },
          compatibility: { success: false, details: null },
          configuration: { success: false, details: null },
          scripts: { success: false, details: null },
          git: { success: false, details: null },
          directories: { success: false, details: null }
        },
        errors: [],
        warnings: []
      };

      try {
        // Step 1: Install dependencies if not skipped
        if (!skipInstall) {
          logger.info('Step 1: Installing dependencies...');
          const dependencies = projectService.getProjectDependencies(projectType);
          const installResult = await packageService.installMissingPackages(dependencies, {
            dev: true,
            verbose
          });
          results.steps.dependencies = {
            success: installResult.success,
            details: installResult
          };
          if (!installResult.success) {
            results.errors.push(`Dependency installation failed: ${installResult.error}`);
          }
        } else {
          logger.info('Step 1: Skipping dependency installation (--skip-install)');
          results.steps.dependencies = { success: true, details: { skipped: true } };
        }

        // Step 2: Check version compatibility
        logger.info('Step 2: Checking version compatibility...');
        try {
          const installedPackages = projectService.getProjectDependencies(projectType)
            .map(dep => packageService.extractPackageName(dep));
          const versions = await packageService.getPackageVersions(installedPackages);
          const compatibilityResult = await versionService.checkPackageCompatibility(versions, verbose);

          results.steps.compatibility = {
            success: compatibilityResult.compatible,
            details: compatibilityResult
          };

          if (!compatibilityResult.compatible) {
            results.warnings.push('Some package compatibility issues detected');
          }
        } catch (error) {
          results.steps.compatibility = { success: false, details: { error: error.message } };
          results.warnings.push(`Version compatibility check failed: ${error.message}`);
        }

        // Step 3: Create configuration files
        logger.info('Step 3: Creating configuration files...');
        try {
          const configResult = await configService.createProjectConfig(projectType, {
            templates,
            force,
            verbose,
            projectName
          });
          results.steps.configuration = {
            success: configResult,
            details: { created: configResult }
          };
          if (!configResult) {
            results.errors.push('Configuration file creation failed');
          }
        } catch (error) {
          results.steps.configuration = { success: false, details: { error: error.message } };
          results.errors.push(`Configuration creation failed: ${error.message}`);
        }

        // Step 4: Add quality scripts to package.json
        logger.info('Step 4: Updating package.json...');
        try {
          const existingPackageJson = await packageManager.readPackageJson('package.json');
          const qualityConfig = packageService.createQualitySystemConfig(existingPackageJson);
          const scriptResult = await packageManager.writePackageJson('package.json', qualityConfig);
          results.steps.scripts = {
            success: scriptResult,
            details: { updated: scriptResult }
          };
          if (!scriptResult) {
            results.errors.push('Package.json script update failed');
          }
        } catch (error) {
          results.steps.scripts = { success: false, details: { error: error.message } };
          results.errors.push(`Package.json update failed: ${error.message}`);
        }

        // Step 5: Configure Git and Husky
        logger.info('Step 5: Configuring Git repository...');
        const gitResult = await this.setupGitRepository({ verbose });

        logger.info('Step 6: Configuring Husky hooks...');
        const huskyResult = await this.setupHuskyHooks({ verbose });

        results.steps.git = {
          success: gitResult.success && huskyResult.success,
          details: {
            git: gitResult,
            husky: huskyResult
          }
        };

        if (!gitResult.success || !huskyResult.success) {
          results.warnings.push('Git/Husky setup had issues but setup continued');
        }

        // Step 7: Ensure test directory structure
        logger.info('Step 7: Setting up test directory structure...');
        try {
          const dirsResult = await configService.createProjectDirectories(projectType, { verbose });
          results.steps.directories = {
            success: dirsResult,
            details: { created: dirsResult }
          };
        } catch (error) {
          results.steps.directories = { success: false, details: { error: error.message } };
          results.warnings.push(`Directory creation had issues: ${error.message}`);
        }

        // Determine overall success
        const criticalStepsSuccess = results.steps.dependencies.success && 
                                     results.steps.configuration.success && 
                                     results.steps.scripts.success;
        results.success = criticalStepsSuccess;

        if (verbose) {
          if (results.success) {
            logger.info('Quality system setup completed successfully!');
          } else {
            logger.warning('Quality system setup completed with some issues');
          }
        }

        return results;
      } catch (error) {
        results.success = false;
        results.errors.push(`Setup failed: ${error.message}`);
        logger.error(`Quality system setup failed: ${error.message}`);
        return results;
      }
    },

    /**
     * Set up Git repository
     * @param {Object} options - Setup options
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @returns {Promise<Object>} Git setup results
     */
    async setupGitRepository(options = {}) {
      const { verbose = false } = options;

      const result = {
        success: true,
        details: {
          wasRepository: false,
          initialized: false
        },
        errors: [],
        warnings: []
      };

      try {
        // Check if Git is already initialized
        const isRepo = await git.isRepository();
        result.details.wasRepository = isRepo;

        if (!isRepo) {
          logger.info('Initializing Git repository...');
          const gitInitResult = await git.init();
          result.details.initialized = gitInitResult;

          if (!gitInitResult) {
            result.success = false;
            result.errors.push('Git initialization failed');
          } else if (verbose) {
            logger.info('Git repository initialized successfully');
          }
        } else {
          result.details.initialized = true;
          if (verbose) {
            logger.info('Git repository already initialized');
          }
        }

        return result;
      } catch (error) {
        result.success = false;
        result.errors.push(`Git setup failed: ${error.message}`);
        logger.error(`Git setup failed: ${error.message}`);
        return result;
      }
    },

    /**
     * Set up Husky hooks
     * @param {Object} options - Setup options
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @returns {Promise<Object>} Husky setup results
     */
    async setupHuskyHooks(options = {}) {
      const { verbose = false } = options;

      const result = {
        success: true,
        details: {
          initialized: false,
          hooksConfigured: false
        },
        errors: [],
        warnings: []
      };

      try {
        // Initialize Husky
        logger.info('Initializing Husky...');
        const huskyResult = await packageManager.initHusky();
        result.details.initialized = huskyResult;
        
        if (huskyResult) {
          // Note: Hook files are created by configService.createProjectConfig()
          // This just initializes the Husky infrastructure
          result.details.hooksConfigured = true;
          if (verbose) {
            logger.info('Husky initialized successfully');
          }
        } else {
          result.warnings.push('Husky initialization failed');
        }

        return result;
      } catch (error) {
        result.warnings.push(`Husky setup error: ${error.message}`);
        logger.error(`Failed to configure Husky: ${error.message}`);

        // Ask user if they want to continue despite the error
        try {
          const shouldContinue = await cliCommands.confirmAction(
            'Do you want to continue with setup despite Husky configuration error?'
          );

          if (!shouldContinue) {
            result.success = false;
            result.errors.push('Setup aborted due to Husky configuration error');
            return result;
          }

          logger.warning('Continuing despite Husky configuration error...');
        } catch (promptError) {
          // If prompting fails, continue with warning
          logger.warning('Could not prompt user, continuing with setup...');
        }

        return result;
      }
    },

    /**
     * Run post-setup tasks like formatting and initial linting
     * @param {string} projectType - Type of project
     * @param {Object} options - Task options
     * @param {boolean} [options.verbose=false] - Whether to show verbose output
     * @returns {Promise<Object>} Post-setup task results
     */
    async runPostSetupTasks(projectType, options = {}) {
      const { verbose = false } = options;

      const result = {
        success: true,
        tasks: {
          formatting: { success: false, details: null },
          linting: { success: false, details: null }
        },
        warnings: []
      };

      try {
        // Format all files with Prettier
        logger.info('Formatting files with Prettier...');
        try {
          const formatResult = await packageManager.runNpxCommand('prettier', [
            '--ignore-path', '.gitignore', 
            '--write', '"**/*.{js,json,md}"'
          ]);
          result.tasks.formatting = {
            success: formatResult,
            details: { formatted: formatResult }
          };
        } catch (error) {
          result.tasks.formatting = { success: false, details: { error: error.message } };
          result.warnings.push(`Formatting failed: ${error.message}`);
        }

        // Run initial lint check
        logger.info('Running initial lint check...');
        try {
          const lintResult = await packageManager.runNpxCommand('eslint', [
            '--ignore-path', '.gitignore', 
            '--ext', '.js', '.'
          ]);
          result.tasks.linting = {
            success: lintResult,
            details: { passed: lintResult }
          };

          if (lintResult) {
            logger.info('Lint check passed successfully');
          } else {
            logger.warning('Lint check detected issues. You can fix them with: npm run lint:fix');
            result.warnings.push('Lint check detected issues');
          }
        } catch (error) {
          result.tasks.linting = { success: false, details: { error: error.message } };
          result.warnings.push(`Lint check failed: ${error.message}`);
        }

        return result;
      } catch (error) {
        result.success = false;
        result.warnings.push(`Post-setup tasks failed: ${error.message}`);
        logger.warning(`Post-setup tasks failed: ${error.message}`);
        return result;
      }
    },

    /**
     * Validate that the quality system is properly set up
     * @param {string} projectType - Type of project to validate
     * @returns {Promise<Object>} Validation results
     */
    async validateQualitySetup(projectType) {
      try {
        logger.info('Validating quality system setup...');

        const validation = await configService.validateConfigSetup(projectType);
        const gitRepo = await git.isRepository();

        // Add Git repository check to validation
        if (!gitRepo) {
          validation.warnings.push('Not a Git repository');
        }

        // Add dependency checks
        const dependencies = projectService.getProjectDependencies(projectType);
        const installStatus = await packageService.checkPackagesInstalled(
          dependencies.map(dep => packageService.extractPackageName(dep))
        );

        const missingDeps = Object.entries(installStatus)
          .filter(([, installed]) => !installed)
          .map(([name]) => name);

        if (missingDeps.length > 0) {
          validation.issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
          validation.valid = false;
        }

        validation.summary.gitRepository = gitRepo;
        validation.summary.dependencies = Object.keys(installStatus).length;
        validation.summary.missingDependencies = missingDeps.length;

        return validation;
      } catch (error) {
        logger.error(`Validation failed: ${error.message}`);
        return {
          valid: false,
          issues: [`Validation error: ${error.message}`],
          warnings: [],
          summary: {}
        };
      }
    }
  };
}