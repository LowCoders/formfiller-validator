/**
 * Form Validation Integration Tests
 *
 * Integration tests for full form validation scenarios:
 * - Multi-field validation
 * - Conditional validation (visibleIf + when)
 * - Cross-field dependencies
 * - Nested structures (group/tabbed forms)
 * - ValidationRuleGroup (OR/AND/NOT operators)
 * - Error aggregation
 */

import { Validator } from '../core/Validator.js';
import { FormConfig } from '../types/index.js';

describe('Form Validation Integration Tests', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('Multi-Field Validation', () => {
    it('should validate multiple fields successfully', async () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        age: 25,
      };

      const formConfig: FormConfig = {
        formId: 'user-form',
        items: [
          {
            type: 'text' as const,
            name: 'firstName',
            validationRules: [
              { type: 'required' as const, message: 'First name required' },
              { type: 'stringLength' as const, min: 2, max: 50, message: 'Invalid length' },
            ],
          },
          {
            type: 'text' as const,
            name: 'lastName',
            validationRules: [{ type: 'required' as const, message: 'Last name required' }],
          },
          {
            type: 'text' as const,
            name: 'email',
            validationRules: [
              { type: 'required' as const, message: 'Email required' },
              { type: 'email' as const, message: 'Invalid email' },
            ],
          },
          {
            type: 'number' as const,
            name: 'age',
            validationRules: [
              { type: 'required' as const, message: 'Age required' },
              { type: 'range' as const, min: 18, max: 120, message: 'Age must be 18-120' },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors from multiple fields', async () => {
      const formData = {
        firstName: '',
        lastName: 'D',
        email: 'invalid-email',
        age: 15,
      };

      const formConfig: FormConfig = {
        formId: 'user-form',
        items: [
          {
            type: 'text' as const,
            name: 'firstName',
            validationRules: [{ type: 'required' as const, message: 'First name required' }],
          },
          {
            type: 'text' as const,
            name: 'lastName',
            validationRules: [{ type: 'stringLength' as const, min: 2, message: 'Last name too short' }],
          },
          {
            type: 'text' as const,
            name: 'email',
            validationRules: [{ type: 'email' as const, message: 'Invalid email' }],
          },
          {
            type: 'number' as const,
            name: 'age',
            validationRules: [{ type: 'range' as const, min: 18, message: 'Must be 18+' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Conditional Validation with visibleIf', () => {
    it('should skip validation for invisible fields', async () => {
      const formData = {
        customerType: 'individual',
        taxNumber: '', // Empty but field is not visible
      };

      const formConfig: FormConfig = {
        formId: 'customer-form',
        items: [
          {
            type: 'text' as const,
            name: 'customerType',
          },
          {
            type: 'text' as const,
            name: 'taxNumber',
            visibleIf: { customerType: 'company' },
            validationRules: [{ type: 'required' as const, message: 'Tax number required' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['taxNumber']?.skipped).toBe(true);
    });

    it('should validate visible fields', async () => {
      const formData = {
        customerType: 'company',
        taxNumber: '12345678',
      };

      const formConfig: FormConfig = {
        formId: 'customer-form',
        items: [
          {
            type: 'text' as const,
            name: 'customerType',
          },
          {
            type: 'text' as const,
            name: 'taxNumber',
            visibleIf: { customerType: 'company' },
            validationRules: [{ type: 'required' as const, message: 'Tax number required' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(true);
    });
  });

  describe('Cross-Field Dependencies', () => {
    it('should validate password match', async () => {
      const formData = {
        password: 'secret123',
        confirmPassword: 'secret123',
      };

      const formConfig: FormConfig = {
        formId: 'registration-form',
        items: [
          {
            type: 'text' as const,
            name: 'password',
            validationRules: [{ type: 'required' as const, message: 'Password required' }],
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

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(true);
    });

    it('should fail when passwords do not match', async () => {
      const formData = {
        password: 'secret123',
        confirmPassword: 'different',
      };

      const formConfig: FormConfig = {
        formId: 'registration-form',
        items: [
          {
            type: 'text' as const,
            name: 'password',
            validationRules: [{ type: 'required' as const, message: 'Password required' }],
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

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(false);
    });
  });

  describe('Nested Structures with Groups', () => {
    it('should validate nested fields in group', async () => {
      const formData = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const formConfig: FormConfig = {
        formId: 'profile-form',
        items: [
          {
            type: 'group' as const,
            name: 'userGroup',
            excludeFromPath: true,
            items: [
              {
                type: 'text' as const,
                name: 'user.firstName',
                validationRules: [{ type: 'required' as const, message: 'First name required' }],
              },
              {
                type: 'text' as const,
                name: 'user.lastName',
                validationRules: [{ type: 'required' as const, message: 'Last name required' }],
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(true);
    });
  });

  describe('ValidationRuleGroup - OR/AND/NOT Operators', () => {
    it('should validate OR group (at least one contact)', async () => {
      const formData = {
        email: 'test@example.com',
        phone: '',
        address: '',
      };

      const formConfig: FormConfig = {
        formId: 'contact-form',
        items: [
          {
            type: 'text' as const,
            name: 'email',
          },
          {
            type: 'text' as const,
            name: 'phone',
          },
          {
            type: 'text' as const,
            name: 'address',
          },
          {
            type: 'text' as const,
            name: 'contactCheck',
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

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(true);
    });

    it('should fail OR group when all conditions fail', async () => {
      const formData = {
        email: '',
        phone: '',
        address: '',
        contactCheck: '',
      };

      const formConfig: FormConfig = {
        formId: 'contact-form',
        items: [
          {
            type: 'text' as const,
            name: 'email',
          },
          {
            type: 'text' as const,
            name: 'phone',
          },
          {
            type: 'text' as const,
            name: 'address',
          },
          {
            type: 'text' as const,
            name: 'contactCheck',
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

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(false);
    });

    it('should validate nested OR with AND', async () => {
      const formData = {
        isPremium: false,
        hasCustomConfig: true,
        features: ['feature1'],
      };

      const formConfig: FormConfig = {
        formId: 'features-form',
        items: [
          {
            type: 'checkbox' as const,
            name: 'isPremium',
          },
          {
            type: 'checkbox' as const,
            name: 'hasCustomConfig',
          },
          {
            type: 'tagbox' as const,
            name: 'features',
            validationRules: [
              {
                or: [
                  {
                    type: 'atLeastOne' as const as any,
                    targetFields: ['isPremium'],
                    message: 'Premium',
                  },
                  {
                    and: [
                      {
                        type: 'atLeastOne' as const as any,
                        targetFields: ['hasCustomConfig'],
                        message: 'Custom config',
                      },
                      {
                        type: 'arrayLength' as const,
                        max: 2,
                        message: 'Max 2 features',
                      },
                    ],
                    groupMessage: 'Custom with max 2',
                  },
                ],
                groupMessage: 'Premium OR custom required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(true);
    });
  });

  describe('Error Aggregation', () => {
    it('should aggregate errors from all fields', async () => {
      const formData = {
        field1: '',
        field2: 'x',
        field3: 150,
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text' as const,
            name: 'field1',
            validationRules: [{ type: 'required' as const, message: 'Field 1 required' }],
          },
          {
            type: 'text' as const,
            name: 'field2',
            validationRules: [{ type: 'stringLength' as const, min: 3, message: 'Field 2 too short' }],
          },
          {
            type: 'number' as const,
            name: 'field3',
            validationRules: [{ type: 'range' as const, max: 100, message: 'Field 3 too large' }],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });
});
