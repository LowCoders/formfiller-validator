/**
 * KeywordMatchProcessor - Keyword-based validation for text areas
 */

import { ValidationRule } from 'formfiller-schema';
import { ComputedValidationResult } from './types';

export class KeywordMatchProcessor {
  /**
   * Evaluate keyword match
   */
  evaluate(fieldValue: any, rule: ValidationRule): ComputedValidationResult {
    const points = rule.points ?? 1;
    const penalty = rule.penalty ?? 0;
    const partialCredit = rule.partialCredit ?? true;
    const keywords = rule.keywords ?? { required: [], optional: [] };
    const minLength = rule.minLength ?? 0;

    const userText = (fieldValue ?? '').toString().toLowerCase();
    const required = keywords.required ?? [];
    const optional = keywords.optional ?? [];

    // Check minimum length
    if (userText.length < minLength) {
      return {
        correct: false,
        points,
        penalty,
        earnedPoints: penalty > 0 ? -penalty : 0,
        message: rule.message ?? `A válasz túl rövid! Minimum ${minLength} karakter szükséges.`,
        userAnswer: fieldValue,
        correctAnswer: keywords,
      };
    }

    // Check required keywords
    const missingRequired = required.filter(
      (keyword: string) => !userText.includes(keyword.toLowerCase())
    );

    const hasAllRequired = missingRequired.length === 0;

    if (!hasAllRequired) {
      return {
        correct: false,
        points,
        penalty,
        earnedPoints: penalty > 0 ? -penalty : 0,
        message: rule.message ?? `Hiányzó kulcsszavak: ${missingRequired.join(', ')}`,
        userAnswer: fieldValue,
        correctAnswer: keywords,
      };
    }

    // Count optional keywords found
    const optionalCount = optional.filter((keyword: string) =>
      userText.includes(keyword.toLowerCase())
    ).length;

    let earnedPoints = points;
    let message: string | null = null;
    const isCorrect = true;

    if (partialCredit && optional.length > 0) {
      // Award partial credit based on optional keywords
      const optionalRatio = optionalCount / optional.length;

      if (optionalRatio >= 0.5) {
        // Full points if at least 50% of optional keywords present
        earnedPoints = points;
      } else if (optionalRatio > 0) {
        // Partial points based on ratio
        earnedPoints = points * (0.6 + 0.4 * optionalRatio); // 60-100% range
      } else {
        // Only required keywords present
        earnedPoints = points * 0.6; // 60% for basic answer
      }

      if (optionalCount === 0) {
        message = `Elfogadható válasz. Bővítsd ki: ${optional.slice(0, 3).join(', ')}`;
      }
    }

    return {
      correct: isCorrect,
      points,
      penalty,
      earnedPoints: Math.round(earnedPoints * 100) / 100, // Round to 2 decimals
      message,
      userAnswer: fieldValue,
      correctAnswer: keywords,
    };
  }
}
