/**
 * JoiAdapter Tests
 */

import { JoiAdapter } from '../adapters/JoiAdapter';
import { ValidationContext } from '../core/ValidationContext';
import { CallbackRegistry } from '../core/CallbackRegistry';
import { FormConfig, ValidationRule } from '../types';

describe('JoiAdapter', () => {
  let adapter: JoiAdapter;
  let context: ValidationContext;
  let registry: CallbackRegistry;

  beforeEach(() => {
    registry = new CallbackRegistry();
    adapter = new JoiAdapter(registry);

    const formData = {
      firstName: 'John',
      email: '[email protected]',
      age: 25,
      password: 'secret123',
      confirmPassword: 'secret123',
    };

    const formConfig: FormConfig = {
      formId: 'test-form',
    };

    context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
  });

  describe('Required Rule', () => {
    it('should validate non-empty value', async () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      const result = await adapter.validate('test', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for empty string', async () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      const result = await adapter.validate('', rule, context);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for null', async () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      const result = await adapter.validate(null, rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('StringLength Rule', () => {
    it('should validate string within range', async () => {
      const rule: ValidationRule = {
        type: 'stringLength',
        min: 3,
        max: 10,
        message: 'Invalid length',
      };

      const result = await adapter.validate('hello', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for string too short', async () => {
      const rule: ValidationRule = {
        type: 'stringLength',
        min: 5,
        message: 'Too short',
      };

      const result = await adapter.validate('hi', rule, context);
      expect(result.valid).toBe(false);
    });

    it('should fail for string too long', async () => {
      const rule: ValidationRule = {
        type: 'stringLength',
        max: 5,
        message: 'Too long',
      };

      const result = await adapter.validate('toolongstring', rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('Range Rule', () => {
    it('should validate number within range', async () => {
      const rule: ValidationRule = {
        type: 'range',
        min: 18,
        max: 100,
        message: 'Invalid range',
      };

      const result = await adapter.validate(25, rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for number below minimum', async () => {
      const rule: ValidationRule = {
        type: 'range',
        min: 18,
        message: 'Too low',
      };

      const result = await adapter.validate(15, rule, context);
      expect(result.valid).toBe(false);
    });

    it('should fail for number above maximum', async () => {
      const rule: ValidationRule = {
        type: 'range',
        max: 100,
        message: 'Too high',
      };

      const result = await adapter.validate(150, rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('ArrayLength Rule', () => {
    it('should validate array within range', async () => {
      const rule: ValidationRule = {
        type: 'arrayLength',
        min: 2,
        max: 5,
        message: 'Invalid array length',
      };

      const result = await adapter.validate([1, 2, 3], rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for array below minimum', async () => {
      const rule: ValidationRule = {
        type: 'arrayLength',
        min: 3,
        message: 'Too few items',
      };

      const result = await adapter.validate([1], rule, context);
      expect(result.valid).toBe(false);
    });

    it('should fail for array above maximum', async () => {
      const rule: ValidationRule = {
        type: 'arrayLength',
        max: 3,
        message: 'Too many items',
      };

      const result = await adapter.validate([1, 2, 3, 4, 5], rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('Pattern Rule', () => {
    it('should validate matching pattern', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: /^[A-Z]{3}-\d{3}$/,
        message: 'Invalid format',
      };

      const result = await adapter.validate('ABC-123', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for non-matching pattern', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: /^[A-Z]{3}-\d{3}$/,
        message: 'Invalid format',
      };

      const result = await adapter.validate('invalid', rule, context);
      expect(result.valid).toBe(false);
    });

    it('should handle string pattern', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: '^[0-9]+$',
        message: 'Must be numeric',
      };

      const result = await adapter.validate('12345', rule, context);
      expect(result.valid).toBe(true);
    });
  });

  describe('Numeric Rule', () => {
    it('should validate number', async () => {
      const rule: ValidationRule = {
        type: 'numeric',
        message: 'Must be a number',
      };

      const result = await adapter.validate(42, rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for non-number', async () => {
      const rule: ValidationRule = {
        type: 'numeric',
        message: 'Must be a number',
      };

      const result = await adapter.validate('not a number', rule, context);
      expect(result.valid).toBe(false);
    });
  });

  describe('Compare Rule', () => {
    it('should validate equal values', async () => {
      const rule: ValidationRule = {
        type: 'compare',
        comparisonTarget: 'password',
        comparisonType: '==',
        message: 'Passwords must match',
      };

      const result = await adapter.validate('secret123', rule, context);
      expect(result.valid).toBe(true);
    });

    it('should fail for non-equal values', async () => {
      const rule: ValidationRule = {
        type: 'compare',
        comparisonTarget: 'password',
        comparisonType: '==',
        message: 'Passwords must match',
      };

      const result = await adapter.validate('different', rule, context);
      expect(result.valid).toBe(false);
    });

    it('should validate greater than', async () => {
      const rule: ValidationRule = {
        type: 'compare',
        comparisonTarget: 'age',
        comparisonType: '>',
        message: 'Must be greater',
      };

      const result = await adapter.validate(30, rule, context);
      expect(result.valid).toBe(true);
    });

    it('should validate less than', async () => {
      const rule: ValidationRule = {
        type: 'compare',
        comparisonTarget: 'age',
        comparisonType: '<',
        message: 'Must be less',
      };

      const result = await adapter.validate(20, rule, context);
      expect(result.valid).toBe(true);
    });
  });

  describe('Custom Rule', () => {
    it('should validate with custom function', async () => {
      const customValidator = jest.fn().mockResolvedValue(true);

      const rule: ValidationRule = {
        type: 'custom',
        validationCallback: customValidator,
        message: 'Custom validation failed',
      };

      const result = await adapter.validate('test', rule, context);
      expect(result.valid).toBe(true);
      expect(customValidator).toHaveBeenCalledWith('test', context);
    });
  });

  describe('validateRules', () => {
    it('should validate multiple rules', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'Required' },
        { type: 'stringLength', min: 3, max: 10, message: 'Invalid length' },
      ];

      const result = await adapter.validateRules('hello', rules, context);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all errors', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'Required' },
        { type: 'stringLength', min: 10, message: 'Too short' },
      ];

      const result = await adapter.validateRules('hi', rules, context);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Schema Cache (OPTIMIZATION)', () => {
    it('should cache schema for static rules', async () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      // First call - creates schema
      await adapter.validate('test', rule, context);
      const sizeAfterFirst = adapter.getSchemaCacheSize();

      // Second call - should use cached schema
      await adapter.validate('test2', rule, context);
      const sizeAfterSecond = adapter.getSchemaCacheSize();

      // Cache size should be 1 (same rule was used)
      expect(sizeAfterFirst).toBe(1);
      expect(sizeAfterSecond).toBe(1);
    });

    it('should create different cache entries for different rules', async () => {
      const rule1: ValidationRule = {
        type: 'stringLength',
        min: 5,
        message: 'Min 5 chars',
      };
      const rule2: ValidationRule = {
        type: 'stringLength',
        min: 10,
        message: 'Min 10 chars',
      };

      await adapter.validate('hello', rule1, context);
      await adapter.validate('helloworld', rule2, context);

      // Should have 2 cache entries (different min values)
      expect(adapter.getSchemaCacheSize()).toBe(2);
    });

    it('should not cache context-dependent rules', async () => {
      const rule: ValidationRule = {
        type: 'compare',
        comparisonTarget: 'password',
        comparisonType: '==',
        message: 'Must match',
      };

      adapter.clearSchemaCache();
      await adapter.validate('secret123', rule, context);

      // Compare rules are context-dependent and should not be cached
      expect(adapter.getSchemaCacheSize()).toBe(0);
    });

    it('should clear cache when clearSchemaCache() is called', async () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Required',
      };

      await adapter.validate('test', rule, context);
      expect(adapter.getSchemaCacheSize()).toBeGreaterThan(0);

      adapter.clearSchemaCache();
      expect(adapter.getSchemaCacheSize()).toBe(0);
    });

    it('should cache email rule', async () => {
      const rule: ValidationRule = {
        type: 'email',
        message: 'Invalid email',
      };

      adapter.clearSchemaCache();
      await adapter.validate('test@example.com', rule, context);
      await adapter.validate('another@example.com', rule, context);

      // Should be cached (same rule used twice)
      expect(adapter.getSchemaCacheSize()).toBe(1);
    });

    it('should cache range rule with same params', async () => {
      const rule: ValidationRule = {
        type: 'range',
        min: 0,
        max: 100,
        message: 'Must be 0-100',
      };

      adapter.clearSchemaCache();
      await adapter.validate(50, rule, context);
      await adapter.validate(75, rule, context);

      expect(adapter.getSchemaCacheSize()).toBe(1);
    });

    it('should cache pattern rule', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: '^[A-Z]+$',
        message: 'Must be uppercase',
      };

      adapter.clearSchemaCache();
      await adapter.validate('ABC', rule, context);
      await adapter.validate('XYZ', rule, context);

      expect(adapter.getSchemaCacheSize()).toBe(1);
    });

    it('should distinguish rules with different messages', async () => {
      const rule1: ValidationRule = {
        type: 'required',
        message: 'First message',
      };
      const rule2: ValidationRule = {
        type: 'required',
        message: 'Second message',
      };

      adapter.clearSchemaCache();
      await adapter.validate('test', rule1, context);
      await adapter.validate('test', rule2, context);

      // Different messages = different cache entries
      expect(adapter.getSchemaCacheSize()).toBe(2);
    });
  });
});
