/**
 * @module src/adapters/output/templateRepository/__tests__/filesystemAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for filesystem template repository adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-20
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

// Static imports
import { jest } from '@jest/globals';
import path from 'path';
import { isTemplateRepository } from '../../../../ports/output/templateRepositoryPort.js';
import { createNullLogger } from '../../../../ports/output/loggerPort.js';
import { createNullFileSystem } from '../../../../ports/output/fileSystemPort.js';

/**
 * Create manual mocks for fs.promises methods
 */
const mockFsReadFile = jest.fn();
const mockFsReadDir = jest.fn();
/** 
 * Mock the fs module (substituting real module with our manual mocks)
 * This tells Jest: "whenever any module tries to import 'fs', return this mock object instead"
 */
jest.unstable_mockModule('fs', () => ({
  promises: {
    readFile: mockFsReadFile,
    readdir: mockFsReadDir,
  },
}));
/**
 * Dynamic imports after mocking
 * Import the dependencies after have been mocked (for our own use in tests)
 * This import will receive our mocked versions, not the real dependencies
 */
const { promises: fs } = await import('fs');
/**
 * Import the adapter after mocking dependencies
 * When the adapter internally executes 'import { ... } from '...'',
 * it will receive our mocked dependencies instead of the real ones, transparently
 */
const { createFilesystemTemplateRepository } = await import('../filesystemAdapter.js');

describe('Filesystem Template Repository Adapter', () => {
  // Test dependencies
  let logger;
  let fileSystem;
  let templateRepository;

  // Constants
  const MOCK_PACKAGE_ROOT = '/mock/project/root';
  const MOCK_TEMPLATES_DIR = path.join(MOCK_PACKAGE_ROOT, 'templates');

  // Setup
  beforeEach(() => {
    // Create a mock logger
    logger = createNullLogger();
    logger.warning = jest.fn();
    logger.error = jest.fn();

    // Create a mock file system
    fileSystem = createNullFileSystem();
    fileSystem.fileExists = jest.fn();
    fileSystem.getPackageRoot = jest.fn().mockReturnValue(MOCK_PACKAGE_ROOT);

    // Create the template repository with mocked dependencies
    templateRepository = createFilesystemTemplateRepository({ logger, fileSystem });

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should create a template repository that satisfies the TemplateRepositoryPort interface', () => {
    // Assert
    expect(isTemplateRepository(templateRepository)).toBe(true);
  });
  
  describe('getTemplate method', () => {
    test('should load project-specific template when it exists', async () => {
      // Arrange
      const projectType = 'react';
      const templateName = 'eslintrc.json';
      const templateContent = '{ "extends": "react-app" }';
      fileSystem.fileExists.mockImplementation(async (filePath) => {
        return filePath === path.join(MOCK_TEMPLATES_DIR, projectType, templateName);
      });
      fs.readFile.mockResolvedValue(templateContent);
      // Act
      const result = await templateRepository.getTemplate(projectType, templateName);
      // Assert
      expect(result).toBe(templateContent);
      expect(fileSystem.fileExists).toHaveBeenCalledWith(
        path.join(MOCK_TEMPLATES_DIR, projectType, templateName)
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(MOCK_TEMPLATES_DIR, projectType, templateName),
        'utf8'
      );
    });
    
    test('should fall back to common template if project-specific template does not exist', async () => {
      // Arrange
      const projectType = 'node';
      const templateName = 'eslintrc.json';
      const templateContent = '{ "extends": "eslint:recommended" }';
      // First call (project-specific) returns false, second call (common) returns true
      fileSystem.fileExists.mockImplementation(async (filePath) => {
        return filePath === path.join(MOCK_TEMPLATES_DIR, 'common', templateName);
      });
      fs.readFile.mockResolvedValue(templateContent);
      // Act
      const result = await templateRepository.getTemplate(projectType, templateName);
      // Assert
      expect(result).toBe(templateContent);
      expect(fileSystem.fileExists).toHaveBeenCalledWith(
        path.join(MOCK_TEMPLATES_DIR, projectType, templateName)
      );
      expect(fileSystem.fileExists).toHaveBeenCalledWith(
        path.join(MOCK_TEMPLATES_DIR, 'common', templateName)
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(MOCK_TEMPLATES_DIR, 'common', templateName),
        'utf8'
      );
    });

    test('should return empty string if template does not exist', async () => {
      // Arrange
      const projectType = 'next';
      const templateName = 'nonexistent.json';
      fileSystem.fileExists.mockResolvedValue(false);
      // Act
      const result = await templateRepository.getTemplate(projectType, templateName);
      // Assert
      expect(result).toBe('');
      expect(logger.warning).toHaveBeenCalled();
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    test('should handle errors and return empty string', async () => {
      // Arrange
      const projectType = 'react';
      const templateName = 'eslintrc.json';
      fileSystem.fileExists.mockResolvedValue(true);
      fs.readFile.mockRejectedValue(new Error('Read error'));
      // Act
      const result = await templateRepository.getTemplate(projectType, templateName);
      // Assert
      expect(result).toBe('');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('listTemplates method', () => {
    test('should return list of template files for a project type', async () => {
      // Arrange
      const projectType = 'node';
      const mockFiles = [
        { name: 'eslintrc.json', isFile: () => true },
        { name: 'jest.config.js', isFile: () => true },
        { name: 'subdir', isFile: () => false }, // Should be filtered out
      ];
      fileSystem.fileExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(mockFiles);
      // Act
      const result = await templateRepository.listTemplates(projectType);
      // Assert
      expect(result).toEqual(['eslintrc.json', 'jest.config.js']);
      expect(fs.readdir).toHaveBeenCalledWith(
        path.join(MOCK_TEMPLATES_DIR, projectType),
        { withFileTypes: true }
      );
    });

    test('should return empty array if project type directory does not exist', async () => {
      // Arrange
      const projectType = 'nonexistent';
      fileSystem.fileExists.mockResolvedValue(false);
      // Act
      const result = await templateRepository.listTemplates(projectType);
      // Assert
      expect(result).toEqual([]);
      expect(fs.readdir).not.toHaveBeenCalled();
    });

    test('should handle errors and return empty array', async () => {
      // Arrange
      const projectType = 'react';
      fileSystem.fileExists.mockResolvedValue(true);
      fs.readdir.mockRejectedValue(new Error('Directory read error'));
      // Act
      const result = await templateRepository.listTemplates(projectType);
      // Assert
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('listProjectTypes method', () => {
    test('should return list of project type directories', async () => {
      // Arrange
      const mockDirs = [
        { name: 'node', isDirectory: () => true },
        { name: 'react', isDirectory: () => true },
        { name: 'next', isDirectory: () => true },
        { name: 'common', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false }, // Should be filtered out
      ];
      fileSystem.fileExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(mockDirs);
      // Act
      const result = await templateRepository.listProjectTypes();
      // Assert
      expect(result).toEqual(['node', 'react', 'next', 'common']);
      expect(fs.readdir).toHaveBeenCalledWith(
        MOCK_TEMPLATES_DIR,
        { withFileTypes: true }
      );
    });

    test('should return empty array if templates directory does not exist', async () => {
      // Arrange
      fileSystem.fileExists.mockResolvedValue(false);
      // Act
      const result = await templateRepository.listProjectTypes();
      // Assert
      expect(result).toEqual([]);
      expect(fs.readdir).not.toHaveBeenCalled();
    });

    test('should handle errors and return empty array', async () => {
      // Arrange
      fileSystem.fileExists.mockResolvedValue(true);
      fs.readdir.mockRejectedValue(new Error('Directory read error'));
      // Act
      const result = await templateRepository.listProjectTypes();
      // Assert
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('hasTemplatesForType method', () => {
    test('should return true if project type directory exists and contains templates', async () => {
      // Arrange
      const projectType = 'react';
      fileSystem.fileExists.mockResolvedValue(true);
      // Mock listTemplates to return some templates
      jest.spyOn(templateRepository, 'listTemplates').mockResolvedValue(['eslintrc.json', 'jest.config.js']);
      // Act
      const result = await templateRepository.hasTemplatesForType(projectType);
      // Assert
      expect(result).toBe(true);
      expect(fileSystem.fileExists).toHaveBeenCalledWith(
        path.join(MOCK_TEMPLATES_DIR, projectType)
      );
      expect(templateRepository.listTemplates).toHaveBeenCalledWith(projectType);
    });

    test('should return false if project type directory does not exist', async () => {
      // Arrange
      const projectType = 'nonexistent';
      fileSystem.fileExists.mockResolvedValue(false);
      const listTemplatesSpy = jest.spyOn(templateRepository, 'listTemplates');
      // Act
      const result = await templateRepository.hasTemplatesForType(projectType);
      // Assert
      expect(result).toBe(false);
      expect(listTemplatesSpy).not.toHaveBeenCalled();
    });

    test('should return false if project type directory exists but has no templates', async () => {
      // Arrange
      const projectType = 'empty';
      fileSystem.fileExists.mockResolvedValue(true);
      // Mock listTemplates to return empty array
      jest.spyOn(templateRepository, 'listTemplates').mockResolvedValue([]);
      // Act
      const result = await templateRepository.hasTemplatesForType(projectType);
      // Assert
      expect(result).toBe(false);
    });

    test('should handle errors and return false', async () => {
      // Arrange
      const projectType = 'react';
      fileSystem.fileExists.mockRejectedValue(new Error('Access error'));
      // Act
      const result = await templateRepository.hasTemplatesForType(projectType);
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});