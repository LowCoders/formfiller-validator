"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isContainerField = isContainerField;
exports.isDataField = isDataField;
exports.getNestedItems = getNestedItems;
exports.getFieldName = getFieldName;
exports.isValidatableField = isValidatableField;
function isContainerField(field) {
    return ['group', 'tabbed', 'tab', 'form', 'grid', 'tree'].includes(field.type);
}
function isDataField(field) {
    return (!isContainerField(field) &&
        field.type !== 'button' &&
        field.type !== 'empty' &&
        field.type !== 'tab');
}
function getNestedItems(field) {
    if ('items' in field) {
        return field.items;
    }
    return undefined;
}
function getFieldName(field) {
    return field.name || field.dataField;
}
function isValidatableField(field) {
    return isDataField(field) && getFieldName(field) !== undefined;
}
//# sourceMappingURL=typeHelpers.js.map