/**
 * Client Validator Exports
 *
 * Lightweight validator for client-side validation (browser-safe, no Joi dependency)
 */

export { ClientValidator } from './ClientValidator';
export { ClientValidationContext } from './ClientValidationContext';
export { ClientValidationResult } from './ClientValidationResult';
export { ClientConditionalEvaluator } from './ClientConditionalEvaluator';
export { ClientValidationConditionEvaluator } from './ClientValidationConditionEvaluator';
export {
  ClientCallbackRegistry,
  getClientRegistry,
  resetClientRegistry,
} from './ClientCallbackRegistry';

export type { ClientValidationError } from './ClientValidationResult';
export type { ClientCrossFieldCallback } from './ClientCallbackRegistry';
