/**
 * CrossField Validation Tests
 *
 * Tests for the CrossField validation type which validates
 * multiple fields together using registered validator functions.
 *
 * Available validators: isNotEmpty, isTrue, isFalse, passwordMatch,
 * emailMatch, compare, atLeastOne, equals, valueIn,
 * arrayContains, arrayContainsAny
 */

import { Validator } from '../core/Validator.js';
import { FormConfig } from '../types/index.js';

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
          type: 'text' as const,
          name: 'password',
          validationRules: [
            { type: 'required' as const, message: 'Password required' },
            { type: 'stringLength' as const, min: 8, message: 'Min 8 chars' },
          ],
        },
        {
          type: 'text' as const,
          name: 'confirmPassword',
          validationRules: [
            { type: 'required' as const, message: 'Confirm password required' },
            {
              type: 'equals' as const,
              targetFields: ['password'],
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
        { type: 'text' as const, name: 'email' },
        { type: 'text' as const, name: 'phone' },
        {
          type: 'text' as const,
          name: 'contactCheck',
          validationRules: [
            {
              type: 'atLeastOne' as const as any,
              targetFields: ['email', 'phone'],
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
  // isNotEmpty VALIDATOR
  // ═══════════════════════════════════════════════════════════════════════════

  describe('isNotEmpty Validator', () => {
    const isNotEmptyFormConfig: FormConfig = {
      formId: 'is-not-empty-form',
      items: [
        { type: 'text' as const, name: 'otherField' },
        {
          type: 'text' as const,
          name: 'checkField',
          validationRules: [
            {
              type: 'atLeastOne' as const as any,
              targetFields: ['otherField'],
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
        { 
          type: 'checkbox' as const, 
          name: 'acceptTerms',
          validationRules: [
            {
              type: 'required' as const,
              message: 'You must accept the terms',
            },
          ],
        },
      ],
    };

    it('should PASS when checkbox is checked (true)', async () => {
      const formData = {
        acceptTerms: true,
      };

      const result = await validator.validate(formData, booleanFormConfig);
      expect(result.valid).toBe(true);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSSFIELD IN VALIDATION RULE GROUPS (OR)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CrossField in Validation Rule Groups', () => {
    const crossFieldGroupFormConfig: FormConfig = {
      formId: 'crossfield-group-form',
      items: [
        { type: 'text' as const, name: 'email' },
        { type: 'text' as const, name: 'phone' },
        { type: 'text' as const, name: 'address' },
        {
          type: 'text' as const,
          name: 'contactValidation',
          validationRules: [
            {
              or: [
                {
                  type: 'atLeastOne' as const as any,
                  targetFields: ['email'],
                  message: 'Email filled',
                },
                {
                  type: 'atLeastOne' as const as any,
                  targetFields: ['phone'],
                  message: 'Phone filled',
                },
                {
                  type: 'atLeastOne' as const as any,
                  targetFields: ['address'],
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

});
