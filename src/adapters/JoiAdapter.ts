/**
 * JoiAdapter - Joi validation library adapter
 *
 * Adapts Joi validation library to the validator system
 * OPTIMIZED: Includes schema caching for static rule types
 */

import Joi from 'joi';
import { ValidationRule } from '../types';
import { ValidationContext } from '../core/ValidationContext';
import { CallbackRegistry } from '../core/CallbackRegistry';

/**
 * Cache key generation for cacheable rules
 * Only rules that don't depend on runtime context can be cached
 */
function getCacheableRuleKey(rule: ValidationRule): string | null {
  // Only cache static/stateless rules
  const cacheableTypes = [
    'required',
    'email',
    'numeric',
    'stringLength',
    'arrayLength',
    'range',
    'pattern',
  ];

  if (!cacheableTypes.includes(rule.type)) {
    return null; // Not cacheable (context-dependent)
  }

  // Build cache key from rule properties
  const keyParts: string[] = [rule.type];

  if (rule.min !== undefined) keyParts.push(`min:${rule.min}`);
  if (rule.max !== undefined) keyParts.push(`max:${rule.max}`);
  if (rule.pattern) keyParts.push(`pattern:${rule.pattern.toString()}`);
  if (rule.message) keyParts.push(`msg:${rule.message}`);

  return keyParts.join('|');
}

export class JoiAdapter {
  private registry: CallbackRegistry;

  /**
   * Schema cache for static/stateless rules
   * OPTIMIZATION: Avoids recreating identical Joi schemas
   */
  private schemaCache = new Map<string, Joi.Schema>();

  /**
   * Maximum cache size to prevent memory leaks
   */
  private static readonly MAX_CACHE_SIZE = 500;

  constructor(registry: CallbackRegistry) {
    this.registry = registry;
  }

  /**
   * Get schema from cache or create new one
   * OPTIMIZED: Caches static schemas to avoid recreation overhead
   */
  private getOrCreateSchema(rule: ValidationRule, context: ValidationContext): Joi.Schema {
    const cacheKey = getCacheableRuleKey(rule);

    // If not cacheable, create directly
    if (!cacheKey) {
      return this.createSchemaInternal(rule, context);
    }

    // Check cache
    const cached = this.schemaCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Create and cache
    const schema = this.createSchemaInternal(rule, context);

    // Evict old entries if cache is full (simple LRU approximation)
    if (this.schemaCache.size >= JoiAdapter.MAX_CACHE_SIZE) {
      const firstKey = this.schemaCache.keys().next().value;
      if (firstKey) {
        this.schemaCache.delete(firstKey);
      }
    }

    this.schemaCache.set(cacheKey, schema);
    return schema;
  }

  /**
   * Create Joi schema from validation rule
   * Public method that uses caching
   */
  createSchema(rule: ValidationRule, context: ValidationContext): Joi.Schema {
    return this.getOrCreateSchema(rule, context);
  }

  /**
   * Internal schema creation (uncached)
   */
  private createSchemaInternal(rule: ValidationRule, context: ValidationContext): Joi.Schema {
    switch (rule.type) {
      case 'required':
        // Type-agnostic required validation
        // Rejects null, undefined, and empty strings
        return Joi.any()
          .required()
          .custom((value, helpers) => {
            // Check for null or undefined
            if (value === null || value === undefined) {
              return helpers.error('any.required');
            }
            // Check for empty strings (but allow 0, false, etc.)
            if (typeof value === 'string' && value.trim() === '') {
              return helpers.error('any.required');
            }
            return value;
          })
          .messages({
            'any.required': rule.message || 'This field is required',
          });

      case 'email':
        // Use custom validation to allow empty strings
        return Joi.string()
          .optional()
          .allow('')
          .custom((value, helpers) => {
            if (value === '' || value === null || value === undefined) {
              return value;
            }
            // Simple email regex
            const emailRegex = /^[^ @]+@[^ @]+\.[^ @]+$/;
            if (!emailRegex.test(value)) {
              return helpers.error('string.email');
            }
            return value;
          })
          .messages({
            'string.email': rule.message || 'Invalid email format',
          });

      case 'numeric':
        return Joi.number().messages({
          'number.base': rule.message || 'Value must be a number',
        });

      case 'stringLength':
        return this.createStringLengthSchema(rule);

      case 'arrayLength':
        return this.createArrayLengthSchema(rule);

      case 'range':
        return this.createRangeSchema(rule);

      case 'pattern':
        return this.createPatternSchema(rule);

      case 'compare':
        return this.createCompareSchema(rule, context);

      case 'custom':
        return this.createCustomSchema(rule, context);

      case 'async':
        return this.createAsyncSchema(rule, context);

      case 'crossField':
        return this.createCrossFieldSchema(rule, context);

      case 'computed':
        // Computed rules don't perform validation, they calculate values
        return Joi.any();

      case 'temporal':
        return this.createTemporalSchema(rule, context);

      case 'plugin':
        return this.createPluginSchema(rule, context);

      default:
        return Joi.any();
    }
  }

  /**
   * Create string length validation schema
   */
  private createStringLengthSchema(rule: ValidationRule): Joi.Schema {
    let schema = Joi.string();

    if (rule.min !== undefined) {
      schema = schema.min(rule.min);
    }

    if (rule.max !== undefined) {
      schema = schema.max(rule.max);
    }

    return schema.messages({
      'string.min': rule.message || `String length must be at least ${rule.min}`,
      'string.max': rule.message || `String length must be at most ${rule.max}`,
    });
  }

  /**
   * Create array length validation schema
   */
  private createArrayLengthSchema(rule: ValidationRule): Joi.Schema {
    let schema = Joi.array();

    if (rule.min !== undefined) {
      schema = schema.min(rule.min);
    }

    if (rule.max !== undefined) {
      schema = schema.max(rule.max);
    }

    return schema.messages({
      'array.min': rule.message || `Array must have at least ${rule.min} items`,
      'array.max': rule.message || `Array must have at most ${rule.max} items`,
    });
  }

  /**
   * Create range validation schema
   */
  private createRangeSchema(rule: ValidationRule): Joi.Schema {
    let schema = Joi.number();

    if (rule.min !== undefined) {
      schema = schema.min(rule.min);
    }

    if (rule.max !== undefined) {
      schema = schema.max(rule.max);
    }

    return schema.messages({
      'number.min': rule.message || `Value must be at least ${rule.min}`,
      'number.max': rule.message || `Value must be at most ${rule.max}`,
    });
  }

  /**
   * Create pattern validation schema
   */
  private createPatternSchema(rule: ValidationRule): Joi.Schema {
    if (!rule.pattern) {
      return Joi.any();
    }

    const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;

    return Joi.string()
      .pattern(pattern)
      .messages({
        'string.pattern.base': rule.message || 'Value does not match the required pattern',
      });
  }

  /**
   * Create compare validation schema
   */
  private createCompareSchema(rule: ValidationRule, context: ValidationContext): Joi.Schema {
    if (!rule.comparisonTarget) {
      return Joi.any();
    }

    const targetValue = context.getValue(rule.comparisonTarget);
    const comparisonType = rule.comparisonType || '==';
    const customMessage = rule.message || `Value must be ${comparisonType} ${targetValue}`;

    return Joi.any()
      .custom((value, helpers) => {
        let isValid = false;

        switch (comparisonType) {
          case '==':
            isValid = value == targetValue;
            break;
          case '!=':
            isValid = value != targetValue;
            break;
          case '>':
            isValid = value > targetValue;
            break;
          case '<':
            isValid = value < targetValue;
            break;
          case '>=':
            isValid = value >= targetValue;
            break;
          case '<=':
            isValid = value <= targetValue;
            break;
        }

        if (!isValid) {
          return helpers.error('custom.compare');
        }

        return value;
      })
      .messages({
        'custom.compare': customMessage,
      });
  }

  /**
   * Create custom validation schema
   */
  private createCustomSchema(rule: ValidationRule, context: ValidationContext): Joi.Schema {
    if (!rule.validationCallback) {
      return Joi.any();
    }

    const callback =
      typeof rule.validationCallback === 'string'
        ? this.resolveCallback(rule.validationCallback)
        : rule.validationCallback;

    return Joi.any().custom(async (value, _helpers) => {
      try {
        const isValid = await callback(value, context);

        if (!isValid) {
          throw new Error(rule.message || 'Custom validation failed');
        }

        return value;
      } catch (error) {
        throw error instanceof Error ? error : new Error(rule.message || 'Custom validation error');
      }
    });
  }

  /**
   * Resolve callback from string reference
   */
  private resolveCallback(
    callbackName: string
  ): (value: any, context: ValidationContext) => boolean | Promise<boolean> {
    const callback = this.registry.get(callbackName);

    if (!callback) {
      console.warn(
        `⚠️  Validator "${callbackName}" not found in registry. Available validators: ${this.registry
          .listAll()
          .map((v) => v.name)
          .join(', ')}`
      );
      // Return a callback that always fails for safety
      return () => {
        console.error(`Validator "${callbackName}" was not registered. Validation will fail.`);
        return false;
      };
    }

    return callback as (value: any, context: ValidationContext) => boolean | Promise<boolean>;
  }

  /**
   * Create async validation schema (external API call)
   */
  private createAsyncSchema(rule: ValidationRule, _context: ValidationContext): Joi.Schema {
    if (!rule.apiEndpoint) {
      return Joi.any();
    }

    return Joi.any().custom(async (value, _helpers) => {
      try {
        const timeout = rule.apiTimeout || 5000;
        const method = rule.apiMethod || 'POST';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const payload = rule.apiPayload || {};
        const response = await fetch(rule.apiEndpoint!, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: method === 'POST' ? JSON.stringify({ value, ...payload }) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(rule.message || 'External validation failed');
        }

        const result = (await response.json()) as { valid: boolean; message?: string };
        if (!result.valid) {
          throw new Error(result.message || rule.message || 'External validation failed');
        }

        return value;
      } catch (error) {
        throw error instanceof Error
          ? error
          : new Error(rule.message || 'External validation error');
      }
    });
  }

  /**
   * Create cross-field validation schema
   */
  private createCrossFieldSchema(rule: ValidationRule, context: ValidationContext): Joi.Schema {
    if (!rule.targetFields || !rule.crossFieldValidator) {
      return Joi.any();
    }

    // Resolve validator: can be string, {name, params} object, or function
    let validator: (
      values: Record<string, any>,
      context: ValidationContext
    ) => boolean | Promise<boolean>;
    let params: Record<string, any> | undefined;

    if (typeof rule.crossFieldValidator === 'string') {
      validator = this.resolveCallback(rule.crossFieldValidator);
    } else if (typeof rule.crossFieldValidator === 'object' && 'name' in rule.crossFieldValidator) {
      // New parameterized format: { name: string, params?: Record<string, any> }
      validator = this.resolveCallback(rule.crossFieldValidator.name);
      params = rule.crossFieldValidator.params;
    } else if (typeof rule.crossFieldValidator === 'function') {
      validator = rule.crossFieldValidator;
    } else {
      return Joi.any(); // Unknown format, pass through
    }

    return Joi.any().custom(async (value, _helpers) => {
      try {
        // Gather values from target fields + include current field value
        const values: Record<string, any> = {
          _currentValue: value, // Current field's value for validators that need it
        };
        for (const targetField of rule.targetFields!) {
          values[targetField] = context.getValue(targetField);
        }

        // Pass params to validator if available (for parameterized validators)
        // Backend validators receive params via context.params
        // Temporarily inject params into context (mutable operation)
        if (params) {
          (context as any).params = params;
        }
        const isValid = await validator(values, context);
        // Clean up params after validation
        if (params) {
          delete (context as any).params;
        }

        if (!isValid) {
          // IMPORTANT: Must THROW for async custom validators, not return!
          throw new Error(rule.message || 'Cross-field validation failed');
        }

        return value;
      } catch (error) {
        // Re-throw the error so Joi can catch it
        throw error instanceof Error
          ? error
          : new Error(rule.message || 'Cross-field validation error');
      }
    });
  }

  /**
   * Create temporal validation schema (time-based rules)
   */
  private createTemporalSchema(rule: ValidationRule, _context: ValidationContext): Joi.Schema {
    // Pre-calculate dates for message generation
    const validFromDate = rule.validFrom
      ? typeof rule.validFrom === 'string'
        ? new Date(rule.validFrom)
        : rule.validFrom
      : null;
    const validUntilDate = rule.validUntil
      ? typeof rule.validUntil === 'string'
        ? new Date(rule.validUntil)
        : rule.validUntil
      : null;

    return Joi.any()
      .custom((value, helpers) => {
        try {
          const now = new Date();

          // Check validFrom
          if (validFromDate) {
            if (now < validFromDate) {
              const gracePeriod = rule.gracePeriod || 0;
              const graceEnd = new Date(validFromDate.getTime() + gracePeriod);

              if (now < graceEnd) {
                // Within grace period, allow but warn
                return value;
              }

              return helpers.error('custom.temporal.notYetValid');
            }
          }

          // Check validUntil
          if (validUntilDate) {
            if (now > validUntilDate) {
              return helpers.error('custom.temporal.expired');
            }
          }

          // TODO: Implement schedule (cron) validation
          if (rule.schedule) {
            // Would need a cron parser library
            // For now, just pass through
          }

          return value;
        } catch (error) {
          return helpers.error('custom.temporal.error');
        }
      })
      .messages({
        'custom.temporal.notYetValid':
          rule.message ||
          `This field is not valid until ${validFromDate?.toISOString() || 'unknown'}`,
        'custom.temporal.expired':
          rule.message || `This field expired on ${validUntilDate?.toISOString() || 'unknown'}`,
        'custom.temporal.error': rule.message || 'Temporal validation error',
      });
  }

  /**
   * Create plugin validation schema
   */
  private createPluginSchema(rule: ValidationRule, _context: ValidationContext): Joi.Schema {
    if (!rule.pluginName) {
      return Joi.any();
    }

    return Joi.any().custom(async (value, _helpers) => {
      try {
        // In a real implementation, this would load and execute the plugin
        // For now, return a placeholder

        // Example plugin registry lookup:
        // const plugin = pluginRegistry.get(rule.pluginName);
        // const result = await plugin.validate(value, rule.pluginConfig, context);

        // Placeholder implementation
        console.warn(`Plugin validation not implemented: ${rule.pluginName}`);
        return value;
      } catch (error) {
        throw error instanceof Error ? error : new Error(rule.message || 'Plugin validation error');
      }
    });
  }

  /**
   * Validate value against rule
   */
  async validate(
    value: any,
    rule: ValidationRule,
    context: ValidationContext
  ): Promise<{ valid: boolean; error?: string }> {
    const schema = this.createSchema(rule, context);

    try {
      await schema.validateAsync(value);
      return { valid: true };
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        return {
          valid: false,
          error: error.message,
        };
      }
      // Handle Error objects (thrown from custom validators)
      if (error instanceof Error) {
        return {
          valid: false,
          error: error.message,
        };
      }
      return {
        valid: false,
        error: 'Validation error',
      };
    }
  }

  /**
   * Validate value against multiple rules
   */
  async validateRules(
    value: any,
    rules: ValidationRule[],
    context: ValidationContext
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const rule of rules) {
      const result = await this.validate(value, rule, context);
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear the schema cache
   * Useful for testing or when rule definitions change dynamically
   */
  clearSchemaCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Get current cache size (for monitoring/debugging)
   */
  getSchemaCacheSize(): number {
    return this.schemaCache.size;
  }
}
