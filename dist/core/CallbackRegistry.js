"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackRegistry = void 0;
exports.getGlobalRegistry = getGlobalRegistry;
exports.resetGlobalRegistry = resetGlobalRegistry;
class CallbackRegistry {
    callbacks = new Map();
    register(name, callback, options = {}) {
        const { type = 'custom', description, overwrite = false } = options;
        if (this.callbacks.has(name) && !overwrite) {
            const existing = this.callbacks.get(name);
            if (existing.predefined) {
                console.warn(`Cannot override predefined validator "${name}". Use overwrite: true to force.`);
                return;
            }
        }
        this.callbacks.set(name, {
            callback,
            type,
            description,
            predefined: false,
        });
    }
    get(name) {
        return this.callbacks.get(name)?.callback;
    }
    has(name) {
        return this.callbacks.has(name);
    }
    unregister(name) {
        const entry = this.callbacks.get(name);
        if (entry?.predefined) {
            console.warn(`Cannot unregister predefined validator "${name}"`);
            return false;
        }
        return this.callbacks.delete(name);
    }
    listAll() {
        return Array.from(this.callbacks.entries()).map(([name, entry]) => ({
            name,
            type: entry.type,
            description: entry.description,
            predefined: entry.predefined,
        }));
    }
    clearCustom() {
        for (const [name, entry] of this.callbacks.entries()) {
            if (!entry.predefined) {
                this.callbacks.delete(name);
            }
        }
    }
    registerPredefined() {
        const predefinedValidators = this.getPredefinedValidators();
        for (const [name, { callback, type, description }] of Object.entries(predefinedValidators)) {
            this.callbacks.set(name, {
                callback,
                type,
                description,
                predefined: true,
            });
        }
        this.registerPredefinedComputedRules();
    }
    registerPredefinedComputedRules() {
    }
    getPredefinedValidators() {
        return {
            passwordMatch: {
                callback: (values) => {
                    const fieldValues = Object.values(values);
                    if (fieldValues.length < 2)
                        return false;
                    const [first, ...rest] = fieldValues;
                    return rest.every((val) => val === first);
                },
                type: 'crossField',
                description: 'Checks if all specified fields have the same value (typically used for password confirmation)',
            },
            emailMatch: {
                callback: (values) => {
                    const fieldValues = Object.values(values);
                    if (fieldValues.length < 2)
                        return false;
                    const [first, ...rest] = fieldValues;
                    return rest.every((val) => val === first);
                },
                type: 'crossField',
                description: 'Checks if all specified email fields have the same value',
            },
            dateRangeValid: {
                callback: (values) => {
                    const dates = Object.values(values).map((v) => new Date(v));
                    if (dates.length < 2)
                        return false;
                    if (dates.some((d) => isNaN(d.getTime())))
                        return false;
                    for (let i = 1; i < dates.length; i++) {
                        const current = dates[i];
                        const previous = dates[i - 1];
                        if (current && previous && current < previous)
                            return false;
                    }
                    return true;
                },
                type: 'crossField',
                description: 'Validates that dates are in ascending order (e.g., startDate < endDate)',
            },
            numericRangeValid: {
                callback: (values) => {
                    const numbers = Object.values(values).map((v) => Number(v));
                    if (numbers.length < 2)
                        return false;
                    if (numbers.some((n) => isNaN(n)))
                        return false;
                    for (let i = 1; i < numbers.length; i++) {
                        const current = numbers[i];
                        const previous = numbers[i - 1];
                        if (current !== undefined && previous !== undefined && current < previous)
                            return false;
                    }
                    return true;
                },
                type: 'crossField',
                description: 'Validates that numeric values are in ascending order (e.g., min <= max)',
            },
            notEmpty: {
                callback: (value) => {
                    if (value === null || value === undefined)
                        return false;
                    if (typeof value === 'string')
                        return value.trim().length > 0;
                    if (Array.isArray(value))
                        return value.length > 0;
                    if (typeof value === 'object')
                        return Object.keys(value).length > 0;
                    return true;
                },
                type: 'custom',
                description: 'Checks if value is not empty (strings, arrays, objects)',
            },
            isPositive: {
                callback: (value) => {
                    const num = Number(value);
                    return !isNaN(num) && num > 0;
                },
                type: 'custom',
                description: 'Checks if value is a positive number',
            },
            isNonNegative: {
                callback: (value) => {
                    const num = Number(value);
                    return !isNaN(num) && num >= 0;
                },
                type: 'custom',
                description: 'Checks if value is a non-negative number (>= 0)',
            },
            isNotEmpty: {
                callback: (values) => {
                    const targetVals = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    const val = targetVals.find((v) => v !== undefined);
                    if (val === null || val === undefined)
                        return false;
                    if (typeof val === 'string')
                        return val.trim().length > 0;
                    if (Array.isArray(val))
                        return val.length > 0;
                    if (typeof val === 'object')
                        return Object.keys(val).length > 0;
                    return true;
                },
                type: 'crossField',
                description: 'Checks if the target field is not empty (crossField version)',
            },
            isTrue: {
                callback: (values) => {
                    const targetVals = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    return targetVals.find((v) => v !== undefined) === true;
                },
                type: 'crossField',
                description: 'Checks if boolean field value is true',
            },
            isFalse: {
                callback: (values) => {
                    const targetVals = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    return targetVals.find((v) => v !== undefined) === false;
                },
                type: 'crossField',
                description: 'Checks if boolean field value is false',
            },
            equals: {
                callback: (values, context) => {
                    const targetVals = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    const val = targetVals.find((v) => v !== undefined);
                    const params = context.params;
                    return val === params?.value;
                },
                type: 'crossField',
                description: 'Checks if value equals a specific value',
            },
            valueIn: {
                callback: (values, context) => {
                    const targetVals = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    const val = targetVals.find((v) => v !== undefined);
                    const params = context.params;
                    const allowedValues = params?.values || [];
                    return allowedValues.includes(val);
                },
                type: 'crossField',
                description: 'Checks if value is in the allowed values list',
            },
            valueNotIn: {
                callback: (values, context) => {
                    const targetVals = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    const val = targetVals.find((v) => v !== undefined);
                    const params = context.params;
                    const disallowedValues = params?.values || [];
                    return !disallowedValues.includes(val);
                },
                type: 'crossField',
                description: 'Checks if value is NOT in the disallowed values list',
            },
            arrayContainsAny: {
                callback: (values, context) => {
                    const targetVals = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    const arr = targetVals.find((v) => v !== undefined);
                    const params = context.params;
                    const checkValues = params?.values || [];
                    if (!Array.isArray(arr))
                        return false;
                    return checkValues.some((v) => arr.includes(v));
                },
                type: 'crossField',
                description: 'Checks if array contains any of the specified values',
            },
            validateSumEquals: {
                callback: (values) => {
                    const currentValue = values._currentValue;
                    const targetValues = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => Number(val) || 0);
                    const sum = targetValues.reduce((acc, val) => acc + val, 0);
                    return Number(currentValue) === sum;
                },
                type: 'crossField',
                description: 'Checks if current field value equals sum of target fields',
            },
            validatePercentageSum: {
                callback: (values) => {
                    const allValues = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => Number(val) || 0);
                    const sum = allValues.reduce((acc, val) => acc + val, 0);
                    return sum === 100;
                },
                type: 'crossField',
                description: 'Checks if all percentage fields sum to exactly 100%',
            },
            validateDateInRange: {
                callback: (values) => {
                    const currentValue = values._currentValue;
                    const targetEntries = Object.entries(values).filter(([key]) => key !== '_currentValue');
                    if (targetEntries.length < 2)
                        return true;
                    const [startEntry, endEntry] = targetEntries;
                    const projectStart = new Date(startEntry?.[1]);
                    const projectEnd = new Date(endEntry?.[1]);
                    const currentDate = new Date(currentValue);
                    if (isNaN(projectStart.getTime()) || isNaN(projectEnd.getTime()))
                        return true;
                    if (isNaN(currentDate.getTime()))
                        return true;
                    return currentDate >= projectStart && currentDate <= projectEnd;
                },
                type: 'crossField',
                description: 'Checks if current date is within project start and end dates',
            },
            atLeastOneRequired: {
                callback: (values) => {
                    const targetValues = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => val);
                    return targetValues.some((val) => {
                        if (val === null || val === undefined)
                            return false;
                        if (typeof val === 'string')
                            return val.trim().length > 0;
                        if (Array.isArray(val))
                            return val.length > 0;
                        if (typeof val === 'object')
                            return Object.keys(val).length > 0;
                        return true;
                    });
                },
                type: 'crossField',
                description: 'Checks if at least one target field is not empty',
            },
            validateProductEquals: {
                callback: (values) => {
                    const currentValue = Number(values._currentValue) || 0;
                    const targetValues = Object.entries(values)
                        .filter(([key]) => key !== '_currentValue')
                        .map(([, val]) => Number(val) || 0);
                    if (targetValues.length === 0)
                        return true;
                    const product = targetValues.reduce((acc, val) => acc * val, 1);
                    return currentValue === product;
                },
                type: 'crossField',
                description: 'Checks if current field value equals product of target fields',
            },
        };
    }
}
exports.CallbackRegistry = CallbackRegistry;
let globalRegistry = null;
function getGlobalRegistry() {
    if (!globalRegistry) {
        globalRegistry = new CallbackRegistry();
        globalRegistry.registerPredefined();
    }
    return globalRegistry;
}
function resetGlobalRegistry() {
    globalRegistry = null;
}
//# sourceMappingURL=CallbackRegistry.js.map