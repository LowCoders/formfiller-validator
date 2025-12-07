import { AggregateResult, FieldComputedResult } from './types';
import { ComputedRule } from 'formfiller-schema';
export declare class AggregateProcessor {
    private conditionalEvaluator;
    constructor();
    aggregate(fieldResults: Record<string, FieldComputedResult>, config: ComputedRule): AggregateResult;
}
//# sourceMappingURL=AggregateProcessor.d.ts.map