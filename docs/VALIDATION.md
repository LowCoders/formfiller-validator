# FormFiller Validator - Validációs Rendszer

## Áttekintés

A FormFiller Validator egy dual-architektúrájú validációs rendszer, amely szerver és kliens oldalon is működik.

| Komponens | Környezet | Függőség | Jellemző |
|-----------|-----------|----------|----------|
| `Validator` | Szerver | Joi | Teljes funkcionalitás, async API hívások |
| `ClientValidator` | Böngésző | Nincs | Könnyűsúlyú, azonnali visszajelzés |

---

## Architektúra

```mermaid
graph TB
    subgraph Server["Szerver oldal"]
        V[Validator]
        CP[ConfigProcessor]
        JA[JoiAdapter]
        CR[CallbackRegistry]
        DGB[DependencyGraphBuilder]
        VC[ValidationContext]
        VR[ValidationResult]
        CE[ConditionalEvaluator]
        VCE[ValidationConditionEvaluator]
        COMP[Computed Processors]
    end
    
    subgraph Client["Kliens oldal"]
        CV[ClientValidator]
        CVC[ClientValidationContext]
        CVR[ClientValidationResult]
        CCE[ClientConditionalEvaluator]
        CVCE[ClientValidationConditionEvaluator]
        CCR[ClientCallbackRegistry]
    end
    
    Server ~~~ Client
    
    V --> CP
    V --> DGB
    CP --> JA
    CP --> CE
    CP --> VCE
    CP --> COMP
    JA --> CR
    CP --> VC
    CP --> VR
    
    CV --> CVC
    CV --> CVR
    CV --> CCE
    CV --> CVCE
    CV --> CCR
```

---

## Fő Komponensek

### Szerver oldal

| Komponens | Leírás |
|-----------|--------|
| `Validator` | Fő belépési pont, Joi-alapú, async támogatás |
| `ConfigProcessor` | Form konfiguráció feldolgozása, mezők bejárása |
| `JoiAdapter` | Joi sémák generálása és cache-elése |
| `CallbackRegistry` | CrossField validátorok regisztrációja |
| `ValidationContext` | Validációs állapot és kontextus |
| `ValidationResult` | Eredmények és hibák tárolása |
| `ConditionalEvaluator` | visibleIf/disabledIf feltételek |
| `ValidationConditionEvaluator` | when feltételek szabályokon |
| `DependencyGraphBuilder` | Párhuzamos végrehajtás optimalizálás |
| `Computed Processors` | ExactMatch, ArrayMatch, NumericMatch, Aggregate |

```typescript
const validator = new Validator({ mode: 'parallel', cache: { enabled: true } });
const result = await validator.validate(formData, formConfig);
```

### Kliens oldal

| Komponens | Leírás |
|-----------|--------|
| `ClientValidator` | Könnyűsúlyú, Joi-mentes validator |
| `ClientValidationContext` | Kliens oldali kontextus |
| `ClientValidationResult` | Kliens oldali eredmények |
| `ClientConditionalEvaluator` | Feltételek kiértékelése |
| `ClientValidationConditionEvaluator` | when feltételek |
| `ClientCallbackRegistry` | Kliens oldali crossField validátorok |

```typescript
const validator = new ClientValidator();
const result = await validator.validate('email', value, rules, formData);
```

---

## Validációs Folyamat

```mermaid
flowchart TD
    START([validate hívás]) --> BUILD[Dependency Graph építés]
    BUILD --> CTX[ValidationContext létrehozás]
    CTX --> PROC[ConfigProcessor.process]
    
    subgraph "Form feldolgozás"
        PROC --> ITEMS{Van több item?}
        ITEMS -->|Igen| ITEM[Következő item]
        ITEM --> CONTAINER{Konténer?}
        CONTAINER -->|Igen| NESTED[Beágyazott elemek feldolgozása]
        NESTED --> ITEMS
        CONTAINER -->|Nem| FIELD[Mező feldolgozás]
        FIELD --> ITEMS
        ITEMS -->|Nem| COMPUTED[Computed szabályok]
    end
    
    subgraph "Mező feldolgozás"
        FIELD --> VIS{Látható?}
        VIS -->|Nem| SKIP1[Skip: not visible]
        VIS -->|Igen| DIS{Disabled?}
        DIS -->|Igen| SKIP2[Skip: disabled]
        DIS -->|Nem| RULES{Van szabály?}
        RULES -->|Igen| VALIDATE[Szabályok validálása]
        RULES -->|Nem| VALID[Mező valid]
        VALIDATE --> RESULT[Eredmény]
    end
    
    COMPUTED --> END([ValidationResult])
    SKIP1 --> END
    SKIP2 --> END
    VALID --> END
    RESULT --> END
```

---

## Szabály Validáció

```mermaid
flowchart LR
    RULE[ValidationRule] --> WHEN{van 'when'?}
    WHEN -->|Igen| EVAL[Feltétel kiértékelés]
    EVAL -->|false| SKIP[Szabály kihagyva]
    EVAL -->|true| TYPE
    WHEN -->|Nem| TYPE{Szabály típus}
    
    TYPE -->|required| REQ[Kötelező ellenőrzés]
    TYPE -->|email| EMAIL[Email formátum]
    TYPE -->|range| RANGE[Min/max érték]
    TYPE -->|pattern| PAT[Regex illesztés]
    TYPE -->|crossField| CROSS[Több mező összehasonlítás]
    TYPE -->|compare| COMP[Mező összehasonlítás]
    TYPE -->|computed| COMPUTED[Számított érték]
    
    REQ --> JOI[JoiAdapter.validate]
    EMAIL --> JOI
    RANGE --> JOI
    PAT --> JOI
    CROSS --> JOI
    COMP --> JOI
```

---

## Támogatott Szabálytípusok

| Típus | Leírás | Paraméterek |
|-------|--------|-------------|
| `required` | Kötelező mező | - |
| `email` | Email formátum | - |
| `numeric` | Szám érték | - |
| `stringLength` | Szöveg hossz | `min`, `max` |
| `arrayLength` | Tömb méret | `min`, `max` |
| `range` | Szám tartomány | `min`, `max` |
| `pattern` | Regex minta | `pattern` |
| `compare` | Mező összehasonlítás | `comparisonTarget`, `comparisonType` |
| `crossField` | Több mező validáció | `targetFields`, `crossFieldValidator` |
| `computed` | Számított szabály | `subtype`, `expectedValue` |

---

## Feltételes Kiértékelés

A `ConditionalEvaluator` kezeli a `visibleIf`, `disabledIf`, `requiredIf`, `readonlyIf` és `when` feltételeket.

```mermaid
flowchart TD
    COND[ConditionalExpression] --> ARR{Tömb?}
    ARR -->|Igen| AND_IMP[Implicit AND - minden teljesül]
    ARR -->|Nem| OBJ{Objektum típus}
    
    OBJ -->|and| AND[Minden feltétel teljesül]
    OBJ -->|or| OR[Legalább egy teljesül]
    OBJ -->|not| NOT[Feltétel tagadása]
    OBJ -->|field/op/value| EXPLICIT[Explicit összehasonlítás]
    OBJ -->|fieldName: value| SIMPLE[Egyszerű egyenlőség]
    
    AND --> RESULT[Boolean eredmény]
    OR --> RESULT
    NOT --> RESULT
    EXPLICIT --> RESULT
    SIMPLE --> RESULT
    AND_IMP --> RESULT
```

**Támogatott operátorok:** `==`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `notIn`, `contains`, `startswith`, `endswith`

---

## Rule Group (Logikai Csoportok)

Szabályok logikai csoportosítása `and`, `or`, `not` operátorokkal.

```mermaid
flowchart LR
    GROUP[ValidationRuleGroup] --> OP{Operátor}
    OP -->|and| ALL[Minden szabály teljesül]
    OP -->|or| ANY[Legalább egy teljesül]
    OP -->|not| NONE[Egyik sem teljesül]
    
    ALL --> EVAL[Szabályok kiértékelése]
    ANY --> EVAL
    NONE --> EVAL
    EVAL --> MERGE[Eredmények összesítése]
```

---

## Use Case: Teljes Validációs Lánc

```mermaid
sequenceDiagram
    participant U as Felhasználó
    participant F as Frontend
    participant CV as ClientValidator
    participant B as Backend
    participant V as Validator
    participant DB as Database
    
    U->>F: Űrlap kitöltés
    F->>CV: Azonnali validáció
    CV-->>F: Kliens oldali hibák
    F-->>U: Valós idejű visszajelzés
    
    U->>F: Submit
    F->>B: POST /api/validate
    B->>V: validate(data, config)
    V->>V: Dependency Graph építés
    V->>V: Mezők feldolgozása
    V->>V: CrossField validáció
    V-->>B: ValidationResult
    
    alt Sikeres
        B->>DB: Adatok mentése
        B-->>F: 200 OK
        F-->>U: Sikeres üzenet
    else Hibás
        B-->>F: 400 + hibák
        F-->>U: Hibaüzenetek
    end
```

---

## Computed Processors

Számított szabályok feldolgozása különböző típusú egyezésvizsgálatokhoz.

| Processor | Leírás |
|-----------|--------|
| `ExactMatchProcessor` | Pontos érték egyezés |
| `ArrayMatchProcessor` | Tömb elemek egyezése |
| `NumericMatchProcessor` | Numerikus tartomány ellenőrzés |
| `KeywordMatchProcessor` | Kulcsszó keresés szövegben |
| `AggregateProcessor` | Több mező eredményeinek összesítése |

```mermaid
flowchart LR
    CR[ComputedRule] --> ST{subtype}
    ST -->|exactMatch| EM[ExactMatchProcessor]
    ST -->|arrayMatch| AM[ArrayMatchProcessor]
    ST -->|numericMatch| NM[NumericMatchProcessor]
    ST -->|keywordMatch| KM[KeywordMatchProcessor]
    
    EM --> RES[ComputedResult]
    AM --> RES
    NM --> RES
    KM --> RES
    
    RES --> AGG[AggregateProcessor]
    AGG --> FINAL[Összesített eredmény]
```

---

## CrossField Validátorok

Előre definiált cross-field validátorok a `CallbackRegistry`-ben:

| Név | Leírás |
|-----|--------|
| `passwordMatch` | Jelszavak egyezése |
| `emailMatch` | Email címek egyezése |
| `dateRangeValid` | Dátumok sorrendje |
| `numericRangeValid` | Számok sorrendje |
| `validateSumEquals` | Összeg ellenőrzés |
| `validatePercentageSum` | 100% összeg |
| `atLeastOneRequired` | Minimum egy kitöltött |

---

## Dependency Graph

Párhuzamos végrehajtáshoz a `DependencyGraphBuilder` épít függőségi gráfot.

```mermaid
graph LR
    subgraph "Level 0"
        A[name]
        B[email]
    end
    
    subgraph "Level 1"
        C[password]
        D[confirmPassword]
    end
    
    subgraph "Level 2"
        E[terms]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
```

- **Level 0**: Független mezők (párhuzamosan)
- **Level 1+**: Függő mezők (előző szint után)
- **Körkörös függőség detektálás**

---

## Projekt Struktúra

```
src/
├── core/                    # Szerver oldali core
│   ├── Validator.ts
│   ├── ValidationContext.ts
│   ├── ValidationResult.ts
│   └── CallbackRegistry.ts
├── validators/              # Kliens oldali validator
│   ├── ClientValidator.ts
│   ├── ClientValidationContext.ts
│   ├── ClientValidationResult.ts
│   ├── ClientConditionalEvaluator.ts
│   ├── ClientValidationConditionEvaluator.ts
│   └── ClientCallbackRegistry.ts
├── processors/              # Feldolgozók
│   ├── ConfigProcessor.ts
│   ├── ConditionalEvaluator.ts
│   ├── ValidationConditionEvaluator.ts
│   └── computed/            # Computed processors
├── adapters/
│   └── JoiAdapter.ts
├── utils/
│   ├── DependencyGraphBuilder.ts
│   ├── FieldPathBuilder.ts
│   └── typeGuards.ts
└── types/
    └── index.ts
```

---

## Összefoglaló

1. **Dual architektúra**: Kliens (gyors) + Szerver (teljes)
2. **Feltételes validáció**: `when`, `visibleIf`, `disabledIf`
3. **CrossField**: Több mező együttes validációja
4. **Rule Groups**: Logikai operátorok (`and`/`or`/`not`)
5. **Dependency Graph**: Optimalizált, párhuzamos végrehajtás
6. **Computed Rules**: Számított értékek és aggregációk
7. **Extensible**: Egyedi validátorok regisztrálhatók

