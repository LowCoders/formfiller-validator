import { FieldConfig, ValidationRule, ValidationRuleOrGroup, ConditionalExpression, ComputedRule } from 'formfiller-schema';
import type { ValidationRuleGroup } from 'formfiller-schema';
export { FieldConfig, ValidationRule, ValidationRuleOrGroup, ConditionalExpression, ComputedRule, } from 'formfiller-schema';
export type { ValidationRuleGroup };
export type SingleValueCallback = (value: any, context: any) => boolean | Promise<boolean>;
export type CrossFieldCallback = (values: Record<string, any>, context: any) => boolean | Promise<boolean>;
export type ValidationCallback = SingleValueCallback | CrossFieldCallback;
export interface ValidatorConfig {
    mode?: 'sequential' | 'parallel' | 'adaptive';
    locale?: string;
    cache?: CacheConfig;
    devtools?: boolean;
    monitoring?: MonitoringConfig;
    replay?: ReplayConfig;
    tenantContext?: TenantContext;
    adapter?: 'joi' | 'custom';
    customValidators?: Record<string, ValidationCallback>;
}
export interface CacheConfig {
    enabled: boolean;
    ttl?: number;
    maxSize?: number;
    debounceMs?: number;
}
export interface MonitoringConfig {
    enabled: boolean;
    metricsEndpoint?: string;
    alerts?: AlertConfig;
}
export interface AlertConfig {
    slack?: {
        webhookUrl: string;
        channel?: string;
    };
    email?: {
        smtp: {
            host: string;
            port: number;
            secure: boolean;
            auth: {
                user: string;
                pass: string;
            };
        };
        from: string;
        to: string[];
    };
}
export interface ReplayConfig {
    enabled: boolean;
    storeEvents?: boolean;
    maxEvents?: number;
}
export interface TenantContext {
    tenantId: string;
    organizationId?: string;
    level?: 'global' | 'org' | 'tenant' | 'form';
}
export interface ValidationContext {
    data: Record<string, any>;
    config: FormConfig;
    validatorConfig: ValidatorConfig;
    path: string[];
    cache?: Map<string, any>;
    dependencyGraph?: DependencyGraph;
    externalContext?: Record<string, any>;
    timestamp: Date;
}
export interface FormConfig {
    formId: string;
    items?: FieldConfig[];
    validationRules?: ValidationRuleOrGroup[];
    computedRules?: ComputedRule[];
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    computedResults?: Record<string, any>;
    fieldResults?: Record<string, FieldValidationResult>;
    metadata?: ValidationMetadata;
    dependencyGraph?: DependencyGraphExport;
    stats?: ValidationStats;
}
export interface ValidationError {
    field: string;
    message: string;
    rule: string;
    params?: Record<string, any>;
    path?: string[];
}
export interface FieldValidationResult {
    valid: boolean;
    errors: ValidationError[];
    skipped?: boolean;
    skipReason?: string;
}
export interface ValidationMetadata {
    timestamp: Date;
    duration: number;
    executionMode: 'sequential' | 'parallel';
    cacheHitRate?: number;
    tenantContext?: TenantContext;
}
export interface ValidationStats {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    skippedRules: number;
    computedRules: number;
    executionTimes?: Record<string, number>;
    parallelGroups?: number;
}
export interface DependencyNode {
    id: string;
    field: string;
    path?: string;
    dependencies: string[];
    dependents: string[];
    level: number;
    rules: ValidationRule[];
    computedRules?: ComputedRule[];
}
export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    levels: string[][];
    hasCircular: boolean;
    circularPaths?: string[][];
}
export interface DependencyGraphExport {
    nodes: Array<{
        id: string;
        field: string;
        level: number;
        ruleCount: number;
        computedRuleCount: number;
    }>;
    edges: Array<{
        from: string;
        to: string;
    }>;
    levels: string[][];
    hasCircular: boolean;
    circularPaths?: string[][];
}
export interface TemporalRule {
    id: string;
    schedule?: {
        start?: Date | string;
        end?: Date | string;
        cron?: string;
        daysOfWeek?: number[];
        timeRanges?: string[];
    };
    expiration?: {
        expiresAt: Date | string;
        gracePeriod?: number;
    };
    rule: ValidationRule;
}
export interface Plugin {
    id: string;
    name: string;
    version: string;
    author?: string;
    description?: string;
    init?: (validator: any) => void | Promise<void>;
    rules?: Record<string, (params: any) => ValidationRule>;
    computedRules?: Record<string, (params: any) => ComputedRule>;
    operators?: Record<string, (conditions: ConditionalExpression[]) => boolean>;
}
export interface ValidationEvent {
    id: string;
    timestamp: Date;
    type: 'validation_started' | 'rule_evaluated' | 'validation_completed' | 'error_occurred';
    data: any;
    snapshotId?: string;
}
export interface ValidationSnapshot {
    id: string;
    timestamp: Date;
    context: ValidationContext;
    partialResults: Partial<ValidationResult>;
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type AsyncFunction<T, R> = (arg: T) => Promise<R>;
export type ValidationFunction = (value: any, context: ValidationContext) => boolean | Promise<boolean>;
export type ComputationFunction = (values: Record<string, any>, context: ValidationContext) => any;
//# sourceMappingURL=index.d.ts.map