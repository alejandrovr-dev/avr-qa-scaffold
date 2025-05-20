/**
 * @module src/ports/__tests__/loggerPort.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for logger port interface following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-18
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isLogger, createNullLogger } from '../loggerPort.js';

describe('LoggerPort', () => {
  describe('isLogger function', () => {
    test('should return true for objects implementing LoggerPort interface', () => {
      // Arrange
      const validLogger = {
        success: jest.fn(),
        info: jest.fn(),
        warning: jest.fn(),
        error: jest.fn(),
        showHeader: jest.fn(),
      };

      // Act
      const result = isLogger(validLogger);

      // Assert
      expect(result).toBe(true);
    });

    test('should return false for objects missing required methods', () => {
      // Arrange
      const incompleteLogger1 = {
        // Missing success
        info: jest.fn(),
        warning: jest.fn(),
        error: jest.fn(),
        showHeader: jest.fn(),
      };
      const incompleteLogger2 = {
        success: jest.fn(),
        info: jest.fn(),
        warning: jest.fn(),
        error: jest.fn(),
        // Missing showHeader
      };
      // Act
      const result1 = isLogger(incompleteLogger1);
      const result2 = isLogger(incompleteLogger2);
      //Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should return false for objects with non-function properties', () => {
      // Arrange
      const invalidLogger = {
        success: jest.fn(),
        info: 'not a function',
        warning: jest.fn(),
        error: jest.fn(),
        showHeader: jest.fn(),
      };
      // Act
      const result = isLogger(invalidLogger);
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
      const result = isLogger(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createNullLogger function', () => {
    test('should return an object implementing LoggerPort interface', () => {
      // Arrange
      const nullLogger = createNullLogger();
      // Act
      const result = isLogger(nullLogger);
      // Assert
      expect(result).toBe(true);
    });

    test('should return a logger with methods that do nothing', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const nullLogger = createNullLogger();
      // Act
      nullLogger.success('test');
      nullLogger.info('test');
      nullLogger.warning('test');
      nullLogger.error('test');
      nullLogger.showHeader('test');
      // Assert
      expect(consoleSpy).not.toHaveBeenCalled();
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});