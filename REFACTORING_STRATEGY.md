# AVR Quality Scaffold - Refactoring Strategy Document

## Project Overview

AVR Quality Scaffold is a tool for quickly establishing code quality foundations (ESLint, Prettier, Jest, Git hooks, etc.) for Node.js, React, and Next.js projects. The tool currently works but has several architectural issues that make it difficult to test and maintain.

## Current Architecture Issues

The current project structure has several limitations:

1. **High coupling between modules**: Modules directly import each other, creating circular dependencies
2. **Mixed responsibilities**: Many functions handle multiple concerns (business logic, file system operations, logging)
3. **Poor testability**: Difficult to test functions in isolation due to direct dependencies
4. **Limited extensibility**: Adding new features requires modifying multiple files

## Target Architecture: Hexagonal (Ports & Adapters)

We've decided to refactor the project to follow the Hexagonal Architecture pattern, which will:

- Separate business logic from external dependencies
- Improve testability through clear interfaces
- Make the codebase more maintainable and extensible
- Provide a clearer structure for future development

## Refactoring Approach

### Phase 1: Analysis and Preparation

1. **Document current state**:
   - Analyze existing code structure
   - Identify key responsibilities and dependencies
   - Map current module relationships

2. **Define ports (interfaces)**:
   - File system operations
   - Logging
   - CLI interaction
   - Package management
   - Template management

### Phase 2: Core Implementation

3. **Implement domain models**:
   - Project type definitions
   - Configuration specifications

4. **Implement core services**:
   - Template processing (pure functions)
   - Version compatibility management (pure functions)
   - Project configuration generation (pure functions)

### Phase 3: Adapter Implementation

5. **Implement adapters**:
   - File system adapter
   - Console logger adapter
   - CLI adapters
   - Package manager adapter
   - Template repository adapter

### Phase 4: Application Layer

6. **Implement application layer**:
   - Command handlers
   - Main application bootstrap

### Phase 5: Testing and Documentation

7. **Implement comprehensive testing**:
   - Unit tests for core logic
   - Integration tests for adapters
   - E2E tests for complete workflows

8. **Update documentation**:
   - README and other docs to reflect new architecture
   - Code comments for maintainability

## Prioritized Module Refactoring

We'll refactor modules in this order:

1. **utils.js → Multiple Adapters**:
   - Highest priority due to many dependencies
   - Will establish foundation patterns

2. **project-types.js → Domain Models**:
   - Defines core data structures

3. **templates-loader.js → Template Service & Adapter**:
   - Complex logic that needs separation

4. **version-checker.js → Version Service & Adapter**:
   - Logic with external dependencies

5. **setup-quality-system.js → Quality Service**:
   - Orchestration component

6. **config-generator.js → Config Service**:
   - Complex generation logic

7. **index.js → Application Bootstrap**:
   - Main entry point

## Instructions for Starting the Refactoring Process

To begin the refactoring process with AI assistance, follow these steps:

1. **Share the current project state**:
   ```
   I need help refactoring my project to a hexagonal architecture.
   Here is the current state of my project:
   [Share directory structure]
   ```

2. **Share key source files**:
   ```
   Here are the source files we need to refactor:
   [Share content of utils.js, project-types.js, etc.]
   ```

3. **Share the target architecture**:
   ```
   Here is our target architecture:
   [Share the hexagonal architecture tree]
   ```

4. **Share the updated README**:
   ```
   Here is our updated README that reflects the new architecture:
   [Share the updated README]
   ```

5. **Request specific refactoring guidance**:
   ```
   I'd like to start by refactoring [specific module]. 
   Could you help me transform it to fit the hexagonal architecture?
   ```

## Refactoring Guidelines

### General Rules

1. **One responsibility per module**: Each module should have a clear, single purpose
2. **Dependency injection**: Dependencies should be passed in, not imported directly
3. **Interface-based design**: Components should depend on interfaces, not implementations
4. **Pure core**: Business logic should be pure and testable in isolation
5. **Testability first**: Every component should be designed with testing in mind

### Code Style Guidelines

1. **ES Modules**: Use ESM syntax (import/export) consistently
2. **JSDoc comments**: Add descriptive JSDoc comments to all public functions
3. **Consistent naming**: Follow established naming conventions
   - Ports end with `.port.js`
   - Adapters end with `.adapter.js`
   - Services end with `.service.js`
4. **Default exports**: Use named exports for better intellisense

### Testing Guidelines

1. **Unit tests**:
   - Test core services with mock dependencies
   - Focus on logic, not implementation details

2. **Integration tests**:
   - Test adapters with actual dependencies
   - Verify correct interaction between components

3. **E2E tests**:
   - Test complete workflows from a user perspective
   - Validate that everything works together

## Migration Strategy

We'll use an incremental approach:

1. Start with foundational modules (utils.js → adapters)
2. Create new files alongside existing ones
3. Gradually switch imports to use new modules
4. Verify functionality after each significant change
5. Deprecate old modules once new ones are stable

This approach allows us to maintain a working application throughout the refactoring process.

## Expected Benefits

1. **Improved testability**: 80%+ test coverage with simpler tests
2. **Better maintainability**: Clear responsibilities and dependencies
3. **Easier extensibility**: Add new project types or tools without major changes
4. **Enhanced developer experience**: More intuitive project structure
5. **Robust architecture**: Battle-tested pattern for complex applications

## Timeline and Milestones

1. **Phase 1 (Analysis)**: 1 day
2. **Phase 2 (Core Implementation)**: 2 days
3. **Phase 3 (Adapters)**: 3 days
4. **Phase 4 (Application)**: 2 days
5. **Phase 5 (Testing)**: 3 days

Total estimated time: 11 days

## Conclusion

This refactoring will transform AVR Quality Scaffold into a more maintainable, testable, and extensible tool. The hexagonal architecture will provide a solid foundation for future development and ensure the tool remains valuable for establishing quality standards in JavaScript projects.