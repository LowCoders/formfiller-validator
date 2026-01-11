import { ClientValidationContext } from './ClientValidationContext.js';
import { ClientValidationResult } from './ClientValidationResult.js';
import { ClientConditionalEvaluator } from './ClientConditionalEvaluator.js';
import { ClientValidationConditionEvaluator } from './ClientValidationConditionEvaluator.js';
import { getClientRegistry } from './ClientCallbackRegistry.js';
import { isValidationRule, isValidationRuleGroup, getGroupRules, getGroupOperator, getGroupMessage, isCrossFieldType, enrichCrossFieldRule, } from '../utils/typeGuards.js';
export class ClientValidator {
    conditionalEvaluator;
    validationConditionEvaluator;
    callbackRegistry;
    constructor() {
        this.conditionalEvaluator = new ClientConditionalEvaluator();
        this.validationConditionEvaluator = new ClientValidationConditionEvaluator(this.conditionalEvaluator);
        this.callbackRegistry = getClientRegistry();
    }
    async validate(fieldName, value, rules, formData) {
        const result = new ClientValidationResult();
        const context = new ClientValidationContext(formData);
        for (const ruleOrGroup of rules) {
            const validationResult = this.validateRuleOrGroup(fieldName, value, ruleOrGroup, context);
            if (!validationResult.valid) {
                result.addError(fieldName, validationResult.message, validationResult.ruleType, validationResult.params);
            }
        }
        return result;
    }
    validateRuleOrGroup(fieldName, value, ruleOrGroup, context) {
        if (isValidationRuleGroup(ruleOrGroup)) {
            return this.validateRuleGroup(fieldName, value, ruleOrGroup, context);
        }
        if (isValidationRule(ruleOrGroup)) {
            let rule = ruleOrGroup;
            if (!this.validationConditionEvaluator.shouldApplyRule(rule, context)) {
                return { valid: true, message: '', ruleType: rule.type };
            }
            const isCrossField = isCrossFieldType(rule.type);
            console.log(`[ClientValidator] Field: ${fieldName}, Type: ${rule.type}, isCrossField: ${isCrossField}`);
            if (isCrossField) {
                rule = enrichCrossFieldRule(rule, fieldName);
                console.log(`[ClientValidator] Enriched targetFields:`, rule.targetFields);
            }
            const isValid = this.validateRule(fieldName, value, rule, context);
            console.log(`[ClientValidator] validateRule result: ${isValid}`);
            return {
                valid: isValid,
                message: rule.message || this.getDefaultMessage(rule.type),
                ruleType: rule.type,
                params: { min: rule.min, max: rule.max, pattern: rule.pattern },
                errorTarget: rule.errorTarget,
                targetFields: rule.targetFields,
            };
        }
        return { valid: true, message: '', ruleType: 'unknown' };
    }
    validateRuleGroup(fieldName, value, group, context) {
        const operator = getGroupOperator(group);
        const rules = getGroupRules(group);
        const groupMessage = getGroupMessage(group) || 'Validation group failed';
        if (!operator || !rules || rules.length === 0) {
            return { valid: true, message: '', ruleType: 'group' };
        }
        const results = rules.map((rule) => {
            return this.validateRuleOrGroup(fieldName, value, rule, context);
        });
        let isValid;
        let errorTarget;
        let targetFields;
        switch (operator) {
            case 'and':
                isValid = results.every((r) => r.valid);
                if (!isValid) {
                    const failedResult = results.find((r) => !r.valid);
                    if (failedResult) {
                        errorTarget = failedResult.errorTarget;
                        targetFields = failedResult.targetFields;
                    }
                }
                break;
            case 'or':
                isValid = results.some((r) => r.valid);
                break;
            case 'not':
                isValid = results.length > 0 && results[0] ? !results[0].valid : true;
                break;
            default:
                isValid = true;
        }
        return {
            valid: isValid,
            message: groupMessage,
            ruleType: 'group',
            params: { operator },
            errorTarget,
            targetFields,
        };
    }
    shouldApplyRule(rule, formData) {
        const context = new ClientValidationContext(formData);
        return this.validationConditionEvaluator.shouldApplyRule(rule, context);
    }
    validateRule(_fieldName, value, rule, context) {
        switch (rule.type) {
            case 'required':
                return this.validateRequired(value);
            case 'email':
                return this.validateEmail(value);
            case 'numeric':
                return this.validateNumeric(value);
            case 'stringLength':
                return this.validateStringLength(value, rule.min, rule.max);
            case 'arrayLength':
                return this.validateArrayLength(value, rule.min, rule.max);
            case 'range':
                return this.validateRange(value, rule.min, rule.max);
            case 'pattern':
                return this.validatePattern(value, rule.pattern);
            case 'equals':
            case 'notEquals':
            case 'greaterThan':
            case 'lessThan':
            case 'sumEquals':
            case 'percentageSum':
            case 'dateInRange':
            case 'atLeastOne':
                return this.validateCrossField(value, rule, context);
            case 'compare':
                return this.validateCompare(value, rule, context);
            default:
                console.warn(`ClientValidator: Unknown rule type '${rule.type}' - skipping`);
                return true;
        }
    }
    validateCrossField(value, rule, context) {
        if (!rule.targetFields) {
            console.log(`[ClientValidator] validateCrossField: No targetFields, returning true`);
            return true;
        }
        const validatorName = rule.type;
        if (!this.callbackRegistry.has(validatorName)) {
            console.warn(`ClientValidator: CrossField validator '${validatorName}' not found in client registry - skipping`);
            return true;
        }
        const values = {
            _currentValue: value,
        };
        for (const targetField of rule.targetFields) {
            values[targetField] = context.getValue(targetField);
        }
        console.log(`[ClientValidator] validateCrossField: ${validatorName}, values:`, values);
        const result = this.callbackRegistry.execute(validatorName, values);
        console.log(`[ClientValidator] validateCrossField result: ${result}`);
        return result;
    }
    validateCompare(value, rule, context) {
        if (value === '' || value === null || value === undefined) {
            return true;
        }
        if (!rule.comparisonTarget) {
            return true;
        }
        const targetValue = context.getValue(rule.comparisonTarget);
        const comparisonType = rule.comparisonType || '==';
        switch (comparisonType) {
            case '==':
                return value == targetValue;
            case '!=':
                return value != targetValue;
            case '>':
                return value > targetValue;
            case '<':
                return value < targetValue;
            case '>=':
                return value >= targetValue;
            case '<=':
                return value <= targetValue;
            default:
                return value == targetValue;
        }
    }
    hasCrossFieldValidator(validatorName) {
        return this.callbackRegistry.has(validatorName);
    }
    getAvailableCrossFieldValidators() {
        return this.callbackRegistry.getRegisteredNames();
    }
    validateRequired(value) {
        if (value === null || value === undefined) {
            return false;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return false;
        }
        if (Array.isArray(value) && value.length === 0) {
            return false;
        }
        return true;
    }
    validateEmail(value) {
        if (value === '' || value === null || value === undefined) {
            return true;
        }
        if (typeof value !== 'string') {
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }
    validateNumeric(value) {
        if (value === '' || value === null || value === undefined) {
            return true;
        }
        const num = Number(value);
        return !isNaN(num) && isFinite(num);
    }
    validateStringLength(value, min, max) {
        if (value === '' || value === null || value === undefined) {
            return true;
        }
        if (typeof value !== 'string') {
            return false;
        }
        const length = value.length;
        if (min !== undefined && length < min) {
            return false;
        }
        if (max !== undefined && length > max) {
            return false;
        }
        return true;
    }
    validateArrayLength(value, min, max) {
        if (value === null || value === undefined) {
            return true;
        }
        if (!Array.isArray(value)) {
            return false;
        }
        const length = value.length;
        if (min !== undefined && length < min) {
            return false;
        }
        if (max !== undefined && length > max) {
            return false;
        }
        return true;
    }
    validateRange(value, min, max) {
        if (value === '' || value === null || value === undefined) {
            return true;
        }
        const num = Number(value);
        if (isNaN(num) || !isFinite(num)) {
            return false;
        }
        if (min !== undefined && num < min) {
            return false;
        }
        if (max !== undefined && num > max) {
            return false;
        }
        return true;
    }
    validatePattern(value, pattern) {
        if (value === '' || value === null || value === undefined) {
            return true;
        }
        if (typeof value !== 'string') {
            return false;
        }
        if (!pattern) {
            return true;
        }
        try {
            const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
            return regex.test(value);
        }
        catch (error) {
            console.error('Invalid regex pattern:', pattern, error);
            return true;
        }
    }
    getDefaultMessage(ruleType) {
        switch (ruleType) {
            case 'required':
                return 'Ez a mező kötelező';
            case 'email':
                return 'Érvénytelen email cím';
            case 'numeric':
                return 'Csak számok engedélyezettek';
            case 'stringLength':
                return 'A szöveg hossza nem megfelelő';
            case 'range':
                return 'Az érték a megengedett tartományon kívül van';
            case 'pattern':
                return 'Az érték nem felel meg a mintának';
            case 'compare':
                return 'A mezők értékei nem egyeznek';
            case 'equals':
            case 'notEquals':
                return 'A mezők értékei nem egyeznek';
            case 'greaterThan':
            case 'lessThan':
                return 'A mezők értékei nem megfelelőek';
            case 'sumEquals':
                return 'Az összeg nem megfelelő';
            case 'percentageSum':
                return 'A százalékok összege nem 100%';
            case 'dateInRange':
                return 'A dátum kívül esik a tartományon';
            case 'atLeastOne':
                return 'Legalább egy mező kitöltése kötelező';
            default:
                return 'Érvénytelen érték';
        }
    }
}
//# sourceMappingURL=ClientValidator.js.map