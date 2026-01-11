export class ClientValidationResult {
    valid;
    errors;
    constructor() {
        this.valid = true;
        this.errors = [];
    }
    addError(field, message, rule, params, targetFields, errorTarget) {
        this.valid = false;
        this.errors.push({
            field,
            message,
            rule,
            params,
            targetFields,
            errorTarget,
        });
    }
    getFieldErrors(field) {
        return this.errors.filter((error) => error.field === field);
    }
}
//# sourceMappingURL=ClientValidationResult.js.map