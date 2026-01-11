import { ValidationRule, ValidationRuleOrGroup } from 'formfiller-schema';
import { ClientValidationContext } from './ClientValidationContext.js';
import { ClientValidationResult } from './ClientValidationResult.js';
export declare class ClientValidator {
    private conditionalEvaluator;
    private validationConditionEvaluator;
    private callbackRegistry;
    constructor();
    validate(fieldName: string, value: any, rules: ValidationRuleOrGroup[], formData: Record<string, any>): Promise<ClientValidationResult>;
    validateRuleOrGroup(fieldName: string, value: any, ruleOrGroup: ValidationRuleOrGroup, context: ClientValidationContext): {
        valid: boolean;
        message: string;
        ruleType: string;
        params?: Record<string, any>;
        errorTarget?: 'currentField' | 'allTargetFields' | string[];
        targetFields?: string[];
    };
    private validateRuleGroup;
    shouldApplyRule(rule: ValidationRule, formData: Record<string, any>): boolean;
    validateRule(_fieldName: string, value: any, rule: ValidationRule, context: ClientValidationContext): boolean;
    private validateCrossField;
    private validateCompare;
    hasCrossFieldValidator(validatorName: string | undefined): boolean;
    getAvailableCrossFieldValidators(): string[];
    private validateRequired;
    private validateEmail;
    private validateNumeric;
    private validateStringLength;
    private validateArrayLength;
    private validateRange;
    private validatePattern;
    private getDefaultMessage;
}
//# sourceMappingURL=ClientValidator.d.ts.map