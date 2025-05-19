/**
 * Jest configuration for Node.js projects
 * Compatible with ECMAScript Modules
 */
export default {
  // Environment configuration
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.js', 
    '**/__tests__/**/*.js', 
    '**/?(*.)+(spec|test).js'
  ],
  
  // Import transformation for ESM
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Code coverage configuration
  collectCoverage: false,
  coverageDirectory: '.coverage',
  coverageReporters: ['lcov', 'html', 'text'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/*.bench.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
  ],
  
  // Directories to ignore
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/dist/', 
    '/build/',
    '\\.bench\\.js$'
  ],
  
  // Verbosity and other reporting options
  verbose: false,
  
  // Transform files
  transform: {},
  
  // Setup files
  setupFilesAfterEnv: ['./jest.setup.js'],
  
  // Timeout for tests
  testTimeout: 10000,
};