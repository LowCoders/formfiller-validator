/**
 * Frontend-Backend Validation Consistency Tests
 *
 * Tests to ensure frontend (ClientValidator) and backend (JoiAdapter)
 * validators produce consistent results for the same inputs
 */

import { ClientValidator } from '../validators/ClientValidator.js';
import { JoiAdapter } from '../adapters/JoiAdapter.js';
import { ValidationContext } from '../core/ValidationContext.js';
import { CallbackRegistry, getGlobalRegistry, resetGlobalRegistry } from '../core/CallbackRegistry.js';
import { resetClientRegistry } from '../validators/ClientCallbackRegistry.js';
import { FormConfig } from '../types/index.js';

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
      const rule = {
        type: 'required' as const,
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
      const rule = {
        type: 'email' as const,
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
      const rule = {
        type: 'stringLength' as const,
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
      const rule = {
        type: 'numeric' as const,
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
      const rule = {
        type: 'pattern' as const,
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
      const rule = {
        type: 'range' as const,
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
      const rule = {
        type: 'arrayLength' as const,
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

});
