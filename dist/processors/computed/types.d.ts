export interface ComputedValidationResult {
    correct: boolean;
    points: number;
    penalty: number;
    earnedPoints: number;
    message: string | null;
    userAnswer?: any;
    correctAnswer?: any;
}
export interface FieldComputedResult extends ComputedValidationResult {
    fieldName: string;
}
export interface AggregateResult {
    totalPoints: number;
    maxPoints: number;
    percentage: number;
    evaluation?: string;
    message?: string;
    breakdown: FieldComputedResult[];
    categories?: Record<string, CategoryScore>;
}
export interface CategoryScore {
    score: number;
    max: number;
    percentage: number;
}
//# sourceMappingURL=types.d.ts.map