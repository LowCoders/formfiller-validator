export type ClientCrossFieldCallback = (values: Record<string, any>, params?: Record<string, any>) => boolean;
export declare class ClientCallbackRegistry {
    private callbacks;
    constructor();
    register(name: string, callback: ClientCrossFieldCallback, description?: string, parameterized?: boolean): void;
    has(name: string | undefined): boolean;
    get(name: string): ClientCrossFieldCallback | undefined;
    execute(name: string, values: Record<string, any>, params?: Record<string, any>): boolean;
    getRegisteredNames(): string[];
    private registerPredefinedValidators;
}
export declare function getClientRegistry(): ClientCallbackRegistry;
export declare function resetClientRegistry(): void;
//# sourceMappingURL=ClientCallbackRegistry.d.ts.map