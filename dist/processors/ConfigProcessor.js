"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigProcessor = void 0;
const ValidationResult_1 = require("../core/ValidationResult");
const ConditionalEvaluator_1 = require("./ConditionalEvaluator");
const ValidationConditionEvaluator_1 = require("./ValidationConditionEvaluator");
const JoiAdapter_1 = require("../adapters/JoiAdapter");
const FieldPathBuilder_1 = require("../utils/FieldPathBuilder");
const typeHelpers_1 = require("../utils/typeHelpers");
const computed_1 = require("./computed");
class ConfigProcessor {
    conditionalEvaluator;
    validationConditionEvaluator;
    joiAdapter;
    fieldPathBuilder;
    exactMatchProcessor;
    arrayMatchProcessor;
    numericMatchProcessor;
    keywordMatchProcessor;
    aggregateProcessor;
    fieldComputedResults = {};
    constructor(registry) {
        this.conditionalEvaluator = new ConditionalEvaluator_1.ConditionalEvaluator();
        this.validationConditionEvaluator = new ValidationConditionEvaluator_1.ValidationConditionEvaluator(this.conditionalEvaluator);
        this.joiAdapter = new JoiAdapter_1.JoiAdapter(registry);
        this.fieldPathBuilder = new FieldPathBuilder_1.FieldPathBuilder();
        this.exactMatchProcessor = new computed_1.ExactMatchProcessor();
        this.arrayMatchProcessor = new computed_1.ArrayMatchProcessor();
        this.numericMatchProcessor = new computed_1.NumericMatchProcessor();
        this.keywordMatchProcessor = new computed_1.KeywordMatchProcessor();
        this.aggregateProcessor = new computed_1.AggregateProcessor();
    }
    async process(context) {
        const result = new ValidationResult_1.ValidationResult();
        this.fieldComputedResults = {};
        if (context.config.validationRules && context.config.validationRules.length > 0) {
        }
        if (context.config.items) {
            for (const item of context.config.items) {
                const itemResult = await this.processItem(item, context, '');
                result.merge(itemResult);
            }
        }
        if (context.config.computedRules && context.config.computedRules.length > 0) {
            const aggregateResults = this.processFormLevelComputedRules(context);
            for (const [name, aggResult] of Object.entries(aggregateResults)) {
                result.addComputedResult(name, aggResult);
            }
        }
        for (const [fieldName, computedResult] of Object.entries(this.fieldComputedResults)) {
            result.addComputedResult(fieldName, computedResult);
        }
        return result;
    }
    processFormLevelComputedRules(context) {
        const results = {};
        if (!context.config.computedRules) {
            return results;
        }
        for (const computedRule of context.config.computedRules) {
            try {
                const rule = computedRule;
                if (rule.type === 'field') {
                    this.processFieldComputedRule(rule, context);
                }
                else if (rule.type === 'aggregate') {
                    const aggResult = this.aggregateProcessor.aggregate(this.fieldComputedResults, rule);
                    results[computedRule.name] = aggResult;
                }
            }
            catch (error) {
                console.error(`Error processing computed rule ${computedRule.name}:`, error);
            }
        }
        return results;
    }
    processFieldComputedRule(rule, context) {
        if (!rule.fieldName) {
            console.warn(`Field computed rule ${rule.id} missing fieldName`);
            return;
        }
        const fieldValue = context.getValue(rule.fieldName);
        let computedResult;
        switch (rule.subtype) {
            case 'exactMatch':
                computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'arrayMatch':
                computedResult = this.arrayMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'numericMatch':
                computedResult = this.numericMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'keywordMatch':
                computedResult = this.keywordMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'custom':
                console.warn(`Custom evaluator not yet implemented for field ${rule.fieldName}`);
                return;
            default:
                computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule);
        }
        if (rule.storeResult !== false) {
            this.fieldComputedResults[rule.fieldName] = {
                fieldName: rule.fieldName,
                ...computedResult,
            };
        }
    }
    async processItem(item, context, parentPath = '') {
        const result = new ValidationResult_1.ValidationResult();
        const fieldName = (0, typeHelpers_1.getFieldName)(item);
        if ((0, typeHelpers_1.isContainerField)(item)) {
            const nestedResult = await this.processNestedItems(item, context, parentPath);
            result.merge(nestedResult);
            return result;
        }
        if (!(0, typeHelpers_1.isDataField)(item) || !fieldName) {
            return result;
        }
        const fieldPath = this.fieldPathBuilder.buildPath(item, parentPath);
        let fieldValue = context.getValue(fieldPath);
        const isVisible = this.evaluateVisibility(item, context);
        let isDisabled = false;
        if (item.visibleIf && !isVisible) {
            isDisabled = true;
        }
        else {
            isDisabled = this.evaluateDisabled(item, context);
        }
        const isReadonly = this.evaluateReadonly(item, context);
        const isRequired = this.evaluateRequired(item, context);
        void isReadonly;
        if (fieldValue === undefined) {
            fieldValue = this.getDefaultValueForType(item.type);
        }
        if (!isVisible) {
            result.setFieldSkipped(fieldPath, 'Field is not visible');
            return result;
        }
        if (isDisabled) {
            result.setFieldSkipped(fieldPath, 'Field is disabled');
            return result;
        }
        if (item.validationRules && item.validationRules.length > 0) {
            const hasErrors = await this.validateRules(item.validationRules, fieldPath, fieldValue, isRequired, context, result);
            if (!hasErrors) {
                result.setFieldValid(fieldPath);
            }
        }
        return result;
    }
    async processNestedItems(item, context, parentPath = '') {
        const result = new ValidationResult_1.ValidationResult();
        const nextPath = this.fieldPathBuilder.getNextParentPath(item, parentPath);
        const nestedItems = (0, typeHelpers_1.getNestedItems)(item);
        if (nestedItems) {
            for (const nestedItem of nestedItems) {
                const nestedResult = await this.processItem(nestedItem, context, nextPath);
                result.merge(nestedResult);
            }
        }
        return result;
    }
    evaluateVisibility(item, context) {
        if (!item.visibleIf) {
            return true;
        }
        return this.conditionalEvaluator.evaluate(item.visibleIf, context);
    }
    evaluateDisabled(item, context) {
        if (!item.disabledIf) {
            return false;
        }
        return this.conditionalEvaluator.evaluate(item.disabledIf, context);
    }
    evaluateReadonly(item, context) {
        if (!item.readonlyIf) {
            return false;
        }
        return this.conditionalEvaluator.evaluate(item.readonlyIf, context);
    }
    evaluateRequired(item, context) {
        if (item.requiredIf) {
            return this.conditionalEvaluator.evaluate(item.requiredIf, context);
        }
        if (item.validationRules) {
            return this.hasRequiredRule(item.validationRules);
        }
        return false;
    }
    hasRequiredRule(rules) {
        const { isValidationRule, isValidationRuleGroup } = require('../utils/typeGuards');
        const { getGroupRules } = require('../utils/typeGuards');
        for (const ruleOrGroup of rules) {
            if (isValidationRule(ruleOrGroup)) {
                const rule = ruleOrGroup;
                if (rule.type === 'required') {
                    return true;
                }
            }
            else if (isValidationRuleGroup(ruleOrGroup)) {
                const group = ruleOrGroup;
                const nestedRules = getGroupRules(group);
                if (this.hasRequiredRule(nestedRules)) {
                    return true;
                }
            }
        }
        return false;
    }
    async validateRules(rules, fieldName, fieldValue, isRequired, context, result) {
        const { isValidationRule, isValidationRuleGroup } = require('../utils/typeGuards');
        let hasErrors = false;
        for (const ruleOrGroup of rules) {
            if (isValidationRule(ruleOrGroup)) {
                const rule = ruleOrGroup;
                const shouldApply = this.validationConditionEvaluator.shouldApplyRule(rule, context);
                if (!shouldApply) {
                    continue;
                }
                if (rule.type === 'computed') {
                    this.processComputedRule(rule, fieldName, fieldValue);
                    continue;
                }
                if (rule.type === 'required' && !rule.when && !isRequired) {
                    continue;
                }
                const validationResult = await this.joiAdapter.validate(fieldValue, rule, context);
                if (!validationResult.valid) {
                    hasErrors = true;
                    result.addError(fieldName, validationResult.error || rule.message || 'Validation failed', rule.type, {
                        min: rule.min,
                        max: rule.max,
                        pattern: rule.pattern,
                        comparisonTarget: rule.comparisonTarget,
                        comparisonType: rule.comparisonType,
                        targetFields: rule.targetFields,
                        crossFieldValidator: typeof rule.crossFieldValidator === 'string' ? rule.crossFieldValidator : undefined,
                    });
                }
            }
            else if (isValidationRuleGroup(ruleOrGroup)) {
                const group = ruleOrGroup;
                const groupResult = await this.validateRuleGroup(group, fieldName, fieldValue, isRequired, context, result);
                if (groupResult) {
                    hasErrors = true;
                }
            }
        }
        return hasErrors;
    }
    processComputedRule(rule, fieldName, fieldValue) {
        let computedResult;
        switch (rule.subtype) {
            case 'exactMatch':
                computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'arrayMatch':
                computedResult = this.arrayMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'numericMatch':
                computedResult = this.numericMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'keywordMatch':
                computedResult = this.keywordMatchProcessor.evaluate(fieldValue, rule);
                break;
            case 'custom':
                console.warn(`Custom evaluator not yet implemented for field ${fieldName}`);
                return;
            default:
                computedResult = this.exactMatchProcessor.evaluate(fieldValue, rule);
        }
        if (rule.storeResult !== false) {
            this.fieldComputedResults[fieldName] = {
                fieldName,
                ...computedResult,
            };
        }
    }
    async validateRuleGroup(group, fieldName, fieldValue, isRequired, context, result) {
        const { isValidationRule, isValidationRuleGroup, getGroupRules, getGroupOperator, getGroupMessage, } = require('../utils/typeGuards');
        const errors = [];
        const rules = getGroupRules(group);
        const operator = getGroupOperator(group);
        const groupMessage = getGroupMessage(group);
        for (const ruleOrNestedGroup of rules) {
            if (isValidationRule(ruleOrNestedGroup)) {
                const rule = ruleOrNestedGroup;
                if (rule.type === 'required' && !isRequired) {
                    continue;
                }
                const validationResult = await this.joiAdapter.validate(fieldValue, rule, context);
                if (!validationResult.valid) {
                    errors.push(validationResult.error || rule.message || 'Validation failed');
                    if (group.stopOnFirstError) {
                        break;
                    }
                }
            }
            else if (isValidationRuleGroup(ruleOrNestedGroup)) {
                const nestedGroup = ruleOrNestedGroup;
                const tempResult = new ValidationResult_1.ValidationResult();
                const nestedHasError = await this.validateRuleGroup(nestedGroup, fieldName, fieldValue, isRequired, context, tempResult);
                if (nestedHasError) {
                    const nestedMessage = getGroupMessage(nestedGroup);
                    errors.push(nestedMessage || 'Nested group validation failed');
                }
                if (nestedHasError && group.stopOnFirstError) {
                    return true;
                }
            }
        }
        let hasError = false;
        switch (operator) {
            case 'and':
                hasError = errors.length > 0;
                break;
            case 'or':
                hasError = errors.length === rules.length;
                break;
            case 'not':
                hasError = errors.length === 0;
                break;
        }
        if (hasError) {
            result.addError(fieldName, groupMessage || errors.join(', ') || 'Validation group failed', 'group', { operator });
        }
        return hasError;
    }
    getDefaultValueForType(fieldType) {
        switch (fieldType) {
            case 'text':
            case 'email':
            case 'password':
            case 'url':
            case 'tel':
            case 'color':
            case 'textarea':
            case 'select':
            case 'dropdown':
            case 'autocomplete':
            case 'tagbox':
                return '';
            case 'number':
            case 'range':
            case 'rating':
                return 0;
            case 'boolean':
            case 'switch':
            case 'checkbox':
                return false;
            case 'date':
            case 'datetime':
            case 'time':
                return null;
            case 'array':
            case 'multiselect':
            case 'list':
                return [];
            case 'object':
            case 'json':
                return {};
            case 'file':
            case 'image':
                return null;
            default:
                return '';
        }
    }
}
exports.ConfigProcessor = ConfigProcessor;
//# sourceMappingURL=ConfigProcessor.js.map