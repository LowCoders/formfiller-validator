import Joi from 'joi';
import { ValidationRule } from '../types';
import { ValidationContext } from '../core/ValidationContext';
import { CallbackRegistry } from '../core/CallbackRegistry';
export declare class JoiAdapter {
    private registry;
    private schemaCache;
    private static readonly MAX_CACHE_SIZE;
    constructor(registry: CallbackRegistry);
    private getOrCreateSchema;
    createSchema(rule: ValidationRule, context: ValidationContext): Joi.Schema;
    private createSchemaInternal;
    private createStringLengthSchema;
    private createArrayLengthSchema;
    private createRangeSchema;
    private createPatternSchema;
    private createCompareSchema;
    private createCustomSchema;
    private resolveCallback;
    private createAsyncSchema;
    private createCrossFieldSchema;
    private createTemporalSchema;
    private createPluginSchema;
    validate(value: any, rule: ValidationRule, context: ValidationContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    validateRules(value: any, rules: ValidationRule[], context: ValidationContext): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    clearSchemaCache(): void;
    getSchemaCacheSize(): number;
}
//# sourceMappingURL=JoiAdapter.d.ts.map