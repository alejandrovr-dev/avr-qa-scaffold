/**
 * @module src/adapters/output/git/__tests__/gitAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for Git adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-25
 * @lastModified 2025-05-25
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

// Static imports
import { jest } from '@jest/globals';
import path from 'path';
import { isGit } from '../../../../ports/output/gitPort.js';
import { createNullLogger } from '../../../../ports/output/loggerPort.js';
import { createNullFileSystem } from '../../../../ports/output/fileSystemPort.js';

/**
 * Create manual mock for execa
 */
const mockExeca = jest.fn();
/** 
 * Mock the execa module (substituting real module with our manual mock)
 * This tells Jest: "whenever any module tries to import 'execa', return this mock object instead"
 */
jest.unstable_mockModule('execa', () => ({
  execa: mockExeca
}));
/**
 * Dynamic imports after mocking
 * Import the dependencies after they have been mocked (for our own use in tests)
 * This import will receive our mocked versions, not the real dependencies
 */
const { execa } = await import('execa');
/**
 * Import the adapter after mocking dependencies
 * When the adapter internally executes 'import { execa } from "execa"',
 * it will receive our mocked execa instead of the real one, transparently
 */
const { createGitAdapter } = await import('../gitAdapter.js');

describe('Git Adapter', () => {
  // Test dependencies
  let logger;
  let fileSystem;
  let gitAdapter;

  // Setup
  beforeEach(() => {
    // Create a mock logger
    logger = createNullLogger();
    logger.info = jest.fn();
    logger.error = jest.fn();

    // Create a mock file system
    fileSystem = createNullFileSystem();
    fileSystem.fileExists = jest.fn();

    // Create the git adapter with mocked dependencies
    gitAdapter = createGitAdapter({ logger, fileSystem });

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should create a git adapter that satisfies the GitPort interface', () => {
    // Assert
    expect(isGit(gitAdapter)).toBe(true);
  });

  describe('isRepository method', () => {
    test('should return true if .git directory exists', async () => {
      // Arrange
      const cwd = '/test/project';
      const expectedGitDir = path.join(cwd, '.git');
      fileSystem.fileExists.mockResolvedValue(true);
      // Act
      const result = await gitAdapter.isRepository(cwd);
      // Assert
      expect(result).toBe(true);
      expect(fileSystem.fileExists).toHaveBeenCalledWith(expectedGitDir);
    });

    test('should return false if .git directory does not exist', async () => {
      // Arrange
      const cwd = '/test/project';
      fileSystem.fileExists.mockResolvedValue(false);
      // Act
      const result = await gitAdapter.isRepository(cwd);
      // Assert
      expect(result).toBe(false);
    });

    test('should use current working directory by default', async () => {
      // Arrange
      const expectedGitDir = path.join(process.cwd(), '.git');
      fileSystem.fileExists.mockResolvedValue(true);
      // Act
      const result = await gitAdapter.isRepository();
      // Assert
      expect(result).toBe(true);
      expect(fileSystem.fileExists).toHaveBeenCalledWith(expectedGitDir);
    });

    test('should handle errors and return false', async () => {
      // Arrange
      const cwd = '/test/project';
      fileSystem.fileExists.mockRejectedValue(new Error('Access denied'));
      // Act
      const result = await gitAdapter.isRepository(cwd);
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error checking if /test/project is a Git repository')
      );
    });
  });

  describe('init method', () => {
    test('should initialize git repository successfully', async () => {
      // Arrange
      const cwd = '/test/project';
      // Mock that it's not already a repository
      jest.spyOn(gitAdapter, 'isRepository').mockResolvedValue(false);
      execa.mockResolvedValue({ stdout: 'Initialized empty Git repository' });
      // Act
      const result = await gitAdapter.init(cwd);
      // Assert
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['init'], {
        cwd,
        stdio: 'pipe'
      });
      expect(logger.info).toHaveBeenCalledWith('Git repository initialized successfully');
    });

    test('should return true if repository already exists', async () => {
      // Arrange
      const cwd = '/test/project';
      // Mock that it's already a repository
      jest.spyOn(gitAdapter, 'isRepository').mockResolvedValue(true);
      // Act
      const result = await gitAdapter.init(cwd);
      // Assert
      expect(result).toBe(true);
      expect(execa).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Git repository already initialized');
    });

    test('should use current working directory by default', async () => {
      // Arrange
      jest.spyOn(gitAdapter, 'isRepository').mockResolvedValue(false);
      execa.mockResolvedValue({ stdout: 'Initialized empty Git repository' });
      // Act
      const result = await gitAdapter.init();
      // Assert
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['init'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });
    });

    test('should handle git init errors', async () => {
      // Arrange
      const cwd = '/test/project';
      jest.spyOn(gitAdapter, 'isRepository').mockResolvedValue(false);
      execa.mockRejectedValue(new Error('Git not found'));
      // Act
      const result = await gitAdapter.init(cwd);
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize Git repository: Git not found')
      );
    });

    test('should handle isRepository check errors', async () => {
      // Arrange
      const cwd = '/test/project';
      jest.spyOn(gitAdapter, 'isRepository').mockRejectedValue(new Error('Check failed'));
      // Act
      const result = await gitAdapter.init(cwd);
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize Git repository: Check failed')
      );
    });
  });
});