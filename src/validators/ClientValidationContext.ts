/**
 * ClientValidationContext - Lightweight validation context for client-side validation
 *
 * Similar to ValidationContext but without server-only dependencies
 */

export class ClientValidationContext {
  public readonly data: Record<string, any>;
  public readonly formConfig?: any;

  constructor(data: Record<string, any>, formConfig?: any) {
    this.data = data;
    this.formConfig = formConfig;
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
}
