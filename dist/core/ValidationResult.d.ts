import { ValidationResult as IValidationResult, ValidationError, FieldValidationResult, ValidationMetadata, ValidationStats, DependencyGraphExport } from '../types';
export declare class ValidationResult implements IValidationResult {
    valid: boolean;
    errors: ValidationError[];
    computedResults?: Record<string, any>;
    fieldResults?: Record<string, FieldValidationResult>;
    metadata?: ValidationMetadata;
    dependencyGraph?: DependencyGraphExport;
    stats?: ValidationStats;
    constructor();
    addError(field: string, message: string, rule: string, params?: Record<string, any>, path?: string[]): void;
    addErrors(errors: ValidationError[]): void;
    setFieldValid(field: string): void;
    addComputedResult(name: string, result: any): void;
    setFieldSkipped(field: string, reason: string): void;
    merge(other: ValidationResult): void;
    setMetadata(metadata: ValidationMetadata): void;
    setStats(stats: ValidationStats): void;
    setDependencyGraph(graph: DependencyGraphExport): void;
    getFieldErrors(field: string): ValidationError[];
    getComputedResult(ruleId: string): any;
    isFieldValid(field: string): boolean;
    isFieldSkipped(field: string): boolean;
    toJSON(): any;
    static fromJSON(json: any): ValidationResult;
}
//# sourceMappingURL=ValidationResult.d.ts.map