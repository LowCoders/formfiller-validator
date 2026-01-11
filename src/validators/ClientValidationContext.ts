/**
 * ClientValidationContext - Lightweight validation context for client-side validation
 *
 * Similar to ValidationContext but without server-only dependencies.
 * Uses nested object structure for data access (DevExtreme form is initialized with nested structure).
 */

export class ClientValidationContext {
  public readonly data: Record<string, any>;
  public readonly formConfig?: any;

  constructor(data: Record<string, any>, formConfig?: any) {
    this.data = data;
    this.formConfig = formConfig;
  }

  /**
   * Get value from data by field path (nested path resolution)
   * 
   * @param fieldPath - Dot-separated path (e.g., "field_level.morning_hours")
   * @returns The value at the path or undefined
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
   * Check if a field exists in the data (nested path resolution)
   * 
   * @param fieldPath - Dot-separated path (e.g., "field_level.morning_hours")
   * @returns true if the field exists
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
}
