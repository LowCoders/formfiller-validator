/**
 * CallbackRegistry Tests
 *
 * Tests for the callback registry that manages custom and predefined
 * validation callbacks.
 */

import { CallbackRegistry, getGlobalRegistry, resetGlobalRegistry } from '../core/CallbackRegistry';

describe('CallbackRegistry', () => {
  let registry: CallbackRegistry;

  beforeEach(() => {
    registry = new CallbackRegistry();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Basic Registration and Retrieval
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Basic registration and retrieval', () => {
    it('should register and retrieve a custom callback', () => {
      const callback = (value: any) => value > 0;
      registry.register('isPositive', callback);

      const retrieved = registry.get('isPositive');
      expect(retrieved).toBe(callback);
    });

    it('should return undefined for non-existent callback', () => {
      const retrieved = registry.get('nonExistent');
      expect(retrieved).toBeUndefined();
    });

    it('should check if callback exists', () => {
      registry.register('test', () => true);

      expect(registry.has('test')).toBe(true);
      expect(registry.has('nonExistent')).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Registration Options
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Registration options', () => {
    it('should register with custom type', () => {
      registry.register('crossFieldValidator', () => true, { type: 'crossField' });

      const list = registry.listAll();
      const entry = list.find((e) => e.name === 'crossFieldValidator');

      expect(entry?.type).toBe('crossField');
    });

    it('should register with description', () => {
      registry.register('myValidator', () => true, {
        description: 'This is a test validator',
      });

      const list = registry.listAll();
      const entry = list.find((e) => e.name === 'myValidator');

      expect(entry?.description).toBe('This is a test validator');
    });

    it('should default to custom type', () => {
      registry.register('defaultType', () => true);

      const list = registry.listAll();
      const entry = list.find((e) => e.name === 'defaultType');

      expect(entry?.type).toBe('custom');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Overwriting Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Overwriting callbacks', () => {
    it('should overwrite existing custom callback with overwrite: true', () => {
      const callback1 = () => true;
      const callback2 = () => false;

      registry.register('test', callback1);
      registry.register('test', callback2, { overwrite: true });

      const retrieved = registry.get('test');
      expect(retrieved).toBe(callback2);
    });

    it('should overwrite existing custom callback without overwrite flag (custom callbacks allow overwrite)', () => {
      const callback1 = () => true;
      const callback2 = () => false;

      registry.register('test', callback1);
      registry.register('test', callback2);

      // Custom callbacks can be overwritten without explicit flag
      const retrieved = registry.get('test');
      expect(retrieved).toBe(callback2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Unregistering Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Unregistering callbacks', () => {
    it('should unregister custom callback', () => {
      registry.register('toRemove', () => true);

      const result = registry.unregister('toRemove');

      expect(result).toBe(true);
      expect(registry.has('toRemove')).toBe(false);
    });

    it('should return false when unregistering non-existent callback', () => {
      const result = registry.unregister('nonExistent');
      expect(result).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Listing Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Listing callbacks', () => {
    it('should list all registered callbacks', () => {
      registry.register('validator1', () => true, { description: 'First' });
      registry.register('validator2', () => false, { type: 'crossField' });

      const list = registry.listAll();

      expect(list).toHaveLength(2);
      expect(list.find((e) => e.name === 'validator1')).toBeDefined();
      expect(list.find((e) => e.name === 'validator2')).toBeDefined();
    });

    it('should include predefined status in list', () => {
      registry.register('custom', () => true);

      const list = registry.listAll();
      const entry = list.find((e) => e.name === 'custom');

      expect(entry?.predefined).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Clearing Custom Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Clearing custom callbacks', () => {
    it('should clear all custom callbacks', () => {
      registry.register('custom1', () => true);
      registry.register('custom2', () => true);

      registry.clearCustom();

      expect(registry.has('custom1')).toBe(false);
      expect(registry.has('custom2')).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Predefined Validators
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Predefined validators', () => {
    beforeEach(() => {
      registry.registerPredefined();
    });

    it('should register passwordMatch validator', () => {
      expect(registry.has('passwordMatch')).toBe(true);
    });

    it('should register emailMatch validator', () => {
      expect(registry.has('emailMatch')).toBe(true);
    });

    it('should register dateRangeValid validator', () => {
      expect(registry.has('dateRangeValid')).toBe(true);
    });

    it('should register numericRangeValid validator', () => {
      expect(registry.has('numericRangeValid')).toBe(true);
    });

    it('should register notEmpty validator', () => {
      expect(registry.has('notEmpty')).toBe(true);
    });

    it('should register isPositive validator', () => {
      expect(registry.has('isPositive')).toBe(true);
    });

    it('should register isNonNegative validator', () => {
      expect(registry.has('isNonNegative')).toBe(true);
    });

    it('should register isNotEmpty validator', () => {
      expect(registry.has('isNotEmpty')).toBe(true);
    });

    it('should register isTrue validator', () => {
      expect(registry.has('isTrue')).toBe(true);
    });

    it('should register isFalse validator', () => {
      expect(registry.has('isFalse')).toBe(true);
    });

    it('should register atLeastOneRequired validator', () => {
      expect(registry.has('atLeastOneRequired')).toBe(true);
    });

    it('should mark predefined validators as predefined', () => {
      const list = registry.listAll();
      const passwordMatch = list.find((e) => e.name === 'passwordMatch');

      expect(passwordMatch?.predefined).toBe(true);
    });

    it('should not allow unregistering predefined validators', () => {
      const result = registry.unregister('passwordMatch');

      expect(result).toBe(false);
      expect(registry.has('passwordMatch')).toBe(true);
    });

    it('should not allow overwriting predefined without overwrite flag', () => {
      const customCallback = () => false;
      registry.register('passwordMatch', customCallback);

      // Should still have the original predefined callback
      const callback = registry.get('passwordMatch');
      expect(callback).not.toBe(customCallback);
    });

    it('should allow overwriting predefined with overwrite flag', () => {
      const customCallback = () => false;
      registry.register('passwordMatch', customCallback, { overwrite: true });

      const callback = registry.get('passwordMatch');
      expect(callback).toBe(customCallback);
    });

    it('should not clear predefined validators', () => {
      registry.clearCustom();

      expect(registry.has('passwordMatch')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Predefined Validator Functionality
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Predefined validator functionality', () => {
    beforeEach(() => {
      registry.registerPredefined();
    });

    describe('passwordMatch', () => {
      it('should return true for matching passwords', () => {
        const callback = registry.get('passwordMatch') as Function;
        const result = callback({ password: 'test123', confirmPassword: 'test123' });

        expect(result).toBe(true);
      });

      it('should return false for non-matching passwords', () => {
        const callback = registry.get('passwordMatch') as Function;
        const result = callback({ password: 'test123', confirmPassword: 'different' });

        expect(result).toBe(false);
      });

      it('should return false for single field', () => {
        const callback = registry.get('passwordMatch') as Function;
        const result = callback({ password: 'test123' });

        expect(result).toBe(false);
      });
    });

    describe('dateRangeValid', () => {
      it('should return true for valid date range', () => {
        const callback = registry.get('dateRangeValid') as Function;
        const result = callback({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });

        expect(result).toBe(true);
      });

      it('should return false for invalid date range', () => {
        const callback = registry.get('dateRangeValid') as Function;
        const result = callback({
          startDate: '2024-12-31',
          endDate: '2024-01-01',
        });

        expect(result).toBe(false);
      });

      it('should return false for invalid dates', () => {
        const callback = registry.get('dateRangeValid') as Function;
        const result = callback({
          startDate: 'not-a-date',
          endDate: '2024-01-01',
        });

        expect(result).toBe(false);
      });
    });

    describe('numericRangeValid', () => {
      it('should return true for valid numeric range', () => {
        const callback = registry.get('numericRangeValid') as Function;
        const result = callback({ min: 10, max: 100 });

        expect(result).toBe(true);
      });

      it('should return false for invalid numeric range', () => {
        const callback = registry.get('numericRangeValid') as Function;
        const result = callback({ min: 100, max: 10 });

        expect(result).toBe(false);
      });

      it('should return false for NaN values', () => {
        const callback = registry.get('numericRangeValid') as Function;
        const result = callback({ min: 'abc', max: 100 });

        expect(result).toBe(false);
      });
    });

    describe('notEmpty', () => {
      it('should return true for non-empty string', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback('hello')).toBe(true);
      });

      it('should return false for empty string', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback('')).toBe(false);
      });

      it('should return false for whitespace-only string', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback('   ')).toBe(false);
      });

      it('should return true for non-empty array', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback([1, 2, 3])).toBe(true);
      });

      it('should return false for empty array', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback([])).toBe(false);
      });

      it('should return true for non-empty object', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback({ key: 'value' })).toBe(true);
      });

      it('should return false for empty object', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback({})).toBe(false);
      });

      it('should return false for null', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback(undefined)).toBe(false);
      });

      it('should return true for number', () => {
        const callback = registry.get('notEmpty') as Function;
        expect(callback(42)).toBe(true);
      });
    });

    describe('isPositive', () => {
      it('should return true for positive number', () => {
        const callback = registry.get('isPositive') as Function;
        expect(callback(5)).toBe(true);
      });

      it('should return false for zero', () => {
        const callback = registry.get('isPositive') as Function;
        expect(callback(0)).toBe(false);
      });

      it('should return false for negative number', () => {
        const callback = registry.get('isPositive') as Function;
        expect(callback(-5)).toBe(false);
      });

      it('should return false for NaN', () => {
        const callback = registry.get('isPositive') as Function;
        expect(callback('abc')).toBe(false);
      });
    });

    describe('isNonNegative', () => {
      it('should return true for positive number', () => {
        const callback = registry.get('isNonNegative') as Function;
        expect(callback(5)).toBe(true);
      });

      it('should return true for zero', () => {
        const callback = registry.get('isNonNegative') as Function;
        expect(callback(0)).toBe(true);
      });

      it('should return false for negative number', () => {
        const callback = registry.get('isNonNegative') as Function;
        expect(callback(-5)).toBe(false);
      });
    });

    describe('isNotEmpty (crossField)', () => {
      it('should return true for non-empty target field', () => {
        const callback = registry.get('isNotEmpty') as Function;
        const result = callback({ targetField: 'value', _currentValue: '' });

        expect(result).toBe(true);
      });

      it('should return false for empty target field', () => {
        const callback = registry.get('isNotEmpty') as Function;
        const result = callback({ targetField: '', _currentValue: 'ignored' });

        expect(result).toBe(false);
      });
    });

    describe('isTrue', () => {
      it('should return true for true value', () => {
        const callback = registry.get('isTrue') as Function;
        const result = callback({ checkbox: true, _currentValue: '' });

        expect(result).toBe(true);
      });

      it('should return false for false value', () => {
        const callback = registry.get('isTrue') as Function;
        const result = callback({ checkbox: false, _currentValue: '' });

        expect(result).toBe(false);
      });
    });

    describe('isFalse', () => {
      it('should return true for false value', () => {
        const callback = registry.get('isFalse') as Function;
        const result = callback({ checkbox: false, _currentValue: '' });

        expect(result).toBe(true);
      });

      it('should return false for true value', () => {
        const callback = registry.get('isFalse') as Function;
        const result = callback({ checkbox: true, _currentValue: '' });

        expect(result).toBe(false);
      });
    });

    describe('atLeastOneRequired', () => {
      it('should return true when one field has value', () => {
        const callback = registry.get('atLeastOneRequired') as Function;
        const result = callback({
          email: 'test@example.com',
          phone: '',
          _currentValue: '',
        });

        expect(result).toBe(true);
      });

      it('should return false when all fields are empty', () => {
        const callback = registry.get('atLeastOneRequired') as Function;
        const result = callback({
          email: '',
          phone: '',
          _currentValue: '',
        });

        expect(result).toBe(false);
      });
    });

    describe('validateSumEquals', () => {
      it('should return true when current equals sum of targets', () => {
        const callback = registry.get('validateSumEquals') as Function;
        const result = callback({
          base: 20,
          extra: 5,
          _currentValue: 25,
        });

        expect(result).toBe(true);
      });

      it('should return false when current does not equal sum', () => {
        const callback = registry.get('validateSumEquals') as Function;
        const result = callback({
          base: 20,
          extra: 5,
          _currentValue: 30,
        });

        expect(result).toBe(false);
      });
    });

    describe('validatePercentageSum', () => {
      it('should return true when percentages sum to 100', () => {
        const callback = registry.get('validatePercentageSum') as Function;
        const result = callback({
          partner1: 40,
          partner2: 35,
          partner3: 25,
          _currentValue: '',
        });

        expect(result).toBe(true);
      });

      it('should return false when percentages do not sum to 100', () => {
        const callback = registry.get('validatePercentageSum') as Function;
        const result = callback({
          partner1: 40,
          partner2: 40,
          partner3: 30,
          _currentValue: '',
        });

        expect(result).toBe(false);
      });
    });

    describe('validateDateInRange', () => {
      it('should return true when date is in range', () => {
        const callback = registry.get('validateDateInRange') as Function;
        const result = callback({
          projectStart: '2024-01-01',
          projectEnd: '2024-12-31',
          _currentValue: '2024-06-15',
        });

        expect(result).toBe(true);
      });

      it('should return false when date is out of range', () => {
        const callback = registry.get('validateDateInRange') as Function;
        const result = callback({
          projectStart: '2024-01-01',
          projectEnd: '2024-12-31',
          _currentValue: '2025-01-15',
        });

        expect(result).toBe(false);
      });

      it('should return true for invalid current date (empty/invalid passes)', () => {
        const callback = registry.get('validateDateInRange') as Function;
        const result = callback({
          projectStart: '2024-01-01',
          projectEnd: '2024-12-31',
          _currentValue: 'not-a-date',
        });

        expect(result).toBe(true);
      });
    });

    describe('validateProductEquals', () => {
      it('should return true when current equals product of targets', () => {
        const callback = registry.get('validateProductEquals') as Function;
        const result = callback({
          hours: 40,
          rate: 25,
          _currentValue: 1000,
        });

        expect(result).toBe(true);
      });

      it('should return false when current does not equal product', () => {
        const callback = registry.get('validateProductEquals') as Function;
        const result = callback({
          hours: 40,
          rate: 25,
          _currentValue: 500,
        });

        expect(result).toBe(false);
      });

      it('should return true for empty target fields', () => {
        const callback = registry.get('validateProductEquals') as Function;
        const result = callback({
          _currentValue: 0,
        });

        expect(result).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Global Registry
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Global registry', () => {
    beforeEach(() => {
      resetGlobalRegistry();
    });

    it('should return same instance on multiple calls', () => {
      const registry1 = getGlobalRegistry();
      const registry2 = getGlobalRegistry();

      expect(registry1).toBe(registry2);
    });

    it('should have predefined validators registered', () => {
      const globalReg = getGlobalRegistry();

      expect(globalReg.has('passwordMatch')).toBe(true);
    });

    it('should reset and create new instance', () => {
      const registry1 = getGlobalRegistry();
      registry1.register('customValidator', () => true);

      resetGlobalRegistry();
      const registry2 = getGlobalRegistry();

      expect(registry2.has('customValidator')).toBe(false);
    });
  });
});
