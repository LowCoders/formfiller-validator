"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientValidationResult = void 0;
class ClientValidationResult {
    valid;
    errors;
    constructor() {
        this.valid = true;
        this.errors = [];
    }
    addError(field, message, rule, params) {
        this.valid = false;
        this.errors.push({
            field,
            message,
            rule,
            params,
        });
    }
    getFieldErrors(field) {
        return this.errors.filter((error) => error.field === field);
    }
}
exports.ClientValidationResult = ClientValidationResult;
//# sourceMappingURL=ClientValidationResult.js.map