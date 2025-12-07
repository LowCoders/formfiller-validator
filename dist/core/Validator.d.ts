import { ValidatorConfig, FormConfig, ValidationResult as IValidationResult } from '../types';
export declare class Validator {
    private readonly config;
    private readonly configProcessor;
    private readonly dependencyGraphBuilder;
    private readonly registry;
    constructor(config?: ValidatorConfig);
    validate(data: Record<string, any>, formConfig: FormConfig, externalContext?: Record<string, any>): Promise<IValidationResult>;
    validateField(fieldName: string, _value: any, data: Record<string, any>, formConfig: FormConfig, externalContext?: Record<string, any>): Promise<IValidationResult>;
    private exportDependencyGraph;
    getConfig(): ValidatorConfig;
}
//# sourceMappingURL=Validator.d.ts.map