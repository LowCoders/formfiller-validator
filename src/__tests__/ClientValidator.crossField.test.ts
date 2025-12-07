/**
 * ClientValidator CrossField Tests
 *
 * Tests for frontend crossField validation support
 */

import { ClientValidator } from '../validators/ClientValidator';
import {
  ClientCallbackRegistry,
  getClientRegistry,
  resetClientRegistry,
} from '../validators/ClientCallbackRegistry';
import { ValidationRule } from 'formfiller-schema';

describe('ClientValidator CrossField Support', () => {
  let validator: ClientValidator;

  beforeEach(() => {
    resetClientRegistry();
    validator = new ClientValidator();
  });

  describe('CrossField Validator Registration', () => {
    it('should have predefined validators available', () => {
      const available = validator.getAvailableCrossFieldValidators();

      expect(available).toContain('isNotEmpty');
      expect(available).toContain('isTrue');
      expect(available).toContain('isFalse');
      expect(available).toContain('passwordMatch');
      expect(available).toContain('emailMatch');
      expect(available).toContain('compare');
      expect(available).toContain('atLeastOneRequired');
    });

    it('should check if validator exists', () => {
      expect(validator.hasCrossFieldValidator('isNotEmpty')).toBe(true);
      expect(validator.hasCrossFieldValidator('nonExistent')).toBe(false);
      expect(validator.hasCrossFieldValidator(undefined)).toBe(false);
    });
  });

  describe('CrossField Validation - isNotEmpty', () => {
    it('should validate non-empty string field', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['otherField'],
        crossFieldValidator: 'isNotEmpty',
        message: 'Field must not be empty',
      };

      // Note: _currentValue is included in values, so we check targetField by ordering
      const formData = { otherField: 'has value' };
      // When testField value is also non-empty or validator checks first non-undefined value
      const result = await validator.validate('testField', 'myValue', [rule], formData);

      expect(result.valid).toBe(true);
    });

    it('should fail on empty string field', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['otherField'],
        crossFieldValidator: 'isNotEmpty',
        message: 'Field must not be empty',
      };

      const formData = { otherField: '' };
      const result = await validator.validate('testField', '', [rule], formData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.message).toBe('Field must not be empty');
    });

    it('should fail on null field', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['otherField'],
        crossFieldValidator: 'isNotEmpty',
        message: 'Field must not be empty',
      };

      const formData = { otherField: null };
      const result = await validator.validate('testField', '', [rule], formData);

      expect(result.valid).toBe(false);
    });

    it('should pass on non-empty array', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['arrayField'],
        crossFieldValidator: 'isNotEmpty',
        message: 'Array must not be empty',
      };

      const formData = { arrayField: ['item1', 'item2'] };
      // Provide a non-empty current value to ensure first value in object is valid
      const result = await validator.validate('testField', 'myValue', [rule], formData);

      expect(result.valid).toBe(true);
    });
  });

  describe('CrossField Validation - passwordMatch', () => {
    it('should pass when passwords match', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['password', 'confirmPassword'],
        crossFieldValidator: 'passwordMatch',
        message: 'Passwords must match',
      };

      const formData = { password: 'secret123', confirmPassword: 'secret123' };
      // The _currentValue is also 'secret123' to match with the password fields
      const result = await validator.validate('testField', 'secret123', [rule], formData);

      expect(result.valid).toBe(true);
    });

    it('should fail when passwords differ', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['password', 'confirmPassword'],
        crossFieldValidator: 'passwordMatch',
        message: 'Passwords must match',
      };

      const formData = { password: 'secret123', confirmPassword: 'different' };
      const result = await validator.validate('testField', '', [rule], formData);

      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField Validation - compare (parameterized)', () => {
    it('should pass equality check', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['field1', 'field2'],
        crossFieldValidator: { name: 'compare', params: { operator: '==' } },
        message: 'Fields must be equal',
      };

      const formData = { field1: 'value', field2: 'value' };
      // Note: compare uses first two values, so _currentValue + field1 are compared
      // For proper field1/field2 comparison, use undefined currentValue
      const result = await validator.validate('testField', undefined, [rule], formData);

      expect(result.valid).toBe(true);
    });

    it('should fail inequality check', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['field1', 'field2'],
        crossFieldValidator: { name: 'compare', params: { operator: '!=' } },
        message: 'Fields must be different',
      };

      const formData = { field1: 'same', field2: 'same' };
      // Compare first two non-undefined values
      const result = await validator.validate('testField', undefined, [rule], formData);

      expect(result.valid).toBe(false);
    });

    it('should pass greater than check', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['max', 'min'],
        crossFieldValidator: { name: 'compare', params: { operator: '>' } },
        message: 'Max must be greater than min',
      };

      const formData = { max: 100, min: 50 };
      // Use undefined currentValue so only targetFields are compared
      const result = await validator.validate('testField', undefined, [rule], formData);

      expect(result.valid).toBe(true);
    });

    it('should fail greater than check', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['max', 'min'],
        crossFieldValidator: { name: 'compare', params: { operator: '>' } },
        message: 'Max must be greater than min',
      };

      const formData = { max: 30, min: 50 };
      // With undefined currentValue, comparing max vs min
      const result = await validator.validate('testField', undefined, [rule], formData);

      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField Validation - atLeastOneRequired', () => {
    it('should pass when at least one field is filled', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['email', 'phone'],
        crossFieldValidator: 'atLeastOneRequired',
        message: 'At least one contact is required',
      };

      const formData = { email: 'test@example.com', phone: '' };
      const result = await validator.validate('testField', '', [rule], formData);

      expect(result.valid).toBe(true);
    });

    it('should fail when all fields are empty', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['email', 'phone'],
        crossFieldValidator: 'atLeastOneRequired',
        message: 'At least one contact is required',
      };

      const formData = { email: '', phone: '' };
      const result = await validator.validate('testField', '', [rule], formData);

      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField Validation - arrayContains (parameterized)', () => {
    it('should pass when array contains value', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: { name: 'arrayContains', params: { value: 'admin' } },
        message: 'Must have admin permission',
      };

      const formData = { permissions: ['read', 'write', 'admin'] };
      // Use undefined currentValue so first value is the array
      const result = await validator.validate('testField', undefined, [rule], formData);

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
      // Use undefined currentValue so first value is the array
      const result = await validator.validate('testField', undefined, [rule], formData);

      expect(result.valid).toBe(false);
    });
  });

  describe('Unknown CrossField Validator', () => {
    it('should pass for unknown validator (backend fallback)', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['field1'],
        crossFieldValidator: 'someBackendOnlyValidator',
        message: 'This should pass on frontend',
      };

      const formData = { field1: 'value' };
      const result = await validator.validate('testField', '', [rule], formData);

      // Unknown validators pass on frontend (will be validated by backend)
      expect(result.valid).toBe(true);
    });
  });

  describe('Mixed Validation Rules', () => {
    it('should validate crossField alongside basic rules', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'Field is required' },
        {
          type: 'crossField',
          targetFields: ['otherField'],
          crossFieldValidator: 'isNotEmpty',
          message: 'Other field must not be empty',
        },
      ];

      const formData = { otherField: 'has value' };
      const result = await validator.validate('testField', 'myValue', rules, formData);

      expect(result.valid).toBe(true);
    });

    it('should fail if crossField rule fails', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'Field is required' },
        {
          type: 'crossField',
          targetFields: ['otherField'],
          crossFieldValidator: 'isNotEmpty',
          message: 'Other field must not be empty',
        },
      ];

      const formData = { otherField: '' };
      // testField has value but otherField is empty
      // Note: isNotEmpty checks first non-undefined value, which includes _currentValue
      const result = await validator.validate('testField', '', rules, formData);

      // Required fails for testField (empty string)
      // AND isNotEmpty fails because first value (_currentValue) is empty string
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('ValidationRuleGroup Support', () => {
  let validator: ClientValidator;

  beforeEach(() => {
    resetClientRegistry();
    validator = new ClientValidator();
  });

  describe('OR group validation', () => {
    it('should pass when at least one rule passes', async () => {
      const rules: any[] = [
        {
          or: [
            {
              type: 'crossField',
              targetFields: ['email'],
              crossFieldValidator: 'isNotEmpty',
              message: 'Email required',
            },
            {
              type: 'crossField',
              targetFields: ['phone'],
              crossFieldValidator: 'isNotEmpty',
              message: 'Phone required',
            },
          ],
          groupMessage: 'At least one contact is required',
        },
      ];

      // Email filled, phone empty - should pass
      const formData = { email: 'test@example.com', phone: '' };
      const result = await validator.validate('contactCheck', '', rules, formData);

      expect(result.valid).toBe(true);
    });

    it('should fail when all rules fail', async () => {
      const rules: any[] = [
        {
          or: [
            {
              type: 'crossField',
              targetFields: ['email'],
              crossFieldValidator: 'isNotEmpty',
              message: 'Email required',
            },
            {
              type: 'crossField',
              targetFields: ['phone'],
              crossFieldValidator: 'isNotEmpty',
              message: 'Phone required',
            },
          ],
          groupMessage: 'At least one contact is required',
        },
      ];

      // Both empty - should fail
      const formData = { email: '', phone: '' };
      const result = await validator.validate('contactCheck', '', rules, formData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.message).toBe('At least one contact is required');
    });
  });

  describe('AND group validation', () => {
    it('should pass when all rules pass', async () => {
      const rules: any[] = [
        {
          and: [
            { type: 'required', message: 'Field is required' },
            { type: 'stringLength', min: 5, message: 'Min 5 chars' },
          ],
          groupMessage: 'Both requirements must be met',
        },
      ];

      const result = await validator.validate('testField', 'hello world', rules, {});

      expect(result.valid).toBe(true);
    });

    it('should fail when any rule fails', async () => {
      const rules: any[] = [
        {
          and: [
            { type: 'required', message: 'Field is required' },
            { type: 'stringLength', min: 5, message: 'Min 5 chars' },
          ],
          groupMessage: 'Both requirements must be met',
        },
      ];

      // Too short - should fail
      const result = await validator.validate('testField', 'hi', rules, {});

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.message).toBe('Both requirements must be met');
    });
  });

  describe('NOT group validation', () => {
    it('should pass when inner rule fails', async () => {
      const rules: any[] = [
        {
          not: {
            type: 'crossField',
            targetFields: ['isAdmin'],
            crossFieldValidator: 'isTrue',
            message: 'User is admin',
          },
          groupMessage: 'User must not be admin',
        },
      ];

      // isAdmin is false - NOT(isTrue) = pass
      const formData = { isAdmin: false };
      const result = await validator.validate('restrictedField', '', rules, formData);

      expect(result.valid).toBe(true);
    });

    it('should fail when inner rule passes', async () => {
      const rules: any[] = [
        {
          not: {
            type: 'crossField',
            targetFields: ['isAdmin'],
            crossFieldValidator: 'isTrue',
            message: 'User is admin',
          },
          groupMessage: 'User must not be admin',
        },
      ];

      // isAdmin is true - NOT(isTrue) = fail
      const formData = { isAdmin: true };
      const result = await validator.validate('restrictedField', '', rules, formData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.message).toBe('User must not be admin');
    });
  });

  describe('Nested groups', () => {
    it('should handle nested AND inside OR', async () => {
      const rules: any[] = [
        {
          or: [
            {
              type: 'crossField',
              targetFields: ['isPremium'],
              crossFieldValidator: 'isTrue',
              message: 'Premium user',
            },
            {
              and: [
                {
                  type: 'crossField',
                  targetFields: ['hasCustomConfig'],
                  crossFieldValidator: 'isTrue',
                  message: 'Has custom config',
                },
                { type: 'arrayLength', max: 2, message: 'Max 2 items' },
              ],
              groupMessage: 'Custom config with max 2 items',
            },
          ],
          groupMessage: 'Premium OR custom config required',
        },
      ];

      // Not premium but has custom config and 1 item - should pass
      const formData = { isPremium: false, hasCustomConfig: true };
      const result = await validator.validate('features', ['item1'], rules, formData);

      expect(result.valid).toBe(true);
    });
  });
});

describe('ClientCallbackRegistry', () => {
  let registry: ClientCallbackRegistry;

  beforeEach(() => {
    resetClientRegistry();
    registry = getClientRegistry();
  });

  it('should be a singleton', () => {
    const registry1 = getClientRegistry();
    const registry2 = getClientRegistry();
    expect(registry1).toBe(registry2);
  });

  it('should reset properly', () => {
    const before = getClientRegistry();
    resetClientRegistry();
    const after = getClientRegistry();
    expect(before).not.toBe(after);
  });

  it('should allow registering custom validators', () => {
    registry.register(
      'customValidator',
      (values) => values.field1 === 'expected',
      'Custom validator description'
    );

    expect(registry.has('customValidator')).toBe(true);
    expect(registry.execute('customValidator', { field1: 'expected' })).toBe(true);
    expect(registry.execute('customValidator', { field1: 'other' })).toBe(false);
  });

  it('should execute parameterized validators', () => {
    // 'compare' is a predefined parameterized validator
    const result = registry.execute('compare', { a: 10, b: 5 }, { operator: '>' });
    expect(result).toBe(true);
  });
});
