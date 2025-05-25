/**
 * @module src/services/__tests__/packageService.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for package service following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { createPackageService } from '../packageService.js';
import { createNullLogger } from '../../ports/output/loggerPort.js';
import { createNullPackageManager } from '../../ports/output/packageManagerPort.js';

describe('Package Service', () => {
  let packageService;
  let mockPackageManager;
  let mockLogger;

  beforeEach(() => {
    // Create mock dependencies
    mockLogger = createNullLogger();
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();

    mockPackageManager = createNullPackageManager();
    mockPackageManager.isInstalled = jest.fn();
    mockPackageManager.install = jest.fn();
    mockPackageManager.installDev = jest.fn();
    mockPackageManager.getInstalledVersion = jest.fn();

    // Create service instance
    packageService = createPackageService({
      packageManager: mockPackageManager,
      logger: mockLogger
    });
  });

  describe('extractPackageName method', () => {
    test('should extract name from regular package', () => {
      // Arrange & Act
      const result = packageService.extractPackageName('eslint@8.0.0');
      
      // Assert
      expect(result).toBe('eslint');
    });

    test('should extract name from package without version', () => {
      // Arrange & Act
      const result = packageService.extractPackageName('prettier');
      
      // Assert
      expect(result).toBe('prettier');
    });

    test('should extract name from scoped package with version', () => {
      // Arrange & Act
      const result = packageService.extractPackageName('@babel/core@7.0.0');
      
      // Assert
      expect(result).toBe('@babel/core');
    });

    test('should extract name from scoped package without version', () => {
      // Arrange & Act
      const result = packageService.extractPackageName('@babel/preset-env');
      
      // Assert
      expect(result).toBe('@babel/preset-env');
    });

    test('should handle invalid inputs', () => {
      // Arrange & Act & Assert
      expect(packageService.extractPackageName(null)).toBe('');
      expect(packageService.extractPackageName(undefined)).toBe('');
      expect(packageService.extractPackageName('')).toBe('');
      expect(packageService.extractPackageName(123)).toBe('');
    });

    test('should handle complex scoped package names', () => {
      // Arrange & Act
      const result1 = packageService.extractPackageName('@org/package-name@1.2.3');
      const result2 = packageService.extractPackageName('@my-org/my-package');
      
      // Assert
      expect(result1).toBe('@org/package-name');
      expect(result2).toBe('@my-org/my-package');
    });
  });

  describe('extractPackageVersion method', () => {
    test('should extract version from regular package', () => {
      // Arrange & Act
      const result = packageService.extractPackageVersion('eslint@8.0.0');
      
      // Assert
      expect(result).toBe('8.0.0');
    });

    test('should return null for package without version', () => {
      // Arrange & Act
      const result = packageService.extractPackageVersion('prettier');
      
      // Assert
      expect(result).toBeNull();
    });

    test('should extract version from scoped package', () => {
      // Arrange & Act
      const result = packageService.extractPackageVersion('@babel/core@7.0.0');
      
      // Assert
      expect(result).toBe('7.0.0');
    });

    test('should return null for scoped package without version', () => {
      // Arrange & Act
      const result = packageService.extractPackageVersion('@babel/preset-env');
      
      // Assert
      expect(result).toBeNull();
    });

    test('should handle invalid inputs', () => {
      // Arrange & Act & Assert
      expect(packageService.extractPackageVersion(null)).toBeNull();
      expect(packageService.extractPackageVersion(undefined)).toBeNull();
      expect(packageService.extractPackageVersion('')).toBeNull();
      expect(packageService.extractPackageVersion(123)).toBeNull();
    });

    test('should handle complex version formats', () => {
      // Arrange & Act
      const result1 = packageService.extractPackageVersion('package@^1.2.3');
      const result2 = packageService.extractPackageVersion('package@~1.0.0-beta.1');
      
      // Assert
      expect(result1).toBe('^1.2.3');
      expect(result2).toBe('~1.0.0-beta.1');
    });
  });

  describe('checkPackagesInstalled method', () => {
    test('should check installation status for multiple packages', async () => {
      // Arrange
      const packages = ['eslint@8.0.0', 'prettier@3.0.0'];
      mockPackageManager.isInstalled
        .mockResolvedValueOnce(true)  // eslint
        .mockResolvedValueOnce(false); // prettier
      
      // Act
      const result = await packageService.checkPackagesInstalled(packages);
      
      // Assert
      expect(result).toEqual({
        eslint: true,
        prettier: false
      });
      expect(mockPackageManager.isInstalled).toHaveBeenCalledTimes(2);
      expect(mockPackageManager.isInstalled).toHaveBeenCalledWith('eslint', process.cwd());
      expect(mockPackageManager.isInstalled).toHaveBeenCalledWith('prettier', process.cwd());
    });

    test('should handle scoped packages', async () => {
      // Arrange
      const packages = ['@babel/core@7.0.0'];
      mockPackageManager.isInstalled.mockResolvedValue(true);
      
      // Act
      const result = await packageService.checkPackagesInstalled(packages);
      
      // Assert
      expect(result).toEqual({
        '@babel/core': true
      });
    });

    test('should handle errors gracefully', async () => {
      // Arrange
      const packages = ['eslint'];
      mockPackageManager.isInstalled.mockRejectedValue(new Error('Check failed'));
      
      // Act
      const result = await packageService.checkPackagesInstalled(packages);
      
      // Assert
      expect(result).toEqual({
        eslint: false
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Error checking if eslint is installed: Check failed');
    });

    test('should return empty object for invalid input', async () => {
      // Arrange & Act
      const result1 = await packageService.checkPackagesInstalled(null);
      const result2 = await packageService.checkPackagesInstalled('not-an-array');
      
      // Assert
      expect(result1).toEqual({});
      expect(result2).toEqual({});
    });
  });

  describe('installMissingPackages method', () => {
    test('should install only missing packages', async () => {
      // Arrange
      const packages = ['eslint@8.0.0', 'prettier@3.0.0'];
      mockPackageManager.isInstalled
        .mockResolvedValueOnce(true)  // eslint already installed
        .mockResolvedValueOnce(false); // prettier not installed
      mockPackageManager.installDev.mockResolvedValue(true);
      
      // Act
      const result = await packageService.installMissingPackages(packages);
      
      // Assert
      expect(result).toEqual({
        success: true,
        installed: ['prettier@3.0.0'],
        skipped: ['eslint@8.0.0']
      });
      expect(mockPackageManager.installDev).toHaveBeenCalledWith(['prettier@3.0.0']);
    });

    test('should use regular install when dev=false', async () => {
      // Arrange
      const packages = ['express@4.0.0'];
      mockPackageManager.isInstalled.mockResolvedValue(false);
      mockPackageManager.install.mockResolvedValue(true);
      
      // Act
      const result = await packageService.installMissingPackages(packages, { dev: false });
      
      // Assert
      expect(result.success).toBe(true);
      expect(mockPackageManager.install).toHaveBeenCalledWith(['express@4.0.0']);
      expect(mockPackageManager.installDev).not.toHaveBeenCalled();
    });

    test('should skip installation if all packages are installed', async () => {
      // Arrange
      const packages = ['eslint@8.0.0'];
      mockPackageManager.isInstalled.mockResolvedValue(true);
      
      // Act
      const result = await packageService.installMissingPackages(packages);
      
      // Assert
      expect(result).toEqual({
        success: true,
        installed: [],
        skipped: ['eslint@8.0.0']
      });
      expect(mockPackageManager.installDev).not.toHaveBeenCalled();
    });

    test('should handle installation failure', async () => {
      // Arrange
      const packages = ['eslint@8.0.0'];
      mockPackageManager.isInstalled.mockResolvedValue(false);
      mockPackageManager.installDev.mockResolvedValue(false);
      
      // Act
      const result = await packageService.installMissingPackages(packages);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Package installation failed');
    });

    test('should log already installed packages when verbose=true', async () => {
      // Arrange
      const packages = ['eslint@8.0.0', 'prettier@3.0.0'];
      mockPackageManager.isInstalled
        .mockResolvedValueOnce(true)  // eslint already installed
        .mockResolvedValueOnce(true); // prettier already installed
      
      // Act
      const result = await packageService.installMissingPackages(packages, { verbose: true });
      
      // Assert
      expect(result).toEqual({
        success: true,
        installed: [],
        skipped: ['eslint@8.0.0', 'prettier@3.0.0']
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Already installed: eslint, prettier');
      expect(mockPackageManager.installDev).not.toHaveBeenCalled();
    });

    test('should handle empty or invalid package arrays', async () => {
      // Arrange & Act
      const result1 = await packageService.installMissingPackages([]);
      const result2 = await packageService.installMissingPackages(null);
      
      // Assert
      expect(result1).toEqual({ success: true, installed: [], skipped: [] });
      expect(result2).toEqual({ success: true, installed: [], skipped: [] });
    });
  });

  describe('configuration methods', () => {
    test('getStandardScripts should return copy of standard scripts', () => {
      // Arrange & Act
      const result1 = packageService.getStandardScripts();
      const result2 = packageService.getStandardScripts();
      
      // Assert
      expect(result1).toHaveProperty('lint');
      expect(result1).toHaveProperty('test');
      expect(result1).toHaveProperty('test:coverage');
      expect(result1).not.toBe(result2); // Different instances
      expect(result1).toEqual(result2); // Same content
    });

    test('getCommitizenConfig should return copy of commitizen config', () => {
      // Arrange & Act
      const result = packageService.getCommitizenConfig();
      
      // Assert
      expect(result).toHaveProperty('config');
      expect(result.config).toHaveProperty('commitizen');
      expect(result.config.commitizen.path).toBe('./node_modules/cz-conventional-changelog');
    });
  });

  describe('mergePackageJsonConfig method', () => {
    test('should merge simple objects', () => {
      // Arrange
      const target = { name: 'test', version: '1.0.0' };
      const source = { description: 'Test package', version: '2.0.0' };
      
      // Act
      const result = packageService.mergePackageJsonConfig(target, source);
      
      // Assert
      expect(result).toEqual({
        name: 'test',
        version: '2.0.0', // source overwrites target
        description: 'Test package'
      });
    });

    test('should merge nested objects recursively', () => {
      // Arrange
      const target = {
        scripts: { test: 'jest', build: 'webpack' },
        config: { port: 3000 }
      };
      const source = {
        scripts: { lint: 'eslint', test: 'jest --coverage' },
        config: { host: 'localhost' }
      };
      
      // Act
      const result = packageService.mergePackageJsonConfig(target, source);
      
      // Assert
      expect(result).toEqual({
        scripts: {
          test: 'jest --coverage', // overwritten
          build: 'webpack', // preserved
          lint: 'eslint' // added
        },
        config: {
          port: 3000, // preserved
          host: 'localhost' // added
        }
      });
    });

    test('should handle null/undefined inputs', () => {
      // Arrange
      const validConfig = { name: 'test' };
      
      // Act & Assert
      expect(packageService.mergePackageJsonConfig(null, validConfig)).toEqual(validConfig);
      expect(packageService.mergePackageJsonConfig(validConfig, null)).toEqual(validConfig);
      expect(packageService.mergePackageJsonConfig(null, null)).toEqual({});
    });

    test('should handle arrays correctly (replace, not merge)', () => {
      // Arrange
      const target = { keywords: ['old', 'tags'] };
      const source = { keywords: ['new', 'tags'] };
      
      // Act
      const result = packageService.mergePackageJsonConfig(target, source);
      
      // Assert
      expect(result.keywords).toEqual(['new', 'tags']); // replaced, not merged
    });
  });

  describe('createQualitySystemConfig method', () => {
    test('should create config with scripts and commitizen', () => {
      // Arrange
      const existingConfig = { name: 'test-project', version: '1.0.0' };
      
      // Act
      const result = packageService.createQualitySystemConfig(existingConfig);
      
      // Assert
      expect(result.name).toBe('test-project'); // preserved
      expect(result.scripts).toHaveProperty('lint');
      expect(result.scripts).toHaveProperty('test');
      expect(result.config).toHaveProperty('commitizen');
    });

    test('should handle undefined existingPackageJson parameter', () => {
      // Arrange & Act
      const result = packageService.createQualitySystemConfig(undefined);
      
      // Assert
      expect(result.scripts).toHaveProperty('lint');
      expect(result.scripts).toHaveProperty('test');
      expect(result.config).toHaveProperty('commitizen');
      // Should not have any existing properties since it defaulted to {}
      expect(result.name).toBeUndefined();
      expect(result.version).toBeUndefined();
    });

    test('should handle no parameters (both defaults)', () => {
      // Arrange & Act
      const result = packageService.createQualitySystemConfig();
      
      // Assert
      expect(result.scripts).toHaveProperty('lint');
      expect(result.scripts).toHaveProperty('test');
      expect(result.config).toHaveProperty('commitizen');
      // Should not have any existing properties since it defaulted to {}
      expect(result.name).toBeUndefined();
      expect(result.version).toBeUndefined();
    });

    test('should allow disabling scripts or commitizen', () => {
      // Arrange
      const existingConfig = { name: 'test-project' };
      
      // Act
      const result = packageService.createQualitySystemConfig(existingConfig, {
        includeScripts: false,
        includeCommitizen: false
      });
      
      // Assert
      expect(result.name).toBe('test-project');
      expect(result.scripts).toBeUndefined();
      expect(result.config).toBeUndefined();
    });
  });

  describe('validation methods', () => {
    test('isValidPackageName should validate package names correctly', () => {
      // Arrange & Act & Assert
      expect(packageService.isValidPackageName('eslint')).toBe(true);
      expect(packageService.isValidPackageName('my-package')).toBe(true);
      expect(packageService.isValidPackageName('package_name')).toBe(true);
      expect(packageService.isValidPackageName('package.name')).toBe(true);
      expect(packageService.isValidPackageName('@babel/core')).toBe(true);
      expect(packageService.isValidPackageName('@my-org/my-package')).toBe(true);
      
      // Invalid names
      expect(packageService.isValidPackageName('UPPERCASE')).toBe(false);
      expect(packageService.isValidPackageName('package with spaces')).toBe(false);
      expect(packageService.isValidPackageName('')).toBe(false);
      expect(packageService.isValidPackageName(null)).toBe(false);
      expect(packageService.isValidPackageName(123)).toBe(false);
    });

    test('parseDependencies should parse dependency arrays', () => {
      // Arrange
      const dependencies = [
        'eslint@8.0.0',
        '@babel/core@7.0.0',
        'INVALID-NAME', // should be filtered out
        'valid-package'
      ];
      
      // Act
      const result = packageService.parseDependencies(dependencies);
      
      // Assert
      expect(result).toHaveLength(3); // INVALID-NAME filtered out
      expect(result[0]).toEqual({
        original: 'eslint@8.0.0',
        name: 'eslint',
        version: '8.0.0',
        isValid: true
      });
      expect(result[1]).toEqual({
        original: '@babel/core@7.0.0',
        name: '@babel/core',
        version: '7.0.0',
        isValid: true
      });
      expect(result[2]).toEqual({
        original: 'valid-package',
        name: 'valid-package',
        version: null,
        isValid: true
      });
    });

    test('parseDependencies should handle invalid input', () => {
      // Arrange & Act & Assert
      expect(packageService.parseDependencies(null)).toEqual([]);
      expect(packageService.parseDependencies('not-an-array')).toEqual([]);
      expect(packageService.parseDependencies([])).toEqual([]);
    });
  });

  describe('getPackageVersions method', () => {
    test('should get versions for multiple packages', async () => {
      // Arrange
      const packageNames = ['eslint', 'prettier'];
      mockPackageManager.getInstalledVersion
        .mockResolvedValueOnce('8.0.0')
        .mockResolvedValueOnce('3.0.0');
      
      // Act
      const result = await packageService.getPackageVersions(packageNames);
      
      // Assert
      expect(result).toEqual({
        eslint: '8.0.0',
        prettier: '3.0.0'
      });
      expect(mockPackageManager.getInstalledVersion).toHaveBeenCalledTimes(2);
    });

    test('should handle packages with no version', async () => {
      // Arrange
      const packageNames = ['eslint'];
      mockPackageManager.getInstalledVersion.mockResolvedValue(null);
      
      // Act
      const result = await packageService.getPackageVersions(packageNames);
      
      // Assert
      expect(result).toEqual({
        eslint: null
      });
    });

    test('should handle errors gracefully', async () => {
      // Arrange
      const packageNames = ['eslint'];
      mockPackageManager.getInstalledVersion.mockRejectedValue(new Error('Version check failed'));
      
      // Act
      const result = await packageService.getPackageVersions(packageNames);
      
      // Assert
      expect(result).toEqual({
        eslint: null
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting version for eslint: Version check failed');
    });

    test('should handle invalid input', async () => {
      // Arrange & Act
      const result1 = await packageService.getPackageVersions(null);
      const result2 = await packageService.getPackageVersions('not-an-array');
      
      // Assert
      expect(result1).toEqual({});
      expect(result2).toEqual({});
    });
  });
});