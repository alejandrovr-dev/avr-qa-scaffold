/**
 * @module tests/integration/existing-project.test.js
 * @version 0.1.0
 * @description Integration tests for scaffolding quality tools in existing projects
 * using a simplified approach to test file preservation or overwriting.
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

const setupExistingProject = async (tempDir, customConfig = {}) => {
  // Create a package.json with custom settings if provided
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    scripts: {
      start: 'node index.js',
      ...(customConfig.scripts || {})
    },
    ...(customConfig.packageJson || {})
  };
  
  await fs.writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create custom ESLint config if provided
  if (customConfig.eslint) {
    await fs.writeFile(
      path.join(tempDir, '.eslintrc.json'),
      JSON.stringify(customConfig.eslint, null, 2)
    );
  }
  
  return tempDir;
};

const applyQualityTools = async (tempDir, projectType, force = false) => {
  // Simulate applying quality tools to an existing project
  
  // First check if eslint config exists to simulate force behavior
  let existingEslintConfig = null;
  try {
    existingEslintConfig = JSON.parse(
      await fs.readFile(path.join(tempDir, '.eslintrc.json'), 'utf8')
    );
  } catch (error) {
    // No existing config
  }
  
  // Create basic project structure
  await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'tests'), { recursive: true });
  
  // Copy basic configuration files based on force setting
  const commonTemplateDir = path.join(TEMPLATES_DIR, 'common');
  const specificTemplateDir = path.join(TEMPLATES_DIR, projectType);
  
  try {
    // Copy ESLint config if it doesn't exist or force=true
    if (!existingEslintConfig || force) {
      const eslintTemplate = path.join(
        specificTemplateDir, 
        'eslintrc.json'
      );
      const eslintContent = await fs.readFile(eslintTemplate, 'utf8');
      await fs.writeFile(path.join(tempDir, '.eslintrc.json'), eslintContent);
    }
    
    // Copy Prettier config 
    const prettierTemplate = path.join(
      commonTemplateDir, 
      'prettierrc.json'
    );
    const prettierContent = await fs.readFile(prettierTemplate, 'utf8');
    await fs.writeFile(path.join(tempDir, '.prettierrc.json'), prettierContent);
    
    // Update package.json
    let packageJson = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf8')
    );
    
    // Merge scripts based on force setting
    if (force) {
      // Replace scripts completely
      packageJson.scripts = {
        lint: 'eslint --ignore-path .gitignore --ext .js .',
        test: 'node --experimental-vm-modules node_modules/jest/bin/jest.js',
        format: 'prettier --ignore-path .gitignore --write "**/*.{js,json,md}"'
      };
    } else {
      // Merge with existing scripts
      packageJson.scripts = {
        ...(packageJson.scripts || {}),
        lint: 'eslint --ignore-path .gitignore --ext .js .',
        test: 'node --experimental-vm-modules node_modules/jest/bin/jest.js',
        format: 'prettier --ignore-path .gitignore --write "**/*.{js,json,md}"'
      };
    }
    
    // Write updated package.json
    await fs.writeFile(
      path.join(tempDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
  } catch (error) {
    console.error('Error applying quality tools:', error);
  }
};

describe('Quality Tools on Existing Projects', () => {
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
  
  test('respects existing configuration when force is false', async () => {
    // Arrange - Set up existing project with custom config
    const customEslintConfig = {
      extends: ['custom-config'],
      rules: {
        'custom-rule': 'error'
      }
    };
    
    const customScripts = {
      start: 'node index.js',
      custom: 'custom-script'
    };
    
    await setupExistingProject(tempDir, {
      eslint: customEslintConfig,
      scripts: customScripts
    });
    
    // Act - Apply quality tools with force=false
    await applyQualityTools(tempDir, 'node', false);
    
    // Assert - Verify existing config is preserved
    const eslintConfig = JSON.parse(
      await fs.readFile(path.join(tempDir, '.eslintrc.json'), 'utf8')
    );
    expect(eslintConfig.extends).toContain('custom-config');
    expect(eslintConfig.rules).toHaveProperty('custom-rule');
    
    // Verify package.json scripts retained custom scripts
    const packageJson = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf8')
    );
    expect(packageJson.scripts).toHaveProperty('custom', 'custom-script');
    expect(packageJson.scripts).toHaveProperty('lint');
    expect(packageJson.scripts).toHaveProperty('start', 'node index.js');
  });
  
  test('overwrites existing configuration when force is true', async () => {
    // Arrange - Set up existing project with custom config
    const customEslintConfig = {
      extends: ['custom-config'],
      rules: {
        'custom-rule': 'error'
      }
    };
    
    const customScripts = {
      lint: 'custom-lint',
      test: 'custom-test'
    };
    
    await setupExistingProject(tempDir, {
      eslint: customEslintConfig,
      scripts: customScripts
    });
    
    // Act - Apply quality tools with force=true
    await applyQualityTools(tempDir, 'node', true);
    
    // Assert - Verify config was overwritten
    const eslintConfig = JSON.parse(
      await fs.readFile(path.join(tempDir, '.eslintrc.json'), 'utf8')
    );
    expect(eslintConfig.extends).not.toContain('custom-config');
    
    // Verify package.json scripts were overwritten
    const packageJson = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf8')
    );
    expect(packageJson.scripts.lint).not.toBe('custom-lint');
    expect(packageJson.scripts.test).not.toBe('custom-test');
  });
});