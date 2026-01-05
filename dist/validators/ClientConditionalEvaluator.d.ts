import { ConditionalExpression } from 'formfiller-schema';
import { ClientValidationContext } from './ClientValidationContext.js';
export declare class ClientConditionalEvaluator {
    evaluate(expression: ConditionalExpression | ConditionalExpression[], context: ClientValidationContext): boolean;
    private compareValues;
}
//# sourceMappingURL=ClientConditionalEvaluator.d.ts.map