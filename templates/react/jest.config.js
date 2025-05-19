/**
 * Jest configuration for React projects
 */
export default {
  // React specific test environment
  testEnvironment: 'jsdom',
  
  // Test files pattern
  testMatch: [
    "**/__tests__/**/*.js",
    "**/__tests__/**/*.jsx",
    "**/?(*.)+(spec|test).js",
    "**/?(*.)+(spec|test).jsx"
  ],
  
  // React specific transformations
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    "\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    
    // Handle CSS imports (without CSS modules)
    "\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    
    // Handle image imports
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    
    // Handle module path aliases (if configured in your project)
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  
  // Setup files
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js"
  ],
  
  // Test coverage config
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx}",
    "!src/index.js",
    "!src/serviceWorker.js",
    "!src/reportWebVitals.js",
    "!src/setupTests.js"
  ],
  
  // Transforms
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  
  // Extensions to treat as ESM
  extensionsToTreatAsEsm: [".js", ".jsx"],
};