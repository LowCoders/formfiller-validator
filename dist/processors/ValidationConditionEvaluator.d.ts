import { ValidationRule } from 'formfiller-schema';
import { ValidationContext } from '../core/ValidationContext';
import { ConditionalEvaluator } from './ConditionalEvaluator';
export declare class ValidationConditionEvaluator {
    private conditionalEvaluator;
    constructor(conditionalEvaluator: ConditionalEvaluator);
    shouldApplyRule(rule: ValidationRule, context: ValidationContext): boolean;
    filterApplicableRules(rules: ValidationRule[], context: ValidationContext): ValidationRule[];
}
//# sourceMappingURL=ValidationConditionEvaluator.d.ts.map