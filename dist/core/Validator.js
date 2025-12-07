"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const ValidationContext_1 = require("./ValidationContext");
const ValidationResult_1 = require("./ValidationResult");
const ConfigProcessor_1 = require("../processors/ConfigProcessor");
const DependencyGraphBuilder_1 = require("../utils/DependencyGraphBuilder");
const CallbackRegistry_1 = require("./CallbackRegistry");
class Validator {
    config;
    configProcessor;
    dependencyGraphBuilder;
    registry;
    constructor(config = {}) {
        this.config = {
            mode: config.mode || 'sequential',
            locale: config.locale || 'en',
            cache: config.cache,
            devtools: config.devtools,
            monitoring: config.monitoring,
            replay: config.replay,
            tenantContext: config.tenantContext,
            adapter: config.adapter || 'joi',
            customValidators: config.customValidators,
        };
        this.registry = (0, CallbackRegistry_1.getGlobalRegistry)();
        if (config.customValidators) {
            Object.entries(config.customValidators).forEach(([name, callback]) => {
                this.registry.register(name, callback, {
                    type: 'custom',
                    description: `Custom validator: ${name}`,
                });
            });
        }
        this.configProcessor = new ConfigProcessor_1.ConfigProcessor(this.registry);
        this.dependencyGraphBuilder = new DependencyGraphBuilder_1.DependencyGraphBuilder();
    }
    async validate(data, formConfig, externalContext) {
        const startTime = Date.now();
        const result = new ValidationResult_1.ValidationResult();
        try {
            const dependencyGraph = this.dependencyGraphBuilder.build(formConfig);
            const context = new ValidationContext_1.ValidationContext(data, formConfig, this.config, {
                cache: this.config.cache?.enabled ? new Map() : undefined,
                dependencyGraph,
                externalContext,
                timestamp: new Date(),
            });
            const validationResult = await this.configProcessor.process(context);
            result.merge(validationResult);
            const duration = Date.now() - startTime;
            result.setMetadata({
                timestamp: context.timestamp,
                duration,
                executionMode: this.config.mode === 'parallel' ? 'parallel' : 'sequential',
                tenantContext: this.config.tenantContext,
            });
            if (this.config.devtools && dependencyGraph) {
                result.setDependencyGraph(this.exportDependencyGraph(dependencyGraph));
            }
            return result;
        }
        catch (error) {
            result.addError('_global', error instanceof Error ? error.message : 'Unknown validation error', 'system_error');
            return result;
        }
    }
    async validateField(fieldName, _value, data, formConfig, externalContext) {
        const fullResult = await this.validate(data, formConfig, externalContext);
        const result = new ValidationResult_1.ValidationResult();
        const fieldResult = fullResult.fieldResults?.[fieldName];
        if (fieldResult) {
            if (!fieldResult.valid) {
                result.addErrors(fieldResult.errors);
            }
        }
        return result;
    }
    exportDependencyGraph(_graph) {
        return {
            nodes: [],
            edges: [],
            levels: [],
            hasCircular: false,
        };
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.Validator = Validator;
//# sourceMappingURL=Validator.js.map