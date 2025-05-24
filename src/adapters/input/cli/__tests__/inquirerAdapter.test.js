/**
 * @module src/adapters/input/cli/__tests__/inquirerAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for Inquirer adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isCLICommands } from '../../../../ports/input/cliCommandsPort.js';
import { createNullLogger } from '../../../../ports/output/loggerPort.js';

/**
 * Create manual mock for inquirer
 */
const mockInquirerPrompt = jest.fn();
/**
 * Mock the inquirer module (substituting real module with our manual mock)
 * This tells Jest: "whenever any module tries to import 'inquirer',
 * return this mock object instead"
 */
jest.unstable_mockModule('inquirer', () => ({
  default: {
    prompt: mockInquirerPrompt
  }
}));

/**
 * Dynamic imports after mocking
 * Import the dependencies after they have been mocked (for our own use in tests)
 * This import will receive our mocked versions, not the real dependencies
 */
const inquirer = await import('inquirer');
/**
 * Import the adapter after mocking dependencies
 * When the adapter internally executes 'import inquirer from "inquirer"',
 * it will receive our mocked inquirer instead of the real one, transparently
 */
const { createInquirerAdapter } = await import('../inquirerAdapter.js');

describe('Inquirer Adapter', () => {
  // Test dependencies
  let logger;
  let inquirerAdapter;

  // Setup
  beforeEach(() => {
    // Create a mock logger
    logger = createNullLogger();
    logger.info = jest.fn();
    logger.error = jest.fn();

    // Create the inquirer adapter with mocked dependencies
    inquirerAdapter = createInquirerAdapter({ logger });

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should create an inquirer adapter that satisfies the CLICommandsPort interface', () => {
    // Assert
    expect(isCLICommands(inquirerAdapter)).toBe(true);
  });

  describe('parseArguments method', () => {
    test('should return interactive command with positional arguments', () => {
      // Arrange
      const args = ['node', 'avr-qa-scaffold', 'some', 'args'];
      // Act
      const result = inquirerAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'interactive',
        positional: ['some', 'args'],
        options: {}
      });
    });

    test('should handle empty arguments', () => {
      // Arrange
      const args = ['node', 'script.js'];
      // Act
      const result = inquirerAdapter.parseArguments(args);
      // Assert
      expect(result).toEqual({
        command: 'interactive',
        positional: [],
        options: {}
      });
    });
  });

  describe('executeCommand method', () => {
    test('should execute interactive command and call prompt', async () => {
      // Arrange
      const commandArgs = {
        command: 'interactive',
        positional: [],
        options: {}
      };
      const mockPromptResponse = { projectType: 'react' };
      
      // Mock the prompt method
      jest.spyOn(inquirerAdapter, 'prompt').mockResolvedValue(mockPromptResponse);
      
      // Act
      const result = await inquirerAdapter.executeCommand(commandArgs);
      
      // Assert
      expect(result).toBe(mockPromptResponse);
      expect(logger.info).toHaveBeenCalledWith('Starting interactive mode...');
      expect(logger.info).toHaveBeenCalledWith('Interactive session completed');
      expect(inquirerAdapter.prompt).toHaveBeenCalledTimes(1);
    });

    test('should handle execution errors', async () => {
      // Arrange
      const commandArgs = {
        command: 'interactive',
        positional: [],
        options: {}
      };
      
      // Mock prompt to throw an error
      jest.spyOn(inquirerAdapter, 'prompt').mockRejectedValue(new Error('Prompt error'));
      
      // Act & Assert
      await expect(inquirerAdapter.executeCommand(commandArgs)).rejects.toThrow('Prompt error');
      expect(logger.error).toHaveBeenCalledWith('Error in interactive mode: Prompt error');
    });
  });

  describe('prompt method', () => {
    test('should prompt for project setup preferences', async () => {
      // Arrange
      const mockAnswers = {
        projectType: 'react',
        includeTests: true,
        includeHusky: true,
        includeCommitizen: false,
        overrideExisting: true
      };
      mockInquirerPrompt.mockResolvedValue(mockAnswers);
      
      // Act
      const result = await inquirerAdapter.prompt();
      
      // Assert
      expect(result).toBe(mockAnswers);
      expect(mockInquirerPrompt).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('User preferences collected successfully');
      
      // Verify the questions structure
      const questions = mockInquirerPrompt.mock.calls[0][0];
      expect(questions).toHaveLength(5);
      expect(questions[0].name).toBe('projectType');
      expect(questions[1].name).toBe('includeTests');
      expect(questions[2].name).toBe('includeHusky');
      expect(questions[3].name).toBe('includeCommitizen');
      expect(questions[4].name).toBe('overrideExisting');
    });

    test('should handle prompt errors and return empty object', async () => {
      // Arrange
      mockInquirerPrompt.mockRejectedValue(new Error('Inquirer error'));
      
      // Act
      const result = await inquirerAdapter.prompt();
      
      // Assert
      expect(result).toEqual({});
      expect(logger.error).toHaveBeenCalledWith('Error during prompts: Inquirer error');
    });

    test('should include correct project type choices', async () => {
      // Arrange
      mockInquirerPrompt.mockResolvedValue({ projectType: 'node' });
      
      // Act
      await inquirerAdapter.prompt();
      
      // Assert
      const questions = mockInquirerPrompt.mock.calls[0][0];
      const projectTypeQuestion = questions.find(q => q.name === 'projectType');
      
      expect(projectTypeQuestion.choices).toEqual([
        { name: 'Node.js application or library', value: 'node' },
        { name: 'React application', value: 'react' },
        { name: 'Next.js application', value: 'next' }
      ]);
      expect(projectTypeQuestion.default).toBe('node');
    });
  });

  describe('confirmAction method', () => {
    test('should ask for confirmation and return true', async () => {
      // Arrange
      const message = 'Are you sure you want to continue?';
      mockInquirerPrompt.mockResolvedValue({ confirmed: true });
      
      // Act
      const result = await inquirerAdapter.confirmAction(message);
      
      // Assert
      expect(result).toBe(true);
      expect(mockInquirerPrompt).toHaveBeenCalledWith([{
        type: 'confirm',
        name: 'confirmed',
        message: message,
        default: false
      }]);
    });

    test('should ask for confirmation and return false', async () => {
      // Arrange
      const message = 'Delete all files?';
      mockInquirerPrompt.mockResolvedValue({ confirmed: false });
      
      // Act
      const result = await inquirerAdapter.confirmAction(message);
      
      // Assert
      expect(result).toBe(false);
    });

    test('should handle confirmation errors and return false', async () => {
      // Arrange
      const message = 'Confirm action?';
      mockInquirerPrompt.mockRejectedValue(new Error('Confirmation error'));
      
      // Act
      const result = await inquirerAdapter.confirmAction(message);
      
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error during confirmation: Confirmation error');
    });
  });

  describe('promptProjectInit method', () => {
    test('should prompt for project initialization details', async () => {
      // Arrange
      const mockAnswers = {
        directory: 'my-awesome-project',
        projectType: 'next',
        description: 'A Next.js application',
        author: 'John Doe'
      };
      mockInquirerPrompt.mockResolvedValue(mockAnswers);
      
      // Act
      const result = await inquirerAdapter.promptProjectInit('default-project');
      
      // Assert
      expect(result).toBe(mockAnswers);
      expect(logger.info).toHaveBeenCalledWith('Project initialization details collected');
      
      // Verify the questions structure
      const questions = mockInquirerPrompt.mock.calls[0][0];
      expect(questions).toHaveLength(4);
      expect(questions[0].name).toBe('directory');
      expect(questions[0].default).toBe('default-project');
      expect(questions[1].name).toBe('projectType');
      expect(questions[2].name).toBe('description');
      expect(questions[3].name).toBe('author');
    });

    test('should validate directory name input', async () => {
      // Arrange
      mockInquirerPrompt.mockResolvedValue({ directory: 'valid-name' });
      
      // Act
      await inquirerAdapter.promptProjectInit();
      
      // Assert
      const questions = mockInquirerPrompt.mock.calls[0][0];
      const directoryQuestion = questions.find(q => q.name === 'directory');
      
      // Test validation function
      expect(directoryQuestion.validate('')).toBe('Directory name cannot be empty');
      expect(directoryQuestion.validate('   ')).toBe('Directory name cannot be empty');
      expect(directoryQuestion.validate('invalid name!')).toBe('Directory name can only contain letters, numbers, hyphens, and underscores');
      expect(directoryQuestion.validate('valid-name_123')).toBe(true);
    });

    test('should handle project init errors and return defaults', async () => {
      // Arrange
      const defaultDirectory = 'fallback-project';
      mockInquirerPrompt.mockRejectedValue(new Error('Init error'));
      
      // Act
      const result = await inquirerAdapter.promptProjectInit(defaultDirectory);
      
      // Assert
      expect(result).toEqual({
        directory: defaultDirectory,
        projectType: 'node',
        description: '',
        author: ''
      });
      expect(logger.error).toHaveBeenCalledWith('Error during project init prompts: Init error');
    });

    test('should use default directory when none provided', async () => {
      // Arrange
      mockInquirerPrompt.mockResolvedValue({ directory: 'test' });
      
      // Act
      await inquirerAdapter.promptProjectInit();
      
      // Assert
      const questions = mockInquirerPrompt.mock.calls[0][0];
      const directoryQuestion = questions.find(q => q.name === 'directory');
      expect(directoryQuestion.default).toBe('my-project');
    });
  });
});