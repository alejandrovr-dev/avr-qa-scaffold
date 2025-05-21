/**
 * @module src/ports/output/__tests__/packageManagerPort.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for package manager port interface following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 *
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { isPackageManager, createNullPackageManager } from '../packageManagerPort.js';

describe('PackageManagerPort', () => {
  describe('isPackageManager function', () => {
    test('should return true for objects implementing PackageManagerPort interface', () => {
      // Arrange
      const validPkgManager = {
        isInstalled: jest.fn(),
        install: jest.fn(),
        installDev: jest.fn(),
        readPackageJson: jest.fn(),
        writePackageJson: jest.fn(),
        getInstalledVersion: jest.fn(),
      };
      // Act
      const result = isPackageManager(validPkgManager);
      // Assert
      expect(result).toBe(true);
    });

    test('should return false for objects missing required methods', () => {
      // Arrange
      const incompletePkgManager1 = {
        // Missing isInstalled
        install: jest.fn(),
        installDev: jest.fn(),
        readPackageJson: jest.fn(),
        writePackageJson: jest.fn(),
        getInstalledVersion: jest.fn(),
      };
      const incompletePkgManager2 = {
        isInstalled: jest.fn(),
        install: jest.fn(),
        installDev: jest.fn(),
        readPackageJson: jest.fn(),
        writePackageJson: jest.fn(),
        // Missing getInstalledVersion
      };
      // Act
      const result1 = isPackageManager(incompletePkgManager1);
      const result2 = isPackageManager(incompletePkgManager2);
      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should return false for objects with non-function properties', () => {
      // Arrange
      const invalidPkgManager = {
        isInstalled: jest.fn(),
        install: 'not a function',
        installDev: jest.fn(),
        readPackageJson: jest.fn(),
        writePackageJson: jest.fn(),
        getInstalledVersion: jest.fn(),
      };
      // Act
      const result = isPackageManager(invalidPkgManager);
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
      const result = isPackageManager(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createNullPackageManager function', () => {
    test('should return an object implementing PackageManagerPort interface', () => {
      // Arrange
      const nullPkgManager = createNullPackageManager();
      // Act
      const result = isPackageManager(nullPkgManager);
      // Assert
      expect(result).toBe(true);
    });

    test('isInstalled should return false', async () => {
      // Arrange
      const nullPkgManager = createNullPackageManager();
      // Act
      const result = await nullPkgManager.isInstalled('eslint');
      // Assert
      expect(result).toBe(false);
    });

    test('install should return true', async () => {
      // Arrange
      const nullPkgManager = createNullPackageManager();
      // Act
      const result = await nullPkgManager.install(['eslint', 'prettier']);
      // Assert
      expect(result).toBe(true);
    });

    test('installDev should return true', async () => {
      // Arrange
      const nullPkgManager = createNullPackageManager();
      // Act
      const result = await nullPkgManager.installDev(['eslint', 'prettier']);
      // Assert
      expect(result).toBe(true);
    });

    test('readPackageJson should return an empty object', async () => {
      // Arrange
      const nullPkgManager = createNullPackageManager();
      // Act
      const result = await nullPkgManager.readPackageJson('./package.json');
      // Assert
      expect(result).toEqual({});
    });

    test('writePackageJson should return true', async () => {
      // Arrange
      const nullPkgManager = createNullPackageManager();
      const pkgData = { name: 'test', version: '1.0.0' };
      // Act
      const result = await nullPkgManager.writePackageJson('./package.json', pkgData);
      // Assert
      expect(result).toBe(true);
    });

    test('getInstalledVersion should return null', async () => {
      // Arrange
      const nullPkgManager = createNullPackageManager();
      // Act
      const result = await nullPkgManager.getInstalledVersion('eslint');
      // Assert
      expect(result).toBe(null);
    });
  });
});