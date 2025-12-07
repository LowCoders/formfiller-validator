declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidResult(): R;
            toBeInvalidResult(): R;
        }
    }
}
export {};
//# sourceMappingURL=setup.d.ts.map