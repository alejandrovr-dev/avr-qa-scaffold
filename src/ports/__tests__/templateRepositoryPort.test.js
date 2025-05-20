/**
 * @module src/ports/__tests__/templateRepositoryPort.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for template repository port interface following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isTemplateRepository, createNullTemplateRepository } from '../templateRepositoryPort.js';

describe('TemplateRepositoryPort', () => {
  describe('isTemplateRepository function', () => {
    test('should return true for objects implementing TemplateRepositoryPort interface', () => {
      // Arrange
      const validRepo = {
        getTemplate: jest.fn(),
        listTemplates: jest.fn(),
        listProjectTypes: jest.fn(),
        hasTemplatesForType: jest.fn(),
      };
      // Act
      const result = isTemplateRepository(validRepo);
      // Assert
      expect(result).toBe(true);
    });

    test('should return false for objects missing required methods', () => {
      // Arrange
      const incompleteRepo1 = {
        // Missing getTemplate
        listTemplates: jest.fn(),
        listProjectTypes: jest.fn(),
        hasTemplatesForType: jest.fn(),
      };
      const incompleteRepo2 = {
        getTemplate: jest.fn(),
        listTemplates: jest.fn(),
        listProjectTypes: jest.fn(),
        // Missing hasTemplatesForType
      };
      // Act
      const result1 = isTemplateRepository(incompleteRepo1);
      const result2 = isTemplateRepository(incompleteRepo2);
      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should return false for objects with non-function properties', () => {
      // Arrange
      const invalidRepo = {
        getTemplate: jest.fn(),
        listTemplates: 'not a function',
        listProjectTypes: jest.fn(),
        hasTemplatesForType: jest.fn(),
      };
      // Act
      const result = isTemplateRepository(invalidRepo);
      // Assert
      expect(result).toBe(false);
    });

    test.each([
      // Arrange
      { testName: 'should return false for null', value: null },
      { testName: 'should return false for undefined', value: undefined },
      { testName: 'should return false for numbers', value: 42 },
      { testName: 'should return false for strings', value: 'string' },
      { testName: 'should return false for booleans', value: true },
      { testName: 'should return false for arrays', value: [ jest.fn() ] },
    ])('$testName', ({ value }) => {
      // Act
      const result = isTemplateRepository(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createNullTemplateRepository function', () => {
    test('should return an object implementing TemplateRepositoryPort interface', () => {
      // Arrange
      const nullRepo = createNullTemplateRepository();
      // Act
      const result = isTemplateRepository(nullRepo);
      // Assert
      expect(result).toBe(true);
    });

    test('getTemplate should return an empty string', async () => {
      // Arrange
      const nullRepo = createNullTemplateRepository();
      // Act
      const result = await nullRepo.getTemplate('react', 'eslintrc.json');
      // Assert
      expect(result).toBe('');
    });

    test('listTemplates should return an empty array', async () => {
      // Arrange
      const nullRepo = createNullTemplateRepository();
      // Act
      const result = await nullRepo.listTemplates('node');
      // Assert
      expect(result).toEqual([]);
    });

    test('listProjectTypes should return an empty array', async () => {
      // Arrange
      const nullRepo = createNullTemplateRepository();
      // Act
      const result = await nullRepo.listProjectTypes();
      // Assert
      expect(result).toEqual([]);
    });

    test('hasTemplatesForType should return false', async () => {
      // Arrange
      const nullRepo = createNullTemplateRepository();
      // Act
      const result = await nullRepo.hasTemplatesForType('react');
      // Assert
      expect(result).toBe(false);
    });
  });
});