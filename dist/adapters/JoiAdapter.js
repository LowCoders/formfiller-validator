"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoiAdapter = void 0;
const joi_1 = __importDefault(require("joi"));
function getCacheableRuleKey(rule) {
    const cacheableTypes = [
        'required',
        'email',
        'numeric',
        'stringLength',
        'arrayLength',
        'range',
        'pattern',
    ];
    if (!cacheableTypes.includes(rule.type)) {
        return null;
    }
    const keyParts = [rule.type];
    if (rule.min !== undefined)
        keyParts.push(`min:${rule.min}`);
    if (rule.max !== undefined)
        keyParts.push(`max:${rule.max}`);
    if (rule.pattern)
        keyParts.push(`pattern:${rule.pattern.toString()}`);
    if (rule.message)
        keyParts.push(`msg:${rule.message}`);
    return keyParts.join('|');
}
class JoiAdapter {
    registry;
    schemaCache = new Map();
    static MAX_CACHE_SIZE = 500;
    constructor(registry) {
        this.registry = registry;
    }
    getOrCreateSchema(rule, context) {
        const cacheKey = getCacheableRuleKey(rule);
        if (!cacheKey) {
            return this.createSchemaInternal(rule, context);
        }
        const cached = this.schemaCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const schema = this.createSchemaInternal(rule, context);
        if (this.schemaCache.size >= JoiAdapter.MAX_CACHE_SIZE) {
            const firstKey = this.schemaCache.keys().next().value;
            if (firstKey) {
                this.schemaCache.delete(firstKey);
            }
        }
        this.schemaCache.set(cacheKey, schema);
        return schema;
    }
    createSchema(rule, context) {
        return this.getOrCreateSchema(rule, context);
    }
    createSchemaInternal(rule, context) {
        switch (rule.type) {
            case 'required':
                return joi_1.default.any()
                    .required()
                    .custom((value, helpers) => {
                    if (value === null || value === undefined) {
                        return helpers.error('any.required');
                    }
                    if (typeof value === 'string' && value.trim() === '') {
                        return helpers.error('any.required');
                    }
                    return value;
                })
                    .messages({
                    'any.required': rule.message || 'This field is required',
                });
            case 'email':
                return joi_1.default.string()
                    .optional()
                    .allow('')
                    .custom((value, helpers) => {
                    if (value === '' || value === null || value === undefined) {
                        return value;
                    }
                    const emailRegex = /^[^ @]+@[^ @]+\.[^ @]+$/;
                    if (!emailRegex.test(value)) {
                        return helpers.error('string.email');
                    }
                    return value;
                })
                    .messages({
                    'string.email': rule.message || 'Invalid email format',
                });
            case 'numeric':
                return joi_1.default.number().messages({
                    'number.base': rule.message || 'Value must be a number',
                });
            case 'stringLength':
                return this.createStringLengthSchema(rule);
            case 'arrayLength':
                return this.createArrayLengthSchema(rule);
            case 'range':
                return this.createRangeSchema(rule);
            case 'pattern':
                return this.createPatternSchema(rule);
            case 'compare':
                return this.createCompareSchema(rule, context);
            case 'custom':
                return this.createCustomSchema(rule, context);
            case 'async':
                return this.createAsyncSchema(rule, context);
            case 'crossField':
                return this.createCrossFieldSchema(rule, context);
            case 'computed':
                return joi_1.default.any();
            case 'temporal':
                return this.createTemporalSchema(rule, context);
            case 'plugin':
                return this.createPluginSchema(rule, context);
            default:
                return joi_1.default.any();
        }
    }
    createStringLengthSchema(rule) {
        let schema = joi_1.default.string();
        if (rule.min !== undefined) {
            schema = schema.min(rule.min);
        }
        if (rule.max !== undefined) {
            schema = schema.max(rule.max);
        }
        return schema.messages({
            'string.min': rule.message || `String length must be at least ${rule.min}`,
            'string.max': rule.message || `String length must be at most ${rule.max}`,
        });
    }
    createArrayLengthSchema(rule) {
        let schema = joi_1.default.array();
        if (rule.min !== undefined) {
            schema = schema.min(rule.min);
        }
        if (rule.max !== undefined) {
            schema = schema.max(rule.max);
        }
        return schema.messages({
            'array.min': rule.message || `Array must have at least ${rule.min} items`,
            'array.max': rule.message || `Array must have at most ${rule.max} items`,
        });
    }
    createRangeSchema(rule) {
        let schema = joi_1.default.number();
        if (rule.min !== undefined) {
            schema = schema.min(rule.min);
        }
        if (rule.max !== undefined) {
            schema = schema.max(rule.max);
        }
        return schema.messages({
            'number.min': rule.message || `Value must be at least ${rule.min}`,
            'number.max': rule.message || `Value must be at most ${rule.max}`,
        });
    }
    createPatternSchema(rule) {
        if (!rule.pattern) {
            return joi_1.default.any();
        }
        const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
        return joi_1.default.string()
            .pattern(pattern)
            .messages({
            'string.pattern.base': rule.message || 'Value does not match the required pattern',
        });
    }
    createCompareSchema(rule, context) {
        if (!rule.comparisonTarget) {
            return joi_1.default.any();
        }
        const targetValue = context.getValue(rule.comparisonTarget);
        const comparisonType = rule.comparisonType || '==';
        const customMessage = rule.message || `Value must be ${comparisonType} ${targetValue}`;
        return joi_1.default.any()
            .custom((value, helpers) => {
            let isValid = false;
            switch (comparisonType) {
                case '==':
                    isValid = value == targetValue;
                    break;
                case '!=':
                    isValid = value != targetValue;
                    break;
                case '>':
                    isValid = value > targetValue;
                    break;
                case '<':
                    isValid = value < targetValue;
                    break;
                case '>=':
                    isValid = value >= targetValue;
                    break;
                case '<=':
                    isValid = value <= targetValue;
                    break;
            }
            if (!isValid) {
                return helpers.error('custom.compare');
            }
            return value;
        })
            .messages({
            'custom.compare': customMessage,
        });
    }
    createCustomSchema(rule, context) {
        if (!rule.validationCallback) {
            return joi_1.default.any();
        }
        const callback = typeof rule.validationCallback === 'string'
            ? this.resolveCallback(rule.validationCallback)
            : rule.validationCallback;
        return joi_1.default.any().custom(async (value, _helpers) => {
            try {
                const isValid = await callback(value, context);
                if (!isValid) {
                    throw new Error(rule.message || 'Custom validation failed');
                }
                return value;
            }
            catch (error) {
                throw error instanceof Error ? error : new Error(rule.message || 'Custom validation error');
            }
        });
    }
    resolveCallback(callbackName) {
        const callback = this.registry.get(callbackName);
        if (!callback) {
            console.warn(`⚠️  Validator "${callbackName}" not found in registry. Available validators: ${this.registry
                .listAll()
                .map((v) => v.name)
                .join(', ')}`);
            return () => {
                console.error(`Validator "${callbackName}" was not registered. Validation will fail.`);
                return false;
            };
        }
        return callback;
    }
    createAsyncSchema(rule, _context) {
        if (!rule.apiEndpoint) {
            return joi_1.default.any();
        }
        return joi_1.default.any().custom(async (value, _helpers) => {
            try {
                const timeout = rule.apiTimeout || 5000;
                const method = rule.apiMethod || 'POST';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const payload = rule.apiPayload || {};
                const response = await fetch(rule.apiEndpoint, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: method === 'POST' ? JSON.stringify({ value, ...payload }) : undefined,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(rule.message || 'External validation failed');
                }
                const result = (await response.json());
                if (!result.valid) {
                    throw new Error(result.message || rule.message || 'External validation failed');
                }
                return value;
            }
            catch (error) {
                throw error instanceof Error
                    ? error
                    : new Error(rule.message || 'External validation error');
            }
        });
    }
    createCrossFieldSchema(rule, context) {
        if (!rule.targetFields || !rule.crossFieldValidator) {
            return joi_1.default.any();
        }
        let validator;
        let params;
        if (typeof rule.crossFieldValidator === 'string') {
            validator = this.resolveCallback(rule.crossFieldValidator);
        }
        else if (typeof rule.crossFieldValidator === 'object' && 'name' in rule.crossFieldValidator) {
            validator = this.resolveCallback(rule.crossFieldValidator.name);
            params = rule.crossFieldValidator.params;
        }
        else if (typeof rule.crossFieldValidator === 'function') {
            validator = rule.crossFieldValidator;
        }
        else {
            return joi_1.default.any();
        }
        return joi_1.default.any().custom(async (value, _helpers) => {
            try {
                const values = {
                    _currentValue: value,
                };
                for (const targetField of rule.targetFields) {
                    values[targetField] = context.getValue(targetField);
                }
                if (params) {
                    context.params = params;
                }
                const isValid = await validator(values, context);
                if (params) {
                    delete context.params;
                }
                if (!isValid) {
                    throw new Error(rule.message || 'Cross-field validation failed');
                }
                return value;
            }
            catch (error) {
                throw error instanceof Error
                    ? error
                    : new Error(rule.message || 'Cross-field validation error');
            }
        });
    }
    createTemporalSchema(rule, _context) {
        const validFromDate = rule.validFrom
            ? typeof rule.validFrom === 'string'
                ? new Date(rule.validFrom)
                : rule.validFrom
            : null;
        const validUntilDate = rule.validUntil
            ? typeof rule.validUntil === 'string'
                ? new Date(rule.validUntil)
                : rule.validUntil
            : null;
        return joi_1.default.any()
            .custom((value, helpers) => {
            try {
                const now = new Date();
                if (validFromDate) {
                    if (now < validFromDate) {
                        const gracePeriod = rule.gracePeriod || 0;
                        const graceEnd = new Date(validFromDate.getTime() + gracePeriod);
                        if (now < graceEnd) {
                            return value;
                        }
                        return helpers.error('custom.temporal.notYetValid');
                    }
                }
                if (validUntilDate) {
                    if (now > validUntilDate) {
                        return helpers.error('custom.temporal.expired');
                    }
                }
                if (rule.schedule) {
                }
                return value;
            }
            catch (error) {
                return helpers.error('custom.temporal.error');
            }
        })
            .messages({
            'custom.temporal.notYetValid': rule.message ||
                `This field is not valid until ${validFromDate?.toISOString() || 'unknown'}`,
            'custom.temporal.expired': rule.message || `This field expired on ${validUntilDate?.toISOString() || 'unknown'}`,
            'custom.temporal.error': rule.message || 'Temporal validation error',
        });
    }
    createPluginSchema(rule, _context) {
        if (!rule.pluginName) {
            return joi_1.default.any();
        }
        return joi_1.default.any().custom(async (value, _helpers) => {
            try {
                console.warn(`Plugin validation not implemented: ${rule.pluginName}`);
                return value;
            }
            catch (error) {
                throw error instanceof Error ? error : new Error(rule.message || 'Plugin validation error');
            }
        });
    }
    async validate(value, rule, context) {
        const schema = this.createSchema(rule, context);
        try {
            await schema.validateAsync(value);
            return { valid: true };
        }
        catch (error) {
            if (error instanceof joi_1.default.ValidationError) {
                return {
                    valid: false,
                    error: error.message,
                };
            }
            if (error instanceof Error) {
                return {
                    valid: false,
                    error: error.message,
                };
            }
            return {
                valid: false,
                error: 'Validation error',
            };
        }
    }
    async validateRules(value, rules, context) {
        const errors = [];
        for (const rule of rules) {
            const result = await this.validate(value, rule, context);
            if (!result.valid && result.error) {
                errors.push(result.error);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    clearSchemaCache() {
        this.schemaCache.clear();
    }
    getSchemaCacheSize() {
        return this.schemaCache.size;
    }
}
exports.JoiAdapter = JoiAdapter;
//# sourceMappingURL=JoiAdapter.js.map