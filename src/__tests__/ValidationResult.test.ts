/**
 * ValidationResult Tests
 */

import { ValidationResult } from '../core/ValidationResult';

describe('ValidationResult', () => {
  let result: ValidationResult;

  beforeEach(() => {
    result = new ValidationResult();
  });

  describe('Initial State', () => {
    it('should start as valid', () => {
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have empty computed results', () => {
      expect(result.computedResults).toEqual({});
    });

    it('should have empty field results', () => {
      expect(result.fieldResults).toEqual({});
    });
  });

  describe('addError', () => {
    it('should add error and mark as invalid', () => {
      result.addError('email', 'Invalid email', 'email');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'email',
        message: 'Invalid email',
        rule: 'email',
      });
    });

    it('should add error with params', () => {
      result.addError('age', 'Must be at least 18', 'range', { min: 18 });

      expect(result.errors[0]?.params).toEqual({ min: 18 });
    });

    it('should add error with path', () => {
      result.addError('field', 'Error', 'rule', {}, ['user', 'address']);

      expect(result.errors[0]?.path).toEqual(['user', 'address']);
    });

    it('should update field results', () => {
      result.addError('email', 'Invalid email', 'email');

      expect(result.fieldResults?.email?.valid).toBe(false);
      expect(result.fieldResults?.email?.errors).toHaveLength(1);
    });

    it('should accumulate multiple errors for same field', () => {
      result.addError('email', 'Required', 'required');
      result.addError('email', 'Invalid format', 'email');

      expect(result.fieldResults?.email?.errors).toHaveLength(2);
    });
  });

  describe('setFieldValid', () => {
    it('should mark field as valid', () => {
      result.setFieldValid('firstName');

      expect(result.fieldResults?.firstName?.valid).toBe(true);
      expect(result.fieldResults?.firstName?.errors).toHaveLength(0);
    });

    it('should keep existing valid status', () => {
      result.setFieldValid('firstName');
      result.setFieldValid('firstName');

      expect(result.fieldResults?.firstName?.valid).toBe(true);
    });
  });

  describe('setFieldSkipped', () => {
    it('should mark field as skipped', () => {
      result.setFieldSkipped('hiddenField', 'Field is not visible');

      expect(result.fieldResults?.hiddenField?.skipped).toBe(true);
      expect(result.fieldResults?.hiddenField?.skipReason).toBe('Field is not visible');
      expect(result.fieldResults?.hiddenField?.valid).toBe(true);
    });
  });

  describe('addComputedResult', () => {
    it('should add computed result', () => {
      result.addComputedResult('totalScore', 85);

      expect(result.computedResults?.totalScore).toBe(85);
    });

    it('should add multiple computed results', () => {
      result.addComputedResult('score1', 10);
      result.addComputedResult('score2', 20);

      expect(result.computedResults?.score1).toBe(10);
      expect(result.computedResults?.score2).toBe(20);
    });
  });

  describe('merge', () => {
    it('should merge errors from another result', () => {
      const other = new ValidationResult();
      other.addError('field1', 'Error 1', 'rule1');
      other.addError('field2', 'Error 2', 'rule2');

      result.merge(other);

      expect(result.errors).toHaveLength(2);
      expect(result.valid).toBe(false);
    });

    it('should merge field results', () => {
      const other = new ValidationResult();
      other.setFieldValid('field1');
      other.addError('field2', 'Error', 'rule');

      result.merge(other);

      expect(result.fieldResults?.field1?.valid).toBe(true);
      expect(result.fieldResults?.field2?.valid).toBe(false);
    });

    it('should merge computed results', () => {
      const other = new ValidationResult();
      other.addComputedResult('result1', 10);

      result.addComputedResult('result2', 20);
      result.merge(other);

      expect(result.computedResults?.result1).toBe(10);
      expect(result.computedResults?.result2).toBe(20);
    });

    it('should combine field errors', () => {
      result.addError('email', 'Required', 'required');

      const other = new ValidationResult();
      other.addError('email', 'Invalid format', 'email');

      result.merge(other);

      expect(result.fieldResults?.email?.errors).toHaveLength(2);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      result.addError('email', 'Invalid', 'email');
      result.setFieldValid('firstName');
      result.addComputedResult('total', 100);
    });

    it('getFieldErrors should return errors for field', () => {
      const errors = result.getFieldErrors('email');
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toBe('Invalid');
    });

    it('getComputedResult should return computed value', () => {
      expect(result.getComputedResult('total')).toBe(100);
    });

    it('isFieldValid should return correct status', () => {
      expect(result.isFieldValid('firstName')).toBe(true);
      expect(result.isFieldValid('email')).toBe(false);
    });

    it('isFieldSkipped should return correct status', () => {
      result.setFieldSkipped('hidden', 'Not visible');
      expect(result.isFieldSkipped('hidden')).toBe(true);
      expect(result.isFieldSkipped('email')).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON', () => {
      result.addError('field', 'Error', 'rule');
      result.addComputedResult('result', 10);

      const json = result.toJSON();

      expect(json.valid).toBe(false);
      expect(json.errors).toHaveLength(1);
      expect(json.computedResults).toEqual({ result: 10 });
    });

    it('should deserialize from JSON', () => {
      const json = {
        valid: false,
        errors: [{ field: 'test', message: 'Error', rule: 'rule' }],
        computedResults: { result: 10 },
        fieldResults: {},
      };

      const deserialized = ValidationResult.fromJSON(json);

      expect(deserialized.valid).toBe(false);
      expect(deserialized.errors).toHaveLength(1);
      expect(deserialized.computedResults?.result).toBe(10);
    });
  });
});
