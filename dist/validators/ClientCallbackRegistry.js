"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientCallbackRegistry = void 0;
exports.getClientRegistry = getClientRegistry;
exports.resetClientRegistry = resetClientRegistry;
class ClientCallbackRegistry {
    callbacks = new Map();
    constructor() {
        this.registerPredefinedValidators();
    }
    register(name, callback, description = '', parameterized = false) {
        this.callbacks.set(name, { callback, description, parameterized });
    }
    has(name) {
        if (!name)
            return false;
        return this.callbacks.has(name);
    }
    get(name) {
        return this.callbacks.get(name)?.callback;
    }
    execute(name, values, params) {
        const entry = this.callbacks.get(name);
        if (!entry) {
            console.warn(`ClientCallbackRegistry: Unknown callback '${name}'`);
            return true;
        }
        return entry.callback(values, params);
    }
    getRegisteredNames() {
        return Array.from(this.callbacks.keys());
    }
    registerPredefinedValidators() {
        const getTargetValues = (values) => Object.entries(values)
            .filter(([key]) => key !== '_currentValue')
            .map(([, val]) => val);
        this.register('isNotEmpty', (values) => {
            const targetVals = getTargetValues(values);
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
        }, 'Checks if the target field is not empty');
        this.register('isTrue', (values) => {
            const targetVals = getTargetValues(values);
            const val = targetVals.find((v) => v !== undefined);
            return val === true;
        }, 'Checks if boolean field value is true');
        this.register('isFalse', (values) => {
            const targetVals = getTargetValues(values);
            const val = targetVals.find((v) => v !== undefined);
            return val === false;
        }, 'Checks if boolean field value is false');
        this.register('passwordMatch', (values) => {
            const targetVals = getTargetValues(values).filter((v) => v !== undefined);
            if (targetVals.length < 2)
                return false;
            const [first, ...rest] = targetVals;
            return rest.every((val) => val === first);
        }, 'Checks if all specified fields have the same value');
        this.register('emailMatch', (values) => {
            const targetVals = getTargetValues(values).filter((v) => v !== undefined);
            if (targetVals.length < 2)
                return false;
            const [first, ...rest] = targetVals;
            return rest.every((val) => val === first);
        }, 'Checks if all specified email fields have the same value');
        this.register('compare', (values, params) => {
            const targetVals = getTargetValues(values).filter((v) => v !== undefined);
            if (targetVals.length < 2)
                return false;
            const [a, b] = targetVals;
            const operator = params?.operator || '==';
            switch (operator) {
                case '==':
                    return a === b;
                case '!=':
                    return a !== b;
                case '<':
                    return Number(a) < Number(b);
                case '>':
                    return Number(a) > Number(b);
                case '<=':
                    return Number(a) <= Number(b);
                case '>=':
                    return Number(a) >= Number(b);
                default:
                    return a === b;
            }
        }, 'Compares two field values with specified operator', true);
        this.register('dateRangeValid', (values) => {
            const dates = getTargetValues(values)
                .filter((v) => v !== undefined)
                .map((v) => new Date(v));
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
        }, 'Validates that dates are in ascending order');
        this.register('numericRangeValid', (values) => {
            const numbers = getTargetValues(values)
                .filter((v) => v !== undefined)
                .map((v) => Number(v));
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
        }, 'Validates that numeric values are in ascending order');
        this.register('atLeastOneRequired', (values) => {
            const targetVals = getTargetValues(values);
            return targetVals.some((val) => {
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
        }, 'Checks if at least one target field is not empty');
        this.register('arrayContains', (values, params) => {
            const targetVals = getTargetValues(values);
            const arr = targetVals.find((v) => v !== undefined);
            if (!Array.isArray(arr))
                return false;
            return arr.includes(params?.value);
        }, 'Checks if array contains a specific value', true);
        this.register('arrayNotContains', (values, params) => {
            const targetVals = getTargetValues(values);
            const arr = targetVals.find((v) => v !== undefined);
            if (!Array.isArray(arr))
                return true;
            return !arr.includes(params?.value);
        }, 'Checks if array does NOT contain a specific value', true);
        this.register('arrayContainsAny', (values, params) => {
            const targetVals = getTargetValues(values);
            const arr = targetVals.find((v) => v !== undefined);
            if (!Array.isArray(arr))
                return false;
            const checkValues = params?.values || [];
            return checkValues.some((v) => arr.includes(v));
        }, 'Checks if array contains any of the specified values', true);
        this.register('matchesPattern', (values, params) => {
            const targetVals = getTargetValues(values);
            const val = targetVals.find((v) => v !== undefined);
            if (typeof val !== 'string')
                return false;
            if (!params?.pattern)
                return true;
            try {
                const regex = new RegExp(params.pattern);
                return regex.test(val);
            }
            catch {
                return true;
            }
        }, 'Checks if string matches a pattern', true);
        this.register('equals', (values, params) => {
            const targetVals = getTargetValues(values);
            const val = targetVals.find((v) => v !== undefined);
            return val === params?.value;
        }, 'Checks if value equals a specific value', true);
        this.register('notEquals', (values, params) => {
            const targetVals = getTargetValues(values);
            const val = targetVals.find((v) => v !== undefined);
            return val !== params?.value;
        }, 'Checks if value does NOT equal a specific value', true);
        this.register('valueIn', (values, params) => {
            const targetVals = getTargetValues(values);
            const val = targetVals.find((v) => v !== undefined);
            const allowedValues = params?.values || [];
            return allowedValues.includes(val);
        }, 'Checks if value is in the allowed values list', true);
        this.register('valueNotIn', (values, params) => {
            const targetVals = getTargetValues(values);
            const val = targetVals.find((v) => v !== undefined);
            const disallowedValues = params?.values || [];
            return !disallowedValues.includes(val);
        }, 'Checks if value is NOT in the disallowed values list', true);
    }
}
exports.ClientCallbackRegistry = ClientCallbackRegistry;
let globalClientRegistry = null;
function getClientRegistry() {
    if (!globalClientRegistry) {
        globalClientRegistry = new ClientCallbackRegistry();
    }
    return globalClientRegistry;
}
function resetClientRegistry() {
    globalClientRegistry = null;
}
//# sourceMappingURL=ClientCallbackRegistry.js.map