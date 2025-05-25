/**
 * @module src/services/__tests__/configService.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for config service following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-24
 * @lastModified 2025-05-24
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { createConfigService } from '../configService.js';
import { createNullLogger } from '../../ports/output/loggerPort.js';
import { createNullFileSystem } from '../../ports/output/fileSystemPort.js';

describe('Config Service', () => {
  let configService;
  let mockFileSystem;
  let mockTemplateService;
  let mockProjectService;
  let mockLogger;

  beforeEach(() => {
    // Create mock dependencies
    mockLogger = createNullLogger();
    mockLogger.info = jest.fn();
    mockLogger.warning = jest.fn();
    mockLogger.error = jest.fn();

    mockFileSystem = createNullFileSystem();
    mockFileSystem.fileExists = jest.fn();
    mockFileSystem.createDirIfNotExists = jest.fn();
    mockFileSystem.formatPath = jest.fn().mockImplementation(path => path);
    mockFileSystem.writeFile = jest.fn().mockResolvedValue();
    mockFileSystem.chmod = jest.fn().mockResolvedValue();

    mockTemplateService = {
      loadProjectTemplates: jest.fn(),
      getTemplate: jest.fn(),
      processTemplate: jest.fn()
    };

    mockProjectService = {
      getProjectTypeConfig: jest.fn(),
      getProjectDirectories: jest.fn(),
      generateTemplateVariables: jest.fn()
    };

    // Create service instance
    configService = createConfigService({
      fileSystem: mockFileSystem,
      templateService: mockTemplateService,
      projectService: mockProjectService,
      logger: mockLogger
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createProjectConfig method', () => {
    test('should create configuration for valid project type', async () => {
      // Arrange
      const projectType = 'react';
      const projectConfig = { name: 'React' };
      const templates = { 'eslintrc.json': '{}', 'prettierrc.json': '{}' };
      const templateVariables = { projectName: 'test', projectType: 'react' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateService.loadProjectTemplates.mockResolvedValue(templates);
      mockProjectService.generateTemplateVariables.mockReturnValue(templateVariables);
      mockTemplateService.getTemplate.mockReturnValue('template content');
      mockTemplateService.processTemplate.mockReturnValue('processed content');
      mockFileSystem.fileExists.mockResolvedValue(false);
      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockProjectService.getProjectDirectories.mockReturnValue(['src', 'tests']);
      mockFileSystem.writeFile.mockResolvedValue();
      mockFileSystem.chmod.mockResolvedValue();

      // Act
      const result = await configService.createProjectConfig(projectType);

      // Assert
      expect(result).toBe(true);
      expect(mockProjectService.getProjectTypeConfig).toHaveBeenCalledWith(projectType);
      expect(mockTemplateService.loadProjectTemplates).toHaveBeenCalledWith(projectType, { verbose: false });
    });

    test('should use provided templates instead of loading them', async () => {
      // Arrange
      const projectType = 'node';
      const projectConfig = { name: 'Node.js' };
      const providedTemplates = { 'eslintrc.json': 'provided template' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockProjectService.generateTemplateVariables.mockReturnValue({});
      mockTemplateService.getTemplate.mockReturnValue('template content');
      mockTemplateService.processTemplate.mockReturnValue('processed content');
      mockFileSystem.fileExists.mockResolvedValue(false);
      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockProjectService.getProjectDirectories.mockReturnValue(['src']);
      mockFileSystem.writeFile.mockResolvedValue();

      // Act
      const result = await configService.createProjectConfig(projectType, {
        templates: providedTemplates
      });

      // Assert
      expect(result).toBe(true);
      expect(mockTemplateService.loadProjectTemplates).not.toHaveBeenCalled(); // Should not load templates
    });

    test('should throw error for invalid project type', async () => {
      // Arrange
      mockProjectService.getProjectTypeConfig.mockReturnValue(null);

      // Act & Assert
      await expect(configService.createProjectConfig('invalid')).rejects.toThrow(
        'Failed to create project configuration: Invalid project type: invalid'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should log verbose output when requested', async () => {
  // Arrange
  const projectConfig = { name: 'React' };
  mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
  mockTemplateService.loadProjectTemplates.mockResolvedValue({
    'eslintrc.json': 'content',
    'prettierrc.json': 'content'
  });
  mockProjectService.generateTemplateVariables.mockReturnValue({});
  mockProjectService.getProjectDirectories.mockReturnValue([]);
  
  // ✅ AGREGAR ESTOS MOCKS FALTANTES:
  mockTemplateService.getTemplate.mockReturnValue('template content');
  mockTemplateService.processTemplate.mockReturnValue('processed content');
  mockFileSystem.fileExists.mockResolvedValue(false);
  mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
  mockFileSystem.writeFile.mockResolvedValue();
  mockFileSystem.chmod.mockResolvedValue();

  // Act
  await configService.createProjectConfig('react', { verbose: true });

  // Assert
  expect(mockLogger.info).toHaveBeenCalledWith('Creating configuration for React project');
  expect(mockLogger.info).toHaveBeenCalledWith('Configuration created successfully for react project');
});

    test('should not log verbose output when not requested', async () => {
      // Arrange
      const projectConfig = { name: 'React' };
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateService.loadProjectTemplates.mockResolvedValue({});
      mockProjectService.generateTemplateVariables.mockReturnValue({});
      mockProjectService.getProjectDirectories.mockReturnValue([]);

      // Act
      await configService.createProjectConfig('react', { verbose: false });

      // Assert
      expect(mockLogger.info).not.toHaveBeenCalledWith('Creating configuration for React project');
    });

    test('should handle errors during configuration creation', async () => {
      // Arrange
      const projectConfig = { name: 'React' };
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateService.loadProjectTemplates.mockRejectedValue(new Error('Template loading failed'));

      // Act & Assert
      await expect(configService.createProjectConfig('react')).rejects.toThrow(
        'Failed to create project configuration: Template loading failed'
      );
    });
  });

  describe('createConfigFile method', () => {
    test('should create config file successfully', async () => {
      // Arrange
      const filename = '.eslintrc.json';
      const templateName = 'eslintrc.json';
      const templates = { 'eslintrc.json': '{ "extends": [] }' };
      const variables = { projectName: 'test' };

      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockReturnValue('{ "extends": [] }');
      mockTemplateService.processTemplate.mockReturnValue('{ "extends": ["processed"] }');
      mockFileSystem.writeFile.mockResolvedValue();

      // Act
      const result = await configService.createConfigFile(filename, templateName, templates, variables);

      // Assert
      expect(result).toBe(true);
      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(templates, templateName);
      expect(mockTemplateService.processTemplate).toHaveBeenCalledWith('{ "extends": [] }', variables);
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(filename, '{ "extends": ["processed"] }');
      expect(mockLogger.info).toHaveBeenCalledWith(`Created ${filename}`);
    });

    test('should skip existing file when force is false', async () => {
      // Arrange
      const filename = '.eslintrc.json';
      const templateName = 'eslintrc.json';
      const templates = {};

      mockFileSystem.fileExists.mockResolvedValue(true);

      // Act
      const result = await configService.createConfigFile(filename, templateName, templates, {}, {
        force: false,
        verbose: true
      });

      // Assert
      expect(result).toBe(true); // Should return true as file exists
      expect(mockLogger.info).toHaveBeenCalledWith(`File ${filename} already exists, skipping.`);
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
    });

    test('should override existing file when force is true', async () => {
      // Arrange
      const filename = '.eslintrc.json';
      const templateName = 'eslintrc.json';
      const templates = { 'eslintrc.json': 'content' };

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockTemplateService.getTemplate.mockReturnValue('content');
      mockTemplateService.processTemplate.mockReturnValue('processed');
      mockFileSystem.writeFile.mockResolvedValue();

      // Act
      const result = await configService.createConfigFile(filename, templateName, templates, {}, {
        force: true
      });

      // Assert
      expect(result).toBe(true);
      expect(mockFileSystem.writeFile).toHaveBeenCalled();
    });

    test('should handle missing template', async () => {
      // Arrange
      const filename = '.eslintrc.json';
      const templateName = 'missing-template';
      const templates = {};

      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockReturnValue(null);

      // Act
      const result = await configService.createConfigFile(filename, templateName, templates);

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.warning).toHaveBeenCalledWith(
        `Template ${templateName} not found, skipping ${filename}.`
      );
    });

    test('should handle file write errors', async () => {
      // Arrange
      const filename = '.eslintrc.json';
      const templateName = 'eslintrc.json';
      const templates = { 'eslintrc.json': 'content' };

      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockReturnValue('content');
      mockTemplateService.processTemplate.mockReturnValue('processed');
      mockFileSystem.writeFile.mockRejectedValue(new Error('Write failed'));

      // Act
      const result = await configService.createConfigFile(filename, templateName, templates);

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create')
      );
    });

    test('should handle missing filename or template name', async () => {
      // Arrange & Act
      const result1 = await configService.createConfigFile('', 'template', {});
      const result2 = await configService.createConfigFile('file', '', {});

      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Filename and template name are required');
    });

    test('should use default empty variables when not provided', async () => {
      // Arrange
      const filename = '.eslintrc.json';
      const templateName = 'eslintrc.json';
      const templates = { 'eslintrc.json': 'content' };

      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockReturnValue('content');
      mockTemplateService.processTemplate.mockReturnValue('processed');
      mockFileSystem.writeFile.mockResolvedValue();

      // Act - No variables parameter provided (uses default {})
      const result = await configService.createConfigFile(filename, templateName, templates);

      // Assert
      expect(result).toBe(true);
      expect(mockTemplateService.processTemplate).toHaveBeenCalledWith('content', {});
    });

    test('should use default empty options when not provided', async () => {
      // Arrange
      const filename = '.eslintrc.json';
      const templateName = 'eslintrc.json';
      const templates = { 'eslintrc.json': 'content' };

      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockReturnValue('content');
      mockTemplateService.processTemplate.mockReturnValue('processed');
      mockFileSystem.writeFile.mockResolvedValue();

      // Act - No options parameter provided (uses default {})
      const result = await configService.createConfigFile(filename, templateName, templates, {});

      // Assert
      expect(result).toBe(true);
      // Should not log verbose output since verbose defaults to false
      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('already exists'));
    });
  });

  describe('createHuskyHooks method', () => {
    test('should create all Husky hooks successfully', async () => {
      // Arrange
      const templates = {
        'husky/pre-commit': '#!/usr/bin/env sh\npre-commit content',
        'husky/commit-msg': '#!/usr/bin/env sh\ncommit-msg content',
        'husky/prepare-commit-msg': '#!/usr/bin/env sh\nprepare-commit-msg content',
        'husky/pre-push': '#!/usr/bin/env sh\npre-push content'
      };

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockTemplateService.getTemplate.mockImplementation((templates, template) => templates[template]);
      mockFileSystem.fileExists.mockResolvedValue(false);
      mockFileSystem.writeFile.mockResolvedValue();
      mockFileSystem.chmod.mockResolvedValue();

      // Act
      const result = await configService.createHuskyHooks(templates);

      // Assert
      expect(result).toBe(true);
      expect(mockFileSystem.createDirIfNotExists).toHaveBeenCalledWith('.husky');
      expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(4);
      expect(mockFileSystem.chmod).toHaveBeenCalledTimes(4);
      expect(mockLogger.info).toHaveBeenCalledWith('Created hook pre-commit');
    });

    test('should skip existing hooks when force is false', async () => {
      // Arrange
      const templates = { 'husky/pre-commit': 'content' };

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockTemplateService.getTemplate.mockReturnValue('content');
      mockFileSystem.fileExists.mockResolvedValue(true); // Hook already exists

      // Act
      const result = await configService.createHuskyHooks(templates, { force: false, verbose: true });

      // Assert
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Hook pre-commit already exists, skipping.');
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
    });

    test('should override existing hooks when force is true', async () => {
      // Arrange
      const templates = { 'husky/pre-commit': 'new content' };

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockTemplateService.getTemplate.mockReturnValue('new content');
      mockFileSystem.fileExists.mockResolvedValue(true); // Hook already exists
      mockFileSystem.writeFile.mockResolvedValue();
      mockFileSystem.chmod.mockResolvedValue();

      // Act
      const result = await configService.createHuskyHooks(templates, { force: true });

      // Assert
      expect(result).toBe(true);
      expect(mockFileSystem.writeFile).toHaveBeenCalled();
    });

    test('should handle missing hook templates', async () => {
      // Arrange
      const templates = {}; // No templates

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockTemplateService.getTemplate.mockReturnValue(null);

      // Act
      const result = await configService.createHuskyHooks(templates);

      // Assert
      expect(result).toBe(false); // Should return false due to missing templates
      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.stringContaining('Template husky/pre-commit not found')
      );
    });

    test('should handle chmod errors gracefully', async () => {
  // Arrange
  const templates = { 'husky/pre-commit': 'content' };

  mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
  mockTemplateService.getTemplate.mockReturnValue('content');
  mockFileSystem.fileExists.mockResolvedValue(false);
  mockFileSystem.writeFile.mockResolvedValue(); // ✅ Archivo se crea exitosamente
  mockFileSystem.chmod.mockRejectedValue(new Error('Chmod failed')); // ⚠️ Solo chmod falla

  // Act
  const result = await configService.createHuskyHooks(templates);

  // Assert
  expect(result).toBe(true); // ✅ Operación exitosa (archivo creado)
  expect(mockLogger.warning).toHaveBeenCalledWith(
    expect.stringContaining('Could not make .husky/pre-commit executable')
  );
  // ✅ Hook creado, solo warning por chmod
});

    test('should handle directory creation errors', async () => {
      // Arrange
      const templates = { 'husky/pre-commit': 'content' };

      mockFileSystem.createDirIfNotExists.mockRejectedValue(new Error('Directory creation failed'));

      // Act
      const result = await configService.createHuskyHooks(templates);

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create Husky hooks')
      );
    });
  });

  describe('createProjectDirectories method', () => {
    test('should create all project directories successfully', async () => {
      // Arrange
      const projectType = 'react';
      const directories = ['src', 'src/components', 'tests', 'public'];

      mockProjectService.getProjectDirectories.mockReturnValue(directories);
      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);

      // Act
      const result = await configService.createProjectDirectories(projectType);

      // Assert
      expect(result).toBe(true);
      expect(mockProjectService.getProjectDirectories).toHaveBeenCalledWith(projectType);
      expect(mockFileSystem.createDirIfNotExists).toHaveBeenCalledTimes(4);
      expect(mockLogger.info).toHaveBeenCalledWith('Created directory src');
    });

    test('should handle existing directories in verbose mode', async () => {
      // Arrange
      const directories = ['src'];

      mockProjectService.getProjectDirectories.mockReturnValue(directories);
      mockFileSystem.createDirIfNotExists.mockResolvedValue(false); // Directory already exists

      // Act
      const result = await configService.createProjectDirectories('node', { verbose: true });

      // Assert
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Directory src already exists.');
    });

    test('should not log existing directories in non-verbose mode', async () => {
      // Arrange
      const directories = ['src'];

      mockProjectService.getProjectDirectories.mockReturnValue(directories);
      mockFileSystem.createDirIfNotExists.mockResolvedValue(false); // Directory already exists

      // Act
      const result = await configService.createProjectDirectories('node', { verbose: false });

      // Assert
      expect(result).toBe(true);
      expect(mockLogger.info).not.toHaveBeenCalledWith('Directory src already exists.');
    });

    test('should handle directory creation errors', async () => {
      // Arrange
      const directories = ['src', 'tests'];

      mockProjectService.getProjectDirectories.mockReturnValue(directories);
      mockFileSystem.createDirIfNotExists
        .mockResolvedValueOnce(true) // src succeeds
        .mockRejectedValueOnce(new Error('Permission denied')); // tests fails

      // Act
      const result = await configService.createProjectDirectories('node');

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create directory tests')
      );
    });
  });

  describe('createSampleFiles method', () => {
    test('should create sample test files successfully', async () => {
      // Arrange
      const projectType = 'node';
      const templates = {
        'tests/node/sample.test.js': 'node test content',
        'tests/node/sample.integration.test.js': 'node integration content'
      };

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockImplementation((templates, template) => templates[template]);
      mockFileSystem.writeFile.mockResolvedValue();

      // Act
      const result = await configService.createSampleFiles(projectType, templates);

      // Assert
      expect(result).toBe(true);
      expect(mockFileSystem.createDirIfNotExists).toHaveBeenCalledWith('tests/unit');
      expect(mockFileSystem.createDirIfNotExists).toHaveBeenCalledWith('tests/integration');
      expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Created sample test tests/unit/sample.test.js');
    });

    test('should use fallback templates when specific templates not found', async () => {
      // Arrange
      const projectType = 'newtype';
      const templates = {
        'tests/sample.test.js': 'fallback test content',
        'tests/sample.integration.test.js': 'fallback integration content'
      };

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockFileSystem.fileExists.mockResolvedValue(false);
      // First call returns null (specific template), second call returns fallback
      mockTemplateService.getTemplate
        .mockReturnValueOnce(null).mockReturnValueOnce('fallback test content')
        .mockReturnValueOnce(null).mockReturnValueOnce('fallback integration content');
      mockFileSystem.writeFile.mockResolvedValue();

      // Act
      const result = await configService.createSampleFiles(projectType, templates);

      // Assert
      expect(result).toBe(true);
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith('tests/unit/sample.test.js', 'fallback test content');
    });

    test('should skip files when no template is found', async () => {
      // Arrange
      const projectType = 'unknown';
      const templates = {};

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockReturnValue(null); // No templates found

      // Act
      const result = await configService.createSampleFiles(projectType, templates, { verbose: true });

      // Assert
      expect(result).toBe(true);
      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.stringContaining('Template for tests/unit/sample.test.js not found')
      );
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
    });

    test('should skip existing files when force is false', async () => {
      // Arrange
      const templates = { 'tests/sample.test.js': 'content' };

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockFileSystem.fileExists.mockResolvedValue(true); // File already exists

      // Act
      const result = await configService.createSampleFiles('node', templates, { force: false, verbose: true });

      // Assert
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('already exists, skipping')
      );
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
    });

    test('should handle file creation errors', async () => {
      // Arrange
      const templates = { 'tests/sample.test.js': 'content' };

      mockFileSystem.createDirIfNotExists.mockResolvedValue(true);
      mockFileSystem.fileExists.mockResolvedValue(false);
      mockTemplateService.getTemplate.mockReturnValue('content');
      mockFileSystem.writeFile.mockRejectedValue(new Error('Write failed'));

      // Act
      const result = await configService.createSampleFiles('node', templates);

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create sample test')
      );
    });
  });

  describe('utility methods', () => {
    test('getStandardConfigFiles should return copy of standard config files', () => {
      // Arrange & Act
      const result1 = configService.getStandardConfigFiles();
      const result2 = configService.getStandardConfigFiles();

      // Assert
      expect(result1).toHaveProperty(['.eslintrc.json']);
      expect(result1).toHaveProperty(['.prettierrc.json']);
      expect(result1).not.toBe(result2); // Different instances
      expect(result1).toEqual(result2); // Same content
    });

    test('getHuskyHooksConfig should return copy of husky hooks config', () => {
      // Arrange & Act
      const result1 = configService.getHuskyHooksConfig();
      const result2 = configService.getHuskyHooksConfig();

      // Assert
      expect(result1).toBeInstanceOf(Array);
      expect(result1.length).toBeGreaterThan(0);
      expect(result1[0]).toHaveProperty('file');
      expect(result1[0]).toHaveProperty('template');
      expect(result1).not.toBe(result2); // Different instances
      expect(result1).toEqual(result2); // Same content
    });

    test('generateConfigVariables should delegate to project service', () => {
      // Arrange
      const projectName = 'my-project';
      const projectType = 'react';
      const expectedVariables = { projectName, projectType, year: 2024 };

      mockProjectService.generateTemplateVariables.mockReturnValue(expectedVariables);

      // Act
      const result = configService.generateConfigVariables(projectName, projectType);

      // Assert
      expect(result).toBe(expectedVariables);
      expect(mockProjectService.generateTemplateVariables).toHaveBeenCalledWith(projectName, projectType);
    });

    test('generateConfigVariables should use default project name when not provided', () => {
      // Arrange
      const projectType = 'react';
      const expectedVariables = { projectName: 'default-name', projectType };

      mockProjectService.generateTemplateVariables.mockReturnValue(expectedVariables);

      // Act - No project name provided
      const result = configService.generateConfigVariables(null, projectType);

      // Assert
      expect(result).toBe(expectedVariables);
      expect(mockProjectService.generateTemplateVariables).toHaveBeenCalledWith(
        expect.stringMatching(/\w+/), // Should use some default name
        projectType
      );
    });
  });

  describe('checkConfigFilesExist method', () => {
    test('should check existence of all standard config files by default', async () => {
      // Arrange
      mockFileSystem.fileExists
        .mockResolvedValueOnce(true)  // .eslintrc.json exists
        .mockResolvedValueOnce(false) // .prettierrc.json doesn't exist
        .mockResolvedValueOnce(true); // jest.config.js exists

      // Act
      const result = await configService.checkConfigFilesExist();

      // Assert
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result).toHaveProperty(['.eslintrc.json'], true);
      expect(result).toHaveProperty(['.prettierrc.json'], false);
    });

    test('should check specific files when provided', async () => {
      // Arrange
      const specificFiles = ['.eslintrc.json', '.prettierrc.json'];
      mockFileSystem.fileExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const result = await configService.checkConfigFilesExist(specificFiles);

      // Assert
      expect(result).toEqual({
        '.eslintrc.json': true,
        '.prettierrc.json': false
      });
      expect(mockFileSystem.fileExists).toHaveBeenCalledTimes(2);
    });

    test('should handle file existence check errors', async () => {
      // Arrange
      const specificFiles = ['.eslintrc.json'];
      mockFileSystem.fileExists.mockRejectedValue(new Error('Access denied'));

      // Act
      const result = await configService.checkConfigFilesExist(specificFiles);

      // Assert
      expect(result).toEqual({
        '.eslintrc.json': false
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error checking existence of .eslintrc.json')
      );
    });
  });

  describe('validateConfigSetup method', () => {
    test('should validate complete configuration setup', async () => {
      // Arrange
      const projectType = 'react';
      const directories = ['src', 'tests'];

      // Mock all files exist
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockProjectService.getProjectDirectories.mockReturnValue(directories);

      // Act
      const result = await configService.validateConfigSetup(projectType);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.summary.configFiles).toBeGreaterThan(0);
      expect(result.summary.missingFiles).toBe(0);
    });

    test('should detect missing configuration files', async () => {
      // Arrange
      const projectType = 'node';
      
      // Mock some files missing
      mockFileSystem.fileExists.mockImplementation(async (path) => {
        return !path.includes('.eslintrc.json'); // eslintrc is missing
      });
      mockProjectService.getProjectDirectories.mockReturnValue([]);

      // Act
      const result = await configService.validateConfigSetup(projectType);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing configuration file: .eslintrc.json');
      expect(result.summary.missingFiles).toBeGreaterThan(0);
    });

    test('should detect missing directories as warnings', async () => {
      // Arrange
      const projectType = 'react';
      const directories = ['src', 'missing-dir'];

      mockFileSystem.fileExists.mockImplementation(async (path) => {
        // Config files exist, but missing-dir doesn't
        return !path.includes('missing-dir');
      });
      mockProjectService.getProjectDirectories.mockReturnValue(directories);

      // Act
      const result = await configService.validateConfigSetup(projectType);

      // Assert
      expect(result.warnings).toContain('Missing directory: missing-dir');
      expect(result.summary.missingDirectories).toBe(1);
    });

    test('should handle validation errors', async () => {
      // Arrange
      const projectType = 'react';
      mockFileSystem.fileExists.mockRejectedValue(new Error('Validation failed'));

      // Act
      const result = await configService.validateConfigSetup(projectType);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Validation error:')
        ])
      );
    });
  });

  describe('private utility methods', () => {
    test('getDirectoryPath should extract directory from file path', () => {
      // Arrange & Act & Assert
      expect(configService.getDirectoryPath('src/components/Button.js')).toBe('src/components');
      expect(configService.getDirectoryPath('tests/unit/test.js')).toBe('tests/unit');
      expect(configService.getDirectoryPath('file.js')).toBeNull();
      expect(configService.getDirectoryPath('')).toBeNull();
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle template service errors gracefully', async () => {
      // Arrange
      const projectConfig = { name: 'React' };
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateService.loadProjectTemplates.mockRejectedValue(new Error('Service unavailable'));

      // Act & Assert
      await expect(configService.createProjectConfig('react')).rejects.toThrow(
        'Failed to create project configuration: Service unavailable'
      );
    });

    test('should continue with partial success when some operations fail', async () => {
      // Arrange
      const projectConfig = { name: 'Node.js' };
      const templates = { 'eslintrc.json': 'content' };

      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateService.loadProjectTemplates.mockResolvedValue(templates);
      mockProjectService.generateTemplateVariables.mockReturnValue({});
      mockProjectService.getProjectDirectories.mockReturnValue(['src']);
      
      // Make some operations fail
      mockTemplateService.getTemplate.mockReturnValue(null); // Templates fail
      mockFileSystem.createDirIfNotExists.mockResolvedValue(true); // Directories succeed

      // Act
      const result = await configService.createProjectConfig('node', { verbose: true });

      // Assert
      expect(result).toBe(false); // Overall failure due to template issues
      expect(mockLogger.warning).toHaveBeenCalledWith(
        'Configuration completed with some issues for node project'
      );
    });
  });
});