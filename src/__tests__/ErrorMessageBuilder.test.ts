/**
 * ErrorMessageBuilder Tests
 *
 * Tests for the error message builder utility functions
 * that create hierarchical path labels for validation errors.
 */

import {
  buildPathLabels,
  formatPathLabels,
  buildTargetFieldLabels,
  formatErrorWithFieldRefs,
  getLabelText,
} from '../utils/errorMessageBuilder';
import { FieldConfig } from 'formfiller-schema';

describe('ErrorMessageBuilder', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // getLabelText
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getLabelText', () => {
    it('should return label string when label is a string', () => {
      const config = { type: 'text', name: 'field1', label: 'Field Label' } as FieldConfig;
      expect(getLabelText(config)).toBe('Field Label');
    });

    it('should return label.text when label is an object', () => {
      const config = { type: 'text', name: 'field1', label: { text: 'Label Text' } } as FieldConfig;
      expect(getLabelText(config)).toBe('Label Text');
    });

    it('should return caption when label is not available', () => {
      const config = { type: 'group', name: 'group1', caption: 'Group Caption' } as FieldConfig;
      expect(getLabelText(config)).toBe('Group Caption');
    });

    it('should return name when no label or caption', () => {
      const config = { type: 'text', name: 'field1' } as FieldConfig;
      expect(getLabelText(config)).toBe('field1');
    });

    it('should return undefined for empty config', () => {
      expect(getLabelText({} as FieldConfig)).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // buildPathLabels
  // ═══════════════════════════════════════════════════════════════════════════

  describe('buildPathLabels', () => {
    it('should build labels for simple field path', () => {
      const fieldConfigMap = new Map<string, FieldConfig>([
        ['email', { type: 'text', name: 'email', label: 'Email cím' } as FieldConfig],
      ]);

      const labels = buildPathLabels('email', fieldConfigMap);

      expect(labels).toEqual(['Email cím']);
    });

    it('should build labels for nested field path', () => {
      const fieldConfigMap = new Map<string, FieldConfig>([
        ['personalData', { type: 'group', name: 'personalData', caption: 'Személyes adatok' } as FieldConfig],
        ['personalData.address', { type: 'group', name: 'address', caption: 'Lakcím' } as FieldConfig],
        ['personalData.address.street', { type: 'text', name: 'street', label: 'Utca' } as FieldConfig],
      ]);

      const labels = buildPathLabels('personalData.address.street', fieldConfigMap);

      expect(labels).toEqual(['Személyes adatok', 'Lakcím', 'Utca']);
    });

    it('should use path segment when config not found', () => {
      const fieldConfigMap = new Map<string, FieldConfig>([
        ['group', { type: 'group', name: 'group', caption: 'Csoport' } as FieldConfig],
        // group.field not in map
      ]);

      const labels = buildPathLabels('group.unknownField', fieldConfigMap);

      expect(labels).toEqual(['Csoport', 'unknownField']);
    });

    it('should handle empty field config map', () => {
      const fieldConfigMap = new Map<string, FieldConfig>();

      const labels = buildPathLabels('some.nested.path', fieldConfigMap);

      expect(labels).toEqual(['some', 'nested', 'path']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // formatPathLabels
  // ═══════════════════════════════════════════════════════════════════════════

  describe('formatPathLabels', () => {
    it('should format labels with default separator', () => {
      const labels = ['Személyes adatok', 'Lakcím', 'Utca'];

      const formatted = formatPathLabels(labels);

      expect(formatted).toBe('Személyes adatok > Lakcím > Utca');
    });

    it('should format labels with custom separator', () => {
      const labels = ['Level 1', 'Level 2', 'Level 3'];

      const formatted = formatPathLabels(labels, ' → ');

      expect(formatted).toBe('Level 1 → Level 2 → Level 3');
    });

    it('should handle single label', () => {
      const labels = ['Single Label'];

      const formatted = formatPathLabels(labels);

      expect(formatted).toBe('Single Label');
    });

    it('should handle empty array', () => {
      const labels: string[] = [];

      const formatted = formatPathLabels(labels);

      expect(formatted).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // buildTargetFieldLabels
  // ═══════════════════════════════════════════════════════════════════════════

  describe('buildTargetFieldLabels', () => {
    it('should build labels for multiple target fields', () => {
      const fieldConfigMap = new Map<string, FieldConfig>([
        ['sum', { type: 'group', name: 'sum', caption: 'Összeg' } as FieldConfig],
        ['sum.base', { type: 'number', name: 'base', label: 'Alap' } as FieldConfig],
        ['sum.extra', { type: 'number', name: 'extra', label: 'Extra' } as FieldConfig],
        ['sum.total', { type: 'number', name: 'total', label: 'Összesen' } as FieldConfig],
      ]);

      const targetFields = ['sum.base', 'sum.extra', 'sum.total'];
      const result = buildTargetFieldLabels(targetFields, fieldConfigMap);

      expect(result).toEqual([
        { path: 'sum.base', pathLabels: ['Összeg', 'Alap'] },
        { path: 'sum.extra', pathLabels: ['Összeg', 'Extra'] },
        { path: 'sum.total', pathLabels: ['Összeg', 'Összesen'] },
      ]);
    });

    it('should handle empty target fields', () => {
      const fieldConfigMap = new Map<string, FieldConfig>();

      const result = buildTargetFieldLabels([], fieldConfigMap);

      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // formatErrorWithFieldRefs
  // ═══════════════════════════════════════════════════════════════════════════

  describe('formatErrorWithFieldRefs', () => {
    it('should format error message with target field references', () => {
      const targetFieldLabels = [
        { path: 'sum.base', pathLabels: ['Összeg', 'Alap'] },
        { path: 'sum.extra', pathLabels: ['Összeg', 'Extra'] },
      ];

      const message = formatErrorWithFieldRefs('Az összegnek egyeznie kell', targetFieldLabels);

      expect(message).toBe('Az összegnek egyeznie kell (Összeg > Alap, Összeg > Extra)');
    });

    it('should return base message when no target fields', () => {
      const message = formatErrorWithFieldRefs('Az érték kötelező', []);

      expect(message).toBe('Az érték kötelező');
    });

    it('should return base message when target fields undefined', () => {
      const message = formatErrorWithFieldRefs('Az érték kötelező', undefined as any);

      expect(message).toBe('Az érték kötelező');
    });
  });
});
