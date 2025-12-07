"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientValidationContext = void 0;
class ClientValidationContext {
    data;
    formConfig;
    constructor(data, formConfig) {
        this.data = data;
        this.formConfig = formConfig;
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
}
exports.ClientValidationContext = ClientValidationContext;
//# sourceMappingURL=ClientValidationContext.js.map