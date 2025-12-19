"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabelText = getLabelText;
exports.buildPathLabels = buildPathLabels;
exports.formatPathLabels = formatPathLabels;
exports.buildTargetFieldLabels = buildTargetFieldLabels;
exports.formatErrorWithFieldRefs = formatErrorWithFieldRefs;
exports.buildValidationError = buildValidationError;
function getLabelText(config) {
    if (!config)
        return undefined;
    const fieldConfig = config;
    if (fieldConfig.label) {
        if (typeof fieldConfig.label === 'string') {
            return fieldConfig.label;
        }
        if (typeof fieldConfig.label === 'object' && fieldConfig.label.text) {
            return fieldConfig.label.text;
        }
    }
    if (fieldConfig.caption) {
        return fieldConfig.caption;
    }
    if (fieldConfig.tabTitle) {
        return fieldConfig.tabTitle;
    }
    return fieldConfig.name;
}
function buildPathLabels(fieldPath, fieldConfigMap) {
    const pathParts = fieldPath.split('.');
    const labels = [];
    let currentPath = '';
    for (const part of pathParts) {
        currentPath = currentPath ? `${currentPath}.${part}` : part;
        const config = fieldConfigMap.get(currentPath);
        if (config) {
            const label = getLabelText(config);
            labels.push(label || part);
        }
        else {
            labels.push(part);
        }
    }
    return labels;
}
function formatPathLabels(pathLabels, separator = ' > ') {
    return pathLabels.join(separator);
}
function buildTargetFieldLabels(targetFields, fieldConfigMap) {
    return targetFields.map((path) => ({
        path,
        pathLabels: buildPathLabels(path, fieldConfigMap),
    }));
}
function formatErrorWithFieldRefs(baseMessage, targetFieldLabels) {
    if (!targetFieldLabels || targetFieldLabels.length === 0) {
        return baseMessage;
    }
    const fieldRefs = targetFieldLabels.map((t) => formatPathLabels(t.pathLabels)).join(', ');
    return `${baseMessage} (${fieldRefs})`;
}
function buildValidationError(field, message, rule, fieldConfigMap, targetFields, errorTarget) {
    const path = field.split('.');
    const pathLabels = buildPathLabels(field, fieldConfigMap);
    const result = {
        field,
        message,
        rule,
        path,
        pathLabels,
        errorTarget,
    };
    if (targetFields && targetFields.length > 0) {
        result.targetFieldLabels = buildTargetFieldLabels(targetFields, fieldConfigMap);
    }
    return result;
}
//# sourceMappingURL=errorMessageBuilder.js.map