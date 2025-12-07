"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientValidator = void 0;
const ClientValidationContext_1 = require("./ClientValidationContext");
const ClientValidationResult_1 = require("./ClientValidationResult");
const ClientConditionalEvaluator_1 = require("./ClientConditionalEvaluator");
const ClientValidationConditionEvaluator_1 = require("./ClientValidationConditionEvaluator");
const ClientCallbackRegistry_1 = require("./ClientCallbackRegistry");
const typeGuards_1 = require("../utils/typeGuards");
class ClientValidator {
    conditionalEvaluator;
    validationConditionEvaluator;
    callbackRegistry;
    constructor() {
        this.conditionalEvaluator = new ClientConditionalEvaluator_1.ClientConditionalEvaluator();
        this.validationConditionEvaluator = new ClientValidationConditionEvaluator_1.ClientValidationConditionEvaluator(this.conditionalEvaluator);
        this.callbackRegistry = (0, ClientCallbackRegistry_1.getClientRegistry)();
    }
    async validate(fieldName, value, rules, formData) {
        const result = new ClientValidationResult_1.ClientValidationResult();
        const context = new ClientValidationContext_1.ClientValidationContext(formData);
        for (const ruleOrGroup of rules) {
            const validationResult = this.validateRuleOrGroup(fieldName, value, ruleOrGroup, context);
            if (!validationResult.valid) {
                result.addError(fieldName, validationResult.message, validationResult.ruleType, validationResult.params);
            }
        }
        return result;
    }
    validateRuleOrGroup(fieldName, value, ruleOrGroup, context) {
        if ((0, typeGuards_1.isValidationRuleGroup)(ruleOrGroup)) {
            return this.validateRuleGroup(fieldName, value, ruleOrGroup, context);
        }
        if ((0, typeGuards_1.isValidationRule)(ruleOrGroup)) {
            const rule = ruleOrGroup;
            if (!this.validationConditionEvaluator.shouldApplyRule(rule, context)) {
                return { valid: true, message: '', ruleType: rule.type };
            }
            const isValid = this.validateRule(fieldName, value, rule, context);
            return {
                valid: isValid,
                message: rule.message || this.getDefaultMessage(rule.type),
                ruleType: rule.type,
                params: { min: rule.min, max: rule.max, pattern: rule.pattern },
            };
        }
        return { valid: true, message: '', ruleType: 'unknown' };
    }
    validateRuleGroup(fieldName, value, group, context) {
        const operator = (0, typeGuards_1.getGroupOperator)(group);
        const rules = (0, typeGuards_1.getGroupRules)(group);
        const groupMessage = (0, typeGuards_1.getGroupMessage)(group) || 'Validation group failed';
        if (!operator || !rules || rules.length === 0) {
            return { valid: true, message: '', ruleType: 'group' };
        }
        const results = rules.map((rule) => {
            return this.validateRuleOrGroup(fieldName, value, rule, context);
        });
        let isValid;
        switch (operator) {
            case 'and':
                isValid = results.every((r) => r.valid);
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
        };
    }
    shouldApplyRule(rule, formData) {
        const context = new ClientValidationContext_1.ClientValidationContext(formData);
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
            case 'crossField':
                return this.validateCrossField(value, rule, context);
            default:
                console.warn(`ClientValidator: Unknown rule type '${rule.type}' - skipping`);
                return true;
        }
    }
    validateCrossField(value, rule, context) {
        if (!rule.targetFields || !rule.crossFieldValidator) {
            return true;
        }
        let validatorName;
        let params;
        if (typeof rule.crossFieldValidator === 'string') {
            validatorName = rule.crossFieldValidator;
        }
        else if (typeof rule.crossFieldValidator === 'object' && 'name' in rule.crossFieldValidator) {
            validatorName = rule.crossFieldValidator.name;
            params = rule.crossFieldValidator.params;
        }
        else {
            console.warn('ClientValidator: Inline crossFieldValidator functions require backend validation');
            return true;
        }
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
        return this.callbackRegistry.execute(validatorName, values, params);
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
            case 'crossField':
                return 'Mezők közötti validáció sikertelen';
            default:
                return 'Érvénytelen érték';
        }
    }
}
exports.ClientValidator = ClientValidator;
//# sourceMappingURL=ClientValidator.js.map