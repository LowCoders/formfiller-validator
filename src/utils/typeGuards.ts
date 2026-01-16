import {
  ValidationRuleOrGroup,
  ConditionalExpression,
  ValidationRule,
  CROSS_FIELD_TYPES,
  CrossFieldType,
} from 'formfiller-schema';

// Re-export from schema for backwards compatibility
export { CROSS_FIELD_TYPES, CrossFieldType };

/**
 * Check if a validation rule type is a crossField type
 * @param type - The validation rule type to check
 * @returns true if the type is in CROSS_FIELD_TYPES
 */
export function isCrossFieldType(type: string): type is CrossFieldType {
  return (CROSS_FIELD_TYPES as readonly string[]).includes(type);
}

/**
 * Get the validator callback name for a crossField type.
 * Since the type IS the callback name, this just returns the type.
 * @param type - The crossField type (e.g., 'atLeastOne')
 * @returns The validator function name (same as type)
 */
export function getCrossFieldValidatorName(type: string): string {
  return type;
}

/**
 * Enrich a crossField rule by automatically adding the current field path to targetFields.
 * When a crossField rule is defined at field level, the current field should be
 * included in the validation without requiring explicit declaration.
 *
 * NOTE: Some crossField types should NOT include the current field in targetFields:
 * - sumEquals: currentValue is compared against sum(targetFields), so current field must NOT be included
 *
 * @param rule - The validation rule to enrich
 * @param currentFieldPath - The path of the field where the rule is defined
 * @returns A new enriched rule (original is not mutated)
 */
export function enrichCrossFieldRule(rule: ValidationRule, currentFieldPath: string): ValidationRule {
  if (!isCrossFieldType(rule.type)) {
    return rule;
  }

  // These crossField types should NOT include the current field in targetFields:
  // - sumEquals: currentValue is compared against sum(targetFields)
  // - notEquals: currentValue !== targetField values (would always match itself)
  // - lessThan: currentValue < targetField value
  // - greaterThan: currentValue > targetField value
  // - equals: currentValue === targetField value
  // Including current field would cause incorrect comparisons
  if (rule.type === 'sumEquals' || rule.type === 'notEquals' || rule.type === 'lessThan' || rule.type === 'greaterThan' || rule.type === 'equals') {
    return rule; // Don't enrich - keep original targetFields
  }

  const targetFields = [...(rule.targetFields || [])];

  if (!targetFields.includes(currentFieldPath)) {
    targetFields.push(currentFieldPath);
  }

  return {
    ...rule,
    targetFields,
  };
}

/**
 * Type guard to check if a ValidationRuleOrGroup is a ValidationRule
 */
export function isValidationRule(
  rule: ValidationRuleOrGroup
): rule is import('formfiller-schema').ValidationRule {
  return 'type' in rule && typeof rule.type === 'string';
}

/**
 * Type guard to check if a ValidationRuleOrGroup is a ValidationRuleGroup
 * Supports both legacy format (operator property) and new format (or/and/not properties)
 */
export function isValidationRuleGroup(
  rule: ValidationRuleOrGroup
): rule is import('formfiller-schema').ValidationRuleGroup {
  const group = rule as import('formfiller-schema').ValidationRuleGroup;

  // Legacy format: { operator: 'or', rules: [...] }
  if (
    'operator' in group &&
    ('and' === group.operator || 'or' === group.operator || 'not' === group.operator)
  ) {
    return true;
  }

  // New format: { or: [...] } or { and: [...] } or { not: {...} }
  if ('or' in group || 'and' in group || 'not' in group) {
    // Make sure it's not a ValidationRule that happens to have these properties
    // by checking if 'type' is NOT present
    if (!('type' in rule)) {
      return true;
    }
  }

  return false;
}

/**
 * Get rules array from a ValidationRuleGroup (handles both formats)
 */
export function getGroupRules(
  group: import('formfiller-schema').ValidationRuleGroup
): Array<
  import('formfiller-schema').ValidationRule | import('formfiller-schema').ValidationRuleGroup
> {
  // Legacy format
  if (group.rules && Array.isArray(group.rules)) {
    return group.rules;
  }
  // New format
  if (group.or && Array.isArray(group.or)) {
    return group.or;
  }
  if (group.and && Array.isArray(group.and)) {
    return group.and;
  }
  if (group.not) {
    return [group.not];
  }
  return [];
}

/**
 * Get operator from a ValidationRuleGroup (handles both formats)
 */
export function getGroupOperator(
  group: import('formfiller-schema').ValidationRuleGroup
): 'and' | 'or' | 'not' {
  // Legacy format
  if (group.operator) {
    return group.operator;
  }
  // New format
  if ('or' in group) return 'or';
  if ('and' in group) return 'and';
  if ('not' in group) return 'not';

  // Default to 'and' if no operator found
  return 'and';
}

/**
 * Get message from a ValidationRuleGroup (handles both formats)
 */
export function getGroupMessage(
  group: import('formfiller-schema').ValidationRuleGroup
): string | undefined {
  return group.groupMessage || group.message;
}

/**
 * Flattens a ValidationRuleOrGroup structure into an array of ValidationRules
 * This is useful for processing all rules without worrying about nesting
 */
export function flattenValidationRules(
  rules: ValidationRuleOrGroup[]
): import('formfiller-schema').ValidationRule[] {
  const result: import('formfiller-schema').ValidationRule[] = [];

  for (const rule of rules) {
    if (isValidationRule(rule)) {
      result.push(rule);
    } else if (isValidationRuleGroup(rule)) {
      const nestedRules = getGroupRules(rule);
      result.push(...flattenValidationRules(nestedRules));
    }
  }

  return result;
}

/**
 * Extracts all field names referenced in validation rules
 * Useful for dependency graph building
 */
export function extractFieldReferences(rules: ValidationRuleOrGroup[]): string[] {
  const fields = new Set<string>();

  for (const rule of rules) {
    if (isValidationRule(rule)) {
      // CrossField validation
      if (rule.targetFields) {
        rule.targetFields.forEach((f) => fields.add(f));
      }
      // Compare validation
      if (rule.comparisonTarget) {
        fields.add(rule.comparisonTarget);
      }
      // ✨ NEW: Extract fields from 'when' condition
      if (rule.when) {
        const whenFields = extractConditionalFields(rule.when);
        whenFields.forEach((f) => fields.add(f));
      }
    } else if (isValidationRuleGroup(rule)) {
      const nestedRules = getGroupRules(rule);
      const nestedFields = extractFieldReferences(nestedRules);
      nestedFields.forEach((f) => fields.add(f));
    }
  }

  return Array.from(fields);
}

/**
 * Recursively extracts field names from a ConditionalExpression
 * Supports all three specification modes:
 * 1. Simple equality: { field: value }
 * 2. Implicit "in": { field: [value1, value2] }
 * 3. Explicit operator: { field: ['operator', value] }
 * Plus logical operators: and, or, not
 */
export function extractConditionalFields(expression: ConditionalExpression): string[] {
  const fields = new Set<string>();

  if (typeof expression !== 'object' || expression === null) {
    return [];
  }

  // Handle logical operators
  if ('and' in expression && Array.isArray(expression.and)) {
    expression.and.forEach((expr: ConditionalExpression) => {
      extractConditionalFields(expr).forEach((f) => fields.add(f));
    });
    return Array.from(fields);
  }

  if ('or' in expression && Array.isArray(expression.or)) {
    expression.or.forEach((expr: ConditionalExpression) => {
      extractConditionalFields(expr).forEach((f) => fields.add(f));
    });
    return Array.from(fields);
  }

  if ('not' in expression && expression.not) {
    extractConditionalFields(expression.not).forEach((f) => fields.add(f));
    return Array.from(fields);
  }

  // Extract field names from simple object format: { field: value } or { field: [values] }
  // Skip logical operator keys
  const keys = Object.keys(expression);
  for (const key of keys) {
    if (key !== 'and' && key !== 'or' && key !== 'not') {
      fields.add(key);
    }
  }

  return Array.from(fields);
}
