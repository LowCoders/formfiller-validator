/**
 * ClientValidationResult - Lightweight validation result for client-side
 */

export interface ClientValidationError {
  field: string;
  message: string;
  rule: string;
  params?: Record<string, any>;
  /** Target fields for crossField validation errors */
  targetFields?: string[];
  /** Where to display the error: currentField (default), allTargetFields, or specific field paths */
  errorTarget?: 'currentField' | 'allTargetFields' | string[];
}

export class ClientValidationResult {
  public valid: boolean;
  public errors: ClientValidationError[];

  constructor() {
    this.valid = true;
    this.errors = [];
  }

  /**
   * Add a validation error
   */
  addError(
    field: string,
    message: string,
    rule: string,
    params?: Record<string, any>,
    targetFields?: string[],
    errorTarget?: 'currentField' | 'allTargetFields' | string[]
  ): void {
    this.valid = false;
    this.errors.push({
      field,
      message,
      rule,
      params,
      targetFields,
      errorTarget,
    });
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): ClientValidationError[] {
    return this.errors.filter((error) => error.field === field);
  }
}
