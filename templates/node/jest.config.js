export default {
  // Configuration for Node.js 20+ and ESModules
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/tests/**/?(*.)+(spec|test).js', '**/__tests__/**/?(*.)+(spec|test).js'],

  // Import transformation
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Code coverage
  collectCoverage: false,
  coverageDirectory: '.coverage',
  coverageReporters: ['lcov', 'html', 'text'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/*.bench.js',
    '!**/temp/**',
    '!**/.husky/**',
    '!**/node_modules/**',
    '!**/.vscode/**',
    '!**/.VSCodeCounter/**',
  ],

  // Paths to ignore
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tools/temp/', '\\.bench\\.js$'],
};