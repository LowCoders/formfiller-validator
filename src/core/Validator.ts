/**
 * Validator - Main validator class
 *
 * Entry point for the validation system
 */

import { ValidatorConfig, FormConfig, ValidationResult as IValidationResult } from '../types';
import { ValidationContext } from './ValidationContext';
import { ValidationResult } from './ValidationResult';
import { ConfigProcessor } from '../processors/ConfigProcessor';
import { DependencyGraphBuilder } from '../utils/DependencyGraphBuilder';
import { CallbackRegistry, getGlobalRegistry } from './CallbackRegistry';

export class Validator {
  private readonly config: ValidatorConfig;
  private readonly configProcessor: ConfigProcessor;
  private readonly dependencyGraphBuilder: DependencyGraphBuilder;
  private readonly registry: CallbackRegistry;

  constructor(config: ValidatorConfig = {}) {
    this.config = {
      mode: config.mode || 'sequential',
      locale: config.locale || 'en',
      cache: config.cache,
      devtools: config.devtools,
      monitoring: config.monitoring,
      replay: config.replay,
      tenantContext: config.tenantContext,
      adapter: config.adapter || 'joi',
      customValidators: config.customValidators,
    };

    // Get or create the callback registry
    this.registry = getGlobalRegistry();

    // Register custom validators if provided
    if (config.customValidators) {
      Object.entries(config.customValidators).forEach(([name, callback]) => {
        this.registry.register(name, callback, {
          type: 'custom',
          description: `Custom validator: ${name}`,
        });
      });
    }

    this.configProcessor = new ConfigProcessor(this.registry);
    this.dependencyGraphBuilder = new DependencyGraphBuilder();
  }

  /**
   * Validate data against form configuration
   */
  async validate(
    data: Record<string, any>,
    formConfig: FormConfig,
    externalContext?: Record<string, any>
  ): Promise<IValidationResult> {
    const startTime = Date.now();
    const result = new ValidationResult();

    try {
      // Build dependency graph
      const dependencyGraph = this.dependencyGraphBuilder.build(formConfig);

      // Create validation context
      const context = new ValidationContext(data, formConfig, this.config, {
        cache: this.config.cache?.enabled ? new Map() : undefined,
        dependencyGraph,
        externalContext,
        timestamp: new Date(),
      });

      // Process form configuration and validate
      const validationResult = await this.configProcessor.process(context);

      // Set result
      result.merge(validationResult);

      // Add metadata
      const duration = Date.now() - startTime;
      result.setMetadata({
        timestamp: context.timestamp,
        duration,
        executionMode: this.config.mode === 'parallel' ? 'parallel' : 'sequential',
        tenantContext: this.config.tenantContext,
      });

      // Add dependency graph if devtools enabled
      if (this.config.devtools && dependencyGraph) {
        result.setDependencyGraph(this.exportDependencyGraph(dependencyGraph));
      }

      return result;
    } catch (error) {
      // Handle validation errors
      result.addError(
        '_global',
        error instanceof Error ? error.message : 'Unknown validation error',
        'system_error'
      );
      return result;
    }
  }

  /**
   * Validate a single field
   */
  async validateField(
    fieldName: string,
    _value: any,
    data: Record<string, any>,
    formConfig: FormConfig,
    externalContext?: Record<string, any>
  ): Promise<IValidationResult> {
    // For now, delegate to full validation and extract field result
    const fullResult = await this.validate(data, formConfig, externalContext);

    const result = new ValidationResult();
    const fieldResult = fullResult.fieldResults?.[fieldName];

    if (fieldResult) {
      if (!fieldResult.valid) {
        result.addErrors(fieldResult.errors);
      }
    }

    return result;
  }

  /**
   * Export dependency graph for visualization
   */
  private exportDependencyGraph(_graph: any): any {
    // Placeholder for now
    return {
      nodes: [],
      edges: [],
      levels: [],
      hasCircular: false,
    };
  }

  /**
   * Get validator configuration
   */
  getConfig(): ValidatorConfig {
    return { ...this.config };
  }
}
