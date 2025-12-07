"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumericMatchProcessor = void 0;
class NumericMatchProcessor {
    evaluate(fieldValue, rule) {
        const correctAnswer = rule.correctAnswer;
        const points = rule.points ?? 1;
        const penalty = rule.penalty ?? 0;
        const tolerance = rule.tolerance ?? 0;
        const userNum = Number(fieldValue);
        const correctNum = Number(correctAnswer);
        if (isNaN(userNum) || isNaN(correctNum)) {
            return {
                correct: false,
                points,
                penalty,
                earnedPoints: 0,
                message: 'Érvénytelen szám',
                userAnswer: fieldValue,
                correctAnswer,
            };
        }
        const diff = Math.abs(userNum - correctNum);
        const isCorrect = diff <= tolerance;
        const earnedPoints = isCorrect ? points : penalty > 0 ? -penalty : 0;
        let message = null;
        if (!isCorrect) {
            if (tolerance > 0) {
                message = rule.message ?? `Helytelen! Helyes: ${correctNum} (±${tolerance} tolerancia)`;
            }
            else {
                message = rule.message ?? `Helytelen! Helyes: ${correctNum}`;
            }
        }
        return {
            correct: isCorrect,
            points,
            penalty,
            earnedPoints,
            message,
            userAnswer: fieldValue,
            correctAnswer,
        };
    }
}
exports.NumericMatchProcessor = NumericMatchProcessor;
//# sourceMappingURL=NumericMatchProcessor.js.map