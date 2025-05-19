/**
 * @module src/project-types.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Defines different project types supported by the QA scaffold
 * Contains configuration settings specific to each project type
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-09
 * @lastModified 2025-05-09
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Common dependencies for all project types
 * @constant {string[]}
 */
const COMMON_DEPENDENCIES = [
  'eslint@^8.57.0',
  'eslint-plugin-import@^2.29.1',
  'eslint-plugin-jest@^27.9.0',
  'eslint-plugin-promise@^6.1.1',
  'eslint-config-prettier@^9.1.0',
  'eslint-plugin-prettier@^5.1.3',
  'prettier@^3.1.1',
  'husky@^9.0.11',
  'lint-staged@^15.2.2',
  '@commitlint/cli@^19.0.3',
  '@commitlint/config-conventional@^19.0.3',
  'commitizen@^4.3.0',
  'cz-conventional-changelog@^3.3.0',
  'jest@^29.7.0'
];

/**
 * Common directories for all project types
 * @constant {string[]}
 */
const COMMON_DIRECTORIES = [
  'src',
  'tests',
  'tests/integration',
  'tests/e2e',
];

/**
 * Project type configurations
 * @constant {Object}
 */
export const PROJECT_TYPES = {
  node: {
    id: 'node',
    name: 'Node.js',
    description: 'Node.js application or library',
    dependencies: [
      ...COMMON_DEPENDENCIES,
      'eslint-config-airbnb-base@^15.0.0'
    ],
    directories: [
      ...COMMON_DIRECTORIES,
      'src/utils'
    ],
    packageJsonDefaults: {
      type: 'module',
      main: 'src/index.js',
      engines: {
        node: '>=20.0.0'
      }
    },
    templates: {
      base: 'common',
      specific: 'node'
    }
  },
  
  react: {
    id: 'react',
    name: 'React',
    description: 'React application',
    dependencies: [
      ...COMMON_DEPENDENCIES,
      'eslint-config-airbnb@^19.0.4',
      'eslint-plugin-react@^7.33.2',
      'eslint-plugin-react-hooks@^4.6.0',
      'eslint-plugin-jsx-a11y@^6.8.0',
      '@testing-library/react@^14.1.2',
      '@testing-library/jest-dom@^6.1.5',
      '@testing-library/user-event@^14.5.1'
    ],
    directories: [
      ...COMMON_DIRECTORIES,
      'src/components',
      'src/hooks',
      'src/assets',
      'public'
    ],
    packageJsonDefaults: {
      type: 'module',
      engines: {
        node: '>=20.0.0'
      }
    },
    templates: {
      base: 'common',
      specific: 'react'
    }
  },
  
  next: {
    id: 'next',
    name: 'Next.js',
    description: 'Next.js application',
    dependencies: [
      ...COMMON_DEPENDENCIES,
      'eslint-config-next@^14.2.0',
      'eslint-plugin-react@^7.33.2',
      'eslint-plugin-react-hooks@^4.6.0',
      'eslint-plugin-jsx-a11y@^6.8.0',
      '@testing-library/react@^14.1.2',
      '@testing-library/jest-dom@^6.1.5',
      '@testing-library/user-event@^14.5.1'
    ],
    directories: [
      ...COMMON_DIRECTORIES,
      'src/app',
      'src/components',
      'src/lib',
      'public'
    ],
    packageJsonDefaults: {
      type: 'module',
      engines: {
        node: '>=20.0.0'
      }
    },
    templates: {
      base: 'common',
      specific: 'next'
    }
  }
};

/**
 * Get configuration for a specific project type
 * @param {string} projectType - Type of project (node, react, next)
 * @returns {Object|null} Project type configuration or null if not found
 */
export function getProjectTypeConfig(projectType) {
  return PROJECT_TYPES[projectType] || null;
}

/**
 * Get all available project types
 * @returns {Object[]} Array of project types
 */
export function getAllProjectTypes() {
  return Object.values(PROJECT_TYPES);
}

/**
 * Check if a project type is valid
 * @param {string} projectType - Type of project to check
 * @returns {boolean} Whether the project type is valid
 */
export function isValidProjectType(projectType) {
  return Object.keys(PROJECT_TYPES).includes(projectType);
}

/**
 * Get dependencies for a project type
 * @param {string} projectType - Type of project
 * @returns {string[]} Array of dependencies
 */
export function getProjectDependencies(projectType) {
  const config = getProjectTypeConfig(projectType);
  return config ? config.dependencies : COMMON_DEPENDENCIES;
}

/**
 * Get directories for a project type
 * @param {string} projectType - Type of project
 * @returns {string[]} Array of directories
 */
export function getProjectDirectories(projectType) {
  const config = getProjectTypeConfig(projectType);
  return config ? config.directories : COMMON_DIRECTORIES;
}