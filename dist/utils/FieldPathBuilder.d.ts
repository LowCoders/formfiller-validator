import { FieldConfig } from 'formfiller-schema';
export declare class FieldPathBuilder {
    buildFieldPathMap(items: FieldConfig[], parentPath?: string): Map<string, string>;
    buildPath(item: FieldConfig, parentPath?: string): string;
    getNextParentPath(item: FieldConfig, currentPath: string): string;
    private shouldExcludeFromPath;
    private buildPathMapRecursive;
}
//# sourceMappingURL=FieldPathBuilder.d.ts.map