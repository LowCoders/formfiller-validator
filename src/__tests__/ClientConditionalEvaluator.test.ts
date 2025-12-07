/**
 * ClientConditionalEvaluator Tests
 *
 * Tests for the client-side conditional expression evaluator.
 * Handles visibleIf, disabledIf, requiredIf, readonlyIf, when conditions.
 */

import { ClientConditionalEvaluator } from '../validators/ClientConditionalEvaluator';
import { ClientValidationContext } from '../validators/ClientValidationContext';

describe('ClientConditionalEvaluator', () => {
  let evaluator: ClientConditionalEvaluator;

  beforeEach(() => {
    evaluator = new ClientConditionalEvaluator();
  });

  // Helper to create a context with form data
  function createContext(formData: Record<string, any>): ClientValidationContext {
    return new ClientValidationContext(formData);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Simple Equality Conditions
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Simple equality conditions', () => {
    it('should return true for matching string value', () => {
      const context = createContext({ status: 'active' });
      const expression = { status: 'active' };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should return false for non-matching string value', () => {
      const context = createContext({ status: 'inactive' });
      const expression = { status: 'active' };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should return true for matching number value', () => {
      const context = createContext({ count: 5 });
      const expression = { count: 5 };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should return true for matching boolean value', () => {
      const context = createContext({ enabled: true });
      const expression = { enabled: true };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should use loose equality for string/number comparison', () => {
      const context = createContext({ value: '5' });
      const expression = { value: 5 };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Implicit "in" Operator (Array of Values)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Implicit "in" operator', () => {
    it('should return true when value is in array', () => {
      const context = createContext({ color: 'red' });
      const expression = { color: ['red', 'blue', 'green'] };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should return false when value is not in array', () => {
      const context = createContext({ color: 'yellow' });
      const expression = { color: ['red', 'blue', 'green'] };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Explicit Operator Format: ['operator', value]
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Explicit operator format', () => {
    it('should handle == operator', () => {
      const context = createContext({ age: 18 });

      expect(evaluator.evaluate({ age: ['==', 18] }, context)).toBe(true);
      expect(evaluator.evaluate({ age: ['==', 21] }, context)).toBe(false);
    });

    it('should handle != operator', () => {
      const context = createContext({ status: 'active' });

      expect(evaluator.evaluate({ status: ['!=', 'deleted'] }, context)).toBe(true);
      expect(evaluator.evaluate({ status: ['!=', 'active'] }, context)).toBe(false);
    });

    it('should handle > operator', () => {
      const context = createContext({ age: 25 });

      expect(evaluator.evaluate({ age: ['>', 18] }, context)).toBe(true);
      expect(evaluator.evaluate({ age: ['>', 25] }, context)).toBe(false);
      expect(evaluator.evaluate({ age: ['>', 30] }, context)).toBe(false);
    });

    it('should handle >= operator', () => {
      const context = createContext({ age: 18 });

      expect(evaluator.evaluate({ age: ['>=', 18] }, context)).toBe(true);
      expect(evaluator.evaluate({ age: ['>=', 17] }, context)).toBe(true);
      expect(evaluator.evaluate({ age: ['>=', 19] }, context)).toBe(false);
    });

    it('should handle < operator', () => {
      const context = createContext({ price: 50 });

      expect(evaluator.evaluate({ price: ['<', 100] }, context)).toBe(true);
      expect(evaluator.evaluate({ price: ['<', 50] }, context)).toBe(false);
    });

    it('should handle <= operator', () => {
      const context = createContext({ quantity: 10 });

      expect(evaluator.evaluate({ quantity: ['<=', 10] }, context)).toBe(true);
      expect(evaluator.evaluate({ quantity: ['<=', 15] }, context)).toBe(true);
      expect(evaluator.evaluate({ quantity: ['<=', 5] }, context)).toBe(false);
    });

    it('should handle in operator', () => {
      const context = createContext({ role: 'admin' });

      expect(evaluator.evaluate({ role: ['in', ['admin', 'moderator']] }, context)).toBe(true);
      expect(evaluator.evaluate({ role: ['in', ['user', 'guest']] }, context)).toBe(false);
    });

    it('should handle notIn operator', () => {
      const context = createContext({ status: 'active' });

      expect(evaluator.evaluate({ status: ['notIn', ['deleted', 'banned']] }, context)).toBe(true);
      expect(evaluator.evaluate({ status: ['notIn', ['active', 'pending']] }, context)).toBe(false);
    });

    it('should handle contains operator for strings', () => {
      const context = createContext({ email: 'user@example.com' });

      expect(evaluator.evaluate({ email: ['contains', '@'] }, context)).toBe(true);
      expect(evaluator.evaluate({ email: ['contains', '.com'] }, context)).toBe(true);
      expect(evaluator.evaluate({ email: ['contains', '.org'] }, context)).toBe(false);
    });

    it('should handle contains operator for arrays', () => {
      const context = createContext({ tags: ['javascript', 'typescript', 'react'] });

      expect(evaluator.evaluate({ tags: ['contains', 'react'] }, context)).toBe(true);
      expect(evaluator.evaluate({ tags: ['contains', 'vue'] }, context)).toBe(false);
    });

    it('should handle startswith operator', () => {
      const context = createContext({ phone: '+36301234567' });

      expect(evaluator.evaluate({ phone: ['startswith', '+36'] }, context)).toBe(true);
      expect(evaluator.evaluate({ phone: ['startswith', '+1'] }, context)).toBe(false);
    });

    it('should handle endswith operator', () => {
      const context = createContext({ filename: 'document.pdf' });

      expect(evaluator.evaluate({ filename: ['endswith', '.pdf'] }, context)).toBe(true);
      expect(evaluator.evaluate({ filename: ['endswith', '.doc'] }, context)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Logical Operators: AND, OR, NOT
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Logical AND operator', () => {
    it('should return true when all conditions are met', () => {
      const context = createContext({ age: 25, status: 'active' });
      const expression = {
        and: [{ age: ['>=', 18] }, { status: 'active' }],
      };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should return false when any condition fails', () => {
      const context = createContext({ age: 16, status: 'active' });
      const expression = {
        and: [{ age: ['>=', 18] }, { status: 'active' }],
      };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should handle single condition in AND', () => {
      const context = createContext({ active: true });
      const expression = { and: { active: true } };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });
  });

  describe('Logical OR operator', () => {
    it('should return true when any condition is met', () => {
      const context = createContext({ role: 'admin' });
      const expression = {
        or: [{ role: 'admin' }, { role: 'moderator' }],
      };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should return false when no conditions are met', () => {
      const context = createContext({ role: 'guest' });
      const expression = {
        or: [{ role: 'admin' }, { role: 'moderator' }],
      };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should handle single condition in OR', () => {
      const context = createContext({ active: true });
      const expression = { or: { active: true } };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });
  });

  describe('Logical NOT operator', () => {
    it('should negate true to false', () => {
      const context = createContext({ deleted: true });
      const expression = { not: { deleted: true } };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should negate false to true', () => {
      const context = createContext({ deleted: false });
      const expression = { not: { deleted: true } };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should negate complex conditions', () => {
      const context = createContext({ age: 16 });
      const expression = { not: { age: ['>=', 18] } };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Nested Logical Operators
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Nested logical operators', () => {
    it('should handle AND inside OR', () => {
      const context = createContext({ role: 'user', isPremium: true });
      const expression = {
        or: [
          { role: 'admin' },
          {
            and: [{ role: 'user' }, { isPremium: true }],
          },
        ],
      };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should handle OR inside AND', () => {
      const context = createContext({ age: 25, country: 'HU' });
      const expression = {
        and: [
          { age: ['>=', 18] },
          {
            or: [{ country: 'HU' }, { country: 'AT' }],
          },
        ],
      };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should handle NOT inside AND', () => {
      const context = createContext({ status: 'active', banned: false });
      const expression = {
        and: [{ status: 'active' }, { not: { banned: true } }],
      };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Array of Conditions (Implicit AND)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Array of conditions (implicit AND)', () => {
    it('should treat array of conditions as AND', () => {
      const context = createContext({ age: 25, status: 'active' });
      const expression = [{ age: ['>=', 18] }, { status: 'active' }];

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should return false if any condition in array fails', () => {
      const context = createContext({ age: 16, status: 'active' });
      const expression = [{ age: ['>=', 18] }, { status: 'active' }];

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Explicit Field-Operator-Value Format
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Explicit field-operator-value format', () => {
    it('should handle explicit format', () => {
      const context = createContext({ amount: 100 });
      const expression = {
        field: 'amount',
        operator: '>',
        value: 50,
      };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Edge Cases
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Edge cases', () => {
    it('should return true for empty/null expression', () => {
      const context = createContext({ field: 'value' });

      expect(evaluator.evaluate({} as any, context)).toBe(true);
    });

    it('should handle undefined field values', () => {
      const context = createContext({});
      const expression = { missingField: 'value' };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should handle null field values', () => {
      const context = createContext({ field: null });
      const expression = { field: null };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should treat unknown operator format as implicit in', () => {
      const context = createContext({ field: 'unknownOp' });
      // When array format doesn't match a known operator, it's treated as implicit "in"
      const expression = { field: ['unknownOp', 'value'] };

      // Since 'unknownOp' is in the array ['unknownOp', 'value'], it returns true
      expect(evaluator.evaluate(expression, context)).toBe(true);
    });

    it('should handle contains with non-string/non-array', () => {
      const context = createContext({ field: 123 });
      const expression = { field: ['contains', '1'] };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should handle startswith with non-string', () => {
      const context = createContext({ field: 123 });
      const expression = { field: ['startswith', '1'] };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should handle endswith with non-string', () => {
      const context = createContext({ field: 123 });
      const expression = { field: ['endswith', '3'] };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should handle in operator with non-array compare value', () => {
      const context = createContext({ field: 'value' });
      const expression = { field: ['in', 'notAnArray'] };

      expect(evaluator.evaluate(expression, context)).toBe(false);
    });

    it('should handle notIn operator with non-array compare value', () => {
      const context = createContext({ field: 'value' });
      const expression = { field: ['notIn', 'notAnArray'] };

      expect(evaluator.evaluate(expression, context)).toBe(true);
    });
  });
});
