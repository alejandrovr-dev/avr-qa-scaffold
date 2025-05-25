/**
 * @module src/services/__tests__/qualityService.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for quality service following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-25
 * @lastModified 2025-05-25
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { createQualityService } from '../qualityService.js';
import { createNullLogger } from '../../ports/output/loggerPort.js';
import { createNullPackageManager } from '../../ports/output/packageManagerPort.js';
import { createNullGit } from '../../ports/output/gitPort.js';
import { createNullCLICommands } from '../../ports/input/cliCommandsPort.js';

describe('Quality Service', () => {
  let qualityService;
  let mockPackageService;
  let mockVersionService;
  let mockConfigService;
  let mockProjectService;
  let mockPackageManager;
  let mockGit;
  let mockCliCommands;
  let mockLogger;

  beforeEach(() => {
    // Create mock dependencies
    mockLogger = createNullLogger();
    mockLogger.info = jest.fn();
    mockLogger.warning = jest.fn();
    mockLogger.error = jest.fn();

    mockPackageService = {
      installMissingPackages: jest.fn(),
      extractPackageName: jest.fn(),
      getPackageVersions: jest.fn(),
      checkPackagesInstalled: jest.fn(),
      createQualitySystemConfig: jest.fn()
    };

    mockVersionService = {
      checkPackageCompatibility: jest.fn()
    };

    mockConfigService = {
      createProjectConfig: jest.fn(),
      createProjectDirectories: jest.fn(),
      validateConfigSetup: jest.fn()
    };

    mockProjectService = {
      getProjectTypeConfig: jest.fn(),
      getProjectDependencies: jest.fn()
    };

    mockPackageManager = createNullPackageManager();
    mockPackageManager.readPackageJson = jest.fn();
    mockPackageManager.writePackageJson = jest.fn();
    mockPackageManager.initHusky = jest.fn();
    mockPackageManager.runNpxCommand = jest.fn();

    mockGit = createNullGit();
    mockGit.isRepository = jest.fn();
    mockGit.init = jest.fn();

    mockCliCommands = createNullCLICommands();
    mockCliCommands.confirmAction = jest.fn();

    // Create service instance
    qualityService = createQualityService({
      packageService: mockPackageService,
      versionService: mockVersionService,
      configService: mockConfigService,
      projectService: mockProjectService,
      packageManager: mockPackageManager,
      git: mockGit,
      cliCommands: mockCliCommands,
      logger: mockLogger
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('setupQualitySystem method', () => {
    test('should complete full quality system setup successfully', async () => {
      // Arrange
      const projectType = 'react';
      const projectConfig = { name: 'React' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockProjectService.getProjectDependencies.mockReturnValue(['eslint@8.0.0', 'prettier@3.0.0']);
      mockPackageService.installMissingPackages.mockResolvedValue({ success: true, installed: [], skipped: [] });
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.getPackageVersions.mockResolvedValue({ eslint: '8.0.0', prettier: '3.0.0' });
      mockVersionService.checkPackageCompatibility.mockResolvedValue({ compatible: true, issues: [], warnings: [] });
      mockConfigService.createProjectConfig.mockResolvedValue(true);
      mockPackageManager.readPackageJson.mockResolvedValue({ name: 'test-project' });
      mockPackageService.createQualitySystemConfig.mockReturnValue({ name: 'test-project', scripts: {} });
      mockPackageManager.writePackageJson.mockResolvedValue(true);
      mockGit.isRepository.mockResolvedValue(true);
      mockConfigService.createProjectDirectories.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupQualitySystem(projectType, { verbose: true });

      // Assert
      expect(result.success).toBe(true);
      expect(result.steps.dependencies.success).toBe(true);
      expect(result.steps.configuration.success).toBe(true);
      expect(result.steps.scripts.success).toBe(true);
      expect(result.steps.git.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Quality system setup completed successfully!');
    });

    test('should handle invalid project type', async () => {
      // Arrange
      mockProjectService.getProjectTypeConfig.mockReturnValue(null);

      // Act & Assert
      await expect(qualityService.setupQualitySystem('invalid')).rejects.toThrow(
        'Invalid project type: invalid'
      );
    });

    test('should skip dependency installation when skipInstall is true', async () => {
      // Arrange
      const projectType = 'node';
      const projectConfig = { name: 'Node.js' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.getPackageVersions.mockResolvedValue({});
      mockVersionService.checkPackageCompatibility.mockResolvedValue({ compatible: true });
      mockConfigService.createProjectConfig.mockResolvedValue(true);
      mockPackageManager.readPackageJson.mockResolvedValue({});
      mockPackageService.createQualitySystemConfig.mockReturnValue({});
      mockPackageManager.writePackageJson.mockResolvedValue(true);
      mockGit.isRepository.mockResolvedValue(true);
      mockConfigService.createProjectDirectories.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupQualitySystem(projectType, { skipInstall: true });

      // Assert
      expect(result.steps.dependencies.success).toBe(true);
      expect(result.steps.dependencies.details.skipped).toBe(true);
      expect(mockPackageService.installMissingPackages).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Step 1: Skipping dependency installation (--skip-install)');
    });

    test('should handle dependency installation failure', async () => {
      // Arrange
      const projectType = 'react';
      const projectConfig = { name: 'React' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockProjectService.getProjectDependencies.mockReturnValue(['eslint@8.0.0']);
      mockPackageService.installMissingPackages.mockResolvedValue({ 
        success: false, 
        error: 'Installation failed' 
      });
      // Mock other steps to succeed
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.getPackageVersions.mockResolvedValue({});
      mockVersionService.checkPackageCompatibility.mockResolvedValue({ compatible: true });
      mockConfigService.createProjectConfig.mockResolvedValue(true);
      mockPackageManager.readPackageJson.mockResolvedValue({});
      mockPackageService.createQualitySystemConfig.mockReturnValue({});
      mockPackageManager.writePackageJson.mockResolvedValue(true);
      mockGit.isRepository.mockResolvedValue(true);
      mockConfigService.createProjectDirectories.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupQualitySystem(projectType);

      // Assert
      expect(result.success).toBe(false); // Critical step failed
      expect(result.steps.dependencies.success).toBe(false);
      expect(result.errors).toContain('Dependency installation failed: Installation failed');
    });

    test('should handle version compatibility warnings', async () => {
      // Arrange
      const projectType = 'node';
      const projectConfig = { name: 'Node.js' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockProjectService.getProjectDependencies.mockReturnValue(['eslint@8.0.0']);
      mockPackageService.installMissingPackages.mockResolvedValue({ success: true, installed: [], skipped: [] });
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.getPackageVersions.mockResolvedValue({ eslint: '8.0.0' });
      mockVersionService.checkPackageCompatibility.mockResolvedValue({ 
        compatible: false, 
        issues: [], 
        warnings: ['Version warning'] 
      });
      // Mock other steps to succeed
      mockConfigService.createProjectConfig.mockResolvedValue(true);
      mockPackageManager.readPackageJson.mockResolvedValue({});
      mockPackageService.createQualitySystemConfig.mockReturnValue({});
      mockPackageManager.writePackageJson.mockResolvedValue(true);
      mockGit.isRepository.mockResolvedValue(true);
      mockConfigService.createProjectDirectories.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupQualitySystem(projectType);

      // Assert
      expect(result.success).toBe(true); // Not critical, so overall success
      expect(result.steps.compatibility.success).toBe(false);
      expect(result.warnings).toContain('Some package compatibility issues detected');
    });

    test('should log verbose output when requested', async () => {
      // Arrange
      const projectType = 'node';
      const projectConfig = { name: 'Node.js' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockProjectService.getProjectDependencies.mockReturnValue([]);
      mockPackageService.installMissingPackages.mockResolvedValue({ success: true, installed: [], skipped: [] });
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.getPackageVersions.mockResolvedValue({});
      mockVersionService.checkPackageCompatibility.mockResolvedValue({ compatible: true });
      mockConfigService.createProjectConfig.mockResolvedValue(true);
      mockPackageManager.readPackageJson.mockResolvedValue({});
      mockPackageService.createQualitySystemConfig.mockReturnValue({});
      mockPackageManager.writePackageJson.mockResolvedValue(true);
      mockGit.isRepository.mockResolvedValue(true);
      mockConfigService.createProjectDirectories.mockResolvedValue(true);

      // Act
      await qualityService.setupQualitySystem(projectType, { verbose: true });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Setting up quality system for Node.js project');
      expect(mockLogger.info).toHaveBeenCalledWith('Quality system setup completed successfully!');
    });
  });

  describe('setupGitRepository method', () => {
    test('should initialize Git repository successfully when not a repo', async () => {
      // Arrange
      mockGit.isRepository.mockResolvedValue(false); // Not a repo yet
      mockGit.init.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupGitRepository();

      // Assert
      expect(result.success).toBe(true);
      expect(result.details.wasRepository).toBe(false);
      expect(result.details.initialized).toBe(true);
      expect(mockGit.init).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing Git repository...');
    });

    test('should skip Git initialization if already a repository', async () => {
      // Arrange
      mockGit.isRepository.mockResolvedValue(true); // Already a repo

      // Act
      const result = await qualityService.setupGitRepository({ verbose: true });

      // Assert
      expect(result.success).toBe(true);
      expect(result.details.wasRepository).toBe(true);
      expect(result.details.initialized).toBe(true);
      expect(mockGit.init).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Git repository already initialized');
    });

    test('should handle Git initialization failure', async () => {
      // Arrange
      mockGit.isRepository.mockResolvedValue(false);
      mockGit.init.mockResolvedValue(false); // Init fails

      // Act
      const result = await qualityService.setupGitRepository();

      // Assert
      expect(result.success).toBe(false);
      expect(result.details.initialized).toBe(false);
      expect(result.errors).toContain('Git initialization failed');
    });

    test('should handle Git setup errors', async () => {
      // Arrange
      mockGit.isRepository.mockRejectedValue(new Error('Git check failed'));

      // Act
      const result = await qualityService.setupGitRepository();

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Git setup failed: Git check failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Git setup failed: Git check failed');
    });
  });

  describe('setupHuskyHooks method', () => {
    test('should initialize Husky successfully', async () => {
      // Arrange
      mockPackageManager.initHusky.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupHuskyHooks({ verbose: true });

      // Assert
      expect(result.success).toBe(true);
      expect(result.details.initialized).toBe(true);
      expect(result.details.hooksConfigured).toBe(true);
      expect(mockPackageManager.initHusky).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Husky initialized successfully');
    });

    test('should handle Husky initialization failure', async () => {
      // Arrange
      mockPackageManager.initHusky.mockResolvedValue(false); // Init fails

      // Act
      const result = await qualityService.setupHuskyHooks();

      // Assert
      expect(result.success).toBe(true); // Still successful, just with warnings
      expect(result.details.initialized).toBe(false);
      expect(result.warnings).toContain('Husky initialization failed');
    });

    test('should handle Husky errors with user prompt to continue', async () => {
      // Arrange
      mockPackageManager.initHusky.mockRejectedValue(new Error('Husky failed'));
      mockCliCommands.confirmAction.mockResolvedValue(true); // User wants to continue

      // Act
      const result = await qualityService.setupHuskyHooks();

      // Assert
      expect(result.success).toBe(true); // User chose to continue
      expect(result.warnings).toContain('Husky setup error: Husky failed');
      expect(mockCliCommands.confirmAction).toHaveBeenCalledWith(
        'Do you want to continue with setup despite Husky configuration error?'
      );
      expect(mockLogger.warning).toHaveBeenCalledWith('Continuing despite Husky configuration error...');
    });

    test('should handle Husky errors with user prompt to abort', async () => {
      // Arrange
      mockPackageManager.initHusky.mockRejectedValue(new Error('Husky failed'));
      mockCliCommands.confirmAction.mockResolvedValue(false); // User wants to abort

      // Act
      const result = await qualityService.setupHuskyHooks();

      // Assert
      expect(result.success).toBe(false); // User chose to abort
      expect(result.errors).toContain('Setup aborted due to Husky configuration error');
    });

    test('should continue when prompt fails', async () => {
      // Arrange
      mockPackageManager.initHusky.mockRejectedValue(new Error('Husky failed'));
      mockCliCommands.confirmAction.mockRejectedValue(new Error('Prompt failed'));

      // Act
      const result = await qualityService.setupHuskyHooks();

      // Assert
      expect(result.success).toBe(true); // Continues despite prompt failure
      expect(mockLogger.warning).toHaveBeenCalledWith('Could not prompt user, continuing with setup...');
    });
  });

  describe('runPostSetupTasks method', () => {
    test('should run formatting and linting tasks successfully', async () => {
      // Arrange
      mockPackageManager.runNpxCommand
        .mockResolvedValueOnce(true) // prettier succeeds
        .mockResolvedValueOnce(true); // eslint succeeds

      // Act
      const result = await qualityService.runPostSetupTasks('react');

      // Assert
      expect(result.success).toBe(true);
      expect(result.tasks.formatting.success).toBe(true);
      expect(result.tasks.linting.success).toBe(true);
      expect(mockPackageManager.runNpxCommand).toHaveBeenCalledWith('prettier', [
        '--ignore-path', '.gitignore',
        '--write', '"**/*.{js,json,md}"'
      ]);
      expect(mockPackageManager.runNpxCommand).toHaveBeenCalledWith('eslint', [
        '--ignore-path', '.gitignore',
        '--ext', '.js', '.'
      ]);
      expect(mockLogger.info).toHaveBeenCalledWith('Lint check passed successfully');
    });

    test('should handle formatting failure gracefully', async () => {
      // Arrange
      mockPackageManager.runNpxCommand
        .mockRejectedValueOnce(new Error('Prettier failed'))
        .mockResolvedValueOnce(true); // eslint succeeds

      // Act
      const result = await qualityService.runPostSetupTasks('node');

      // Assert
      expect(result.success).toBe(true); // Non-critical failure
      expect(result.tasks.formatting.success).toBe(false);
      expect(result.tasks.linting.success).toBe(true);
      expect(result.warnings).toContain('Formatting failed: Prettier failed');
    });

    test('should handle lint check failure with warning', async () => {
      // Arrange
      mockPackageManager.runNpxCommand
        .mockResolvedValueOnce(true) // prettier succeeds
        .mockResolvedValueOnce(false); // eslint fails (has issues)

      // Act
      const result = await qualityService.runPostSetupTasks('react');

      // Assert
      expect(result.success).toBe(true);
      expect(result.tasks.linting.success).toBe(false);
      expect(result.warnings).toContain('Lint check detected issues');
      expect(mockLogger.warning).toHaveBeenCalledWith('Lint check detected issues. You can fix them with: npm run lint:fix');
    });

    test('should handle complete post-setup task failure', async () => {
      // Arrange
      mockPackageManager.runNpxCommand
        .mockRejectedValueOnce(new Error('Prettier failed'))
        .mockRejectedValueOnce(new Error('ESLint failed'));

      // Act
      const result = await qualityService.runPostSetupTasks('node');

      // Assert
      expect(result.success).toBe(true); // Still succeeds, just with warnings
      expect(result.tasks.formatting.success).toBe(false);
      expect(result.tasks.linting.success).toBe(false);
      expect(result.warnings).toHaveLength(2);
    });
  });

  describe('validateQualitySetup method', () => {
    test('should validate complete quality setup successfully', async () => {
      // Arrange
      const projectType = 'react';
      const mockValidation = {
        valid: true,
        issues: [],
        warnings: [],
        summary: { configFiles: 5, missingFiles: 0 }
      };
      
      mockConfigService.validateConfigSetup.mockResolvedValue(mockValidation);
      mockGit.isRepository.mockResolvedValue(true);
      mockProjectService.getProjectDependencies.mockReturnValue(['eslint@8.0.0', 'prettier@3.0.0']);
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.checkPackagesInstalled.mockResolvedValue({
        eslint: true,
        prettier: true
      });

      // Act
      const result = await qualityService.validateQualitySetup(projectType);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.summary.gitRepository).toBe(true);
      expect(result.summary.dependencies).toBe(2);
      expect(result.summary.missingDependencies).toBe(0);
    });

    test('should detect missing Git repository', async () => {
      // Arrange
      const projectType = 'node';
      mockConfigService.validateConfigSetup.mockResolvedValue({
        valid: true,
        issues: [],
        warnings: [],
        summary: {}
      });
      mockGit.isRepository.mockResolvedValue(false); // Not a Git repo
      mockProjectService.getProjectDependencies.mockReturnValue([]);
      mockPackageService.checkPackagesInstalled.mockResolvedValue({});

      // Act
      const result = await qualityService.validateQualitySetup(projectType);

      // Assert
      expect(result.warnings).toContain('Not a Git repository');
      expect(result.summary.gitRepository).toBe(false);
    });

    test('should detect missing dependencies', async () => {
      // Arrange
      const projectType = 'react';
      mockConfigService.validateConfigSetup.mockResolvedValue({
        valid: true,
        issues: [],
        warnings: [],
        summary: {}
      });
      mockGit.isRepository.mockResolvedValue(true);
      mockProjectService.getProjectDependencies.mockReturnValue(['eslint@8.0.0', 'prettier@3.0.0']);
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.checkPackagesInstalled.mockResolvedValue({
        eslint: false,  // Missing
        prettier: true
      });

      // Act
      const result = await qualityService.validateQualitySetup(projectType);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing dependencies: eslint');
      expect(result.summary.missingDependencies).toBe(1);
    });

    test('should handle validation errors', async () => {
      // Arrange
      const projectType = 'react';
      mockConfigService.validateConfigSetup.mockRejectedValue(new Error('Validation failed'));

      // Act
      const result = await qualityService.validateQualitySetup(projectType);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Validation error: Validation failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Validation failed: Validation failed');
    });
  });

  describe('integration scenarios', () => {
    test('should handle mixed success and failure across all steps', async () => {
      // Arrange
      const projectType = 'node';
      const projectConfig = { name: 'Node.js' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockProjectService.getProjectDependencies.mockReturnValue(['eslint@8.0.0']);
      mockPackageService.installMissingPackages.mockResolvedValue({ success: true, installed: [], skipped: [] });
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.getPackageVersions.mockResolvedValue({ eslint: '8.0.0' });
      mockVersionService.checkPackageCompatibility.mockResolvedValue({ compatible: true });
      mockConfigService.createProjectConfig.mockResolvedValue(false); // Config fails
      mockPackageManager.readPackageJson.mockResolvedValue({});
      mockPackageService.createQualitySystemConfig.mockReturnValue({});
      mockPackageManager.writePackageJson.mockResolvedValue(true);
      mockGit.isRepository.mockResolvedValue(true);
      mockPackageManager.initHusky.mockResolvedValue(true);
      mockConfigService.createProjectDirectories.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupQualitySystem(projectType);

      // Assert
      expect(result.success).toBe(false); // Critical step (config) failed
      expect(result.steps.dependencies.success).toBe(true);
      expect(result.steps.configuration.success).toBe(false);
      expect(result.steps.scripts.success).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should provide detailed error reporting', async () => {
      // Arrange
      const projectType = 'react';
      const projectConfig = { name: 'React' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockProjectService.getProjectDependencies.mockReturnValue(['eslint@8.0.0']);
      mockPackageService.installMissingPackages.mockResolvedValue({ 
        success: false, 
        error: 'Network error' 
      });
      mockPackageService.extractPackageName.mockImplementation(dep => dep.split('@')[0]);
      mockPackageService.getPackageVersions.mockResolvedValue({});
      mockVersionService.checkPackageCompatibility.mockRejectedValue(new Error('Version check failed'));
      mockConfigService.createProjectConfig.mockRejectedValue(new Error('Config error'));
      mockPackageManager.readPackageJson.mockRejectedValue(new Error('Read error'));
      mockGit.isRepository.mockResolvedValue(true);
      mockConfigService.createProjectDirectories.mockResolvedValue(true);

      // Act
      const result = await qualityService.setupQualitySystem(projectType);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Dependency installation failed: Network error');
      expect(result.warnings).toContain('Version compatibility check failed: Version check failed');
      expect(result.errors).toContain('Configuration creation failed: Config error');
      expect(result.errors).toContain('Package.json update failed: Read error');
    });
  });
});