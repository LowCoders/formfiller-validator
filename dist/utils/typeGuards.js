"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidationRule = isValidationRule;
exports.isValidationRuleGroup = isValidationRuleGroup;
exports.getGroupRules = getGroupRules;
exports.getGroupOperator = getGroupOperator;
exports.getGroupMessage = getGroupMessage;
exports.flattenValidationRules = flattenValidationRules;
exports.extractFieldReferences = extractFieldReferences;
exports.extractConditionalFields = extractConditionalFields;
function isValidationRule(rule) {
    return 'type' in rule && typeof rule.type === 'string';
}
function isValidationRuleGroup(rule) {
    const group = rule;
    if ('operator' in group &&
        ('and' === group.operator || 'or' === group.operator || 'not' === group.operator)) {
        return true;
    }
    if ('or' in group || 'and' in group || 'not' in group) {
        if (!('type' in rule)) {
            return true;
        }
    }
    return false;
}
function getGroupRules(group) {
    if (group.rules && Array.isArray(group.rules)) {
        return group.rules;
    }
    if (group.or && Array.isArray(group.or)) {
        return group.or;
    }
    if (group.and && Array.isArray(group.and)) {
        return group.and;
    }
    if (group.not) {
        return [group.not];
    }
    return [];
}
function getGroupOperator(group) {
    if (group.operator) {
        return group.operator;
    }
    if ('or' in group)
        return 'or';
    if ('and' in group)
        return 'and';
    if ('not' in group)
        return 'not';
    return 'and';
}
function getGroupMessage(group) {
    return group.groupMessage || group.message;
}
function flattenValidationRules(rules) {
    const result = [];
    for (const rule of rules) {
        if (isValidationRule(rule)) {
            result.push(rule);
        }
        else if (isValidationRuleGroup(rule)) {
            const nestedRules = getGroupRules(rule);
            result.push(...flattenValidationRules(nestedRules));
        }
    }
    return result;
}
function extractFieldReferences(rules) {
    const fields = new Set();
    for (const rule of rules) {
        if (isValidationRule(rule)) {
            if (rule.targetFields) {
                rule.targetFields.forEach((f) => fields.add(f));
            }
            if (rule.comparisonTarget) {
                fields.add(rule.comparisonTarget);
            }
            if (rule.when) {
                const whenFields = extractConditionalFields(rule.when);
                whenFields.forEach((f) => fields.add(f));
            }
        }
        else if (isValidationRuleGroup(rule)) {
            const nestedRules = getGroupRules(rule);
            const nestedFields = extractFieldReferences(nestedRules);
            nestedFields.forEach((f) => fields.add(f));
        }
    }
    return Array.from(fields);
}
function extractConditionalFields(expression) {
    const fields = new Set();
    if (typeof expression !== 'object' || expression === null) {
        return [];
    }
    if ('and' in expression && Array.isArray(expression.and)) {
        expression.and.forEach((expr) => {
            extractConditionalFields(expr).forEach((f) => fields.add(f));
        });
        return Array.from(fields);
    }
    if ('or' in expression && Array.isArray(expression.or)) {
        expression.or.forEach((expr) => {
            extractConditionalFields(expr).forEach((f) => fields.add(f));
        });
        return Array.from(fields);
    }
    if ('not' in expression && expression.not) {
        extractConditionalFields(expression.not).forEach((f) => fields.add(f));
        return Array.from(fields);
    }
    const keys = Object.keys(expression);
    for (const key of keys) {
        if (key !== 'and' && key !== 'or' && key !== 'not') {
            fields.add(key);
        }
    }
    return Array.from(fields);
}
//# sourceMappingURL=typeGuards.js.map