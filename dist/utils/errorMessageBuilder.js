export function getLabelText(config) {
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
export function buildPathLabels(fieldPath, fieldConfigMap) {
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
export function formatPathLabels(pathLabels, separator = ' > ') {
    return pathLabels.join(separator);
}
export function buildTargetFieldLabels(targetFields, fieldConfigMap) {
    return targetFields.map((path) => ({
        path,
        pathLabels: buildPathLabels(path, fieldConfigMap),
    }));
}
export function formatErrorWithFieldRefs(baseMessage, targetFieldLabels) {
    if (!targetFieldLabels || targetFieldLabels.length === 0) {
        return baseMessage;
    }
    const fieldRefs = targetFieldLabels.map((t) => formatPathLabels(t.pathLabels)).join(', ');
    return `${baseMessage} (${fieldRefs})`;
}
export function buildValidationError(field, message, rule, fieldConfigMap, targetFields, errorTarget) {
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