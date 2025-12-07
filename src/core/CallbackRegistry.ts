/**
 * CallbackRegistry - Manages custom and predefined validation callbacks
 *
 * This registry allows validators to resolve string references (e.g., "passwordMatch")
 * to actual validation functions. It comes with predefined validators for common cases
 * and allows registration of custom validators.
 */

import { ValidationContext } from './ValidationContext';

/**
 * Validation callback signature for single-value validators (custom validation)
 */
export type SingleValueCallback = (
  value: any,
  context: ValidationContext
) => boolean | Promise<boolean>;

/**
 * Validation callback signature for cross-field validators
 */
export type CrossFieldCallback = (
  values: Record<string, any>,
  context: ValidationContext
) => boolean | Promise<boolean>;

/**
 * Union type for all validation callbacks
 */
export type ValidationCallback = SingleValueCallback | CrossFieldCallback;

/**
 * Registry entry with metadata
 */
interface RegistryEntry {
  callback: ValidationCallback;
  type: 'custom' | 'crossField' | 'computed';
  description?: string;
  predefined: boolean;
}

/**
 * CallbackRegistry class - manages validation callbacks
 */
export class CallbackRegistry {
  private callbacks: Map<string, RegistryEntry> = new Map();

  /**
   * Register a custom validation callback
   */
  register(
    name: string,
    callback: ValidationCallback,
    options: {
      type?: 'custom' | 'crossField' | 'computed';
      description?: string;
      overwrite?: boolean;
    } = {}
  ): void {
    const { type = 'custom', description, overwrite = false } = options;

    // Check if already exists
    if (this.callbacks.has(name) && !overwrite) {
      const existing = this.callbacks.get(name)!;
      if (existing.predefined) {
        console.warn(
          `Cannot override predefined validator "${name}". Use overwrite: true to force.`
        );
        return;
      }
    }

    this.callbacks.set(name, {
      callback,
      type,
      description,
      predefined: false,
    });
  }

  /**
   * Get a validation callback by name
   */
  get(name: string): ValidationCallback | undefined {
    return this.callbacks.get(name)?.callback;
  }

  /**
   * Check if a callback exists
   */
  has(name: string): boolean {
    return this.callbacks.has(name);
  }

  /**
   * Unregister a callback
   */
  unregister(name: string): boolean {
    const entry = this.callbacks.get(name);
    if (entry?.predefined) {
      console.warn(`Cannot unregister predefined validator "${name}"`);
      return false;
    }
    return this.callbacks.delete(name);
  }

  /**
   * List all registered callbacks
   */
  listAll(): Array<{ name: string; type: string; description?: string; predefined: boolean }> {
    return Array.from(this.callbacks.entries()).map(([name, entry]) => ({
      name,
      type: entry.type,
      description: entry.description,
      predefined: entry.predefined,
    }));
  }

  /**
   * Clear all custom (non-predefined) validators
   */
  clearCustom(): void {
    for (const [name, entry] of this.callbacks.entries()) {
      if (!entry.predefined) {
        this.callbacks.delete(name);
      }
    }
  }

  /**
   * Register all predefined validators
   * This is called automatically when the registry is created
   */
  registerPredefined(): void {
    // Import predefined validators dynamically to avoid circular dependencies
    const predefinedValidators = this.getPredefinedValidators();

    for (const [name, { callback, type, description }] of Object.entries(predefinedValidators)) {
      this.callbacks.set(name, {
        callback,
        type,
        description,
        predefined: true,
      });
    }

    // Register predefined computed rules
    this.registerPredefinedComputedRules();
  }

  /**
   * Register predefined computed rules
   */
  private registerPredefinedComputedRules(): void {
    // Computed rules are now handled differently - as validation rules with subtype
    // No need to register them here
  }

  /**
   * Get predefined validators
   * These are built-in validators that are automatically available
   */
  private getPredefinedValidators(): Record<
    string,
    { callback: ValidationCallback; type: 'custom' | 'crossField'; description: string }
  > {
    return {
      // CrossField Validators
      passwordMatch: {
        callback: (values: Record<string, any>) => {
          const fieldValues = Object.values(values);
          if (fieldValues.length < 2) return false;
          const [first, ...rest] = fieldValues;
          return rest.every((val) => val === first);
        },
        type: 'crossField',
        description:
          'Checks if all specified fields have the same value (typically used for password confirmation)',
      },

      emailMatch: {
        callback: (values: Record<string, any>) => {
          const fieldValues = Object.values(values);
          if (fieldValues.length < 2) return false;
          const [first, ...rest] = fieldValues;
          return rest.every((val) => val === first);
        },
        type: 'crossField',
        description: 'Checks if all specified email fields have the same value',
      },

      dateRangeValid: {
        callback: (values: Record<string, any>) => {
          const dates = Object.values(values).map((v) => new Date(v));
          if (dates.length < 2) return false;
          if (dates.some((d) => isNaN(d.getTime()))) return false;
          // Check if dates are in ascending order
          for (let i = 1; i < dates.length; i++) {
            const current = dates[i];
            const previous = dates[i - 1];
            if (current && previous && current < previous) return false;
          }
          return true;
        },
        type: 'crossField',
        description: 'Validates that dates are in ascending order (e.g., startDate < endDate)',
      },

      numericRangeValid: {
        callback: (values: Record<string, any>) => {
          const numbers = Object.values(values).map((v) => Number(v));
          if (numbers.length < 2) return false;
          if (numbers.some((n) => isNaN(n))) return false;
          // Check if numbers are in ascending order
          for (let i = 1; i < numbers.length; i++) {
            const current = numbers[i];
            const previous = numbers[i - 1];
            if (current !== undefined && previous !== undefined && current < previous) return false;
          }
          return true;
        },
        type: 'crossField',
        description: 'Validates that numeric values are in ascending order (e.g., min <= max)',
      },

      // Custom Validators
      notEmpty: {
        callback: (value: any) => {
          if (value === null || value === undefined) return false;
          if (typeof value === 'string') return value.trim().length > 0;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'object') return Object.keys(value).length > 0;
          return true;
        },
        type: 'custom',
        description: 'Checks if value is not empty (strings, arrays, objects)',
      },

      isPositive: {
        callback: (value: any) => {
          const num = Number(value);
          return !isNaN(num) && num > 0;
        },
        type: 'custom',
        description: 'Checks if value is a positive number',
      },

      isNonNegative: {
        callback: (value: any) => {
          const num = Number(value);
          return !isNaN(num) && num >= 0;
        },
        type: 'custom',
        description: 'Checks if value is a non-negative number (>= 0)',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // General-purpose CrossField Validators
      // ═══════════════════════════════════════════════════════════════════════

      /**
       * Checks if a field value is not empty
       * Works with strings, arrays, and objects
       */
      isNotEmpty: {
        callback: (values: Record<string, any>) => {
          // Filter out _currentValue to get only targetFields
          const targetVals = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
          const val = targetVals.find((v) => v !== undefined);
          if (val === null || val === undefined) return false;
          if (typeof val === 'string') return val.trim().length > 0;
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === 'object') return Object.keys(val).length > 0;
          return true;
        },
        type: 'crossField',
        description: 'Checks if the target field is not empty (crossField version)',
      },

      /**
       * Checks if a boolean field is true
       */
      isTrue: {
        callback: (values: Record<string, any>) => {
          const targetVals = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
          return targetVals.find((v) => v !== undefined) === true;
        },
        type: 'crossField',
        description: 'Checks if boolean field value is true',
      },

      /**
       * Checks if a boolean field is false
       */
      isFalse: {
        callback: (values: Record<string, any>) => {
          const targetVals = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
          return targetVals.find((v) => v !== undefined) === false;
        },
        type: 'crossField',
        description: 'Checks if boolean field value is false',
      },

      /**
       * Checks if value equals a specific value (parameterized)
       * params: { value: any }
       */
      equals: {
        callback: (values: Record<string, any>, context: ValidationContext) => {
          const targetVals = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
          const val = targetVals.find((v) => v !== undefined);
          const params = (context as any).params;
          return val === params?.value;
        },
        type: 'crossField',
        description: 'Checks if value equals a specific value',
      },

      /**
       * Checks if value is in the allowed values list (parameterized)
       * params: { values: any[] }
       */
      valueIn: {
        callback: (values: Record<string, any>, context: ValidationContext) => {
          const targetVals = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
          const val = targetVals.find((v) => v !== undefined);
          const params = (context as any).params;
          const allowedValues = params?.values || [];
          return allowedValues.includes(val);
        },
        type: 'crossField',
        description: 'Checks if value is in the allowed values list',
      },

      /**
       * Checks if value is NOT in the disallowed values list (parameterized)
       * params: { values: any[] }
       */
      valueNotIn: {
        callback: (values: Record<string, any>, context: ValidationContext) => {
          const targetVals = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
          const val = targetVals.find((v) => v !== undefined);
          const params = (context as any).params;
          const disallowedValues = params?.values || [];
          return !disallowedValues.includes(val);
        },
        type: 'crossField',
        description: 'Checks if value is NOT in the disallowed values list',
      },

      /**
       * Checks if array contains any of the specified values (parameterized)
       * params: { values: any[] }
       */
      arrayContainsAny: {
        callback: (values: Record<string, any>, context: ValidationContext) => {
          const targetVals = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
          const arr = targetVals.find((v) => v !== undefined);
          const params = (context as any).params;
          const checkValues = params?.values || [];
          if (!Array.isArray(arr)) return false;
          return checkValues.some((v: any) => arr.includes(v));
        },
        type: 'crossField',
        description: 'Checks if array contains any of the specified values',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // Mathematical CrossField Validators
      // ═══════════════════════════════════════════════════════════════════════

      /**
       * Validates that current field value equals the sum of target fields
       * Example: total_vacation_days = base_vacation_days + extra_vacation_days
       */
      validateSumEquals: {
        callback: (values: Record<string, any>) => {
          const currentValue = values._currentValue;
          const targetValues = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => Number(val) || 0);
          const sum = targetValues.reduce((acc, val) => acc + val, 0);
          return Number(currentValue) === sum;
        },
        type: 'crossField',
        description: 'Checks if current field value equals sum of target fields',
      },

      /**
       * Validates that all percentage fields sum to exactly 100%
       * All target fields (including current) must sum to 100
       */
      validatePercentageSum: {
        callback: (values: Record<string, any>) => {
          // Sum all values except _currentValue (but the current field should be in targetFields)
          const allValues = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => Number(val) || 0);
          const sum = allValues.reduce((acc, val) => acc + val, 0);
          return sum === 100;
        },
        type: 'crossField',
        description: 'Checks if all percentage fields sum to exactly 100%',
      },

      /**
       * Validates that current date is within project date range
       * Expects targetFields: [project_start, project_end]
       */
      validateDateInRange: {
        callback: (values: Record<string, any>) => {
          const currentValue = values._currentValue;
          const targetEntries = Object.entries(values).filter(([key]) => key !== '_currentValue');

          if (targetEntries.length < 2) return true; // Skip if not enough dates

          const [startEntry, endEntry] = targetEntries;
          const projectStart = new Date(startEntry?.[1]);
          const projectEnd = new Date(endEntry?.[1]);
          const currentDate = new Date(currentValue);

          // Check if dates are valid
          if (isNaN(projectStart.getTime()) || isNaN(projectEnd.getTime())) return true;
          if (isNaN(currentDate.getTime())) return true; // Empty/invalid date passes

          return currentDate >= projectStart && currentDate <= projectEnd;
        },
        type: 'crossField',
        description: 'Checks if current date is within project start and end dates',
      },

      /**
       * General validator: at least one target field must not be empty
       */
      atLeastOneRequired: {
        callback: (values: Record<string, any>) => {
          const targetValues = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);

          return targetValues.some((val) => {
            if (val === null || val === undefined) return false;
            if (typeof val === 'string') return val.trim().length > 0;
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === 'object') return Object.keys(val).length > 0;
            return true;
          });
        },
        type: 'crossField',
        description: 'Checks if at least one target field is not empty',
      },

      /**
       * Validates that current field value equals the product of target fields
       * Example: total = hours × rate
       */
      validateProductEquals: {
        callback: (values: Record<string, any>) => {
          const currentValue = Number(values._currentValue) || 0;
          const targetValues = Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => Number(val) || 0);

          if (targetValues.length === 0) return true;

          const product = targetValues.reduce((acc, val) => acc * val, 1);
          return currentValue === product;
        },
        type: 'crossField',
        description: 'Checks if current field value equals product of target fields',
      },
    };
  }
}

/**
 * Global singleton instance
 * This ensures all validators use the same registry
 */
let globalRegistry: CallbackRegistry | null = null;

/**
 * Get the global callback registry instance
 */
export function getGlobalRegistry(): CallbackRegistry {
  if (!globalRegistry) {
    globalRegistry = new CallbackRegistry();
    globalRegistry.registerPredefined();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (mainly for testing)
 */
export function resetGlobalRegistry(): void {
  globalRegistry = null;
}
