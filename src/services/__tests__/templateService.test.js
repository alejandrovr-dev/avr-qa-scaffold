/**
 * @module src/services/__tests__/templateService.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for template service following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-24
 * @lastModified 2025-05-24
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { createTemplateService } from '../templateService.js';
import { createNullLogger } from '../../ports/output/loggerPort.js';
import { createNullTemplateRepository } from '../../ports/output/templateRepositoryPort.js';

describe('Template Service', () => {
  let templateService;
  let mockTemplateRepository;
  let mockProjectService;
  let mockLogger;

  beforeEach(() => {
    // Create mock dependencies
    mockLogger = createNullLogger();
    mockLogger.info = jest.fn();
    mockLogger.warning = jest.fn();
    mockLogger.error = jest.fn();

    mockTemplateRepository = createNullTemplateRepository();
    mockTemplateRepository.getTemplate = jest.fn();
    mockTemplateRepository.listTemplates = jest.fn();

    mockProjectService = {
      getProjectTypeConfig: jest.fn(),
      generateTemplateVariables: jest.fn()
    };

    // Create service instance
    templateService = createTemplateService({
      templateRepository: mockTemplateRepository,
      projectService: mockProjectService,
      logger: mockLogger
    });
  });

  describe('loadProjectTemplates method', () => {
    test('should load templates for valid project type', async () => {
      // Arrange
      const projectType = 'react';
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates
        .mockResolvedValueOnce(['eslintrc.json', 'jest.config.js']) // common
        .mockResolvedValueOnce(['eslintrc.json']); // react (overrides common)
      mockTemplateRepository.getTemplate
        .mockResolvedValueOnce('{ "extends": ["eslint:recommended"] }') // common eslintrc
        .mockResolvedValueOnce('export default {};') // common jest
        .mockResolvedValueOnce('{ "extends": ["react-app"] }'); // react eslintrc (override)

      // Act
      const result = await templateService.loadProjectTemplates(projectType);

      // Assert
      expect(result).toEqual({
        'eslintrc.json': '{ "extends": ["react-app"] }', // Overridden by specific
        'jest.config.js': 'export default {};' // From common
      });
      expect(mockProjectService.getProjectTypeConfig).toHaveBeenCalledWith(projectType);
      expect(mockTemplateRepository.listTemplates).toHaveBeenCalledTimes(2);
    });

    test('should throw error for invalid project type', async () => {
      // Arrange
      mockProjectService.getProjectTypeConfig.mockReturnValue(null);

      // Act & Assert
      await expect(templateService.loadProjectTemplates('invalid')).rejects.toThrow(
        'Invalid project type: invalid'
      );
    });

    test('should handle missing project-specific templates gracefully', async () => {
      // Arrange
      const projectConfig = {
        name: 'Node.js',
        templates: { base: 'common', specific: 'node' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates
        .mockResolvedValueOnce(['eslintrc.json']) // common templates
        .mockRejectedValueOnce(new Error('Node templates not found')); // specific templates fail
      mockTemplateRepository.getTemplate
        .mockResolvedValueOnce('{ "extends": ["eslint:recommended"] }');

      // Act
      const result = await templateService.loadProjectTemplates('node', { verbose: true });

      // Assert
      expect(result).toEqual({
        'eslintrc.json': '{ "extends": ["eslint:recommended"] }'
      });
      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.stringContaining('Could not load project-specific templates')
      );
    });

    test('should handle missing project-specific templates gracefully in non-verbose mode', async () => {
      // Arrange
      const projectConfig = {
        name: 'Node.js',
        templates: { base: 'common', specific: 'node' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates
        .mockResolvedValueOnce(['eslintrc.json']) // common templates
        .mockRejectedValueOnce(new Error('Node templates not found')); // specific templates fail
      mockTemplateRepository.getTemplate
        .mockResolvedValueOnce('{ "extends": ["eslint:recommended"] }');

      // Act
      const result = await templateService.loadProjectTemplates('node', { verbose: false });

      // Assert
      expect(result).toEqual({
        'eslintrc.json': '{ "extends": ["eslint:recommended"] }'
      });
      expect(mockLogger.warning).not.toHaveBeenCalled(); // Should not log in non-verbose mode
    });

    test('should skip project-specific templates when same as base', async () => {
      // Arrange
      const projectConfig = {
        name: 'Common',
        templates: { base: 'common', specific: 'common' } // Same as base
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValueOnce(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValueOnce('test content');

      // Act
      const result = await templateService.loadProjectTemplates('common');

      // Assert
      expect(result).toEqual({ 'test.js': 'test content' });
      expect(mockTemplateRepository.listTemplates).toHaveBeenCalledTimes(1); // Only called once for base
    });

    test('should skip project-specific templates when specific is undefined', async () => {
      // Arrange
      const projectConfig = {
        name: 'Basic',
        templates: { base: 'common' } // No specific template
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValueOnce(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValueOnce('test content');

      // Act
      const result = await templateService.loadProjectTemplates('basic');

      // Assert
      expect(result).toEqual({ 'test.js': 'test content' });
      expect(mockTemplateRepository.listTemplates).toHaveBeenCalledTimes(1); // Only called once for base
    });

    test('should log verbose output when requested', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates
        .mockResolvedValueOnce(['test.js'])
        .mockResolvedValueOnce(['test2.js']);
      mockTemplateRepository.getTemplate
        .mockResolvedValueOnce('test content')
        .mockResolvedValueOnce('test2 content');

      // Act
      await templateService.loadProjectTemplates('react', { verbose: true });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Loading templates for React project');
      expect(mockLogger.info).toHaveBeenCalledWith('Loading base templates from: common');
      expect(mockLogger.info).toHaveBeenCalledWith('Loading project-specific templates from: react');
      expect(mockLogger.info).toHaveBeenCalledWith('Loaded 2 templates for react project');
    });

    test('should not log verbose output when not requested', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('test content');

      // Act
      await templateService.loadProjectTemplates('react', { verbose: false });

      // Assert
      expect(mockLogger.info).not.toHaveBeenCalledWith('Loading templates for React project');
      expect(mockLogger.info).not.toHaveBeenCalledWith('Loading base templates from: common');
    });

    test('should handle template loading errors', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockRejectedValue(new Error('Repository error'));

      // Act & Assert
      await expect(templateService.loadProjectTemplates('react')).rejects.toThrow(
        'Failed to load templates for react: Repository error'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('loadTemplatesFromType method', () => {
    test('should load all templates from a project type', async () => {
      // Arrange
      mockTemplateRepository.listTemplates.mockResolvedValue(['file1.js', 'file2.json']);
      mockTemplateRepository.getTemplate
        .mockResolvedValueOnce('content1')
        .mockResolvedValueOnce('content2');

      // Act
      const result = await templateService.loadTemplatesFromType('common');

      // Assert
      expect(result).toEqual({
        'file1.js': 'content1',
        'file2.json': 'content2'
      });
    });

    test('should handle individual template loading failures', async () => {
      // Arrange
      mockTemplateRepository.listTemplates.mockResolvedValue(['good.js', 'bad.js']);
      mockTemplateRepository.getTemplate
        .mockResolvedValueOnce('good content')
        .mockRejectedValueOnce(new Error('Bad template error'));

      // Act
      const result = await templateService.loadTemplatesFromType('common');

      // Assert
      expect(result).toEqual({
        'good.js': 'good content'
        // bad.js should be skipped
      });
      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load template common/bad.js')
      );
    });
  });

  describe('processTemplate method', () => {
    test('should replace variables in template', () => {
      // Arrange
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = { name: 'John', project: 'My App' };

      // Act
      const result = templateService.processTemplate(template, variables);

      // Assert
      expect(result).toBe('Hello John, welcome to My App!');
    });

    test('should use default empty variables when not provided', () => {
      // Arrange
      const template = 'Hello {{name}}!';

      // Act - No variables parameter provided (uses default {})
      const result = templateService.processTemplate(template);

      // Assert
      expect(result).toBe('Hello {{name}}!'); // Variables not replaced due to default empty object
    });

    test('should handle variables with whitespace', () => {
      // Arrange
      const template = 'Year: {{ year }}, Name: {{  name  }}';
      const variables = { year: '2024', name: 'Test' };

      // Act
      const result = templateService.processTemplate(template, variables);

      // Assert
      expect(result).toBe('Year: 2024, Name: Test');
    });

    test('should handle missing variables by leaving them unchanged', () => {
      // Arrange
      const template = 'Hello {{name}}, year {{year}}!';
      const variables = { name: 'John' }; // year is missing

      // Act
      const result = templateService.processTemplate(template, variables);

      // Assert
      expect(result).toBe('Hello John, year {{year}}!');
    });

    test('should handle null and undefined values', () => {
      // Arrange
      const template = 'Value: {{value}}, Empty: {{empty}}';
      const variables = { value: null, empty: undefined };

      // Act
      const result = templateService.processTemplate(template, variables);

      // Assert
      expect(result).toBe('Value: {{value}}, Empty: {{empty}}'); // Left unchanged
    });

    test('should handle special regex characters in variables', () => {
      // Arrange
      const template = 'Pattern: {{pattern}}';
      const variables = { pattern: '$1.50 (100%)' };

      // Act
      const result = templateService.processTemplate(template, variables);

      // Assert
      expect(result).toBe('Pattern: $1.50 (100%)');
    });

    test('should handle invalid inputs gracefully', () => {
      // Arrange & Act & Assert
      expect(templateService.processTemplate(null, {})).toBe('');
      expect(templateService.processTemplate('', {})).toBe('');
      expect(templateService.processTemplate('test', null)).toBe('test');
      expect(templateService.processTemplate('test', 'not-object')).toBe('test');
    });

    test('should handle multiple occurrences of same variable', () => {
      // Arrange
      const template = '{{name}} says {{name}} is great!';
      const variables = { name: 'John' };

      // Act
      const result = templateService.processTemplate(template, variables);

      // Assert
      expect(result).toBe('John says John is great!');
    });
  });

  describe('template utility methods', () => {
    test('getTemplate should return template content', () => {
      // Arrange
      const templates = { 'test.js': 'content', 'other.js': 'other' };

      // Act & Assert
      expect(templateService.getTemplate(templates, 'test.js')).toBe('content');
      expect(templateService.getTemplate(templates, 'missing.js')).toBeNull();
      expect(templateService.getTemplate(null, 'test.js')).toBeNull();
    });

    test('listAvailableTemplates should return template names', () => {
      // Arrange
      const templates = { 'a.js': 'content1', 'b.js': 'content2' };

      // Act & Assert
      expect(templateService.listAvailableTemplates(templates)).toEqual(['a.js', 'b.js']);
      expect(templateService.listAvailableTemplates(null)).toEqual([]);
      expect(templateService.listAvailableTemplates({})).toEqual([]);
    });

    test('hasTemplate should check template existence', () => {
      // Arrange
      const templates = { 'exists.js': 'content', 'null.js': null };

      // Act & Assert
      expect(templateService.hasTemplate(templates, 'exists.js')).toBe(true);
      expect(templateService.hasTemplate(templates, 'missing.js')).toBe(false);
      expect(templateService.hasTemplate(templates, 'null.js')).toBe(false);
      expect(templateService.hasTemplate(null, 'test.js')).toBe(false);
    });
  });

  describe('getProcessedTemplate method', () => {
    test('should get and process a specific template', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('Hello {{name}}!');
      
      const variables = { name: 'World' };

      // Act
      const result = await templateService.getProcessedTemplate('react', 'test.js', variables);

      // Assert
      expect(result).toBe('Hello World!');
    });

    test('should use default empty variables when not provided', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('Hello {{name}}!');

      // Act - No variables parameter provided
      const result = await templateService.getProcessedTemplate('react', 'test.js');

      // Assert
      expect(result).toBe('Hello {{name}}!'); // Variables not replaced due to default empty object
    });

    test('should use default empty options when not provided', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('content');

      // Act - No options parameter provided
      const result = await templateService.getProcessedTemplate('react', 'test.js', {});

      // Assert
      expect(result).toBe('content');
      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Processed template')); // verbose default is false
    });

    test('should log verbose output when requested', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('content');

      // Act
      const result = await templateService.getProcessedTemplate('react', 'test.js', {}, { verbose: true });

      // Assert
      expect(result).toBe('content');
      expect(mockLogger.info).toHaveBeenCalledWith('Processed template test.js for react project');
    });

    test('should not log verbose output when not requested', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('content');

      // Act
      const result = await templateService.getProcessedTemplate('react', 'test.js', {}, { verbose: false });

      // Assert
      expect(result).toBe('content');
      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Processed template'));
    });

    test('should throw error if template not found', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['other.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('content');

      // Act & Assert
      await expect(
        templateService.getProcessedTemplate('react', 'missing.js', {})
      ).rejects.toThrow("Template 'missing.js' not found for project type 'react'");
    });
  });

  describe('getAllProcessedTemplates method', () => {
    test('should process all templates for a project', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['file1.js', 'file2.js']);
      mockTemplateRepository.getTemplate
        .mockResolvedValueOnce('Hello {{name}}!')
        .mockResolvedValueOnce('Project: {{project}}');
      
      const variables = { name: 'World', project: 'Test' };

      // Act
      const result = await templateService.getAllProcessedTemplates('react', variables);

      // Assert
      expect(result).toEqual({
        'file1.js': 'Hello World!',
        'file2.js': 'Project: Test'
      });
    });

    test('should use default empty variables when not provided', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['file1.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('Hello {{name}}!');

      // Act - No variables parameter provided
      const result = await templateService.getAllProcessedTemplates('react');

      // Assert
      expect(result).toEqual({
        'file1.js': 'Hello {{name}}!' // Variables not replaced due to default empty object
      });
    });

    test('should use default empty options when not provided', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('content');

      // Act - No options parameter provided
      const result = await templateService.getAllProcessedTemplates('react', {});

      // Assert
      expect(result).toEqual({ 'test.js': 'content' });
      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Processed')); // verbose default is false
    });

    test('should log verbose output when requested', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('content');

      // Act
      await templateService.getAllProcessedTemplates('react', {}, { verbose: true });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Processed 1 templates for react project');
    });

    test('should not log verbose output when not requested', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockResolvedValue(['test.js']);
      mockTemplateRepository.getTemplate.mockResolvedValue('content');

      // Act
      await templateService.getAllProcessedTemplates('react', {}, { verbose: false });

      // Assert
      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Processed'));
    });
  });

  describe('generateTemplateVariables method', () => {
    test('should delegate to project service', () => {
      // Arrange
      const expectedVariables = { name: 'test', type: 'react' };
      mockProjectService.generateTemplateVariables.mockReturnValue(expectedVariables);

      // Act
      const result = templateService.generateTemplateVariables('test', 'react');

      // Assert
      expect(result).toBe(expectedVariables);
      expect(mockProjectService.generateTemplateVariables).toHaveBeenCalledWith('test', 'react');
    });
  });

  describe('validateTemplate method', () => {
    test('should validate correct template', () => {
      // Arrange
      const template = 'Hello {{name}}, welcome to {{project}}!';

      // Act
      const result = templateService.validateTemplate(template);

      // Assert
      expect(result).toEqual({
        valid: true,
        issues: [],
        variables: ['name', 'project']
      });
    });

    test('should detect malformed variables', () => {
      // Arrange
      const template = 'Hello {{name, missing close';

      // Act
      const result = templateService.validateTemplate(template);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Template contains malformed variable syntax');
    });

    test('should handle invalid template input', () => {
      // Arrange & Act
      const result1 = templateService.validateTemplate(null);
      const result2 = templateService.validateTemplate('');

      // Assert
      expect(result1.valid).toBe(false);
      expect(result1.issues).toContain('Template content is empty or not a string');
      expect(result2.valid).toBe(false);
    });

    test('should find all unique variables', () => {
      // Arrange
      const template = '{{name}} {{name}} {{project}} {{ year }}';

      // Act
      const result = templateService.validateTemplate(template);

      // Assert
      expect(result.variables).toEqual(['name', 'project', 'year']);
    });
  });

  describe('escapeRegExp method', () => {
    test('should escape special regex characters', () => {
      // Arrange
      const testString = '$1.50 (100%)';

      // Act
      const result = templateService.escapeRegExp(testString);

      // Assert
      expect(result).toBe('\\$1\\.50 \\(100%\\)');
    });
  });

  describe('error handling', () => {
    test('should handle template repository errors in loadProjectTemplates', async () => {
      // Arrange
      const projectConfig = {
        name: 'React',
        templates: { base: 'common', specific: 'react' }
      };
      
      mockProjectService.getProjectTypeConfig.mockReturnValue(projectConfig);
      mockTemplateRepository.listTemplates.mockRejectedValue(new Error('Repository down'));

      // Act & Assert
      await expect(templateService.loadProjectTemplates('react')).rejects.toThrow(
        'Failed to load templates for react: Repository down'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle errors in getProcessedTemplate', async () => {
      // Arrange
      mockProjectService.getProjectTypeConfig.mockReturnValue(null);

      // Act & Assert
      await expect(
        templateService.getProcessedTemplate('invalid', 'test.js', {})
      ).rejects.toThrow('Failed to get processed template test.js for invalid');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle errors in getAllProcessedTemplates', async () => {
      // Arrange
      mockProjectService.getProjectTypeConfig.mockReturnValue(null);

      // Act & Assert
      await expect(
        templateService.getAllProcessedTemplates('invalid', {})
      ).rejects.toThrow('Failed to get all processed templates for invalid');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});