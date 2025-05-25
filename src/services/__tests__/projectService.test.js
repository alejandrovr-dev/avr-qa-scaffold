/**
 * @module src/services/__tests__/projectService.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for project service following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-24
 * @lastModified 2025-05-24
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { createProjectService } from '../projectService.js';

describe('Project Service', () => {
  let projectService;

  beforeEach(() => {
    projectService = createProjectService();
  });

  describe('getProjectTypeConfig method', () => {
    test('should return node project configuration', () => {
      // Arrange & Act
      const result = projectService.getProjectTypeConfig('node');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('node');
      expect(result.name).toBe('Node.js');
      expect(result.description).toBe('Node.js application or library');
      expect(result.dependencies).toContain('eslint-config-airbnb-base@^15.0.0');
      expect(result.directories).toContain('src/utils');
    });

    test('should return react project configuration', () => {
      // Arrange & Act
      const result = projectService.getProjectTypeConfig('react');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('react');
      expect(result.name).toBe('React');
      expect(result.dependencies).toContain('eslint-plugin-react@^7.33.2');
      expect(result.directories).toContain('src/components');
    });

    test('should return next project configuration', () => {
      // Arrange & Act
      const result = projectService.getProjectTypeConfig('next');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('next');
      expect(result.name).toBe('Next.js');
      expect(result.dependencies).toContain('eslint-config-next@^14.2.0');
      expect(result.directories).toContain('src/app');
    });

    test('should return null for invalid project type', () => {
      // Arrange & Act
      const result = projectService.getProjectTypeConfig('invalid');
      
      // Assert
      expect(result).toBeNull();
    });

    test('should handle case insensitive project types', () => {
      // Arrange & Act
      const result = projectService.getProjectTypeConfig('NODE');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('node');
    });

    test('should return null for null or undefined input', () => {
      // Arrange & Act
      const result1 = projectService.getProjectTypeConfig(null);
      const result2 = projectService.getProjectTypeConfig(undefined);
      
      // Assert
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    test('should return null for non-string input', () => {
      // Arrange & Act
      const result = projectService.getProjectTypeConfig(123);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllProjectTypes method', () => {
    test('should return all project type configurations', () => {
      // Arrange & Act
      const result = projectService.getAllProjectTypes();
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(type => type.id)).toEqual(['node', 'react', 'next']);
      
      // Verify each type has required properties
      result.forEach(type => {
        expect(type).toHaveProperty('id');
        expect(type).toHaveProperty('name');
        expect(type).toHaveProperty('description');
        expect(type).toHaveProperty('dependencies');
        expect(type).toHaveProperty('directories');
      });
    });
  });

  describe('getAvailableProjectTypes method', () => {
    test('should return formatted project types for CLI display', () => {
      // Arrange & Act
      const result = projectService.getAvailableProjectTypes();
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: 'Node.js - Node.js application or library',
        value: 'node',
        description: 'Node.js application or library'
      });
      expect(result[1]).toEqual({
        name: 'React - React application',
        value: 'react',
        description: 'React application'
      });
      expect(result[2]).toEqual({
        name: 'Next.js - Next.js application',
        value: 'next',
        description: 'Next.js application'
      });
    });
  });

  describe('isValidProjectType method', () => {
    test('should return true for valid project types', () => {
      // Arrange & Act & Assert
      expect(projectService.isValidProjectType('node')).toBe(true);
      expect(projectService.isValidProjectType('react')).toBe(true);
      expect(projectService.isValidProjectType('next')).toBe(true);
    });

    test('should return true for valid project types in different cases', () => {
      // Arrange & Act & Assert
      expect(projectService.isValidProjectType('NODE')).toBe(true);
      expect(projectService.isValidProjectType('React')).toBe(true);
      expect(projectService.isValidProjectType('NEXT')).toBe(true);
    });

    test('should return false for invalid project types', () => {
      // Arrange & Act & Assert
      expect(projectService.isValidProjectType('invalid')).toBe(false);
      expect(projectService.isValidProjectType('vue')).toBe(false);
      expect(projectService.isValidProjectType('')).toBe(false);
    });

    test('should return false for null, undefined, or non-string input', () => {
      // Arrange & Act & Assert
      expect(projectService.isValidProjectType(null)).toBe(false);
      expect(projectService.isValidProjectType(undefined)).toBe(false);
      expect(projectService.isValidProjectType(123)).toBe(false);
      expect(projectService.isValidProjectType({})).toBe(false);
    });
  });

  describe('getProjectDependencies method', () => {
    test('should return node-specific dependencies', () => {
      // Arrange & Act
      const result = projectService.getProjectDependencies('node');
      
      // Assert
      expect(result).toContain('eslint@^8.57.0'); // Common dependency
      expect(result).toContain('eslint-config-airbnb-base@^15.0.0'); // Node-specific
      expect(result).not.toContain('eslint-plugin-react@^7.33.2'); // React-specific
    });

    test('should return react-specific dependencies', () => {
      // Arrange & Act
      const result = projectService.getProjectDependencies('react');
      
      // Assert
      expect(result).toContain('eslint@^8.57.0'); // Common dependency
      expect(result).toContain('eslint-plugin-react@^7.33.2'); // React-specific
      expect(result).toContain('@testing-library/react@^14.1.2'); // React testing
    });

    test('should return common dependencies for invalid project type', () => {
      // Arrange & Act
      const result = projectService.getProjectDependencies('invalid');
      
      // Assert
      expect(result).toContain('eslint@^8.57.0');
      expect(result).toContain('prettier@^3.1.1');
      expect(result).not.toContain('eslint-config-airbnb-base@^15.0.0');
    });

    test('should return a copy of dependencies array', () => {
      // Arrange & Act
      const result1 = projectService.getProjectDependencies('node');
      const result2 = projectService.getProjectDependencies('node');
      
      // Assert
      expect(result1).not.toBe(result2); // Different array instances
      expect(result1).toEqual(result2); // Same content
      
      // Modify one array
      result1.push('test-package');
      expect(result1).not.toEqual(result2); // Should not affect the other
    });
  });

  describe('getProjectDirectories method', () => {
    test('should return node-specific directories', () => {
      // Arrange & Act
      const result = projectService.getProjectDirectories('node');
      
      // Assert
      expect(result).toContain('src'); // Common directory
      expect(result).toContain('tests'); // Common directory
      expect(result).toContain('src/utils'); // Node-specific
      expect(result).not.toContain('src/components'); // React-specific
    });

    test('should return react-specific directories', () => {
      // Arrange & Act
      const result = projectService.getProjectDirectories('react');
      
      // Assert
      expect(result).toContain('src'); // Common directory
      expect(result).toContain('src/components'); // React-specific
      expect(result).toContain('src/hooks'); // React-specific
      expect(result).toContain('public'); // React-specific
    });

    test('should return next-specific directories', () => {
      // Arrange & Act
      const result = projectService.getProjectDirectories('next');
      
      // Assert
      expect(result).toContain('src/app'); // Next-specific
      expect(result).toContain('src/lib'); // Next-specific
      expect(result).toContain('public'); // Next-specific
    });

    test('should return common directories for invalid project type', () => {
      // Arrange & Act
      const result = projectService.getProjectDirectories('invalid');
      
      // Assert
      expect(result).toContain('src'); // Common directory
      expect(result).toContain('tests'); // Common directory
      expect(result).toContain('tests/integration'); // Common directory
      expect(result).toContain('tests/e2e'); // Common directory
      expect(result).not.toContain('src/utils'); // Node-specific
      expect(result).not.toContain('src/components'); // React-specific
    });

    test('should return a copy of directories array', () => {
      // Arrange & Act
      const result1 = projectService.getProjectDirectories('react');
      const result2 = projectService.getProjectDirectories('react');
      
      // Assert
      expect(result1).not.toBe(result2); // Different array instances
      expect(result1).toEqual(result2); // Same content
      
      // Modify one array
      result1.push('test-directory');
      expect(result1).not.toEqual(result2); // Should not affect the other
    });
  });

  describe('getPackageJsonDefaults method', () => {
    test('should return node-specific package.json defaults', () => {
      // Arrange & Act
      const result = projectService.getPackageJsonDefaults('node');
      
      // Assert
      expect(result).toEqual({
        type: 'module',
        main: 'src/index.js',
        engines: {
          node: '>=20.0.0',
        },
      });
    });

    test('should return fallback defaults for invalid project type', () => {
      // Arrange & Act
      const result = projectService.getPackageJsonDefaults('invalid');
      
      // Assert
      expect(result).toEqual({
        type: 'module',
        engines: { node: '>=20.0.0' }
      });
    });
  });

  describe('getTemplateConfig method', () => {
    test('should return template config for valid project type', () => {
      // Arrange & Act
      const result = projectService.getTemplateConfig('react');
      
      // Assert
      expect(result).toEqual({
        base: 'common',
        specific: 'react'
      });
    });

    test('should return fallback template config for invalid project type', () => {
      // Arrange & Act
      const result = projectService.getTemplateConfig('invalid');
      
      // Assert
      expect(result).toEqual({
        base: 'common',
        specific: 'node'
      });
    });
  });

  describe('generateTemplateVariables method', () => {
    test('should generate template variables with project information', () => {
      // Arrange
      const projectName = 'my-awesome-project';
      const projectType = 'react';
      
      // Act
      const result = projectService.generateTemplateVariables(projectName, projectType);
      
      // Assert
      expect(result.projectName).toBe(projectName);
      expect(result.projectType).toBe('react');
      expect(result.projectTypeName).toBe('React');
      expect(result.year).toBe(new Date().getFullYear());
      expect(result.nodeVersion).toBe(process.version);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle default values for missing parameters', () => {
      // Arrange & Act
      const result = projectService.generateTemplateVariables(null, 'invalid');
      
      // Assert
      expect(result.projectName).toBe('my-project');
      expect(result.projectType).toBe('node');
      expect(result.projectTypeName).toBe('Node.js');
    });
  });

  describe('supportsFeature method', () => {
    test('should correctly identify React features', () => {
      // Arrange & Act & Assert
      expect(projectService.supportsFeature('react', 'react')).toBe(true);
      expect(projectService.supportsFeature('react', 'components')).toBe(true);
      expect(projectService.supportsFeature('react', 'jsx')).toBe(true);
      expect(projectService.supportsFeature('react', 'ssr')).toBe(false);
      expect(projectService.supportsFeature('react', 'app-router')).toBe(false);
    });

    test('should correctly identify Next.js features', () => {
      // Arrange & Act & Assert
      expect(projectService.supportsFeature('next', 'react')).toBe(true);
      expect(projectService.supportsFeature('next', 'ssr')).toBe(true);
      expect(projectService.supportsFeature('next', 'app-router')).toBe(true);
      expect(projectService.supportsFeature('next', 'components')).toBe(true);
    });

    test('should correctly identify Node.js features', () => {
      // Arrange & Act & Assert
      expect(projectService.supportsFeature('node', 'react')).toBe(false);
      expect(projectService.supportsFeature('node', 'ssr')).toBe(false);
      expect(projectService.supportsFeature('node', 'components')).toBe(false);
    });

    test('should return false for invalid project types', () => {
      // Arrange & Act & Assert
      expect(projectService.supportsFeature('invalid', 'react')).toBe(false);
      expect(projectService.supportsFeature('invalid', 'ssr')).toBe(false);
    });
  });

  describe('utility methods', () => {
    test('getDefaultProjectType should return node', () => {
      // Arrange & Act
      const result = projectService.getDefaultProjectType();
      
      // Assert
      expect(result).toBe('node');
    });

    test('getProjectTypeNames should return array of type names', () => {
      // Arrange & Act
      const result = projectService.getProjectTypeNames();
      
      // Assert
      expect(result).toEqual(['node', 'react', 'next']);
    });

    test('getCommonDependencies should return copy of common dependencies', () => {
      // Arrange & Act
      const result = projectService.getCommonDependencies();
      
      // Assert
      expect(result).toContain('eslint@^8.57.0');
      expect(result).toContain('prettier@^3.1.1');
      
      // Test it's a copy
      const result2 = projectService.getCommonDependencies();
      expect(result).not.toBe(result2);
    });

    test('getCommonDirectories should return copy of common directories', () => {
      // Arrange & Act
      const result = projectService.getCommonDirectories();
      
      // Assert
      expect(result).toContain('src');
      expect(result).toContain('tests');
      
      // Test it's a copy
      const result2 = projectService.getCommonDirectories();
      expect(result).not.toBe(result2);
    });
  });
});