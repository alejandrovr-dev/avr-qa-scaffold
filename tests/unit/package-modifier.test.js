/**
 * @module tests/unit/package-modifier.test.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for the package-modifier module following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox approach. Tests verify the public API while
 * ensuring coverage of internal behavior.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-13
 * @lastModified 2025-05-13
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest, describe, expect } from '@jest/globals';

// Create mock functions
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockExecaCommand = jest.fn();
const mockGetProjectDependencies = jest.fn();
const mockLogSuccess = jest.fn();
const mockLogInfo = jest.fn();
const mockLogWarning = jest.fn();
const mockLogError = jest.fn();

// Set up mocks before imports
jest.unstable_mockModule('fs', () => ({
  promises: {
    readFile: mockReadFile,
    writeFile: mockWriteFile
  }
}));

jest.unstable_mockModule('execa', () => ({
  execaCommand: mockExecaCommand
}));

jest.unstable_mockModule('../../src/project-types.js', () => ({
  getProjectDependencies: mockGetProjectDependencies
}));

jest.unstable_mockModule('../../src/utils.js', () => ({
  logSuccess: mockLogSuccess,
  logInfo: mockLogInfo,
  logWarning: mockLogWarning,
  logError: mockLogError
}));

// Import the module after setting up mocks
const packageModifierModule = await import('../../src/package-modifier.js');
const {
  isPackageInstalled,
  modifyPackageJson,
  addScriptsToPackageJson,
  installDependencies,
  addDevDependencies
} = packageModifierModule;

describe('Package Modifier Module', () => {
  // Define common test data
  const samplePackageJson = {
    name: 'test-project',
    version: '1.0.0',
    scripts: {
      start: 'node index.js'
    }
  };

  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
    
    // Reset the default behavior of mocks
    mockExecaCommand.mockReset();
    mockExecaCommand.mockResolvedValue({ stdout: '' });
    
    mockReadFile.mockReset();
    mockReadFile.mockResolvedValue(JSON.stringify(samplePackageJson));
  });
  
  /**
   * isPackageInstalled Tests
   */
  describe('isPackageInstalled Function', () => {
    test('returns true when package is in dependencies', async () => {
      // Arrange
      mockReadFile.mockResolvedValue(JSON.stringify({
        dependencies: {
          'react': '^18.2.0'
        }
      }));
      
      // Act
      const installed = await isPackageInstalled('react');
      
      // Assert - function should check for existence, not value
      expect(installed).toBeTruthy();
      expect(mockReadFile).toHaveBeenCalledWith('package.json', 'utf8');
    });
    
    test('returns true when package is in devDependencies', async () => {
      // Arrange
      mockReadFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'eslint': '^8.57.0'
        }
      }));
      
      // Act
      const installed = await isPackageInstalled('eslint');
      
      // Assert - function should check for existence, not value
      expect(installed).toBeTruthy();
    });
    
    test('returns false when package is not installed', async () => {
      // Arrange
      mockReadFile.mockResolvedValue(JSON.stringify({
        dependencies: {},
        devDependencies: {}
      }));
      
      // Act
      const installed = await isPackageInstalled('eslint');
      
      // Assert
      expect(installed).toBeFalsy();
    });
    
    test('handles package with version specifier', async () => {
      // Arrange
      mockReadFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'eslint': '^8.57.0'
        }
      }));
      
      // Act
      const installed = await isPackageInstalled('eslint@8.57.0');
      
      // Assert - function should check for existence, not value
      expect(installed).toBeTruthy();
    });
    
    test('handles scoped packages', async () => {
      // Arrange
      mockReadFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          '@commitlint/cli': '^19.0.3'
        }
      }));
      
      // Act
      const installed = await isPackageInstalled('@commitlint/cli');
      
      // Assert - function should check for existence, not value
      expect(installed).toBeTruthy();
    });
    
    test('returns false when package.json cannot be read', async () => {
      // Arrange
      mockReadFile.mockRejectedValue(new Error('File not found'));
      
      // Act
      const installed = await isPackageInstalled('any-package');
      
      // Assert
      expect(installed).toBe(false);
      expect(mockLogError).toHaveBeenCalled();
    });
  });
  
  /**
   * modifyPackageJson Tests
   */
  describe('modifyPackageJson Function', () => {
    beforeEach(() => {
      // Default mock for package.json
      mockReadFile.mockResolvedValue(JSON.stringify(samplePackageJson));
    });
    
    test('merges values into package.json', async () => {
      // Arrange
      const values = {
        scripts: {
          test: 'jest',
          lint: 'eslint'
        },
        type: 'module'
      };
      
      // Act
      await modifyPackageJson(values);
      
      // Assert
      expect(mockWriteFile).toHaveBeenCalled();
      
      // Extract the written content
      const writtenContent = JSON.parse(mockWriteFile.mock.calls[0][1]);
      
      // Verify merge was correct
      expect(writtenContent.name).toBe('test-project');
      expect(writtenContent.version).toBe('1.0.0');
      expect(writtenContent.type).toBe('module');
      expect(writtenContent.scripts).toEqual({
        start: 'node index.js',
        test: 'jest',
        lint: 'eslint'
      });
    });
    
    test('handles deep merging of objects', async () => {
      // Arrange
      mockReadFile.mockResolvedValue(JSON.stringify({
        name: 'test-project',
        config: {
          setting1: 'value1'
        }
      }));
      
      const values = {
        config: {
          setting2: 'value2'
        }
      };
      
      // Act
      await modifyPackageJson(values);
      
      // Assert
      const writtenContent = JSON.parse(mockWriteFile.mock.calls[0][1]);
      
      // Verify deep merge was correct
      expect(writtenContent.config).toEqual({
        setting1: 'value1',
        setting2: 'value2'
      });
    });
    
    test('replaces arrays instead of merging them', async () => {
      // Arrange
      mockReadFile.mockResolvedValue(JSON.stringify({
        name: 'test-project',
        keywords: ['old', 'keywords']
      }));
      
      const values = {
        keywords: ['new', 'keywords']
      };
      
      // Act
      await modifyPackageJson(values);
      
      // Assert
      const writtenContent = JSON.parse(mockWriteFile.mock.calls[0][1]);
      
      // Verify arrays were replaced
      expect(writtenContent.keywords).toEqual(['new', 'keywords']);
    });
    
    test('throws error when package.json cannot be read', async () => {
      // Arrange
      mockReadFile.mockRejectedValue(new Error('Failed to read file'));
      
      // Act & Assert
      await expect(modifyPackageJson({ test: true }))
        .rejects.toThrow('Failed to read file');
      expect(mockLogError).toHaveBeenCalled();
    });
  });
  
  /**
   * installDependencies Tests
   */
  describe('installDependencies Function', () => {
    beforeEach(() => {
      // Reset mocks for this section
      mockReadFile.mockReset();
      mockExecaCommand.mockReset();
      mockExecaCommand.mockResolvedValue({ stdout: '' });
      
      // Mock default dependencies
      mockGetProjectDependencies.mockReturnValue([
        'eslint@^8.57.0',
        'prettier@^3.1.1'
      ]);
    });
    
    test('installs missing dependencies', async () => {
      // Arrange
      // Override isPackageInstalled for this test by providing a mock package.json
      // that doesn't have the packages
      mockReadFile.mockImplementation(async (path, encoding) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'test-project',
            dependencies: {},
            devDependencies: {}
          });
        }
        return '';
      });
      
      // Act
      await installDependencies({ projectType: 'node' });
      
      // Assert
      expect(mockExecaCommand).toHaveBeenCalledWith(
        expect.stringContaining('npm install --save-dev'),
        expect.anything()
      );
      expect(mockLogSuccess).toHaveBeenCalled();
    });
    
    test('skips already installed dependencies', async () => {
      // Arrange
      // Override isPackageInstalled for this test by providing a mock package.json
      // that has the packages already installed
      mockReadFile.mockImplementation(async (path, encoding) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'test-project',
            devDependencies: {
              'eslint': '^8.57.0',
              'prettier': '^3.1.1'
            }
          });
        }
        return '';
      });
      
      // Act
      await installDependencies({ projectType: 'node' });
      
      // Assert
      expect(mockExecaCommand).not.toHaveBeenCalled();
      expect(mockLogSuccess).toHaveBeenCalledWith('All dependencies are already installed.');
    });
    
    test('logs verbose output when verbose=true', async () => {
      // Arrange
      // Mock all packages as already installed
      mockReadFile.mockImplementation(async (path, encoding) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'test-project',
            devDependencies: {
              'eslint': '^8.57.0',
              'prettier': '^3.1.1'
            }
          });
        }
        return '';
      });
      
      // Act
      await installDependencies({ projectType: 'node', verbose: true });
      
      // Assert
      expect(mockLogInfo).toHaveBeenCalled();
    });
    
    test('throws error when installation fails', async () => {
      // Arrange
      // Mock packages as not installed
      mockReadFile.mockImplementation(async (path, encoding) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'test-project',
            dependencies: {},
            devDependencies: {}
          });
        }
        return '';
      });
      
      mockExecaCommand.mockRejectedValue(new Error('Installation failed'));
      
      // Act & Assert
      await expect(installDependencies({ projectType: 'node' }))
        .rejects.toThrow('Installation failed');
      expect(mockLogError).toHaveBeenCalled();
    });
    
    // Important: Reset mockExecaCommand after the test that rejects
    afterEach(() => {
      mockExecaCommand.mockReset();
      mockExecaCommand.mockResolvedValue({ stdout: '' });
    });
  });

  /**
   * addDevDependencies Tests
   */
  describe('addDevDependencies Function', () => {
    // Reset mocks before this suite runs
    beforeEach(() => {
      mockExecaCommand.mockReset();
      mockExecaCommand.mockResolvedValue({ stdout: '' });
    });
    
    test('installs specified dev dependencies', async () => {
      // Arrange
      const dependencies = ['react@^18.2.0', 'react-dom@^18.2.0'];
      
      // Act
      await addDevDependencies(dependencies);
      
      // Assert
      expect(mockExecaCommand).toHaveBeenCalledWith(
        'npm install --save-dev react@^18.2.0 react-dom@^18.2.0',
        expect.anything()
      );
      expect(mockLogSuccess).toHaveBeenCalled();
    });
    
    test('handles empty dependencies array', async () => {
      // Arrange
      const dependencies = [];
      
      // Act
      const result = await addDevDependencies(dependencies);
      
      // Assert
      expect(result).toBe(true);
      expect(mockExecaCommand).not.toHaveBeenCalled();
    });
    
    test('logs verbose output when verbose=true', async () => {
      // Arrange
      const dependencies = ['eslint'];
      
      // Act
      await addDevDependencies(dependencies, { verbose: true });
      
      // Assert
      expect(mockLogInfo).toHaveBeenCalled();
      expect(mockExecaCommand).toHaveBeenCalledWith(
        'npm install --save-dev eslint',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    test('throws error when installation fails', async () => {
      // Arrange
      mockExecaCommand.mockRejectedValue(new Error('Installation failed'));
      
      // Act & Assert
      await expect(addDevDependencies(['eslint']))
        .rejects.toThrow('Installation failed');
      expect(mockLogError).toHaveBeenCalled();
      
      // Reset mock after this test
      mockExecaCommand.mockReset();
      mockExecaCommand.mockResolvedValue({ stdout: '' });
    });
  });
  
  /**
   * addScriptsToPackageJson Tests
   */
  describe('addScriptsToPackageJson Function', () => {
    beforeEach(() => {
      // Reset mocks for this section
      mockReadFile.mockReset();
      mockWriteFile.mockReset();
      
      // Mock readFile to return a mock package.json that we can verify was modified
      mockReadFile.mockImplementation(async (path, encoding) => {
        if (path.includes('package.json')) {
          return JSON.stringify(samplePackageJson);
        }
        return '';
      });
    });
    
    test('adds scripts to package.json', async () => {
      // Act
      await addScriptsToPackageJson();
      
      // Assert
      // Verify that writeFile was called with a package.json that includes our scripts
      expect(mockWriteFile).toHaveBeenCalled();
      
      // Extract the written content
      const content = JSON.parse(mockWriteFile.mock.calls[0][1]);
      
      // Check that scripts were added
      expect(content.scripts).toBeDefined();
      expect(content.scripts.lint).toBeDefined();
      expect(content.scripts.test).toBeDefined();
      expect(content.scripts.commit).toBeDefined();
      
      // Check that config was added
      expect(content.config).toBeDefined();
      expect(content.config.commitizen).toBeDefined();
      expect(content.config.commitizen.path).toBe('./node_modules/cz-conventional-changelog');
      
      expect(mockLogSuccess).toHaveBeenCalled();
    });
    
    test('logs verbose output when verbose=true', async () => {
      // Act
      await addScriptsToPackageJson({ verbose: true });
      
      // Assert
      expect(mockLogInfo).toHaveBeenCalled();
    });
    
    test('throws error when modification fails', async () => {
      // Arrange - make readFile throw an error
      mockReadFile.mockRejectedValue(new Error('Modification failed'));
      
      // Act & Assert
      await expect(addScriptsToPackageJson())
        .rejects.toThrow('Modification failed');
      expect(mockLogError).toHaveBeenCalled();
    });
  });
});