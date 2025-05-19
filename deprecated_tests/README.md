# AVR Quality Scaffold - Testing Guide

This document outlines the testing philosophy, strategies, and guidelines for the AVR Quality Scaffold project.

## Testing Philosophy

AVR Quality Scaffold implements a rigorous black-box testing methodology that ensures high-quality code while maintaining the integrity of the module's architecture.

### Core Principles

- **Public API Testing Only:** All tests interact exclusively with the public interfaces
- **Implementation Independence:** Tests should pass regardless of internal implementation changes
- **Complete Coverage:** Achieve full branch and logic coverage through the public API
- **Isolation:** Each test verifies a specific behavior in isolation

## Testing Structure

The project follows a three-tiered testing approach:

```
tests/
├─ unit/              # Testing individual modules and utilities
├─ integration/       # Testing interactions between modules 
├─ e2e/               # End-to-end CLI workflow testing
```

### Unit Tests

Unit tests verify that individual modules function correctly in isolation:

- Focus on specific behaviors through the public API
- One test per logical behavior
- Mock all external dependencies

### Integration Tests

Integration tests verify interactions between multiple modules:

- Test workflows that span multiple modules
- Verify configuration files are properly generated
- Ensure proper integration between template loading and file generation

### End-to-End Tests

E2E tests validate complete workflows:

- Test CLI commands and flags
- Verify file generation on actual file system
- Test across different project types (Node.js, React, Next.js)

## Black-Box Testing Strategy

Our black-box approach enables testing private functionality through the public interface:

- **Single Responsibility Verification:** Each test validates one specific internal operation
- **Precise Error Assertions:** Verify exact error messages to confirm which validation failed
- **Input Partitioning:** Test boundary values, typical values, and edge cases

Example pattern:

```javascript
// Testing a private validation function through the public API
test('validates string length using public function', () => {
  // Arrange test data that specifically triggers the internal validation
  const tooShortInput = '';

  // Act - call the public API
  const result = publicValidator.validate(tooShortInput);

  // Assert - verify the exact error from the internal validation
  expect(result.errors).toContain('String must not be empty');
  expect(result.errors.length).toBe(1); // Only this validation should fail
});
```

## ESM Testing Setup

The project uses ES modules (ESM) throughout. Jest is configured to properly support ESM testing:

### ESM-Compatible Mocking

```javascript
import { jest } from '@jest/globals';

// Define mocks before importing the module
const mockFunction = jest.fn();
jest.unstable_mockModule('./dependency.js', () => ({
  exportedFunction: mockFunction
}));

// Import the module under test AFTER setting up mocks
const moduleToTest = await import('./module-to-test.js');
```

### Running ESM Tests

Jest is configured to run with Node.js ESM support:

```json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch"
  }
}
```

## Test Implementation Guidelines

Follow these guidelines when implementing tests:

### 1. Test Organization

- Group tests logically using `describe` blocks
- Use descriptive test names that explain the behavior being tested
- Separate test cases for success and failure scenarios

```javascript
describe('Config Generator', () => {
  describe('createConfigFiles', () => {
    // Success cases
    test('creates all configuration files when given valid options', async () => {
      // Test implementation
    });
    
    // Failure cases
    test('throws error when no templates provided', async () => {
      // Test implementation
    });
  });
});
```

### 2. Parameterized Tests

Use `test.each` for multiple test cases with similar logic:

```javascript
describe('validation', () => {
  test.each([
    ['empty string', '', 'String must not be empty'],
    ['too short', 'a', 'String must be at least 3 characters'],
    ['too long', 'abcdefghijk', 'String must be at most 10 characters']
  ])('validates %s', (_, input, expectedError) => {
    const result = validator.validate(input);
    expect(result.errors).toContain(expectedError);
    expect(result.errors.length).toBe(1); // Only one validation should fail
  });
});
```

### 3. Mocking Best Practices

- Create explicit mock functions with `jest.fn()`
- Use `mockImplementation()` or `mockResolvedValue()` for complex behaviors
- Reset mocks between tests with `jest.clearAllMocks()`

```javascript
beforeEach(() => {
  jest.clearAllMocks();
  mockFileExists.mockResolvedValue(false);
});
```

### 4. Asynchronous Testing

Always use `async/await` for asynchronous tests:

```javascript
test('creates configuration asynchronously', async () => {
  // Test implementation with await
  await expect(asyncFunction()).resolves.toBe(expectedValue);
});
```

### 5. File System Testing

Use mocks for file system operations to avoid actual file system changes:

```javascript
jest.unstable_mockModule('fs', () => ({
  promises: {
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    chmod: mockChmod
  }
}));
```

## Running Tests

To run the entire test suite:

```bash
npm test
```

To run specific test categories:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

To run tests with coverage:

```bash
npm run test:coverage
```

To run a specific test file:

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js path/to/test.js
```

## Contributing New Tests

When adding new features, follow these steps:

1. Start with failing tests that describe the expected behavior
2. Implement the feature to make the tests pass
3. Ensure all tests are passing with `npm test`
4. Verify code coverage with `npm run test:coverage`

All PRs should maintain or improve the overall test coverage.