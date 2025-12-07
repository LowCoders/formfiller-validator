/**
 * ValidationRuleGroup Tests
 *
 * Tests for the new ValidationRuleGroup format with or/and/not properties
 */

import {
  isValidationRule,
  isValidationRuleGroup,
  getGroupRules,
  getGroupOperator,
  getGroupMessage,
} from '../utils/typeGuards';
import { ValidationRule, ValidationRuleGroup } from 'formfiller-schema';

describe('ValidationRuleGroup Type Guards', () => {
  describe('isValidationRuleGroup', () => {
    it('should detect legacy format with operator property', () => {
      const legacyGroup: ValidationRuleGroup = {
        operator: 'or',
        rules: [{ type: 'required', message: 'Field is required' }],
        message: 'At least one must pass',
      };

      expect(isValidationRuleGroup(legacyGroup)).toBe(true);
    });

    it('should detect new format with or property', () => {
      const newGroup: ValidationRuleGroup = {
        or: [
          { type: 'required', message: 'Field is required' },
          { type: 'email', message: 'Valid email required' },
        ],
        groupMessage: 'At least one must pass',
      };

      expect(isValidationRuleGroup(newGroup)).toBe(true);
    });

    it('should detect new format with and property', () => {
      const newGroup: ValidationRuleGroup = {
        and: [
          { type: 'required', message: 'Field is required' },
          { type: 'stringLength', min: 5, message: 'Min 5 chars' },
        ],
        groupMessage: 'All rules must pass',
      };

      expect(isValidationRuleGroup(newGroup)).toBe(true);
    });

    it('should detect new format with not property', () => {
      const newGroup: ValidationRuleGroup = {
        not: { type: 'required', message: 'Field is required' },
        groupMessage: 'Must NOT be filled',
      };

      expect(isValidationRuleGroup(newGroup)).toBe(true);
    });

    it('should not detect ValidationRule as group', () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      expect(isValidationRuleGroup(rule)).toBe(false);
      expect(isValidationRule(rule)).toBe(true);
    });
  });

  describe('getGroupRules', () => {
    it('should get rules from legacy format', () => {
      const legacyGroup: ValidationRuleGroup = {
        operator: 'and',
        rules: [
          { type: 'required', message: 'Required' },
          { type: 'email', message: 'Email' },
        ],
      };

      const rules = getGroupRules(legacyGroup);
      expect(rules).toHaveLength(2);
      expect((rules[0] as ValidationRule).type).toBe('required');
    });

    it('should get rules from new or format', () => {
      const newGroup: ValidationRuleGroup = {
        or: [
          { type: 'required', message: 'Required' },
          { type: 'email', message: 'Email' },
        ],
      };

      const rules = getGroupRules(newGroup);
      expect(rules).toHaveLength(2);
    });

    it('should get rules from new and format', () => {
      const newGroup: ValidationRuleGroup = {
        and: [{ type: 'required', message: 'Required' }],
      };

      const rules = getGroupRules(newGroup);
      expect(rules).toHaveLength(1);
    });

    it('should get rules from new not format (wraps single rule in array)', () => {
      const newGroup: ValidationRuleGroup = {
        not: { type: 'required', message: 'Required' },
      };

      const rules = getGroupRules(newGroup);
      expect(rules).toHaveLength(1);
      expect((rules[0] as ValidationRule).type).toBe('required');
    });
  });

  describe('getGroupOperator', () => {
    it('should get operator from legacy format', () => {
      const group: ValidationRuleGroup = { operator: 'or', rules: [] };
      expect(getGroupOperator(group)).toBe('or');
    });

    it('should get operator from new or format', () => {
      const group: ValidationRuleGroup = { or: [] };
      expect(getGroupOperator(group)).toBe('or');
    });

    it('should get operator from new and format', () => {
      const group: ValidationRuleGroup = { and: [] };
      expect(getGroupOperator(group)).toBe('and');
    });

    it('should get operator from new not format', () => {
      const group: ValidationRuleGroup = { not: { type: 'required' } };
      expect(getGroupOperator(group)).toBe('not');
    });
  });

  describe('getGroupMessage', () => {
    it('should get message from legacy format', () => {
      const group: ValidationRuleGroup = { operator: 'or', rules: [], message: 'Legacy message' };
      expect(getGroupMessage(group)).toBe('Legacy message');
    });

    it('should get message from new format with groupMessage', () => {
      const group: ValidationRuleGroup = { or: [], groupMessage: 'New message' };
      expect(getGroupMessage(group)).toBe('New message');
    });

    it('should prefer groupMessage over message', () => {
      const group: ValidationRuleGroup = {
        or: [],
        groupMessage: 'Preferred',
        message: 'Fallback',
      };
      expect(getGroupMessage(group)).toBe('Preferred');
    });
  });
});

describe('Nested ValidationRuleGroup', () => {
  it('should handle nested groups in new format', () => {
    const complexGroup: ValidationRuleGroup = {
      or: [
        {
          and: [
            { type: 'required', message: 'Required' },
            { type: 'stringLength', min: 5, message: 'Min 5' },
          ],
          groupMessage: 'Inner AND group',
        },
        { type: 'email', message: 'Or just email' },
      ],
      groupMessage: 'Outer OR group',
    };

    expect(isValidationRuleGroup(complexGroup)).toBe(true);

    const outerRules = getGroupRules(complexGroup);
    expect(outerRules).toHaveLength(2);

    // First rule is a nested AND group
    const innerGroup = outerRules[0] as ValidationRuleGroup;
    expect(isValidationRuleGroup(innerGroup)).toBe(true);
    expect(getGroupOperator(innerGroup)).toBe('and');

    const innerRules = getGroupRules(innerGroup);
    expect(innerRules).toHaveLength(2);
  });

  it('should handle NOT with nested group', () => {
    const notGroup: ValidationRuleGroup = {
      not: {
        and: [
          { type: 'crossField', targetFields: ['field1'], crossFieldValidator: 'isNotEmpty' },
          { type: 'crossField', targetFields: ['field2'], crossFieldValidator: 'isNotEmpty' },
        ],
        groupMessage: 'Both fields empty',
      },
      groupMessage: 'At least one field should be empty',
    };

    expect(isValidationRuleGroup(notGroup)).toBe(true);
    expect(getGroupOperator(notGroup)).toBe('not');

    const innerRules = getGroupRules(notGroup);
    expect(innerRules).toHaveLength(1);

    const innerGroup = innerRules[0] as ValidationRuleGroup;
    expect(isValidationRuleGroup(innerGroup)).toBe(true);
    expect(getGroupOperator(innerGroup)).toBe('and');
  });

  describe('Complex Nested Groups', () => {
    it('should handle (A AND B) OR (C AND (D OR E))', () => {
      const complexGroup: ValidationRuleGroup = {
        or: [
          {
            and: [
              { type: 'required', message: 'A required' },
              { type: 'stringLength', min: 5, message: 'B min 5' },
            ],
            groupMessage: 'A AND B',
          },
          {
            and: [
              { type: 'email', message: 'C email' },
              {
                or: [
                  { type: 'pattern', pattern: '^[a-z]+$', message: 'D lowercase' },
                  { type: 'numeric', message: 'E numeric' },
                ],
                groupMessage: 'D OR E',
              },
            ],
            groupMessage: 'C AND (D OR E)',
          },
        ],
        groupMessage: '(A AND B) OR (C AND (D OR E))',
      };

      expect(isValidationRuleGroup(complexGroup)).toBe(true);
      expect(getGroupOperator(complexGroup)).toBe('or');

      const outerRules = getGroupRules(complexGroup);
      expect(outerRules).toHaveLength(2);

      // First branch: A AND B
      const firstBranch = outerRules[0] as ValidationRuleGroup;
      expect(getGroupOperator(firstBranch)).toBe('and');

      // Second branch: C AND (D OR E)
      const secondBranch = outerRules[1] as ValidationRuleGroup;
      expect(getGroupOperator(secondBranch)).toBe('and');
      const secondBranchRules = getGroupRules(secondBranch);
      expect(secondBranchRules).toHaveLength(2);

      // Inner D OR E
      const innerOr = secondBranchRules[1] as ValidationRuleGroup;
      expect(getGroupOperator(innerOr)).toBe('or');
    });

    it('should handle multiple NOT operators: NOT (A OR B) AND NOT C', () => {
      const complexGroup: ValidationRuleGroup = {
        and: [
          {
            not: {
              or: [
                { type: 'crossField', targetFields: ['fieldA'], crossFieldValidator: 'isNotEmpty' },
                { type: 'crossField', targetFields: ['fieldB'], crossFieldValidator: 'isNotEmpty' },
              ],
              groupMessage: 'A OR B',
            },
            groupMessage: 'NOT (A OR B)',
          },
          {
            not: {
              type: 'crossField',
              targetFields: ['fieldC'],
              crossFieldValidator: 'isTrue',
              message: 'C is true',
            },
            groupMessage: 'NOT C',
          },
        ],
        groupMessage: 'NOT (A OR B) AND NOT C',
      };

      expect(isValidationRuleGroup(complexGroup)).toBe(true);
      expect(getGroupOperator(complexGroup)).toBe('and');

      const rules = getGroupRules(complexGroup);
      expect(rules).toHaveLength(2);

      // Both should be NOT groups
      expect(getGroupOperator(rules[0] as ValidationRuleGroup)).toBe('not');
      expect(getGroupOperator(rules[1] as ValidationRuleGroup)).toBe('not');
    });
  });

  describe('Mixed Operators with CrossField', () => {
    it('should handle OR group with multiple crossField validators', () => {
      const orGroup: ValidationRuleGroup = {
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
      };

      expect(isValidationRuleGroup(orGroup)).toBe(true);
      expect(getGroupOperator(orGroup)).toBe('or');

      const rules = getGroupRules(orGroup);
      expect(rules).toHaveLength(3);

      // All should be crossField rules
      rules.forEach((rule) => {
        if (isValidationRule(rule)) {
          expect((rule as any).type).toBe('crossField');
        }
      });
    });
  });

  describe('stopOnFirstError flag', () => {
    it('should include stopOnFirstError in AND group', () => {
      const andGroup: ValidationRuleGroup = {
        and: [
          { type: 'required', message: 'Required' },
          { type: 'stringLength', min: 5, message: 'Min 5' },
        ],
        groupMessage: 'All conditions',
        stopOnFirstError: true,
      };

      expect(andGroup.stopOnFirstError).toBe(true);
    });

    it('should include stopOnFirstError in OR group', () => {
      const orGroup: ValidationRuleGroup = {
        or: [
          { type: 'email', message: 'Email' },
          { type: 'pattern', pattern: '^[0-9]+$', message: 'Numeric' },
        ],
        groupMessage: 'Email OR numeric',
        stopOnFirstError: false,
      };

      expect(orGroup.stopOnFirstError).toBe(false);
    });
  });

  describe('Empty Groups', () => {
    it('should handle empty OR array', () => {
      const emptyOr: ValidationRuleGroup = {
        or: [],
        groupMessage: 'Empty OR',
      };

      expect(isValidationRuleGroup(emptyOr)).toBe(true);
      expect(getGroupOperator(emptyOr)).toBe('or');
      expect(getGroupRules(emptyOr)).toHaveLength(0);
    });

    it('should handle empty AND array', () => {
      const emptyAnd: ValidationRuleGroup = {
        and: [],
        groupMessage: 'Empty AND',
      };

      expect(isValidationRuleGroup(emptyAnd)).toBe(true);
      expect(getGroupOperator(emptyAnd)).toBe('and');
      expect(getGroupRules(emptyAnd)).toHaveLength(0);
    });
  });

  describe('Invalid Structures', () => {
    it('should not recognize object without operator properties', () => {
      const invalidGroup: any = {
        groupMessage: 'No operator',
        rules: [],
      };

      expect(isValidationRuleGroup(invalidGroup)).toBe(false);
    });

    it('should recognize single validation rule', () => {
      const singleRule: any = {
        type: 'required',
        message: 'Required',
      };

      expect(isValidationRuleGroup(singleRule)).toBe(false);
      expect(isValidationRule(singleRule)).toBe(true);
    });
  });
});
