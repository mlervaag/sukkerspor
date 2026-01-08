# Copy and Disclaimers: Overview v1.1

Neutral wording for clinical targets and indicators. Norwegian copy first, English translation provided for reference only.

---

## Principle: No Medical Advice

All copy must:
- Present targets as **reference values**, not recommendations
- Avoid imperative language ("you should", "you must")
- Direct user to **clinician** for interpretation
- Never suggest diagnosis or treatment

---

## Target Card Copy

### Card Header (Norwegian)

```
Referanseverdier
```

### Row Labels (Norwegian)

```
Fastende: {verdi} mmol/L
Etter måltid: {verdi} mmol/L
```

### Status Indicators (Norwegian)

| Condition | Label |
|-----------|-------|
| Avg ≤ threshold | ✓ Innenfor referanse |
| Avg > threshold | ⚠ Over referanse |
| No data | — Ingen data |

### Reference Line (Small Text, Norwegian)

```
Referanse: fastende < 5,3 · etter måltid < 6,7 mmol/L
```

---

## Over-Target Count Card Copy

### Card Header (Norwegian)

```
Målinger over referanse
```

### Labels (Norwegian)

```
Siste 7 dager: {n}
Siste 14 dager: {n}
```

### Badge (When 14d > 3) (Norwegian)

```
⚠ Mer enn 3
```

### Tooltip / Hover Text (Norwegian)

```
Helsenorge anbefaler å kontakte jordmor eller lege dersom du har mer enn 3 målinger over referanseverdiene i løpet av 14 dager.
```

> **Note:** Uses "anbefaler å kontakte" (recommends contacting) rather than "du må" (you must).

---

## Coverage Card Copy

### Card Header (Norwegian)

```
Dekning denne uken
```

### Row Labels (Norwegian)

```
Fastende: {n}/7 dager
Etter måltid: {n}/7 dager
```

### Helper Text (Optional, Norwegian)

```
For en fullstendig oversikt anbefales det å måle både fastende og etter måltid hver dag.
```

---

## Meal Breakdown Card Copy

### Card Header (Norwegian)

```
Fordeling per måltid (siste 14 dager)
```

### Meal Type Labels (Norwegian)

| mealType Value | Display Label |
|----------------|---------------|
| `breakfast` | Frokost |
| `lunch` | Lunsj |
| `dinner` | Middag |
| `evening_meal` | Kveldsmat |
| `snack` | Mellommåltid |
| `null` / undefined | Annet |

### Row Format (Norwegian)

```
{Måltid}: {snitt} mmol/L · {n} over referanse
```

### Placeholder (Norwegian)

```
Ikke nok data for å vise fordeling. Logg minst 3 målinger per måltid.
```

---

## Trend Sparkline Card Copy

### Card Header (Norwegian)

```
Retning (siste 7 dager)
```

### Trend Labels (Norwegian)

| Condition | Label |
|-----------|-------|
| Stabil (stddev < 0.5) | → Stabil |
| Increasing (slope > 0.2) | ↗ Økende |
| Decreasing (slope < -0.2) | ↘ Synkende |
| Insufficient data | — Ikke nok data ennå |

### Clarifying Text (Norwegian)

```
Basert på 3-dagers glidende gjennomsnitt.
```

---

## Quick Actions Card Copy

### Buttons (Norwegian)

```
+ Ny måling
📄 Generer rapport
```

---

## Page Footer Disclaimer (Norwegian)

### Full Disclaimer

```
Informasjonen og referanseverdiene som vises i denne appen er basert på offentlig tilgjengelig informasjon fra Helsenorge og Diabetesforbundet. De er ment som veiledning og erstattet ikke medisinsk rådgivning.

Din lege eller jordmor kan ha satt andre mål for deg basert på din individuelle situasjon.

Diskuter alltid dine målinger med helsepersonell.
```

### Compact Disclaimer (Alternative for Cards)

```
Referanseverdier fra Helsenorge. Snakk med lege/jordmor.
```

---

## PDF Report Header Disclaimer (Norwegian)

```
Referanseverdier brukt i denne rapporten:
• Fastende: < 5,3 mmol/L
• 2 timer etter måltid: < 6,7 mmol/L

Kilde: Helsenorge, Diabetesforbundet.
Verdiene bør diskuteres med behandlende helsepersonell.
```

---

## English Translations (Reference Only)

| Norwegian | English |
|-----------|---------|
| Referanseverdier | Reference values |
| Fastende | Fasting |
| Etter måltid | After meal |
| Innenfor referanse | Within reference |
| Over referanse | Above reference |
| Målinger over referanse | Readings above reference |
| Dekning denne uken | Coverage this week |
| Fordeling per måltid | Breakdown by meal |
| Retning | Direction |
| Stabil | Stable |
| Økende | Increasing |
| Synkende | Decreasing |
| Ikke nok data ennå | Not enough data yet |
| Ny måling | New reading |
| Generer rapport | Generate report |
| Snakk med lege/jordmor | Talk to your doctor/midwife |

---

## Word Choices to Avoid

| Avoid | Use Instead |
|-------|-------------|
| Mål (target/goal) | Referanseverdi (reference value) |
| Anbefalt grense | Standard referanse |
| Du må | Det anbefales å |
| Farlig | Over referanse |
| Alarmerende | Kontakt helsepersonell |
| Diagnose | Status |
| Behandling | Oppfølging |
