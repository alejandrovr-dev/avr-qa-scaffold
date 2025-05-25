/**
 * @module src/services/projectService.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Core business logic for project type management
 * Handles project configurations, types, dependencies, and directory structures
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-24
 * @lastModified 2025-05-24
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Common dependencies for all project types
 * @constant {string[]}
 * @private
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
  'jest@^29.7.0',
];

/**
 * Common directories for all project types
 * @constant {string[]}
 * @private
 */
const COMMON_DIRECTORIES = ['src', 'tests', 'tests/integration', 'tests/e2e'];

/**
 * Project type configurations
 * @constant {Object}
 * @private
 */
const PROJECT_TYPES = {
  node: {
    id: 'node',
    name: 'Node.js',
    description: 'Node.js application or library',
    dependencies: [...COMMON_DEPENDENCIES, 'eslint-config-airbnb-base@^15.0.0'],
    directories: [...COMMON_DIRECTORIES, 'src/utils'],
    packageJsonDefaults: {
      type: 'module',
      main: 'src/index.js',
      engines: {
        node: '>=20.0.0',
      },
    },
    templates: {
      base: 'common',
      specific: 'node',
    },
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
      '@testing-library/user-event@^14.5.1',
    ],
    directories: [...COMMON_DIRECTORIES, 'src/components', 'src/hooks', 'src/assets', 'public'],
    packageJsonDefaults: {
      type: 'module',
      engines: {
        node: '>=20.0.0',
      },
    },
    templates: {
      base: 'common',
      specific: 'react',
    },
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
      '@testing-library/user-event@^14.5.1',
    ],
    directories: [...COMMON_DIRECTORIES, 'src/app', 'src/components', 'src/lib', 'public'],
    packageJsonDefaults: {
      type: 'module',
      engines: {
        node: '>=20.0.0',
      },
    },
    templates: {
      base: 'common',
      specific: 'next',
    },
  },
};

/**
 * Creates a project service for managing project types and configurations
 * @returns {Object} Project service instance
 */
export function createProjectService() {
  return {
    /**
     * Get configuration for a specific project type
     * @param {string} projectType - Type of project (node, react, next)
     * @returns {Object|null} Project type configuration or null if not found
     */
    getProjectTypeConfig(projectType) {
      if (!projectType || typeof projectType !== 'string') {
        return null;
      }
      return PROJECT_TYPES[projectType.toLowerCase()] || null;
    },

    /**
     * Get all available project types
     * @returns {Object[]} Array of project type configurations
     */
    getAllProjectTypes() {
      return Object.values(PROJECT_TYPES);
    },

    /**
     * Get available project types formatted for CLI display
     * @returns {Object[]} Array of project types with display information
     */
    getAvailableProjectTypes() {
      return Object.values(PROJECT_TYPES).map(type => ({
        name: `${type.name} - ${type.description}`,
        value: type.id,
        description: type.description
      }));
    },

    /**
     * Check if a project type is valid
     * @param {string} projectType - Type of project to check
     * @returns {boolean} Whether the project type is valid
     */
    isValidProjectType(projectType) {
      if (!projectType || typeof projectType !== 'string') {
        return false;
      }
      return Object.keys(PROJECT_TYPES).includes(projectType.toLowerCase());
    },

    /**
     * Get dependencies for a project type
     * @param {string} projectType - Type of project
     * @returns {string[]} Array of dependencies with versions
     */
    getProjectDependencies(projectType) {
      const config = this.getProjectTypeConfig(projectType);
      return config ? [...config.dependencies] : [...COMMON_DEPENDENCIES];
    },

    /**
     * Get directories for a project type
     * @param {string} projectType - Type of project
     * @returns {string[]} Array of directory paths
     */
    getProjectDirectories(projectType) {
      const config = this.getProjectTypeConfig(projectType);
      return config ? [...config.directories] : [...COMMON_DIRECTORIES];
    },

    /**
     * Get package.json defaults for a project type
     * @param {string} projectType - Type of project
     * @returns {Object} Package.json default values
     */
    getPackageJsonDefaults(projectType) {
      const config = this.getProjectTypeConfig(projectType);
      return config ? { ...config.packageJsonDefaults } : {
        type: 'module',
        engines: { node: '>=20.0.0' }
      };
    },

    /**
     * Get template configuration for a project type
     * @param {string} projectType - Type of project
     * @returns {Object} Template configuration
     */
    getTemplateConfig(projectType) {
      const config = this.getProjectTypeConfig(projectType);
      return config ? { ...config.templates } : {
        base: 'common',
        specific: 'node'
      };
    },

    /**
     * Get default project type
     * @returns {string} Default project type identifier
     */
    getDefaultProjectType() {
      return 'node';
    },

    /**
     * Get project type names for CLI choices
     * @returns {string[]} Array of project type identifiers
     */
    getProjectTypeNames() {
      return Object.keys(PROJECT_TYPES);
    },

    /**
     * Get common dependencies shared by all project types
     * @returns {string[]} Array of common dependencies
     */
    getCommonDependencies() {
      return [...COMMON_DEPENDENCIES];
    },

    /**
     * Get common directories shared by all project types
     * @returns {string[]} Array of common directory paths
     */
    getCommonDirectories() {
      return [...COMMON_DIRECTORIES];
    },

    /**
     * Generate template variables for a project
     * @param {string} projectName - Name of the project
     * @param {string} projectType - Type of project
     * @returns {Object} Template variables
     */
    generateTemplateVariables(projectName, projectType) {
      const config = this.getProjectTypeConfig(projectType);
      return {
        projectName: projectName || 'my-project',
        projectType: config ? config.id : 'node',
        projectTypeName: config ? config.name : 'Node.js',
        year: new Date().getFullYear(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      };
    },

    /**
     * Check if project type supports specific features
     * @param {string} projectType - Type of project
     * @param {string} feature - Feature to check (e.g., 'react', 'ssr', 'components')
     * @returns {boolean} Whether the project type supports the feature
     */
    supportsFeature(projectType, feature) {
      const config = this.getProjectTypeConfig(projectType);
      if (!config) return false;

      const featureMap = {
        react: ['react', 'next'],
        ssr: ['next'],
        components: ['react', 'next'],
        hooks: ['react', 'next'],
        jsx: ['react', 'next'],
        'app-router': ['next'],
      };

      return featureMap[feature]?.includes(config.id) || false;
    }
  };
}