import { getNestedItems, getFieldName, isContainerField } from './typeHelpers.js';
export class FieldPathBuilder {
    buildFieldPathMap(items, parentPath = '') {
        const pathMap = new Map();
        this.buildPathMapRecursive(items, parentPath, pathMap);
        return pathMap;
    }
    buildPath(item, parentPath = '') {
        const fieldName = getFieldName(item);
        if (!fieldName) {
            return parentPath;
        }
        if (this.shouldExcludeFromPath(item)) {
            return parentPath;
        }
        return parentPath ? `${parentPath}.${fieldName}` : fieldName;
    }
    getNextParentPath(item, currentPath) {
        if (this.shouldExcludeFromPath(item)) {
            return currentPath;
        }
        const fieldName = getFieldName(item);
        if (!fieldName) {
            return currentPath;
        }
        return currentPath ? `${currentPath}.${fieldName}` : fieldName;
    }
    shouldExcludeFromPath(item) {
        if (!isContainerField(item)) {
            return false;
        }
        return item.excludeFromPath === true;
    }
    buildPathMapRecursive(items, parentPath, pathMap) {
        for (const item of items) {
            const fieldName = getFieldName(item);
            if (fieldName) {
                const fieldPath = this.buildPath(item, parentPath);
                pathMap.set(fieldName, fieldPath);
                const nestedItems = getNestedItems(item);
                if (nestedItems) {
                    const nextPath = this.getNextParentPath(item, parentPath);
                    this.buildPathMapRecursive(nestedItems, nextPath, pathMap);
                }
            }
        }
    }
}
//# sourceMappingURL=FieldPathBuilder.js.map