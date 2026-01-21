/**
 * CrossField Types and ErrorTarget Tests
 *
 * Tests for:
 * - CrossField type format (e.g., equals, sumEquals, atLeastOne)
 * - Automatic targetFields enrichment when rule is defined at field level
 * - errorTarget property for controlling where errors are displayed
 */

import {
  isCrossFieldType,
  getCrossFieldValidatorName,
  enrichCrossFieldRule,
  CROSS_FIELD_TYPES,
} from '../utils/typeGuards.js';
// Note: ValidationRule type import removed - using inline type assertions

describe('CrossField Type Helpers', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // isCrossFieldType
  // ═══════════════════════════════════════════════════════════════════════════

  describe('isCrossFieldType', () => {
    it('should return true for all crossField types', () => {
      const crossFieldTypes = [
        'equals',
        'notEquals',
        'greaterThan',
        'lessThan',
        'sumEquals',
        'percentageSum',
        'dateInRange',
        'atLeastOne',
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
    it('should return correct validator name for equals', () => {
      expect(getCrossFieldValidatorName('equals')).toBe('equals');
    });

    it('should return correct validator name for sumEquals', () => {
      expect(getCrossFieldValidatorName('sumEquals')).toBe('sumEquals');
    });

    it('should return correct validator name for percentageSum', () => {
      expect(getCrossFieldValidatorName('percentageSum')).toBe('percentageSum');
    });

    it('should return correct validator name for dateInRange', () => {
      expect(getCrossFieldValidatorName('dateInRange')).toBe('dateInRange');
    });

    it('should return correct validator name for atLeastOne', () => {
      expect(getCrossFieldValidatorName('atLeastOne')).toBe('atLeastOne');
    });

    it('should return the type as-is for unknown types', () => {
      expect(getCrossFieldValidatorName('unknownType')).toBe('unknownType');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // enrichCrossFieldRule
  // ═══════════════════════════════════════════════════════════════════════════

  describe('enrichCrossFieldRule', () => {
    // Note: equals, notEquals, lessThan, greaterThan, sumEquals are intentionally NOT enriched
    // because currentValue is compared against targetField values
    
    it('should add current field to targetFields for atLeastOne', () => {
      const rule = {
        type: 'atLeastOne' as const,
        targetFields: ['otherField'],
        message: 'At least one field required',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule.targetFields).toContain('currentField');
      expect(enrichedRule.targetFields).toContain('otherField');
      expect(enrichedRule.targetFields?.length).toBe(2);
    });

    it('should NOT add current field for equals (comparison types)', () => {
      const rule = {
        type: 'equals' as const,
        targetFields: ['otherField'],
        message: 'Fields must be equal',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      // equals should NOT be enriched - currentValue is compared against target
      expect(enrichedRule.targetFields).not.toContain('currentField');
      expect(enrichedRule.targetFields?.length).toBe(1);
    });

    it('should not duplicate current field if already in targetFields for atLeastOne', () => {
      const rule = {
        type: 'atLeastOne' as const,
        targetFields: ['currentField', 'otherField'],
        message: 'At least one field required',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule.targetFields?.filter((f) => f === 'currentField').length).toBe(1);
      expect(enrichedRule.targetFields?.length).toBe(2);
    });

    it('should create targetFields array for atLeastOne if undefined', () => {
      const rule = {
        type: 'atLeastOne' as const,
        message: 'At least one field required',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule.targetFields).toBeDefined();
      expect(enrichedRule.targetFields).toContain('currentField');
      expect(enrichedRule.targetFields?.length).toBe(1);
    });

    it('should not modify non-crossField rules', () => {
      const rule = {
        type: 'required' as const,
        message: 'Field is required',
      };

      const enrichedRule = enrichCrossFieldRule(rule, 'currentField');

      expect(enrichedRule).toBe(rule); // Same reference
      expect((enrichedRule as { targetFields?: string[] }).targetFields).toBeUndefined();
    });

    it('should not mutate the original rule for atLeastOne', () => {
      const rule = {
        type: 'atLeastOne' as const,
        targetFields: ['otherField'],
        message: 'At least one required',
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
      expect(CROSS_FIELD_TYPES).toContain('equals');
      expect(CROSS_FIELD_TYPES).toContain('notEquals');
      expect(CROSS_FIELD_TYPES).toContain('greaterThan');
      expect(CROSS_FIELD_TYPES).toContain('lessThan');
      expect(CROSS_FIELD_TYPES).toContain('sumEquals');
      expect(CROSS_FIELD_TYPES).toContain('percentageSum');
      expect(CROSS_FIELD_TYPES).toContain('dateInRange');
      expect(CROSS_FIELD_TYPES).toContain('atLeastOne');
    });

    it('should have correct length', () => {
      expect(CROSS_FIELD_TYPES.length).toBe(8);
    });
  });
});

describe('ErrorTarget Property', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // errorTarget on ValidationRule
  // ═══════════════════════════════════════════════════════════════════════════

  describe('errorTarget values', () => {
    it('should accept currentField as errorTarget', () => {
      const rule = {
        type: 'required',
        message: 'Required field',
        errorTarget: 'currentField',
      };

      expect(rule.errorTarget).toBe('currentField');
    });

    it('should accept allTargetFields as errorTarget', () => {
      const rule = {
        type: 'equals',
        targetFields: ['field1', 'field2'],
        message: 'Fields must match',
        errorTarget: 'allTargetFields',
      };

      expect(rule.errorTarget).toBe('allTargetFields');
    });

    it('should accept array of field paths as errorTarget', () => {
      const rule = {
        type: 'equals',
        targetFields: ['field1', 'field2', 'field3'],
        message: 'Fields must match',
        errorTarget: ['field1', 'field3'], // Only show error on field1 and field3
      };

      expect(Array.isArray(rule.errorTarget)).toBe(true);
      expect(rule.errorTarget).toEqual(['field1', 'field3']);
    });

    it('should allow undefined errorTarget (use defaults)', () => {
      const rule: { type: string; message: string; errorTarget?: string } = {
        type: 'required',
        message: 'Required field',
        // errorTarget not specified - defaults apply
      };

      expect(rule.errorTarget).toBeUndefined();
    });
  });
});
