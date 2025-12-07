/**
 * ConfigProcessor Integration Tests
 *
 * Integration tests for full config processing:
 * - Full config processing with validation
 * - Auto-disabled fields (visibleIf/disabledIf)
 * - Nested validation (multi-level structures)
 * - ValidationRuleGroup processing
 * - Error handling
 */

import { ConfigProcessor } from '../processors/ConfigProcessor';
import { ValidationContext } from '../core/ValidationContext';
import { getGlobalRegistry, resetGlobalRegistry } from '../core/CallbackRegistry';
import { FormConfig } from '../types';

describe('ConfigProcessor Integration Tests', () => {
  let processor: ConfigProcessor;

  beforeEach(() => {
    resetGlobalRegistry();
    const registry = getGlobalRegistry();
    processor = new ConfigProcessor(registry);
  });

  describe('Full Config Processing', () => {
    it('should process complete form config with multiple fields', async () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        age: 30,
      };

      const formConfig: FormConfig = {
        formId: 'registration',
        items: [
          {
            type: 'text',
            name: 'firstName',
            validationRules: [{ type: 'required', message: 'First name required' }],
          },
          {
            type: 'text',
            name: 'lastName',
            validationRules: [{ type: 'required', message: 'Last name required' }],
          },
          {
            type: 'text',
            name: 'email',
            validationRules: [
              { type: 'required', message: 'Email required' },
              { type: 'email', message: 'Invalid email' },
            ],
          },
          {
            type: 'number',
            name: 'age',
            validationRules: [
              { type: 'required', message: 'Age required' },
              { type: 'range', min: 18, max: 150, message: 'Age must be 18-150' },
            ],
          },
        ],
      };

      const context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const result = await processor.process(context);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Auto-Disabled Fields', () => {
    it('should skip validation for invisible fields', async () => {
      const formData = {
        customerType: 'individual',
        taxNumber: '', // Invisible, so validation skipped
      };

      const formConfig: FormConfig = {
        formId: 'customer-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'taxNumber',
            visibleIf: { customerType: 'company' },
            validationRules: [{ type: 'required', message: 'Tax number required' }],
          },
        ],
      };

      const context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const result = await processor.process(context);

      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['taxNumber']?.skipped).toBe(true);
    });

    it('should skip validation for disabled fields', async () => {
      const formData = {
        status: 'readonly',
        notes: 'some notes',
      };

      const formConfig: FormConfig = {
        formId: 'form',
        items: [
          {
            type: 'text',
            name: 'status',
          },
          {
            type: 'text',
            name: 'notes',
            disabledIf: { status: 'readonly' },
            validationRules: [{ type: 'required', message: 'Notes required' }],
          },
        ],
      };

      const context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const result = await processor.process(context);

      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['notes']?.skipped).toBe(true);
    });
  });

  describe('Nested Validation', () => {
    it('should validate multi-level nested structures', async () => {
      const formData = {
        user: {
          profile: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      };

      const formConfig: FormConfig = {
        formId: 'profile-form',
        items: [
          {
            type: 'group',
            name: 'userGroup',
            excludeFromPath: true,
            items: [
              {
                type: 'text',
                name: 'user.profile.name',
                validationRules: [{ type: 'required', message: 'Name required' }],
              },
              {
                type: 'text',
                name: 'user.profile.email',
                validationRules: [
                  { type: 'required', message: 'Email required' },
                  { type: 'email', message: 'Invalid email' },
                ],
              },
            ],
          },
        ],
      };

      const context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const result = await processor.process(context);

      expect(result.valid).toBe(true);
    });
  });

  describe('ValidationRuleGroup Processing', () => {
    it('should process OR group validation', async () => {
      const formData = {
        email: 'test@example.com',
        phone: '',
        contactCheck: '',
      };

      const formConfig: FormConfig = {
        formId: 'contact-form',
        items: [
          {
            type: 'text',
            name: 'email',
          },
          {
            type: 'text',
            name: 'phone',
          },
          {
            type: 'text',
            name: 'contactCheck',
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
                ],
                groupMessage: 'At least one contact required',
              },
            ],
          },
        ],
      };

      const context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const result = await processor.process(context);

      expect(result.valid).toBe(true);
    });

    it('should fail OR group when all conditions fail', async () => {
      const formData = {
        email: '',
        phone: '',
        contactCheck: '',
      };

      const formConfig: FormConfig = {
        formId: 'contact-form',
        items: [
          {
            type: 'text',
            name: 'email',
          },
          {
            type: 'text',
            name: 'phone',
          },
          {
            type: 'text',
            name: 'contactCheck',
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
                ],
                groupMessage: 'At least one contact required',
              },
            ],
          },
        ],
      };

      const context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const result = await processor.process(context);

      expect(result.valid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid config gracefully', async () => {
      const formData = {
        field1: 'value',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'field1',
            validationRules: [
              // Unknown rule type should be handled
              { type: 'unknownType' as any, message: 'Unknown rule' },
            ],
          },
        ],
      };

      const context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const result = await processor.process(context);

      // Should not crash, should handle gracefully
      expect(result).toBeDefined();
    });
  });
});
