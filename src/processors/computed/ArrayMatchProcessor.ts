/**
 * ArrayMatchProcessor - Array match validation for tagbox, checkbox groups
 */

import { ValidationRule } from 'formfiller-schema';
import { ComputedValidationResult } from './types';

export class ArrayMatchProcessor {
  /**
   * Evaluate array match
   */
  evaluate(fieldValue: any, rule: ValidationRule): ComputedValidationResult {
    const correctAnswer = rule.correctAnswer;
    const points = rule.points ?? 1;
    const penalty = rule.penalty ?? 0;
    const partialCredit = rule.partialCredit ?? false;

    if (!Array.isArray(correctAnswer)) {
      return {
        correct: false,
        points,
        penalty,
        earnedPoints: 0,
        message: 'Invalid configuration: correctAnswer must be an array',
        userAnswer: fieldValue,
        correctAnswer,
      };
    }

    const userArray = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

    // Sort for comparison (order doesn't matter)
    const sortedUser = [...userArray].sort();
    const sortedCorrect = [...correctAnswer].sort();

    const isExactMatch = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);

    let earnedPoints = 0;
    let message: string | null = null;

    if (isExactMatch) {
      earnedPoints = points;
    } else if (partialCredit) {
      // Calculate partial credit
      const correctCount = sortedUser.filter((val) => sortedCorrect.includes(val)).length;
      const incorrectCount = sortedUser.length - correctCount;

      // Partial points based on correct answers
      const partialPoints = (correctCount / sortedCorrect.length) * points;

      // Apply penalty for incorrect selections
      const penaltyAmount = incorrectCount * (penalty / sortedCorrect.length);

      earnedPoints = Math.max(0, partialPoints - penaltyAmount);

      message = `Részben helyes (${correctCount}/${sortedCorrect.length}). Helyes: ${correctAnswer.join(', ')}`;
    } else {
      earnedPoints = penalty > 0 ? -penalty : 0;
      message = rule.message ?? `Helytelen! Helyes: ${correctAnswer.join(', ')}`;
    }

    return {
      correct: isExactMatch,
      points,
      penalty,
      earnedPoints: Math.round(earnedPoints * 100) / 100, // Round to 2 decimals
      message,
      userAnswer: fieldValue,
      correctAnswer,
    };
  }
}
