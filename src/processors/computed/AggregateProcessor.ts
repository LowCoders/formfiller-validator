/**
 * AggregateProcessor - Form-level aggregation and evaluation
 */

import { ConditionalEvaluator } from '../ConditionalEvaluator';
import { AggregateResult, FieldComputedResult, CategoryScore } from './types';
import { ComputedRule } from 'formfiller-schema';

export class AggregateProcessor {
  private conditionalEvaluator: ConditionalEvaluator;

  constructor() {
    this.conditionalEvaluator = new ConditionalEvaluator();
  }

  /**
   * Aggregate field-level computed results
   */
  aggregate(
    fieldResults: Record<string, FieldComputedResult>,
    config: ComputedRule
  ): AggregateResult {
    const breakdown: FieldComputedResult[] = [];
    const categoryScores: Record<string, CategoryScore> = {};

    let totalPoints = 0;
    let maxPoints = 0;

    // Category mapping (if provided)
    const categoryMap = config.categoryMapping ?? {};

    // Check if inputFields exists (required for aggregate type)
    if (!config.inputFields || config.inputFields.length === 0) {
      console.warn('[AggregateProcessor] No inputFields provided for aggregate rule');
      return {
        totalPoints: 0,
        maxPoints: 0,
        percentage: 0,
        evaluation: 'N/A',
        message: 'No fields to aggregate',
        breakdown: [],
        categories: {},
      };
    }

    // Collect field results
    for (const fieldName of config.inputFields) {
      const fieldResult = fieldResults[fieldName];

      if (fieldResult) {
        breakdown.push(fieldResult);
        totalPoints += fieldResult.earnedPoints;
        maxPoints += fieldResult.points;

        // Category aggregation
        const category = categoryMap[fieldName] ?? 'Egyéb';
        if (!categoryScores[category]) {
          categoryScores[category] = { score: 0, max: 0, percentage: 0 };
        }

        categoryScores[category].score += fieldResult.earnedPoints;
        categoryScores[category].max += fieldResult.points;
      }
    }

    // Calculate percentages
    const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    // Update category percentages
    for (const category in categoryScores) {
      const catScore = categoryScores[category];
      if (catScore) {
        catScore.percentage = catScore.max > 0 ? (catScore.score / catScore.max) * 100 : 0;
        // Round values
        catScore.score = Math.round(catScore.score * 100) / 100;
        catScore.percentage = Math.round(catScore.percentage * 10) / 10;
      }
    }

    // Evaluate result based on evaluation rules
    let evaluation: string | undefined;
    let message: string | undefined;

    if (config.evaluationRules && config.evaluationRules.length > 0) {
      // Create a mock context object with getValue method for evaluation
      const evalContext: any = {
        percentage,
        totalPoints,
        maxPoints,
        getValue: (fieldName: string) => {
          const data: Record<string, any> = { percentage, totalPoints, maxPoints };
          return data[fieldName];
        },
      };

      for (const rule of config.evaluationRules) {
        const shouldApply = this.conditionalEvaluator.evaluate(rule.condition, evalContext);

        if (shouldApply) {
          evaluation = rule.result;
          message = rule.message;
          break;
        }
      }
    }

    return {
      totalPoints: Math.round(totalPoints * 100) / 100,
      maxPoints,
      percentage: Math.round(percentage * 10) / 10,
      evaluation,
      message,
      breakdown,
      categories: categoryScores,
    };
  }
}
