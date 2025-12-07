import { ValidationContext as IValidationContext, FormConfig, ValidatorConfig, DependencyGraph } from '../types';
export declare class ValidationContext implements IValidationContext {
    readonly data: Record<string, any>;
    readonly config: FormConfig;
    readonly validatorConfig: ValidatorConfig;
    readonly path: string[];
    readonly cache?: Map<string, any>;
    readonly dependencyGraph?: DependencyGraph;
    readonly externalContext?: Record<string, any>;
    readonly timestamp: Date;
    constructor(data: Record<string, any>, config: FormConfig, validatorConfig: ValidatorConfig, options?: {
        path?: string[];
        cache?: Map<string, any>;
        dependencyGraph?: DependencyGraph;
        externalContext?: Record<string, any>;
        timestamp?: Date;
    });
    createChild(newPath: string[], newData?: Record<string, any>): ValidationContext;
    getValue(fieldPath: string): any;
    setValue(fieldPath: string, newValue: any): void;
    hasField(fieldPath: string): boolean;
    getPathString(): string;
    clone(updates: Partial<{
        data: Record<string, any>;
        path: string[];
        cache: Map<string, any>;
        externalContext: Record<string, any>;
    }>): ValidationContext;
}
//# sourceMappingURL=ValidationContext.d.ts.map