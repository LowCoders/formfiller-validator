"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExactMatchProcessor = void 0;
class ExactMatchProcessor {
    evaluate(fieldValue, rule) {
        const correctAnswer = rule.correctAnswer;
        const points = rule.points ?? 1;
        const penalty = rule.penalty ?? 0;
        let isCorrect = false;
        if (typeof correctAnswer === 'number') {
            const userNum = Number(fieldValue);
            isCorrect = !isNaN(userNum) && userNum === correctAnswer;
        }
        else {
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
exports.ExactMatchProcessor = ExactMatchProcessor;
//# sourceMappingURL=ExactMatchProcessor.js.map