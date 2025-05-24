/**
 * @module src/adapters/input/cli/__tests__/cliDisplayAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for CLI display adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { createCLIDisplay } from '../cliDisplayAdapter.js';
import { isCLI } from '../../../../ports/input/cliPort.js';

describe('CLI Display Adapter', () => {
  // Spies
  let consoleSpy;

  // Setup
  beforeEach(() => {
    // Mock console.log before each test
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  // Teardown
  afterEach(() => {
    // Restore the original console.log after each test
    consoleSpy.mockRestore();
  });

  test('should create a CLI display that satisfies the CLIPort interface', () => {
    // Arrange & Act
    const cliDisplay = createCLIDisplay();
    // Assert
    expect(isCLI(cliDisplay)).toBe(true);
  });

  test('printAvailableCommands should display all available commands', () => {
    // Arrange
    const cliDisplay = createCLIDisplay();
    // Act
    cliDisplay.printAvailableCommands();
    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(7); // Header + 6 command lines
    
    // Verify the header is displayed
    expect(consoleSpy.mock.calls[0][0]).toContain('Available Commands:');
    
    // Verify key commands are displayed
    const allOutput = consoleSpy.mock.calls.map(call => call[0]).join(' ');
    expect(allOutput).toContain('avr-qa-scaffold');
    expect(allOutput).toContain('--type react');
    expect(allOutput).toContain('init my-project');
    expect(allOutput).toContain('--type next');
    expect(allOutput).toContain('list');
    expect(allOutput).toContain('--help');
  });

  test('printProjectTypes should display all project types', () => {
    // Arrange
    const cliDisplay = createCLIDisplay();
    // Act
    cliDisplay.printProjectTypes();
    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(4); // Header + 3 project types
    
    // Verify the header is displayed
    expect(consoleSpy.mock.calls[0][0]).toContain('Available Project Types:');
    
    // Verify all project types are displayed
    const allOutput = consoleSpy.mock.calls.map(call => call[0]).join(' ');
    expect(allOutput).toContain('node');
    expect(allOutput).toContain('Node.js application or library');
    expect(allOutput).toContain('react');
    expect(allOutput).toContain('React application');
    expect(allOutput).toContain('next');
    expect(allOutput).toContain('Next.js application');
  });

  test('should use chalk for colored output', () => {
    // Arrange
    const cliDisplay = createCLIDisplay();
    // Act
    cliDisplay.printAvailableCommands();
    // Assert
    // Verify that colored text is being used (chalk adds ANSI codes)
    const allOutput = consoleSpy.mock.calls.map(call => call[0]).join('');
    // ANSI escape codes for colors should be present
    expect(allOutput).toMatch(/\u001b\[\d+m/); // Contains ANSI color codes
  });

  test('should handle multiple consecutive calls without interference', () => {
    // Arrange
    const cliDisplay = createCLIDisplay();
    // Act
    cliDisplay.printAvailableCommands();
    cliDisplay.printProjectTypes();
    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(11); // 7 + 4 calls total
    
    // Verify both outputs are present
    const allOutput = consoleSpy.mock.calls.map(call => call[0]).join(' ');
    expect(allOutput).toContain('Available Commands:');
    expect(allOutput).toContain('Available Project Types:');
  });
});