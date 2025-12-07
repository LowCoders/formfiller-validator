"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordMatchProcessor = void 0;
class KeywordMatchProcessor {
    evaluate(fieldValue, rule) {
        const points = rule.points ?? 1;
        const penalty = rule.penalty ?? 0;
        const partialCredit = rule.partialCredit ?? true;
        const keywords = rule.keywords ?? { required: [], optional: [] };
        const minLength = rule.minLength ?? 0;
        const userText = (fieldValue ?? '').toString().toLowerCase();
        const required = keywords.required ?? [];
        const optional = keywords.optional ?? [];
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
        const missingRequired = required.filter((keyword) => !userText.includes(keyword.toLowerCase()));
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
        const optionalCount = optional.filter((keyword) => userText.includes(keyword.toLowerCase())).length;
        let earnedPoints = points;
        let message = null;
        const isCorrect = true;
        if (partialCredit && optional.length > 0) {
            const optionalRatio = optionalCount / optional.length;
            if (optionalRatio >= 0.5) {
                earnedPoints = points;
            }
            else if (optionalRatio > 0) {
                earnedPoints = points * (0.6 + 0.4 * optionalRatio);
            }
            else {
                earnedPoints = points * 0.6;
            }
            if (optionalCount === 0) {
                message = `Elfogadható válasz. Bővítsd ki: ${optional.slice(0, 3).join(', ')}`;
            }
        }
        return {
            correct: isCorrect,
            points,
            penalty,
            earnedPoints: Math.round(earnedPoints * 100) / 100,
            message,
            userAnswer: fieldValue,
            correctAnswer: keywords,
        };
    }
}
exports.KeywordMatchProcessor = KeywordMatchProcessor;
//# sourceMappingURL=KeywordMatchProcessor.js.map