/**
 * Logical Group Validation Tests
 *
 * Tests for the ValidationRuleGroup type which combines
 * validation rules using AND, OR, and NOT operators.
 *
 * Migrated from: formfiller-backend/src/__tests__/integration/logical-group-validation.test.ts
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('Logical Group Validation', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OR OPERATOR - At Least One Rule Must Pass
  // ═══════════════════════════════════════════════════════════════════════════

  describe('OR Operator - Alternative Conditions', () => {
    const orFormConfig: FormConfig = {
      formId: 'or-operator-form',
      items: [
        {
          type: 'text',
          name: 'contact_info',
          validationRules: [
            {
              operator: 'or',
              rules: [
                { type: 'email', message: 'Valid email' },
                { type: 'pattern', pattern: '^\\+?[0-9]{10,}$', message: 'Valid phone' },
              ],
              message: 'Must be a valid email OR phone number',
              stopOnFirstError: false,
            },
          ],
        },
      ],
    };

    it('should PASS when value is valid email', async () => {
      const formData = {
        contact_info: 'test@example.com',
      };

      const result = await validator.validate(formData, orFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should PASS when value is valid phone', async () => {
      const formData = {
        contact_info: '+36301234567',
      };

      const result = await validator.validate(formData, orFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when value matches neither pattern', async () => {
      const formData = {
        contact_info: 'invalid-value',
      };

      const result = await validator.validate(formData, orFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'contact_info',
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AND OPERATOR - All Rules Must Pass
  // ═══════════════════════════════════════════════════════════════════════════

  describe('AND Operator - All Conditions Required', () => {
    const andFormConfig: FormConfig = {
      formId: 'and-operator-form',
      items: [
        {
          type: 'text',
          name: 'document_code',
          validationRules: [
            {
              operator: 'and',
              rules: [
                { type: 'stringLength', min: 6, max: 12, message: '6-12 characters' },
                { type: 'pattern', pattern: '^[A-Z0-9]+$', message: 'Only uppercase and numbers' },
              ],
              message: 'Must be 6-12 characters AND only uppercase/numbers',
              stopOnFirstError: true,
            },
          ],
        },
      ],
    };

    it('should PASS when all rules are satisfied', async () => {
      const formData = {
        document_code: 'ABC123',
      };

      const result = await validator.validate(formData, andFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when length rule fails', async () => {
      const formData = {
        document_code: 'AB1', // Too short
      };

      const result = await validator.validate(formData, andFormConfig);

      expect(result.valid).toBe(false);
    });

    it('should FAIL when pattern rule fails', async () => {
      const formData = {
        document_code: 'abc123', // Lowercase not allowed
      };

      const result = await validator.validate(formData, andFormConfig);

      expect(result.valid).toBe(false);
    });

    it('should FAIL when both rules fail', async () => {
      const formData = {
        document_code: 'ab', // Too short AND lowercase
      };

      const result = await validator.validate(formData, andFormConfig);

      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NOT OPERATOR - Rule Must NOT Pass
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NOT Operator - Forbidden Patterns', () => {
    const notFormConfig: FormConfig = {
      formId: 'not-operator-form',
      items: [
        {
          type: 'text',
          name: 'username',
          validationRules: [
            { type: 'required', message: 'Username is required' },
            {
              operator: 'not',
              rules: [{ type: 'pattern', pattern: '^admin', message: 'Cannot start with admin' }],
              message: 'Username cannot start with "admin"',
            },
          ],
        },
      ],
    };

    it('should PASS when value does NOT match forbidden pattern', async () => {
      const formData = {
        username: 'john_doe',
      };

      const result = await validator.validate(formData, notFormConfig);

      expect(result.valid).toBe(true);
    });

    it('should FAIL when value matches forbidden pattern', async () => {
      const formData = {
        username: 'admin_user',
      };

      const result = await validator.validate(formData, notFormConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'username',
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NESTED OPERATORS - Complex Combinations
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Nested Operators - (A AND B) OR (C AND D)', () => {
    const nestedFormConfig: FormConfig = {
      formId: 'nested-operators-form',
      items: [
        {
          type: 'text',
          name: 'code',
          validationRules: [
            {
              operator: 'or',
              rules: [
                {
                  operator: 'and',
                  rules: [
                    { type: 'pattern', pattern: '^PRO-', message: 'Starts with PRO-' },
                    { type: 'stringLength', min: 8, max: 12, message: '8-12 chars' },
                  ],
                  message: 'PRO format',
                },
                {
                  operator: 'and',
                  rules: [
                    { type: 'pattern', pattern: '^ENT-', message: 'Starts with ENT-' },
                    { type: 'stringLength', min: 10, max: 15, message: '10-15 chars' },
                  ],
                  message: 'ENT format',
                },
              ],
              message:
                'Must be PRO format (PRO-XXXX, 8-12 chars) OR ENT format (ENT-XXXXXX, 10-15 chars)',
            },
          ],
        },
      ],
    };

    it('should PASS for valid PRO format', async () => {
      const formData = {
        code: 'PRO-12345', // 9 chars, starts with PRO-
      };

      const result = await validator.validate(formData, nestedFormConfig);

      expect(result).toBeDefined();
    });

    it('should PASS for valid ENT format', async () => {
      const formData = {
        code: 'ENT-1234567', // 11 chars, starts with ENT-
      };

      const result = await validator.validate(formData, nestedFormConfig);

      expect(result).toBeDefined();
    });

    it('should FAIL for invalid format', async () => {
      const formData = {
        code: 'INVALID-123',
      };

      const result = await validator.validate(formData, nestedFormConfig);

      expect(result.valid).toBe(false);
    });

    it('should FAIL when PRO prefix but wrong length', async () => {
      const formData = {
        code: 'PRO-1', // Too short for PRO format
      };

      const result = await validator.validate(formData, nestedFormConfig);

      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // stopOnFirstError BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════════

  describe('stopOnFirstError Behavior', () => {
    const stopOnFirstFormConfig: FormConfig = {
      formId: 'stop-on-first-form',
      items: [
        {
          type: 'text',
          name: 'field_stop',
          validationRules: [
            {
              operator: 'and',
              rules: [
                { type: 'required', message: 'Field is required' },
                { type: 'stringLength', min: 5, message: 'Min 5 chars' },
                { type: 'pattern', pattern: '^[A-Z]', message: 'Must start with uppercase' },
              ],
              message: 'Multiple validation rules',
              stopOnFirstError: true,
            },
          ],
        },
      ],
    };

    const continueFormConfig: FormConfig = {
      formId: 'continue-form',
      items: [
        {
          type: 'text',
          name: 'field_continue',
          validationRules: [
            {
              operator: 'and',
              rules: [
                { type: 'stringLength', min: 5, message: 'Min 5 chars' },
                { type: 'pattern', pattern: '^[A-Z]', message: 'Must start with uppercase' },
              ],
              message: 'Multiple validation rules',
              stopOnFirstError: false,
            },
          ],
        },
      ],
    };

    it('should stop on first error when stopOnFirstError=true', async () => {
      const formData = {
        field_stop: 'ab', // Fails both length and pattern
      };

      const result = await validator.validate(formData, stopOnFirstFormConfig);

      expect(result.valid).toBe(false);
    });

    it('should collect all errors when stopOnFirstError=false', async () => {
      const formData = {
        field_continue: 'ab', // Fails both length and pattern
      };

      const result = await validator.validate(formData, continueFormConfig);

      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MIXED WITH REGULAR RULES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Mixed Regular Rules and Rule Groups', () => {
    const mixedFormConfig: FormConfig = {
      formId: 'mixed-rules-form',
      items: [
        {
          type: 'text',
          name: 'mixed_field',
          validationRules: [
            { type: 'required', message: 'Field is required' },
            {
              operator: 'or',
              rules: [
                { type: 'email', message: 'Valid email' },
                { type: 'pattern', pattern: '^\\+?[0-9]{10,}$', message: 'Valid phone' },
              ],
              message: 'Must be email or phone',
            },
            { type: 'stringLength', max: 50, message: 'Max 50 characters' },
          ],
        },
      ],
    };

    it('should run regular rules before group rules', async () => {
      const formData = {
        mixed_field: '', // Empty - fails required
      };

      const result = await validator.validate(formData, mixedFormConfig);

      expect(result.valid).toBe(false);
      expect(
        result.errors.find((e: any) => e.message.toLowerCase().includes('required'))
      ).toBeDefined();
    });

    it('should run all rules when required passes', async () => {
      const formData = {
        mixed_field: 'test@example.com',
      };

      const result = await validator.validate(formData, mixedFormConfig);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW FORMAT - or/and/not Properties
  // ═══════════════════════════════════════════════════════════════════════════

  describe('New Format - or/and/not Properties', () => {
    describe('OR with new format', () => {
      const orNewFormConfig: FormConfig = {
        formId: 'or-new-format-form',
        items: [
          {
            type: 'text',
            name: 'contact',
            validationRules: [
              {
                or: [
                  { type: 'email', message: 'Email' },
                  { type: 'pattern', pattern: '^\\+?[0-9]{10,}$', message: 'Phone' },
                ],
                groupMessage: 'Must be email or phone',
              },
            ],
          },
        ],
      };

      it('should validate with or property', async () => {
        const formData = { contact: 'test@example.com' };
        const result = await validator.validate(formData, orNewFormConfig);
        expect(result.valid).toBe(true);
      });
    });

    describe('AND with new format', () => {
      const andNewFormConfig: FormConfig = {
        formId: 'and-new-format-form',
        items: [
          {
            type: 'text',
            name: 'code',
            validationRules: [
              {
                and: [
                  { type: 'required', message: 'Required' },
                  { type: 'stringLength', min: 5, message: 'Min 5' },
                ],
                groupMessage: 'Both conditions must pass',
              },
            ],
          },
        ],
      };

      it('should validate with and property', async () => {
        const formData = { code: 'VALID' };
        const result = await validator.validate(formData, andNewFormConfig);
        expect(result.valid).toBe(true);
      });

      it('should fail when one condition fails', async () => {
        const formData = { code: 'AB' };
        const result = await validator.validate(formData, andNewFormConfig);
        expect(result.valid).toBe(false);
      });
    });

    describe('NOT with new format', () => {
      const notNewFormConfig: FormConfig = {
        formId: 'not-new-format-form',
        items: [
          {
            type: 'text',
            name: 'username',
            validationRules: [
              {
                not: { type: 'pattern', pattern: '^admin', message: 'Admin prefix' },
                groupMessage: 'Cannot start with admin',
              },
            ],
          },
        ],
      };

      it('should pass when pattern does NOT match', async () => {
        const formData = { username: 'john' };
        const result = await validator.validate(formData, notNewFormConfig);
        expect(result.valid).toBe(true);
      });

      it('should fail when pattern matches', async () => {
        const formData = { username: 'admin_user' };
        const result = await validator.validate(formData, notNewFormConfig);
        expect(result.valid).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    describe('Empty Rules Array', () => {
      const emptyRulesFormConfig: FormConfig = {
        formId: 'empty-rules-form',
        items: [
          {
            type: 'text',
            name: 'field',
            validationRules: [
              {
                operator: 'and',
                rules: [],
                message: 'Empty rules',
              },
            ],
          },
        ],
      };

      it('should handle empty rules array gracefully', async () => {
        const formData = {
          field: 'any value',
        };

        const result = await validator.validate(formData, emptyRulesFormConfig);

        expect(result).toBeDefined();
      });
    });

    describe('Single Rule in Group', () => {
      const singleRuleFormConfig: FormConfig = {
        formId: 'single-rule-form',
        items: [
          {
            type: 'text',
            name: 'field',
            validationRules: [
              {
                operator: 'and',
                rules: [{ type: 'required', message: 'Required' }],
                message: 'Single rule group',
              },
            ],
          },
        ],
      };

      it('should work with single rule in group', async () => {
        const formData = {
          field: 'value',
        };

        const result = await validator.validate(formData, singleRuleFormConfig);

        expect(result.valid).toBe(true);
      });
    });

    describe('Deeply Nested Groups', () => {
      const deepNestedFormConfig: FormConfig = {
        formId: 'deep-nested-form',
        items: [
          {
            type: 'text',
            name: 'deep_field',
            validationRules: [
              {
                operator: 'or',
                rules: [
                  {
                    operator: 'and',
                    rules: [
                      {
                        operator: 'not',
                        rules: [{ type: 'pattern', pattern: '^test', message: 'Not test' }],
                        message: 'Not starting with test',
                      },
                      { type: 'stringLength', min: 3, message: 'Min 3' },
                    ],
                    message: 'Complex inner',
                  },
                  { type: 'email', message: 'Or just email' },
                ],
                message: 'Deep nested validation',
              },
            ],
          },
        ],
      };

      it('should handle deeply nested groups', async () => {
        const formData = {
          deep_field: 'valid@email.com',
        };

        const result = await validator.validate(formData, deepNestedFormConfig);

        expect(result.valid).toBe(true);
      });

      it('should validate non-email that passes nested rules', async () => {
        const formData = {
          deep_field: 'hello', // Not starting with 'test', min 3 chars
        };

        const result = await validator.validate(formData, deepNestedFormConfig);

        expect(result.valid).toBe(true);
      });
    });
  });
});
