/**
 * ComputedProcessors Tests
 *
 * Tests for all computed validation processors:
 * - ExactMatchProcessor
 * - NumericMatchProcessor
 * - ArrayMatchProcessor
 * - KeywordMatchProcessor
 * - AggregateProcessor
 */

import { ExactMatchProcessor } from '../processors/computed/ExactMatchProcessor';
import { NumericMatchProcessor } from '../processors/computed/NumericMatchProcessor';
import { ArrayMatchProcessor } from '../processors/computed/ArrayMatchProcessor';
import { KeywordMatchProcessor } from '../processors/computed/KeywordMatchProcessor';
import { AggregateProcessor } from '../processors/computed/AggregateProcessor';
import { ValidationRule, ComputedRule } from 'formfiller-schema';

describe('ComputedProcessors', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ExactMatchProcessor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ExactMatchProcessor', () => {
    let processor: ExactMatchProcessor;

    beforeEach(() => {
      processor = new ExactMatchProcessor();
    });

    describe('String matching', () => {
      it('should return correct=true for exact string match (case insensitive)', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'Budapest',
        };

        const result = processor.evaluate('budapest', rule);

        expect(result.correct).toBe(true);
        expect(result.earnedPoints).toBe(1);
        expect(result.message).toBeNull();
      });

      it('should return correct=true for match with leading/trailing spaces', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'Budapest',
        };

        const result = processor.evaluate('  Budapest  ', rule);

        expect(result.correct).toBe(true);
      });

      it('should return correct=false for incorrect string', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'Budapest',
          message: 'Wrong city!',
        };

        const result = processor.evaluate('Vienna', rule);

        expect(result.correct).toBe(false);
        expect(result.earnedPoints).toBe(0);
        expect(result.message).toBe('Wrong city!');
      });

      it('should use default message when no custom message provided', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'Budapest',
        };

        const result = processor.evaluate('Vienna', rule);

        expect(result.message).toContain('Budapest');
      });
    });

    describe('Number matching', () => {
      it('should return correct=true for exact number match', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 42,
          points: 2,
        };

        const result = processor.evaluate(42, rule);

        expect(result.correct).toBe(true);
        expect(result.earnedPoints).toBe(2);
        expect(result.points).toBe(2);
      });

      it('should return correct=true for number as string match', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 42,
        };

        const result = processor.evaluate('42', rule);

        expect(result.correct).toBe(true);
      });

      it('should return correct=false for incorrect number', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 42,
        };

        const result = processor.evaluate(43, rule);

        expect(result.correct).toBe(false);
      });

      it('should return correct=false for NaN input', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 42,
        };

        const result = processor.evaluate('not a number', rule);

        expect(result.correct).toBe(false);
      });
    });

    describe('Points and Penalty', () => {
      it('should apply penalty for incorrect answer', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'correct',
          points: 5,
          penalty: 2,
        };

        const result = processor.evaluate('wrong', rule);

        expect(result.correct).toBe(false);
        expect(result.earnedPoints).toBe(-2);
        expect(result.penalty).toBe(2);
      });

      it('should use default points (1) when not specified', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'test',
        };

        const result = processor.evaluate('test', rule);

        expect(result.points).toBe(1);
        expect(result.earnedPoints).toBe(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle null input', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'test',
        };

        const result = processor.evaluate(null, rule);

        expect(result.correct).toBe(false);
        expect(result.userAnswer).toBeNull();
      });

      it('should handle undefined input', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'test',
        };

        const result = processor.evaluate(undefined, rule);

        expect(result.correct).toBe(false);
      });

      it('should handle empty string', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: '',
        };

        const result = processor.evaluate('', rule);

        expect(result.correct).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NumericMatchProcessor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NumericMatchProcessor', () => {
    let processor: NumericMatchProcessor;

    beforeEach(() => {
      processor = new NumericMatchProcessor();
    });

    describe('Exact numeric match', () => {
      it('should return correct=true for exact match', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
        };

        const result = processor.evaluate(100, rule);

        expect(result.correct).toBe(true);
        expect(result.earnedPoints).toBe(1);
      });

      it('should return correct=false for non-matching value', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
        };

        const result = processor.evaluate(99, rule);

        expect(result.correct).toBe(false);
      });
    });

    describe('Tolerance matching', () => {
      it('should return correct=true within tolerance', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
          tolerance: 5,
        };

        const result = processor.evaluate(103, rule);

        expect(result.correct).toBe(true);
      });

      it('should return correct=true at tolerance boundary', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
          tolerance: 5,
        };

        const result = processor.evaluate(105, rule);

        expect(result.correct).toBe(true);
      });

      it('should return correct=false outside tolerance', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
          tolerance: 5,
        };

        const result = processor.evaluate(106, rule);

        expect(result.correct).toBe(false);
        expect(result.message).toContain('±5');
      });

      it('should return correct=true for negative direction tolerance', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
          tolerance: 5,
        };

        const result = processor.evaluate(95, rule);

        expect(result.correct).toBe(true);
      });
    });

    describe('Invalid inputs', () => {
      it('should return correct=false for non-numeric user input', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
        };

        const result = processor.evaluate('abc', rule);

        expect(result.correct).toBe(false);
        expect(result.message).toBe('Érvénytelen szám');
      });

      it('should handle string numbers correctly', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 100,
        };

        const result = processor.evaluate('100', rule);

        expect(result.correct).toBe(true);
      });
    });

    describe('Points and penalties', () => {
      it('should award correct points on match', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 42,
          points: 10,
        };

        const result = processor.evaluate(42, rule);

        expect(result.earnedPoints).toBe(10);
      });

      it('should apply penalty on mismatch', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 42,
          points: 10,
          penalty: 3,
        };

        const result = processor.evaluate(0, rule);

        expect(result.earnedPoints).toBe(-3);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ArrayMatchProcessor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ArrayMatchProcessor', () => {
    let processor: ArrayMatchProcessor;

    beforeEach(() => {
      processor = new ArrayMatchProcessor();
    });

    describe('Exact array match', () => {
      it('should return correct=true for exact array match (same order)', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A', 'B', 'C'],
        };

        const result = processor.evaluate(['A', 'B', 'C'], rule);

        expect(result.correct).toBe(true);
        expect(result.earnedPoints).toBe(1);
      });

      it('should return correct=true for exact match regardless of order', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A', 'B', 'C'],
        };

        const result = processor.evaluate(['C', 'A', 'B'], rule);

        expect(result.correct).toBe(true);
      });

      it('should return correct=false for partial match without partialCredit', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A', 'B', 'C'],
          partialCredit: false,
        };

        const result = processor.evaluate(['A', 'B'], rule);

        expect(result.correct).toBe(false);
      });

      it('should return correct=false for extra items', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A', 'B'],
        };

        const result = processor.evaluate(['A', 'B', 'C'], rule);

        expect(result.correct).toBe(false);
      });
    });

    describe('Partial credit', () => {
      it('should award partial credit for partial match', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A', 'B', 'C'],
          points: 3,
          partialCredit: true,
        };

        const result = processor.evaluate(['A', 'B'], rule);

        expect(result.correct).toBe(false);
        expect(result.earnedPoints).toBeGreaterThan(0);
        expect(result.earnedPoints).toBeLessThan(3);
        expect(result.message).toContain('2/3');
      });

      it('should apply penalty for incorrect items with partial credit', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A', 'B', 'C'],
          points: 3,
          penalty: 1,
          partialCredit: true,
        };

        const result = processor.evaluate(['A', 'D'], rule);

        // 1 correct (A), 1 incorrect (D)
        expect(result.earnedPoints).toBeLessThan(1); // Should have penalty applied
      });
    });

    describe('Single value to array', () => {
      it('should convert single value to array for comparison', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A'],
        };

        const result = processor.evaluate('A', rule);

        expect(result.correct).toBe(true);
      });
    });

    describe('Invalid configuration', () => {
      it('should return error for non-array correctAnswer', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: 'not an array',
        };

        const result = processor.evaluate(['A'], rule);

        expect(result.correct).toBe(false);
        expect(result.message).toContain('Invalid configuration');
      });
    });

    describe('Points and penalties', () => {
      it('should use custom points', () => {
        const rule: ValidationRule = {
          type: 'computed',
          correctAnswer: ['A', 'B'],
          points: 5,
        };

        const result = processor.evaluate(['A', 'B'], rule);

        expect(result.points).toBe(5);
        expect(result.earnedPoints).toBe(5);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // KeywordMatchProcessor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('KeywordMatchProcessor', () => {
    let processor: KeywordMatchProcessor;

    beforeEach(() => {
      processor = new KeywordMatchProcessor();
    });

    describe('Required keywords', () => {
      it('should return correct=true when all required keywords present', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: {
            required: ['important', 'keyword'],
            optional: [],
          },
        };

        const result = processor.evaluate('This text has an important keyword inside.', rule);

        expect(result.correct).toBe(true);
      });

      it('should return correct=false when required keyword missing', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: {
            required: ['important', 'missing'],
            optional: [],
          },
        };

        const result = processor.evaluate('This text has an important word.', rule);

        expect(result.correct).toBe(false);
        expect(result.message).toContain('missing');
      });

      it('should be case insensitive', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: {
            required: ['IMPORTANT'],
            optional: [],
          },
        };

        const result = processor.evaluate('This is important text.', rule);

        expect(result.correct).toBe(true);
      });
    });

    describe('Minimum length', () => {
      it('should fail if text is shorter than minLength', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: { required: [], optional: [] },
          minLength: 100,
        };

        const result = processor.evaluate('Short text', rule);

        expect(result.correct).toBe(false);
        expect(result.message).toContain('100');
      });

      it('should pass if text meets minLength', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: { required: [], optional: [] },
          minLength: 5,
        };

        const result = processor.evaluate('Hello World', rule);

        expect(result.correct).toBe(true);
      });
    });

    describe('Optional keywords and partial credit', () => {
      it('should award full points with 50%+ optional keywords', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: {
            required: ['main'],
            optional: ['extra1', 'extra2', 'extra3', 'extra4'],
          },
          points: 10,
          partialCredit: true,
        };

        const result = processor.evaluate('main text with extra1 and extra2', rule);

        expect(result.correct).toBe(true);
        expect(result.earnedPoints).toBe(10); // Full points for 50%+ optional
      });

      it('should award partial points with some optional keywords', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: {
            required: ['main'],
            optional: ['extra1', 'extra2', 'extra3', 'extra4', 'extra5', 'extra6'],
          },
          points: 10,
          partialCredit: true,
        };

        const result = processor.evaluate('main text with extra1', rule);

        expect(result.correct).toBe(true);
        expect(result.earnedPoints).toBeGreaterThan(6);
        expect(result.earnedPoints).toBeLessThan(10);
      });

      it('should award base points with no optional keywords', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: {
            required: ['main'],
            optional: ['extra1', 'extra2'],
          },
          points: 10,
          partialCredit: true,
        };

        const result = processor.evaluate('main text only', rule);

        expect(result.correct).toBe(true);
        expect(result.earnedPoints).toBe(6); // 60% base
        expect(result.message).toContain('Bővítsd ki');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty input', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: { required: ['test'], optional: [] },
        };

        const result = processor.evaluate('', rule);

        expect(result.correct).toBe(false);
      });

      it('should handle null input', () => {
        const rule: ValidationRule = {
          type: 'computed',
          keywords: { required: ['test'], optional: [] },
        };

        const result = processor.evaluate(null, rule);

        expect(result.correct).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AggregateProcessor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('AggregateProcessor', () => {
    let processor: AggregateProcessor;

    beforeEach(() => {
      processor = new AggregateProcessor();
    });

    describe('Basic aggregation', () => {
      it('should aggregate field results correctly', () => {
        const fieldResults = {
          field1: {
            fieldName: 'field1',
            correct: true,
            points: 2,
            penalty: 0,
            earnedPoints: 2,
            message: null,
          },
          field2: {
            fieldName: 'field2',
            correct: true,
            points: 3,
            penalty: 0,
            earnedPoints: 3,
            message: null,
          },
          field3: {
            fieldName: 'field3',
            correct: false,
            points: 5,
            penalty: 0,
            earnedPoints: 0,
            message: 'Wrong',
          },
        };

        const config: ComputedRule = {
          id: 'test-basic',
          name: 'Basic Aggregate',
          type: 'aggregate',
          inputFields: ['field1', 'field2', 'field3'],
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.totalPoints).toBe(5);
        expect(result.maxPoints).toBe(10);
        expect(result.percentage).toBe(50);
        expect(result.breakdown).toHaveLength(3);
      });

      it('should handle empty inputFields', () => {
        const fieldResults = {};
        const config: ComputedRule = {
          id: 'test-empty',
          name: 'Empty Fields',
          type: 'aggregate',
          inputFields: [],
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.totalPoints).toBe(0);
        expect(result.maxPoints).toBe(0);
        expect(result.percentage).toBe(0);
        expect(result.message).toBe('No fields to aggregate');
      });

      it('should handle missing inputFields', () => {
        const fieldResults = {};
        const config = {
          type: 'aggregate',
        } as ComputedRule;

        const result = processor.aggregate(fieldResults, config);

        expect(result.totalPoints).toBe(0);
        expect(result.message).toBe('No fields to aggregate');
      });

      it('should skip missing field results', () => {
        const fieldResults = {
          field1: {
            fieldName: 'field1',
            correct: true,
            points: 5,
            penalty: 0,
            earnedPoints: 5,
            message: null,
          },
        };

        const config: ComputedRule = {
          id: 'test-skip-missing',
          name: 'Skip Missing',
          type: 'aggregate',
          inputFields: ['field1', 'field2', 'nonExistent'],
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.totalPoints).toBe(5);
        expect(result.maxPoints).toBe(5);
        expect(result.breakdown).toHaveLength(1);
      });
    });

    describe('Category aggregation', () => {
      it('should group results by category', () => {
        const fieldResults = {
          math1: {
            fieldName: 'math1',
            correct: true,
            points: 2,
            penalty: 0,
            earnedPoints: 2,
            message: null,
          },
          math2: {
            fieldName: 'math2',
            correct: true,
            points: 3,
            penalty: 0,
            earnedPoints: 3,
            message: null,
          },
          lang1: {
            fieldName: 'lang1',
            correct: true,
            points: 4,
            penalty: 0,
            earnedPoints: 4,
            message: null,
          },
        };

        const config: ComputedRule = {
          id: 'test-category',
          name: 'Category Aggregate',
          type: 'aggregate',
          inputFields: ['math1', 'math2', 'lang1'],
          categoryMapping: {
            math1: 'Mathematics',
            math2: 'Mathematics',
            lang1: 'Language',
          },
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.categories?.['Mathematics']).toBeDefined();
        expect(result.categories?.['Mathematics']?.score).toBe(5);
        expect(result.categories?.['Mathematics']?.max).toBe(5);
        expect(result.categories?.['Mathematics']?.percentage).toBe(100);

        expect(result.categories?.['Language']).toBeDefined();
        expect(result.categories?.['Language']?.score).toBe(4);
      });

      it('should use "Egyéb" for uncategorized fields', () => {
        const fieldResults = {
          field1: {
            fieldName: 'field1',
            correct: true,
            points: 5,
            penalty: 0,
            earnedPoints: 5,
            message: null,
          },
        };

        const config: ComputedRule = {
          id: 'test-uncategorized',
          name: 'Uncategorized',
          type: 'aggregate',
          inputFields: ['field1'],
          categoryMapping: {},
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.categories?.['Egyéb']).toBeDefined();
        expect(result.categories?.['Egyéb']?.score).toBe(5);
      });
    });

    describe('Evaluation rules', () => {
      it('should apply evaluation rules based on percentage', () => {
        const fieldResults = {
          field1: {
            fieldName: 'field1',
            correct: true,
            points: 10,
            penalty: 0,
            earnedPoints: 9,
            message: null,
          },
        };

        const config: ComputedRule = {
          id: 'test-eval-rules',
          name: 'Evaluation Rules',
          type: 'aggregate',
          inputFields: ['field1'],
          evaluationRules: [
            { condition: { percentage: ['>=', 90] }, result: 'Excellent', message: 'Great job!' },
            { condition: { percentage: ['>=', 70] }, result: 'Good', message: 'Nice work!' },
            { condition: { percentage: ['>=', 50] }, result: 'Pass', message: 'You passed!' },
            { condition: { percentage: ['<', 50] }, result: 'Fail', message: 'Try again!' },
          ],
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.evaluation).toBe('Excellent');
        expect(result.message).toBe('Great job!');
      });

      it('should apply first matching evaluation rule', () => {
        const fieldResults = {
          field1: {
            fieldName: 'field1',
            correct: true,
            points: 10,
            penalty: 0,
            earnedPoints: 5,
            message: null,
          },
        };

        const config: ComputedRule = {
          id: 'test-eval-1',
          name: 'Test Evaluation',
          type: 'aggregate',
          inputFields: ['field1'],
          evaluationRules: [
            { condition: { percentage: ['>=', 90] }, result: 'Excellent', message: 'Great!' },
            { condition: { percentage: ['>=', 50] }, result: 'Pass', message: 'OK!' },
            { condition: { percentage: ['<', 50] }, result: 'Fail', message: 'Fail!' },
          ],
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.evaluation).toBe('Pass');
        expect(result.message).toBe('OK!');
      });
    });

    describe('Rounding', () => {
      it('should round percentage to 1 decimal place', () => {
        const fieldResults = {
          field1: {
            fieldName: 'field1',
            correct: true,
            points: 3,
            penalty: 0,
            earnedPoints: 1,
            message: null,
          },
        };

        const config: ComputedRule = {
          id: 'test-aggregate-1',
          name: 'Test Aggregate',
          type: 'aggregate',
          inputFields: ['field1'],
        };

        const result = processor.aggregate(fieldResults, config);

        // 1/3 = 33.333...%, should be rounded to 33.3
        expect(result.percentage).toBe(33.3);
      });

      it('should round totalPoints to 2 decimal places', () => {
        const fieldResults = {
          field1: {
            fieldName: 'field1',
            correct: true,
            points: 1,
            penalty: 0,
            earnedPoints: 0.333,
            message: null,
          },
        };

        const config: ComputedRule = {
          id: 'test-aggregate-2',
          name: 'Test Aggregate 2',
          type: 'aggregate',
          inputFields: ['field1'],
        };

        const result = processor.aggregate(fieldResults, config);

        expect(result.totalPoints).toBe(0.33);
      });
    });
  });
});
