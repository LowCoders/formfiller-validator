# FormFiller Validator

Fejlett validációs rendszer a FormFiller alkalmazáshoz. Beágyazott struktúrák támogatása, feltételes szabályok, számított értékek és párhuzamos végrehajtás.

## Telepítés

```bash
npm install formfiller-validator
```

## Entry Points

A csomag két entry point-ot biztosít:

### Client-only (Alapértelmezett) - Joi-mentes

```typescript
// Könnyűsúlyú, Joi-mentes validátorok frontend használatra
import { ClientValidator, ClientValidationContext, ClientValidationResult } from 'formfiller-validator';

const validator = new ClientValidator();
const result = await validator.validate(fieldName, value, rules, formData);
```

Támogatott szabálytípusok: `required`, `email`, `numeric`, `stringLength`, `range`, `pattern`, `arrayLength`, `crossField`

### Full Validator - Joi-alapú

```typescript
// Teljes Joi-alapú validátor backend vagy advanced frontend használatra
import { Validator } from 'formfiller-validator/full';

const validator = new Validator({
  mode: 'parallel',
  cache: { enabled: true }
});

const result = await validator.validate(formData, config);

if (!result.valid) {
  console.error('Validációs hibák:', result.errors);
}
```

További szabálytípusok: `compare`, `custom`, `async`, `computed`, `temporal`, `plugin`

## Bundle Méretek

| Entry Point | Méret (gzip) | Függőségek |
|-------------|--------------|------------|
| Client-only (alapértelmezett) | ~3 KB | Nincs |
| Full (Joi-val) | ~50 KB | Joi |

## Fő Funkciók

- Beágyazott struktúrák feldolgozása (group, tabbed, nested forms)
- Feltételes validáció (visibleIf, disabledIf, requiredIf)
- Keresztmező validáció
- Számított szabályok
- Külső API integráció (AI validáció, adatbázis ellenőrzések)
- Párhuzamos végrehajtás függőségi gráf alapján
- DevExtreme ValidationRule kompatibilitás

## Fejlesztés

```bash
# Függőségek telepítése
npm install

# Build
npm run build

# Tesztek futtatása
npm test
```

## Részletes Dokumentáció

A teljes dokumentáció: [formfiller-docs](https://lowcoders.github.io/formfiller-docs/)

## Licenc

MIT
