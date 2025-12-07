"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalEvaluator = void 0;
class ConditionalEvaluator {
    evaluate(expression, context) {
        if (Array.isArray(expression)) {
            return expression.every((cond) => this.evaluate(cond, context));
        }
        if (typeof expression === 'object' && expression !== null) {
            if ('and' in expression && expression.and) {
                const andArray = Array.isArray(expression.and) ? expression.and : [expression.and];
                return andArray.every((expr) => this.evaluate(expr, context));
            }
            if ('or' in expression && expression.or) {
                const orArray = Array.isArray(expression.or) ? expression.or : [expression.or];
                return orArray.some((expr) => this.evaluate(expr, context));
            }
            if ('not' in expression && expression.not) {
                return !this.evaluate(expression.not, context);
            }
            if ('field' in expression && 'operator' in expression && 'value' in expression) {
                const fieldValue = context.getValue(expression.field);
                return this.compareValues(fieldValue, expression.value, expression.operator);
            }
            const keys = Object.keys(expression);
            if (keys.length === 1 && keys[0] && !['and', 'or', 'not'].includes(keys[0])) {
                const fieldName = keys[0];
                const expectedValue = expression[fieldName];
                const actualValue = context.getValue(fieldName);
                if (Array.isArray(expectedValue)) {
                    if (expectedValue.length === 2 && typeof expectedValue[0] === 'string') {
                        const operator = expectedValue[0];
                        const value = expectedValue[1];
                        if ([
                            '==',
                            '!=',
                            '>',
                            '<',
                            '>=',
                            '<=',
                            'in',
                            'notIn',
                            'contains',
                            'startswith',
                            'endswith',
                        ].includes(operator)) {
                            return this.compareValues(actualValue, value, operator);
                        }
                    }
                    return expectedValue.includes(actualValue);
                }
                return actualValue == expectedValue;
            }
        }
        return true;
    }
    compareValues(fieldValue, compareValue, operator) {
        switch (operator) {
            case '==':
                return fieldValue == compareValue;
            case '!=':
                return fieldValue != compareValue;
            case '>':
                return fieldValue > compareValue;
            case '<':
                return fieldValue < compareValue;
            case '>=':
                return fieldValue >= compareValue;
            case '<=':
                return fieldValue <= compareValue;
            case 'in':
                if (Array.isArray(compareValue)) {
                    return compareValue.includes(fieldValue);
                }
                return false;
            case 'notIn':
                if (Array.isArray(compareValue)) {
                    return !compareValue.includes(fieldValue);
                }
                return true;
            case 'contains':
                if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
                    return fieldValue.includes(compareValue);
                }
                if (Array.isArray(fieldValue)) {
                    return fieldValue.includes(compareValue);
                }
                return false;
            case 'startswith':
                if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
                    return fieldValue.startsWith(compareValue);
                }
                return false;
            case 'endswith':
                if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
                    return fieldValue.endsWith(compareValue);
                }
                return false;
            default:
                console.warn(`Unknown comparison operator: ${operator}`);
                return false;
        }
    }
}
exports.ConditionalEvaluator = ConditionalEvaluator;
//# sourceMappingURL=ConditionalEvaluator.js.map