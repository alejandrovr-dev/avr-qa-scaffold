/**
 * @module src/adapters/input/cli/__tests__/commanderAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for Commander adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { createCommanderAdapter } from '../commanderAdapter.js';
import { isCLICommands } from '../../../../ports/input/cliCommandsPort.js';
import { createNullLogger } from '../../../../ports/output/loggerPort.js';

describe('Commander Adapter', () => {
  // Test dependencies
  let logger;
  let inquirerAdapter;
  let commanderAdapter;

  // Setup
  beforeEach(() => {
    // Create a mock logger
    logger = createNullLogger();
    logger.info = jest.fn();
    logger.warning = jest.fn();
    logger.error = jest.fn();

    // Create a mock inquirer adapter
    inquirerAdapter = {
      prompt: jest.fn(),
      confirmAction: jest.fn(),
    };

    // Create the commander adapter with mocked dependencies
    commanderAdapter = createCommanderAdapter({ logger, inquirerAdapter });

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should create a commander adapter that satisfies the CLICommandsPort interface', () => {
    // Assert
    expect(isCLICommands(commanderAdapter)).toBe(true);
  });

  describe('parseArguments method', () => {
    test('should parse default setup command with no arguments', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'setup',
        positional: [],
        options: {
          type: 'node', // default value
          force: false,
          skipInstall: false,
          verbose: false,
        }
      });
    });

    test('should parse setup command with type option', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', '--type', 'react'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'setup',
        positional: [],
        options: {
          type: 'react',
          force: false,
          skipInstall: false,
          verbose: false,
        }
      });
    });

    test('should parse setup command with multiple options', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', '--type', 'next', '--force', '--verbose'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'setup',
        positional: [],
        options: {
          type: 'next',
          force: true,
          skipInstall: false,
          verbose: true,
        }
      });
    });

    test('should parse init command with directory argument', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', 'init', 'my-project'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'init',
        positional: ['my-project'],
        options: {
          type: 'node', // default value
          verbose: false,
        }
      });
    });

    test('should parse init command with directory and options', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', 'init', 'my-react-app', '--type', 'react', '--verbose'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'init',
        positional: ['my-react-app'],
        options: {
          type: 'react',
          verbose: true,
        }
      });
    });

    test('should parse list command', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', 'list'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'list',
        positional: [],
        options: {}
      });
    });

    test('should handle short flags correctly', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', '-t', 'react', '-f', '-s'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'setup',
        positional: [],
        options: {
          type: 'react',
          force: true,
          skipInstall: true,
          verbose: false,
        }
      });
    });

    test('should handle help command', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', '--help'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'help',
        positional: [],
        options: {}
      });
    });

    test('should handle version command', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', '--version'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'version',
        positional: [],
        options: {}
      });
    });

    test('should handle parsing errors gracefully', () => {
      // Arrange
      // Force an error by making the parsing logic fail
      const originalSlice = Array.prototype.slice;
      Array.prototype.slice = () => { throw new Error('Test error'); };
      
      const args = ['node', 'avr-qa-scaffold'];
      // Act
      const result = commanderAdapter.parseArguments(args);
      
      // Restore original method
      Array.prototype.slice = originalSlice;
      
      // Assert
      expect(result).toEqual({
        command: '',
        positional: [],
        options: {}
      });
      expect(logger.error).toHaveBeenCalledWith('Error parsing arguments: Test error');
    });
  });

  describe('executeCommand method', () => {
    test('should execute command and log information', async () => {
      // Arrange
      const commandArgs = {
        command: 'setup',
        positional: [],
        options: { type: 'react' }
      };
      // Act
      await commanderAdapter.executeCommand(commandArgs);
      // Assert
      expect(logger.info).toHaveBeenCalledWith('Executing command: setup');
      expect(logger.info).toHaveBeenCalledWith('Options: {"type":"react"}');
      expect(logger.info).toHaveBeenCalledWith('Command parsing completed successfully');
    });

    test('should log positional arguments when present', async () => {
      // Arrange
      const commandArgs = {
        command: 'init',
        positional: ['my-project'],
        options: { type: 'node' }
      };
      // Act
      await commanderAdapter.executeCommand(commandArgs);
      // Assert
      expect(logger.info).toHaveBeenCalledWith('Executing command: init');
      expect(logger.info).toHaveBeenCalledWith('Positional arguments: my-project');
    });

    test('should handle execution errors', async () => {
      // Arrange
      const commandArgs = {
        command: 'setup',
        positional: [],
        options: {}
      };
      // Force an error by making logger.info throw
      logger.info.mockImplementation(() => {
        throw new Error('Test error');
      });
      // Act & Assert
      await expect(commanderAdapter.executeCommand(commandArgs)).rejects.toThrow('Test error');
      expect(logger.error).toHaveBeenCalledWith('Error executing command: Test error');
    });
  });

  describe('prompt method', () => {
    test('should delegate to inquirer adapter when available', async () => {
      // Arrange
      const expectedResponse = { projectType: 'react', includeTests: true };
      inquirerAdapter.prompt.mockResolvedValue(expectedResponse);
      // Act
      const result = await commanderAdapter.prompt();
      // Assert
      expect(result).toBe(expectedResponse);
      expect(inquirerAdapter.prompt).toHaveBeenCalledTimes(1);
    });

    test('should return empty object when inquirer adapter is not available', async () => {
      // Arrange
      const adapterWithoutInquirer = createCommanderAdapter({ logger });
      // Act
      const result = await adapterWithoutInquirer.prompt();
      // Assert
      expect(result).toEqual({});
      expect(logger.warning).toHaveBeenCalledWith('No inquirer adapter provided for prompts');
    });
  });

  describe('confirmAction method', () => {
    test('should delegate to inquirer adapter when available', async () => {
      // Arrange
      const message = 'Are you sure you want to continue?';
      inquirerAdapter.confirmAction.mockResolvedValue(true);
      // Act
      const result = await commanderAdapter.confirmAction(message);
      // Assert
      expect(result).toBe(true);
      expect(inquirerAdapter.confirmAction).toHaveBeenCalledWith(message);
    });

    test('should return false when inquirer adapter is not available', async () => {
      // Arrange
      const adapterWithoutInquirer = createCommanderAdapter({ logger });
      const message = 'Are you sure?';
      // Act
      const result = await adapterWithoutInquirer.confirmAction(message);
      // Assert
      expect(result).toBe(false);
      expect(logger.warning).toHaveBeenCalledWith('No inquirer adapter provided for confirmation');
    });
  });
});