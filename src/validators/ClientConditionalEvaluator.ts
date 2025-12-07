/**
 * ClientConditionalEvaluator - Lightweight conditional expression evaluator for client-side
 *
 * Evaluates conditional expressions (visibleIf, disabledIf, requiredIf, readonlyIf, when)
 * Same logic as ConditionalEvaluator but with lightweight context
 */

import { ConditionalExpression } from 'formfiller-schema';
import { ClientValidationContext } from './ClientValidationContext';

export class ClientConditionalEvaluator {
  /**
   * Evaluate a conditional expression
   */
  evaluate(
    expression: ConditionalExpression | ConditionalExpression[],
    context: ClientValidationContext
  ): boolean {
    // Handle array of conditions (implicit AND)
    if (Array.isArray(expression)) {
      return expression.every((cond) => this.evaluate(cond, context));
    }

    // Handle logical operators
    if (typeof expression === 'object' && expression !== null) {
      // AND condition
      if ('and' in expression && expression.and) {
        const andArray = Array.isArray(expression.and) ? expression.and : [expression.and];
        return andArray.every((expr: any) => this.evaluate(expr, context));
      }

      // OR condition
      if ('or' in expression && expression.or) {
        const orArray = Array.isArray(expression.or) ? expression.or : [expression.or];
        return orArray.some((expr: any) => this.evaluate(expr, context));
      }

      // NOT condition
      if ('not' in expression && expression.not) {
        return !this.evaluate(expression.not as ConditionalExpression, context);
      }

      // Explicit condition with field, operator, value
      if ('field' in expression && 'operator' in expression && 'value' in expression) {
        const fieldValue = context.getValue(expression.field as string);
        return this.compareValues(fieldValue, expression.value, expression.operator as string);
      }

      // Simple condition: { fieldName: value } or { fieldName: [values] } or { fieldName: ['operator', value] }
      const keys = Object.keys(expression);
      if (keys.length === 1 && keys[0] && !['and', 'or', 'not'].includes(keys[0])) {
        const fieldName = keys[0];
        const expectedValue = (expression as any)[fieldName];
        const actualValue = context.getValue(fieldName);

        // Case 1: Array format
        if (Array.isArray(expectedValue)) {
          // Sub-case 1a: Explicit operator format: ['operator', value]
          if (expectedValue.length === 2 && typeof expectedValue[0] === 'string') {
            const operator = expectedValue[0];
            const value = expectedValue[1];
            // Check if it's an operator
            if (
              [
                '==',
                '!=',
                '>',
                '<',
                '>=',
                '<=',
                'in',
                'notIn',
                'contains',
                'startswith',
                'endswith',
              ].includes(operator)
            ) {
              return this.compareValues(actualValue, value, operator);
            }
          }
          // Sub-case 1b: Implicit "in" operator: [value1, value2, ...]
          return expectedValue.includes(actualValue);
        }

        // Case 2: Scalar value - simple equality
        return actualValue == expectedValue; // Loose equality
      }
    }

    return true;
  }

  /**
   * Compare two values using the specified operator
   */
  private compareValues(fieldValue: any, compareValue: any, operator: string): boolean {
    switch (operator) {
      case '==':
        return fieldValue == compareValue; // Loose equality

      case '!=':
        return fieldValue != compareValue; // Loose inequality

      case '>':
        return fieldValue > compareValue;

      case '<':
        return fieldValue < compareValue;

      case '>=':
        return fieldValue >= compareValue;

      case '<=':
        return fieldValue <= compareValue;

      case 'in':
        if (Array.isArray(compareValue)) {
          return compareValue.includes(fieldValue);
        }
        return false;

      case 'notIn':
        if (Array.isArray(compareValue)) {
          return !compareValue.includes(fieldValue);
        }
        return true;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
          return fieldValue.includes(compareValue);
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(compareValue);
        }
        return false;

      case 'startswith':
        if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
          return fieldValue.startsWith(compareValue);
        }
        return false;

      case 'endswith':
        if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
          return fieldValue.endsWith(compareValue);
        }
        return false;

      default:
        console.warn(`Unknown comparison operator: ${operator}`);
        return false;
    }
  }
}
