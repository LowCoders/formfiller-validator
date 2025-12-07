"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayMatchProcessor = void 0;
class ArrayMatchProcessor {
    evaluate(fieldValue, rule) {
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
        const sortedUser = [...userArray].sort();
        const sortedCorrect = [...correctAnswer].sort();
        const isExactMatch = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
        let earnedPoints = 0;
        let message = null;
        if (isExactMatch) {
            earnedPoints = points;
        }
        else if (partialCredit) {
            const correctCount = sortedUser.filter((val) => sortedCorrect.includes(val)).length;
            const incorrectCount = sortedUser.length - correctCount;
            const partialPoints = (correctCount / sortedCorrect.length) * points;
            const penaltyAmount = incorrectCount * (penalty / sortedCorrect.length);
            earnedPoints = Math.max(0, partialPoints - penaltyAmount);
            message = `Részben helyes (${correctCount}/${sortedCorrect.length}). Helyes: ${correctAnswer.join(', ')}`;
        }
        else {
            earnedPoints = penalty > 0 ? -penalty : 0;
            message = rule.message ?? `Helytelen! Helyes: ${correctAnswer.join(', ')}`;
        }
        return {
            correct: isExactMatch,
            points,
            penalty,
            earnedPoints: Math.round(earnedPoints * 100) / 100,
            message,
            userAnswer: fieldValue,
            correctAnswer,
        };
    }
}
exports.ArrayMatchProcessor = ArrayMatchProcessor;
//# sourceMappingURL=ArrayMatchProcessor.js.map