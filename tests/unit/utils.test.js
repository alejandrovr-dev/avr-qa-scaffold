/**
 * @module tests/unit/utils.test.js
 * @version 0.1.0
 * @description Test para el módulo utils.js con enfoque híbrido
 */

import { jest, describe, expect } from '@jest/globals';
import path from 'path';
import chalk from 'chalk';

// Mockear solo lo necesario para evitar operaciones reales de archivos
const mockAccess = jest.fn();
const mockMkdir = jest.fn();

jest.unstable_mockModule('fs', () => ({
  promises: {
    access: mockAccess,
    mkdir: mockMkdir
  }
}));

// Importar el módulo real después de configurar mocks
const utilsModule = await import('../../src/utils.js');
const {
  logSuccess,
  logInfo,
  logWarning,
  logError,
  extractPackageName,
  extractPackageVersion,
  createDirIfNotExists,
  fileExists,
  getAbsolutePath,
  formatPath,
  VERSION
} = utilsModule;

describe('Utils Module', () => {
  /**
   * Tests para las funciones de logging
   */
  describe('Logging Functions', () => {
    // Espiar console.log
    const originalConsoleLog = console.log;
    let consoleOutput = [];
    
    beforeEach(() => {
      consoleOutput = [];
      console.log = jest.fn((...args) => {
        consoleOutput.push(args.join(' '));
      });
    });
    
    afterEach(() => {
      console.log = originalConsoleLog;
    });
    
    test('logSuccess logs message with success styling', () => {
      // Act
      logSuccess('Operation successful');
      
      // Assert
      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('Operation successful');
    });
    
    test('logInfo logs message with info styling', () => {
      // Act
      logInfo('Information message');
      
      // Assert
      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('Information message');
    });
    
    test('logWarning logs message with warning styling', () => {
      // Act
      logWarning('Warning message');
      
      // Assert
      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('Warning message');
    });
    
    test('logError logs message with error styling', () => {
      // Act
      logError('Error message');
      
      // Assert
      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('Error message');
    });
  });
  
  /**
   * Tests para las funciones de nombres de paquetes
   */
  describe('Package Name Functions', () => {
    test('extractPackageName extracts name from regular package', () => {
      // Act
      const name = extractPackageName('eslint@8.57.0');
      
      // Assert
      expect(name).toBe('eslint');
    });
    
    test('extractPackageName extracts name from scoped package', () => {
      // Act
      const name = extractPackageName('@commitlint/cli@19.0.3');
      
      // Assert
      expect(name).toBe('@commitlint/cli');
    });
    
    test('extractPackageName handles package without version', () => {
      // Act
      const name = extractPackageName('eslint');
      
      // Assert
      expect(name).toBe('eslint');
    });
    
    test('extractPackageName handles scoped package without version', () => {
      // Act
      const name = extractPackageName('@commitlint/cli');
      
      // Assert
      expect(name).toBe('@commitlint/cli');
    });
    
    test('extractPackageVersion extracts version from regular package', () => {
      // Act
      const version = extractPackageVersion('eslint@8.57.0');
      
      // Assert
      expect(version).toBe('8.57.0');
    });
    
    test('extractPackageVersion extracts version from scoped package', () => {
      // Act
      const version = extractPackageVersion('@commitlint/cli@19.0.3');
      
      // Assert
      expect(version).toBe('19.0.3');
    });
    
    test('extractPackageVersion returns null when no version', () => {
      // Act
      const version = extractPackageVersion('eslint');
      
      // Assert
      expect(version).toBeNull();
    });
    
    test('extractPackageVersion returns null for scoped package without version', () => {
      // Act
      const version = extractPackageVersion('@commitlint/cli');
      
      // Assert
      expect(version).toBeNull();
    });
  });
  
  /**
   * Tests para las funciones de archivos y directorios
   */
  describe('File and Directory Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockAccess.mockReset();
      mockMkdir.mockReset();
    });
    
    test('createDirIfNotExists creates directory if it does not exist', async () => {
      // Arrange
      mockMkdir.mockResolvedValue(undefined);
      
      // Act
      const result = await createDirIfNotExists('test-dir');
      
      // Assert
      expect(mockMkdir).toHaveBeenCalledWith('test-dir', { recursive: true });
      expect(result).toBe(true);
    });
    
    test('createDirIfNotExists returns false if directory exists', async () => {
      // Arrange
      mockMkdir.mockRejectedValue({ code: 'EEXIST' });
      
      // Act
      const result = await createDirIfNotExists('existing-dir');
      
      // Assert
      expect(mockMkdir).toHaveBeenCalled();
      expect(result).toBe(false);
    });
    
    test('createDirIfNotExists rethrows other errors', async () => {
      // Arrange
      const error = new Error('Permission denied');
      error.code = 'EPERM';
      mockMkdir.mockRejectedValue(error);
      
      // Act & Assert
      await expect(createDirIfNotExists('no-permission')).rejects.toThrow('Permission denied');
    });
    
    test('fileExists returns true if file exists', async () => {
      // Arrange
      mockAccess.mockResolvedValue(undefined);
      
      // Act
      const result = await fileExists('existing-file.js');
      
      // Assert
      expect(mockAccess).toHaveBeenCalledWith('existing-file.js');
      expect(result).toBe(true);
    });
    
    test('fileExists returns false if file does not exist', async () => {
      // Arrange
      mockAccess.mockRejectedValue(new Error('File not found'));
      
      // Act
      const result = await fileExists('non-existent-file.js');
      
      // Assert
      expect(mockAccess).toHaveBeenCalled();
      expect(result).toBe(false);
    });
    
    test('getAbsolutePath returns absolute path from relative', () => {
      // Arrange
      const cwd = process.cwd();
      
      // Act
      const result = getAbsolutePath('test/file.js');
      
      // Assert
      expect(result).toBe(path.resolve(cwd, 'test/file.js'));
    });
    
    test('formatPath makes absolute path relative to cwd', () => {
      // Arrange
      const cwd = process.cwd();
      const absolutePath = path.join(cwd, 'test/file.js');
      
      // Act
      const result = formatPath(absolutePath);
      
      // Assert
      expect(result).toBe('test/file.js');
    });
    
    test('formatPath leaves non-cwd paths unchanged', () => {
      // Arrange
      const absolutePath = '/other/path/file.js';
      
      // Act
      const result = formatPath(absolutePath);
      
      // Assert
      expect(result).toBe(absolutePath);
    });
  });
  
  /**
   * Tests para constantes y métodos auxiliares
   */
  describe('Constants and Helper Methods', () => {
    test('VERSION is defined', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
    });
  });
});