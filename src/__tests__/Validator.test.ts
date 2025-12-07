/**
 * Validator Tests
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator({
      mode: 'sequential',
      locale: 'en',
    });
  });

  describe('Basic Validation', () => {
    it('should validate required field', async () => {
      const formData = {
        firstName: 'John',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'firstName',
            validationRules: [
              {
                type: 'required',
                message: 'First name is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty required field', async () => {
      const formData = {
        firstName: '',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'firstName',
            validationRules: [
              {
                type: 'required',
                message: 'First name is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('firstName');
    });

    it('should fail validation for invalid email format', async () => {
      const formData = {
        email: 'invalid-email',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'email',
            validationRules: [
              {
                type: 'email',
                message: 'Invalid email format',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('email');
    });
  });

  describe('Conditional Validation', () => {
    it('should skip validation for disabled field', async () => {
      const formData = {
        employmentType: 'unemployed',
        companyName: '',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'employmentType',
          },
          {
            type: 'text',
            name: 'companyName',
            disabledIf: {
              field: 'employmentType',
              operator: '==',
              value: 'unemployed',
            },
            validationRules: [
              {
                type: 'required',
                message: 'Company name is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.fieldResults?.companyName?.skipped).toBe(true);
    });

    it('should validate field when not disabled', async () => {
      const formData = {
        employmentType: 'employed',
        companyName: '',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'employmentType',
          },
          {
            type: 'text',
            name: 'companyName',
            disabledIf: {
              field: 'employmentType',
              operator: '==',
              value: 'unemployed',
            },
            validationRules: [
              {
                type: 'required',
                message: 'Company name is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('companyName');
    });
  });

  describe('Nested Structures', () => {
    it('should validate nested fields in groups', async () => {
      const formData = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'group',
            name: 'userGroup',
            excludeFromPath: true, // Don't include 'userGroup' in field paths
            items: [
              {
                type: 'text',
                name: 'user.firstName',
                validationRules: [
                  {
                    type: 'required',
                    message: 'First name is required',
                  },
                ],
              },
              {
                type: 'text',
                name: 'user.lastName',
                validationRules: [
                  {
                    type: 'required',
                    message: 'Last name is required',
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
