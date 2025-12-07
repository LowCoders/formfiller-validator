# FormFiller Validator

Fejlett validációs rendszer a FormFiller alkalmazáshoz. Beágyazott struktúrák támogatása, feltételes szabályok, számított értékek és párhuzamos végrehajtás.

## Telepítés

```bash
npm install formfiller-validator
```

## Gyors Használat

```typescript
import { Validator } from 'formfiller-validator';

const validator = new Validator({
  mode: 'parallel',
  cache: { enabled: true }
});

const result = await validator.validate(formData, config);

if (!result.valid) {
  console.error('Validációs hibák:', result.errors);
}
```

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

A teljes dokumentáció: [formfiller-docs](../formfiller-docs)

## Licenc

MIT
