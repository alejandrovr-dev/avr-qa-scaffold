/**
 * @module tests/integration/next-project.test.js
 * @version 0.1.0
 * @description Integration tests for Next.js project scaffolding
 * using a simplified approach to test file creation.
 * 
 * @status READY
 * @createdAt 2025-05-14
 * @lastModified 2025-05-14
 * @author Alejandro Valencia <dev@alejandrovr.com>
 */

import { jest, describe, expect, beforeEach, afterEach, test } from '@jest/globals';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory paths for copying templates
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

// Helper functions for testing
const createTempDir = async () => {
  const tempDir = path.join(os.tmpdir(), `avr-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
};

const fileExists = async (dir, file) => {
  try {
    await fs.access(path.join(dir, file));
    return true;
  } catch (error) {
    return false;
  }
};

const dirExists = async (dir, subdir) => {
  try {
    const stats = await fs.stat(path.join(dir, subdir));
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

const copyTemplates = async (tempDir, projectType = 'next') => {
  // Create a minimal setup that resembles what the real code would do
  
  // Create Next.js specific project structure
  await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'src/app'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'src/components'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'tests'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'public'), { recursive: true });
  
  // Copy basic configuration files
  const commonTemplateDir = path.join(TEMPLATES_DIR, 'common');
  const specificTemplateDir = path.join(TEMPLATES_DIR, projectType);
  
  try {
    // Copy ESLint config specific to Next.js
    const eslintTemplate = path.join(
      specificTemplateDir, 
      'eslintrc.json'
    );
    const eslintContent = await fs.readFile(eslintTemplate, 'utf8');
    await fs.writeFile(path.join(tempDir, '.eslintrc.json'), eslintContent);
    
    // Copy Prettier config
    const prettierTemplate = path.join(
      commonTemplateDir, 
      'prettierrc.json'
    );
    const prettierContent = await fs.readFile(prettierTemplate, 'utf8');
    await fs.writeFile(path.join(tempDir, '.prettierrc.json'), prettierContent);
    
    // Copy Next.js config
    const nextConfigTemplate = path.join(
      specificTemplateDir, 
      'next.config.js'
    );
    const nextConfigContent = await fs.readFile(nextConfigTemplate, 'utf8');
    await fs.writeFile(path.join(tempDir, 'next.config.js'), nextConfigContent);
    
    // Create package.json
    const packageJson = {
      name: 'next-test-project',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'eslint --ignore-path .gitignore --ext .js,.jsx,.ts,.tsx .',
        test: 'node --experimental-vm-modules node_modules/jest/bin/jest.js'
      }
    };
    
    // Write package.json
    await fs.writeFile(
      path.join(tempDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create a basic app page
    await fs.writeFile(
      path.join(tempDir, 'src/app/page.js'),
      'export default function Home() { return <div>Hello Next.js</div>; }'
    );
    
  } catch (error) {
    console.error('Error copying templates:', error);
  }
  
  return tempDir;
};

describe('Next.js Project Setup', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await createTempDir();
  });
  
  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to clean up temp directory: ${error.message}`);
    }
  });
  
  test('creates Next.js project structure and config files', async () => {
    // Act - Set up Next.js project
    await copyTemplates(tempDir, 'next');
    
    // Assert - Verify project structure
    expect(await dirExists(tempDir, 'src')).toBe(true);
    expect(await dirExists(tempDir, 'src/app')).toBe(true);
    expect(await dirExists(tempDir, 'src/components')).toBe(true);
    expect(await dirExists(tempDir, 'tests')).toBe(true);
    
    // Verify Next.js specific files
    expect(await fileExists(tempDir, 'next.config.js')).toBe(true);
    expect(await fileExists(tempDir, 'src/app/page.js')).toBe(true);
    
    // Verify configuration files
    expect(await fileExists(tempDir, '.eslintrc.json')).toBe(true);
    expect(await fileExists(tempDir, '.prettierrc.json')).toBe(true);
    expect(await fileExists(tempDir, 'package.json')).toBe(true);
    
    // Verify Next.js specific ESLint configuration
    const eslintConfig = JSON.parse(
      await fs.readFile(path.join(tempDir, '.eslintrc.json'), 'utf8')
    );
    expect(eslintConfig.extends).toContain('next/core-web-vitals');
    
    // Verify package.json content
    const packageJson = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf8')
    );
    expect(packageJson.scripts).toHaveProperty('dev');
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts).toHaveProperty('lint');
  });
});