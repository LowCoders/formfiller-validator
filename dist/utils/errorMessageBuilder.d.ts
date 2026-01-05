import { FieldConfig } from 'formfiller-schema';
import { TargetFieldLabel } from '../types/index.js';
export declare function getLabelText(config: FieldConfig): string | undefined;
export declare function buildPathLabels(fieldPath: string, fieldConfigMap: Map<string, FieldConfig>): string[];
export declare function formatPathLabels(pathLabels: string[], separator?: string): string;
export declare function buildTargetFieldLabels(targetFields: string[], fieldConfigMap: Map<string, FieldConfig>): TargetFieldLabel[];
export declare function formatErrorWithFieldRefs(baseMessage: string, targetFieldLabels: TargetFieldLabel[]): string;
export declare function buildValidationError(field: string, message: string, rule: string, fieldConfigMap: Map<string, FieldConfig>, targetFields?: string[], errorTarget?: 'currentField' | 'allTargetFields' | string[]): {
    field: string;
    message: string;
    rule: string;
    path: string[];
    pathLabels: string[];
    targetFieldLabels?: TargetFieldLabel[];
    errorTarget?: 'currentField' | 'allTargetFields' | string[];
};
//# sourceMappingURL=errorMessageBuilder.d.ts.map