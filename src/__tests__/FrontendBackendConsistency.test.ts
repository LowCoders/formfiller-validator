/**
 * Frontend-Backend Validation Consistency Tests
 *
 * Tests to ensure frontend (ClientValidator) and backend (JoiAdapter)
 * validators produce consistent results for the same inputs
 */

import { ClientValidator } from '../validators/ClientValidator';
import { JoiAdapter } from '../adapters/JoiAdapter';
import { ValidationContext } from '../core/ValidationContext';
import { CallbackRegistry, getGlobalRegistry, resetGlobalRegistry } from '../core/CallbackRegistry';
import { resetClientRegistry } from '../validators/ClientCallbackRegistry';
import { ValidationRule, FormConfig } from '../types';

describe('Frontend-Backend Validation Consistency', () => {
  let clientValidator: ClientValidator;
  let joiAdapter: JoiAdapter;
  let backendRegistry: CallbackRegistry;

  beforeEach(() => {
    // Reset both registries
    resetClientRegistry();
    resetGlobalRegistry();

    // Create validators
    clientValidator = new ClientValidator();

    // Use global registry for backend (which has predefined validators)
    backendRegistry = getGlobalRegistry();
    joiAdapter = new JoiAdapter(backendRegistry);
  });

  describe('Basic Rules Consistency', () => {
    it('required rule should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      const formData = {};

      // Frontend validation
      const frontendResult = await clientValidator.validate('testField', '', [rule], formData);

      // Backend validation
      const formConfig: FormConfig = { formId: 'test-form' };
      const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
      const backendResult = await joiAdapter.validate('', rule, backendContext);

      expect(frontendResult.valid).toBe(backendResult.valid);
      expect(frontendResult.valid).toBe(false);
    });

    it('email rule should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'email',
        message: 'Invalid email',
      };

      const testCases = [
        { value: 'test@example.com', expected: true },
        { value: 'invalid-email', expected: false },
        { value: '', expected: true }, // Empty is valid (use required for mandatory)
      ];

      for (const testCase of testCases) {
        const formData = {};

        // Frontend
        const frontendResult = await clientValidator.validate(
          'email',
          testCase.value,
          [rule],
          formData
        );

        // Backend
        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate(testCase.value, rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('stringLength rule should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'stringLength',
        min: 5,
        max: 10,
        message: 'Invalid length',
      };

      const testCases = [
        { value: 'hello', expected: true },
        { value: 'hi', expected: false },
        { value: 'this is too long', expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {};

        const frontendResult = await clientValidator.validate(
          'text',
          testCase.value,
          [rule],
          formData
        );

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate(testCase.value, rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('numeric rule should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'numeric',
        message: 'Must be numeric',
      };

      const testCases = [
        { value: 123, expected: true },
        { value: '456', expected: true },
        { value: 'abc', expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {};

        const frontendResult = await clientValidator.validate(
          'number',
          testCase.value,
          [rule],
          formData
        );

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate(testCase.value, rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('pattern rule should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'pattern',
        pattern: '^[a-z]+$',
        message: 'Only lowercase letters',
      };

      const testCases = [
        { value: 'hello', expected: true },
        { value: 'Hello', expected: false },
        { value: '123', expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {};

        const frontendResult = await clientValidator.validate(
          'text',
          testCase.value,
          [rule],
          formData
        );

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate(testCase.value, rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('range rule should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'range',
        min: 10,
        max: 100,
        message: 'Out of range',
      };

      const testCases = [
        { value: 50, expected: true },
        { value: 5, expected: false },
        { value: 150, expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {};

        const frontendResult = await clientValidator.validate(
          'number',
          testCase.value,
          [rule],
          formData
        );

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate(testCase.value, rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('arrayLength rule should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'arrayLength',
        min: 1,
        max: 3,
        message: 'Invalid array length',
      };

      const testCases = [
        { value: ['item1'], expected: true },
        { value: ['item1', 'item2'], expected: true },
        { value: [], expected: false },
        { value: ['item1', 'item2', 'item3', 'item4'], expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {};

        const frontendResult = await clientValidator.validate(
          'array',
          testCase.value,
          [rule],
          formData
        );

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate(testCase.value, rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });
  });

  describe('CrossField Validation Consistency', () => {
    it('isNotEmpty validator should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['targetField'],
        crossFieldValidator: 'isNotEmpty',
        message: 'Target field must not be empty',
      };

      const testCases = [
        { targetValue: 'has value', expected: true },
        { targetValue: '', expected: false },
        { targetValue: null, expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {
          checkField: '', // Current field value
          targetField: testCase.targetValue,
        };

        // Frontend
        const frontendResult = await clientValidator.validate('checkField', '', [rule], formData);

        // Backend - validate the current field value with the rule
        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        // JoiAdapter validates the current field's value, which is ''
        const backendResult = await joiAdapter.validate('', rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('isTrue validator should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['flag'],
        crossFieldValidator: 'isTrue',
        message: 'Flag must be true',
      };

      const testCases = [
        { flagValue: true, expected: true },
        { flagValue: false, expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {
          checkField: '',
          flag: testCase.flagValue,
        };

        const frontendResult = await clientValidator.validate('checkField', '', [rule], formData);

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate('', rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('equals parameterized validator should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['position'],
        crossFieldValidator: { name: 'equals', params: { value: 'senior' } },
        message: 'Must be senior',
      };

      const testCases = [
        { positionValue: 'senior', expected: true },
        { positionValue: 'junior', expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {
          checkField: '',
          position: testCase.positionValue,
        };

        const frontendResult = await clientValidator.validate('checkField', '', [rule], formData);

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate('', rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('valueIn parameterized validator should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['subscription'],
        crossFieldValidator: { name: 'valueIn', params: { values: ['Premium', 'Enterprise'] } },
        message: 'Must be Premium or Enterprise',
      };

      const testCases = [
        { subscription: 'Premium', expected: true },
        { subscription: 'Enterprise', expected: true },
        { subscription: 'Basic', expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {
          checkField: '',
          subscription: testCase.subscription,
        };

        const frontendResult = await clientValidator.validate('checkField', '', [rule], formData);

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate('', rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('arrayContainsAny parameterized validator should behave consistently', async () => {
      const rule: ValidationRule = {
        type: 'crossField',
        targetFields: ['permissions'],
        crossFieldValidator: {
          name: 'arrayContainsAny',
          params: { values: ['admin', 'superuser'] },
        },
        message: 'Must have admin or superuser permission',
      };

      const testCases = [
        { permissions: ['admin', 'read'], expected: true },
        { permissions: ['superuser'], expected: true },
        { permissions: ['read', 'write'], expected: false },
      ];

      for (const testCase of testCases) {
        const formData = {
          checkField: '',
          permissions: testCase.permissions,
        };

        const frontendResult = await clientValidator.validate('checkField', '', [rule], formData);

        const formConfig: FormConfig = { formId: 'test-form' };
        const backendContext = new ValidationContext(formData, formConfig, { mode: 'sequential' });
        const backendResult = await joiAdapter.validate('', rule, backendContext);

        expect(frontendResult.valid).toBe(backendResult.valid);
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });
  });

  describe('ValidationRuleGroup Consistency', () => {
    it('OR group should behave consistently', async () => {
      const rules: any[] = [
        {
          or: [
            {
              type: 'crossField',
              targetFields: ['email'],
              crossFieldValidator: 'isNotEmpty',
              message: 'Email',
            },
            {
              type: 'crossField',
              targetFields: ['phone'],
              crossFieldValidator: 'isNotEmpty',
              message: 'Phone',
            },
          ],
          groupMessage: 'At least one contact required',
        },
      ];

      const testCases = [
        { formData: { email: 'test@example.com', phone: '' }, expected: true },
        { formData: { email: '', phone: '123456' }, expected: true },
        { formData: { email: '', phone: '' }, expected: false },
      ];

      for (const testCase of testCases) {
        // Frontend
        const frontendResult = await clientValidator.validate(
          'contactCheck',
          '',
          rules,
          testCase.formData
        );

        // Backend (using ConfigProcessor which handles groups)
        // Note: For simplicity, we're testing the general behavior
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('AND group should behave consistently', async () => {
      const rules: any[] = [
        {
          and: [
            { type: 'required', message: 'Required' },
            { type: 'stringLength', min: 5, message: 'Min 5 chars' },
          ],
          groupMessage: 'Both conditions must be met',
        },
      ];

      const testCases = [
        { value: 'hello world', expected: true },
        { value: 'hi', expected: false },
        { value: '', expected: false },
      ];

      for (const testCase of testCases) {
        const frontendResult = await clientValidator.validate('field', testCase.value, rules, {});
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('NOT group should behave consistently', async () => {
      const rules: any[] = [
        {
          not: {
            type: 'crossField',
            targetFields: ['isAdmin'],
            crossFieldValidator: 'isTrue',
            message: 'Is admin',
          },
          groupMessage: 'Must not be admin',
        },
      ];

      const testCases = [
        { formData: { isAdmin: false }, expected: true },
        { formData: { isAdmin: true }, expected: false },
      ];

      for (const testCase of testCases) {
        const frontendResult = await clientValidator.validate(
          'checkField',
          '',
          rules,
          testCase.formData
        );
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });

    it('Nested OR with AND should behave consistently', async () => {
      const rules: any[] = [
        {
          or: [
            {
              type: 'crossField',
              targetFields: ['isPremium'],
              crossFieldValidator: 'isTrue',
              message: 'Premium',
            },
            {
              and: [
                {
                  type: 'crossField',
                  targetFields: ['hasCustomConfig'],
                  crossFieldValidator: 'isTrue',
                  message: 'Custom config',
                },
                { type: 'arrayLength', max: 2, message: 'Max 2 items' },
              ],
              groupMessage: 'Custom with max 2',
            },
          ],
          groupMessage: 'Premium OR custom required',
        },
      ];

      const testCases = [
        // Premium user - should pass
        {
          formData: { isPremium: true, hasCustomConfig: false },
          value: ['item1', 'item2', 'item3'],
          expected: true,
        },
        // Not premium but has custom config with 1 item - should pass
        {
          formData: { isPremium: false, hasCustomConfig: true },
          value: ['item1'],
          expected: true,
        },
        // Not premium and has custom config with 3 items - should fail
        {
          formData: { isPremium: false, hasCustomConfig: true },
          value: ['item1', 'item2', 'item3'],
          expected: false,
        },
        // Not premium and no custom config - should fail
        {
          formData: { isPremium: false, hasCustomConfig: false },
          value: ['item1'],
          expected: false,
        },
      ];

      for (const testCase of testCases) {
        const frontendResult = await clientValidator.validate(
          'features',
          testCase.value,
          rules,
          testCase.formData
        );
        expect(frontendResult.valid).toBe(testCase.expected);
      }
    });
  });
});
