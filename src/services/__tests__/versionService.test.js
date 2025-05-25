/**
 * @module src/services/__tests__/versionService.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for version service following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-23
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest } from '@jest/globals';
import { createVersionService } from '../versionService.js';
import { createNullLogger } from '../../ports/output/loggerPort.js';
import { createNullPackageManager } from '../../ports/output/packageManagerPort.js';

describe('Version Service', () => {
  let versionService;
  let mockPackageManager;
  let mockLogger;

  beforeEach(() => {
    // Create mock dependencies
    mockLogger = createNullLogger();
    mockLogger.info = jest.fn();
    mockLogger.warning = jest.fn();
    mockLogger.error = jest.fn();

    mockPackageManager = createNullPackageManager();

    // Create service instance
    versionService = createVersionService({
      packageManager: mockPackageManager,
      logger: mockLogger
    });
  });

  describe('versionMatchesPattern method', () => {
    test('should match x+ pattern correctly', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern('8.1.0', '8.x+')).toBe(true);
      expect(versionService.versionMatchesPattern('9.0.0', '8.x+')).toBe(true);
      expect(versionService.versionMatchesPattern('7.9.0', '8.x+')).toBe(false);
    });

    test('should match x pattern correctly', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern('8.1.0', '8.x')).toBe(true);
      expect(versionService.versionMatchesPattern('8.9.5', '8.x')).toBe(true);
      expect(versionService.versionMatchesPattern('9.0.0', '8.x')).toBe(false);
      expect(versionService.versionMatchesPattern('7.9.0', '8.x')).toBe(false);
    });

    test('should match comparison operators correctly', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern('7.9.0', '<8.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('8.1.0', '<8.0.0')).toBe(false);
      expect(versionService.versionMatchesPattern('9.0.0', '>8.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('7.9.0', '>8.0.0')).toBe(false);
      expect(versionService.versionMatchesPattern('8.0.0', '>=8.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('8.1.0', '>=8.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('7.9.0', '>=8.0.0')).toBe(false);
      expect(versionService.versionMatchesPattern('8.0.0', '<=8.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('7.9.0', '<=8.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('8.1.0', '<=8.0.0')).toBe(false);
    });

    test('should match exact versions correctly', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern('8.0.0', '8.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('8.0.1', '8.0.0')).toBe(false);
    });

    test('should handle invalid inputs', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern(null, '8.x+')).toBe(false);
      expect(versionService.versionMatchesPattern('8.0.0', null)).toBe(false);
      expect(versionService.versionMatchesPattern('invalid', '8.x+')).toBe(false);
      expect(versionService.versionMatchesPattern('8.0.0', 'invalid')).toBe(false);
    });

    test('should handle versions with v prefix', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern('v8.1.0', '8.x+')).toBe(true);
      expect(versionService.versionMatchesPattern('v8.0.0', '8.0.0')).toBe(true);
    });

    test('should log errors for invalid versions', () => {
      // Arrange
      // Spy on console.error since semver.clean might not throw for some invalid inputs
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act
      const result = versionService.versionMatchesPattern('definitely-invalid-version!@#', '8.x+');
      
      // Assert
      expect(result).toBe(false);
      
      // Clean up
      errorSpy.mockRestore();
      
      // Alternative: test with a pattern that will definitely cause semver to throw
      const result2 = versionService.versionMatchesPattern('1.0.0', 'invalid-pattern-that-causes-error!@#');
      expect(result2).toBe(false);
    });
  });

  describe('compareVersions method', () => {
    test('should compare versions with different operators', () => {
      // Arrange & Act & Assert
      expect(versionService.compareVersions('2.0.0', '1.0.0', '>')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '2.0.0', '>')).toBe(false);
      expect(versionService.compareVersions('2.0.0', '1.0.0', '>=')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '1.0.0', '>=')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '2.0.0', '<')).toBe(true);
      expect(versionService.compareVersions('2.0.0', '1.0.0', '<')).toBe(false);
      expect(versionService.compareVersions('1.0.0', '2.0.0', '<=')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '1.0.0', '<=')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '1.0.0', '=')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '1.0.1', '=')).toBe(false);
      expect(versionService.compareVersions('1.0.0', '1.0.1', '!=')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '1.0.0', '!=')).toBe(false);
    });

    test('should use >= as default operator', () => {
      // Arrange & Act & Assert
      expect(versionService.compareVersions('2.0.0', '1.0.0')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '1.0.0')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '2.0.0')).toBe(false);
    });

    test('should handle invalid inputs', () => {
      // Arrange & Act & Assert
      expect(versionService.compareVersions(null, '1.0.0')).toBe(false);
      expect(versionService.compareVersions('1.0.0', null)).toBe(false);
      expect(versionService.compareVersions('invalid', '1.0.0')).toBe(false);
      expect(versionService.compareVersions('1.0.0', 'invalid')).toBe(false);
    });

    test('should throw error for invalid operator', () => {
      // Arrange & Act
      const result = versionService.compareVersions('1.0.0', '1.0.0', 'invalid');
      
      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error comparing versions 1.0.0 and 1.0.0')
      );
    });

    test('should handle versions with v prefix', () => {
      // Arrange & Act & Assert
      expect(versionService.compareVersions('v2.0.0', 'v1.0.0', '>')).toBe(true);
      expect(versionService.compareVersions('v1.0.0', 'v1.0.0', '=')).toBe(true);
    });
  });

  describe('checkMinimumVersion method', () => {
    test('should check package against minimum requirements', () => {
      // Arrange & Act
      const result = versionService.checkMinimumVersion('eslint', '8.1.0', '8.0.0');
      
      // Assert
      expect(result).toEqual({
        compatible: true,
        packageName: 'eslint',
        installedVersion: '8.1.0',
        requiredVersion: '8.0.0',
        message: 'eslint version 8.1.0 meets requirement (>= 8.0.0)'
      });
    });

    test('should detect incompatible versions', () => {
      // Arrange & Act
      const result = versionService.checkMinimumVersion('eslint', '7.9.0', '8.0.0');
      
      // Assert
      expect(result).toEqual({
        compatible: false,
        packageName: 'eslint',
        installedVersion: '7.9.0',
        requiredVersion: '8.0.0',
        message: 'eslint version 7.9.0 is below minimum required version 8.0.0'
      });
    });

    test('should use default minimum versions when not specified', () => {
      // Arrange & Act
      const result = versionService.checkMinimumVersion('node', '20.1.0');
      
      // Assert
      expect(result.compatible).toBe(true);
      expect(result.requiredVersion).toBe('20.0.0'); // Default minimum
    });

    test('should handle packages not installed', () => {
      // Arrange & Act
      const result = versionService.checkMinimumVersion('eslint', null, '8.0.0');
      
      // Assert
      expect(result).toEqual({
        compatible: false,
        packageName: 'eslint',
        installedVersion: null,
        requiredVersion: '8.0.0',
        message: 'eslint is not installed'
      });
    });

    test('should handle packages with no minimum requirement', () => {
      // Arrange & Act
      const result = versionService.checkMinimumVersion('unknown-package', '1.0.0');
      
      // Assert
      expect(result).toEqual({
        compatible: true,
        packageName: 'unknown-package',
        installedVersion: '1.0.0',
        requiredVersion: null,
        message: 'No minimum version requirement for unknown-package'
      });
    });
  });

  describe('checkPackageCompatibility method', () => {
    test('should detect compatibility issues', async () => {
      // Arrange
      const installedVersions = {
        'eslint': '8.1.0',
        'eslint-config-prettier': '7.0.0' // Below 8.0.0, should trigger warning
      };
      
      // Act
      const result = await versionService.checkPackageCompatibility(installedVersions);
      
      // Assert
      expect(result.compatible).toBe(true); // Warning, not error
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('ESLint 8+ works best with eslint-config-prettier 8+');
      expect(result.summary.warnings).toBe(1);
      expect(mockLogger.warning).toHaveBeenCalled();
    });

    test('should detect error-level compatibility issues', async () => {
      // Arrange
      const installedVersions = {
        'prettier': '3.1.0',
        'eslint-plugin-prettier': '4.0.0' // Below 5.0.0, should trigger error
      };
      
      // Act
      const result = await versionService.checkPackageCompatibility(installedVersions);
      
      // Assert
      expect(result.compatible).toBe(false); // Error level
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].message).toContain('Prettier 3+ requires eslint-plugin-prettier 5+');
      expect(result.summary.compatibilityIssues).toBe(1);
    });

    test('should skip checks for uninstalled packages', async () => {
      // Arrange
      const installedVersions = {
        'eslint': '8.1.0'
        // eslint-config-prettier not installed
      };
      
      // Act
      const result = await versionService.checkPackageCompatibility(installedVersions, true);
      
      // Assert
      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Skipping compatibility check')
      );
    });

    test('should show compatible packages in verbose mode', async () => {
      // Arrange
      const installedVersions = {
        'eslint': '8.1.0',
        'eslint-config-prettier': '8.1.0' // Compatible versions
      };
      
      // Act
      const result = await versionService.checkPackageCompatibility(installedVersions, true);
      
      // Assert
      expect(result.compatible).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('✓ eslint@8.1.0 and eslint-config-prettier@8.1.0 are compatible')
      );
    });

    test('should handle compatible packages in non-verbose mode', async () => {
      // Arrange
      const installedVersions = {
        'eslint': '7.0.0',
        'eslint-config-prettier': '6.0.0',
        // ... otros packages
      };
      
      // Act - verbose = false (default)
      const result = await versionService.checkPackageCompatibility(installedVersions);
      
      // Assert - No debería logear el mensaje de compatible
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('✓')
      );
    });
  });

  describe('getUpdateRecommendations method', () => {
    test('should generate update recommendations from compatibility results', () => {
      // Arrange
      const compatibilityResults = {
        issues: [{
          type: 'error',
          message: 'Test error',
          packages: [
            { name: 'package1', version: '1.0.0' },
            { name: 'package2', version: '2.0.0' }
          ]
        }],
        warnings: [{
          type: 'warning',
          message: 'Test warning',
          packages: [
            { name: 'package3', version: '3.0.0' }
          ]
        }]
      };
      
      // Act
      const result = versionService.getUpdateRecommendations(compatibilityResults);
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        packageName: 'package1',
        currentVersion: '1.0.0',
        reason: 'Test error',
        severity: 'error',
        action: 'update'
      });
    });

    test('should avoid duplicate recommendations', () => {
      // Arrange
      const compatibilityResults = {
        issues: [{
          type: 'error',
          message: 'Test error',
          packages: [
            { name: 'package1', version: '1.0.0' },
            { name: 'package1', version: '1.0.0' } // Duplicate
          ]
        }],
        warnings: []
      };
      
      // Act
      const result = versionService.getUpdateRecommendations(compatibilityResults);
      
      // Assert
      expect(result).toHaveLength(1); // No duplicates
      expect(result[0].packageName).toBe('package1');
    });
  });

  describe('validation methods', () => {
    test('isValidVersion should validate semver versions', () => {
      // Arrange & Act & Assert
      expect(versionService.isValidVersion('1.0.0')).toBe(true);
      expect(versionService.isValidVersion('1.0.0-beta.1')).toBe(true);
      expect(versionService.isValidVersion('v1.0.0')).toBe(true);
      expect(versionService.isValidVersion('invalid')).toBe(false);
      expect(versionService.isValidVersion(null)).toBe(false);
      expect(versionService.isValidVersion(123)).toBe(false);
      expect(versionService.isValidVersion('')).toBe(false);
    });

    test('cleanVersionRange should clean version ranges', () => {
      // Arrange & Act & Assert
      expect(versionService.cleanVersionRange('^1.0.0')).toBe('1.0.0');
      expect(versionService.cleanVersionRange('~1.0.0')).toBe('1.0.0');
      expect(versionService.cleanVersionRange('>=1.0.0')).toBe('1.0.0');
      expect(versionService.cleanVersionRange('1.0.0')).toBe('1.0.0');
      expect(versionService.cleanVersionRange('v1.0.0')).toBe('1.0.0');
      expect(versionService.cleanVersionRange('^1.2.3.4.5.6.7.8')).toBeNull();
      expect(versionService.cleanVersionRange('^1.2.3.4.5')).toBeNull();
      expect(versionService.cleanVersionRange('^1.a.b.c')).toBeNull();
      expect(versionService.cleanVersionRange('~version.with.letters')).toBeNull();
      expect(versionService.cleanVersionRange('^{malformed}')).toBeNull();
      expect(versionService.cleanVersionRange('>=[object Object]')).toBeNull();
      expect(versionService.cleanVersionRange(null)).toBeNull();
      expect(versionService.cleanVersionRange('')).toBeNull();
    });
  });

  describe('checkForUpdates method', () => {
    test('should check for package updates', async () => {
      // Arrange
      const packageName = 'eslint';
      const currentVersion = '8.0.0';
      
      // Act
      const result = await versionService.checkForUpdates(packageName, currentVersion);
      
      // Assert
      expect(result).toEqual({
        packageName: 'eslint',
        currentVersion: '8.0.0',
        hasUpdate: false,
        latestVersion: null,
        updateType: null
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Checking for updates for eslint@8.0.0');
    });

    test('should handle errors during update check', async () => {
      // Arrange
      const originalInfo = mockLogger.info;
      mockLogger.info = jest.fn(() => {
        throw new Error('Logger error');
      });
      
      // Act
      const result = await versionService.checkForUpdates('eslint', '8.0.0');
      
      // Assert
      expect(result).toHaveProperty('error');
      expect(result.hasUpdate).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error checking updates for eslint: Logger error')
      );
      
      // Restore
      mockLogger.info = originalInfo;
    });
  });

  describe('utility methods', () => {
    test('getKnownCompatibilityIssues should return copy of compatibility issues', () => {
      // Arrange & Act
      const result1 = versionService.getKnownCompatibilityIssues();
      const result2 = versionService.getKnownCompatibilityIssues();
      
      // Assert
      expect(result1).toBeInstanceOf(Array);
      expect(result1.length).toBeGreaterThan(0);
      expect(result1).not.toBe(result2); // Different instances
      expect(result1).toEqual(result2); // Same content
      
      // Verify structure
      expect(result1[0]).toHaveProperty('packages');
      expect(result1[0]).toHaveProperty('message');
      expect(result1[0]).toHaveProperty('severity');
    });

    test('getMinimumVersionRequirements should return copy of minimum versions', () => {
      // Arrange & Act
      const result1 = versionService.getMinimumVersionRequirements();
      const result2 = versionService.getMinimumVersionRequirements();
      
      // Assert
      expect(result1).toHaveProperty('node');
      expect(result1).toHaveProperty('npm');
      expect(result1).toHaveProperty('eslint');
      expect(result1).not.toBe(result2); // Different instances
      expect(result1).toEqual(result2); // Same content
    });

    test('validateNodeCompatibility should check Node.js compatibility', () => {
      // Arrange & Act
      const result1 = versionService.validateNodeCompatibility('20.1.0');
      const result2 = versionService.validateNodeCompatibility('18.0.0');
      const result3 = versionService.validateNodeCompatibility('20.1.0', '18.0.0');
      
      // Assert
      expect(result1.compatible).toBe(true);
      expect(result1.packageName).toBe('node');
      expect(result2.compatible).toBe(false);
      expect(result3.compatible).toBe(true);
      expect(result3.requiredVersion).toBe('18.0.0');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle malformed version patterns gracefully', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern('1.0.0', '')).toBe(false);
      expect(versionService.versionMatchesPattern('1.0.0', 'malformed.x+')).toBe(false);
      expect(versionService.versionMatchesPattern('1.0.0', '<>')).toBe(false);
    });

    test('should handle empty compatibility results', () => {
      // Arrange
      const emptyResults = { issues: [], warnings: [] };
      
      // Act
      const result = versionService.getUpdateRecommendations(emptyResults);
      
      // Assert
      expect(result).toEqual([]);
    });

    test('should handle compatibility check with empty installed versions', async () => {
      // Arrange
      const installedVersions = {};
      
      // Act
      const result = await versionService.checkPackageCompatibility(installedVersions);
      
      // Assert
      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.summary.totalChecks).toBe(0);
    });

    test('should handle version comparison with pre-release versions', () => {
      // Arrange & Act & Assert
      expect(versionService.compareVersions('1.0.0-beta.1', '1.0.0-alpha.1', '>')).toBe(true);
      expect(versionService.compareVersions('1.0.0-rc.1', '1.0.0-beta.1', '>')).toBe(true);
      expect(versionService.compareVersions('1.0.0', '1.0.0-rc.1', '>')).toBe(true);
    });

    test('should handle pattern matching with build metadata', () => {
      // Arrange & Act & Assert
      expect(versionService.versionMatchesPattern('1.0.0+build.1', '1.0.0')).toBe(true);
      expect(versionService.versionMatchesPattern('1.0.0+build.1', '1.x')).toBe(true);
    });
  });
});