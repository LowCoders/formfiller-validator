/**
 * ValidationContext - Validation execution context
 *
 * Maintains the state and context during validation execution
 */

import {
  ValidationContext as IValidationContext,
  FormConfig,
  ValidatorConfig,
  DependencyGraph,
} from '../types';

export class ValidationContext implements IValidationContext {
  public readonly data: Record<string, any>;
  public readonly config: FormConfig;
  public readonly validatorConfig: ValidatorConfig;
  public readonly path: string[];
  public readonly cache?: Map<string, any>;
  public readonly dependencyGraph?: DependencyGraph;
  public readonly externalContext?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    data: Record<string, any>,
    config: FormConfig,
    validatorConfig: ValidatorConfig,
    options: {
      path?: string[];
      cache?: Map<string, any>;
      dependencyGraph?: DependencyGraph;
      externalContext?: Record<string, any>;
      timestamp?: Date;
    } = {}
  ) {
    this.data = data;
    this.config = config;
    this.validatorConfig = validatorConfig;
    this.path = options.path || [];
    this.cache = options.cache;
    this.dependencyGraph = options.dependencyGraph;
    this.externalContext = options.externalContext;
    this.timestamp = options.timestamp || new Date();
  }

  /**
   * Create a child context for nested validation
   */
  createChild(newPath: string[], newData?: Record<string, any>): ValidationContext {
    return new ValidationContext(newData || this.data, this.config, this.validatorConfig, {
      path: newPath,
      cache: this.cache,
      dependencyGraph: this.dependencyGraph,
      externalContext: this.externalContext,
      timestamp: this.timestamp,
    });
  }

  /**
   * Get value from data by field path
   */
  getValue(fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value: any = this.data;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Set value in data by field path
   */
  setValue(fieldPath: string, newValue: any): void {
    const parts = fieldPath.split('.');
    let target: any = this.data;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part) continue;

      if (!(part in target) || typeof target[part] !== 'object') {
        target[part] = {};
      }
      target = target[part];
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      target[lastPart] = newValue;
    }
  }

  /**
   * Check if a field exists in the data
   */
  hasField(fieldPath: string): boolean {
    const parts = fieldPath.split('.');
    let value: any = this.data;

    for (const part of parts) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return false;
      }
      if (!(part in value)) {
        return false;
      }
      value = value[part];
    }

    return true;
  }

  /**
   * Get current path as string
   */
  getPathString(): string {
    return this.path.join('.');
  }

  /**
   * Clone the context with updated data
   */
  clone(
    updates: Partial<{
      data: Record<string, any>;
      path: string[];
      cache: Map<string, any>;
      externalContext: Record<string, any>;
    }>
  ): ValidationContext {
    return new ValidationContext(updates.data || this.data, this.config, this.validatorConfig, {
      path: updates.path || this.path,
      cache: updates.cache || this.cache,
      dependencyGraph: this.dependencyGraph,
      externalContext: updates.externalContext || this.externalContext,
      timestamp: this.timestamp,
    });
  }
}
