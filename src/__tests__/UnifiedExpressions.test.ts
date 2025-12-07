/**
 * Unified Expression System Tests
 *
 * Tests for the unified expression system covering:
 * - Simple equality in when clauses
 * - Implicit "in" with arrays
 * - Explicit operators (<, >, <=, >=, ==, !=)
 * - Logical operators (and, or, not)
 * - Combined visibleIf and when conditions
 *
 * Migrated from: formfiller-backend/src/__tests__/integration/validator-unified-expressions.test.ts
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('Unified Expression System', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ValidationRule.when - Simple Equality
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ValidationRule.when - Simple Equality', () => {
    const simpleEqualityConfig: FormConfig = {
      formId: 'simple-equality-form',
      items: [
        {
          type: 'dropdown',
          name: 'employmentStatus',
          validationRules: [{ type: 'required', message: 'Employment status is required' }],
        },
        {
          type: 'text',
          name: 'companyName',
          validationRules: [
            {
              type: 'required',
              when: { employmentStatus: 'employed' },
              message: 'Company name is required for employed persons',
            },
          ],
        },
      ],
    };

    it('should PASS when condition is met (employed + companyName provided)', async () => {
      const formData = {
        employmentStatus: 'employed',
        companyName: 'Acme Corp',
      };

      const result = await validator.validate(formData, simpleEqualityConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should FAIL when condition is met but field empty (employed + no companyName)', async () => {
      const formData = {
        employmentStatus: 'employed',
        companyName: '',
      };

      const result = await validator.validate(formData, simpleEqualityConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'companyName',
        })
      );
    });

    it('should PASS when condition is NOT met (unemployed + no companyName)', async () => {
      const formData = {
        employmentStatus: 'unemployed',
        companyName: '',
      };

      const result = await validator.validate(formData, simpleEqualityConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ValidationRule.when - Implicit "in" (Array)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ValidationRule.when - Implicit "in" (Array)', () => {
    const implicitInConfig: FormConfig = {
      formId: 'implicit-in-form',
      items: [
        {
          type: 'dropdown',
          name: 'userRole',
        },
        {
          type: 'text',
          name: 'adminNotes',
          validationRules: [
            {
              type: 'required',
              when: { userRole: ['admin', 'moderator'] },
              message: 'Admin notes are required for admin/moderator roles',
            },
          ],
        },
      ],
    };

    it('should PASS when condition is met - admin with notes', async () => {
      const formData = {
        userRole: 'admin',
        adminNotes: 'Test admin note',
      };

      const result = await validator.validate(formData, implicitInConfig);

      expect(result.valid).toBe(true);
    });

    it('should PASS when condition is met - moderator with notes', async () => {
      const formData = {
        userRole: 'moderator',
        adminNotes: 'Test moderator note',
      };

      const result = await validator.validate(formData, implicitInConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when condition is met but field empty', async () => {
      const formData = {
        userRole: 'admin',
        // adminNotes is missing (undefined)
      };

      const result = await validator.validate(formData, implicitInConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'adminNotes',
        })
      );
    });

    it('should PASS when condition is NOT met - regular user', async () => {
      const formData = {
        userRole: 'user',
        adminNotes: '',
      };

      const result = await validator.validate(formData, implicitInConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ValidationRule.when - Explicit Operator
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ValidationRule.when - Explicit Operator', () => {
    const explicitOperatorConfig: FormConfig = {
      formId: 'explicit-operator-form',
      items: [
        {
          type: 'number',
          name: 'age',
          validationRules: [
            { type: 'required', message: 'Age is required' },
            { type: 'range', min: 0, max: 150, message: 'Age must be between 0 and 150' },
          ],
        },
        {
          type: 'text',
          name: 'parentalConsent',
          validationRules: [
            {
              type: 'required',
              when: { age: ['<', 18] },
              message: 'Parental consent is required for minors',
            },
          ],
        },
        {
          type: 'text',
          name: 'seniorDiscount',
          validationRules: [
            {
              type: 'required',
              when: { age: ['>=', 65] },
              message: 'Senior discount code is required',
            },
          ],
        },
      ],
    };

    it('should require parentalConsent for age < 18', async () => {
      const formData = {
        age: 15,
        // parentalConsent is missing
      };

      const result = await validator.validate(formData, explicitOperatorConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'parentalConsent',
        })
      );
      // seniorDiscount should NOT be required
      expect(result.errors.find((e: any) => e.field === 'seniorDiscount')).toBeUndefined();
    });

    it('should require seniorDiscount for age >= 65', async () => {
      const formData = {
        age: 70,
        // seniorDiscount is missing
      };

      const result = await validator.validate(formData, explicitOperatorConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'seniorDiscount',
        })
      );
      // parentalConsent should NOT be required
      expect(result.errors.find((e: any) => e.field === 'parentalConsent')).toBeUndefined();
    });

    it('should not require either for age 18-64', async () => {
      const formData = {
        age: 30,
        // Neither parentalConsent nor seniorDiscount should be required
      };

      const result = await validator.validate(formData, explicitOperatorConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ValidationRule.when - Logical Operators (and, or, not)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ValidationRule.when - Logical Operators (and, or, not)', () => {
    const logicalOperatorsConfig: FormConfig = {
      formId: 'logical-operators-form',
      items: [
        {
          type: 'dropdown',
          name: 'country',
        },
        {
          type: 'boolean',
          name: 'isStudent',
        },
        {
          type: 'text',
          name: 'specialCode',
          validationRules: [
            {
              type: 'required',
              when: {
                and: [{ country: ['US', 'CA'] }, { isStudent: true }],
              },
              message: 'Special code is required for US/CA students',
            },
          ],
        },
        {
          type: 'text',
          name: 'taxId',
          validationRules: [
            {
              type: 'required',
              when: {
                or: [{ country: 'US' }, { country: 'UK' }],
              },
              message: 'Tax ID is required for US or UK',
            },
          ],
        },
      ],
    };

    it('should require specialCode for US student', async () => {
      const formData = {
        country: 'US',
        isStudent: true,
        // specialCode is missing
      };

      const result = await validator.validate(formData, logicalOperatorsConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.find((e: any) => e.field === 'specialCode')).toBeDefined();
    });

    it('should NOT require specialCode for US non-student', async () => {
      const formData = {
        country: 'US',
        isStudent: false,
        specialCode: '',
      };

      const result = await validator.validate(formData, logicalOperatorsConfig);

      // specialCode should not be required (AND condition not fully met)
      expect(result.errors.find((e: any) => e.field === 'specialCode')).toBeUndefined();
    });

    it('should require taxId for US (OR condition)', async () => {
      const formData = {
        country: 'US',
        isStudent: false,
        taxId: '',
      };

      const result = await validator.validate(formData, logicalOperatorsConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.find((e: any) => e.field === 'taxId')).toBeDefined();
    });

    it('should require taxId for UK (OR condition)', async () => {
      const formData = {
        country: 'UK',
        isStudent: true,
        taxId: '',
      };

      const result = await validator.validate(formData, logicalOperatorsConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.find((e: any) => e.field === 'taxId')).toBeDefined();
    });

    it('should NOT require taxId for OTHER country', async () => {
      const formData = {
        country: 'OTHER',
        isStudent: false,
        taxId: '',
      };

      const result = await validator.validate(formData, logicalOperatorsConfig);

      // taxId should not be required (OR condition not met)
      expect(result.errors.find((e: any) => e.field === 'taxId')).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Unified Expressions - visibleIf + validationRules.when
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Unified Expressions - visibleIf + validationRules.when', () => {
    const combinedConfig: FormConfig = {
      formId: 'combined-expressions-form',
      items: [
        {
          type: 'dropdown',
          name: 'membershipType',
        },
        {
          type: 'text',
          name: 'premiumFeature',
          visibleIf: { membershipType: ['premium', 'enterprise'] },
          validationRules: [
            {
              type: 'required',
              when: { membershipType: 'premium' },
              message: 'Premium feature selection is required',
            },
          ],
        },
      ],
    };

    it('should validate premium field when visible and condition met', async () => {
      const formData = {
        membershipType: 'premium',
        // premiumFeature is missing
      };

      const result = await validator.validate(formData, combinedConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.find((e: any) => e.field === 'premiumFeature')).toBeDefined();
    });

    it('should NOT validate premium field for enterprise (when condition not met)', async () => {
      const formData = {
        membershipType: 'enterprise',
        premiumFeature: '',
      };

      const result = await validator.validate(formData, combinedConfig);

      expect(result.valid).toBe(true);
    });

    it('should NOT validate premium field for basic (not visible)', async () => {
      const formData = {
        membershipType: 'basic',
        premiumFeature: '',
      };

      const result = await validator.validate(formData, combinedConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Multiple validation rules with different when conditions
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Multiple validation rules with different when conditions', () => {
    const multipleWhenConfig: FormConfig = {
      formId: 'multiple-when-form',
      items: [
        {
          type: 'dropdown',
          name: 'documentType',
        },
        {
          type: 'text',
          name: 'documentNumber',
          validationRules: [
            {
              type: 'required',
              message: 'Document number is always required',
            },
            {
              type: 'pattern',
              pattern: '^[A-Z]{2}[0-9]{6}$',
              when: { documentType: 'passport' },
              message: 'Passport must be 2 letters + 6 digits',
            },
            {
              type: 'pattern',
              pattern: '^[0-9]{8}$',
              when: { documentType: 'id_card' },
              message: 'ID card must be 8 digits',
            },
            {
              type: 'stringLength',
              min: 5,
              max: 20,
              when: { documentType: 'other' },
              message: 'Other documents: 5-20 characters',
            },
          ],
        },
      ],
    };

    it('should validate passport format', async () => {
      const formData = {
        documentType: 'passport',
        documentNumber: 'AB123456',
      };

      const result = await validator.validate(formData, multipleWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL passport with wrong format', async () => {
      const formData = {
        documentType: 'passport',
        documentNumber: '12345678',
      };

      const result = await validator.validate(formData, multipleWhenConfig);

      expect(result.valid).toBe(false);
    });

    it('should validate id_card format', async () => {
      const formData = {
        documentType: 'id_card',
        documentNumber: '12345678',
      };

      const result = await validator.validate(formData, multipleWhenConfig);

      expect(result.valid).toBe(true);
    });

    it('should apply only relevant validation rule based on documentType', async () => {
      const formData = {
        documentType: 'other',
        documentNumber: 'ABC123',
      };

      const result = await validator.validate(formData, multipleWhenConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // All Comparison Operators
  // ═══════════════════════════════════════════════════════════════════════════

  describe('All Comparison Operators in When Clauses', () => {
    const allOperatorsConfig: FormConfig = {
      formId: 'all-operators-form',
      items: [
        {
          type: 'number',
          name: 'score',
        },
        {
          type: 'text',
          name: 'lessThan50',
          validationRules: [
            { type: 'required', when: { score: ['<', 50] }, message: 'Required for score < 50' },
          ],
        },
        {
          type: 'text',
          name: 'lessThanOrEqual50',
          validationRules: [
            { type: 'required', when: { score: ['<=', 50] }, message: 'Required for score <= 50' },
          ],
        },
        {
          type: 'text',
          name: 'greaterThan50',
          validationRules: [
            { type: 'required', when: { score: ['>', 50] }, message: 'Required for score > 50' },
          ],
        },
        {
          type: 'text',
          name: 'greaterThanOrEqual50',
          validationRules: [
            { type: 'required', when: { score: ['>=', 50] }, message: 'Required for score >= 50' },
          ],
        },
        {
          type: 'text',
          name: 'equals50',
          validationRules: [
            { type: 'required', when: { score: ['==', 50] }, message: 'Required for score == 50' },
          ],
        },
        {
          type: 'text',
          name: 'notEquals50',
          validationRules: [
            { type: 'required', when: { score: ['!=', 50] }, message: 'Required for score != 50' },
          ],
        },
      ],
    };

    it('should correctly evaluate < operator', async () => {
      const formData = { score: 30 };
      const result = await validator.validate(formData, allOperatorsConfig);

      expect(result.errors.find((e: any) => e.field === 'lessThan50')).toBeDefined();
      expect(result.errors.find((e: any) => e.field === 'greaterThan50')).toBeUndefined();
    });

    it('should correctly evaluate <= operator at boundary', async () => {
      const formData = { score: 50 };
      const result = await validator.validate(formData, allOperatorsConfig);

      expect(result.errors.find((e: any) => e.field === 'lessThanOrEqual50')).toBeDefined();
      expect(result.errors.find((e: any) => e.field === 'equals50')).toBeDefined();
    });

    it('should correctly evaluate > operator', async () => {
      const formData = { score: 70 };
      const result = await validator.validate(formData, allOperatorsConfig);

      expect(result.errors.find((e: any) => e.field === 'greaterThan50')).toBeDefined();
      expect(result.errors.find((e: any) => e.field === 'lessThan50')).toBeUndefined();
    });

    it('should correctly evaluate != operator', async () => {
      const formData = { score: 30 };
      const result = await validator.validate(formData, allOperatorsConfig);

      expect(result.errors.find((e: any) => e.field === 'notEquals50')).toBeDefined();
      expect(result.errors.find((e: any) => e.field === 'equals50')).toBeUndefined();
    });
  });
});
