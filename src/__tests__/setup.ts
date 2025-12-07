/**
 * Jest Test Setup
 *
 * Configures the test environment:
 * - Suppresses console.log/warn unless DEBUG=true
 * - Sets up global test utilities
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  info: console.info,
};

// Check if DEBUG mode is enabled
const isDebugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

// Suppress console output during tests unless DEBUG is enabled
beforeAll(() => {
  if (!isDebugMode) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.debug = jest.fn();
    console.info = jest.fn();
    console.error = jest.fn(); // Also suppress errors in tests
  }
});

// Restore console after all tests
afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
});

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test utilities
expect.extend({
  toBeValidResult(received) {
    const pass =
      received &&
      received.valid === true &&
      Array.isArray(received.errors) &&
      received.errors.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? `Expected result not to be valid`
          : `Expected result to be valid but got: valid=${received?.valid}, errors=${JSON.stringify(received?.errors)}`,
    };
  },
  toBeInvalidResult(received) {
    const pass =
      received &&
      received.valid === false &&
      Array.isArray(received.errors) &&
      received.errors.length > 0;
    return {
      pass,
      message: () =>
        pass
          ? `Expected result not to be invalid`
          : `Expected result to be invalid but got: valid=${received?.valid}, errors=${JSON.stringify(received?.errors)}`,
    };
  },
});

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidResult(): R;
      toBeInvalidResult(): R;
    }
  }
}

export {};
