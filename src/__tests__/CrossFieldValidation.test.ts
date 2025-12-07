/**
 * CrossField Validation Tests
 *
 * Tests for the CrossField validation type which validates
 * multiple fields together using registered validator functions.
 *
 * Available validators: isNotEmpty, isTrue, isFalse, passwordMatch,
 * emailMatch, compare, atLeastOneRequired, equals, valueIn,
 * arrayContains, arrayContainsAny
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('CrossField Validation', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD MATCH VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Password Match Validation', () => {
    const passwordFormConfig: FormConfig = {
      formId: 'password-form',
      items: [
        {
          type: 'text',
          name: 'password',
          validationRules: [
            { type: 'required', message: 'Password required' },
            { type: 'stringLength', min: 8, message: 'Min 8 chars' },
          ],
        },
        {
          type: 'text',
          name: 'confirmPassword',
          validationRules: [
            { type: 'required', message: 'Confirm password required' },
            {
              type: 'crossField',
              targetFields: ['password', 'confirmPassword'],
              crossFieldValidator: 'passwordMatch',
              message: 'Passwords must match',
            },
          ],
        },
      ],
    };

    it('should PASS when passwords match', async () => {
      const formData = {
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };

      const result = await validator.validate(formData, passwordFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when passwords do not match', async () => {
      const formData = {
        password: 'SecurePass123',
        confirmPassword: 'DifferentPass',
      };

      const result = await validator.validate(formData, passwordFormConfig);

      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AT LEAST ONE REQUIRED
  // ═══════════════════════════════════════════════════════════════════════════

  describe('At Least One Required Validation', () => {
    const contactFormConfig: FormConfig = {
      formId: 'contact-form',
      items: [
        { type: 'text', name: 'email' },
        { type: 'text', name: 'phone' },
        {
          type: 'text',
          name: 'contactCheck',
          validationRules: [
            {
              type: 'crossField',
              targetFields: ['email', 'phone'],
              crossFieldValidator: 'atLeastOneRequired',
              message: 'At least one contact is required',
            },
          ],
        },
      ],
    };

    it('should PASS when email is provided', async () => {
      const formData = {
        email: 'test@example.com',
        phone: '',
      };

      const result = await validator.validate(formData, contactFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should PASS when phone is provided', async () => {
      const formData = {
        email: '',
        phone: '+36301234567',
      };

      const result = await validator.validate(formData, contactFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should PASS when both are provided', async () => {
      const formData = {
        email: 'test@example.com',
        phone: '+36301234567',
      };

      const result = await validator.validate(formData, contactFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should FAIL when neither is provided', async () => {
      const formData = {
        email: '',
        phone: '',
        contactCheck: '',
      };

      const result = await validator.validate(formData, contactFormConfig);
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PARAMETERIZED VALIDATORS - valueIn
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Parameterized Validators - valueIn', () => {
    const valueInFormConfig: FormConfig = {
      formId: 'value-in-form',
      items: [
        { type: 'text', name: 'subscription' },
        {
          type: 'text',
          name: 'checkField',
          validationRules: [
            {
              type: 'crossField',
              targetFields: ['subscription'],
              crossFieldValidator: {
                name: 'valueIn',
                params: { values: ['Premium', 'Enterprise'] },
              },
              message: 'Must be Premium or Enterprise',
            },
          ],
        },
      ],
    };

    it('should PASS when value is in allowed list', async () => {
      const formData = {
        subscription: 'Premium',
        checkField: '',
      };

      const result = await validator.validate(formData, valueInFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should FAIL when value is not in allowed list', async () => {
      const formData = {
        subscription: 'Basic',
        checkField: '',
      };

      const result = await validator.validate(formData, valueInFormConfig);
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // isNotEmpty VALIDATOR
  // ═══════════════════════════════════════════════════════════════════════════

  describe('isNotEmpty Validator', () => {
    const isNotEmptyFormConfig: FormConfig = {
      formId: 'is-not-empty-form',
      items: [
        { type: 'text', name: 'otherField' },
        {
          type: 'text',
          name: 'checkField',
          validationRules: [
            {
              type: 'crossField',
              targetFields: ['otherField'],
              crossFieldValidator: 'isNotEmpty',
              message: 'Other field must not be empty',
            },
          ],
        },
      ],
    };

    it('should PASS when target field has value', async () => {
      const formData = {
        otherField: 'has value',
        checkField: '',
      };

      const result = await validator.validate(formData, isNotEmptyFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should FAIL when target field is empty', async () => {
      const formData = {
        otherField: '',
        checkField: '',
      };

      const result = await validator.validate(formData, isNotEmptyFormConfig);
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // isTrue / isFalse VALIDATORS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('isTrue/isFalse Validators', () => {
    const booleanFormConfig: FormConfig = {
      formId: 'boolean-form',
      items: [
        { type: 'checkbox', name: 'acceptTerms' },
        {
          type: 'text',
          name: 'termsCheck',
          validationRules: [
            {
              type: 'crossField',
              targetFields: ['acceptTerms'],
              crossFieldValidator: 'isTrue',
              message: 'You must accept the terms',
            },
          ],
        },
      ],
    };

    it('should PASS when checkbox is checked (true)', async () => {
      const formData = {
        acceptTerms: true,
        termsCheck: '',
      };

      const result = await validator.validate(formData, booleanFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should FAIL when checkbox is unchecked (false)', async () => {
      const formData = {
        acceptTerms: false,
        termsCheck: '',
      };

      const result = await validator.validate(formData, booleanFormConfig);
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSSFIELD IN VALIDATION RULE GROUPS (OR)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CrossField in Validation Rule Groups', () => {
    const crossFieldGroupFormConfig: FormConfig = {
      formId: 'crossfield-group-form',
      items: [
        { type: 'text', name: 'email' },
        { type: 'text', name: 'phone' },
        { type: 'text', name: 'address' },
        {
          type: 'text',
          name: 'contactValidation',
          validationRules: [
            {
              or: [
                {
                  type: 'crossField',
                  targetFields: ['email'],
                  crossFieldValidator: 'isNotEmpty',
                  message: 'Email filled',
                },
                {
                  type: 'crossField',
                  targetFields: ['phone'],
                  crossFieldValidator: 'isNotEmpty',
                  message: 'Phone filled',
                },
                {
                  type: 'crossField',
                  targetFields: ['address'],
                  crossFieldValidator: 'isNotEmpty',
                  message: 'Address filled',
                },
              ],
              groupMessage: 'At least one contact method required',
            },
          ],
        },
      ],
    };

    it('should pass when at least one crossField in OR group passes', async () => {
      const formData = {
        email: 'test@example.com',
        phone: '',
        address: '',
      };

      const result = await validator.validate(formData, crossFieldGroupFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should fail when all crossFields in OR group fail', async () => {
      const formData = {
        email: '',
        phone: '',
        address: '',
        contactValidation: '',
      };

      const result = await validator.validate(formData, crossFieldGroupFormConfig);
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSSFIELD WITH WHEN CONDITION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CrossField with When Condition', () => {
    const conditionalCrossFieldConfig: FormConfig = {
      formId: 'conditional-crossfield-form',
      items: [
        { type: 'dropdown', name: 'userType' },
        { type: 'checkbox', name: 'isPremium' },
        {
          type: 'text',
          name: 'premiumCheck',
          validationRules: [
            {
              type: 'crossField',
              targetFields: ['isPremium'],
              crossFieldValidator: 'isTrue',
              message: 'Premium status required for VIP users',
              when: { userType: 'vip' },
            },
          ],
        },
      ],
    };

    it('should apply crossField validation when condition met', async () => {
      const formData = {
        userType: 'vip',
        isPremium: false,
        premiumCheck: '',
      };

      const result = await validator.validate(formData, conditionalCrossFieldConfig);
      expect(result.valid).toBe(false);
    });

    it('should skip crossField validation when condition not met', async () => {
      const formData = {
        userType: 'regular',
        isPremium: false,
        premiumCheck: '',
      };

      const result = await validator.validate(formData, conditionalCrossFieldConfig);
      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINED WITH OTHER RULES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CrossField Combined with Other Rules', () => {
    const combinedRulesFormConfig: FormConfig = {
      formId: 'combined-rules-form',
      items: [
        {
          type: 'number',
          name: 'amount',
          validationRules: [
            { type: 'required', message: 'Required' },
            { type: 'range', min: 0, message: 'Must be positive' },
          ],
        },
        {
          type: 'checkbox',
          name: 'confirmed',
        },
        {
          type: 'text',
          name: 'confirmCheck',
          validationRules: [
            {
              type: 'crossField',
              targetFields: ['confirmed'],
              crossFieldValidator: 'isTrue',
              message: 'Must confirm the amount',
            },
          ],
        },
      ],
    };

    it('should run both regular rules and crossField rules', async () => {
      const formData = {
        amount: 100,
        confirmed: true,
        confirmCheck: '',
      };

      const result = await validator.validate(formData, combinedRulesFormConfig);
      expect(result.valid).toBe(true);
    });

    it('should fail on regular rule', async () => {
      const formData = {
        amount: -100, // Fails range rule
        confirmed: true,
        confirmCheck: '',
      };

      const result = await validator.validate(formData, combinedRulesFormConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.find((e: any) => e.field === 'amount')).toBeDefined();
    });

    it('should fail on crossField rule', async () => {
      const formData = {
        amount: 100,
        confirmed: false, // Fails isTrue
        confirmCheck: '',
      };

      const result = await validator.validate(formData, combinedRulesFormConfig);
      expect(result.valid).toBe(false);
    });
  });
});
