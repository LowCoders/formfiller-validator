/**
 * DependencyGraphBuilder Tests
 */

import { DependencyGraphBuilder } from '../utils/DependencyGraphBuilder';
import { FormConfig } from '../types';

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
            type: 'text',
            name: 'firstName',
            validationRules: [{ type: 'required' }],
          },
          {
            type: 'text',
            name: 'lastName',
            validationRules: [{ type: 'required' }],
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
            type: 'text',
            name: 'country',
          },
          {
            type: 'text',
            name: 'city',
            validationRules: [
              {
                type: 'compare',
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
            type: 'text',
            name: 'hasVehicle',
          },
          {
            type: 'text',
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
            type: 'text',
            name: 'password',
          },
          {
            type: 'text',
            name: 'confirmPassword',
            validationRules: [
              {
                type: 'compare',
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
            type: 'text',
            name: 'level1',
          },
          {
            type: 'text',
            name: 'level2',
            validationRules: [{ type: 'compare', comparisonTarget: 'level1', comparisonType: '>' }],
          },
          {
            type: 'text',
            name: 'level3',
            validationRules: [{ type: 'compare', comparisonTarget: 'level2', comparisonType: '>' }],
          },
        ],
      };

      const graph = builder.build(formConfig);

      expect(graph.levels).toHaveLength(3);
      expect(graph.levels[0]).toContain('level1');
      expect(graph.levels[1]).toContain('level2');
      expect(graph.levels[2]).toContain('level3');
    });

    it('should handle multiple dependencies', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'field1',
          },
          {
            type: 'text',
            name: 'field2',
          },
          {
            type: 'text',
            name: 'field3',
            validationRules: [{ type: 'crossField', targetFields: ['field1', 'field2'] }],
          },
        ],
      };

      const graph = builder.build(formConfig);

      const field3Node = graph.nodes.get('field3');
      expect(field3Node?.dependencies).toContain('field1');
      expect(field3Node?.dependencies).toContain('field2');
      expect(graph.levels[1]).toContain('field3');
    });
  });

  describe('Circular Dependencies', () => {
    it('should detect circular dependencies', () => {
      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'field1',
            validationRules: [
              { type: 'compare', comparisonTarget: 'field2', comparisonType: '==' },
            ],
          },
          {
            type: 'text',
            name: 'field2',
            validationRules: [
              { type: 'compare', comparisonTarget: 'field1', comparisonType: '==' },
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
            type: 'group',
            name: 'testGroup',
            items: [
              {
                type: 'text',
                name: 'groupField1',
              },
              {
                type: 'text',
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
            type: 'tabbed',
            name: 'tabbedGroup',
            items: [
              {
                type: 'tab',
                name: 'tab1',
                tabTitle: 'Tab 1',
                items: [
                  {
                    type: 'text',
                    name: 'tab1Field',
                  },
                ],
              },
              {
                type: 'tab',
                name: 'tab2',
                tabTitle: 'Tab 2',
                items: [
                  {
                    type: 'text',
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
