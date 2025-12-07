/**
 * Conditional Required Validation Tests
 *
 * Tests for the ValidationRule.when clause which enables
 * conditional activation of validation rules based on other field values.
 *
 * Migrated from: formfiller-backend/src/__tests__/integration/conditional-required-validation.test.ts
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('Conditional Required Validation', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SIMPLE WHEN - Boolean Field Condition
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Simple When - Checkbox Condition', () => {
    const checkboxWhenConfig: FormConfig = {
      formId: 'checkbox-when-form',
      items: [
        {
          type: 'boolean',
          name: 'has_discount',
        },
        {
          type: 'text',
          name: 'discount_code',
          validationRules: [
            {
              type: 'required',
              message: 'Discount code is required when checkbox is checked',
              when: { has_discount: true },
            },
            {
              type: 'pattern',
              pattern: '^[A-Z0-9]{6,12}$',
              message: 'Code must be 6-12 uppercase alphanumeric',
              when: { has_discount: true },
            },
          ],
        },
      ],
    };

    it('should PASS when checkbox checked and valid code provided', async () => {
      const formData = {
        has_discount: true,
        discount_code: 'SAVE2024',
      };

      const result = await validator.validate(formData, checkboxWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when checkbox checked but code empty', async () => {
      const formData = {
        has_discount: true,
        discount_code: '',
      };

      const result = await validator.validate(formData, checkboxWhenConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'discount_code',
        })
      );
    });

    it('should PASS when checkbox unchecked (validation skipped)', async () => {
      const formData = {
        has_discount: false,
        discount_code: '', // Empty is OK when checkbox unchecked
      };

      const result = await validator.validate(formData, checkboxWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should PASS when checkbox unchecked even with invalid format', async () => {
      const formData = {
        has_discount: false,
        discount_code: 'invalid', // Invalid format but validation skipped
      };

      const result = await validator.validate(formData, checkboxWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DROPDOWN VALUE WHEN - Single Value Match
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Dropdown When - Single Value', () => {
    const dropdownWhenConfig: FormConfig = {
      formId: 'dropdown-when-form',
      items: [
        {
          type: 'dropdown',
          name: 'invoice_type',
          validationRules: [{ type: 'required', message: 'Invoice type is required' }],
        },
        {
          type: 'text',
          name: 'tax_number',
          validationRules: [
            {
              type: 'required',
              message: 'Tax number is required for company invoices',
              when: { invoice_type: 'company' },
            },
            {
              type: 'pattern',
              pattern: '^[0-9]{8}-[0-9]-[0-9]{2}$',
              message: 'Format: 12345678-1-23',
              when: { invoice_type: 'company' },
            },
          ],
        },
      ],
    };

    it('should require tax_number when invoice_type is company', async () => {
      const formData = {
        invoice_type: 'company',
        tax_number: '',
      };

      const result = await validator.validate(formData, dropdownWhenConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'tax_number',
        })
      );
    });

    it('should PASS for company with valid tax_number', async () => {
      const formData = {
        invoice_type: 'company',
        tax_number: '12345678-1-23',
      };

      const result = await validator.validate(formData, dropdownWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should NOT require tax_number for personal invoice', async () => {
      const formData = {
        invoice_type: 'personal',
        tax_number: '',
      };

      const result = await validator.validate(formData, dropdownWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DROPDOWN VALUE WHEN - Array (Multiple Values)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Dropdown When - Array of Values (Implicit In)', () => {
    const arrayWhenConfig: FormConfig = {
      formId: 'array-when-form',
      items: [
        {
          type: 'dropdown',
          name: 'invoice_type',
        },
        {
          type: 'text',
          name: 'business_name',
          validationRules: [
            {
              type: 'required',
              message: 'Business name required for company/self-employed',
              when: { invoice_type: ['company', 'self_employed'] },
            },
          ],
        },
      ],
    };

    it('should require field for company (first in array)', async () => {
      const formData = {
        invoice_type: 'company',
        business_name: '',
      };

      const result = await validator.validate(formData, arrayWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should require field for self_employed (second in array)', async () => {
      const formData = {
        invoice_type: 'self_employed',
        business_name: '',
      };

      const result = await validator.validate(formData, arrayWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should NOT require field for personal (not in array)', async () => {
      const formData = {
        invoice_type: 'personal',
        business_name: '',
      };

      const result = await validator.validate(formData, arrayWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPLICIT OPERATOR WHEN - Comparison Operators
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Explicit Operator When - Numeric Comparisons', () => {
    const operatorWhenConfig: FormConfig = {
      formId: 'operator-when-form',
      items: [
        {
          type: 'number',
          name: 'order_amount',
          validationRules: [{ type: 'required', message: 'Amount is required' }],
        },
        {
          type: 'number',
          name: 'installment_months',
          validationRules: [
            {
              type: 'required',
              message: 'Installment plan required for orders >= 50000',
              when: { order_amount: ['>=', 50000] },
            },
            {
              type: 'range',
              min: 3,
              max: 24,
              message: '3-24 months',
              when: { order_amount: ['>=', 50000] },
            },
          ],
        },
      ],
    };

    it('should require installment when amount >= 50000', async () => {
      const formData = {
        order_amount: 100000,
        installment_months: null,
      };

      const result = await validator.validate(formData, operatorWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should PASS when amount >= 50000 and valid installment', async () => {
      const formData = {
        order_amount: 100000,
        installment_months: 12,
      };

      const result = await validator.validate(formData, operatorWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should NOT require installment when amount < 50000', async () => {
      const formData = {
        order_amount: 30000,
        installment_months: null,
      };

      const result = await validator.validate(formData, operatorWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should handle boundary value (exactly 50000)', async () => {
      const formData = {
        order_amount: 50000,
        installment_months: null,
      };

      const result = await validator.validate(formData, operatorWhenConfig);

      // >= means 50000 triggers the rule
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AND WHEN - Multiple Conditions Must Be True
  // ═══════════════════════════════════════════════════════════════════════════

  describe('AND When - Multiple Conditions', () => {
    const andWhenConfig: FormConfig = {
      formId: 'and-when-form',
      items: [
        {
          type: 'number',
          name: 'order_amount',
        },
        {
          type: 'boolean',
          name: 'wants_installment',
        },
        {
          type: 'text',
          name: 'guarantor_name',
          validationRules: [
            {
              type: 'required',
              message: 'Guarantor required for large installments',
              when: {
                and: [{ order_amount: ['>=', 100000] }, { wants_installment: true }],
              },
            },
          ],
        },
      ],
    };

    it('should require guarantor when BOTH conditions are true', async () => {
      const formData = {
        order_amount: 150000,
        wants_installment: true,
        guarantor_name: '',
      };

      const result = await validator.validate(formData, andWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should NOT require guarantor when amount is low', async () => {
      const formData = {
        order_amount: 50000,
        wants_installment: true,
        guarantor_name: '',
      };

      const result = await validator.validate(formData, andWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should NOT require guarantor when not wanting installment', async () => {
      const formData = {
        order_amount: 150000,
        wants_installment: false,
        guarantor_name: '',
      };

      const result = await validator.validate(formData, andWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OR WHEN - At Least One Condition Must Be True
  // ═══════════════════════════════════════════════════════════════════════════

  describe('OR When - Alternative Conditions', () => {
    const orWhenConfig: FormConfig = {
      formId: 'or-when-form',
      items: [
        {
          type: 'boolean',
          name: 'is_vip',
        },
        {
          type: 'dropdown',
          name: 'delivery_type',
        },
        {
          type: 'text',
          name: 'contact_phone',
          validationRules: [
            {
              type: 'required',
              message: 'Phone required for VIP or urgent delivery',
              when: {
                or: [
                  { is_vip: true },
                  { delivery_type: 'express' },
                  { delivery_type: 'super_urgent' },
                ],
              },
            },
          ],
        },
      ],
    };

    it('should require phone for VIP customer', async () => {
      const formData = {
        is_vip: true,
        delivery_type: 'standard',
        contact_phone: '',
      };

      const result = await validator.validate(formData, orWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should require phone for express delivery', async () => {
      const formData = {
        is_vip: false,
        delivery_type: 'express',
        contact_phone: '',
      };

      const result = await validator.validate(formData, orWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should require phone for super_urgent delivery', async () => {
      const formData = {
        is_vip: false,
        delivery_type: 'super_urgent',
        contact_phone: '',
      };

      const result = await validator.validate(formData, orWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should NOT require phone for standard non-VIP order', async () => {
      const formData = {
        is_vip: false,
        delivery_type: 'standard',
        contact_phone: '',
      };

      const result = await validator.validate(formData, orWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLEX NESTED WHEN - AND + OR Combined
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Complex Nested When - AND + OR', () => {
    const complexWhenConfig: FormConfig = {
      formId: 'complex-when-form',
      items: [
        {
          type: 'dropdown',
          name: 'employment_type',
        },
        {
          type: 'boolean',
          name: 'has_cafeteria',
        },
        {
          type: 'boolean',
          name: 'has_company_car',
        },
        {
          type: 'text',
          name: 'manager_approval',
          validationRules: [
            {
              type: 'required',
              message: 'Manager approval required for full-time with benefits',
              when: {
                and: [
                  { employment_type: 'full_time' },
                  {
                    or: [{ has_cafeteria: true }, { has_company_car: true }],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    it('should require approval for full-time with cafeteria', async () => {
      const formData = {
        employment_type: 'full_time',
        has_cafeteria: true,
        has_company_car: false,
        manager_approval: '',
      };

      const result = await validator.validate(formData, complexWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should require approval for full-time with company car', async () => {
      const formData = {
        employment_type: 'full_time',
        has_cafeteria: false,
        has_company_car: true,
        manager_approval: '',
      };

      const result = await validator.validate(formData, complexWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should NOT require approval for full-time without benefits', async () => {
      const formData = {
        employment_type: 'full_time',
        has_cafeteria: false,
        has_company_car: false,
        manager_approval: '',
      };

      const result = await validator.validate(formData, complexWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should NOT require approval for part-time with benefits', async () => {
      const formData = {
        employment_type: 'part_time',
        has_cafeteria: true,
        has_company_car: true,
        manager_approval: '',
      };

      const result = await validator.validate(formData, complexWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should PASS when approval provided', async () => {
      const formData = {
        employment_type: 'full_time',
        has_cafeteria: true,
        has_company_car: true,
        manager_approval: 'Approved by John Doe - 2024-01-15',
      };

      const result = await validator.validate(formData, complexWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WHEN WITH NOT OPERATOR
  // ═══════════════════════════════════════════════════════════════════════════

  describe('When with NOT Operator', () => {
    const notWhenConfig: FormConfig = {
      formId: 'not-when-form',
      items: [
        {
          type: 'dropdown',
          name: 'employment_type',
        },
        {
          type: 'text',
          name: 'hr_approval',
          validationRules: [
            {
              type: 'required',
              message: 'HR approval required for non-interns',
              when: {
                not: { employment_type: 'intern' },
              },
            },
          ],
        },
      ],
    };

    it('should require HR approval for full_time (not intern)', async () => {
      const formData = {
        employment_type: 'full_time',
        hr_approval: '',
      };

      const result = await validator.validate(formData, notWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should NOT require HR approval for intern', async () => {
      const formData = {
        employment_type: 'intern',
        hr_approval: '',
      };

      const result = await validator.validate(formData, notWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WHEN VS VISIBLEIF DIFFERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  describe('When vs visibleIf - Different Purposes', () => {
    const combinedConfig: FormConfig = {
      formId: 'combined-form',
      items: [
        {
          type: 'dropdown',
          name: 'membership',
        },
        {
          type: 'text',
          name: 'premium_feature',
          visibleIf: { membership: ['premium', 'enterprise'] },
          validationRules: [
            {
              type: 'required',
              message: 'Premium feature selection required for premium membership',
              when: { membership: 'premium' },
            },
          ],
        },
      ],
    };

    it('should validate when both visibleIf and when conditions match', async () => {
      const formData = {
        membership: 'premium',
        premium_feature: '',
      };

      const result = await validator.validate(formData, combinedConfig);

      expect(result.valid).toBe(false);
    });

    it('should skip validation for enterprise (visible but when not matched)', async () => {
      const formData = {
        membership: 'enterprise',
        premium_feature: '', // Field visible but validation skipped
      };

      const result = await validator.validate(formData, combinedConfig);

      expect(result.valid).toBe(true);
    });

    it('should skip validation for basic (not visible)', async () => {
      const formData = {
        membership: 'basic',
        premium_feature: '',
      };

      const result = await validator.validate(formData, combinedConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    describe('Undefined condition field', () => {
      const undefinedFieldConfig: FormConfig = {
        formId: 'undefined-field-form',
        items: [
          {
            type: 'text',
            name: 'dependent_field',
            validationRules: [
              {
                type: 'required',
                message: 'Required when trigger is true',
                when: { non_existent_field: true },
              },
            ],
          },
        ],
      };

      it('should handle undefined condition field gracefully', async () => {
        const formData = {
          dependent_field: '',
        };

        const result = await validator.validate(formData, undefinedFieldConfig);

        // Should not crash, condition not met since field doesn't exist
        expect(result).toBeDefined();
      });
    });

    describe('Null condition value', () => {
      const nullValueConfig: FormConfig = {
        formId: 'null-value-form',
        items: [
          {
            type: 'text',
            name: 'trigger_field',
          },
          {
            type: 'text',
            name: 'dependent_field',
            validationRules: [
              {
                type: 'required',
                message: 'Required',
                when: { trigger_field: 'specific_value' },
              },
            ],
          },
        ],
      };

      it('should handle null value in condition field', async () => {
        const formData = {
          trigger_field: null,
          dependent_field: '',
        };

        const result = await validator.validate(formData, nullValueConfig);

        // Condition not met (null != 'specific_value')
        expect(result.valid).toBe(true);
      });
    });

    describe('Multiple rules with different when conditions', () => {
      const multipleWhenConfig: FormConfig = {
        formId: 'multiple-when-form',
        items: [
          {
            type: 'dropdown',
            name: 'doc_type',
          },
          {
            type: 'text',
            name: 'doc_number',
            validationRules: [
              { type: 'required', message: 'Document number required' },
              {
                type: 'pattern',
                pattern: '^[A-Z]{2}[0-9]{6}$',
                message: 'Passport: 2 letters + 6 digits',
                when: { doc_type: 'passport' },
              },
              {
                type: 'pattern',
                pattern: '^[0-9]{8}$',
                message: 'ID Card: 8 digits',
                when: { doc_type: 'id_card' },
              },
              {
                type: 'pattern',
                pattern: '^[A-Z]{2}[0-9]{6}[A-Z]$',
                message: 'License: 2 letters + 6 digits + 1 letter',
                when: { doc_type: 'license' },
              },
            ],
          },
        ],
      };

      it('should apply passport pattern for passport', async () => {
        const formData = {
          doc_type: 'passport',
          doc_number: 'AB123456',
        };

        const result = await validator.validate(formData, multipleWhenConfig);

        expect(result.valid).toBe(true);
      });

      it('should apply id_card pattern for id_card', async () => {
        const formData = {
          doc_type: 'id_card',
          doc_number: '12345678',
        };

        const result = await validator.validate(formData, multipleWhenConfig);

        expect(result.valid).toBe(true);
      });

      it('should FAIL when passport format used for id_card', async () => {
        const formData = {
          doc_type: 'id_card',
          doc_number: 'AB123456', // Wrong format for id_card
        };

        const result = await validator.validate(formData, multipleWhenConfig);

        expect(result.valid).toBe(false);
      });
    });
  });
});
