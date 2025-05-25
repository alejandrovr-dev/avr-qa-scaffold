/**
 * @module src/ports/output/__tests__/gitPort.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for Git port interface following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-25
 * @lastModified 2025-05-25
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isGit, createNullGit } from '../gitPort.js';

describe('GitPort', () => {
  describe('isGit function', () => {
    test('should return true for objects implementing GitPort interface', () => {
      // Arrange
      const validGit = {
        isRepository: jest.fn(),
        init: jest.fn(),
      };
      // Act
      const result = isGit(validGit);
      // Assert
      expect(result).toBe(true);
    });

    test('should return false for objects missing required methods', () => {
      // Arrange
      const incompleteGit1 = {
        // Missing isRepository
        init: jest.fn(),
      };
      const incompleteGit2 = {
        isRepository: jest.fn(),
        // Missing init
      };
      // Act
      const result1 = isGit(incompleteGit1);
      const result2 = isGit(incompleteGit2);
      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should return false for objects with non-function properties', () => {
      // Arrange
      const invalidGit = {
        isRepository: jest.fn(),
        init: 'not a function',
      };
      // Act
      const result = isGit(invalidGit);
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
      const result = isGit(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createNullGit function', () => {
    test('should return an object implementing GitPort interface', () => {
      // Arrange
      const nullGit = createNullGit();
      // Act
      const result = isGit(nullGit);
      // Assert
      expect(result).toBe(true);
    });

    test('isRepository should return false', async () => {
      // Arrange
      const nullGit = createNullGit();
      // Act
      const result = await nullGit.isRepository('/some/path');
      // Assert
      expect(result).toBe(false);
    });

    test('init should return true', async () => {
      // Arrange
      const nullGit = createNullGit();
      // Act
      const result = await nullGit.init('/some/path');
      // Assert
      expect(result).toBe(true);
    });
  });
});