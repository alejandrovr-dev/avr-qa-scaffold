/**
 * @module src/adapters/output/logger/__tests__/consoleAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for console adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-18
 * @lastModified 2025-05-21
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

// Static imports
import { jest, test } from '@jest/globals';
import figures from 'figures';
import { createConsoleLogger } from '../consoleAdapter.js';
import { isLogger } from '../../../../ports/output/loggerPort.js'

describe('Console Logger Adapter', () => {
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

  test('should create a logger that satisfies the LoggerPort interface', () => {
    // Arrange & Act
    const logger = createConsoleLogger();
    // Assert
    expect(isLogger(logger)).toBe(true);
  });

  test.each([
    // Arrange
    { methodName: 'success', figure: figures.tick },
    { methodName: 'info', figure: figures.info },
    { methodName: 'warning', figure: figures.warning },
    { methodName: 'error', figure: figures.cross },
  ])('Method $methodName should log a message with $figure', ({ methodName, figure }) => {
    const logger = createConsoleLogger();
    const message = 'Test success message';
    // Act
    logger[methodName](message);
    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(figure);
    expect(consoleSpy.mock.calls[0][0]).toContain(message);
  });

  test('showHeader should log a formatted header with the specified title', () => {
    // Arrange
    const logger = createConsoleLogger();
    const title = 'Test Header';
    // Act
    logger.showHeader(title);
    // Assert
    // Should call console.log 3 times: for the top line, title, and bottom line
    expect(consoleSpy).toHaveBeenCalledTimes(3);
    // The middle call should contain our title
    expect(consoleSpy.mock.calls[1][0]).toContain(title);
  });

  test('showHeader should use the specified color and handle invalid colors', () => {
    // Arrange
    const logger = createConsoleLogger();
    const title = 'Colored Header';
    // Different colors should all work without errors
    // Act - Test red color
    logger.showHeader(title, 'red');
    expect(consoleSpy).toHaveBeenCalledTimes(3);
    consoleSpy.mockClear();
    // Act - Test invalid color (should use default blue)
    logger.showHeader(title, 'invalid-color');
    expect(consoleSpy).toHaveBeenCalledTimes(3);
  });
});
