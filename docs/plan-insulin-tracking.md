# Plan: Insulindose-sporing og korrelasjonsanalyse

## Bakgrunn

Sukkerspor sporer i dag blodsukkermålinger med tidspunkt, type (fastende/etter måltid), måltidstype og notater. Appen mangler mulighet for å logge insulindoser og se sammenheng mellom kveldsdose og neste dags fastende blodsukker.

Ved svangerskapsdiabetes er det vanlig å bruke:
- **Langtidsvirkende insulin** (f.eks. Insulatard/NPH) ved leggetid — styrer fastende blodsukker neste morgen
- **Hurtigvirkende insulin** (f.eks. NovoRapid) før måltider — styrer blodsukkeret etter måltidet

Den kliniske kjernen er: **kveldsdose langtidsvirkende → neste morgens fastende verdi**. Denne korrelasjonen er nyttig for å vurdere om dosen bør justeres.

---

## Del 1: Databasendringer

### Ny tabell `insulin_doses`

```sql
CREATE TABLE insulin_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  administered_at TIMESTAMPTZ NOT NULL,
  day_key TEXT NOT NULL,              -- YYYY-MM-DD (Europe/Oslo), same pattern as glucose_readings
  dose_units NUMERIC(4,1) NOT NULL,   -- enheter (f.eks. 8.0, 10.5)
  insulin_type TEXT NOT NULL,         -- 'long_acting' | 'rapid_acting'
  insulin_name TEXT,                  -- frivillig: 'Insulatard', 'NovoRapid', osv.
  meal_context TEXT,                  -- for hurtigvirkende: 'frokost', 'lunsj', 'middag', 'kveldsmat'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Endringer i Drizzle-schema (`src/lib/db/schema.ts`)

Legg til ny tabell `insulinDoses` med tilsvarende kolonner. Generer ny migrering med `drizzle-kit generate`.

### Filer som berøres

| Fil | Endring |
|-----|---------|
| `src/lib/db/schema.ts` | Ny `insulinDoses`-tabell |
| `drizzle/migrations/0001_*.sql` | Ny migrering |
| `src/lib/domain/types.ts` | Nye typer: `InsulinDose`, `NewInsulinDose`, `InsulinDoseInput` |

---

## Del 2: API-lag

### Nye endepunkter

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| `GET` | `/api/insulin-doses?startDayKey=&endDayKey=` | Hent doser i datoperiode |
| `POST` | `/api/insulin-doses` | Opprett ny dose |
| `PUT` | `/api/insulin-doses/[id]` | Oppdater eksisterende dose |
| `DELETE` | `/api/insulin-doses/[id]` | Slett dose |

### Domenefunksjoner (`src/lib/domain/insulin-dose.ts`)

Ny fil med CRUD-operasjoner, samme mønster som `reading.ts`:
- `createInsulinDose(input)` — validering (dose 0.5-200 enheter), beregn day_key, logg event
- `updateInsulinDose(id, input)` — reberegn day_key om tidspunkt endres
- `listInsulinDosesByDayKeyRange(start, end)` — hent doser i periode
- `deleteInsulinDose(id)` — slett med event-logging

### Filer som berøres

| Fil | Endring |
|-----|---------|
| `src/lib/domain/insulin-dose.ts` | Ny fil — CRUD-logikk |
| `src/app/api/insulin-doses/route.ts` | GET + POST |
| `src/app/api/insulin-doses/[id]/route.ts` | PUT + DELETE |
| `src/lib/domain/event-log.ts` | Ny entity_type: `insulin_dose` |

---

## Del 3: UI — Registrering av insulindoser

### Tilnærming A: Egen modal (anbefalt)

Ny `InsulinDoseModal` som ligner på `ReadingModal`, men med insulin-spesifikke felt:

**Felt i modalen:**
1. **Dose (enheter)** — nummerisk input, steg 0.5
2. **Tidspunkt** — time picker (standard: nå)
3. **Insulintype** — toggle: "Langtidsvirkende" / "Hurtigvirkende"
4. **Insulinnavn** — valgfritt tekstfelt (huskes fra forrige gang via localStorage)
5. **Måltidskontekst** — vises kun for hurtigvirkende, samme chips som i ReadingModal
6. **Notater** — valgfritt tekstfelt

### Integrasjon i loggsiden

Loggsiden (`src/app/(authenticated)/log/page.tsx`) utvides:
- Hent insulindoser for uken via SWR (parallelt med blodsukkermålinger)
- Vis insulindoser integrert i dagsoversikten, sortert etter tidspunkt sammen med blodsukkermålinger
- Visuelt skille: insulindoser med sprøyte-ikon (Syringe fra lucide-react) og blå/lilla fargekode
- Ny "Legg til insulin"-knapp per dag (ved siden av eksisterende "Legg til måling")

### Nytt komponent: `InsulinDoseCard`

Viser en enkelt insulindose i loggen:
- Tidspunkt
- Dose i enheter
- Type (kort/lang)
- Eventuelt insulinnavn
- Trykk for å redigere

### Filer som berøres

| Fil | Endring |
|-----|---------|
| `src/components/log/insulin-dose-modal.tsx` | Ny fil — registreringsmodal |
| `src/components/log/insulin-dose-card.tsx` | Ny fil — visningskomponent |
| `src/app/(authenticated)/log/page.tsx` | Utvide med insulindoser i dagsoversikt |

---

## Del 4: Korrelasjonsanalyse — Kveldsdose vs. neste morgens fastende

### Kjernelogikk (`src/lib/domain/analytics.ts`)

Ny funksjon:

```typescript
interface InsulinFastingCorrelation {
  date: string;           // dag for kveldsdosen (dag N)
  eveningDose: number;    // enheter gitt kveld dag N
  nextFasting: number | null;  // fastende verdi morgen dag N+1
  nextFastingTime: Date | null;
}

interface CorrelationResult {
  pairs: InsulinFastingCorrelation[];
  trend: 'increasing_dose_needed' | 'stable' | 'decreasing_dose_possible' | 'insufficient_data';
  avgFastingByDoseRange: { doseRange: string; avgFasting: number; count: number }[];
  suggestion: string | null;  // klinisk nøytralt hint
}

function computeInsulinFastingCorrelation(
  doses: InsulinDose[],
  readings: GlucoseReading[]
): CorrelationResult
```

**Parings-algoritme:**
1. Filtrer doser til `insulin_type === 'long_acting'` og `part_of_day === 'evening'` (eller administered_at etter kl. 20:00)
2. For hver kveldsdose på dag N, finn første fastende måling (`is_fasting === true`) på dag N+1
3. Lag par: `(kveldsdose, neste_fastende)`
4. Par uten neste-dags fastende verdi: `nextFasting = null`

**Trendanalyse:**
- Grupper par etter doseintervall (f.eks. 6-8, 8-10, 10-12 enheter)
- Beregn gjennomsnittlig fastende for hvert intervall
- Beregn om nyeste 3-5 fastende verdier konsekvent er over 5.3 mmol/L → `increasing_dose_needed`
- Beregn om nyeste 3-5 fastende verdier konsekvent er under 4.5 mmol/L → `decreasing_dose_possible`
- Ellers → `stable`

**Viktig medisinsk ansvarsfraskrivelse:**
Appen skal ALDRI gi eksplisitt doseanbefaling. Bruk nøytrale formuleringer:
- "De siste 5 fastende verdiene har vært over 5.3. Diskuter doseendring med lege/jordmor."
- "Fastende verdier har ligget lavt. Kontakt behandler."

### Nytt dashboard-kort: `InsulinCorrelationCard`

Vises på oversiktssiden dersom brukeren har logget minst 3 kveldsdoser med tilhørende neste-dags fastende verdier.

**Innhold:**
1. **Scatter-plot/linjegraf** — X-akse: dato, to Y-akser: kveldsdose (enheter) og neste morgens fastende (mmol/L)
2. **Trendindikator** — "Stabil" / "Fastende over mål" / "Fastende under mål"
3. **Dose-vs-fastende tabell** — grupperer doseintervaller med gjennomsnittlig fastende
4. **Hint-tekst** — nøytral formulering basert på trenden

### SVG-visualisering

Bruk samme tilnærming som `TrendSparklineCard` — custom SVG, ingen eksternt bibliotek:
- Dobbel Y-akse: venstre = mmol/L (blodsukkerskala), høyre = enheter (insulinskala)
- Blodsukkerpunkter som sirkler, insulindoser som strek/søyler
- Terskellinjer ved 5.3 mmol/L (fastende grense)
- Responsivt med Tailwind-wrapper

### Filer som berøres

| Fil | Endring |
|-----|---------|
| `src/lib/domain/analytics.ts` | Ny funksjon `computeInsulinFastingCorrelation` |
| `src/components/dashboard/insulin-correlation-card.tsx` | Ny fil — korrelasjonsvisning |
| `src/app/(authenticated)/page.tsx` | Importer og vis nytt kort i dashboard |

---

## Del 5: Backup, eksport og rapport

### Backup-schema (`src/lib/backup/schema.ts`)

```typescript
interface BackupData {
  schema_version: 2;  // bump fra 1
  exported_at: string;
  readings: GlucoseReading[];
  insulin_doses: InsulinDose[];  // ny
  settings: { ... };
}
```

Import-logikk må håndtere både v1 (uten insulin) og v2 (med insulin) — bakoverkompatibilitet.

### PDF-rapport (`src/lib/report/generate-pdf.ts`)

Utvid rapporten med:
- Ny seksjon: "Insulindoser" med tabell (tidspunkt, type, dose, notat)
- Korrelasjonstrender i oppsummeringen (hvis data finnes)

### Filer som berøres

| Fil | Endring |
|-----|---------|
| `src/lib/backup/schema.ts` | Bump til v2, legg til `insulin_doses` |
| `src/app/api/backup/export/route.ts` | Inkluder insulindoser i eksport |
| `src/app/api/backup/import/route.ts` | Håndter v1/v2, importer insulindoser |
| `src/lib/report/report-data.ts` | Hent insulindoser for rapporten |
| `src/lib/report/generate-pdf.ts` | Ny seksjon i PDF |
| `src/lib/report/translations.ts` | Nye oversettelser for insulin-felt |

---

## Del 6: Brukerinnstillinger

### Valgfritt: Insulin-innstillinger i `user_settings`

Legg til felt for å lagre brukerens standard insulinnavn(e), slik at modalen forhåndsutfyller:

```
insulin_long_acting_name TEXT,   -- f.eks. 'Insulatard'
insulin_rapid_acting_name TEXT,  -- f.eks. 'NovoRapid'
```

Alternativ: Bruk localStorage på klient-siden for å huske sist brukte insulinnavn. Enklere, men mistes ved byte av enhet.

---

## Implementeringsrekkefølge (anbefalt)

| Steg | Beskrivelse | Avhengigheter |
|------|-------------|---------------|
| 1 | Database-schema + migrering | Ingen |
| 2 | Typer og domenelogikk (CRUD) | Steg 1 |
| 3 | API-endepunkter | Steg 2 |
| 4 | `InsulinDoseModal` + `InsulinDoseCard` | Steg 3 |
| 5 | Integrasjon i loggsiden | Steg 4 |
| 6 | Korrelasjonslogikk i analytics | Steg 2 |
| 7 | `InsulinCorrelationCard` i dashboard | Steg 5, 6 |
| 8 | Backup v2 (eksport/import) | Steg 2 |
| 9 | PDF-rapport med insulindoser | Steg 2 |
| 10 | Tester | Alle steg |

Steg 1-5 kan leveres som MVP. Steg 6-7 (korrelasjon) og steg 8-9 (backup/rapport) kan legges til inkrementelt.

---

## Risikoer og avveininger

### Medisinsk ansvar
- Appen skal **aldri** anbefale spesifikke doseendringer
- All korrelasjon presenteres som **observasjoner**, ikke anbefalinger
- Tydelig disclaimer: "Diskuter alltid doseendringer med behandler"

### UX-kompleksitet
- To modaltyper (blodsukker + insulin) i loggen kan forvirre
- Løsning: Tydelig visuelt skille (farger, ikoner) og separate "legg til"-knapper
- Vurder: Felles FAB (floating action button) med to valg: "Blodsukker" / "Insulin"

### Datakvalitet for korrelasjon
- Korrelasjonen krever at brukeren logger **både** kveldsdose **og** neste morgens fastende
- Vis oppmuntring/påminnelse om å logge begge dersom bare én finnes
- Minimum 3 komplette par før korrelasjonskortet vises

### Bakoverkompatibilitet
- Backup-schema bumpes til v2 — import må håndtere v1 uten insulindoser
- Eksisterende blodsukkerfunksjonalitet skal ikke påvirkes

### Ytelse
- Insulin-spørringer bruker samme `day_key`-mønster som blodsukkermålinger — drar nytte av eksisterende indeksmønster
- Korrelasjonsberegning er ren funksjon (ingen ekstra DB-kall utover å hente data)
