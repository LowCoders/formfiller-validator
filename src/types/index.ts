/**
 * FormFiller Validator - Type Definitions
 *
 * Core types for the validation system
 */

// Import types from formfiller-schema
import {
  FieldConfig,
  ValidationRule,
  ValidationRuleOrGroup,
  ConditionalExpression,
  ComputedRule,
} from 'formfiller-schema';
import type { ValidationRuleGroup } from 'formfiller-schema';

// Re-export schema types for convenience
export {
  FieldConfig,
  ValidationRule,
  ValidationRuleOrGroup,
  ConditionalExpression,
  ComputedRule,
} from 'formfiller-schema';
export type { ValidationRuleGroup };

// ============================================================================
// Validator Types
// ============================================================================

/**
 * Validation callback signature for single-value validators (custom validation)
 */
export type SingleValueCallback = (value: any, context: any) => boolean | Promise<boolean>;

/**
 * Validation callback signature for cross-field validators
 */
export type CrossFieldCallback = (
  values: Record<string, any>,
  context: any
) => boolean | Promise<boolean>;

/**
 * Union type for all validation callbacks
 */
export type ValidationCallback = SingleValueCallback | CrossFieldCallback;

/**
 * Validator configuration options
 */
export interface ValidatorConfig {
  /** Execution mode: sequential, parallel, or adaptive */
  mode?: 'sequential' | 'parallel' | 'adaptive';

  /** Locale for error messages */
  locale?: string;

  /** Cache configuration */
  cache?: CacheConfig;

  /** Enable development tools (dependency graph viewer, profiling) */
  devtools?: boolean;

  /** Monitoring configuration */
  monitoring?: MonitoringConfig;

  /** Replay/event sourcing configuration */
  replay?: ReplayConfig;

  /** Multi-tenancy configuration */
  tenantContext?: TenantContext;

  /** Custom adapter (default: Joi) */
  adapter?: 'joi' | 'custom';

  /** Custom validator functions (name -> callback) */
  customValidators?: Record<string, ValidationCallback>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Maximum cache size */
  maxSize?: number;
  /** Debounce delay for validation in milliseconds */
  debounceMs?: number;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  /** Metrics collection endpoint (Prometheus compatible) */
  metricsEndpoint?: string;
  /** Alert configuration */
  alerts?: AlertConfig;
}

/**
 * Alert configuration
 */
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

/**
 * Replay/event sourcing configuration
 */
export interface ReplayConfig {
  enabled: boolean;
  /** Store events for replay */
  storeEvents?: boolean;
  /** Maximum number of events to store */
  maxEvents?: number;
}

/**
 * Multi-tenancy tenant context
 */
export interface TenantContext {
  tenantId: string;
  organizationId?: string;
  /** Hierarchy level: global, org, tenant, form */
  level?: 'global' | 'org' | 'tenant' | 'form';
}

// ============================================================================
// Validation Context
// ============================================================================

/**
 * Validation context passed through the validation process
 */
export interface ValidationContext {
  /** Current form data */
  data: Record<string, any>;

  /** Form configuration */
  config: FormConfig;

  /** Validator configuration */
  validatorConfig: ValidatorConfig;

  /** Current execution path (for nested structures) */
  path: string[];

  /** Cached results from previous validations */
  cache?: Map<string, any>;

  /** Dependency graph */
  dependencyGraph?: DependencyGraph;

  /** External context (user info, tenant, etc.) */
  externalContext?: Record<string, any>;

  /** Timestamp of validation start */
  timestamp: Date;
}

// ============================================================================
// Form Configuration
// ============================================================================

/**
 * Form configuration (uses FieldConfig from formfiller-schema)
 */
export interface FormConfig {
  formId: string;
  items?: FieldConfig[]; // ← Changed from FormItem[] to FieldConfig[]
  validationRules?: ValidationRuleOrGroup[];
  /** Form-level computed rules */
  computedRules?: ComputedRule[];
}

// ============================================================================
// Computed Rules (validator-specific)
// ============================================================================
// Note: ComputedRule is imported from formfiller-schema
// Note: ConditionalExpression types are now imported from formfiller-schema
// No need to redefine them here

// ============================================================================
// Validation Results
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Overall validation status */
  valid: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Computed rule results */
  computedResults?: Record<string, any>;

  /** Field-level results */
  fieldResults?: Record<string, FieldValidationResult>;

  /** Metadata */
  metadata?: ValidationMetadata;

  /** Dependency graph (if devtools enabled) */
  dependencyGraph?: DependencyGraphExport;

  /** Execution statistics */
  stats?: ValidationStats;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Field name (dataPath) */
  field: string;

  /** Error message */
  message: string;

  /** Rule that failed */
  rule: string;

  /** Rule parameters */
  params?: Record<string, any>;

  /** Nested path (for nested structures) */
  path?: string[];
}

/**
 * Field validation result
 */
export interface FieldValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** Whether this field was skipped (e.g., disabled, not visible) */
  skipped?: boolean;
  /** Reason for skipping */
  skipReason?: string;
}

/**
 * Validation metadata
 */
export interface ValidationMetadata {
  /** Validation timestamp */
  timestamp: Date;

  /** Validation duration in milliseconds */
  duration: number;

  /** Execution mode used */
  executionMode: 'sequential' | 'parallel';

  /** Cache hit rate (if cache enabled) */
  cacheHitRate?: number;

  /** Tenant context */
  tenantContext?: TenantContext;
}

/**
 * Validation statistics
 */
export interface ValidationStats {
  /** Total number of rules evaluated */
  totalRules: number;

  /** Number of rules passed */
  passedRules: number;

  /** Number of rules failed */
  failedRules: number;

  /** Number of rules skipped */
  skippedRules: number;

  /** Number of computed rules evaluated */
  computedRules: number;

  /** Execution time per rule (ms) */
  executionTimes?: Record<string, number>;

  /** Parallel execution groups */
  parallelGroups?: number;
}

// ============================================================================
// Dependency Graph
// ============================================================================

/**
 * Dependency graph node
 */
export interface DependencyNode {
  id: string;
  field: string;
  /** Full field path (for nested fields) */
  path?: string;
  dependencies: string[];
  dependents: string[];
  level: number;
  /** Rules attached to this node */
  rules: ValidationRule[];
  /** Computed rules attached to this node */
  computedRules?: ComputedRule[];
}

/**
 * Dependency graph
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  /** Execution levels (for parallel execution) */
  levels: string[][];
  /** Has circular dependencies */
  hasCircular: boolean;
  /** Circular dependency paths */
  circularPaths?: string[][];
}

/**
 * Dependency graph export (for visualization)
 */
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

// ============================================================================
// Temporal Validation
// ============================================================================

/**
 * Temporal validation rule
 */
export interface TemporalRule {
  /** Rule identifier */
  id: string;

  /** Schedule configuration */
  schedule?: {
    /** Start date/time */
    start?: Date | string;
    /** End date/time */
    end?: Date | string;
    /** Cron expression */
    cron?: string;
    /** Days of week (0-6, 0 = Sunday) */
    daysOfWeek?: number[];
    /** Time ranges (HH:mm-HH:mm) */
    timeRanges?: string[];
  };

  /** Expiration configuration */
  expiration?: {
    /** Expiration date/time */
    expiresAt: Date | string;
    /** Grace period in seconds */
    gracePeriod?: number;
  };

  /** Base validation rule to apply when temporal condition is met */
  rule: ValidationRule;
}

// ============================================================================
// Plugin System
// ============================================================================

/**
 * Plugin interface
 */
export interface Plugin {
  /** Plugin identifier */
  id: string;

  /** Plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin author */
  author?: string;

  /** Plugin description */
  description?: string;

  /** Initialize plugin */
  init?: (validator: any) => void | Promise<void>;

  /** Register custom rules */
  rules?: Record<string, (params: any) => ValidationRule>;

  /** Register custom computed rules */
  computedRules?: Record<string, (params: any) => ComputedRule>;

  /** Register custom operators */
  operators?: Record<string, (conditions: ConditionalExpression[]) => boolean>;
}

// ============================================================================
// Replay & Event Sourcing
// ============================================================================

/**
 * Validation event
 */
export interface ValidationEvent {
  /** Event identifier */
  id: string;

  /** Event timestamp */
  timestamp: Date;

  /** Event type */
  type: 'validation_started' | 'rule_evaluated' | 'validation_completed' | 'error_occurred';

  /** Event data */
  data: any;

  /** Snapshot identifier (if snapshot taken) */
  snapshotId?: string;
}

/**
 * Validation snapshot
 */
export interface ValidationSnapshot {
  /** Snapshot identifier */
  id: string;

  /** Snapshot timestamp */
  timestamp: Date;

  /** Validation context at snapshot time */
  context: ValidationContext;

  /** Partial results at snapshot time */
  partialResults: Partial<ValidationResult>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Async function type
 */
export type AsyncFunction<T, R> = (arg: T) => Promise<R>;

/**
 * Validation function type
 */
export type ValidationFunction = (
  value: any,
  context: ValidationContext
) => boolean | Promise<boolean>;

/**
 * Computation function type
 */
export type ComputationFunction = (values: Record<string, any>, context: ValidationContext) => any;
