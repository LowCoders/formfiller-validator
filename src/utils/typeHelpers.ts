/**
 * Type Helper Functions
 *
 * Utilities for working with FieldConfig types from formfiller-schema
 */

import { FieldConfig } from 'formfiller-schema';

/**
 * Eldönti, hogy egy FieldConfig konténer típus-e (group, tabbed, tab, form, grid, tree)
 *
 * Container fields can have nested items and may support excludeFromPath.
 */
export function isContainerField(field: FieldConfig): boolean {
  return ['group', 'tabbed', 'tab', 'form', 'grid', 'tree'].includes(field.type);
}

/**
 * Eldönti, hogy egy FieldConfig adat mező-e (validálható)
 */
export function isDataField(field: FieldConfig): boolean {
  return (
    !isContainerField(field) &&
    field.type !== 'button' &&
    field.type !== 'empty' &&
    field.type !== 'tab'
  );
}

/**
 * Visszaadja a nested items-t ha van
 */
export function getNestedItems(field: FieldConfig): FieldConfig[] | undefined {
  if ('items' in field) {
    return field.items as FieldConfig[];
  }
  return undefined;
}

/**
 * Visszaadja a mező nevét (name vagy dataField alapján)
 */
export function getFieldName(field: FieldConfig): string | undefined {
  return field.name || (field as any).dataField;
}

/**
 * Ellenőrzi, hogy egy mező validálható-e
 */
export function isValidatableField(field: FieldConfig): boolean {
  return isDataField(field) && getFieldName(field) !== undefined;
}
