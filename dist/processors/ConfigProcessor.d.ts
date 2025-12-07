import { ValidationContext } from '../core/ValidationContext';
import { ValidationResult } from '../core/ValidationResult';
import { CallbackRegistry } from '../core/CallbackRegistry';
export declare class ConfigProcessor {
    private readonly conditionalEvaluator;
    private readonly validationConditionEvaluator;
    private readonly joiAdapter;
    private readonly fieldPathBuilder;
    private readonly exactMatchProcessor;
    private readonly arrayMatchProcessor;
    private readonly numericMatchProcessor;
    private readonly keywordMatchProcessor;
    private readonly aggregateProcessor;
    private fieldComputedResults;
    constructor(registry: CallbackRegistry);
    process(context: ValidationContext): Promise<ValidationResult>;
    private processFormLevelComputedRules;
    private processFieldComputedRule;
    private processItem;
    private processNestedItems;
    private evaluateVisibility;
    private evaluateDisabled;
    private evaluateReadonly;
    private evaluateRequired;
    private hasRequiredRule;
    private validateRules;
    private processComputedRule;
    private validateRuleGroup;
    private getDefaultValueForType;
}
//# sourceMappingURL=ConfigProcessor.d.ts.map