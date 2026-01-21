/**
 * ClientValidator - Lightweight client-side validator (Joi-free)
 *
 * Implements basic validation rules without external dependencies:
 * - required, email, numeric, stringLength, range, pattern, crossField, compare
 *
 * Supports 'when' conditions via ClientValidationConditionEvaluator
 */

import { ValidationRule, ValidationRuleGroup, ValidationRuleOrGroup } from 'formfiller-schema';
import { ClientValidationContext } from './ClientValidationContext.js';
import { ClientValidationResult } from './ClientValidationResult.js';
import { ClientConditionalEvaluator } from './ClientConditionalEvaluator.js';
import { ClientValidationConditionEvaluator } from './ClientValidationConditionEvaluator.js';
import { ClientCallbackRegistry, getClientRegistry } from './ClientCallbackRegistry.js';
import {
  isValidationRule,
  isValidationRuleGroup,
  getGroupRules,
  getGroupOperator,
  getGroupMessage,
  isCrossFieldType,
  enrichCrossFieldRule,
} from '../utils/typeGuards.js';

export class ClientValidator {
  private conditionalEvaluator: ClientConditionalEvaluator;
  private validationConditionEvaluator: ClientValidationConditionEvaluator;
  private callbackRegistry: ClientCallbackRegistry;

  constructor() {
    this.conditionalEvaluator = new ClientConditionalEvaluator();
    this.validationConditionEvaluator = new ClientValidationConditionEvaluator(
      this.conditionalEvaluator
    );
    this.callbackRegistry = getClientRegistry();
  }

  /**
   * Validate a field value against validation rules (supports ValidationRuleGroup)
   */
  async validate(
    fieldName: string,
    value: any,
    rules: ValidationRuleOrGroup[],
    formData: Record<string, any>
  ): Promise<ClientValidationResult> {
    const result = new ClientValidationResult();
    const context = new ClientValidationContext(formData);

    for (const ruleOrGroup of rules) {
      const validationResult = this.validateRuleOrGroup(fieldName, value, ruleOrGroup, context);

      if (!validationResult.valid) {
        result.addError(
          fieldName,
          validationResult.message,
          validationResult.ruleType,
          validationResult.params
        );
      }
    }

    return result;
  }

  /**
   * Validate a single rule or group, returns validation result with message
   * Public so ValidationService can call it directly
   */
  public validateRuleOrGroup(
    fieldName: string,
    value: any,
    ruleOrGroup: ValidationRuleOrGroup,
    context: ClientValidationContext
  ): { 
    valid: boolean; 
    message: string; 
    ruleType: string; 
    params?: Record<string, any>;
    errorTarget?: 'currentField' | 'allTargetFields' | string[];
    targetFields?: string[];
  } {
    if (isValidationRuleGroup(ruleOrGroup)) {
      return this.validateRuleGroup(fieldName, value, ruleOrGroup, context);
    }

    if (isValidationRule(ruleOrGroup)) {
      let rule = ruleOrGroup;

      // Check 'when' condition
      if (!this.validationConditionEvaluator.shouldApplyRule(rule, context)) {
        return { valid: true, message: '', ruleType: rule.type };
      }

      // Enrich crossField rules: automatically add current field to targetFields
      // and derive crossFieldValidator from type if not explicitly set
      const isCrossField = isCrossFieldType(rule.type);
      if (isCrossField) {
        rule = enrichCrossFieldRule(rule, fieldName);
      }

      const isValid = this.validateRule(fieldName, value, rule, context);
      return {
        valid: isValid,
        message: rule.message || this.getDefaultMessage(rule.type),
        ruleType: rule.type,
        params: { min: rule.min, max: rule.max, pattern: rule.pattern },
        errorTarget: rule.errorTarget,
        targetFields: rule.targetFields,
      };
    }

    // Unknown type - pass through
    return { valid: true, message: '', ruleType: 'unknown' };
  }

  /**
   * Validate a ValidationRuleGroup (and/or/not operators)
   */
  private validateRuleGroup(
    fieldName: string,
    value: any,
    group: ValidationRuleGroup,
    context: ClientValidationContext
  ): { 
    valid: boolean; 
    message: string; 
    ruleType: string; 
    params?: Record<string, any>;
    errorTarget?: 'currentField' | 'allTargetFields' | string[];
    targetFields?: string[];
  } {
    const operator = getGroupOperator(group);
    const rules = getGroupRules(group);
    const groupMessage = getGroupMessage(group) || 'Validation group failed';

    if (!operator || !rules || rules.length === 0) {
      return { valid: true, message: '', ruleType: 'group' };
    }

    const results = rules.map((rule) => {
      return this.validateRuleOrGroup(fieldName, value, rule, context);
    });

    let isValid: boolean;
    // Collect errorTarget and targetFields from failed rules
    let errorTarget: 'currentField' | 'allTargetFields' | string[] | undefined;
    let targetFields: string[] | undefined;
    
    switch (operator) {
      case 'and':
        // All rules must pass
        isValid = results.every((r) => r.valid);
        // Get errorTarget from first failed rule
        if (!isValid) {
          const failedResult = results.find((r) => !r.valid);
          if (failedResult) {
            errorTarget = failedResult.errorTarget;
            targetFields = failedResult.targetFields;
          }
        }
        break;
      case 'or':
        // At least one rule must pass
        isValid = results.some((r) => r.valid);
        break;
      case 'not':
        // The rule must NOT pass (invert result)
        isValid = results.length > 0 && results[0] ? !results[0].valid : true;
        break;
      default:
        isValid = true;
    }

    return {
      valid: isValid,
      message: groupMessage,
      ruleType: 'group',
      params: { operator },
      errorTarget,
      targetFields,
    };
  }

  /**
   * Check if a rule should be applied based on 'when' condition
   */
  shouldApplyRule(rule: ValidationRule, formData: Record<string, any>): boolean {
    const context = new ClientValidationContext(formData);
    return this.validationConditionEvaluator.shouldApplyRule(rule, context);
  }

  /**
   * Validate a single rule
   */
  validateRule(
    _fieldName: string,
    value: any,
    rule: ValidationRule,
    context: ClientValidationContext
  ): boolean {
    switch (rule.type) {
      case 'required':
        return this.validateRequired(value);

      case 'email':
        return this.validateEmail(value);

      case 'numeric':
        return this.validateNumeric(value);

      case 'stringLength':
        return this.validateStringLength(value, rule.min, rule.max);

      case 'arrayLength':
        return this.validateArrayLength(value, rule.min, rule.max);

      case 'range':
        return this.validateRange(value, rule.min, rule.max);

      case 'pattern':
        return this.validatePattern(value, rule.pattern);

      case 'equals':
      case 'notEquals':
      case 'greaterThan':
      case 'lessThan':
      case 'sumEquals':
      case 'percentageSum':
      case 'dateInRange':
      case 'atLeastOne':
        return this.validateCrossField(value, rule, context);

      case 'compare':
        return this.validateCompare(value, rule, context);

      default:
        console.warn(`ClientValidator: Unknown rule type '${rule.type}' - skipping`);
        return true; // Unknown rules pass (will be handled by backend)
    }
  }

  /**
   * Validate crossField rule
   * The type IS the callback name (e.g., 'atLeastOne')
   */
  private validateCrossField(
    value: any,
    rule: ValidationRule,
    context: ClientValidationContext
  ): boolean {
    if (!rule.targetFields) {
      return true; // No targetFields, pass
    }

    // Type IS the callback name - use directly
    const validatorName = rule.type;

    // Check if validator exists in registry
    if (!this.callbackRegistry.has(validatorName)) {
      console.warn(
        `ClientValidator: CrossField validator '${validatorName}' not found in client registry - skipping`
      );
      return true; // Unknown validators pass (will be handled by backend)
    }

    // Gather values from target fields + current value
    const values: Record<string, any> = {
      _currentValue: value,
    };
    for (const targetField of rule.targetFields) {
      values[targetField] = context.getValue(targetField);
    }

    // Execute callback
    return this.callbackRegistry.execute(validatorName, values);
  }

  /**
   * Validate compare rule
   * Compares the current field value with another field's value
   */
  private validateCompare(
    value: any,
    rule: ValidationRule,
    context: ClientValidationContext
  ): boolean {
    // Allow empty values (use required rule for mandatory check)
    if (value === '' || value === null || value === undefined) {
      return true;
    }

    if (!rule.comparisonTarget) {
      return true; // No target specified, pass
    }

    const targetValue = context.getValue(rule.comparisonTarget);
    const comparisonType = rule.comparisonType || '==';

    switch (comparisonType) {
      case '==':
        return value == targetValue;
      case '!=':
        return value != targetValue;
      case '>':
        return value > targetValue;
      case '<':
        return value < targetValue;
      case '>=':
        return value >= targetValue;
      case '<=':
        return value <= targetValue;
      default:
        return value == targetValue;
    }
  }

  /**
   * Check if a crossField validator is available on client-side
   */
  hasCrossFieldValidator(validatorName: string | undefined): boolean {
    return this.callbackRegistry.has(validatorName);
  }

  /**
   * Get list of available client-side crossField validators
   */
  getAvailableCrossFieldValidators(): string[] {
    return this.callbackRegistry.getRegisteredNames();
  }

  /**
   * Validate required field
   */
  private validateRequired(value: any): boolean {
    // Reject null, undefined
    if (value === null || value === undefined) {
      return false;
    }

    // Reject empty strings (but allow 0, false, etc.)
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }

    // Reject empty arrays
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Validate email format
   */
  private validateEmail(value: any): boolean {
    // Allow empty values (use required rule for mandatory check)
    if (value === '' || value === null || value === undefined) {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    // Simple email regex (covers most cases)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Validate numeric value
   */
  private validateNumeric(value: any): boolean {
    // Allow empty values
    if (value === '' || value === null || value === undefined) {
      return true;
    }

    // Check if it's a valid number
    const num = Number(value);
    return !isNaN(num) && isFinite(num);
  }

  /**
   * Validate string length
   */
  private validateStringLength(value: any, min?: number, max?: number): boolean {
    // Allow empty values
    if (value === '' || value === null || value === undefined) {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    const length = value.length;

    if (min !== undefined && length < min) {
      return false;
    }

    if (max !== undefined && length > max) {
      return false;
    }

    return true;
  }

  /**
   * Validate array length
   */
  private validateArrayLength(value: any, min?: number, max?: number): boolean {
    // Allow empty/null/undefined values (use required rule for mandatory check)
    if (value === null || value === undefined) {
      return true;
    }

    if (!Array.isArray(value)) {
      return false;
    }

    const length = value.length;

    if (min !== undefined && length < min) {
      return false;
    }

    if (max !== undefined && length > max) {
      return false;
    }

    return true;
  }

  /**
   * Validate numeric range
   */
  private validateRange(value: any, min?: number, max?: number): boolean {
    // Allow empty values
    if (value === '' || value === null || value === undefined) {
      return true;
    }

    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return false;
    }

    if (min !== undefined && num < min) {
      return false;
    }

    if (max !== undefined && num > max) {
      return false;
    }

    return true;
  }

  /**
   * Validate pattern (regex)
   */
  private validatePattern(value: any, pattern?: string | RegExp): boolean {
    // Allow empty values
    if (value === '' || value === null || value === undefined) {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    if (!pattern) {
      return true;
    }

    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      return regex.test(value);
    } catch (error) {
      console.error('Invalid regex pattern:', pattern, error);
      return true; // Invalid pattern passes (fail-safe)
    }
  }

  /**
   * Get default error message for a rule type
   */
  private getDefaultMessage(ruleType: string): string {
    switch (ruleType) {
      case 'required':
        return 'Ez a mező kötelező';
      case 'email':
        return 'Érvénytelen email cím';
      case 'numeric':
        return 'Csak számok engedélyezettek';
      case 'stringLength':
        return 'A szöveg hossza nem megfelelő';
      case 'range':
        return 'Az érték a megengedett tartományon kívül van';
      case 'pattern':
        return 'Az érték nem felel meg a mintának';
      case 'compare':
        return 'A mezők értékei nem egyeznek';
      case 'equals':
      case 'notEquals':
        return 'A mezők értékei nem egyeznek';
      case 'greaterThan':
      case 'lessThan':
        return 'A mezők értékei nem megfelelőek';
      case 'sumEquals':
        return 'Az összeg nem megfelelő';
      case 'percentageSum':
        return 'A százalékok összege nem 100%';
      case 'dateInRange':
        return 'A dátum kívül esik a tartományon';
      case 'atLeastOne':
        return 'Legalább egy mező kitöltése kötelező';
      default:
        return 'Érvénytelen érték';
    }
  }
}
