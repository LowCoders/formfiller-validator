"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    info: console.info,
};
const isDebugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1';
beforeAll(() => {
    if (!isDebugMode) {
        console.log = jest.fn();
        console.warn = jest.fn();
        console.debug = jest.fn();
        console.info = jest.fn();
        console.error = jest.fn();
    }
});
afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
});
jest.setTimeout(10000);
expect.extend({
    toBeValidResult(received) {
        const pass = received &&
            received.valid === true &&
            Array.isArray(received.errors) &&
            received.errors.length === 0;
        return {
            pass,
            message: () => pass
                ? `Expected result not to be valid`
                : `Expected result to be valid but got: valid=${received?.valid}, errors=${JSON.stringify(received?.errors)}`,
        };
    },
    toBeInvalidResult(received) {
        const pass = received &&
            received.valid === false &&
            Array.isArray(received.errors) &&
            received.errors.length > 0;
        return {
            pass,
            message: () => pass
                ? `Expected result not to be invalid`
                : `Expected result to be invalid but got: valid=${received?.valid}, errors=${JSON.stringify(received?.errors)}`,
        };
    },
});
//# sourceMappingURL=setup.js.map