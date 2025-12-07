import { FormConfig, DependencyGraph } from '../types';
export declare class DependencyGraphBuilder {
    private readonly fieldPathBuilder;
    constructor();
    build(formConfig: FormConfig): DependencyGraph;
    private extractFields;
    private extractDependenciesFromConditionals;
    private extractFieldsFromCondition;
    private extractDependenciesFromRules;
    private extractDependenciesFromRuleOrGroup;
    private buildDependencies;
    private calculateLevels;
    private detectCircularDependencies;
}
//# sourceMappingURL=DependencyGraphBuilder.d.ts.map