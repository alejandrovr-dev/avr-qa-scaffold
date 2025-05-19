/**
 * Jest configuration for Next.js projects
 */
export default {
  // Next.js specific test environment
  testEnvironment: 'jsdom',
  
  // Test directories and patterns
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  
  // Next.js specific directories to ignore
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/"
  ],
  
  // Mock static imports
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    
    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    
    // Handle image imports
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    
    // Handle module path aliases (configured in Next.js)
    "^@/(.*)$": "<rootDir>/lib/$1"
  },
  
  // Transform files with appropriate transformer
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }]
  },
  
  // Setup files for Jest
  setupFilesAfterEnv: ["./jest.setup.js"],
  
  // Code coverage
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/_*.{js,jsx,ts,tsx}",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/pages/_app.js",
    "!src/pages/_document.js"
  ],
  
  // Next.js specific settings
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$"
  ],
};