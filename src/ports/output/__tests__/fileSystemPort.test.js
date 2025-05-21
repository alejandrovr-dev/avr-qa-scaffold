/**
 * @module src/ports/output/__tests__/fileSystemPort.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for file system port interface following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isFileSystem, createNullFileSystem } from '../fileSystemPort.js';

describe('FileSystemPort', () => {
  describe('isFileSystem function', () => {
    test('should return true for objects implementing FileSystemPort interface', () => {
      // Arrange
      const validFileSystem = {
        createDirIfNotExists: jest.fn(),
        fileExists: jest.fn(),
        getAbsolutePath: jest.fn(),
        formatPath: jest.fn(),
        getPackageRoot: jest.fn(),
      };
      // Act
      const result = isFileSystem(validFileSystem);
      // Assert
      expect(result).toBe(true);
    });

    test('should return false for objects missing required methods', () => {
      // Arrange
      const incompleteFS1 = {
        // Missing createDirIfNotExists
        fileExists: jest.fn(),
        getAbsolutePath: jest.fn(),
        formatPath: jest.fn(),
        getPackageRoot: jest.fn(),
      };
      const incompleteFS2 = {
        createDirIfNotExists: jest.fn(),
        fileExists: jest.fn(),
        getAbsolutePath: jest.fn(),
        formatPath: jest.fn(),
        // Missing getPackageRoot
      };
      // Act
      const result1 = isFileSystem(incompleteFS1);
      const result2 = isFileSystem(incompleteFS2);
      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should return false for objects with non-function properties', () => {
      // Arrange
      const invalidFS = {
        createDirIfNotExists: jest.fn(),
        fileExists: 'not a function',
        getAbsolutePath: jest.fn(),
        formatPath: jest.fn(),
        getPackageRoot: jest.fn(),
      };
      // Act
      const result = isFileSystem(invalidFS);
      // Assert
      expect(result).toBe(false);
    });

    test.each([
      // Arrange
      { testName: 'should return false for null', value: null },
      { testName: 'should return false for undefined', value: undefined },
      { testName: 'should return false for numbers', value: 42 },
      { testName: 'should return false for strings', value: 'string' },
      { testName: 'should return false for booleans', value: true },
      { testName: 'should return false for arrays', value: [ jest.fn() ] },
    ])('$testName', ({ value }) => {
      // Act
      const result = isFileSystem(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createNullFileSystem function', () => {
    test('should return an object implementing FileSystemPort interface', () => {
      // Arrange
      const nullFS = createNullFileSystem();
      // Act
      const result = isFileSystem(nullFS);
      // Assert
      expect(result).toBe(true);
    });

    test('createDirIfNotExists should return false', async () => {
      // Arrange
      const nullFS = createNullFileSystem();
      // Act
      const result = await nullFS.createDirIfNotExists('some/dir/path');
      // Assert
      expect(result).toBe(false);
    });

    test('fileExists should return false', async () => {
      // Arrange
      const nullFS = createNullFileSystem();
      // Act
      const result = await nullFS.fileExists('some/file/path');
      // Assert
      expect(result).toBe(false);
    });

    test('getAbsolutePath should return the input path unchanged', () => {
      // Arrange
      const nullFS = createNullFileSystem();
      const testPath = 'test/path';
      // Act
      const result = nullFS.getAbsolutePath(testPath);
      // Assert
      expect(result).toBe(testPath);
    });

    test('formatPath should return the input path unchanged', () => {
      // Arrange
      const nullFS = createNullFileSystem();
      const testPath = 'test/path';
      // Act
      const result = nullFS.formatPath(testPath);
      // Assert
      expect(result).toBe(testPath);
    });

    test('getPackageRoot should return an empty string', () => {
      // Arrange
      const nullFS = createNullFileSystem();
      // Act
      const result = nullFS.getPackageRoot();
      // Assert
      expect(result).toBe('');
    });
  });
});