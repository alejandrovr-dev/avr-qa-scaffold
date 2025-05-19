# Contributing to AVR Quality Scaffold

First off, thank you for considering contributing to AVR Quality Scaffold! It's people like you that make this tool better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by the project's code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [dev@alejandrovr.com](mailto:dev@alejandrovr.com).

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**

- Check the documentation for tips on how to use the tool correctly.
- Check if you can reproduce the problem in the latest version.
- Perform a cursory search to see if the problem has already been reported.

**How Do I Submit A Good Bug Report?**

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps to reproduce the problem** in as much detail as possible.
- **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** if possible.
- **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened.
- **Include details about your configuration and environment**:
  - Which version of the tool are you using?
  - What's the name and version of the OS you're using?
  - What's the Node.js and npm version you're using?
  - What project type were you scaffolding?

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

**Before Submitting An Enhancement Suggestion:**

- Check if you're using the latest version.
- Read the documentation carefully to find out if the functionality is already covered.
- Perform a search to see if the enhancement has already been suggested.

**How Do I Submit A Good Enhancement Suggestion?**

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
- **Provide specific examples to demonstrate the steps** or point to similar features in other projects.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
- **Explain why this enhancement would be useful** to most users.
- **List some other tools or applications where this enhancement exists**, if applicable.

### Pull Requests

The process described here has several goals:

- Maintain the project's quality
- Fix problems that are important to users
- Enable a sustainable system for the project's maintainers to review contributions

Please follow these steps to have your contribution considered:

1. Follow the [styleguides](#styleguides)
2. After you submit your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing

**What if the status checks are failing?**

If a status check is failing, and you believe that the failure is unrelated to your change, please write a comment on the pull request explaining why you believe the failure is unrelated. A maintainer will re-run the status check for you.

## Styleguides

### Git Commit Messages

All Git Commit Messages must adhere to the [Conventional Commits specification](https://www.conventionalcommits.org/):

- Use the present tense ("add feature" not "added feature")
- Use the imperative mood ("move cursor to..." not "moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable type:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for changes that do not affect code functionality
  - `refactor:` for code refactoring without functionality changes
  - `perf:` for performance improvements
  - `test:` for test additions/changes
  - `chore:` for changes to the build process or tools

### JavaScript Styleguide

All JavaScript code is linted with ESLint and formatted with Prettier:

- Use ES modules (`import`/`export`) for all files
- 2 spaces for indentation
- Single quotes for strings
- Semicolons after statements
- Use `async`/`await` over Promise chains when possible
- Prefer arrow functions for callbacks
- Always use explicit function return types
- Include JSDoc comments for all functions and classes

### Testing Styleguide

All tests must follow these guidelines:

- Include a descriptive name for each test case
- Group related tests in `describe` blocks and use `test.each` if applicable
- Use Jest's `beforeEach` and `afterEach` hooks for setup and cleanup
- Mock external dependencies
- Test both success and failure cases
- Ensure tests are independent from each other

### Documentation Styleguide

- Use [Markdown](https://guides.github.com/features/mastering-markdown/) for documentation
- Reference methods and classes in markdown with backticks: e.g., `function()`
- Place documentation according to co-location pattern:
  - User documentation in `dir/`
  - API documentation with JSDoc in source files

## Project Structure

Understanding the project structure will help you contribute more effectively:

```
avr-qa-scaffold/
├─ bin/                       # Command-line interface scripts
├─ src/                       # Core functionality modules
│  ├─ config-generator.js     # Configuration file generation
│  ├─ index.js                # Main entry point
│  ├─ package-modifier.js     # Package.json modifications
│  ├─ project-types.js        # Project type definitions
│  ├─ setup-quality-system.js # Main setup procedures
│  ├─ templates-loader.js     # Template loading utilities
│  ├─ utils.js                # Shared utility functions
│  └─ version-checker.js      # Version compatibility checks
├─ templates/                 # Configuration templates
│  ├─ common/                 # Shared across all project types
│  ├─ node/                   # Node.js specific templates
│  ├─ react/                  # React specific templates
│  └─ next/                   # Next.js specific templates
└─ tests/                     # Test files
   ├─ fixtures/               # Test fixtures and sample data
   ├─ integration/            # Integration tests
   └─ unit/                   # Unit tests
```

## Development Process

### Setting Up Development Environment

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`

### Making Changes

1. Create a branch for your changes: `git checkout -b feature/your-feature-name`
2. Make your changes and ensure tests pass: `npm test`
3. Commit changes following the [commit message guidelines](#git-commit-messages)
4. Push your branch to your fork
5. Create a pull request

### Running Tests

- `npm test`: Run all tests
- `npm run test:unit`: Run unit tests only
- `npm run test:integration`: Run integration tests only
- `npm run test:coverage`: Generate test coverage report

## Release Process

The project follows semantic versioning. The release process is automated using GitHub Actions:

1. Changes are merged to main branch
2. CI runs all tests
3. When ready for release, version is bumped based on conventional commits
4. A new tag is created
5. The package is published to npm

## Adding Support for New Project Types

To add support for a new project type:

1. Create a new directory in `templates/` for the project type
2. Add the project type configuration in `src/project-types.js`
3. Create necessary ESLint and Jest configurations
4. Add integration tests in `tests/integration/`
5. Update documentation to include the new project type

## Questions?

If you have any questions about contributing, please open an issue or reach out to the maintainers.

Thank you for contributing to AVR Quality Scaffold!