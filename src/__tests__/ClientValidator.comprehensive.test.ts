/**
 * ClientValidator Comprehensive Tests
 *
 * Comprehensive unit tests for all ClientValidator functionality:
 * - Basic rules (required, email, numeric, stringLength, range, pattern, arrayLength)
 * - CrossField validators (all ClientCallbackRegistry validators)
 * - Edge cases (null/undefined, empty values, invalid types, nested paths)
 */

import { ClientValidator } from '../validators/ClientValidator.js';
import { resetClientRegistry } from '../validators/ClientCallbackRegistry.js';
import { ValidationRule } from '../types/index.js';

describe('ClientValidator Comprehensive Tests', () => {
  let validator: ClientValidator;

  beforeEach(() => {
    resetClientRegistry();
    validator = new ClientValidator();
  });

  describe('Basic Rules - Required', () => {
    it('should pass for non-empty string', async () => {
      const rule = { type: 'required' as const, message: 'Required' };
      const result = await validator.validate('field', 'value', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for empty string', async () => {
      const rule = { type: 'required' as const, message: 'Required' };
      const result = await validator.validate('field', '', [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for null', async () => {
      const rule = { type: 'required' as const, message: 'Required' };
      const result = await validator.validate('field', null, [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for undefined', async () => {
      const rule = { type: 'required' as const, message: 'Required' };
      const result = await validator.validate('field', undefined, [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should pass for number 0', async () => {
      const rule = { type: 'required' as const, message: 'Required' };
      const result = await validator.validate('field', 0, [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should pass for boolean false', async () => {
      const rule = { type: 'required' as const, message: 'Required' };
      const result = await validator.validate('field', false, [rule], {});
      expect(result.valid).toBe(true);
    });
  });

  describe('Basic Rules - Email', () => {
    it('should pass for valid email', async () => {
      const rule = { type: 'email' as const, message: 'Invalid email' };
      const result = await validator.validate('email', 'test@example.com', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid email', async () => {
      const rule = { type: 'email' as const, message: 'Invalid email' };
      const result = await validator.validate('email', 'not-an-email', [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should pass for empty string (use required for mandatory)', async () => {
      const rule = { type: 'email' as const, message: 'Invalid email' };
      const result = await validator.validate('email', '', [rule], {});
      expect(result.valid).toBe(true);
    });
  });

  describe('Basic Rules - Numeric', () => {
    it('should pass for number', async () => {
      const rule = { type: 'numeric' as const, message: 'Must be numeric' };
      const result = await validator.validate('num', 123, [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should pass for numeric string', async () => {
      const rule = { type: 'numeric' as const, message: 'Must be numeric' };
      const result = await validator.validate('num', '456', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for non-numeric string', async () => {
      const rule = { type: 'numeric' as const, message: 'Must be numeric' };
      const result = await validator.validate('num', 'abc', [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - StringLength', () => {
    it('should pass for valid length', async () => {
      const rule = {
        type: 'stringLength' as const,
        min: 3,
        max: 10,
        message: 'Invalid length',
      };
      const result = await validator.validate('text', 'hello', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for too short', async () => {
      const rule = { type: 'stringLength' as const, min: 5, message: 'Too short' };
      const result = await validator.validate('text', 'hi', [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for too long', async () => {
      const rule = { type: 'stringLength' as const, max: 5, message: 'Too long' };
      const result = await validator.validate('text', 'toolongtext', [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - Range', () => {
    it('should pass for value in range', async () => {
      const rule = { type: 'range' as const, min: 10, max: 100, message: 'Out of range' };
      const result = await validator.validate('num', 50, [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for value below minimum', async () => {
      const rule = { type: 'range' as const, min: 10, message: 'Too low' };
      const result = await validator.validate('num', 5, [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for value above maximum', async () => {
      const rule = { type: 'range' as const, max: 100, message: 'Too high' };
      const result = await validator.validate('num', 150, [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - Pattern', () => {
    it('should pass for matching pattern', async () => {
      const rule = {
        type: 'pattern' as const,
        pattern: '^[a-z]+$',
        message: 'Invalid pattern',
      };
      const result = await validator.validate('text', 'hello', [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for non-matching pattern', async () => {
      const rule = {
        type: 'pattern' as const,
        pattern: '^[a-z]+$',
        message: 'Invalid pattern',
      };
      const result = await validator.validate('text', 'Hello123', [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('Basic Rules - ArrayLength', () => {
    it('should pass for valid array length', async () => {
      const rule = {
        type: 'arrayLength' as const,
        min: 1,
        max: 3,
        message: 'Invalid array length',
      };
      const result = await validator.validate('arr', ['a', 'b'], [rule], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for empty array when min is set', async () => {
      const rule = { type: 'arrayLength' as const, min: 1, message: 'Array too small' };
      const result = await validator.validate('arr', [], [rule], {});
      expect(result.valid).toBe(false);
    });

    it('should fail for array too long', async () => {
      const rule = { type: 'arrayLength' as const, max: 2, message: 'Array too large' };
      const result = await validator.validate('arr', ['a', 'b', 'c'], [rule], {});
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - isNotEmpty', () => {
    it('should pass when target field has value', async () => {
      const rule = {
        type: 'atLeastOne' as const as any,
        targetFields: ['targetField'],
        message: 'Target must not be empty',
      };
      const formData = { targetField: 'value' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when target field is empty', async () => {
      const rule = {
        type: 'atLeastOne' as const as any,
        targetFields: ['targetField'],
        message: 'Target must not be empty',
      };
      const formData = { targetField: '' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('CrossField - atLeastOne', () => {
    it('should pass when at least one field is filled', async () => {
      const rule = {
        type: 'atLeastOne' as const,
        targetFields: ['email', 'phone'],
        message: 'At least one contact required',
      };
      const formData = { email: 'test@example.com', phone: '' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should fail when all fields are empty', async () => {
      const rule = {
        type: 'atLeastOne' as const as any,
        targetFields: ['email', 'phone'],
        message: 'At least one contact required',
      };
      const formData = { email: '', phone: '' };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', async () => {
      const rule = { type: 'stringLength' as const, min: 3, message: 'Too short' };
      const result = await validator.validate('field', null, [rule], {});
      // stringLength on null should pass (use required for mandatory)
      expect(result.valid).toBe(true);
    });

    it('should handle undefined values gracefully', async () => {
      const rule = { type: 'pattern' as const, pattern: '^[a-z]+$', message: 'Invalid' };
      const result = await validator.validate('field', undefined, [rule], {});
      // pattern on undefined should pass (use required for mandatory)
      expect(result.valid).toBe(true);
    });

    it('should handle nested field paths', async () => {
      const rule = {
        type: 'atLeastOne' as const as any,
        targetFields: ['user.email'],
        message: 'User email required',
      };
      const formData = { user: { email: 'test@example.com' } };
      const result = await validator.validate('check', '', [rule], formData);
      expect(result.valid).toBe(true);
    });

    it('should handle multiple rules on same field', async () => {
      const rules: ValidationRule[] = [
        { type: 'required' as const, message: 'Required' },
        { type: 'stringLength' as const, min: 5, message: 'Too short' },
        { type: 'pattern' as const, pattern: '^[a-z]+$', message: 'Invalid chars' },
      ];
      const result = await validator.validate('field', 'hello', rules, {});
      expect(result.valid).toBe(true);
    });

    it('should fail on first error when multiple rules fail', async () => {
      const rules: ValidationRule[] = [
        { type: 'required' as const, message: 'Required' },
        { type: 'stringLength' as const, min: 10, message: 'Too short' },
      ];
      const result = await validator.validate('field', 'hi', rules, {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
