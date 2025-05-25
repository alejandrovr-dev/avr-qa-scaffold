/**
 * @module src/adapters/output/fileSystem/__tests__/nodeFsAdapter.test.js
 * @version 1.0.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Unit tests for node filesystem adapter following the AAA pattern
 * (Arrange-Act-Assert) and Blackbox pattern.
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-22
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

// Static imports
import { jest } from '@jest/globals';
import path from 'path';
import { isFileSystem } from '../../../../ports/output/fileSystemPort.js';

/**
 * Create manual mocks for fs.promises methods
 */
const mockFsMkdir = jest.fn();
const mockFsAccess = jest.fn();
const mockFsWriteFile = jest.fn();
const mockFsChmod = jest.fn();
/** 
 * And mock the fs module (substituting real module with our manual mocks)
 * This tells Jest: "whenever any module tries to import 'fs', return this mock object instead"
 */
jest.unstable_mockModule('fs', () => ({
  promises: {
    mkdir: mockFsMkdir,
    access: mockFsAccess,
    writeFile: mockFsWriteFile,
    chmod: mockFsChmod,
  },
}));
/**
 * Dynamic imports after mocking
 * Import the dependencies after have been mocked (for our own use in tests)
 * This import will receive our mocked versions, not the real dependencies
 */
const { promises: fs } = await import('fs');
/**
 * Import the adapter after mocking dependencies
 * When the adapter internally executes 'import { ... } from '...'',
 * it will receive our mocked dependencies instead of the real ones, transparently
 */
const { createNodeFileSystem } = await import('../nodeFsAdapter.js');

describe('NodeFS Adapter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a filesystem that satisfies the FileSystemPort interface', () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Act
    const result = isFileSystem(fileSystem);
    // Assert
    expect(result).toBe(true);
  });

  test('createDirIfNotExists should create a directory and return true', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Configure the mocked dependency to simulate a directory correctly created scenario
    // (when createDirIfNotExists calls fs.mkdir internally,
    // it will receive this mocked success response instead)
    fs.mkdir.mockResolvedValue(undefined);
    // Act
    const result = await fileSystem.createDirIfNotExists('test/dir');
    // Assert
    expect(result).toBe(true);
    expect(fs.mkdir).toHaveBeenCalledWith('test/dir', { recursive: true });
  });

  test('createDirIfNotExists should return false if directory already exists', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Configure the mocked dependency to simulate a directory already exists scenario
    // (when createDirIfNotExists calls fs.mkdir internally,
    // it will receive this mocked error response instead)
    const error = new Error('Directory exists');
    error.code = 'EEXIST';
    fs.mkdir.mockRejectedValue(error);
    // Act
    const result = await fileSystem.createDirIfNotExists('test/dir');
    // Assert
    expect(result).toBe(false);
    expect(fs.mkdir).toHaveBeenCalledWith('test/dir', { recursive: true });
  });

  test('createDirIfNotExists should throw if error is not EEXIST', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Configure the mocked dependency to simulate a permission error scenario
    // (when createDirIfNotExists calls fs.mkdir internally,
    // it will receive this mocked error response instead)
    const error = new Error('Permission denied');
    error.code = 'EPERM';
    fs.mkdir.mockRejectedValue(error);
    // Act & Assert
    await expect(fileSystem.createDirIfNotExists('test/dir')).rejects.toThrow(error);
    expect(fs.mkdir).toHaveBeenCalledWith('test/dir', { recursive: true });
  });

  test('fileExists should return true if file exists', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Configure the mocked dependency to simulate a file exists scenario
    // (when fileExists calls fs.access internally,
    // it will receive and use this mocked success response instead)
    fs.access.mockResolvedValue(undefined);
    // Act
    const result = await fileSystem.fileExists('test/file.js');
    // Assert
    expect(result).toBe(true);
    expect(fs.access).toHaveBeenCalledWith('test/file.js');
  });

  test('fileExists should return false if file does not exist', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Configure the mocked dependency to simulate a file not found scenario
    // (when fileExists calls fs.access internally,
    // it will receive this mocked negative response instead)
    fs.access.mockRejectedValue(new Error('File not found'));
    // Act
    const result = await fileSystem.fileExists('test/file.js');
    // Assert
    expect(result).toBe(false);
    expect(fs.access).toHaveBeenCalledWith('test/file.js');
  });

  test('getAbsolutePath should return the absolute path', () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const relativePath = 'test/file.js';
    const expectedPath = path.resolve(process.cwd(), relativePath);
    // Act
    const result = fileSystem.getAbsolutePath(relativePath);
    // Assert
    expect(result).toBe(expectedPath);
  });

  test('formatPath should return relative path when within cwd', () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const cwd = process.cwd();
    const absolutePath = path.join(cwd, 'test/file.js');
    // Act
    const result = fileSystem.formatPath(absolutePath);
    // Assert
    expect(result).toBe('test/file.js');
  });

  test('formatPath should return original path when not within cwd', () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const absolutePath = '/some/other/path/file.js';
    // Act
    const result = fileSystem.formatPath(absolutePath);
    // Assert
    expect(result).toBe(absolutePath);
  });

  test('getPackageRoot should return the package root directory', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Act
    const result = fileSystem.getPackageRoot();
    // Assert
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Verify it's an absolute path
    expect(path.isAbsolute(result)).toBe(true);
    // Verify it ends with a reasonable directory structure
    expect(result).toMatch(/avr-qa-scaffold$/);
  });

  test('writeFile should write content to file with UTF-8 encoding', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const filePath = 'test/file.txt';
    const content = 'Hello World!';
    fs.writeFile.mockResolvedValue(undefined);
    // Act
    await fileSystem.writeFile(filePath, content);
    // Assert
    expect(fs.writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
  });

  test('writeFile should throw error if write fails', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const filePath = 'test/file.txt';
    const content = 'Hello World!';
    const error = new Error('Write permission denied');
    fs.writeFile.mockRejectedValue(error);
    // Act & Assert
    await expect(fileSystem.writeFile(filePath, content)).rejects.toThrow(error);
    expect(fs.writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
  });

  test('chmod should change file permissions', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const filePath = 'test/script.sh';
    const mode = 0o755;
    fs.chmod.mockResolvedValue(undefined);
    // Act
    await fileSystem.chmod(filePath, mode);
    // Assert
    expect(fs.chmod).toHaveBeenCalledWith(filePath, mode);
  });

  test('chmod should throw error if chmod fails', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const filePath = 'test/script.sh';
    const mode = 0o755;
    const error = new Error('Permission denied');
    fs.chmod.mockRejectedValue(error);
    // Act & Assert
    await expect(fileSystem.chmod(filePath, mode)).rejects.toThrow(error);
    expect(fs.chmod).toHaveBeenCalledWith(filePath, mode);
  });

  test('chmod should handle different permission modes', async () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    const filePath = 'test/file.txt';
    fs.chmod.mockResolvedValue(undefined);
    // Act
    await fileSystem.chmod(filePath, 0o644);  // Read/write for owner, read for others
    // Assert
    expect(fs.chmod).toHaveBeenCalledWith(filePath, 0o644);
  });

  test('should create a filesystem that satisfies the FileSystemPort interface', () => {
    // Arrange
    const fileSystem = createNodeFileSystem();
    // Act
    const result = isFileSystem(fileSystem);
    // Assert
    expect(result).toBe(true);
  });
});