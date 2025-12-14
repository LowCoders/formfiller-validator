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
export * from './validators';
export * from './types';
export { DependencyGraphBuilder } from './utils/DependencyGraphBuilder';

// Server-side Core (Joi-dependent)
export { Validator } from './core/Validator';
export { ValidationContext } from './core/ValidationContext';
export { ValidationResult } from './core/ValidationResult';
export { CallbackRegistry, getGlobalRegistry, resetGlobalRegistry } from './core/CallbackRegistry';

// Processors (Joi-dependent)
export { ConfigProcessor } from './processors/ConfigProcessor';
export { ConditionalEvaluator } from './processors/ConditionalEvaluator';
export { ValidationConditionEvaluator } from './processors/ValidationConditionEvaluator';

// Adapters (Joi-dependent)
export { JoiAdapter } from './adapters/JoiAdapter';

// Computed processors
export * from './processors/computed';
