/**
 * ValidationResult - Validation result container
 *
 * Collects and manages validation results, errors, and metadata
 */

import {
  ValidationResult as IValidationResult,
  ValidationError,
  FieldValidationResult,
  ValidationMetadata,
  ValidationStats,
  DependencyGraphExport,
} from '../types';

export class ValidationResult implements IValidationResult {
  public valid: boolean;
  public errors: ValidationError[];
  public computedResults?: Record<string, any>;
  public fieldResults?: Record<string, FieldValidationResult>;
  public metadata?: ValidationMetadata;
  public dependencyGraph?: DependencyGraphExport;
  public stats?: ValidationStats;

  constructor() {
    this.valid = true;
    this.errors = [];
    this.computedResults = {};
    this.fieldResults = {};
  }

  /**
   * Add a validation error
   */
  addError(
    field: string,
    message: string,
    rule: string,
    params?: Record<string, any>,
    path?: string[]
  ): void {
    this.valid = false;
    this.errors.push({
      field,
      message,
      rule,
      params,
      path,
    });

    // Update field result
    if (!this.fieldResults) {
      this.fieldResults = {};
    }
    if (!this.fieldResults[field]) {
      this.fieldResults[field] = {
        valid: false,
        errors: [],
      };
    }
    this.fieldResults[field].valid = false;
    this.fieldResults[field].errors.push({
      field,
      message,
      rule,
      params,
      path,
    });
  }

  /**
   * Add multiple errors
   */
  addErrors(errors: ValidationError[]): void {
    for (const error of errors) {
      this.addError(error.field, error.message, error.rule, error.params, error.path);
    }
  }

  /**
   * Set field as valid
   */
  setFieldValid(field: string): void {
    if (!this.fieldResults) {
      this.fieldResults = {};
    }
    if (!this.fieldResults[field]) {
      this.fieldResults[field] = {
        valid: true,
        errors: [],
        skipped: false,
      };
    } else {
      this.fieldResults[field].valid = true;
      this.fieldResults[field].skipped = false;
    }
  }

  /**
   * Add computed result
   */
  addComputedResult(name: string, result: any): void {
    if (!this.computedResults) {
      this.computedResults = {};
    }
    this.computedResults[name] = result;
  }

  /**
   * Set field as skipped
   */
  setFieldSkipped(field: string, reason: string): void {
    if (!this.fieldResults) {
      this.fieldResults = {};
    }
    this.fieldResults[field] = {
      valid: true,
      errors: [],
      skipped: true,
      skipReason: reason,
    };
  }

  /**
   * Merge another result into this one
   */
  merge(other: ValidationResult): void {
    if (!other.valid) {
      this.valid = false;
    }

    // Merge errors
    this.errors.push(...other.errors);

    // Merge field results
    if (other.fieldResults) {
      if (!this.fieldResults) {
        this.fieldResults = {};
      }
      for (const [field, result] of Object.entries(other.fieldResults)) {
        if (this.fieldResults[field]) {
          // Merge existing field result
          if (!result.valid) {
            this.fieldResults[field].valid = false;
          }
          this.fieldResults[field].errors.push(...result.errors);
        } else {
          // Add new field result
          this.fieldResults[field] = result;
        }
      }
    }

    // Merge computed results
    if (other.computedResults) {
      if (!this.computedResults) {
        this.computedResults = {};
      }
      Object.assign(this.computedResults, other.computedResults);
    }

    // Merge stats
    if (other.stats && this.stats) {
      this.stats.totalRules += other.stats.totalRules;
      this.stats.passedRules += other.stats.passedRules;
      this.stats.failedRules += other.stats.failedRules;
      this.stats.skippedRules += other.stats.skippedRules;
      this.stats.computedRules += other.stats.computedRules;

      if (other.stats.executionTimes && this.stats.executionTimes) {
        Object.assign(this.stats.executionTimes, other.stats.executionTimes);
      }
    } else if (other.stats) {
      this.stats = other.stats;
    }
  }

  /**
   * Set metadata
   */
  setMetadata(metadata: ValidationMetadata): void {
    this.metadata = metadata;
  }

  /**
   * Set statistics
   */
  setStats(stats: ValidationStats): void {
    this.stats = stats;
  }

  /**
   * Set dependency graph export
   */
  setDependencyGraph(graph: DependencyGraphExport): void {
    this.dependencyGraph = graph;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): ValidationError[] {
    return this.errors.filter((error) => error.field === field);
  }

  /**
   * Get computed result by rule ID
   */
  getComputedResult(ruleId: string): any {
    return this.computedResults?.[ruleId];
  }

  /**
   * Check if a specific field is valid
   */
  isFieldValid(field: string): boolean {
    return this.fieldResults?.[field]?.valid ?? true;
  }

  /**
   * Check if a specific field was skipped
   */
  isFieldSkipped(field: string): boolean {
    return this.fieldResults?.[field]?.skipped ?? false;
  }

  /**
   * Convert to JSON
   */
  toJSON(): any {
    return {
      valid: this.valid,
      errors: this.errors,
      computedResults: this.computedResults,
      fieldResults: this.fieldResults,
      metadata: this.metadata,
      dependencyGraph: this.dependencyGraph,
      stats: this.stats,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: any): ValidationResult {
    const result = new ValidationResult();
    result.valid = json.valid;
    result.errors = json.errors || [];
    result.computedResults = json.computedResults;
    result.fieldResults = json.fieldResults;
    result.metadata = json.metadata;
    result.dependencyGraph = json.dependencyGraph;
    result.stats = json.stats;
    return result;
  }
}
