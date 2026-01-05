import { ValidationRule } from 'formfiller-schema';
import { ClientValidationContext } from './ClientValidationContext.js';
import { ClientConditionalEvaluator } from './ClientConditionalEvaluator.js';
export declare class ClientValidationConditionEvaluator {
    private conditionalEvaluator;
    constructor(conditionalEvaluator: ClientConditionalEvaluator);
    shouldApplyRule(rule: ValidationRule, context: ClientValidationContext): boolean;
    filterApplicableRules(rules: ValidationRule[], context: ClientValidationContext): ValidationRule[];
}
//# sourceMappingURL=ClientValidationConditionEvaluator.d.ts.map