/**
 * DependencyGraphBuilder - Build dependency graph for validation execution
 *
 * Analyzes form configuration and builds a dependency graph for parallel execution
 */

import { FormConfig, DependencyGraph, DependencyNode } from '../types';
import { FieldConfig } from 'formfiller-schema';
import { getNestedItems, getFieldName } from './typeHelpers';
import { FieldPathBuilder } from './FieldPathBuilder';

export class DependencyGraphBuilder {
  private readonly fieldPathBuilder: FieldPathBuilder;

  constructor() {
    this.fieldPathBuilder = new FieldPathBuilder();
  }

  /**
   * Build dependency graph from form configuration
   */
  build(formConfig: FormConfig): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();

    // Extract all fields and their dependencies with path support
    this.extractFields(formConfig.items || [], nodes, '');

    // Build dependency relationships
    this.buildDependencies(nodes);

    // Calculate levels for parallel execution
    const levels = this.calculateLevels(nodes);

    // Check for circular dependencies
    const { hasCircular, circularPaths } = this.detectCircularDependencies(nodes);

    return {
      nodes,
      levels,
      hasCircular,
      circularPaths,
    };
  }

  /**
   * Extract all fields from form items
   *
   * @param items - Array of field configurations
   * @param nodes - Map to populate with dependency nodes
   * @param parentPath - Parent path for nested fields
   */
  private extractFields(
    items: FieldConfig[],
    nodes: Map<string, DependencyNode>,
    parentPath: string = ''
  ): void {
    for (const item of items) {
      const fieldName = getFieldName(item);

      // Process field if it has a name
      if (fieldName) {
        // Build full field path with excludeFromPath support (for validation)
        const fieldPath = this.fieldPathBuilder.buildPath(item, parentPath);

        // Use field NAME as key in dependency graph (not path)
        // This is because dependencies reference field names, not paths
        if (!nodes.has(fieldName)) {
          nodes.set(fieldName, {
            id: fieldName,
            field: fieldName,
            path: fieldPath, // Store the full path separately for reference
            dependencies: [],
            dependents: [],
            level: 0,
            rules: (item.validationRules || []) as any, // Type narrowing needed
          });
        }

        // Add dependencies from conditional expressions
        const node = nodes.get(fieldName)!;
        this.extractDependenciesFromConditionals(item, node);

        // Add dependencies from validation rules
        this.extractDependenciesFromRules(item, node);
      }

      // Process nested items (works for both group and tabbed items)
      // TabbedFieldConfig.items contains TabFieldConfig[] elements
      // Each TabFieldConfig also has items property, so recursive processing handles it
      const nestedItems = getNestedItems(item);
      if (nestedItems) {
        const nextPath = this.fieldPathBuilder.getNextParentPath(item, parentPath);
        this.extractFields(nestedItems, nodes, nextPath);
      }
    }
  }

  /**
   * Extract dependencies from conditional expressions
   */
  private extractDependenciesFromConditionals(item: FieldConfig, node: DependencyNode): void {
    const conditions = [item.visibleIf, item.disabledIf, item.readonlyIf, item.requiredIf];

    for (const condition of conditions) {
      if (!condition) continue;

      const fields = this.extractFieldsFromCondition(condition);
      for (const field of fields) {
        if (!node.dependencies.includes(field)) {
          node.dependencies.push(field);
        }
      }
    }
  }

  /**
   * Extract field names from conditional expression
   */
  private extractFieldsFromCondition(condition: any): string[] {
    const fields: string[] = [];

    if (Array.isArray(condition)) {
      for (const cond of condition) {
        fields.push(...this.extractFieldsFromCondition(cond));
      }
    } else if (typeof condition === 'object') {
      if (condition.field) {
        fields.push(condition.field);
      }
      if (condition.and) {
        fields.push(...this.extractFieldsFromCondition(condition.and));
      }
      if (condition.or) {
        fields.push(...this.extractFieldsFromCondition(condition.or));
      }
      if (condition.not) {
        fields.push(...this.extractFieldsFromCondition(condition.not));
      }
    }

    return fields;
  }

  /**
   * Extract dependencies from validation rules
   */
  private extractDependenciesFromRules(item: FieldConfig, node: DependencyNode): void {
    if (!item.validationRules) return;

    for (const ruleOrGroup of item.validationRules) {
      this.extractDependenciesFromRuleOrGroup(ruleOrGroup, node);
    }
  }

  /**
   * Extract dependencies from a single rule or group
   */
  private extractDependenciesFromRuleOrGroup(
    ruleOrGroup: import('formfiller-schema').ValidationRuleOrGroup,
    node: DependencyNode
  ): void {
    const { isValidationRule, isValidationRuleGroup } = require('./typeGuards');

    if (isValidationRule(ruleOrGroup)) {
      const rule = ruleOrGroup as import('formfiller-schema').ValidationRule;
      // Extract from compare rules
      if (rule.type === 'compare' && rule.comparisonTarget) {
        if (!node.dependencies.includes(rule.comparisonTarget)) {
          node.dependencies.push(rule.comparisonTarget);
        }
      }

      // Extract from crossField rules
      if (rule.type === 'crossField' && rule.targetFields) {
        for (const targetField of rule.targetFields) {
          if (!node.dependencies.includes(targetField)) {
            node.dependencies.push(targetField);
          }
        }
      }
    } else if (isValidationRuleGroup(ruleOrGroup)) {
      const group = ruleOrGroup as import('formfiller-schema').ValidationRuleGroup;
      const { getGroupRules } = require('./typeGuards');
      // Recursively process grouped rules
      const nestedRules = getGroupRules(group);
      for (const nestedRule of nestedRules) {
        this.extractDependenciesFromRuleOrGroup(nestedRule, node);
      }
    }
  }

  /**
   * Build bidirectional dependency relationships
   */
  private buildDependencies(nodes: Map<string, DependencyNode>): void {
    for (const node of nodes.values()) {
      for (const depField of node.dependencies) {
        // Create dependency node if doesn't exist
        if (!nodes.has(depField)) {
          nodes.set(depField, {
            id: depField,
            field: depField,
            dependencies: [],
            dependents: [],
            level: 0,
            rules: [],
          });
        }

        // Add this node as dependent of the dependency
        const depNode = nodes.get(depField)!;
        if (!depNode.dependents.includes(node.field)) {
          depNode.dependents.push(node.field);
        }
      }
    }
  }

  /**
   * Calculate execution levels for parallel execution
   */
  private calculateLevels(nodes: Map<string, DependencyNode>): string[][] {
    const levels: string[][] = [];
    const visited = new Set<string>();
    const nodesCopy = new Map(nodes);

    // Calculate in-degree (number of dependencies)
    const inDegree = new Map<string, number>();
    for (const [id, node] of nodesCopy) {
      inDegree.set(id, node.dependencies.length);
    }

    // Process nodes level by level
    while (visited.size < nodesCopy.size) {
      const currentLevel: string[] = [];

      // Find all nodes with in-degree 0 (no unprocessed dependencies)
      for (const [id, degree] of inDegree) {
        if (!visited.has(id) && degree === 0) {
          currentLevel.push(id);
        }
      }

      if (currentLevel.length === 0) {
        // No progress possible - circular dependency or error
        break;
      }

      // Add current level
      levels.push(currentLevel);

      // Mark nodes as visited and update in-degrees
      for (const id of currentLevel) {
        visited.add(id);
        const node = nodesCopy.get(id);
        if (node) {
          node.level = levels.length - 1;

          // Decrease in-degree of dependents
          for (const dependentId of node.dependents) {
            const currentDegree = inDegree.get(dependentId) || 0;
            inDegree.set(dependentId, currentDegree - 1);
          }
        }
      }
    }

    return levels;
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(nodes: Map<string, DependencyNode>): {
    hasCircular: boolean;
    circularPaths?: string[][];
  } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularPaths: string[][] = [];

    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            if (dfs(depId, [...path])) {
              return true;
            }
          } else if (recursionStack.has(depId)) {
            // Found circular dependency
            const cycleStart = path.indexOf(depId);
            const cyclePath = path.slice(cycleStart);
            cyclePath.push(depId);
            circularPaths.push(cyclePath);
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return {
      hasCircular: circularPaths.length > 0,
      circularPaths: circularPaths.length > 0 ? circularPaths : undefined,
    };
  }
}
