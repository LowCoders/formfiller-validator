import { getNestedItems, getFieldName, isContainerField } from './typeHelpers.js';
export class FieldPathBuilder {
    buildFieldPathMap(items, parentPath = '') {
        const pathMap = new Map();
        this.buildPathMapRecursive(items, parentPath, pathMap);
        return pathMap;
    }
    buildFieldConfigMap(items, parentPath = '') {
        const configMap = new Map();
        this.buildConfigMapRecursive(items, parentPath, configMap);
        return configMap;
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
    buildConfigMapRecursive(items, parentPath, configMap) {
        for (const item of items) {
            const fieldPath = this.buildPath(item, parentPath);
            if (fieldPath) {
                configMap.set(fieldPath, item);
            }
            const nestedItems = getNestedItems(item);
            if (nestedItems) {
                this.buildConfigMapRecursive(nestedItems, this.getNextParentPath(item, parentPath), configMap);
            }
        }
    }
}
//# sourceMappingURL=FieldPathBuilder.js.map