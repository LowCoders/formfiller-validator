/**
 * ExactMatchProcessor - Exact string/number match validation
 */

import { ValidationRule } from 'formfiller-schema';
import { ComputedValidationResult } from './types';

export class ExactMatchProcessor {
  /**
   * Evaluate exact match
   */
  evaluate(fieldValue: any, rule: ValidationRule): ComputedValidationResult {
    const correctAnswer = rule.correctAnswer;
    const points = rule.points ?? 1;
    const penalty = rule.penalty ?? 0;

    let isCorrect = false;

    // Handle different types
    if (typeof correctAnswer === 'number') {
      const userNum = Number(fieldValue);
      isCorrect = !isNaN(userNum) && userNum === correctAnswer;
    } else {
      // String comparison (case-insensitive)
      const userStr = (fieldValue ?? '').toString().toLowerCase().trim();
      const correctStr = (correctAnswer ?? '').toString().toLowerCase().trim();
      isCorrect = userStr === correctStr;
    }

    const earnedPoints = isCorrect ? points : penalty > 0 ? -penalty : 0;

    return {
      correct: isCorrect,
      points,
      penalty,
      earnedPoints,
      message: isCorrect ? null : (rule.message ?? `Helytelen! Helyes: ${correctAnswer}`),
      userAnswer: fieldValue,
      correctAnswer,
    };
  }
}
