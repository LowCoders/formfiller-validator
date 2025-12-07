/**
 * Type Guards Tests
 *
 * Tests for validation rule type guards and utility functions.
 */

import {
  isValidationRule,
  isValidationRuleGroup,
  getGroupRules,
  getGroupOperator,
  getGroupMessage,
  flattenValidationRules,
  extractFieldReferences,
  extractConditionalFields,
} from '../utils/typeGuards';
import { ValidationRule, ValidationRuleGroup, ValidationRuleOrGroup } from 'formfiller-schema';

describe('typeGuards', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // isValidationRule
  // ═══════════════════════════════════════════════════════════════════════════

  describe('isValidationRule', () => {
    it('should return true for validation rule with type', () => {
      const rule: ValidationRule = { type: 'required', message: 'Required' };
      expect(isValidationRule(rule)).toBe(true);
    });

    it('should return true for complex validation rule', () => {
      const rule: ValidationRule = {
        type: 'stringLength',
        min: 5,
        max: 100,
        message: 'Length must be 5-100',
      };
      expect(isValidationRule(rule)).toBe(true);
    });

    it('should return false for rule group (legacy format)', () => {
      const group: ValidationRuleGroup = {
        operator: 'or',
        rules: [{ type: 'required' }],
      };
      expect(isValidationRule(group)).toBe(false);
    });

    it('should return false for rule group (new format)', () => {
      const group: ValidationRuleGroup = {
        or: [{ type: 'required' }],
      };
      expect(isValidationRule(group)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // isValidationRuleGroup
  // ═══════════════════════════════════════════════════════════════════════════

  describe('isValidationRuleGroup', () => {
    describe('Legacy format', () => {
      it('should return true for legacy OR group', () => {
        const group: ValidationRuleGroup = {
          operator: 'or',
          rules: [{ type: 'required' }],
        };
        expect(isValidationRuleGroup(group)).toBe(true);
      });

      it('should return true for legacy AND group', () => {
        const group: ValidationRuleGroup = {
          operator: 'and',
          rules: [{ type: 'required' }],
        };
        expect(isValidationRuleGroup(group)).toBe(true);
      });

      it('should return true for legacy NOT group', () => {
        const group: ValidationRuleGroup = {
          operator: 'not',
          rules: [{ type: 'required' }],
        };
        expect(isValidationRuleGroup(group)).toBe(true);
      });
    });

    describe('New format', () => {
      it('should return true for new OR format', () => {
        const group: ValidationRuleGroup = {
          or: [{ type: 'required' }],
        };
        expect(isValidationRuleGroup(group)).toBe(true);
      });

      it('should return true for new AND format', () => {
        const group: ValidationRuleGroup = {
          and: [{ type: 'required' }],
        };
        expect(isValidationRuleGroup(group)).toBe(true);
      });

      it('should return true for new NOT format', () => {
        const group: ValidationRuleGroup = {
          not: { type: 'required' },
        };
        expect(isValidationRuleGroup(group)).toBe(true);
      });
    });

    it('should return false for validation rule', () => {
      const rule: ValidationRule = { type: 'required' };
      expect(isValidationRuleGroup(rule)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getGroupRules
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getGroupRules', () => {
    it('should get rules from legacy format', () => {
      const group: ValidationRuleGroup = {
        operator: 'or',
        rules: [{ type: 'required' }, { type: 'email' }],
      };

      const rules = getGroupRules(group);
      expect(rules).toHaveLength(2);
      expect(rules[0]).toEqual({ type: 'required' });
    });

    it('should get rules from new OR format', () => {
      const group: ValidationRuleGroup = {
        or: [{ type: 'required' }, { type: 'email' }],
      };

      const rules = getGroupRules(group);
      expect(rules).toHaveLength(2);
    });

    it('should get rules from new AND format', () => {
      const group: ValidationRuleGroup = {
        and: [{ type: 'required' }, { type: 'email' }],
      };

      const rules = getGroupRules(group);
      expect(rules).toHaveLength(2);
    });

    it('should wrap NOT rule in array', () => {
      const group: ValidationRuleGroup = {
        not: { type: 'required' },
      };

      const rules = getGroupRules(group);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toEqual({ type: 'required' });
    });

    it('should return empty array for invalid group', () => {
      const group = {} as ValidationRuleGroup;

      const rules = getGroupRules(group);
      expect(rules).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getGroupOperator
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getGroupOperator', () => {
    it('should return operator from legacy format', () => {
      expect(getGroupOperator({ operator: 'or', rules: [] })).toBe('or');
      expect(getGroupOperator({ operator: 'and', rules: [] })).toBe('and');
      expect(getGroupOperator({ operator: 'not', rules: [] })).toBe('not');
    });

    it('should detect operator from new format', () => {
      expect(getGroupOperator({ or: [] })).toBe('or');
      expect(getGroupOperator({ and: [] })).toBe('and');
      expect(getGroupOperator({ not: { type: 'required' } })).toBe('not');
    });

    it('should default to AND for unknown format', () => {
      const group = {} as ValidationRuleGroup;
      expect(getGroupOperator(group)).toBe('and');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getGroupMessage
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getGroupMessage', () => {
    it('should return groupMessage if present', () => {
      const group: ValidationRuleGroup = {
        or: [{ type: 'required' }],
        groupMessage: 'Group message',
      };

      expect(getGroupMessage(group)).toBe('Group message');
    });

    it('should return message as fallback', () => {
      const group = {
        or: [{ type: 'required' }],
        message: 'Fallback message',
      } as ValidationRuleGroup;

      expect(getGroupMessage(group)).toBe('Fallback message');
    });

    it('should return undefined if no message', () => {
      const group: ValidationRuleGroup = {
        or: [{ type: 'required' }],
      };

      expect(getGroupMessage(group)).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // flattenValidationRules
  // ═══════════════════════════════════════════════════════════════════════════

  describe('flattenValidationRules', () => {
    it('should return rules as-is when no groups', () => {
      const rules: ValidationRuleOrGroup[] = [{ type: 'required' }, { type: 'email' }];

      const flattened = flattenValidationRules(rules);
      expect(flattened).toHaveLength(2);
    });

    it('should flatten nested groups', () => {
      const rules: ValidationRuleOrGroup[] = [
        { type: 'required' },
        {
          or: [{ type: 'email' }, { type: 'pattern', pattern: '^[0-9]+$' }],
        },
      ];

      const flattened = flattenValidationRules(rules);
      expect(flattened).toHaveLength(3);
      expect(flattened.map((r) => r.type)).toContain('required');
      expect(flattened.map((r) => r.type)).toContain('email');
      expect(flattened.map((r) => r.type)).toContain('pattern');
    });

    it('should handle deeply nested groups', () => {
      const rules: ValidationRuleOrGroup[] = [
        {
          and: [
            { type: 'required' },
            {
              or: [
                { type: 'email' },
                {
                  and: [
                    { type: 'pattern', pattern: '^[A-Z]' },
                    { type: 'stringLength', min: 5 },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const flattened = flattenValidationRules(rules);
      expect(flattened).toHaveLength(4);
    });

    it('should handle empty array', () => {
      const flattened = flattenValidationRules([]);
      expect(flattened).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // extractFieldReferences
  // ═══════════════════════════════════════════════════════════════════════════

  describe('extractFieldReferences', () => {
    it('should extract crossField target fields', () => {
      const rules: ValidationRuleOrGroup[] = [
        {
          type: 'crossField',
          targetFields: ['email', 'phone'],
          crossFieldValidator: 'atLeastOneRequired',
        },
      ];

      const fields = extractFieldReferences(rules);
      expect(fields).toContain('email');
      expect(fields).toContain('phone');
    });

    it('should extract comparisonTarget field', () => {
      const rules: ValidationRuleOrGroup[] = [
        {
          type: 'compare',
          comparisonTarget: 'password',
          comparisonType: '==',
        },
      ];

      const fields = extractFieldReferences(rules);
      expect(fields).toContain('password');
    });

    it('should extract fields from when condition', () => {
      const rules: ValidationRuleOrGroup[] = [
        {
          type: 'required',
          when: { status: 'active' },
        },
      ];

      const fields = extractFieldReferences(rules);
      expect(fields).toContain('status');
    });

    it('should extract fields from nested groups', () => {
      const rules: ValidationRuleOrGroup[] = [
        {
          or: [
            {
              type: 'crossField',
              targetFields: ['field1'],
              crossFieldValidator: 'isNotEmpty',
            },
            {
              type: 'compare',
              comparisonTarget: 'field2',
              comparisonType: '==',
            },
          ],
        },
      ];

      const fields = extractFieldReferences(rules);
      expect(fields).toContain('field1');
      expect(fields).toContain('field2');
    });

    it('should return unique fields', () => {
      const rules: ValidationRuleOrGroup[] = [
        {
          type: 'crossField',
          targetFields: ['email'],
          crossFieldValidator: 'isNotEmpty',
        },
        {
          type: 'crossField',
          targetFields: ['email', 'phone'],
          crossFieldValidator: 'atLeastOneRequired',
        },
      ];

      const fields = extractFieldReferences(rules);
      expect(fields.filter((f) => f === 'email')).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // extractConditionalFields
  // ═══════════════════════════════════════════════════════════════════════════

  describe('extractConditionalFields', () => {
    it('should extract field from simple equality', () => {
      const expression = { status: 'active' };
      const fields = extractConditionalFields(expression);

      expect(fields).toContain('status');
    });

    it('should extract field from implicit in (array)', () => {
      const expression = { color: ['red', 'blue', 'green'] };
      const fields = extractConditionalFields(expression);

      expect(fields).toContain('color');
    });

    it('should extract field from explicit operator format', () => {
      const expression = { age: ['>=', 18] };
      const fields = extractConditionalFields(expression);

      expect(fields).toContain('age');
    });

    it('should extract fields from AND condition', () => {
      const expression = {
        and: [{ status: 'active' }, { age: ['>=', 18] }],
      };
      const fields = extractConditionalFields(expression);

      expect(fields).toContain('status');
      expect(fields).toContain('age');
    });

    it('should extract fields from OR condition', () => {
      const expression = {
        or: [{ role: 'admin' }, { role: 'moderator' }],
      };
      const fields = extractConditionalFields(expression);

      expect(fields).toContain('role');
    });

    it('should extract fields from NOT condition', () => {
      const expression = {
        not: { deleted: true },
      };
      const fields = extractConditionalFields(expression);

      expect(fields).toContain('deleted');
    });

    it('should extract fields from nested conditions', () => {
      const expression = {
        and: [
          { status: 'active' },
          {
            or: [
              { role: 'admin' },
              {
                not: { banned: true },
              },
            ],
          },
        ],
      };
      const fields = extractConditionalFields(expression);

      expect(fields).toContain('status');
      expect(fields).toContain('role');
      expect(fields).toContain('banned');
    });

    it('should return empty array for null/undefined', () => {
      expect(extractConditionalFields(null as any)).toEqual([]);
      expect(extractConditionalFields(undefined as any)).toEqual([]);
    });

    it('should return empty array for non-object', () => {
      expect(extractConditionalFields('string' as any)).toEqual([]);
      expect(extractConditionalFields(123 as any)).toEqual([]);
    });

    it('should not include logical operators as fields', () => {
      const expression = {
        and: [{ status: 'active' }],
        or: [{ role: 'admin' }],
      };
      const fields = extractConditionalFields(expression);

      expect(fields).not.toContain('and');
      expect(fields).not.toContain('or');
      expect(fields).not.toContain('not');
    });
  });
});
