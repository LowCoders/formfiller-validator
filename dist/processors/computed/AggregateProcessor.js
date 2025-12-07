"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateProcessor = void 0;
const ConditionalEvaluator_1 = require("../ConditionalEvaluator");
class AggregateProcessor {
    conditionalEvaluator;
    constructor() {
        this.conditionalEvaluator = new ConditionalEvaluator_1.ConditionalEvaluator();
    }
    aggregate(fieldResults, config) {
        const breakdown = [];
        const categoryScores = {};
        let totalPoints = 0;
        let maxPoints = 0;
        const categoryMap = config.categoryMapping ?? {};
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
        for (const fieldName of config.inputFields) {
            const fieldResult = fieldResults[fieldName];
            if (fieldResult) {
                breakdown.push(fieldResult);
                totalPoints += fieldResult.earnedPoints;
                maxPoints += fieldResult.points;
                const category = categoryMap[fieldName] ?? 'Egyéb';
                if (!categoryScores[category]) {
                    categoryScores[category] = { score: 0, max: 0, percentage: 0 };
                }
                categoryScores[category].score += fieldResult.earnedPoints;
                categoryScores[category].max += fieldResult.points;
            }
        }
        const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
        for (const category in categoryScores) {
            const catScore = categoryScores[category];
            if (catScore) {
                catScore.percentage = catScore.max > 0 ? (catScore.score / catScore.max) * 100 : 0;
                catScore.score = Math.round(catScore.score * 100) / 100;
                catScore.percentage = Math.round(catScore.percentage * 10) / 10;
            }
        }
        let evaluation;
        let message;
        if (config.evaluationRules && config.evaluationRules.length > 0) {
            const evalContext = {
                percentage,
                totalPoints,
                maxPoints,
                getValue: (fieldName) => {
                    const data = { percentage, totalPoints, maxPoints };
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
exports.AggregateProcessor = AggregateProcessor;
//# sourceMappingURL=AggregateProcessor.js.map