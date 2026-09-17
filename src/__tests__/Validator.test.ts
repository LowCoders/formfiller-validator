/**
 * Validator Tests
 */

import { Validator } from '../core/Validator.js';
import { FormConfig } from '../types/index.js';

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

  describe('Error Path Labels', () => {
    it('should attach path labels from the field labels', async () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'group',
            name: 'personalData',
            caption: 'Személyes adatok',
            items: [
              {
                type: 'text',
                name: 'emailAddress',
                label: { text: 'E-mail cím' },
                validationRules: [{ type: 'required', message: 'Kötelező' }],
              },
            ],
          },
        ],
      };

      const result = await validator.validate({}, formConfig);

      expect(result.valid).toBe(false);
      const error = result.errors[0];
      expect(error?.field).toBe('personalData.emailAddress');
      expect(error?.path).toEqual(['personalData', 'emailAddress']);
      expect(error?.pathLabels).toEqual(['Személyes adatok', 'E-mail cím']);
    });

    it('should fall back to the path segment when a field has no label', async () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'fullName',
            validationRules: [{ type: 'required', message: 'Kötelező' }],
          },
        ],
      };

      const result = await validator.validate({}, formConfig);

      expect(result.errors[0]?.pathLabels).toEqual(['fullName']);
    });

    it('should not label synthetic fields', async () => {
      const result = await validator.validate({}, {
        formId: 'test-form',
        items: [{ type: 'text', name: 'a', validationRules: [{ type: 'nonExistentRule' } as any] }],
      });

      result.errors
        .filter((error) => error.field.startsWith('_'))
        .forEach((error) => expect(error.pathLabels).toBeUndefined());
    });
  });
});
