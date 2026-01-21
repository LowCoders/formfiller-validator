# FormFiller Validator

Advanced validation system for the FormFiller application. Supports nested structures, conditional rules, computed values, and parallel execution.

## Installation

```bash
npm install formfiller-validator
```

## Entry Points

The package provides two entry points:

### Client-only (Default) - Joi-free

```typescript
// Lightweight, Joi-free validators for frontend use
import { ClientValidator, ClientValidationContext, ClientValidationResult } from 'formfiller-validator';

const validator = new ClientValidator();
const result = await validator.validate(fieldName, value, rules, formData);
```

Supported rule types: `required`, `email`, `numeric`, `stringLength`, `range`, `pattern`, `arrayLength`, `crossField`

### Full Validator - Joi-based

```typescript
// Full Joi-based validator for backend or advanced frontend use
import { Validator } from 'formfiller-validator/full';

const validator = new Validator({
  mode: 'parallel',
  cache: { enabled: true }
});

const result = await validator.validate(formData, config);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

Additional rule types: `compare`, `custom`, `async`, `computed`, `temporal`, `plugin`

## Bundle Sizes

| Entry Point | Size (gzip) | Dependencies |
|-------------|-------------|--------------|
| Client-only (default) | ~3 KB | None |
| Full (with Joi) | ~50 KB | Joi |

## Key Features

- Nested structure processing (group, tabbed, nested forms)
- Conditional validation (visibleIf, disabledIf, requiredIf)
- Cross-field validation
- Computed rules
- External API integration (AI validation, database checks)
- Parallel execution based on dependency graph
- DevExtreme ValidationRule compatibility

## Cross-Field Validation

Cross-field validators enable validation across multiple fields. The type directly indicates the validator type.

### Available CrossField Types

| Type | Description |
|------|-------------|
| `crossFieldEquals` | Checks if fields are equal |
| `crossFieldNotEquals` | Checks if fields are not equal |
| `crossFieldGreaterThan` | First field > second field |
| `crossFieldLessThan` | First field < second field |
| `crossFieldSumEquals` | Sum of fields equals a value |
| `crossFieldPercentageSum` | Sum of fields equals 100% |
| `crossFieldDateInRange` | Date within other dates range |
| `crossFieldAtLeastOne` | At least one field filled |
| `crossFieldCustom` | Custom validator |

### Example

```typescript
const rules = [
  {
    type: 'crossFieldEquals',
    targetFields: ['password', 'passwordConfirm'],
    message: 'Passwords must match'
  }
];
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Type Safety

The validator package is fully typed with TypeScript. Key types:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  type: string;
  value?: unknown;
}
```

## Detailed Documentation

Full documentation: [formfiller-docs](https://lowcoders.github.io/formfiller-docs/)

## License

MIT
