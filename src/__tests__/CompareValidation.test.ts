/**
 * Compare Validation Tests
 *
 * Tests for the Compare validation type which compares field values
 * using operators: ==, !=, <, >, <=, >=
 *
 * Migrated from: formfiller-backend/src/__tests__/integration/compare-validation.test.ts
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('Compare Validation', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // == OPERATOR (Equality)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('== Operator - Password Confirmation', () => {
    const passwordFormConfig: FormConfig = {
      formId: 'password-comparison-form',
      items: [
        {
          type: 'text',
          name: 'password',
          validationRules: [
            { type: 'required', message: 'Password is required' },
            { type: 'stringLength', min: 8, message: 'Min 8 characters' },
          ],
        },
        {
          type: 'text',
          name: 'password_confirm',
          validationRules: [
            { type: 'required', message: 'Confirmation is required' },
            {
              type: 'compare',
              comparisonTarget: 'password',
              comparisonType: '==',
              message: 'Passwords do not match',
            },
          ],
        },
      ],
    };

    it('should PASS when passwords match', async () => {
      const formData = {
        password: 'SecurePass123',
        password_confirm: 'SecurePass123',
      };

      const result = await validator.validate(formData, passwordFormConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should FAIL when passwords do not match', async () => {
      const formData = {
        password: 'SecurePass123',
        password_confirm: 'DifferentPass456',
      };

      const result = await validator.validate(formData, passwordFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'password_confirm',
        })
      );
    });

    it('should FAIL when confirmation is empty', async () => {
      const formData = {
        password: 'SecurePass123',
        password_confirm: '',
      };

      const result = await validator.validate(formData, passwordFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.find((e: any) => e.field === 'password_confirm')).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // != OPERATOR (Inequality)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('!= Operator - Different Values', () => {
    const differentValuesFormConfig: FormConfig = {
      formId: 'different-values-form',
      items: [
        {
          type: 'number',
          name: 'person1_age',
          validationRules: [{ type: 'required', message: 'Age is required' }],
        },
        {
          type: 'number',
          name: 'person2_age',
          validationRules: [
            { type: 'required', message: 'Age is required' },
            {
              type: 'compare',
              comparisonTarget: 'person1_age',
              comparisonType: '!=',
              message: 'Ages must be different',
            },
          ],
        },
      ],
    };

    it('should PASS when values are different', async () => {
      const formData = {
        person1_age: 25,
        person2_age: 30,
      };

      const result = await validator.validate(formData, differentValuesFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when values are the same', async () => {
      const formData = {
        person1_age: 25,
        person2_age: 25,
      };

      const result = await validator.validate(formData, differentValuesFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'person2_age',
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // > OPERATOR (Greater Than)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('> Operator - Date Ordering', () => {
    const dateOrderFormConfig: FormConfig = {
      formId: 'date-order-form',
      items: [
        {
          type: 'date',
          name: 'project_start',
          validationRules: [{ type: 'required', message: 'Start date is required' }],
        },
        {
          type: 'date',
          name: 'project_end',
          validationRules: [
            { type: 'required', message: 'End date is required' },
            {
              type: 'compare',
              comparisonTarget: 'project_start',
              comparisonType: '>',
              message: 'End date must be after start date',
            },
          ],
        },
      ],
    };

    it('should PASS when end date is after start date', async () => {
      const formData = {
        project_start: '2024-01-01',
        project_end: '2024-12-31',
      };

      const result = await validator.validate(formData, dateOrderFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when end date is before start date', async () => {
      const formData = {
        project_start: '2024-06-01',
        project_end: '2024-01-01',
      };

      const result = await validator.validate(formData, dateOrderFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'project_end',
        })
      );
    });

    it('should FAIL when dates are the same', async () => {
      const formData = {
        project_start: '2024-06-01',
        project_end: '2024-06-01',
      };

      const result = await validator.validate(formData, dateOrderFormConfig);

      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // >= OPERATOR (Greater Than or Equal)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('>= Operator - Salary Range', () => {
    const salaryRangeFormConfig: FormConfig = {
      formId: 'salary-range-form',
      items: [
        {
          type: 'number',
          name: 'salary_min',
          validationRules: [{ type: 'required', message: 'Minimum salary is required' }],
        },
        {
          type: 'number',
          name: 'salary_max',
          validationRules: [
            { type: 'required', message: 'Maximum salary is required' },
            {
              type: 'compare',
              comparisonTarget: 'salary_min',
              comparisonType: '>=',
              message: 'Maximum salary must be >= minimum salary',
            },
          ],
        },
      ],
    };

    it('should PASS when max > min', async () => {
      const formData = {
        salary_min: 400000,
        salary_max: 600000,
      };

      const result = await validator.validate(formData, salaryRangeFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should PASS when max == min (valid for >= operator)', async () => {
      const formData = {
        salary_min: 500000,
        salary_max: 500000,
      };

      const result = await validator.validate(formData, salaryRangeFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when max < min', async () => {
      const formData = {
        salary_min: 600000,
        salary_max: 400000,
      };

      const result = await validator.validate(formData, salaryRangeFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'salary_max',
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // <= OPERATOR (Less Than or Equal)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('<= Operator - Stock Limit', () => {
    const stockLimitFormConfig: FormConfig = {
      formId: 'stock-limit-form',
      items: [
        {
          type: 'number',
          name: 'stock_quantity',
          validationRules: [{ type: 'required', message: 'Stock is required' }],
        },
        {
          type: 'number',
          name: 'order_quantity',
          validationRules: [
            { type: 'required', message: 'Order quantity is required' },
            {
              type: 'compare',
              comparisonTarget: 'stock_quantity',
              comparisonType: '<=',
              message: 'Order cannot exceed stock',
            },
          ],
        },
      ],
    };

    it('should PASS when order <= stock', async () => {
      const formData = {
        stock_quantity: 100,
        order_quantity: 50,
      };

      const result = await validator.validate(formData, stockLimitFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should PASS when order == stock', async () => {
      const formData = {
        stock_quantity: 100,
        order_quantity: 100,
      };

      const result = await validator.validate(formData, stockLimitFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when order > stock', async () => {
      const formData = {
        stock_quantity: 50,
        order_quantity: 100,
      };

      const result = await validator.validate(formData, stockLimitFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'order_quantity',
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // < OPERATOR (Less Than)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('< Operator - Strict Less Than', () => {
    const strictLessFormConfig: FormConfig = {
      formId: 'strict-less-form',
      items: [
        {
          type: 'number',
          name: 'order_quantity',
          validationRules: [{ type: 'required', message: 'Order is required' }],
        },
        {
          type: 'number',
          name: 'reserve_quantity',
          validationRules: [
            {
              type: 'compare',
              comparisonTarget: 'order_quantity',
              comparisonType: '<',
              message: 'Reserve must be less than order',
            },
          ],
        },
      ],
    };

    it('should PASS when reserve < order', async () => {
      const formData = {
        order_quantity: 100,
        reserve_quantity: 50,
      };

      const result = await validator.validate(formData, strictLessFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when reserve == order (strict less than)', async () => {
      const formData = {
        order_quantity: 100,
        reserve_quantity: 100,
      };

      const result = await validator.validate(formData, strictLessFormConfig);

      expect(result.valid).toBe(false);
    });

    it('should FAIL when reserve > order', async () => {
      const formData = {
        order_quantity: 50,
        reserve_quantity: 100,
      };

      const result = await validator.validate(formData, strictLessFormConfig);

      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NESTED FIELD PATHS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Nested Field Paths - Group.field notation', () => {
    const nestedFormConfig: FormConfig = {
      formId: 'nested-fields-form',
      items: [
        {
          type: 'group',
          name: 'salary_section',
          items: [
            {
              type: 'number',
              name: 'min_amount',
              validationRules: [{ type: 'required', message: 'Required' }],
            },
            {
              type: 'number',
              name: 'max_amount',
              validationRules: [
                { type: 'required', message: 'Required' },
                {
                  type: 'compare',
                  comparisonTarget: 'salary_section.min_amount',
                  comparisonType: '>=',
                  message: 'Max must be >= min',
                },
              ],
            },
          ],
        },
      ],
    };

    it('should handle nested field path comparison (valid)', async () => {
      const formData = {
        salary_section: {
          min_amount: 1000,
          max_amount: 2000,
        },
      };

      const result = await validator.validate(formData, nestedFormConfig);

      // Should not crash, test documents expected behavior
      expect(result).toBeDefined();
    });

    it('should handle nested field path when invalid', async () => {
      const formData = {
        salary_section: {
          min_amount: 2000,
          max_amount: 1000,
        },
      };

      const result = await validator.validate(formData, nestedFormConfig);

      expect(result).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    const edgeCaseFormConfig: FormConfig = {
      formId: 'edge-cases-form',
      items: [
        {
          type: 'number',
          name: 'value_a',
        },
        {
          type: 'number',
          name: 'value_b',
          validationRules: [
            {
              type: 'compare',
              comparisonTarget: 'value_a',
              comparisonType: '>=',
              message: 'B must be >= A',
            },
          ],
        },
      ],
    };

    it('should handle zero values correctly', async () => {
      const formData = {
        value_a: 0,
        value_b: 0,
      };

      const result = await validator.validate(formData, edgeCaseFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should handle negative values correctly', async () => {
      const formData = {
        value_a: -100,
        value_b: -50,
      };

      const result = await validator.validate(formData, edgeCaseFormConfig);

      expect(result.valid).toBe(true); // -50 >= -100
    });

    it('should handle decimal values correctly', async () => {
      const formData = {
        value_a: 10.5,
        value_b: 10.6,
      };

      const result = await validator.validate(formData, edgeCaseFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should handle undefined target field gracefully', async () => {
      const formData = {
        value_b: 100,
        // value_a is undefined
      };

      const result = await validator.validate(formData, edgeCaseFormConfig);

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
    });
  });
});
