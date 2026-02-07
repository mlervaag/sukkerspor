# Sukkerspor

En mobilvennlig app for logging av blodsukker ved svangerskapsdiabetes. Bygget med Next.js, Tailwind CSS og Drizzle ORM på Neon Postgres.

## Funksjoner

- **Dashboard** — Oversikt over fastende- og ettermåltidsverdier med fargekodede grenseverdier (5,3 / 6,7 mmol/L)
- **Logging** — Registrer blodsukkerverdier med måltidstype, mat-notater og følelser
- **Insulinsporing** — Logg insulin-doser (langtids- og hurtigvirkende) med korrelasjonsanalyse mot neste dags fastende verdier
- **PDF-rapport** — Generer rapport på norsk eller engelsk for lege/jordmor, med valgfritt innhold og fargekoding
- **Backup** — Eksporter og importer alle data som JSON
- **Sikkerhet** — Passord-beskyttet med HMAC-signerte session-cookies

## Kom i gang (gratis med Vercel + Neon)

Alt du trenger er en GitHub-konto. Både Vercel og Neon har gratis planer som er mer enn nok for denne appen.

### 1. Fork dette repoet

Trykk **Fork** øverst til høyre på GitHub.

### 2. Opprett database på Neon

1. Gå til [neon.tech](https://neon.tech) og opprett en gratis konto
2. Lag et nytt prosjekt (velg region **eu-central-1** for best ytelse fra Norge)
3. Kopier **connection string** — den ser slik ut:
   ```
   postgresql://bruker:passord@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Kjør database-migreringer

I Neon-dashbordet, gå til **SQL Editor** og kjør innholdet i disse filene (i rekkefølge):

1. `drizzle/migrations/0000_initial.sql`
2. `drizzle/migrations/0001_add_insulin_doses.sql`

Du kan kopiere SQL-en fra filene i repoet og lime den inn i SQL Editor, og trykke **Run**.

### 4. Deploy til Vercel

1. Gå til [vercel.com](https://vercel.com) og logg inn med GitHub
2. Trykk **Add New Project** og velg din fork
3. Under **Environment Variables**, legg til:

   | Variabel | Verdi |
   |----------|-------|
   | `DATABASE_URL` | Connection string fra Neon (steg 2) |
   | `APP_PASSWORD` | Et passord du velger selv for å logge inn |
   | `APP_COOKIE_SECRET` | En tilfeldig streng på minst 32 tegn* |

4. Trykk **Deploy**

> \* Generer en tilfeldig cookie-secret med: `openssl rand -hex 32`

### 5. Ferdig

Appen er nå live på `ditt-prosjekt.vercel.app`. Logg inn med passordet du valgte i steg 4.

## Lokal utvikling

```bash
npm install
cp .env.local.example .env.local   # Fyll inn DATABASE_URL, APP_PASSWORD, APP_COOKIE_SECRET
npm run dev                         # Åpner http://localhost:3000
```

## Tech Stack

| Lag | Teknologi |
|-----|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Neon Postgres + Drizzle ORM |
| Auth | HMAC-SHA256 session cookies |
| PDF | pdf-lib |
| Testing | Vitest |

## API

| Endepunkt | Beskrivelse |
|-----------|-------------|
| `GET/POST /api/readings` | Liste og opprett blodsukkermålinger |
| `PUT/DELETE /api/readings/[id]` | Oppdater og slett enkeltmåling |
| `GET/POST /api/insulin-doses` | Liste og opprett insulindoser |
| `PUT/DELETE /api/insulin-doses/[id]` | Oppdater og slett insulindose |
| `GET /api/report/pdf` | Generer PDF-rapport |
| `GET /api/backup/export` | Eksporter alle data som JSON |
| `POST /api/backup/import` | Importer data fra JSON-backup |
| `GET /api/settings` | Brukerinnstillinger |
| `GET /api/health` | Database-helsesjekk |

## Database

Tre hovedtabeller:

- **glucose_readings** — Blodsukkerverdier med tidspunkt, type (fastende/etter måltid), måltidsinfo og notater
- **insulin_doses** — Insulindoser med type (langtids-/hurtigvirkende), navn, dose og tidspunkt
- **user_settings** — Innstillinger (termin, diagnosedato, rapportspråk)
- **event_log** — Revisjonslogg for opprettelse, sletting og import

## Referanseverdier

Appen bruker grenseverdier fra Helsenorge og Diabetesforbundet:

| Type | Grenseverdi |
|------|-------------|
| Fastende | < 5,3 mmol/L |
| Etter måltid (1,5t) | < 6,7 mmol/L |

Disse er veiledende. Lege eller jordmor kan ha satt andre mål for din situasjon.

## Lisens

Privat prosjekt.
