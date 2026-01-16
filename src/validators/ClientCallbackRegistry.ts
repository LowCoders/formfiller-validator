/**
 * ClientCallbackRegistry - Frontend-safe validation callbacks
 *
 * Lightweight registry for client-side crossField validators.
 * These validators are synchronous and safe to run in the browser.
 */

/**
 * CrossField callback signature with optional params
 */
export type ClientCrossFieldCallback = (
  values: Record<string, any>,
  params?: Record<string, any>
) => boolean;

/**
 * Registry entry with metadata
 */
interface RegistryEntry {
  callback: ClientCrossFieldCallback;
  description: string;
  parameterized?: boolean;
}

/**
 * ClientCallbackRegistry class - manages frontend-safe validation callbacks
 */
export class ClientCallbackRegistry {
  private callbacks: Map<string, RegistryEntry> = new Map();

  constructor() {
    this.registerPredefinedValidators();
  }

  /**
   * Register a new callback
   */
  register(
    name: string,
    callback: ClientCrossFieldCallback,
    description: string = '',
    parameterized: boolean = false
  ): void {
    this.callbacks.set(name, { callback, description, parameterized });
  }

  /**
   * Check if a callback exists
   */
  has(name: string | undefined): boolean {
    if (!name) return false;
    return this.callbacks.has(name);
  }

  /**
   * Get a callback by name
   */
  get(name: string): ClientCrossFieldCallback | undefined {
    return this.callbacks.get(name)?.callback;
  }

  /**
   * Execute a callback with values and optional params
   */
  execute(name: string, values: Record<string, any>, params?: Record<string, any>): boolean {
    const entry = this.callbacks.get(name);
    if (!entry) {
      console.warn(`ClientCallbackRegistry: Unknown callback '${name}'`);
      return true; // Unknown callbacks pass (fail-safe)
    }
    return entry.callback(values, params);
  }

  /**
   * Get list of all registered callback names
   */
  getRegisteredNames(): string[] {
    return Array.from(this.callbacks.keys());
  }

  /**
   * Register predefined frontend-safe validators
   */
  private registerPredefinedValidators(): void {
    // ═══════════════════════════════════════════════════════════════════════
    // Basic validators
    // ═══════════════════════════════════════════════════════════════════════

    // Helper: get target field values (excluding _currentValue)
    const getTargetValues = (values: Record<string, any>) =>
      Object.entries(values)
        .filter(([key]) => key !== '_currentValue')
        .map(([, val]) => val);

    /**
     * Checks if a field value is not empty
     * Works with strings, arrays, and objects
     */
    this.register(
      'isNotEmpty',
      (values: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const val = targetVals.find((v) => v !== undefined);
        if (val === null || val === undefined) return false;
        if (typeof val === 'string') return val.trim().length > 0;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object') return Object.keys(val).length > 0;
        return true;
      },
      'Checks if the target field is not empty'
    );

    /**
     * Checks if a boolean field is true
     */
    this.register(
      'isTrue',
      (values: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const val = targetVals.find((v) => v !== undefined);
        return val === true;
      },
      'Checks if boolean field value is true'
    );

    /**
     * Checks if a boolean field is false
     */
    this.register(
      'isFalse',
      (values: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const val = targetVals.find((v) => v !== undefined);
        return val === false;
      },
      'Checks if boolean field value is false'
    );

    // ═══════════════════════════════════════════════════════════════════════
    // Comparison validators
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Checks if all specified fields have the same value
     * Typically used for password confirmation
     */
    this.register(
      'passwordMatch',
      (values: Record<string, any>) => {
        const targetVals = getTargetValues(values).filter((v) => v !== undefined);
        if (targetVals.length < 2) return false;
        const [first, ...rest] = targetVals;
        return rest.every((val) => val === first);
      },
      'Checks if all specified fields have the same value'
    );

    /**
     * Checks if all specified email fields have the same value
     */
    this.register(
      'emailMatch',
      (values: Record<string, any>) => {
        const targetVals = getTargetValues(values).filter((v) => v !== undefined);
        if (targetVals.length < 2) return false;
        const [first, ...rest] = targetVals;
        return rest.every((val) => val === first);
      },
      'Checks if all specified email fields have the same value'
    );

    /**
     * Generic compare validator with operator parameter
     * params: { operator: '==' | '!=' | '<' | '>' | '<=' | '>=' }
     */
    this.register(
      'compare',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const targetVals = getTargetValues(values).filter((v) => v !== undefined);
        if (targetVals.length < 2) return false;

        const [a, b] = targetVals;
        const operator = params?.operator || '==';

        switch (operator) {
          case '==':
            return a === b;
          case '!=':
            return a !== b;
          case '<':
            return Number(a) < Number(b);
          case '>':
            return Number(a) > Number(b);
          case '<=':
            return Number(a) <= Number(b);
          case '>=':
            return Number(a) >= Number(b);
          default:
            return a === b;
        }
      },
      'Compares two field values with specified operator',
      true // parameterized
    );

    // ═══════════════════════════════════════════════════════════════════════
    // Range validators
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Validates that dates are in ascending order
     */
    this.register(
      'dateRangeValid',
      (values: Record<string, any>) => {
        const dates = getTargetValues(values)
          .filter((v) => v !== undefined)
          .map((v) => new Date(v));
        if (dates.length < 2) return false;
        if (dates.some((d) => isNaN(d.getTime()))) return false;

        for (let i = 1; i < dates.length; i++) {
          const current = dates[i];
          const previous = dates[i - 1];
          if (current && previous && current < previous) return false;
        }
        return true;
      },
      'Validates that dates are in ascending order'
    );

    /**
     * Validates that numeric values are in ascending order
     */
    this.register(
      'numericRangeValid',
      (values: Record<string, any>) => {
        const numbers = getTargetValues(values)
          .filter((v) => v !== undefined)
          .map((v) => Number(v));
        if (numbers.length < 2) return false;
        if (numbers.some((n) => isNaN(n))) return false;

        for (let i = 1; i < numbers.length; i++) {
          const current = numbers[i];
          const previous = numbers[i - 1];
          if (current !== undefined && previous !== undefined && current < previous) return false;
        }
        return true;
      },
      'Validates that numeric values are in ascending order'
    );

    // ═══════════════════════════════════════════════════════════════════════
    // Array validators
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Checks if at least one target field is not empty
     * Type: atLeastOne
     */
    this.register(
      'atLeastOne',
      (values: Record<string, any>) => {
        const targetVals = getTargetValues(values);

        return targetVals.some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'string') return val.trim().length > 0;
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === 'object') return Object.keys(val).length > 0;
          return true;
        });
      },
      'Checks if at least one target field is not empty'
    );

    /**
     * Validates that current field value equals the sum of target fields
     * Type: sumEquals
     */
    this.register(
      'sumEquals',
      (values: Record<string, any>) => {
        const currentValue = values._currentValue;
        const targetValues = getTargetValues(values).map((val) => Number(val) || 0);
        const sum = targetValues.reduce((acc, val) => acc + val, 0);
        return Number(currentValue) === sum;
      },
      'Checks if current field value equals sum of target fields'
    );

    /**
     * Validates that all percentage fields sum to exactly 100%
     * Type: percentageSum
     */
    this.register(
      'percentageSum',
      (values: Record<string, any>) => {
        const allValues = getTargetValues(values).map((val) => Number(val) || 0);
        const sum = allValues.reduce((acc, val) => acc + val, 0);
        return sum === 100;
      },
      'Checks if all percentage fields sum to exactly 100%'
    );

    /**
     * Validates that current date is within date range
     * Type: dateInRange
     */
    this.register(
      'dateInRange',
      (values: Record<string, any>) => {
        const currentValue = values._currentValue;
        const targetVals = getTargetValues(values).filter((v) => v !== undefined);

        if (targetVals.length < 2) return true; // Skip if not enough dates

        const [startVal, endVal] = targetVals;
        const projectStart = new Date(startVal);
        const projectEnd = new Date(endVal);
        const currentDate = new Date(currentValue);

        // Check if dates are valid
        if (isNaN(projectStart.getTime()) || isNaN(projectEnd.getTime())) return true;
        if (isNaN(currentDate.getTime())) return true; // Empty/invalid date passes

        return currentDate >= projectStart && currentDate <= projectEnd;
      },
      'Checks if current date is within date range'
    );

    /**
     * Validates that current field value equals the product of target fields
     * Maps to: crossFieldProductEquals (if added to schema)
     */
    this.register(
      'productEquals',
      (values: Record<string, any>) => {
        const currentValue = Number(values._currentValue) || 0;
        const targetValues = getTargetValues(values).map((val) => Number(val) || 0);

        if (targetValues.length === 0) return true;

        const product = targetValues.reduce((acc, val) => acc * val, 1);
        return currentValue === product;
      },
      'Checks if current field value equals product of target fields'
    );

    /**
     * Checks if array contains a specific value
     * params: { value: any }
     */
    this.register(
      'arrayContains',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const arr = targetVals.find((v) => v !== undefined);
        if (!Array.isArray(arr)) return false;
        return arr.includes(params?.value);
      },
      'Checks if array contains a specific value',
      true // parameterized
    );

    /**
     * Checks if array does NOT contain a specific value
     * params: { value: any }
     */
    this.register(
      'arrayNotContains',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const arr = targetVals.find((v) => v !== undefined);
        if (!Array.isArray(arr)) return true;
        return !arr.includes(params?.value);
      },
      'Checks if array does NOT contain a specific value',
      true // parameterized
    );

    /**
     * Checks if array contains any of the specified values
     * params: { values: any[] }
     */
    this.register(
      'arrayContainsAny',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const arr = targetVals.find((v) => v !== undefined);
        if (!Array.isArray(arr)) return false;
        const checkValues = params?.values || [];
        return checkValues.some((v: any) => arr.includes(v));
      },
      'Checks if array contains any of the specified values',
      true // parameterized
    );

    // ═══════════════════════════════════════════════════════════════════════
    // String validators
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Checks if string matches a pattern
     * params: { pattern: string }
     */
    this.register(
      'matchesPattern',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const val = targetVals.find((v) => v !== undefined);
        if (typeof val !== 'string') return false;
        if (!params?.pattern) return true;

        try {
          const regex = new RegExp(params.pattern);
          return regex.test(val);
        } catch {
          return true; // Invalid pattern passes (fail-safe)
        }
      },
      'Checks if string matches a pattern',
      true // parameterized
    );

    /**
     * Checks if current value equals target field value or a specific value
     * params: { value: any } (optional)
     * 
     * Two modes:
     * 1. If params.value is set: checks that current value === params.value
     * 2. If params.value is NOT set: checks that current value === targetField value
     */
    this.register(
      'equals',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const currentValue = values._currentValue;
        const targetVals = getTargetValues(values);
        
        // If params.value is set, compare against it
        if (params?.value !== undefined) {
          return currentValue === params.value;
        }
        
        // Otherwise, compare against targetField value
        const targetValue = targetVals.find((v) => v !== undefined);
        return currentValue === targetValue;
      },
      'Checks if current value equals target field value or a specific value',
      true // parameterized
    );

    /**
     * Checks if value does NOT equal target field values or a specific value
     * params: { value: any } (optional)
     * 
     * Two modes:
     * 1. If params.value is set: checks that current value !== params.value
     * 2. If params.value is NOT set: checks that current value !== any targetField value
     */
    this.register(
      'notEquals',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const currentValue = values._currentValue;
        const targetVals = getTargetValues(values);
        
        // If params.value is set, compare against it
        if (params?.value !== undefined) {
          return currentValue !== params.value;
        }
        
        // Otherwise, compare against targetFields values
        // Current field value must not equal any of the target field values
        return !targetVals.some(targetVal => currentValue === targetVal);
      },
      'Checks if value does NOT equal target field values or a specific value',
      true // parameterized
    );

    /**
     * Checks if current value is less than target field value
     */
    this.register(
      'lessThan',
      (values: Record<string, any>) => {
        const currentValue = values._currentValue;
        const targetVals = getTargetValues(values);
        const targetValue = targetVals.find(v => v !== undefined);
        
        if (currentValue === undefined || targetValue === undefined) return true;
        return Number(currentValue) < Number(targetValue);
      },
      'Checks if current value is less than target field value'
    );

    /**
     * Checks if current value is greater than target field value
     */
    this.register(
      'greaterThan',
      (values: Record<string, any>) => {
        const currentValue = values._currentValue;
        const targetVals = getTargetValues(values);
        const targetValue = targetVals.find(v => v !== undefined);
        
        if (currentValue === undefined || targetValue === undefined) return true;
        return Number(currentValue) > Number(targetValue);
      },
      'Checks if current value is greater than target field value'
    );

    /**
     * Checks if value is in the allowed values list
     * params: { values: any[] }
     */
    this.register(
      'valueIn',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const val = targetVals.find((v) => v !== undefined);
        const allowedValues = params?.values || [];
        return allowedValues.includes(val);
      },
      'Checks if value is in the allowed values list',
      true // parameterized
    );

    /**
     * Checks if value is NOT in the disallowed values list
     * params: { values: any[] }
     */
    this.register(
      'valueNotIn',
      (values: Record<string, any>, params?: Record<string, any>) => {
        const targetVals = getTargetValues(values);
        const val = targetVals.find((v) => v !== undefined);
        const disallowedValues = params?.values || [];
        return !disallowedValues.includes(val);
      },
      'Checks if value is NOT in the disallowed values list',
      true // parameterized
    );
  }
}

/**
 * Global singleton instance for client-side validation
 */
let globalClientRegistry: ClientCallbackRegistry | null = null;

export function getClientRegistry(): ClientCallbackRegistry {
  if (!globalClientRegistry) {
    globalClientRegistry = new ClientCallbackRegistry();
  }
  return globalClientRegistry;
}

export function resetClientRegistry(): void {
  globalClientRegistry = null;
}
