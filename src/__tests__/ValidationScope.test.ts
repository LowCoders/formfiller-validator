/**
 * Validation Scope Tests
 *
 * Tests to ensure validation only applies to appropriate fields:
 * - Info/button/empty fields are NOT validated
 * - Fields without validationRules are NOT validated
 * - Invisible fields (visibleIf: false) are skipped
 * - Disabled fields (disabledIf: true) are skipped
 * - Readonly fields (readonlyIf: true) ARE validated (security!)
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('Validation Scope', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('Non-Data Fields (NOT Validated)', () => {
    it('should NOT validate info fields - form should be valid', async () => {
      const formData = {};

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'info',
            name: 'infoBlock',
            text: 'This is informational only',
            variant: 'info',
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should NOT validate button fields - form should be valid', async () => {
      const formData = {};

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'button',
            name: 'submitButton',
            buttonOptions: {
              text: 'Submit',
              type: 'normal',
            },
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should NOT validate empty (spacer) fields - form should be valid', async () => {
      const formData = {};

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'empty',
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Fields Without ValidationRules (NOT Validated)', () => {
    it('should pass validation for text field without validationRules', async () => {
      const formData = {
        textField: '', // Empty but no rules, so valid
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'textField',
            // No validationRules
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should ONLY fail validation for fields with validationRules that fail', async () => {
      const formData = {
        field1: '', // Has rules → validated → fails
        field2: '', // No rules → not validated → OK
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'field1',
            validationRules: [{ type: 'required', message: 'Required' }],
          },
          {
            type: 'text',
            name: 'field2',
            // No validationRules
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(false); // field1 failed
      // Only field1 should have errors
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('field1');
    });
  });

  describe('Invisible Fields (visibleIf: false)', () => {
    it('should skip validation for invisible fields', async () => {
      const formData = {
        customerType: 'individual',
        taxNumber: '', // Invisible, so validation skipped
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'taxNumber',
            visibleIf: { customerType: 'company' }, // False → invisible
            validationRules: [{ type: 'required', message: 'Tax number required' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['taxNumber']?.skipped).toBe(true);
      expect(result.fieldResults?.['taxNumber']?.skipReason).toBe('Field is not visible');
    });

    it('should validate when field becomes visible', async () => {
      const formData = {
        customerType: 'company',
        taxNumber: '12345678', // Visible → validated
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'taxNumber',
            visibleIf: { customerType: 'company' }, // True → visible
            validationRules: [{ type: 'required', message: 'Tax number required' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // Field is visible and has valid value → validation passes
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Field should NOT be skipped (either skipped is false or undefined)
      expect(result.fieldResults?.['taxNumber']?.skipped).toBeFalsy();
    });
  });

  describe('Disabled Fields (disabledIf: true)', () => {
    it('should skip validation for disabled fields', async () => {
      const formData = {
        status: 'readonly',
        notes: '', // Disabled, so validation skipped
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'status',
          },
          {
            type: 'text',
            name: 'notes',
            disabledIf: { status: 'readonly' }, // True → disabled
            validationRules: [{ type: 'required', message: 'Notes required' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['notes']?.skipped).toBe(true);
      expect(result.fieldResults?.['notes']?.skipReason).toBe('Field is disabled');
    });
  });

  describe('⚠️ SECURITY: Readonly Fields (readonlyIf: true) MUST BE Validated', () => {
    it('should VALIDATE readonly fields (security requirement)', async () => {
      const formData = {
        isLocked: true,
        amount: '', // Readonly but MUST be validated!
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'checkbox',
            name: 'isLocked',
          },
          {
            type: 'number',
            name: 'amount',
            readonlyIf: { isLocked: true }, // True → readonly
            validationRules: [{ type: 'required', message: 'Amount required' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // ⚠️ CRITICAL: Readonly fields MUST be validated!
      expect(result.valid).toBe(false); // Validation runs → fails
      expect(result.fieldResults?.['amount']?.valid).toBe(false);
      expect(result.fieldResults?.['amount']?.skipped).toBeFalsy(); // NOT skipped!
    });

    it('should validate readonly field with valid data', async () => {
      const formData = {
        isLocked: true,
        amount: 1000, // Readonly AND valid
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'checkbox',
            name: 'isLocked',
          },
          {
            type: 'number',
            name: 'amount',
            readonlyIf: { isLocked: true }, // True → readonly
            validationRules: [
              { type: 'required', message: 'Amount required' },
              { type: 'range', min: 0, max: 10000, message: 'Invalid range' },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['amount']?.valid).toBe(true);
      expect(result.fieldResults?.['amount']?.skipped).toBeFalsy(); // NOT skipped!
    });
  });
});
