"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationConditionEvaluator = void 0;
class ValidationConditionEvaluator {
    conditionalEvaluator;
    constructor(conditionalEvaluator) {
        this.conditionalEvaluator = conditionalEvaluator;
    }
    shouldApplyRule(rule, context) {
        if (!rule.when) {
            return true;
        }
        try {
            return this.conditionalEvaluator.evaluate(rule.when, context);
        }
        catch (error) {
            console.error('Error evaluating validation rule condition:', error, rule);
            return true;
        }
    }
    filterApplicableRules(rules, context) {
        return rules.filter((rule) => this.shouldApplyRule(rule, context));
    }
}
exports.ValidationConditionEvaluator = ValidationConditionEvaluator;
//# sourceMappingURL=ValidationConditionEvaluator.js.map