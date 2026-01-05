/**
 * FormFiller Validator - Full Entry Point
 *
 * Includes Joi-based server-side validation.
 * Use this entry point when you need the full validation capabilities.
 *
 * For client-side (browser) usage, prefer the default entry point
 * which is Joi-free and lightweight.
 */

// Re-export everything from client (Joi-free)
export * from './validators/index.js';
export * from './types/index.js';
export { DependencyGraphBuilder } from './utils/DependencyGraphBuilder.js';

// Server-side Core (Joi-dependent)
export { Validator } from './core/Validator.js';
export { ValidationContext } from './core/ValidationContext.js';
export { ValidationResult } from './core/ValidationResult.js';
export { CallbackRegistry, getGlobalRegistry, resetGlobalRegistry } from './core/CallbackRegistry.js';

// Processors (Joi-dependent)
export { ConfigProcessor } from './processors/ConfigProcessor.js';
export { ConditionalEvaluator } from './processors/ConditionalEvaluator.js';
export { ValidationConditionEvaluator } from './processors/ValidationConditionEvaluator.js';

// Adapters (Joi-dependent)
export { JoiAdapter } from './adapters/JoiAdapter.js';

// Computed processors
export * from './processors/computed/index.js';
