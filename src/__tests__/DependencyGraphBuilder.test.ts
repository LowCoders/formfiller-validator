/**
 * DependencyGraphBuilder Tests
 */

import { DependencyGraphBuilder } from '../utils/DependencyGraphBuilder.js';
import { FormConfig } from '../types/index.js';

describe('DependencyGraphBuilder', () => {
  let builder: DependencyGraphBuilder;

  beforeEach(() => {
    builder = new DependencyGraphBuilder();
  });

  describe('Simple Dependencies', () => {
    it('should build graph for independent fields', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text' as const,
            name: 'firstName',
            validationRules: [{ type: 'required' as const }],
          },
          {
            type: 'text' as const,
            name: 'lastName',
            validationRules: [{ type: 'required' as const }],
          },
        ],
      };

      const graph = builder.build(formConfig);

      expect(graph.nodes.size).toBe(2);
      expect(graph.levels).toHaveLength(1);
      expect(graph.levels[0]).toEqual(['firstName', 'lastName']);
      expect(graph.hasCircular).toBe(false);
    });

    it('should detect dependencies from compare rules', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text' as const,
            name: 'country',
          },
          {
            type: 'text' as const,
            name: 'city',
            validationRules: [
              {
                type: 'compare' as const,
                comparisonTarget: 'country',
                comparisonType: '!=',
                message: 'City cannot be same as country',
              },
            ],
          },
        ],
      };

      const graph = builder.build(formConfig);

      expect(graph.nodes.size).toBe(2);
      expect(graph.levels).toHaveLength(2);
      expect(graph.levels[0]).toContain('country');
      expect(graph.levels[1]).toContain('city');

      const cityNode = graph.nodes.get('city');
      expect(cityNode?.dependencies).toContain('country');
    });

    it('should detect dependencies from conditional expressions', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text' as const,
            name: 'hasVehicle',
          },
          {
            type: 'text' as const,
            name: 'vehiclePlateNumber',
            visibleIf: {
              field: 'hasVehicle',
              operator: '==',
              value: true,
            },
          },
        ],
      };

      const graph = builder.build(formConfig);

      const plateNode = graph.nodes.get('vehiclePlateNumber');
      expect(plateNode?.dependencies).toContain('hasVehicle');
    });

    it('should detect dependencies from compare rules', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text' as const,
            name: 'password',
          },
          {
            type: 'text' as const,
            name: 'confirmPassword',
            validationRules: [
              {
                type: 'compare' as const,
                comparisonTarget: 'password',
                comparisonType: '==',
              },
            ],
          },
        ],
      };

      const graph = builder.build(formConfig);

      const confirmNode = graph.nodes.get('confirmPassword');
      expect(confirmNode?.dependencies).toContain('password');
    });
  });

  describe('Complex Dependencies', () => {
    it('should handle multi-level dependencies', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text' as const,
            name: 'level1',
          },
          {
            type: 'text' as const,
            name: 'level2',
            validationRules: [{ type: 'compare' as const, comparisonTarget: 'level1', comparisonType: '>' }],
          },
          {
            type: 'text' as const,
            name: 'level3',
            validationRules: [{ type: 'compare' as const, comparisonTarget: 'level2', comparisonType: '>' }],
          },
        ],
      };

      const graph = builder.build(formConfig);

      expect(graph.levels).toHaveLength(3);
      expect(graph.levels[0]).toContain('level1');
      expect(graph.levels[1]).toContain('level2');
      expect(graph.levels[2]).toContain('level3');
    });

  });

  describe('Circular Dependencies', () => {
    it('should detect circular dependencies', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text' as const,
            name: 'field1',
            validationRules: [
              { type: 'compare' as const, comparisonTarget: 'field2', comparisonType: '==' },
            ],
          },
          {
            type: 'text' as const,
            name: 'field2',
            validationRules: [
              { type: 'compare' as const, comparisonTarget: 'field1', comparisonType: '==' },
            ],
          },
        ],
      };

      const graph = builder.build(formConfig);

      expect(graph.hasCircular).toBe(true);
      expect(graph.circularPaths).toBeDefined();
      expect(graph.circularPaths?.length).toBeGreaterThan(0);
    });
  });

  describe('Nested Structures', () => {
    it('should handle nested group items', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'group' as const,
            name: 'testGroup',
            items: [
              {
                type: 'text' as const,
                name: 'groupField1',
              },
              {
                type: 'text' as const,
                name: 'groupField2',
              },
            ],
          },
        ],
      };

      const graph = builder.build(formConfig);

      // Note: testGroup is also a node (container fields with name property are nodes)
      expect(graph.nodes.size).toBe(3); // testGroup, groupField1, groupField2
      const field2Node = graph.nodes.get('groupField2');
      expect(field2Node?.dependencies.length).toBe(0); // No dependencies, fields are siblings
    });

    it('should handle tabbed items', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'tabbed' as const,
            name: 'tabbedGroup',
            items: [
              {
                type: 'tab' as const,
                name: 'tab1',
                tabTitle: 'Tab 1',
                items: [
                  {
                    type: 'text' as const,
                    name: 'tab1Field',
                  },
                ],
              },
              {
                type: 'tab' as const,
                name: 'tab2',
                tabTitle: 'Tab 2',
                items: [
                  {
                    type: 'text' as const,
                    name: 'tab2Field',
                  },
                ],
              },
            ],
          },
        ],
      };

      const graph = builder.build(formConfig);

      // TabbedFieldConfig és TabFieldConfig is kapnak name-t,
      // így ők is node-ok lesznek (bár nem data field-ek)
      // Várható node-ok: tabbedGroup, tab1, tab2, tab1Field, tab2Field
      expect(graph.nodes.size).toBe(5);
      expect(graph.nodes.has('tabbedGroup')).toBe(true);
      expect(graph.nodes.has('tab1')).toBe(true);
      expect(graph.nodes.has('tab2')).toBe(true);
      expect(graph.nodes.has('tab1Field')).toBe(true);
      expect(graph.nodes.has('tab2Field')).toBe(true);

      // Ebben a tesztben nincs explicit függőség
      const tab2Node = graph.nodes.get('tab2Field');
      expect(tab2Node?.dependencies).toEqual([]);
    });
  });
});
