import { ValidationRuleOrGroup, ConditionalExpression, ValidationRule } from 'formfiller-schema';
export declare const CROSS_FIELD_TYPES: readonly ["crossField", "crossFieldEquals", "crossFieldNotEquals", "crossFieldGreaterThan", "crossFieldLessThan", "crossFieldSumEquals", "crossFieldPercentageSum", "crossFieldDateInRange", "crossFieldAtLeastOne", "crossFieldCustom"];
export type CrossFieldType = (typeof CROSS_FIELD_TYPES)[number];
export declare function isCrossFieldType(type: string): type is CrossFieldType;
export declare function getCrossFieldValidatorName(type: string): string;
export declare function enrichCrossFieldRule(rule: ValidationRule, currentFieldPath: string): ValidationRule;
export declare function isValidationRule(rule: ValidationRuleOrGroup): rule is import('formfiller-schema').ValidationRule;
export declare function isValidationRuleGroup(rule: ValidationRuleOrGroup): rule is import('formfiller-schema').ValidationRuleGroup;
export declare function getGroupRules(group: import('formfiller-schema').ValidationRuleGroup): Array<import('formfiller-schema').ValidationRule | import('formfiller-schema').ValidationRuleGroup>;
export declare function getGroupOperator(group: import('formfiller-schema').ValidationRuleGroup): 'and' | 'or' | 'not';
export declare function getGroupMessage(group: import('formfiller-schema').ValidationRuleGroup): string | undefined;
export declare function flattenValidationRules(rules: ValidationRuleOrGroup[]): import('formfiller-schema').ValidationRule[];
export declare function extractFieldReferences(rules: ValidationRuleOrGroup[]): string[];
export declare function extractConditionalFields(expression: ConditionalExpression): string[];
//# sourceMappingURL=typeGuards.d.ts.map