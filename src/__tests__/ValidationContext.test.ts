/**
 * ValidationContext Tests
 */

import { ValidationContext } from '../core/ValidationContext';
import { FormConfig } from '../types';

describe('ValidationContext', () => {
  let context: ValidationContext;
  const formData = {
    user: {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      address: {
        city: 'New York',
        zipCode: '10001',
      },
    },
    settings: {
      notifications: true,
    },
  };

  const formConfig: FormConfig = {
    formId: 'test-form',
  };

  beforeEach(() => {
    context = new ValidationContext(formData, formConfig, { mode: 'sequential' });
  });

  describe('getValue', () => {
    it('should get top-level value', () => {
      expect(context.getValue('settings')).toEqual({ notifications: true });
    });

    it('should get nested value', () => {
      expect(context.getValue('user.firstName')).toBe('John');
    });

    it('should get deeply nested value', () => {
      expect(context.getValue('user.address.city')).toBe('New York');
    });

    it('should return undefined for non-existent path', () => {
      expect(context.getValue('nonexistent.field')).toBeUndefined();
    });

    it('should return undefined for partial path', () => {
      expect(context.getValue('user.address.nonexistent')).toBeUndefined();
    });
  });

  describe('setValue', () => {
    it('should set top-level value', () => {
      context.setValue('newField', 'newValue');
      expect(context.getValue('newField')).toBe('newValue');
    });

    it('should set nested value', () => {
      context.setValue('user.email', '[email protected]');
      expect(context.getValue('user.email')).toBe('[email protected]');
    });

    it('should set deeply nested value', () => {
      context.setValue('user.address.street', '123 Main St');
      expect(context.getValue('user.address.street')).toBe('123 Main St');
    });

    it('should create intermediate objects', () => {
      context.setValue('new.nested.field', 'value');
      expect(context.getValue('new.nested.field')).toBe('value');
    });
  });

  describe('hasField', () => {
    it('should return true for existing field', () => {
      expect(context.hasField('user.firstName')).toBe(true);
    });

    it('should return true for existing nested field', () => {
      expect(context.hasField('user.address.city')).toBe(true);
    });

    it('should return false for non-existent field', () => {
      expect(context.hasField('user.nonexistent')).toBe(false);
    });

    it('should return false for partial path', () => {
      expect(context.hasField('user.address.nonexistent')).toBe(false);
    });
  });

  describe('createChild', () => {
    it('should create child context with new path', () => {
      const childContext = context.createChild(['user', 'address']);
      expect(childContext.path).toEqual(['user', 'address']);
      expect(childContext.getPathString()).toBe('user.address');
    });

    it('should create child context with new data', () => {
      const newData = { test: 'value' };
      const childContext = context.createChild(['test'], newData);
      expect(childContext.data).toEqual(newData);
    });

    it('should preserve cache and external context', () => {
      const cache = new Map();
      const externalContext = { userId: 123 };
      const contextWithExtras = new ValidationContext(
        formData,
        formConfig,
        {
          mode: 'sequential',
          cache: { enabled: true },
        },
        {
          cache,
          externalContext,
        }
      );

      const childContext = contextWithExtras.createChild(['child']);
      expect(childContext.cache).toBe(cache);
      expect(childContext.externalContext).toBe(externalContext);
    });
  });

  describe('clone', () => {
    it('should clone with updated data', () => {
      const newData = { test: 'value' };
      const clonedContext = context.clone({ data: newData });
      expect(clonedContext.data).toEqual(newData);
      expect(clonedContext.config).toBe(context.config);
    });

    it('should clone with updated path', () => {
      const newPath = ['new', 'path'];
      const clonedContext = context.clone({ path: newPath });
      expect(clonedContext.path).toEqual(newPath);
      expect(clonedContext.data).toBe(context.data);
    });
  });

  describe('getPathString', () => {
    it('should return empty string for empty path', () => {
      expect(context.getPathString()).toBe('');
    });

    it('should return joined path', () => {
      const childContext = context.createChild(['user', 'address', 'city']);
      expect(childContext.getPathString()).toBe('user.address.city');
    });
  });
});
