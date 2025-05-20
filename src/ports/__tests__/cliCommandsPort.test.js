/**
 * @module src/ports/__tests__/cliCommandsPort.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for CLI commands port interface following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isCLICommands, createNullCLICommands } from '../cliCommandsPort.js';

describe('CLICommandsPort', () => {
  describe('isCLICommands function', () => {
    test('should return true for objects implementing CLICommandsPort interface', () => {
      // Arrange
      const validCLICommands = {
        parseArguments: jest.fn(),
        executeCommand: jest.fn(),
        prompt: jest.fn(),
        confirmAction: jest.fn(),
      };
      // Act
      const result = isCLICommands(validCLICommands);
      // Assert
      expect(result).toBe(true);
    });

    test('should return false for objects missing required methods', () => {
      // Arrange
      const incompleteCLICommands1 = {
        // Missing parseArguments
        executeCommand: jest.fn(),
        prompt: jest.fn(),
        confirmAction: jest.fn(),
      };
      const incompleteCLICommands2 = {
        parseArguments: jest.fn(),
        executeCommand: jest.fn(),
        prompt: jest.fn(),
        // Missing confirmAction
      };
      // Act
      const result1 = isCLICommands(incompleteCLICommands1);
      const result2 = isCLICommands(incompleteCLICommands2);
      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should return false for objects with non-function properties', () => {
      // Arrange
      const invalidCLICommands = {
        parseArguments: jest.fn(),
        executeCommand: 'not a function',
        prompt: jest.fn(),
        confirmAction: jest.fn(),
      };
      // Act
      const result = isCLICommands(invalidCLICommands);
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
      const result = isCLICommands(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createNullCLICommands function', () => {
    test('should return an object implementing CLICommandsPort interface', () => {
      // Arrange
      const nullCLICommands = createNullCLICommands();
      // Act
      const result = isCLICommands(nullCLICommands);
      // Assert
      expect(result).toBe(true);
    });

    test('parseArguments should return an empty command object', () => {
      // Arrange
      const nullCLICommands = createNullCLICommands();
      // Act
      const result = nullCLICommands.parseArguments(['node', 'script.js', 'command']);
      // Assert
      expect(result).toEqual({ command: '', positional: [], options: {} });
    });

    test('executeCommand should do nothing', async () => {
      // Arrange
      const nullCLICommands = createNullCLICommands();
      const command = { command: 'init', positional: ['my-project'], options: { type: 'node' } };
      // Act
      const result = await nullCLICommands.executeCommand(command);
      // Assert
      expect(result).toBeUndefined();
    });

    test('prompt should return an empty object', async () => {
      // Arrange
      const nullCLICommands = createNullCLICommands();
      // Act
      const result = await nullCLICommands.prompt();
      // Assert
      expect(result).toEqual({});
    });

    test('confirmAction should return false', async () => {
      // Arrange
      const nullCLICommands = createNullCLICommands();
      // Act
      const result = await nullCLICommands.confirmAction('Are you sure?');
      // Assert
      expect(result).toBe(false);
    });
  });
});