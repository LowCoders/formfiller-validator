"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationContext = void 0;
class ValidationContext {
    data;
    config;
    validatorConfig;
    path;
    cache;
    dependencyGraph;
    externalContext;
    timestamp;
    constructor(data, config, validatorConfig, options = {}) {
        this.data = data;
        this.config = config;
        this.validatorConfig = validatorConfig;
        this.path = options.path || [];
        this.cache = options.cache;
        this.dependencyGraph = options.dependencyGraph;
        this.externalContext = options.externalContext;
        this.timestamp = options.timestamp || new Date();
    }
    createChild(newPath, newData) {
        return new ValidationContext(newData || this.data, this.config, this.validatorConfig, {
            path: newPath,
            cache: this.cache,
            dependencyGraph: this.dependencyGraph,
            externalContext: this.externalContext,
            timestamp: this.timestamp,
        });
    }
    getValue(fieldPath) {
        const parts = fieldPath.split('.');
        let value = this.data;
        for (const part of parts) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[part];
        }
        return value;
    }
    setValue(fieldPath, newValue) {
        const parts = fieldPath.split('.');
        let target = this.data;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!part)
                continue;
            if (!(part in target) || typeof target[part] !== 'object') {
                target[part] = {};
            }
            target = target[part];
        }
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
            target[lastPart] = newValue;
        }
    }
    hasField(fieldPath) {
        const parts = fieldPath.split('.');
        let value = this.data;
        for (const part of parts) {
            if (value === null || value === undefined || typeof value !== 'object') {
                return false;
            }
            if (!(part in value)) {
                return false;
            }
            value = value[part];
        }
        return true;
    }
    getPathString() {
        return this.path.join('.');
    }
    clone(updates) {
        return new ValidationContext(updates.data || this.data, this.config, this.validatorConfig, {
            path: updates.path || this.path,
            cache: updates.cache || this.cache,
            dependencyGraph: this.dependencyGraph,
            externalContext: updates.externalContext || this.externalContext,
            timestamp: this.timestamp,
        });
    }
}
exports.ValidationContext = ValidationContext;
//# sourceMappingURL=ValidationContext.js.map