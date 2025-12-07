/**
 * FieldPathBuilder - Build field paths with excludeFromPath support
 *
 * This utility class handles the construction of field paths taking into account
 * the excludeFromPath property on container fields (group, tabbed, tab, form).
 *
 * When excludeFromPath is true on a container, its name is not included in the
 * paths of its child fields.
 */

import { FieldConfig } from 'formfiller-schema';
import { getNestedItems, getFieldName, isContainerField } from './typeHelpers';

export class FieldPathBuilder {
  /**
   * Build a field path map from form configuration
   * Maps: field name → full path
   *
   * @param items - Array of field configurations
   * @param parentPath - Parent path (empty string for root level)
   * @returns Map of field names to their full paths
   */
  buildFieldPathMap(items: FieldConfig[], parentPath: string = ''): Map<string, string> {
    const pathMap = new Map<string, string>();
    this.buildPathMapRecursive(items, parentPath, pathMap);
    return pathMap;
  }

  /**
   * Build path for a single field
   *
   * @param item - Field configuration
   * @param parentPath - Parent path
   * @returns Full field path
   */
  buildPath(item: FieldConfig, parentPath: string = ''): string {
    const fieldName = getFieldName(item);
    if (!fieldName) {
      return parentPath;
    }

    // Container fields (group, tabbed, tab) with excludeFromPath
    // should not add their name to the path
    if (this.shouldExcludeFromPath(item)) {
      return parentPath;
    }

    // Regular fields or containers without excludeFromPath
    return parentPath ? `${parentPath}.${fieldName}` : fieldName;
  }

  /**
   * Get the next parent path for nested items
   *
   * This is used when recursively processing nested items to determine
   * what path should be passed to the children.
   *
   * @param item - Container field configuration
   * @param currentPath - Current path
   * @returns Path to be used for child items
   */
  getNextParentPath(item: FieldConfig, currentPath: string): string {
    if (this.shouldExcludeFromPath(item)) {
      return currentPath; // excludeFromPath → keep current path
    }

    const fieldName = getFieldName(item);
    if (!fieldName) {
      return currentPath;
    }

    return currentPath ? `${currentPath}.${fieldName}` : fieldName;
  }

  /**
   * Check if field should be excluded from path
   *
   * Only container fields (group, tabbed, tab, form) can have excludeFromPath.
   * Regular data fields are always included in the path.
   *
   * @param item - Field configuration
   * @returns true if the field should be excluded from path
   */
  private shouldExcludeFromPath(item: FieldConfig): boolean {
    // Only container fields can have excludeFromPath
    if (!isContainerField(item)) {
      return false;
    }

    return (item as any).excludeFromPath === true;
  }

  /**
   * Recursive path map builder
   *
   * Traverses the form configuration tree and builds a complete map
   * of field names to their full paths.
   *
   * @param items - Array of field configurations
   * @param parentPath - Current parent path
   * @param pathMap - Map to populate with field paths
   */
  private buildPathMapRecursive(
    items: FieldConfig[],
    parentPath: string,
    pathMap: Map<string, string>
  ): void {
    for (const item of items) {
      const fieldName = getFieldName(item);

      if (fieldName) {
        const fieldPath = this.buildPath(item, parentPath);

        // Store mapping: name → path
        pathMap.set(fieldName, fieldPath);

        // Process nested items
        const nestedItems = getNestedItems(item);
        if (nestedItems) {
          const nextPath = this.getNextParentPath(item, parentPath);
          this.buildPathMapRecursive(nestedItems, nextPath, pathMap);
        }
      }
    }
  }
}
