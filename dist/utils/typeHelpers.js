export function isContainerField(field) {
    return ['group', 'tabbed', 'tab', 'form', 'grid', 'tree'].includes(field.type);
}
export function isDataField(field) {
    return (!isContainerField(field) &&
        field.type !== 'button' &&
        field.type !== 'empty' &&
        field.type !== 'tab');
}
export function getNestedItems(field) {
    if ('items' in field) {
        return field.items;
    }
    return undefined;
}
export function getFieldName(field) {
    return field.name || field.dataField;
}
export function isValidatableField(field) {
    return isDataField(field) && getFieldName(field) !== undefined;
}
//# sourceMappingURL=typeHelpers.js.map