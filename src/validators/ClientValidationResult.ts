/**
 * ClientValidationResult - Lightweight validation result for client-side
 */

export interface ClientValidationError {
  field: string;
  message: string;
  rule: string;
  params?: Record<string, any>;
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
  addError(field: string, message: string, rule: string, params?: Record<string, any>): void {
    this.valid = false;
    this.errors.push({
      field,
      message,
      rule,
      params,
    });
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): ClientValidationError[] {
    return this.errors.filter((error) => error.field === field);
  }
}
