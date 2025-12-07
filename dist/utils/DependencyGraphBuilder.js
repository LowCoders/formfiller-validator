"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyGraphBuilder = void 0;
const typeHelpers_1 = require("./typeHelpers");
const FieldPathBuilder_1 = require("./FieldPathBuilder");
class DependencyGraphBuilder {
    fieldPathBuilder;
    constructor() {
        this.fieldPathBuilder = new FieldPathBuilder_1.FieldPathBuilder();
    }
    build(formConfig) {
        const nodes = new Map();
        this.extractFields(formConfig.items || [], nodes, '');
        this.buildDependencies(nodes);
        const levels = this.calculateLevels(nodes);
        const { hasCircular, circularPaths } = this.detectCircularDependencies(nodes);
        return {
            nodes,
            levels,
            hasCircular,
            circularPaths,
        };
    }
    extractFields(items, nodes, parentPath = '') {
        for (const item of items) {
            const fieldName = (0, typeHelpers_1.getFieldName)(item);
            if (fieldName) {
                const fieldPath = this.fieldPathBuilder.buildPath(item, parentPath);
                if (!nodes.has(fieldName)) {
                    nodes.set(fieldName, {
                        id: fieldName,
                        field: fieldName,
                        path: fieldPath,
                        dependencies: [],
                        dependents: [],
                        level: 0,
                        rules: (item.validationRules || []),
                    });
                }
                const node = nodes.get(fieldName);
                this.extractDependenciesFromConditionals(item, node);
                this.extractDependenciesFromRules(item, node);
            }
            const nestedItems = (0, typeHelpers_1.getNestedItems)(item);
            if (nestedItems) {
                const nextPath = this.fieldPathBuilder.getNextParentPath(item, parentPath);
                this.extractFields(nestedItems, nodes, nextPath);
            }
        }
    }
    extractDependenciesFromConditionals(item, node) {
        const conditions = [item.visibleIf, item.disabledIf, item.readonlyIf, item.requiredIf];
        for (const condition of conditions) {
            if (!condition)
                continue;
            const fields = this.extractFieldsFromCondition(condition);
            for (const field of fields) {
                if (!node.dependencies.includes(field)) {
                    node.dependencies.push(field);
                }
            }
        }
    }
    extractFieldsFromCondition(condition) {
        const fields = [];
        if (Array.isArray(condition)) {
            for (const cond of condition) {
                fields.push(...this.extractFieldsFromCondition(cond));
            }
        }
        else if (typeof condition === 'object') {
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
    extractDependenciesFromRules(item, node) {
        if (!item.validationRules)
            return;
        for (const ruleOrGroup of item.validationRules) {
            this.extractDependenciesFromRuleOrGroup(ruleOrGroup, node);
        }
    }
    extractDependenciesFromRuleOrGroup(ruleOrGroup, node) {
        const { isValidationRule, isValidationRuleGroup } = require('./typeGuards');
        if (isValidationRule(ruleOrGroup)) {
            const rule = ruleOrGroup;
            if (rule.type === 'compare' && rule.comparisonTarget) {
                if (!node.dependencies.includes(rule.comparisonTarget)) {
                    node.dependencies.push(rule.comparisonTarget);
                }
            }
            if (rule.type === 'crossField' && rule.targetFields) {
                for (const targetField of rule.targetFields) {
                    if (!node.dependencies.includes(targetField)) {
                        node.dependencies.push(targetField);
                    }
                }
            }
        }
        else if (isValidationRuleGroup(ruleOrGroup)) {
            const group = ruleOrGroup;
            const { getGroupRules } = require('./typeGuards');
            const nestedRules = getGroupRules(group);
            for (const nestedRule of nestedRules) {
                this.extractDependenciesFromRuleOrGroup(nestedRule, node);
            }
        }
    }
    buildDependencies(nodes) {
        for (const node of nodes.values()) {
            for (const depField of node.dependencies) {
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
                const depNode = nodes.get(depField);
                if (!depNode.dependents.includes(node.field)) {
                    depNode.dependents.push(node.field);
                }
            }
        }
    }
    calculateLevels(nodes) {
        const levels = [];
        const visited = new Set();
        const nodesCopy = new Map(nodes);
        const inDegree = new Map();
        for (const [id, node] of nodesCopy) {
            inDegree.set(id, node.dependencies.length);
        }
        while (visited.size < nodesCopy.size) {
            const currentLevel = [];
            for (const [id, degree] of inDegree) {
                if (!visited.has(id) && degree === 0) {
                    currentLevel.push(id);
                }
            }
            if (currentLevel.length === 0) {
                break;
            }
            levels.push(currentLevel);
            for (const id of currentLevel) {
                visited.add(id);
                const node = nodesCopy.get(id);
                if (node) {
                    node.level = levels.length - 1;
                    for (const dependentId of node.dependents) {
                        const currentDegree = inDegree.get(dependentId) || 0;
                        inDegree.set(dependentId, currentDegree - 1);
                    }
                }
            }
        }
        return levels;
    }
    detectCircularDependencies(nodes) {
        const visited = new Set();
        const recursionStack = new Set();
        const circularPaths = [];
        const dfs = (nodeId, path) => {
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
                    }
                    else if (recursionStack.has(depId)) {
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
exports.DependencyGraphBuilder = DependencyGraphBuilder;
//# sourceMappingURL=DependencyGraphBuilder.js.map