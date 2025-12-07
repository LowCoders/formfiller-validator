"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldPathBuilder = void 0;
const typeHelpers_1 = require("./typeHelpers");
class FieldPathBuilder {
    buildFieldPathMap(items, parentPath = '') {
        const pathMap = new Map();
        this.buildPathMapRecursive(items, parentPath, pathMap);
        return pathMap;
    }
    buildPath(item, parentPath = '') {
        const fieldName = (0, typeHelpers_1.getFieldName)(item);
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
        const fieldName = (0, typeHelpers_1.getFieldName)(item);
        if (!fieldName) {
            return currentPath;
        }
        return currentPath ? `${currentPath}.${fieldName}` : fieldName;
    }
    shouldExcludeFromPath(item) {
        if (!(0, typeHelpers_1.isContainerField)(item)) {
            return false;
        }
        return item.excludeFromPath === true;
    }
    buildPathMapRecursive(items, parentPath, pathMap) {
        for (const item of items) {
            const fieldName = (0, typeHelpers_1.getFieldName)(item);
            if (fieldName) {
                const fieldPath = this.buildPath(item, parentPath);
                pathMap.set(fieldName, fieldPath);
                const nestedItems = (0, typeHelpers_1.getNestedItems)(item);
                if (nestedItems) {
                    const nextPath = this.getNextParentPath(item, parentPath);
                    this.buildPathMapRecursive(nestedItems, nextPath, pathMap);
                }
            }
        }
    }
}
exports.FieldPathBuilder = FieldPathBuilder;
//# sourceMappingURL=FieldPathBuilder.js.map