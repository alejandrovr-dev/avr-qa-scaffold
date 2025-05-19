# AVR Quality Scaffold

Quickly establish a professional code quality foundation for Node.js, React, or Next.js applications with a single command.

[![NPM Version](https://img.shields.io/npm/v/avr-qa-scaffold.svg)](https://www.npmjs.com/package/avr-qa-scaffold)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

## Features

### Complete Code Quality Toolchain

- **ESLint**: Static code analysis with project-specific rules
- **Prettier**: Automatic code formatting with consistent settings
- **Jest**: Testing framework with appropriate configuration
- **Husky**: Git hooks for pre-commit, commit-msg and pre-push validation
- **lint-staged**: Run linters only on staged files for efficient validations
- **commitlint**: Enforce conventional commit message format
- **Commitizen**: Interactive prompts for structured commit messages

### Project-Specific Configuration

- **Node.js**: ESM configuration, appropriate directories, and Node-specific ESLint rules
- **React**: Component testing setup, React hooks rules, JSX a11y guidelines
- **Next.js**: App router configuration, Next.js-specific ESLint config, and project structure

### Smart Setup Process

- ✅ **Cross-platform compatibility**: Works on Windows, macOS, and Linux
- ✅ **Auto-detection**: Identifies project types and existing configurations
- ✅ **Compatibility checking**: Verifies tool version compatibility
- ✅ **Minimal installation**: Only installs what's missing
- ✅ **Non-destructive**: Preserves existing configurations by default

## Quick Start

### Installing in an Existing Project

```bash
# Run directly with npx (no installation required)
npx avr-qa-scaffold

# Specify a project type
npx avr-qa-scaffold --type react
```

### Creating a New Project

```bash
# Create a new Node.js project
npx avr-qa-scaffold init my-node-project

# Create a new React project
npx avr-qa-scaffold init my-react-app --type react

# Create a new Next.js project
npx avr-qa-scaffold init my-next-app --type next
```

## Command Options

### Global Options

```
--type <type>     Specify project type: node, react, or next (default: node)
--verbose         Show detailed output during setup
--help, -h        Display help information
--version, -v     Display version number
```

### Setup Options (Default Command)

```
--force           Override existing configurations (default: false)
--skip-install    Skip installing npm dependencies (default: false)
```

### Init Options

```
--type <type>     Specify project type: node, react, or next (default: node)
```

## Detailed Usage

### Configuring an Existing Project

By default, `avr-qa-scaffold` detects and preserves existing configurations when possible:

```bash
# Basic usage - detects project type and sets up appropriate tools
npx avr-qa-scaffold

# Specify project type explicitly
npx avr-qa-scaffold --type react

# Override existing configurations
npx avr-qa-scaffold --force

# Show detailed output during setup
npx avr-qa-scaffold --verbose
```

### Creating a New Project

The `init` command creates a new project with quality tools pre-configured:

```bash
# Create a new Node.js project
npx avr-qa-scaffold init my-project

# Create a new React project
npx avr-qa-scaffold init my-project --type react

# Create a new Next.js project
npx avr-qa-scaffold init my-project --type next
```

### Listing Available Options

```bash
# Show available project types and templates
npx avr-qa-scaffold list
```

## What Gets Installed

### Common Tools for All Projects

- ESLint with appropriate plugins
- Prettier for code formatting
- Jest for testing
- Husky for Git hooks
- lint-staged for running linters on staged files
- commitlint and Commitizen for standardized commits

### Project-Specific Additions

#### Node.js
- ESM setup (modules)
- Node.js-specific ESLint configuration
- Basic project structure

#### React
- React and JSX plugins for ESLint
- React Testing Library
- Component-focused directory structure

#### Next.js
- Next.js ESLint configuration
- App router setup
- Next.js testing setup

## Included Scripts

After setup, your `package.json` will include these scripts:

```json
{
  "scripts": {
    "lint": "eslint --ignore-path .gitignore --ext .js .",
    "lint:fix": "eslint --ignore-path .gitignore --ext .js . --fix",
    "format": "prettier --ignore-path .gitignore --write \"**/*.{js,json,md}\"",
    "commit": "cz",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch",
    "test:coverage": "node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage"
    // ... and more specialized test commands
  }
}
```

## Git Hooks Configuration

The setup configures these Git hooks:

- **pre-commit**: Runs lint-staged to check staged files
- **commit-msg**: Validates commit message format
- **prepare-commit-msg**: Starts Commitizen for interactive commit creation
- **pre-push**: Runs tests before pushing to remote

## Conventional Commits

The system enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification with types like:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Changes to build process or tools
- `ci`: Changes to CI configuration

## Requirements

- Node.js 20.0.0 or higher
- npm 8.0.0 or higher
- Git

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

## Author

[Alejandro Valencia](https://portfolio.alejandrovr.com)

## Detailed project structure

```
avr-qa-scaffold
├─ .eslintrc.json
├─ .lintstagedrc.json
├─ .prettierrc.json
├─ CHANGELOG.md
├─ CONTRIBUTING.md
├─ LICENSE
├─ README.md
├─ bin
│  └─ avr-qa-scaffold.js
├─ commitlint.config.js
├─ jest.config.js
├─ lib
│  ├─ config-generator.js
│  ├─ index.js
│  ├─ package-modifier.js
│  ├─ project-types.js
│  ├─ setup-quality-system.js
│  ├─ templates-loader.js
│  ├─ utils.js
│  └─ version-checker.js
├─ package-lock.json
├─ package.json
├─ templates
│  ├─ common
│  │  ├─ __mocks__
│  │  │  ├─ fileMock.js
│  │  │  └─ styleMock.js
│  │  ├─ commitlint.config.js
│  │  ├─ eslintrc.json
│  │  ├─ gitignore
│  │  ├─ husky
│  │  │  ├─ commit-msg
│  │  │  ├─ pre-commit
│  │  │  ├─ pre-push
│  │  │  └─ prepare-commit-msg
│  │  ├─ jest.config.js
│  │  ├─ lintstagedrc.json
│  │  └─ prettierrc.json
│  ├─ next
│  │  ├─ eslintrc.json
│  │  ├─ jest.config.js
│  │  ├─ jest.setup.js
│  │  └─ next.config.js
│  ├─ node
│  │  ├─ eslintrc.json
│  │  └─ jest.config.js
│  └─ react
│     ├─ eslintrc.json
│     ├─ jest.config.js
│     └─ jest.setup.js
└─ tests
   ├─ fixtures
   │  ├─ mock-projects
   │  │  ├─ next-app
   │  │  │  ├─ package.json
   │  │  │  └─ src
   │  │  │     └─ app
   │  │  │        └─ page.js
   │  │  ├─ node-app
   │  │  │  ├─ package.json
   │  │  │  └─ src
   │  │  │     └─ index.js
   │  │  └─ react-app
   │  │     ├─ package.json
   │  │     └─ src
   │  │        └─ App.jsx
   │  └─ package-samples
   │     ├─ next-package.json
   │     ├─ node-package.json
   │     └─ react-package.json
   ├─ integration
   │  ├─ existing-project.test.js
   │  ├─ next-project.test.js
   │  ├─ node-project.test.js
   │  └─ react-project.test.js
   └─ unit
      ├─ config-generator.test.js
      ├─ package-modifier.test.js
      ├─ templates-loader.test.js
      ├─ utils.test.js
      └─ version-checker.test.js
```