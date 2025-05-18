# Code Quality System

This directory contains scripts and documentation for setting up a complete code quality system for a node project.

## Overview

The code quality system helps maintain consistent code standards across the entire project by enforcing style rules, identifying potential bugs, ensuring consistent formatting, validating commit messages, testing, and automating code validation as part of the Git workflow.

## Features

### Complete Code Quality Toolchain

- **ESLint**: Static code analysis to identify and fix problematic patterns
- **Prettier**: Automatic code formatting for consistency
- **Jest**: Testing framework for JavaScript with code coverage support
- **Husky**: Git hooks for pre-commit, commit-msg and pre-push validation
- **lint-staged**: Run linters only on staged files for faster validation
- **commitlint**: Enforce conventional commit message format
- **Commitizen**: Interactive prompts for creating properly formatted commit messages
- **Benchmark**: Library available for performance testing
- **Git Configuration**: Proper .gitignore setup for Node.js projects

### Advanced Script Capabilities

- ✅ **Smart Installation**: Only installs missing packages
- ✅ **Version Compatibility Checks**: Verifies package version compatibility
- ✅ **Comprehensive Error Handling**: Detailed error messages with troubleshooting
- ✅ **Git Repository Management**: Initializes Git if needed
- ✅ **Default Configurations**: Pre-configured for ESM (ECMAScript Modules)
- ✅ **.gitignore Creation**: Sets up appropriate ignores for Node.js projects
- ✅ **Automatic Script Registration**: Adds npm scripts to package.json
- ✅ **Test Directory Structure**: Creates basic test structure if needed

## Installation

### Option 1: Using npm Script (Recommended)

If the script is already in your project, simply run:

```bash
npm run setup:quality
```

### Option 2: Manual Execution

```bash
# Make the script executable
chmod +x tools/scripts/quality/setup-code-quality.sh

# Run the script
./tools/scripts/quality/setup-code-quality.sh
```

## What Gets Installed and Configured

### npm Packages

- `eslint` with Airbnb base configuration
- `prettier` for code formatting
- `jest` for testing
- `husky` for Git hooks
- `lint-staged` for running linters on staged files
- `commitlint` for commit message validation
- `commitizen` and `cz-conventional-changelog` for interactive commit message creation
- `benchmark` library for performance testing
- Various plugins for enhanced functionality

### Configuration Files

- `.eslintrc.json`: ESLint rules customized for Node.js/Express projects
- `.prettierrc.json`: Prettier formatting rules
- `.lintstagedrc.json`: Configuration for lint-staged
- `commitlint.config.js`: Rules for commit message format
- `jest.config.js`: Configuration for Jest testing framework
- `.gitignore`: Standard ignores for Node.js projects

### Git Hooks

- `pre-commit`: Runs linters on staged files
- `commit-msg`: Validates commit message format
- `prepare-commit-msg`: Starts Commitizen automatically when committing
- `pre-push`: Runs tests (test:ci) before pushing to remote repositories

### npm Scripts

The following scripts are added to your `package.json`:

- `lint`: Run ESLint to check for code issues
- `lint:fix`: Run ESLint with automatic fixing
- `format`: Run Prettier to format all files
- `commit`: Start the interactive Commitizen prompt
- `prepare`: Set up Husky hooks (runs automatically after npm install)
- `setup:quality`: Re-run the code quality configuration script

#### Testing Scripts

- `test`: Run all Jest tests
- `test:watch`: Run all tests in watch mode
- `test:unit`: Run only unit tests (in src folder)
- `test:unit:watch`: Run unit tests in watch mode
- `test:unit:coverage`: Run unit tests with coverage report
- `test:integration`: Run only integration tests
- `test:integration:watch`: Run integration tests in watch mode
- `test:e2e`: Run only end-to-end tests
- `test:e2e:watch`: Run end-to-end tests in watch mode
- `test:ci`: Run tests optimized for CI environments
- `test:coverage`: Run all tests with coverage report

## Using Commitizen

Commitizen provides an interactive CLI that guides you through creating properly formatted commit messages. There are two ways to use it:

### Option 1: npm script

```bash
git add .
npm run commit
```

### Option 2: Git command

After setting up, you can also use:

```bash
git add .
git cz
```

Both methods will launch an interactive prompt that guides you through the commit process.

## Testing with Jest

The system sets up Jest for testing JavaScript code with support for ECMAScript Modules.

### Organized Test Structure

The testing scripts are organized into three categories:

- **Unit Tests**: Co-located with source code in `src/` (either directly alongside code files or in `src/**/__tests__/` directories)
- **Integration Tests**: Located in the `tests/integration/` directory
- **End-to-End Tests**: Located in the `tests/e2e/` directory

### Test Scripts

```bash
# Run all tests
npm test

# Run unit tests only (co-located with source)
npm run test:unit
npm run test:unit:watch
npm run test:unit:coverage

# Run integration tests only
npm run test:integration
npm run test:integration:watch

# Run end-to-end tests only
npm run test:e2e
npm run test:e2e:watch

# Run tests optimized for CI environments (unit + integration)
npm run test:ci

# Coverage reporting
npm run test:coverage  # All tests
```

### CI Mode

The `test:ci` script is specially designed for Continuous Integration environments, with:

- CI mode enabled (`--ci`)
- Sequential test execution for stability (`--runInBand`)
- Forced exit after completion (`--forceExit`)
- Coverage reporting
- Only unit and integration tests (for speed and reliability)

### Jest Configuration

The `jest.config.js` file includes:

- Node.js environment for server-side testing
- Support for ESM imports
- Coverage reporting configuration
- Test pattern matching
- Path ignore patterns

### Test Directory Structure

The script creates the following structure if it doesn't exist:

```
project/
├── src/
│   ├── feature1/
│   │   ├── feature1.js
│   │   └── __tests__/            # Directory for related tests
│   │       └── feature1.test.js  # Co-located unit test
│   └── ...
└── tests/
    ├── integration/              # Integration tests
    └── e2e/                      # End-to-end tests
```

This structure follows a common testing approach where:

- **Unit tests** are co-located with the code they test (in the same directory within `src/`) for better discoverability and maintenance
- **Integration tests** verify that different components work together correctly
- **End-to-end tests** validate complete workflows from a user perspective

## Performance Testing

The `benchmark` library is included for performance testing of critical code paths. While no specific scripts are created for it, it's available as a development dependency for use as needed in cases where performance optimization is required.

Example usage:

```javascript
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();

// Add tests
suite
  .add('Method A', function () {
    // Implementation of method A
  })
  .add('Method B', function () {
    // Implementation of method B
  })
  // Add listeners
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // Run async
  .run({ async: true });
```

## Workflow Benefits

With this system in place, your development workflow gains:

1. **Consistent Code Style**: All code follows the same formatting and style rules
2. **Early Error Detection**: Catch potential bugs and issues before they're committed
3. **Standardized Commit Messages**: Enforce a clear, conventional commit message format with interactive guidance
4. **Automated Validation**: No need to remember to run linters manually
5. **Cleaner Codebase**: Prevent problematic code patterns from entering the repository
6. **Better Collaboration**: Easier code reviews with consistent formatting and commit messages
7. **Improved Release Management**: Conventional commits enable automated changelog generation
8. **Reduced Technical Debt**: Consistent standards prevent code quality degradation over time
9. **Test Verification**: Ensure code changes don't break existing functionality

## Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification, which provides an easy set of rules for creating an explicit commit history. Each commit message consists of:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

Commitizen will guide you through this format interactively when you run `npm run commit`.

## Customization

After installation, you can customize the configuration files:

- `.eslintrc.json`: Adjust rules based on project requirements
- `.prettierrc.json`: Change formatting preferences
- `.lintstagedrc.json`: Modify which commands run on which file types
- `commitlint.config.js`: Adjust commit message validation rules
- `jest.config.js`: Modify testing configuration

## Requirements

- Node.js 14+
- npm 7+
- Git

## Troubleshooting

If you encounter issues, the script provides detailed error messages and troubleshooting steps. Common issues include:

- **Permission Denied**: Ensure the script has executable permissions
- **Git Not Found**: Ensure Git is installed
- **Package Installation Failures**: Check your internet connection and npm configuration
- **Husky Initialization Errors**: Ensure Git is properly initialized
- **Jest ESM Issues**: Make sure you're using Node.js 14+ and the `--experimental-vm-modules` flag is included

## License

This tool is internal to the Reelaisy API project and is not licensed for external use.

## Author

Created by Alejandro Valencia.