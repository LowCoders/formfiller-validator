/**
 * ConditionalEvaluator Tests
 */

import { ConditionalEvaluator } from '../processors/ConditionalEvaluator';
import { ValidationContext } from '../core/ValidationContext';
import { FormConfig } from '../types';

describe('ConditionalEvaluator', () => {
  let evaluator: ConditionalEvaluator;
  let context: ValidationContext;

  beforeEach(() => {
    evaluator = new ConditionalEvaluator();

    const formData = {
      employmentType: 'employee',
      age: 25,
      country: 'US',
      hasVehicle: true,
      vehicleType: 'car',
    };

    const formConfig: FormConfig = {
      formId: 'test-form',
    };

    context = new ValidationContext(formData, formConfig, {});
  });

  describe('Simple Conditions', () => {
    it('should evaluate == operator correctly', () => {
      const condition = {
        field: 'employmentType',
        operator: '==' as const,
        value: 'employee',
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate != operator correctly', () => {
      const condition = {
        field: 'employmentType',
        operator: '!=' as const,
        value: 'unemployed',
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate > operator correctly', () => {
      const condition = {
        field: 'age',
        operator: '>' as const,
        value: 18,
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate < operator correctly', () => {
      const condition = {
        field: 'age',
        operator: '<' as const,
        value: 30,
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate >= operator correctly', () => {
      const condition = {
        field: 'age',
        operator: '>=' as const,
        value: 25,
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate <= operator correctly', () => {
      const condition = {
        field: 'age',
        operator: '<=' as const,
        value: 25,
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate in operator correctly', () => {
      const condition = {
        field: 'country',
        operator: 'in' as const,
        value: ['US', 'UK', 'CA'],
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate notIn operator correctly', () => {
      const condition = {
        field: 'country',
        operator: 'notIn' as const,
        value: ['FR', 'DE', 'ES'],
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });
  });

  describe('Logical Operators', () => {
    it('should evaluate AND condition correctly', () => {
      const condition = {
        and: [
          {
            field: 'employmentType',
            operator: '==' as const,
            value: 'employee',
          },
          {
            field: 'age',
            operator: '>=' as const,
            value: 18,
          },
        ],
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate OR condition correctly', () => {
      const condition = {
        or: [
          {
            field: 'employmentType',
            operator: '==' as const,
            value: 'unemployed',
          },
          {
            field: 'age',
            operator: '>=' as const,
            value: 18,
          },
        ],
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate NOT condition correctly', () => {
      const condition = {
        not: {
          field: 'employmentType',
          operator: '==' as const,
          value: 'unemployed',
        },
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate complex nested conditions', () => {
      const condition = {
        and: [
          {
            or: [
              {
                field: 'employmentType',
                operator: '==' as const,
                value: 'employee',
              },
              {
                field: 'employmentType',
                operator: '==' as const,
                value: 'self-employed',
              },
            ],
          },
          {
            field: 'age',
            operator: '>=' as const,
            value: 18,
          },
        ],
      };

      expect(evaluator.evaluate(condition, context)).toBe(true);
    });
  });

  describe('Array of Conditions (implicit AND)', () => {
    it('should evaluate array of conditions as AND', () => {
      const conditions = [
        {
          field: 'hasVehicle',
          operator: '==' as const,
          value: true,
        },
        {
          field: 'vehicleType',
          operator: '==' as const,
          value: 'car',
        },
      ];

      expect(evaluator.evaluate(conditions, context)).toBe(true);
    });

    it('should fail if any condition in array fails', () => {
      const conditions = [
        {
          field: 'hasVehicle',
          operator: '==' as const,
          value: true,
        },
        {
          field: 'vehicleType',
          operator: '==' as const,
          value: 'motorcycle',
        },
      ];

      expect(evaluator.evaluate(conditions, context)).toBe(false);
    });
  });
});
