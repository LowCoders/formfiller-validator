/**
 * ClientValidator Comprehensive Tests
 *
 * Comprehensive unit tests for all ClientValidator functionality:
 * - Basic rules (required, email, numeric, stringLength, range, pattern, arrayLength)
 * - CrossField validators (all ClientCallbackRegistry validators)
 * - Edge cases (null/undefined, empty values, invalid types, nested paths)
 */

import { ClientValidator } from '../validators/ClientValidator';
import { resetClientRegistry } from '../validators/ClientCallbackRegistry';
import { ValidationRule } from '../types';

describe('ClientValidator Comprehensive Tests', () => {
  let validator: ClientValidator;

  beforeEach(() => {
    resetClientRegistry();
    validator = new ClientValidator();
  });

  describe('Basic Rules - Required', () => {
    it('should pass for non-empty string', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await validator.validate('field', 'value', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for empty string', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await validator.validate('field', '', [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for null', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await validator.validate('field', null, [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for undefined', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await validator.validate('field', undefined, [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should pass for number 0', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await validator.validate('field', 0, [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should pass for boolean false', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await validator.validate('field', false, [rule], {});
      expect(result.valid).toBe(true);
    });
  });

  describe('Basic Rules - Email', () => {
    it('should pass for valid email', async () => {
      const rule: ValidationRule = { type: 'email', message: 'Invalid email' };
      const result = await validator.validate('email', 'test@example.com', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid email', async () => {
      const rule: ValidationRule = { type: 'email', message: 'Invalid email' };
      const result = await validator.validate('email', 'not-an-email', [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should pass for empty string (use required for mandatory)', async () => {
      const rule: ValidationRule = { type: 'email', message: 'Invalid email' };
      const result = await validator.validate('email', '', [rule], {});
      expect(result.valid).toBe(true);
    });
  });

  describe('Basic Rules - Numeric', () => {
    it('should pass for number', async () => {
      const rule: ValidationRule = { type: 'numeric', message: 'Must be numeric' };
      const result = await validator.validate('num', 123, [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should pass for numeric string', async () => {
      const rule: ValidationRule = { type: 'numeric', message: 'Must be numeric' };
      const result = await validator.validate('num', '456', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for non-numeric string', async () => {
      const rule: ValidationRule = { type: 'numeric', message: 'Must be numeric' };
      const result = await validator.validate('num', 'abc', [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - StringLength', () => {
    it('should pass for valid length', async () => {
      const rule: ValidationRule = {
        type: 'stringLength',
        min: 3,
        max: 10,
        message: 'Invalid length',
      };
      const result = await validator.validate('text', 'hello', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for too short', async () => {
      const rule: ValidationRule = { type: 'stringLength', min: 5, message: 'Too short' };
      const result = await validator.validate('text', 'hi', [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for too long', async () => {
      const rule: ValidationRule = { type: 'stringLength', max: 5, message: 'Too long' };
      const result = await validator.validate('text', 'toolongtext', [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - Range', () => {
    it('should pass for value in range', async () => {
      const rule: ValidationRule = { type: 'range', min: 10, max: 100, message: 'Out of range' };
      const result = await validator.validate('num', 50, [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for value below minimum', async () => {
      const rule: ValidationRule = { type: 'range', min: 10, message: 'Too low' };
      const result = await validator.validate('num', 5, [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for value above maximum', async () => {
      const rule: ValidationRule = { type: 'range', max: 100, message: 'Too high' };
      const result = await validator.validate('num', 150, [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - Pattern', () => {
    it('should pass for matching pattern', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: '^[a-z]+$',
        message: 'Invalid pattern',
      };
      const result = await validator.validate('text', 'hello', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for non-matching pattern', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: '^[a-z]+$',
        message: 'Invalid pattern',
      };
      const result = await validator.validate('text', 'Hello123', [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - ArrayLength', () => {
    it('should pass for valid array length', async () => {
      const rule: ValidationRule = {
        type: 'arrayLength',
        min: 1,
        max: 3,
        message: 'Invalid array length',
      };
      const result = await validator.validate('arr', ['a', 'b'], [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for empty array when min is set', async () => {
      const rule: ValidationRule = { type: 'arrayLength', min: 1, message: 'Array too small' };
      const result = await validator.validate('arr', [], [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for array too long', async () => {
      const rule: ValidationRule = { type: 'arrayLength', max: 2, message: 'Array too large' };
      const result = await validator.validate('arr', ['a', 'b', 'c'], [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - isNotEmpty', () => {
    it('should pass when target field has value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['targetField'],
        crossFieldValidator: 'isNotEmpty',
        message: 'Target must not be empty',
      };
      const formData = { targetField: 'value' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when target field is empty', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['targetField'],
        crossFieldValidator: 'isNotEmpty',
        message: 'Target must not be empty',
      };
      const formData = { targetField: '' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - equals (parameterized)', () => {
    it('should pass when field equals value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'equals', params: { value: 'senior' } },
        message: 'Must be senior',
      };
      const formData = { position: 'senior' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when field does not equal value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'equals', params: { value: 'senior' } },
        message: 'Must be senior',
      };
      const formData = { position: 'junior' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - notEquals (parameterized)', () => {
    it('should pass when field does not equal value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'notEquals', params: { value: 'intern' } },
        message: 'Cannot be intern',
      };
      const formData = { position: 'senior' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when field equals value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'notEquals', params: { value: 'intern' } },
        message: 'Cannot be intern',
      };
      const formData = { position: 'intern' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - valueIn (parameterized)', () => {
    it('should pass when value is in list', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['subscription'],
        crossFieldValidator: { name: 'valueIn', params: { values: ['Premium', 'Enterprise'] } },
        message: 'Must be Premium or Enterprise',
      };
      const formData = { subscription: 'Premium' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when value is not in list', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['subscription'],
        crossFieldValidator: { name: 'valueIn', params: { values: ['Premium', 'Enterprise'] } },
        message: 'Must be Premium or Enterprise',
      };
      const formData = { subscription: 'Basic' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - compare (parameterized)', () => {
    it('should pass for == comparison', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['field1', 'field2'],
        crossFieldValidator: { name: 'compare', params: { operator: '==' } },
        message: 'Must be equal',
      };
      const formData = { field1: 'value', field2: 'value' };
      const result = await validator.validate('check', undefined, [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should pass for > comparison', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['max', 'min'],
        crossFieldValidator: { name: 'compare', params: { operator: '>' } },
        message: 'Max must be greater than min',
      };
      const formData = { max: 100, min: 50 };
      const result = await validator.validate('check', undefined, [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail for < comparison when not met', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['startDate', 'endDate'],
        crossFieldValidator: { name: 'compare', params: { operator: '<' } },
        message: 'Start must be before end',
      };
      const formData = { startDate: 100, endDate: 50 };
      const result = await validator.validate('check', undefined, [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - passwordMatch', () => {
    it('should pass when passwords match', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['password', 'confirmPassword'],
        crossFieldValidator: 'passwordMatch',
        message: 'Passwords must match',
      };
      const formData = { password: 'secret123', confirmPassword: 'secret123' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when passwords do not match', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['password', 'confirmPassword'],
        crossFieldValidator: 'passwordMatch',
        message: 'Passwords must match',
      };
      const formData = { password: 'secret123', confirmPassword: 'different' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - arrayContains (parameterized)', () => {
    it('should pass when array contains value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: { name: 'arrayContains', params: { value: 'admin' } },
        message: 'Must have admin permission',
      };
      const formData = { permissions: ['read', 'write', 'admin'] };
      const result = await validator.validate('check', undefined, [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when array does not contain value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: { name: 'arrayContains', params: { value: 'admin' } },
        message: 'Must have admin permission',
      };
      const formData = { permissions: ['read', 'write'] };
      const result = await validator.validate('check', undefined, [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - arrayContainsAny (parameterized)', () => {
    it('should pass when array contains any of the values', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: {
          name: 'arrayContainsAny',
          params: { values: ['admin', 'superuser'] },
        },
        message: 'Must have admin or superuser',
      };
      const formData = { permissions: ['read', 'write', 'admin'] };
      const result = await validator.validate('check', undefined, [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when array contains none of the values', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: {
          name: 'arrayContainsAny',
          params: { values: ['admin', 'superuser'] },
        },
        message: 'Must have admin or superuser',
      };
      const formData = { permissions: ['read', 'write'] };
      const result = await validator.validate('check', undefined, [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - atLeastOneRequired', () => {
    it('should pass when at least one field is filled', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['email', 'phone'],
        crossFieldValidator: 'atLeastOneRequired',
        message: 'At least one contact required',
      };
      const formData = { email: 'test@example.com', phone: '' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when all fields are empty', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['email', 'phone'],
        crossFieldValidator: 'atLeastOneRequired',
        message: 'At least one contact required',
      };
      const formData = { email: '', phone: '' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', async () => {
      const rule: ValidationRule = { type: 'stringLength', min: 3, message: 'Too short' };
      const result = await validator.validate('field', null, [rule], {});
      // stringLength on null should pass (use required for mandatory)
      expect(result.valid).toBe(true);
    });

    it('should handle undefined values gracefully', async () => {
      const rule: ValidationRule = { type: 'pattern', pattern: '^[a-z]+$', message: 'Invalid' };
      const result = await validator.validate('field', undefined, [rule], {});
      // pattern on undefined should pass (use required for mandatory)
      expect(result.valid).toBe(true);
    });

    it('should handle nested field paths', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['user.email'],
        crossFieldValidator: 'isNotEmpty',
        message: 'User email required',
      };
      const formData = { user: { email: 'test@example.com' } };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should handle multiple rules on same field', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'Required' },
        { type: 'stringLength', min: 5, message: 'Too short' },
        { type: 'pattern', pattern: '^[a-z]+$', message: 'Invalid chars' },
      ];
      const result = await validator.validate('field', 'hello', rules, {});
      expect(result.valid).toBe(true);
    });

    it('should fail on first error when multiple rules fail', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'Required' },
        { type: 'stringLength', min: 10, message: 'Too short' },
      ];
      const result = await validator.validate('field', 'hi', rules, {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
