import { FieldConfig } from 'formfiller-schema';
export declare class FieldPathBuilder {
    buildFieldPathMap(items: FieldConfig[], parentPath?: string): Map<string, string>;
    buildFieldConfigMap(items: FieldConfig[], parentPath?: string): Map<string, FieldConfig>;
    buildPath(item: FieldConfig, parentPath?: string): string;
    getNextParentPath(item: FieldConfig, currentPath: string): string;
    private shouldExcludeFromPath;
    private buildPathMapRecursive;
    private buildConfigMapRecursive;
}
//# sourceMappingURL=FieldPathBuilder.d.ts.map