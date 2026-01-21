/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  // Test setup - suppress console logs unless DEBUG=true
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  
  // Output formatting
  verbose: false, // Less noisy output - use --verbose flag for detailed output
  
  // Performance
  maxWorkers: '50%',
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Module name mapper for ESM .js extensions
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Transform ESM packages from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(formfiller-schema|formfiller-types)/)',
  ],
};

module.exports = config;
