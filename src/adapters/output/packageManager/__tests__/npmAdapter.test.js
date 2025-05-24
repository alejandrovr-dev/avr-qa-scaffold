/**
 * @module src/adapters/output/packageManager/__tests__/npmAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for npm package manager adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-20
 * @lastModified 2025-05-23
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

// Static imports
import { jest } from '@jest/globals';
import { isPackageManager } from '../../../../ports/output/packageManagerPort.js';
import { createNullLogger } from '../../../../ports/output/loggerPort.js';
import { createNullFileSystem } from '../../../../ports/output/fileSystemPort.js';

/**
 * Create manual mocks for fs.promises and execa methods
 */
const mockFsReadFile = jest.fn();
const mockFsWriteFile = jest.fn();
const mockExeca = jest.fn();
/** 
 * Mock the fs module (substituting real module with our manual mocks)
 * This tells Jest: "whenever any module tries to import 'fs', return this mock object instead"
 */
jest.unstable_mockModule('fs', () => ({
  promises: {
    readFile: mockFsReadFile,
    writeFile: mockFsWriteFile,
  },
}));
/**
 * Mock the execa module (substituting real module with our manual mocks)
 * This tells Jest: "whenever any module tries to import 'execa', return this mock object instead"
 */
jest.unstable_mockModule('execa', () => ({
  execa: mockExeca
}));
/**
 * Dynamic imports after mocking
 * Import the dependencies after have been mocked (for our own use in tests)
 * This import will receive our mocked versions, not the real dependencies
 */
const { promises: fs } = await import('fs');
const { execa } = await import('execa');
/**
 * Import the adapter after mocking dependencies
 * When the adapter internally executes 'import { ... } from '...'',
 * it will receive our mocked dependencies instead of the real ones, transparently
 */
const { createNpmPackageManager } = await import('../npmAdapter.js');

describe('NPM Package Manager Adapter', () => {
  // Test dependencies
  let logger;
  let fileSystem;
  let packageManager;

  // Setup
  beforeEach(() => {
    // Create a mock logger
    logger = createNullLogger();
    logger.info = jest.fn();
    logger.success = jest.fn();
    logger.error = jest.fn();

    // Create a mock file system
    fileSystem = createNullFileSystem();
    fileSystem.fileExists = jest.fn();

    // Create the package manager with mocked dependencies
    packageManager = createNpmPackageManager({ logger, fileSystem });

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should create a package manager that satisfies the PackageManagerPort interface', () => {
    // Assert
    expect(isPackageManager(packageManager)).toBe(true);
  });
  
  describe('isInstalled method', () => {
    test('should return false if package.json does not exist', async () => {
      // Arrange
      // Configure the mocked dependency to simulate a file not exists
      // (when isInstalled calls fileSystem.fileExists internally,
      // it will receive this mocked negative response instead)
      fileSystem.fileExists.mockResolvedValue(false);
      // Act
      const result = await packageManager.isInstalled('eslint');
      // Assert
      expect(result).toBe(false);
      expect(fileSystem.fileExists).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      );
    });

    test('should return false if package.json exists but package is not in dependencies or devDependencies', async () => {
      // Arrange
      // Configure the mocked dependency to simulate only package.json file exists
      // (when isInstalled calls fileSystem.fileExists internally,
      // it will receive this mocked selective response instead)
      fileSystem.fileExists.mockImplementation(async (path) => {
        // Pretends that package.json exists but not other files
        return path.endsWith('package.json');
      });
      // Mock readPackageJson
      const readPackageJsonSpy = jest.spyOn(packageManager, 'readPackageJson').mockResolvedValue({
        dependencies: { 'other-package': '1.0.0' },
        devDependencies: { 'another-package': '2.0.0' },
      });
      // Act
      const result = await packageManager.isInstalled('eslint');
      // Assert
      expect(result).toBe(false);
      expect(readPackageJsonSpy).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      );
    });

    test('should return false if package is in dependencies but is not installed', async () => {
      // Arrange
      // Configure the mocked dependency to simulate only package.json file exists
      // (when isInstalled calls fileSystem.fileExists internally,
      // it will receive this mocked selective response instead)
      fileSystem.fileExists.mockImplementation(async (path) => {
        // Pretends that package.json exists but not other files
        return path.endsWith('package.json');
      });
      // Mock readPackageJson
      const readPackageJsonSpy = jest.spyOn(packageManager, 'readPackageJson').mockResolvedValue({
        dependencies: { 'eslint': '8.0.0' },
      });
      // Act
      const result = await packageManager.isInstalled('eslint');
      // Assert
      expect(result).toBe(false);
      expect(readPackageJsonSpy).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      );
      expect(fileSystem.fileExists).toHaveBeenCalledWith(
        expect.stringContaining('node_modules/eslint')
      );
    });

    test('should return true if package is in devDependencies and installed', async () => {
      // Arrange
      // Configure the mocked dependency to simulate that files exist
      // (when isInstalled calls fileSystem.fileExists internally,
      // it will receive this mocked success response instead)
      fileSystem.fileExists.mockResolvedValue(true);
      // Create spy for readPackageJson and mock its behavior
      const readPackageJsonSpy = jest.spyOn(packageManager, 'readPackageJson').mockResolvedValue({
        devDependencies: { 'eslint': '8.0.0' },
      });
      // Act
      const result = await packageManager.isInstalled('eslint');
      // Assert
      expect(result).toBe(true);
      expect(readPackageJsonSpy).toHaveBeenCalledWith(
        expect.stringContaining('/package.json')
      );
      expect(fileSystem.fileExists).toHaveBeenCalledWith(
        expect.stringContaining('node_modules/eslint')
      );
    });

    test('should handle errors and return false', async () => {
      // Arrange
      fileSystem.fileExists.mockRejectedValue(new Error('Test error'));
      // Act
      const result = await packageManager.isInstalled('eslint');
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('install method', () => {
    test('should return true if no packages are provided', async () => {
      // Act
      const result = await packageManager.install([]);
      // Assert
      expect(result).toBe(true);
      expect(execa).not.toHaveBeenCalled();
    });

    test('should call npm install with correct arguments', async () => {
      // Arrange
      execa.mockResolvedValue({ stdout: 'Installed successfully' });
      // Act
      const result = await packageManager.install(['eslint', 'prettier']);
      // Assert
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith(
        'npm',
        ['install', '--save', 'eslint', 'prettier'],
        expect.any(Object)
      );
      expect(logger.success).toHaveBeenCalled();
    });

    test('should handle installation errors', async () => {
      // Arrange
      execa.mockRejectedValue(new Error('Installation failed'));
      // Act
      const result = await packageManager.install(['eslint']);
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('installDev method', () => {
    test('should return true if no packages are provided', async () => {
      // Act
      const result = await packageManager.installDev([]);
      // Assert
      expect(result).toBe(true);
      expect(execa).not.toHaveBeenCalled();
    });

    test('should call npm install with --save-dev flag', async () => {
      // Arrange
      execa.mockResolvedValue({ stdout: 'Installed successfully' });
      // Act
      const result = await packageManager.installDev(['jest', 'eslint']);
      // Assert
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith(
        'npm',
        ['install', '--save-dev', 'jest', 'eslint'],
        expect.any(Object)
      );
      expect(logger.success).toHaveBeenCalled();
    });

    test('should handle installation errors', async () => {
      // Arrange
      execa.mockRejectedValue(new Error('Installation failed'));
      // Act
      const result = await packageManager.installDev(['jest']);
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('readPackageJson method', () => {
    test('should read and parse package.json file', async () => {
      // Arrange
      const packageJsonContent = JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
      });
      fs.readFile.mockResolvedValue(packageJsonContent);
      // Act
      const result = await packageManager.readPackageJson('package.json');
      // Assert
      expect(result).toEqual({
        name: 'test-package',
        version: '1.0.0',
      });
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String), 'utf8');
    });

    test('should handle file read errors', async () => {
      // Arrange
      fs.readFile.mockRejectedValue(new Error('File not found'));
      // Act
      const result = await packageManager.readPackageJson('package.json');
      // Assert
      expect(result).toEqual({});
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('writePackageJson method', () => {
    test('should write package.json file with correct formatting', async () => {
      // Arrange
      const packageData = {
        name: 'test-package',
        version: '1.0.0',
      };
      fs.writeFile.mockResolvedValue(undefined);
      // Act
      const result = await packageManager.writePackageJson('package.json', packageData);
      // Assert
      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(packageData, null, 2),
        'utf8'
      );
    });

    test('should handle file write errors', async () => {
      // Arrange
      fs.writeFile.mockRejectedValue(new Error('Write error'));
      // Act
      const result = await packageManager.writePackageJson('package.json', {});
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('getInstalledVersion method', () => {
    test('should return null if package is not installed', async () => {
      // Arrange
      jest.spyOn(packageManager, 'isInstalled').mockResolvedValue(false);
      // Act
      const result = await packageManager.getInstalledVersion('eslint');
      // Assert
      expect(result).toBeNull();
    });

    test('should read version from node_modules package.json if available', async () => {
      // Arrange
      jest.spyOn(packageManager, 'isInstalled').mockResolvedValue(true);
      fileSystem.fileExists.mockResolvedValue(true);
      jest.spyOn(packageManager, 'readPackageJson').mockResolvedValue({
        version: '8.0.0',
      });
      // Act
      const result = await packageManager.getInstalledVersion('eslint');
      // Assert
      expect(result).toBe('8.0.0');
    });

    test('should fallback to main package.json for version', async () => {
      // Arrange
      jest.spyOn(packageManager, 'isInstalled').mockResolvedValue(true);
      // Node modules package.json doesn't exist
      fileSystem.fileExists.mockImplementation(async (path) => {
        return !path.includes('node_modules');
      });
      // Mock readPackageJson to return different values based on path
      jest.spyOn(packageManager, 'readPackageJson').mockImplementation(async (path) => {
        if (path.includes('node_modules')) {
          return {};
        } else {
          return {
            dependencies: {
              'eslint': '^8.0.0',
            },
          };
        }
      });
      // Act
      const result = await packageManager.getInstalledVersion('eslint');
      // Assert
      expect(result).toBe('8.0.0'); // Should strip the ^ prefix
    });

    test('should check devDependencies if not found in dependencies', async () => {
      // Arrange
      jest.spyOn(packageManager, 'isInstalled').mockResolvedValue(true);
      fileSystem.fileExists.mockImplementation(async (path) => {
        return !path.includes('node_modules');
      });
      jest.spyOn(packageManager, 'readPackageJson').mockImplementation(async (path) => {
        if (path.includes('node_modules')) {
          return {};
        } else {
          return {
            devDependencies: {
              'eslint': '~8.0.0',
            },
          };
        }
      });
      // Act
      const result = await packageManager.getInstalledVersion('eslint');
      // Assert
      expect(result).toBe('8.0.0'); // Should strip the ~ prefix
    });

    test('should handle errors and return null', async () => {
      // Arrange
      jest.spyOn(packageManager, 'isInstalled').mockRejectedValue(new Error('Test error'));
      // Act
      const result = await packageManager.getInstalledVersion('eslint');
      // Assert
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});