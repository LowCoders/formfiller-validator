export class ClientCallbackRegistry {
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
        this.register('atLeastOne', (values) => {
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
        this.register('sumEquals', (values) => {
            const currentValue = values._currentValue;
            const targetValues = getTargetValues(values).map((val) => Number(val) || 0);
            const sum = targetValues.reduce((acc, val) => acc + val, 0);
            return Number(currentValue) === sum;
        }, 'Checks if current field value equals sum of target fields');
        this.register('percentageSum', (values) => {
            const allValues = getTargetValues(values).map((val) => Number(val) || 0);
            const sum = allValues.reduce((acc, val) => acc + val, 0);
            return sum === 100;
        }, 'Checks if all percentage fields sum to exactly 100%');
        this.register('dateInRange', (values) => {
            const currentValue = values._currentValue;
            const targetVals = getTargetValues(values).filter((v) => v !== undefined);
            if (targetVals.length < 2)
                return true;
            const [startVal, endVal] = targetVals;
            const projectStart = new Date(startVal);
            const projectEnd = new Date(endVal);
            const currentDate = new Date(currentValue);
            if (isNaN(projectStart.getTime()) || isNaN(projectEnd.getTime()))
                return true;
            if (isNaN(currentDate.getTime()))
                return true;
            return currentDate >= projectStart && currentDate <= projectEnd;
        }, 'Checks if current date is within date range');
        this.register('productEquals', (values) => {
            const currentValue = Number(values._currentValue) || 0;
            const targetValues = getTargetValues(values).map((val) => Number(val) || 0);
            if (targetValues.length === 0)
                return true;
            const product = targetValues.reduce((acc, val) => acc * val, 1);
            return currentValue === product;
        }, 'Checks if current field value equals product of target fields');
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
            const currentValue = values._currentValue;
            const targetVals = getTargetValues(values);
            if (params?.value !== undefined) {
                return currentValue === params.value;
            }
            const targetValue = targetVals.find((v) => v !== undefined);
            return currentValue === targetValue;
        }, 'Checks if current value equals target field value or a specific value', true);
        this.register('notEquals', (values, params) => {
            const currentValue = values._currentValue;
            const targetVals = getTargetValues(values);
            if (params?.value !== undefined) {
                return currentValue !== params.value;
            }
            return !targetVals.some(targetVal => currentValue === targetVal);
        }, 'Checks if value does NOT equal target field values or a specific value', true);
        this.register('lessThan', (values) => {
            const currentValue = values._currentValue;
            const targetVals = getTargetValues(values);
            const targetValue = targetVals.find(v => v !== undefined);
            if (currentValue === undefined || targetValue === undefined)
                return true;
            return Number(currentValue) < Number(targetValue);
        }, 'Checks if current value is less than target field value');
        this.register('greaterThan', (values) => {
            const currentValue = values._currentValue;
            const targetVals = getTargetValues(values);
            const targetValue = targetVals.find(v => v !== undefined);
            if (currentValue === undefined || targetValue === undefined)
                return true;
            return Number(currentValue) > Number(targetValue);
        }, 'Checks if current value is greater than target field value');
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
let globalClientRegistry = null;
export function getClientRegistry() {
    if (!globalClientRegistry) {
        globalClientRegistry = new ClientCallbackRegistry();
    }
    return globalClientRegistry;
}
export function resetClientRegistry() {
    globalClientRegistry = null;
}
//# sourceMappingURL=ClientCallbackRegistry.js.map