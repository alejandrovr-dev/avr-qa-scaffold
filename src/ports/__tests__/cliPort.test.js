/**
 * @module src/ports/__tests__/cliPort.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for CLI port interface following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isCLI, createNullCLI } from '../cliPort.js';

describe('CLIPort', () => {
  describe('isCLI function', () => {
    test('should return true for objects implementing CLIPort interface', () => {
      // Arrange
      const validCLI = {
        printAvailableCommands: jest.fn(),
        printProjectTypes: jest.fn(),
      };
      // Act
      const result = isCLI(validCLI);
      // Assert
      expect(result).toBe(true);
    });

    test('should return false for objects missing required methods', () => {
      // Arrange
      const incompleteCLI1 = {
        // Missing printAvailableCommands
        printProjectTypes: jest.fn(),
      };
      const incompleteCLI2 = {
        printAvailableCommands: jest.fn(),
        // Missing printProjectTypes
      };
      // Act
      const result1 = isCLI(incompleteCLI1);
      const result2 = isCLI(incompleteCLI2);
      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should return false for objects with non-function properties', () => {
      // Arrange
      const invalidCLI = {
        printAvailableCommands: jest.fn(),
        printProjectTypes: 'not a function',
      };
      // Act
      const result = isCLI(invalidCLI);
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
      const result = isCLI(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createNullCLI function', () => {
    test('should return an object implementing CLIPort interface', () => {
      // Arrange
      const nullCLI = createNullCLI();
      // Act
      const result = isCLI(nullCLI);
      // Assert
      expect(result).toBe(true);
    });

    test('methods should do nothing when called', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const nullCLI = createNullCLI();
      // Act
      nullCLI.printAvailableCommands();
      nullCLI.printProjectTypes();
      // Assert
      expect(consoleSpy).not.toHaveBeenCalled();
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});