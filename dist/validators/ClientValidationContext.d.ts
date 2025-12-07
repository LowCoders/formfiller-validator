export declare class ClientValidationContext {
    readonly data: Record<string, any>;
    readonly formConfig?: any;
    constructor(data: Record<string, any>, formConfig?: any);
    getValue(fieldPath: string): any;
    hasField(fieldPath: string): boolean;
}
//# sourceMappingURL=ClientValidationContext.d.ts.map