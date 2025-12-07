export interface ClientValidationError {
    field: string;
    message: string;
    rule: string;
    params?: Record<string, any>;
}
export declare class ClientValidationResult {
    valid: boolean;
    errors: ClientValidationError[];
    constructor();
    addError(field: string, message: string, rule: string, params?: Record<string, any>): void;
    getFieldErrors(field: string): ClientValidationError[];
}
//# sourceMappingURL=ClientValidationResult.d.ts.map