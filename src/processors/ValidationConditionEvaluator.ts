/**
 * ValidationConditionEvaluator - Evaluates ValidationRule.when conditions
 *
 * Determines whether a validation rule should be applied based on its 'when' condition.
 * Uses the same ConditionalExpression format as visibleIf, disabledIf, etc.
 */

import { ValidationRule } from 'formfiller-schema';
import { ValidationContext } from '../core/ValidationContext';
import { ConditionalEvaluator } from './ConditionalEvaluator';

export class ValidationConditionEvaluator {
  private conditionalEvaluator: ConditionalEvaluator;

  constructor(conditionalEvaluator: ConditionalEvaluator) {
    this.conditionalEvaluator = conditionalEvaluator;
  }

  /**
   * Determines if a validation rule should be applied based on its 'when' condition.
   *
   * @param rule - The validation rule to check
   * @param context - The validation context with form data
   * @returns true if the rule should be applied, false if it should be skipped
   *
   * @example
   * // Simple equality
   * { type: 'required', when: { employmentStatus: 'employed' } }
   *
   * @example
   * // Implicit "in"
   * { type: 'required', when: { role: ['admin', 'moderator'] } }
   *
   * @example
   * // Explicit operator
   * { type: 'range', min: 18, when: { country: ['==', 'US'] } }
   *
   * @example
   * // Logical operators
   * {
   *   type: 'required',
   *   when: {
   *     and: [
   *       { status: 'active' },
   *       { verified: true }
   *     ]
   *   }
   * }
   */
  shouldApplyRule(rule: ValidationRule, context: ValidationContext): boolean {
    // If no 'when' condition, always apply the rule
    if (!rule.when) {
      return true;
    }

    // Evaluate the 'when' condition using ConditionalEvaluator
    try {
      return this.conditionalEvaluator.evaluate(rule.when, context);
    } catch (error) {
      console.error('Error evaluating validation rule condition:', error, rule);
      // On error, default to applying the rule (fail-safe)
      return true;
    }
  }

  /**
   * Filter validation rules based on their 'when' conditions.
   * Returns only the rules that should be applied in the current context.
   *
   * @param rules - Array of validation rules
   * @param context - The validation context
   * @returns Filtered array of rules that should be applied
   */
  filterApplicableRules(rules: ValidationRule[], context: ValidationContext): ValidationRule[] {
    return rules.filter((rule) => this.shouldApplyRule(rule, context));
  }
}
