/**
 * ValidationConditionEvaluator Unit Tests
 */

import { ValidationConditionEvaluator } from '../processors/ValidationConditionEvaluator';
import { ConditionalEvaluator } from '../processors/ConditionalEvaluator';
import { ValidationContext } from '../core/ValidationContext';
import { ValidationRule } from 'formfiller-schema';

describe('ValidationConditionEvaluator', () => {
  let evaluator: ValidationConditionEvaluator;
  let conditionalEvaluator: ConditionalEvaluator;

  beforeEach(() => {
    conditionalEvaluator = new ConditionalEvaluator();
    evaluator = new ValidationConditionEvaluator(conditionalEvaluator);
  });

  describe('shouldApplyRule', () => {
    it('should return true when rule has no when condition', () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      const context = new ValidationContext(
        { field1: 'value1' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(true);
    });

    it('should return true when simple equality condition is met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: { userRole: 'admin' },
        message: 'Field is required for admin',
      };

      const context = new ValidationContext(
        { userRole: 'admin' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(true);
    });

    it('should return false when simple equality condition is NOT met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: { userRole: 'admin' },
        message: 'Field is required for admin',
      };

      const context = new ValidationContext(
        { userRole: 'user' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(false);
    });

    it('should return true when implicit "in" array condition is met - admin', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: { userRole: ['admin', 'moderator'] },
        message: 'Field is required for admin/moderator',
      };

      const context = new ValidationContext(
        { userRole: 'admin' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      const result = evaluator.shouldApplyRule(rule, context);
      console.log('Test: implicit in (admin) - result:', result);
      expect(result).toBe(true);
    });

    it('should return true when implicit "in" array condition is met - moderator', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: { userRole: ['admin', 'moderator'] },
        message: 'Field is required for admin/moderator',
      };

      const context = new ValidationContext(
        { userRole: 'moderator' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(true);
    });

    it('should return false when implicit "in" array condition is NOT met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: { userRole: ['admin', 'moderator'] },
        message: 'Field is required for admin/moderator',
      };

      const context = new ValidationContext(
        { userRole: 'user' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(false);
    });

    it('should return true when explicit operator condition is met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: { age: ['<', 18] },
        message: 'Field is required for minors',
      };

      const context = new ValidationContext(
        { age: 15 },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(true);
    });

    it('should return false when explicit operator condition is NOT met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: { age: ['<', 18] },
        message: 'Field is required for minors',
      };

      const context = new ValidationContext(
        { age: 25 },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(false);
    });

    it('should return true when AND condition is met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: {
          and: [{ country: 'US' }, { isStudent: true }],
        },
        message: 'Field is required for US students',
      };

      const context = new ValidationContext(
        { country: 'US', isStudent: true },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(true);
    });

    it('should return false when AND condition is partially met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: {
          and: [{ country: 'US' }, { isStudent: true }],
        },
        message: 'Field is required for US students',
      };

      const context = new ValidationContext(
        { country: 'US', isStudent: false },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(false);
    });

    it('should return true when OR condition is met (first)', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: {
          or: [{ country: 'US' }, { country: 'UK' }],
        },
        message: 'Field is required for US or UK',
      };

      const context = new ValidationContext(
        { country: 'US' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(true);
    });

    it('should return true when OR condition is met (second)', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: {
          or: [{ country: 'US' }, { country: 'UK' }],
        },
        message: 'Field is required for US or UK',
      };

      const context = new ValidationContext(
        { country: 'UK' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(true);
    });

    it('should return false when OR condition is NOT met', () => {
      const rule: ValidationRule = {
        type: 'required',
        when: {
          or: [{ country: 'US' }, { country: 'UK' }],
        },
        message: 'Field is required for US or UK',
      };

      const context = new ValidationContext(
        { country: 'CA' },
        { formId: 'test', items: [] },
        { mode: 'sequential' },
        {}
      );

      expect(evaluator.shouldApplyRule(rule, context)).toBe(false);
    });
  });
});
