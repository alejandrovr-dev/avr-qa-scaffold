/**
 * @module tests/unit/project-types.test.js
 * @version 0.1.0
 * @description Unit tests for the project-types module following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox approach. Tests verify the public API while
 * ensuring coverage of internal behavior.
 * 
 * @status READY
 * @createdAt 2025-05-13
 * @lastModified 2025-05-13
 * @author Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest, describe, expect } from '@jest/globals';

// Import the module directly (no need for mocks as this is mostly a data module)
import {
  PROJECT_TYPES,
  getProjectTypeConfig,
  getAllProjectTypes,
  isValidProjectType,
  getProjectDependencies,
  getProjectDirectories
} from '../../src/project-types.js';

describe('Project Types Module', () => {
  /**
   * Project Types Data Tests
   */
  describe('PROJECT_TYPES Constant', () => {
    test('contains node project type configuration', () => {
      // Arrange - nothing needed
      
      // Act - access the data
      const nodeConfig = PROJECT_TYPES.node;
      
      // Assert
      expect(nodeConfig).toBeDefined();
      expect(nodeConfig.id).toBe('node');
      expect(nodeConfig.name).toBe('Node.js');
      expect(nodeConfig.description).toBe('Node.js application or library');
      expect(Array.isArray(nodeConfig.dependencies)).toBe(true);
      expect(Array.isArray(nodeConfig.directories)).toBe(true);
      expect(nodeConfig.packageJsonDefaults).toHaveProperty('type', 'module');
      expect(nodeConfig.templates).toHaveProperty('base', 'common');
      expect(nodeConfig.templates).toHaveProperty('specific', 'node');
    });
    
    test('contains react project type configuration', () => {
      // Arrange - nothing needed
      
      // Act
      const reactConfig = PROJECT_TYPES.react;
      
      // Assert
      expect(reactConfig).toBeDefined();
      expect(reactConfig.id).toBe('react');
      expect(reactConfig.name).toBe('React');
      expect(reactConfig.dependencies.length).toBeGreaterThan(0);
      expect(reactConfig.directories).toContain('src/components');
    });
    
    test('contains next project type configuration', () => {
      // Arrange - nothing needed
      
      // Act
      const nextConfig = PROJECT_TYPES.next;
      
      // Assert
      expect(nextConfig).toBeDefined();
      expect(nextConfig.id).toBe('next');
      expect(nextConfig.name).toBe('Next.js');
      expect(nextConfig.dependencies.length).toBeGreaterThan(0);
      expect(nextConfig.directories).toContain('src/app');
    });
    
    test('all project types contain required properties', () => {
      // Arrange - nothing needed
      
      // Act - iterate through all project types
      const projectTypes = Object.values(PROJECT_TYPES);
      
      // Assert
      for (const config of projectTypes) {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('dependencies');
        expect(config).toHaveProperty('directories');
        expect(config).toHaveProperty('packageJsonDefaults');
        expect(config).toHaveProperty('templates');
      }
    });
    
    test('dependencies include common dependencies for all project types', () => {
      // Arrange - identify common dependencies from node project
      const commonDeps = [
        'eslint',
        'prettier',
        'husky',
        'jest'
      ];
      
      // Act - get all project types
      const projectTypes = Object.values(PROJECT_TYPES);
      
      // Assert - check each project type has the common dependencies
      for (const config of projectTypes) {
        for (const dep of commonDeps) {
          expect(config.dependencies.some(d => d.startsWith(dep))).toBe(true);
        }
      }
    });
  });
  
  /**
   * getProjectTypeConfig Tests
   */
  describe('getProjectTypeConfig Function', () => {
    test('returns correct configuration for node project type', () => {
      // Arrange
      const projectType = 'node';
      
      // Act
      const config = getProjectTypeConfig(projectType);
      
      // Assert
      expect(config).toBeDefined();
      expect(config.id).toBe('node');
      expect(config.name).toBe('Node.js');
    });
    
    test('returns correct configuration for react project type', () => {
      // Arrange
      const projectType = 'react';
      
      // Act
      const config = getProjectTypeConfig(projectType);
      
      // Assert
      expect(config).toBeDefined();
      expect(config.id).toBe('react');
      expect(config.name).toBe('React');
    });
    
    test('returns correct configuration for next project type', () => {
      // Arrange
      const projectType = 'next';
      
      // Act
      const config = getProjectTypeConfig(projectType);
      
      // Assert
      expect(config).toBeDefined();
      expect(config.id).toBe('next');
      expect(config.name).toBe('Next.js');
    });
    
    test('returns null for invalid project type', () => {
      // Arrange
      const projectType = 'invalid';
      
      // Act
      const config = getProjectTypeConfig(projectType);
      
      // Assert
      expect(config).toBeNull();
    });
  });
  
  /**
   * getAllProjectTypes Tests
   */
  describe('getAllProjectTypes Function', () => {
    test('returns array of all project type configurations', () => {
      // Act
      const projectTypes = getAllProjectTypes();
      
      // Assert
      expect(Array.isArray(projectTypes)).toBe(true);
      expect(projectTypes.length).toBe(3);
      
      // Check that it contains all expected project types
      const projectTypeIds = projectTypes.map(config => config.id);
      expect(projectTypeIds).toContain('node');
      expect(projectTypeIds).toContain('react');
      expect(projectTypeIds).toContain('next');
    });
    
    test('returned array contains full config objects', () => {
      // Act
      const projectTypes = getAllProjectTypes();
      
      // Assert
      for (const config of projectTypes) {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('dependencies');
        expect(config).toHaveProperty('directories');
      }
    });
  });
  
  /**
   * isValidProjectType Tests
   */
  describe('isValidProjectType Function', () => {
    test.each([
      ['node', true],
      ['react', true],
      ['next', true],
      ['invalid', false],
      ['', false],
      [null, false],
      [undefined, false]
    ])('validates project type "%s" as %s', (projectType, expected) => {
      // Act
      const isValid = isValidProjectType(projectType);
      
      // Assert
      expect(isValid).toBe(expected);
    });
  });
  
  /**
   * getProjectDependencies Tests
   */
  describe('getProjectDependencies Function', () => {
    test('returns dependencies for node project type', () => {
      // Arrange
      const projectType = 'node';
      
      // Act
      const dependencies = getProjectDependencies(projectType);
      
      // Assert
      expect(Array.isArray(dependencies)).toBe(true);
      expect(dependencies.length).toBeGreaterThan(0);
      
      // Check for some specific dependencies
      expect(dependencies.some(dep => dep.startsWith('eslint'))).toBe(true);
      expect(dependencies.some(dep => dep.startsWith('prettier'))).toBe(true);
    });
    
    test('returns dependencies for react project type', () => {
      // Arrange
      const projectType = 'react';
      
      // Act
      const dependencies = getProjectDependencies(projectType);
      
      // Assert
      expect(Array.isArray(dependencies)).toBe(true);
      
      // Check for react-specific dependencies
      expect(dependencies.some(dep => dep.startsWith('eslint-plugin-react'))).toBe(true);
      expect(dependencies.some(dep => dep.startsWith('@testing-library/react'))).toBe(true);
    });
    
    test('returns dependencies for next project type', () => {
      // Arrange
      const projectType = 'next';
      
      // Act
      const dependencies = getProjectDependencies(projectType);
      
      // Assert
      expect(Array.isArray(dependencies)).toBe(true);
      
      // Check for next-specific dependencies
      expect(dependencies.some(dep => dep.startsWith('eslint-config-next'))).toBe(true);
    });
    
    test('returns common dependencies for invalid project type', () => {
      // Arrange
      const projectType = 'invalid';
      
      // Act
      const dependencies = getProjectDependencies(projectType);
      
      // Assert
      expect(Array.isArray(dependencies)).toBe(true);
      expect(dependencies.length).toBeGreaterThan(0);
      
      // Should still contain common dependencies
      expect(dependencies.some(dep => dep.startsWith('eslint'))).toBe(true);
      expect(dependencies.some(dep => dep.startsWith('prettier'))).toBe(true);
    });
  });
  
  /**
   * getProjectDirectories Tests
   */
  describe('getProjectDirectories Function', () => {
    test('returns directories for node project type', () => {
      // Arrange
      const projectType = 'node';
      
      // Act
      const directories = getProjectDirectories(projectType);
      
      // Assert
      expect(Array.isArray(directories)).toBe(true);
      expect(directories.length).toBeGreaterThan(0);
      
      // Check for some specific directories
      expect(directories).toContain('src');
      expect(directories).toContain('tests');
      expect(directories).toContain('src/utils');
    });
    
    test('returns directories for react project type', () => {
      // Arrange
      const projectType = 'react';
      
      // Act
      const directories = getProjectDirectories(projectType);
      
      // Assert
      expect(Array.isArray(directories)).toBe(true);
      
      // Check for react-specific directories
      expect(directories).toContain('src/components');
      expect(directories).toContain('src/hooks');
    });
    
    test('returns directories for next project type', () => {
      // Arrange
      const projectType = 'next';
      
      // Act
      const directories = getProjectDirectories(projectType);
      
      // Assert
      expect(Array.isArray(directories)).toBe(true);
      
      // Check for next-specific directories
      expect(directories).toContain('src/app');
      expect(directories).toContain('src/components');
    });
    
    test('returns common directories for invalid project type', () => {
      // Arrange
      const projectType = 'invalid';
      
      // Act
      const directories = getProjectDirectories(projectType);
      
      // Assert
      expect(Array.isArray(directories)).toBe(true);
      expect(directories.length).toBeGreaterThan(0);
      
      // Should still contain common directories
      expect(directories).toContain('src');
      expect(directories).toContain('tests');
    });
  });
});