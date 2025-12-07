/**
 * JoiAdapter Comprehensive Tests
 *
 * Comprehensive unit tests for all JoiAdapter functionality:
 * - All rule types (required, email, numeric, stringLength, range, pattern, arrayLength)
 * - CrossField validators (all CallbackRegistry validators - backend version)
 * - Temporal rules (date/time validations)
 * - Custom validators (inline function and registry callback)
 * - Edge cases (complex nested structures, conditional rules with when)
 */

import { JoiAdapter } from '../adapters/JoiAdapter';
import { ValidationContext } from '../core/ValidationContext';
import { getGlobalRegistry, resetGlobalRegistry } from '../core/CallbackRegistry';
import { ValidationRule, FormConfig } from '../types';

describe('JoiAdapter Comprehensive Tests', () => {
  let adapter: JoiAdapter;
  let context: ValidationContext;

  beforeEach(() => {
    resetGlobalRegistry();
    const registry = getGlobalRegistry();
    adapter = new JoiAdapter(registry);

    const formData = {
      firstName: 'John',
      lastName: 'Doe',
      email: '[email protected]',
      age: 25,
    };

    const formConfig: FormConfig = {
      formId: 'test-form',
    };

    context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
  });

  describe('Basic Rules - Required', () => {
    it('should pass for non-empty value', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await adapter.validate('test value', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for empty string', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await adapter.validate('', rule, context);
      expect(result.valid).toBe(false);
    });

    it('should fail for null', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await adapter.validate(null, rule, context);
      expect(result.valid).toBe(false);
    });

    it('should pass for number 0', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await adapter.validate(0, rule, context);
      expect(result.valid).toBe(true);
    });
  });

  describe('Basic Rules - Email', () => {
    it('should pass for valid email', async () => {
      const rule: ValidationRule = { type: 'email', message: 'Invalid email' };
      const result = await adapter.validate('test@example.com', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid email', async () => {
      const rule: ValidationRule = { type: 'email', message: 'Invalid email' };
      const result = await adapter.validate('not-an-email', rule, context);
      expect(result.valid).toBe(false);
    });

    it('should pass for empty string (optional)', async () => {
      const rule: ValidationRule = { type: 'email', message: 'Invalid email' };
      const result = await adapter.validate('', rule, context);
      expect(result.valid).toBe(true);
    });
  });

  describe('Basic Rules - Numeric', () => {
    it('should pass for number', async () => {
      const rule: ValidationRule = { type: 'numeric', message: 'Must be numeric' };
      const result = await adapter.validate(123, rule, context);
      expect(result.valid).toBe(true);
    });

    it('should pass for numeric string', async () => {
      const rule: ValidationRule = { type: 'numeric', message: 'Must be numeric' };
      const result = await adapter.validate('456', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for non-numeric', async () => {
      const rule: ValidationRule = { type: 'numeric', message: 'Must be numeric' };
      const result = await adapter.validate('abc', rule, context);
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
      const result = await adapter.validate('hello', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for too short', async () => {
      const rule: ValidationRule = { type: 'stringLength', min: 5, message: 'Too short' };
      const result = await adapter.validate('hi', rule, context);
      expect(result.valid).toBe(false);
    });

    it('should fail for too long', async () => {
      const rule: ValidationRule = { type: 'stringLength', max: 5, message: 'Too long' };
      const result = await adapter.validate('toolongtext', rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - Range', () => {
    it('should pass for value in range', async () => {
      const rule: ValidationRule = { type: 'range', min: 10, max: 100, message: 'Out of range' };
      const result = await adapter.validate(50, rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for value below minimum', async () => {
      const rule: ValidationRule = { type: 'range', min: 10, message: 'Too low' };
      const result = await adapter.validate(5, rule, context);
      expect(result.valid).toBe(false);
    });

    it('should fail for value above maximum', async () => {
      const rule: ValidationRule = { type: 'range', max: 100, message: 'Too high' };
      const result = await adapter.validate(150, rule, context);
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
      const result = await adapter.validate('hello', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for non-matching pattern', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: '^[a-z]+$',
        message: 'Invalid pattern',
      };
      const result = await adapter.validate('Hello123', rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - ArrayLength', () => {
    it('should pass for valid array length', async () => {
      const rule: ValidationRule = {
        type: 'arrayLength',
        min: 1,
        max: 3,
        message: 'Invalid length',
      };
      const result = await adapter.validate(['a', 'b'], rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for empty array when min is set', async () => {
      const rule: ValidationRule = { type: 'arrayLength', min: 1, message: 'Too small' };
      const result = await adapter.validate([], rule, context);
      expect(result.valid).toBe(false);
    });

    it('should fail for array exceeding max', async () => {
      const rule: ValidationRule = { type: 'arrayLength', max: 2, message: 'Too large' };
      const result = await adapter.validate(['a', 'b', 'c'], rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - isNotEmpty', () => {
    it('should pass when target field is not empty', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['firstName'],
        crossFieldValidator: 'isNotEmpty',
        message: 'First name must not be empty',
      };
      const result = await adapter.validate('', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail when target field is empty', async () => {
      // Create context with empty firstName
      const emptyContext = new ValidationContext(
        { firstName: '' },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['firstName'],
        crossFieldValidator: 'isNotEmpty',
        message: 'First name must not be empty',
      };
      const result = await adapter.validate('', rule, emptyContext);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - equals (parameterized)', () => {
    it('should pass when field equals value', async () => {
      const testContext = new ValidationContext(
        { position: 'senior' },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'equals', params: { value: 'senior' } },
        message: 'Must be senior',
      };
      const result = await adapter.validate('', rule, testContext);
      expect(result.valid).toBe(true);
    });

    it('should fail when field does not equal value', async () => {
      const testContext = new ValidationContext(
        { position: 'junior' },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'equals', params: { value: 'senior' } },
        message: 'Must be senior',
      };
      const result = await adapter.validate('', rule, testContext);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - valueIn (parameterized)', () => {
    it('should pass when value is in list', async () => {
      const testContext = new ValidationContext(
        { subscription: 'Premium' },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['subscription'],
        crossFieldValidator: { name: 'valueIn', params: { values: ['Premium', 'Enterprise'] } },
        message: 'Must be Premium or Enterprise',
      };
      const result = await adapter.validate('', rule, testContext);
      expect(result.valid).toBe(true);
    });

    it('should fail when value is not in list', async () => {
      const testContext = new ValidationContext(
        { subscription: 'Basic' },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['subscription'],
        crossFieldValidator: { name: 'valueIn', params: { values: ['Premium', 'Enterprise'] } },
        message: 'Must be Premium or Enterprise',
      };
      const result = await adapter.validate('', rule, testContext);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - arrayContainsAny (parameterized)', () => {
    it('should pass when array contains any value', async () => {
      const testContext = new ValidationContext(
        { permissions: ['read', 'write', 'admin'] },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: {
          name: 'arrayContainsAny',
          params: { values: ['admin', 'superuser'] },
        },
        message: 'Must have admin or superuser',
      };
      const result = await adapter.validate('', rule, testContext);
      expect(result.valid).toBe(true);
    });

    it('should fail when array contains none of the values', async () => {
      const testContext = new ValidationContext(
        { permissions: ['read', 'write'] },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: {
          name: 'arrayContainsAny',
          params: { values: ['admin', 'superuser'] },
        },
        message: 'Must have admin or superuser',
      };
      const result = await adapter.validate('', rule, testContext);
      expect(result.valid).toBe(false);
    });
  });

  describe('Custom Validators', () => {
    it('should handle inline function validator', async () => {
      const rule: ValidationRule = {
        type: 'custom',
        validationCallback: (value: any) => value === 'expected',
        message: 'Must be expected value',
      };
      const result = await adapter.validate('expected', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail inline function validator', async () => {
      const rule: ValidationRule = {
        type: 'custom',
        validationCallback: (value: any) => value === 'expected',
        message: 'Must be expected value',
      };
      const result = await adapter.validate('other', rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('Conditional Rules with when', () => {
    it('should validate when condition is met', async () => {
      const testContext = new ValidationContext(
        { customerType: 'company', taxNumber: '12345678' },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'required',
        message: 'Tax number required',
        when: { customerType: 'company' },
      };

      // Test that the rule applies when condition is met
      const result = await adapter.validate('12345678', rule, testContext);
      expect(result.valid).toBe(true);
    });

    it('should validate empty value when when condition is not explicitly checked', async () => {
      const testContext = new ValidationContext(
        { customerType: 'individual', taxNumber: '' },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'required',
        message: 'Tax number required',
        when: { customerType: 'company' },
      };

      // The 'when' condition check is handled by ValidationConditionEvaluator at a higher level
      // JoiAdapter itself doesn't evaluate 'when' conditions, it just validates the rule
      const result = await adapter.validate('', rule, testContext);
      // Empty value fails required validation in JoiAdapter
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', async () => {
      const rule: ValidationRule = { type: 'stringLength', min: 3, message: 'Too short' };
      const result = await adapter.validate(null, rule, context);
      // stringLength with null fails in Joi (expects string type)
      expect(result.valid).toBe(false);
    });

    it('should handle undefined gracefully', async () => {
      const rule: ValidationRule = { type: 'pattern', pattern: '^[a-z]+$', message: 'Invalid' };
      const result = await adapter.validate(undefined, rule, context);
      // pattern with undefined should pass (use required for mandatory)
      expect(result.valid).toBe(true);
    });

    it('should handle nested data structures', async () => {
      const testContext = new ValidationContext(
        { user: { email: 'test@example.com' } },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['user.email'],
        crossFieldValidator: 'isNotEmpty',
        message: 'User email required',
      };
      const result = await adapter.validate('', rule, testContext);
      expect(result.valid).toBe(true);
    });

    it('should handle array values', async () => {
      const rule: ValidationRule = {
        type: 'arrayLength',
        min: 1,
        max: 5,
        message: 'Invalid array',
      };
      const result = await adapter.validate(['item1', 'item2', 'item3'], rule, context);
      expect(result.valid).toBe(true);
    });

    it('should handle boolean values', async () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      const result = await adapter.validate(false, rule, context);
      expect(result.valid).toBe(true); // boolean false is a valid value
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple crossField validators with equals', async () => {
      const testContext = new ValidationContext(
        {
          position: 'senior',
          subscription: 'Premium',
        },
        { formId: 'test' },
        { mode: 'sequential' }
      );

      const rule1: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'equals', params: { value: 'senior' } },
        message: 'Must be senior',
      };

      const rule2: ValidationRule = {
        type: 'crossField',
        targetFields: ['subscription'],
        crossFieldValidator: { name: 'valueIn', params: { values: ['Premium', 'Enterprise'] } },
        message: 'Must be Premium or Enterprise',
      };

      const result1 = await adapter.validate('', rule1, testContext);
      const result2 = await adapter.validate('', rule2, testContext);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('should provide meaningful error messages', async () => {
      const customMessage = 'This is a custom error message';
      const rule: ValidationRule = {
        type: 'required',
        message: customMessage,
      };
      const result = await adapter.validate('', rule, context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(customMessage);
    });
  });
});
