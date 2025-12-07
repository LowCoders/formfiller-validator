/**
 * ConfigProcessor - Form configuration processor
 *
 * Processes form configuration, extracts validation rules, and evaluates conditional expressions
 */

import { ValidationContext } from '../core/ValidationContext';
import { ValidationResult } from '../core/ValidationResult';
import { FieldConfig, ComputedRule } from 'formfiller-schema';
import { ConditionalEvaluator } from './ConditionalEvaluator';
import { ValidationConditionEvaluator } from './ValidationConditionEvaluator';
import { JoiAdapter } from '../adapters/JoiAdapter';
import { FieldPathBuilder } from '../utils/FieldPathBuilder';
import { CallbackRegistry } from '../core/CallbackRegistry';
import { isContainerField, isDataField, getNestedItems, getFieldName } from '../utils/typeHelpers';
import {
  ExactMatchProcessor,
  ArrayMatchProcessor,
  NumericMatchProcessor,
  KeywordMatchProcessor,
  AggregateProcessor,
  FieldComputedResult,
  ComputedValidationResult,
} from './computed';

export class ConfigProcessor {
  private readonly conditionalEvaluator: ConditionalEvaluator;
  private readonly validationConditionEvaluator: ValidationConditionEvaluator;
  private readonly joiAdapter: JoiAdapter;
  private readonly fieldPathBuilder: FieldPathBuilder;

  // Computed processors
  private readonly exactMatchProcessor: ExactMatchProcessor;
  private readonly arrayMatchProcessor: ArrayMatchProcessor;
  private readonly numericMatchProcessor: NumericMatchProcessor;
  private readonly keywordMatchProcessor: KeywordMatchProcessor;
  private readonly aggregateProcessor: AggregateProcessor;

  // Field-level computed results storage
  private fieldComputedResults: Record<string, FieldComputedResult> = {};

  constructor(registry: CallbackRegistry) {
    this.conditionalEvaluator = new ConditionalEvaluator();
    this.validationConditionEvaluator = new ValidationConditionEvaluator(this.conditionalEvaluator);
    this.joiAdapter = new JoiAdapter(registry);
    this.fieldPathBuilder = new FieldPathBuilder();

    // Initialize computed processors
    this.exactMatchProcessor = new ExactMatchProcessor();
    this.arrayMatchProcessor = new ArrayMatchProcessor();
    this.numericMatchProcessor = new NumericMatchProcessor();
    this.keywordMatchProcessor = new KeywordMatchProcessor();
    this.aggregateProcessor = new AggregateProcessor();
  }

  /**
   * Process form configuration and validate
   */
  async process(context: ValidationContext): Promise<ValidationResult> {
    const result = new ValidationResult();

    // Reset field computed results
    this.fieldComputedResults = {};

    // Process form-level validation rules
    if (context.config.validationRules && context.config.validationRules.length > 0) {
      // TODO: Implement form-level validation
    }

    // Process form items with empty parent path (root level)
    if (context.config.items) {
      for (const item of context.config.items) {
        const itemResult = await this.processItem(item, context, '');
        result.merge(itemResult);
      }
    }

    // Process form-level computed rules (after all fields processed)
    if (context.config.computedRules && context.config.computedRules.length > 0) {
      const aggregateResults = this.processFormLevelComputedRules(context);

      // Store aggregate results in the result object
      for (const [name, aggResult] of Object.entries(aggregateResults)) {
        result.addComputedResult(name, aggResult);
      }
    }

    // Store field-level computed results
    for (const [fieldName, computedResult] of Object.entries(this.fieldComputedResults)) {
      result.addComputedResult(fieldName, computedResult);
    }

    return result;
  }

  /**
   * Process form-level computed rules (field-level and aggregate)
   */
  private processFormLevelComputedRules(context: ValidationContext): Record<string, any> {
    const results: Record<string, any> = {};

    if (!context.config.computedRules) {
      return results;
    }

    for (const computedRule of context.config.computedRules) {
      try {
        // Type assertion to ensure ComputedRule type is used
        const rule: ComputedRule = computedRule;

        if (rule.type === 'field') {
          // Process field-level computed rule
          this.processFieldComputedRule(rule, context);
          // Field results are already stored in this.fieldComputedResults
          // No need to add to results here
        } else if (rule.type === 'aggregate') {
          // Process aggregate computed rule
          const aggResult = this.aggregateProcessor.aggregate(this.fieldComputedResults, rule);
          results[computedRule.name] = aggResult;
        }
      } catch (error) {
        console.error(`Error processing computed rule ${computedRule.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Process a field-level computed rule
   */
  private processFieldComputedRule(rule: ComputedRule, context: ValidationContext): void {
    if (!rule.fieldName) {
      console.warn(`Field computed rule ${rule.id} missing fieldName`);
      return;
    }

    const fieldValue = context.getValue(rule.fieldName);
    let computedResult: ComputedValidationResult;

    // Select processor based on subtype
    switch (rule.subtype) {
      case 'exactMatch':
        computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule as any);
        break;

      case 'arrayMatch':
        computedResult = this.arrayMatchProcessor.evaluate(fieldValue, rule as any);
        break;

      case 'numericMatch':
        computedResult = this.numericMatchProcessor.evaluate(fieldValue, rule as any);
        break;

      case 'keywordMatch':
        computedResult = this.keywordMatchProcessor.evaluate(fieldValue, rule as any);
        break;

      case 'custom':
        // TODO: Implement custom evaluator support
        console.warn(`Custom evaluator not yet implemented for field ${rule.fieldName}`);
        return;

      default:
        // Default to exact match if no subtype specified
        computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule as any);
    }

    // Store result if storeResult is not explicitly false
    if (rule.storeResult !== false) {
      this.fieldComputedResults[rule.fieldName] = {
        fieldName: rule.fieldName,
        ...computedResult,
      };
    }
  }

  /**
   * Process a single form item
   *
   * @param item - Field configuration
   * @param context - Validation context
   * @param parentPath - Parent path (for nested fields)
   */
  private async processItem(
    item: FieldConfig,
    context: ValidationContext,
    parentPath: string = ''
  ): Promise<ValidationResult> {
    const result = new ValidationResult();

    // Get field name
    const fieldName = getFieldName(item);

    // Process nested items (groups, tabs) first
    if (isContainerField(item)) {
      const nestedResult = await this.processNestedItems(item, context, parentPath);
      result.merge(nestedResult);
      return result;
    }

    // Skip non-data fields (button, empty, etc.)
    if (!isDataField(item) || !fieldName) {
      return result;
    }

    // Build full field path with excludeFromPath support
    const fieldPath = this.fieldPathBuilder.buildPath(item, parentPath);

    let fieldValue = context.getValue(fieldPath);

    // Evaluate conditional expressions
    const isVisible = this.evaluateVisibility(item, context);

    // Disabled állapot kiértékelése automatikus logikával
    let isDisabled = false;
    if (item.visibleIf && !isVisible) {
      // Ha van visibleIf ÉS a mező nem látható, automatikusan disabled
      // Ez megakadályozza az inkonzisztens állapotot (visible=false, disabled=false)
      isDisabled = true;
    } else {
      // Ha nincs visibleIf VAGY a mező látható, normál disabledIf logika
      isDisabled = this.evaluateDisabled(item, context);
    }

    const isReadonly = this.evaluateReadonly(item, context);
    const isRequired = this.evaluateRequired(item, context);

    // Note: isReadonly is evaluated but not used for skipping validation (security).
    // It may be used in the future for metadata or logging purposes.
    void isReadonly; // Suppress unused variable warning

    // Normalize undefined/missing field values to appropriate type defaults
    if (fieldValue === undefined) {
      fieldValue = this.getDefaultValueForType(item.type);
    }

    // Skip validation if field is not visible
    if (!isVisible) {
      result.setFieldSkipped(fieldPath, 'Field is not visible');
      return result;
    }

    // Skip validation if field is disabled (disabled fields don't need validation)
    if (isDisabled) {
      result.setFieldSkipped(fieldPath, 'Field is disabled');
      return result;
    }

    // ⚠️ SECURITY: Readonly fields MUST be validated!
    // Readonly is only client-side protection and can be bypassed.
    // Do NOT skip validation for readonly fields.

    // Validate field - only fields with validationRules are validated
    // Fields without validationRules are not added to fieldResults
    if (item.validationRules && item.validationRules.length > 0) {
      const hasErrors = await this.validateRules(
        item.validationRules,
        fieldPath,
        fieldValue,
        isRequired,
        context,
        result
      );

      if (!hasErrors) {
        result.setFieldValid(fieldPath);
      }
    }
    // Note: Fields without validationRules are intentionally NOT added to fieldResults

    // Note: Computed rules are now handled at form level, not field level
    // This was removed from FieldConfig to match schema

    return result;
  }

  /**
   * Process nested items (groups, tabs)
   *
   * @param item - Container field configuration
   * @param context - Validation context
   * @param parentPath - Parent path
   */
  private async processNestedItems(
    item: FieldConfig,
    context: ValidationContext,
    parentPath: string = ''
  ): Promise<ValidationResult> {
    const result = new ValidationResult();

    // Calculate next parent path with excludeFromPath support
    const nextPath = this.fieldPathBuilder.getNextParentPath(item, parentPath);

    // Process nested items (works for both group and tabbed items)
    // TabbedFieldConfig.items contains TabFieldConfig[] elements
    // Each TabFieldConfig also has items property with FieldConfig[]
    const nestedItems = getNestedItems(item);
    if (nestedItems) {
      for (const nestedItem of nestedItems) {
        const nestedResult = await this.processItem(nestedItem, context, nextPath);
        result.merge(nestedResult);
      }
    }

    return result;
  }

  /**
   * Evaluate visibility condition
   */
  private evaluateVisibility(item: FieldConfig, context: ValidationContext): boolean {
    if (!item.visibleIf) {
      // Default to visible if no condition
      return true;
    }

    return this.conditionalEvaluator.evaluate(item.visibleIf, context);
  }

  /**
   * Evaluate disabled condition
   */
  private evaluateDisabled(item: FieldConfig, context: ValidationContext): boolean {
    if (!item.disabledIf) {
      return false;
    }

    return this.conditionalEvaluator.evaluate(item.disabledIf, context);
  }

  /**
   * Evaluate readonly condition
   */
  private evaluateReadonly(item: FieldConfig, context: ValidationContext): boolean {
    if (!item.readonlyIf) {
      return false;
    }

    return this.conditionalEvaluator.evaluate(item.readonlyIf, context);
  }

  /**
   * Evaluate required condition
   */
  private evaluateRequired(item: FieldConfig, context: ValidationContext): boolean {
    // Check for explicit requiredIf condition
    if (item.requiredIf) {
      return this.conditionalEvaluator.evaluate(item.requiredIf, context);
    }

    // Check if there's a required rule in validationRules
    if (item.validationRules) {
      return this.hasRequiredRule(item.validationRules);
    }

    return false;
  }

  /**
   * Check if validation rules contain a required rule
   */
  private hasRequiredRule(rules: import('formfiller-schema').ValidationRuleOrGroup[]): boolean {
    const { isValidationRule, isValidationRuleGroup } = require('../utils/typeGuards');

    const { getGroupRules } = require('../utils/typeGuards');

    for (const ruleOrGroup of rules) {
      if (isValidationRule(ruleOrGroup)) {
        const rule = ruleOrGroup as import('formfiller-schema').ValidationRule;
        if (rule.type === 'required') {
          return true;
        }
      } else if (isValidationRuleGroup(ruleOrGroup)) {
        const group = ruleOrGroup as import('formfiller-schema').ValidationRuleGroup;
        const nestedRules = getGroupRules(group);
        if (this.hasRequiredRule(nestedRules)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate rules (handles both single rules and groups)
   */
  private async validateRules(
    rules: import('formfiller-schema').ValidationRuleOrGroup[],
    fieldName: string,
    fieldValue: any,
    isRequired: boolean,
    context: ValidationContext,
    result: ValidationResult
  ): Promise<boolean> {
    const { isValidationRule, isValidationRuleGroup } = require('../utils/typeGuards');
    let hasErrors = false;

    for (const ruleOrGroup of rules) {
      if (isValidationRule(ruleOrGroup)) {
        const rule = ruleOrGroup as import('formfiller-schema').ValidationRule;

        // ✨ NEW: Check if rule should be applied based on 'when' condition
        const shouldApply = this.validationConditionEvaluator.shouldApplyRule(rule, context);
        if (!shouldApply) {
          continue; // Skip this rule based on 'when' condition
        }

        // ✨ Handle computed type rules
        if (rule.type === 'computed') {
          this.processComputedRule(rule, fieldName, fieldValue);
          continue; // Computed rules don't affect validation errors
        }

        // Check if required rule should be applied based on field-level requiredIf
        // BUT only if the rule doesn't have its own 'when' condition (which takes precedence)
        if (rule.type === 'required' && !rule.when && !isRequired) {
          continue;
        }

        // Validate using JoiAdapter
        const validationResult = await this.joiAdapter.validate(fieldValue, rule, context);

        if (!validationResult.valid) {
          hasErrors = true;
          result.addError(
            fieldName,
            validationResult.error || rule.message || 'Validation failed',
            rule.type,
            {
              min: rule.min,
              max: rule.max,
              pattern: rule.pattern,
              comparisonTarget: rule.comparisonTarget,
              comparisonType: rule.comparisonType,
              // CrossField params
              targetFields: rule.targetFields,
              crossFieldValidator:
                typeof rule.crossFieldValidator === 'string' ? rule.crossFieldValidator : undefined,
            }
          );
        }
      } else if (isValidationRuleGroup(ruleOrGroup)) {
        const group = ruleOrGroup as import('formfiller-schema').ValidationRuleGroup;
        // Handle validation rule groups
        const groupResult = await this.validateRuleGroup(
          group,
          fieldName,
          fieldValue,
          isRequired,
          context,
          result
        );
        if (groupResult) {
          hasErrors = true;
        }
      }
    }

    return hasErrors;
  }

  /**
   * Process computed validation rule
   */
  private processComputedRule(
    rule: import('formfiller-schema').ValidationRule,
    fieldName: string,
    fieldValue: any
  ): void {
    let computedResult: ComputedValidationResult;

    // Select processor based on subtype
    switch (rule.subtype) {
      case 'exactMatch':
        computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule);
        break;

      case 'arrayMatch':
        computedResult = this.arrayMatchProcessor.evaluate(fieldValue, rule);
        break;

      case 'numericMatch':
        computedResult = this.numericMatchProcessor.evaluate(fieldValue, rule);
        break;

      case 'keywordMatch':
        computedResult = this.keywordMatchProcessor.evaluate(fieldValue, rule);
        break;

      case 'custom':
        // TODO: Implement custom evaluator support
        console.warn(`Custom evaluator not yet implemented for field ${fieldName}`);
        return;

      default:
        // Default to exact match if no subtype specified
        computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule);
    }

    // Store result if storeResult is true
    if (rule.storeResult !== false) {
      this.fieldComputedResults[fieldName] = {
        fieldName,
        ...computedResult,
      };
    }
  }

  /**
   * Validate a rule group with logical operators
   * Supports both legacy format (operator + rules) and new format (or/and/not properties)
   */
  private async validateRuleGroup(
    group: import('formfiller-schema').ValidationRuleGroup,
    fieldName: string,
    fieldValue: any,
    isRequired: boolean,
    context: ValidationContext,
    result: ValidationResult
  ): Promise<boolean> {
    const {
      isValidationRule,
      isValidationRuleGroup,
      getGroupRules,
      getGroupOperator,
      getGroupMessage,
    } = require('../utils/typeGuards');
    const errors: string[] = [];

    // Get rules array (handles both formats)
    const rules = getGroupRules(group);
    const operator = getGroupOperator(group);
    const groupMessage = getGroupMessage(group);

    for (const ruleOrNestedGroup of rules) {
      if (isValidationRule(ruleOrNestedGroup)) {
        const rule = ruleOrNestedGroup as import('formfiller-schema').ValidationRule;
        if (rule.type === 'required' && !isRequired) {
          continue;
        }

        const validationResult = await this.joiAdapter.validate(fieldValue, rule, context);

        if (!validationResult.valid) {
          errors.push(validationResult.error || rule.message || 'Validation failed');

          // If stopOnFirstError is true, break immediately
          if (group.stopOnFirstError) {
            break;
          }
        }
      } else if (isValidationRuleGroup(ruleOrNestedGroup)) {
        const nestedGroup = ruleOrNestedGroup as import('formfiller-schema').ValidationRuleGroup;
        // Recursively validate nested groups
        // Note: We pass a temporary result to avoid adding nested errors to main result
        // until we know if the parent group passes/fails
        const tempResult = new ValidationResult();
        const nestedHasError = await this.validateRuleGroup(
          nestedGroup,
          fieldName,
          fieldValue,
          isRequired,
          context,
          tempResult
        );

        // Track nested group result for logical operators (OR, NOT need this)
        if (nestedHasError) {
          const nestedMessage = getGroupMessage(nestedGroup);
          errors.push(nestedMessage || 'Nested group validation failed');
        }

        if (nestedHasError && group.stopOnFirstError) {
          return true;
        }
      }
    }

    // Apply logical operator
    let hasError = false;
    switch (operator) {
      case 'and':
        // All rules must pass (any error means failure)
        hasError = errors.length > 0;
        break;
      case 'or':
        // At least one rule must pass (all errors means failure)
        hasError = errors.length === rules.length;
        break;
      case 'not':
        // All rules must fail (no errors means failure)
        hasError = errors.length === 0;
        break;
    }

    if (hasError) {
      result.addError(
        fieldName,
        groupMessage || errors.join(', ') || 'Validation group failed',
        'group',
        { operator }
      );
    }

    return hasError;
  }

  /**
   * Get default value for a field type when value is undefined/missing
   */
  private getDefaultValueForType(fieldType: string): any {
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'password':
      case 'url':
      case 'tel':
      case 'color':
      case 'textarea':
      case 'select':
      case 'dropdown':
      case 'autocomplete':
      case 'tagbox':
        return ''; // Empty string for text-based fields

      case 'number':
      case 'range':
      case 'rating':
        return 0; // Zero for numeric fields

      case 'boolean':
      case 'switch':
      case 'checkbox':
        return false; // False for boolean fields

      case 'date':
      case 'datetime':
      case 'time':
        return null; // Null for date/time fields (not empty string)

      case 'array':
      case 'multiselect':
      case 'list':
        return []; // Empty array for array-based fields

      case 'object':
      case 'json':
        return {}; // Empty object for object fields

      case 'file':
      case 'image':
        return null; // Null for file uploads

      default:
        return ''; // Default to empty string
    }
  }
}
