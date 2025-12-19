/**
 * ErrorMessageBuilder - Utility for building validation error messages with field labels
 *
 * Provides functions to:
 * - Build hierarchical path labels for fields
 * - Format error messages with proper field references
 * - Support crossField validation error messages
 */

import { FieldConfig } from 'formfiller-schema';
import { TargetFieldLabel } from '../types';

/**
 * Get label text from a field config
 * Priority: label.text > label (string) > caption > name
 */
export function getLabelText(config: FieldConfig): string | undefined {
  if (!config) return undefined;

  const fieldConfig = config as any;

  // Check label property
  if (fieldConfig.label) {
    if (typeof fieldConfig.label === 'string') {
      return fieldConfig.label;
    }
    if (typeof fieldConfig.label === 'object' && fieldConfig.label.text) {
      return fieldConfig.label.text;
    }
  }

  // Check caption (for groups)
  if (fieldConfig.caption) {
    return fieldConfig.caption;
  }

  // Check tabTitle (for tabs)
  if (fieldConfig.tabTitle) {
    return fieldConfig.tabTitle;
  }

  // Fallback to name
  return fieldConfig.name;
}

/**
 * Build hierarchical path labels for a field path
 *
 * @param fieldPath - Full field path (e.g., 'personalData.address.street')
 * @param fieldConfigMap - Map of field paths to their configurations
 * @returns Array of labels for each path segment
 *
 * @example
 * // path: 'personalData.address.street'
 * // returns: ['Személyes adatok', 'Lakcím', 'Utca']
 */
export function buildPathLabels(
  fieldPath: string,
  fieldConfigMap: Map<string, FieldConfig>
): string[] {
  const pathParts = fieldPath.split('.');
  const labels: string[] = [];

  let currentPath = '';
  for (const part of pathParts) {
    currentPath = currentPath ? `${currentPath}.${part}` : part;
    const config = fieldConfigMap.get(currentPath);

    if (config) {
      const label = getLabelText(config);
      labels.push(label || part);
    } else {
      // If no config found, use the path segment as-is
      labels.push(part);
    }
  }

  return labels;
}

/**
 * Format path labels as a display string
 *
 * @param pathLabels - Array of labels
 * @param separator - Separator between labels (default: ' > ')
 * @returns Formatted string (e.g., 'Személyes adatok > Lakcím > Utca')
 */
export function formatPathLabels(pathLabels: string[], separator: string = ' > '): string {
  return pathLabels.join(separator);
}

/**
 * Build target field labels for crossField validation errors
 *
 * @param targetFields - Array of field paths involved in the validation
 * @param fieldConfigMap - Map of field paths to their configurations
 * @returns Array of target field label objects
 */
export function buildTargetFieldLabels(
  targetFields: string[],
  fieldConfigMap: Map<string, FieldConfig>
): TargetFieldLabel[] {
  return targetFields.map((path) => ({
    path,
    pathLabels: buildPathLabels(path, fieldConfigMap),
  }));
}

/**
 * Format an error message with field references
 *
 * @param baseMessage - The base error message
 * @param targetFieldLabels - Labels for the fields involved
 * @returns Formatted error message with field references
 *
 * @example
 * // baseMessage: 'Az összegnek egyeznie kell'
 * // targetFieldLabels: [
 * //   { path: 'sum.base', pathLabels: ['Összeg', 'Alap'] },
 * //   { path: 'sum.extra', pathLabels: ['Összeg', 'Extra'] }
 * // ]
 * // returns: 'Az összegnek egyeznie kell (Összeg > Alap, Összeg > Extra)'
 */
export function formatErrorWithFieldRefs(
  baseMessage: string,
  targetFieldLabels: TargetFieldLabel[]
): string {
  if (!targetFieldLabels || targetFieldLabels.length === 0) {
    return baseMessage;
  }

  const fieldRefs = targetFieldLabels.map((t) => formatPathLabels(t.pathLabels)).join(', ');

  return `${baseMessage} (${fieldRefs})`;
}

/**
 * Build a complete validation error with path labels
 *
 * @param field - The field path that triggered the error
 * @param message - The error message
 * @param rule - The rule type that failed
 * @param fieldConfigMap - Map of field paths to their configurations
 * @param targetFields - Optional: target fields for crossField validation
 * @param errorTarget - Optional: where to display the error
 */
export function buildValidationError(
  field: string,
  message: string,
  rule: string,
  fieldConfigMap: Map<string, FieldConfig>,
  targetFields?: string[],
  errorTarget?: 'currentField' | 'allTargetFields' | string[]
): {
  field: string;
  message: string;
  rule: string;
  path: string[];
  pathLabels: string[];
  targetFieldLabels?: TargetFieldLabel[];
  errorTarget?: 'currentField' | 'allTargetFields' | string[];
} {
  const path = field.split('.');
  const pathLabels = buildPathLabels(field, fieldConfigMap);

  const result: ReturnType<typeof buildValidationError> = {
    field,
    message,
    rule,
    path,
    pathLabels,
    errorTarget,
  };

  if (targetFields && targetFields.length > 0) {
    result.targetFieldLabels = buildTargetFieldLabels(targetFields, fieldConfigMap);
  }

  return result;
}
