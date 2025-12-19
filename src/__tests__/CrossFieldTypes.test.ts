/**
 * CrossField Types and ErrorTarget Tests
 *
 * Tests for:
 * - New crossField* type format (e.g., crossFieldEquals, crossFieldSumEquals)
 * - Automatic targetFields enrichment when rule is defined at field level
 * - errorTarget property for controlling where errors are displayed
 */

import {
  isCrossFieldType,
  getCrossFieldValidatorName,
  enrichCrossFieldRule,
  CROSS_FIELD_TYPES,
} from '../utils/typeGuards';
import { ValidationRule } from 'formfiller-schema';

describe('CrossField Type Helpers', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // isCrossFieldType
  // ═══════════════════════════════════════════════════════════════════════════

  describe('isCrossFieldType', () => {
    it('should return true for legacy crossField type', () => {
      expect(isCrossFieldType('crossField')).toBe(true);
    });

    it('should return true for all new crossField types', () => {
      const crossFieldTypes = [
        'crossFieldEquals',
        'crossFieldNotEquals',
        'crossFieldGreaterThan',
        'crossFieldLessThan',
        'crossFieldSumEquals',
        'crossFieldPercentageSum',
        'crossFieldDateInRange',
        'crossFieldAtLeastOne',
        'crossFieldCustom',
      ];

      crossFieldTypes.forEach((type) => {
        expect(isCrossFieldType(type)).toBe(true);
      });
    });

    it('should return false for non-crossField types', () => {
      const otherTypes = ['required', 'email', 'pattern', 'stringLength', 'range', 'numeric', 'compare', 'custom'];

      otherTypes.forEach((type) => {
        expect(isCrossFieldType(type)).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getCrossFieldValidatorName
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getCrossFieldValidatorName', () => {
    it('should return correct validator name for crossFieldEquals', () => {
      expect(getCrossFieldValidatorName('crossFieldEquals')).toBe('equals');
    });

    it('should return correct validator name for crossFieldSumEquals', () => {
      expect(getCrossFieldValidatorName('crossFieldSumEquals')).toBe('validateSumEquals');
    });

    it('should return correct validator name for crossFieldPercentageSum', () => {
      expect(getCrossFieldValidatorName('crossFieldPercentageSum')).toBe('validatePercentageSum');
    });

    it('should return correct validator name for crossFieldDateInRange', () => {
      expect(getCrossFieldValidatorName('crossFieldDateInRange')).toBe('validateDateInRange');
    });

    it('should return correct validator name for crossFieldAtLeastOne', () => {
      expect(getCrossFieldValidatorName('crossFieldAtLeastOne')).toBe('atLeastOneRequired');
    });

    it('should fallback to lowercase name for unknown types', () => {
      expect(getCrossFieldValidatorName('crossFieldUnknown')).toBe('unknown');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // enrichCrossFieldRule
  // ═══════════════════════════════════════════════════════════════════════════

  describe('enrichCrossFieldRule', () => {
    it('should add current field to targetFields if not present', () => {
      const rule: ValidationRule = {
        type: 'crossFieldEquals',
        targetFields: ['otherField'],
        message: 'Fields must be equal',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule.targetFields).toContain('currentField');
      expect(enrichedRule.targetFields).toContain('otherField');
      expect(enrichedRule.targetFields?.length).toBe(2);
    });

    it('should not duplicate current field if already in targetFields', () => {
      const rule: ValidationRule = {
        type: 'crossFieldEquals',
        targetFields: ['currentField', 'otherField'],
        message: 'Fields must be equal',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule.targetFields?.filter((f) => f === 'currentField').length).toBe(1);
      expect(enrichedRule.targetFields?.length).toBe(2);
    });

    it('should create targetFields array if undefined', () => {
      const rule: ValidationRule = {
        type: 'crossFieldEquals',
        message: 'Fields must be equal',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule.targetFields).toBeDefined();
      expect(enrichedRule.targetFields).toContain('currentField');
      expect(enrichedRule.targetFields?.length).toBe(1);
    });

    it('should not modify non-crossField rules', () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule).toBe(rule); // Same reference
      expect(enrichedRule.targetFields).toBeUndefined();
    });

    it('should not mutate the original rule', () => {
      const rule: ValidationRule = {
        type: 'crossFieldEquals',
        targetFields: ['otherField'],
        message: 'Fields must be equal',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(rule.targetFields).toEqual(['otherField']); // Original unchanged
      expect(enrichedRule.targetFields).toEqual(['otherField', 'currentField']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS_FIELD_TYPES constant
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CROSS_FIELD_TYPES constant', () => {
    it('should contain all expected crossField types', () => {
      expect(CROSS_FIELD_TYPES).toContain('crossField');
      expect(CROSS_FIELD_TYPES).toContain('crossFieldEquals');
      expect(CROSS_FIELD_TYPES).toContain('crossFieldSumEquals');
      expect(CROSS_FIELD_TYPES).toContain('crossFieldAtLeastOne');
    });

    it('should have correct length', () => {
      expect(CROSS_FIELD_TYPES.length).toBe(10);
    });
  });
});

describe('ErrorTarget Property', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // errorTarget on ValidationRule
  // ═══════════════════════════════════════════════════════════════════════════

  describe('errorTarget values', () => {
    it('should accept currentField as errorTarget', () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Required field',
        errorTarget: 'currentField',
      };

      expect(rule.errorTarget).toBe('currentField');
    });

    it('should accept allTargetFields as errorTarget', () => {
      const rule: ValidationRule = {
        type: 'crossFieldEquals',
        targetFields: ['field1', 'field2'],
        message: 'Fields must match',
        errorTarget: 'allTargetFields',
      };

      expect(rule.errorTarget).toBe('allTargetFields');
    });

    it('should accept array of field paths as errorTarget', () => {
      const rule: ValidationRule = {
        type: 'crossFieldEquals',
        targetFields: ['field1', 'field2', 'field3'],
        message: 'Fields must match',
        errorTarget: ['field1', 'field3'], // Only show error on field1 and field3
      };

      expect(Array.isArray(rule.errorTarget)).toBe(true);
      expect(rule.errorTarget).toEqual(['field1', 'field3']);
    });

    it('should allow undefined errorTarget (use defaults)', () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Required field',
        // errorTarget not specified - defaults apply
      };

      expect(rule.errorTarget).toBeUndefined();
    });
  });
});
