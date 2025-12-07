"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationResult = void 0;
class ValidationResult {
    valid;
    errors;
    computedResults;
    fieldResults;
    metadata;
    dependencyGraph;
    stats;
    constructor() {
        this.valid = true;
        this.errors = [];
        this.computedResults = {};
        this.fieldResults = {};
    }
    addError(field, message, rule, params, path) {
        this.valid = false;
        this.errors.push({
            field,
            message,
            rule,
            params,
            path,
        });
        if (!this.fieldResults) {
            this.fieldResults = {};
        }
        if (!this.fieldResults[field]) {
            this.fieldResults[field] = {
                valid: false,
                errors: [],
            };
        }
        this.fieldResults[field].valid = false;
        this.fieldResults[field].errors.push({
            field,
            message,
            rule,
            params,
            path,
        });
    }
    addErrors(errors) {
        for (const error of errors) {
            this.addError(error.field, error.message, error.rule, error.params, error.path);
        }
    }
    setFieldValid(field) {
        if (!this.fieldResults) {
            this.fieldResults = {};
        }
        if (!this.fieldResults[field]) {
            this.fieldResults[field] = {
                valid: true,
                errors: [],
                skipped: false,
            };
        }
        else {
            this.fieldResults[field].valid = true;
            this.fieldResults[field].skipped = false;
        }
    }
    addComputedResult(name, result) {
        if (!this.computedResults) {
            this.computedResults = {};
        }
        this.computedResults[name] = result;
    }
    setFieldSkipped(field, reason) {
        if (!this.fieldResults) {
            this.fieldResults = {};
        }
        this.fieldResults[field] = {
            valid: true,
            errors: [],
            skipped: true,
            skipReason: reason,
        };
    }
    merge(other) {
        if (!other.valid) {
            this.valid = false;
        }
        this.errors.push(...other.errors);
        if (other.fieldResults) {
            if (!this.fieldResults) {
                this.fieldResults = {};
            }
            for (const [field, result] of Object.entries(other.fieldResults)) {
                if (this.fieldResults[field]) {
                    if (!result.valid) {
                        this.fieldResults[field].valid = false;
                    }
                    this.fieldResults[field].errors.push(...result.errors);
                }
                else {
                    this.fieldResults[field] = result;
                }
            }
        }
        if (other.computedResults) {
            if (!this.computedResults) {
                this.computedResults = {};
            }
            Object.assign(this.computedResults, other.computedResults);
        }
        if (other.stats && this.stats) {
            this.stats.totalRules += other.stats.totalRules;
            this.stats.passedRules += other.stats.passedRules;
            this.stats.failedRules += other.stats.failedRules;
            this.stats.skippedRules += other.stats.skippedRules;
            this.stats.computedRules += other.stats.computedRules;
            if (other.stats.executionTimes && this.stats.executionTimes) {
                Object.assign(this.stats.executionTimes, other.stats.executionTimes);
            }
        }
        else if (other.stats) {
            this.stats = other.stats;
        }
    }
    setMetadata(metadata) {
        this.metadata = metadata;
    }
    setStats(stats) {
        this.stats = stats;
    }
    setDependencyGraph(graph) {
        this.dependencyGraph = graph;
    }
    getFieldErrors(field) {
        return this.errors.filter((error) => error.field === field);
    }
    getComputedResult(ruleId) {
        return this.computedResults?.[ruleId];
    }
    isFieldValid(field) {
        return this.fieldResults?.[field]?.valid ?? true;
    }
    isFieldSkipped(field) {
        return this.fieldResults?.[field]?.skipped ?? false;
    }
    toJSON() {
        return {
            valid: this.valid,
            errors: this.errors,
            computedResults: this.computedResults,
            fieldResults: this.fieldResults,
            metadata: this.metadata,
            dependencyGraph: this.dependencyGraph,
            stats: this.stats,
        };
    }
    static fromJSON(json) {
        const result = new ValidationResult();
        result.valid = json.valid;
        result.errors = json.errors || [];
        result.computedResults = json.computedResults;
        result.fieldResults = json.fieldResults;
        result.metadata = json.metadata;
        result.dependencyGraph = json.dependencyGraph;
        result.stats = json.stats;
        return result;
    }
}
exports.ValidationResult = ValidationResult;
//# sourceMappingURL=ValidationResult.js.map