import { ValidationContext } from './ValidationContext';
export type SingleValueCallback = (value: any, context: ValidationContext) => boolean | Promise<boolean>;
export type CrossFieldCallback = (values: Record<string, any>, context: ValidationContext) => boolean | Promise<boolean>;
export type ValidationCallback = SingleValueCallback | CrossFieldCallback;
export declare class CallbackRegistry {
    private callbacks;
    register(name: string, callback: ValidationCallback, options?: {
        type?: 'custom' | 'crossField' | 'computed';
        description?: string;
        overwrite?: boolean;
    }): void;
    get(name: string): ValidationCallback | undefined;
    has(name: string): boolean;
    unregister(name: string): boolean;
    listAll(): Array<{
        name: string;
        type: string;
        description?: string;
        predefined: boolean;
    }>;
    clearCustom(): void;
    registerPredefined(): void;
    private registerPredefinedComputedRules;
    private getPredefinedValidators;
}
export declare function getGlobalRegistry(): CallbackRegistry;
export declare function resetGlobalRegistry(): void;
//# sourceMappingURL=CallbackRegistry.d.ts.map