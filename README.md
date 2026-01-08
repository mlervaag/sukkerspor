# Sukkerspor

A mobile-first blood glucose logging app built with Next.js, Tailwind CSS, and Drizzle ORM on Neon Postgres.

## Features

### Core
- 📊 **Dashboard** — Weekly stats, compliance tracking, and trend overview
- 📝 **Logging** — Add and edit glucose readings with meal context and food notes
- 🔒 **Password Auth** — Simple password-based authentication with secure cookies
- 📱 **Mobile-First** — Scandinavian-inspired design optimized for phones

### Data Management
- 💾 **Export/Import** — JSON backup with schema versioning (v1)
- 🗑️ **Deletion Flows** — Delete single readings, by day, by week, or all data with confirmation
- 📄 **PDF Reports** — Generate weekly/monthly reports in Norwegian or English

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Neon Postgres + Drizzle ORM (neon-serverless) |
| Auth | HMAC-signed session cookies |
| PDF Generation | pdf-lib |
| Hosting | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/        # Protected routes
│   │   ├── page.tsx            # Dashboard (Oversikt)
│   │   ├── log/                # Weekly log view
│   │   └── settings/           # Settings page
│   ├── api/
│   │   ├── auth/login/         # Login endpoint
│   │   ├── readings/           # CRUD for glucose readings
│   │   ├── readings/[id]/      # Single reading operations
│   │   ├── readings/bulk/      # Bulk delete (day/week/all)
│   │   ├── backup/export/      # JSON export
│   │   ├── backup/import/      # JSON import
│   │   ├── report/pdf/         # PDF report generation
│   │   └── health/             # Health check
│   └── login/                  # Login page
├── components/
│   ├── log/                    # Log-related components
│   ├── settings/               # Settings components (export, import, delete flows)
│   ├── report/                 # Report generation UI
│   └── ui/                     # Shared UI components (Modal, ConfirmDialog)
├── lib/
│   ├── auth/                   # Authentication utilities
│   ├── backup/                 # Export/import logic
│   ├── db/                     # Drizzle schema and connection
│   ├── domain/                 # Business logic and types
│   ├── report/                 # PDF generation and translations
│   └── utils/                  # Utility functions
└── middleware.ts               # Auth middleware
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Neon Postgres database

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in:
   ```env
   DATABASE_URL="your-neon-connection-string"
   APP_PASSWORD="your-login-password"
   APP_COOKIE_SECRET="at-least-32-random-characters"
   ```

3. Push the database schema:
   ```bash
   npx drizzle-kit push:pg
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run unit tests |
| `node scripts/smoke.mjs --password=...` | Run end-to-end smoke tests |

## API Reference

### Readings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/readings?weekStartDayKey={YYYY-MM-DD}` | List readings for the week starting on Monday |
| GET | `/api/readings?date={iso}` | (Legacy) List readings for week, date normalized to Oslo |
| POST | `/api/readings` | Create a new reading |
| GET | `/api/readings/[id]` | Get a single reading |
| PUT | `/api/readings/[id]` | Update a reading |
| DELETE | `/api/readings/[id]` | Delete a reading (transactional) |
| DELETE | `/api/readings/bulk?dayKey={YYYY-MM-DD}` | Delete all readings for a day |
| DELETE | `/api/readings/bulk?week={YYYY-MM-DD}` | Delete all readings for a week |
| DELETE | `/api/readings/bulk?all=true` | Delete all readings |

### Backup

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/backup/export` | Download JSON backup |
| POST | `/api/backup/import` | Import JSON backup (destructive) |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/report/pdf?range={week\|month\|all}&lang={no\|en}` | Generate PDF report |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with password |

## Database Schema

### `glucose_readings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `measured_at` | Timestamp | When the reading was taken |
| `day_key` | Text | Date in Europe/Oslo (YYYY-MM-DD) |
| `value_mmol_l` | Numeric(4,1) | Blood glucose value |
| `is_fasting` | Boolean | Fasting reading flag |
| `is_post_meal` | Boolean | Post-meal reading flag |
| `meal_type` | Text | Frokost, Lunsj, Middag, Kvelds, Mellommåltid |
| `food_text` | Text | What was eaten (optional) |
| `feeling_notes` | Text | User notes (optional) |
| `created_at` | Timestamp | Record creation time |
| `updated_at` | Timestamp | Last update time |

### `event_log`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_type` | Text | create, update, delete, import, export |
| `entity_type` | Text | glucose_reading, backup, settings |
| `entity_id` | UUID | Related entity ID (optional) |
| `payload` | Text | JSON metadata |
| `created_at` | Timestamp | Event timestamp |

## Backup Format

The app exports/imports data in JSON format with schema versioning:

```json
{
  "schema_version": 1,
  "exported_at": "2026-01-08T12:00:00.000Z",
  "readings": [
    {
      "id": "uuid",
      "measuredAt": "2026-01-08T10:00:00.000Z",
      "dayKey": "2026-01-08",
      "valueMmolL": "5.5",
      "isFasting": true,
      "isPostMeal": false,
      "mealType": null,
      "foodText": null,
      "feelingNotes": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "settings": {}
}
```

## Timezone Handling

- All timestamps are stored in UTC
- `day_key` is computed server-side using **Europe/Oslo** timezone
- The client sends `measuredAt` as a Date; the server derives `day_key`

## Security

- Password authentication with HMAC-signed session cookies
- HttpOnly, Secure (in production), SameSite=Lax cookies
- All API routes (except `/api/auth/login` and `/api/health`) require authentication
- No secrets exposed in export/import data or API responses

## Deployment

See [docs/deploy-vercel.md](docs/deploy-vercel.md) for Vercel deployment instructions.

Required environment variables on Vercel:
- `DATABASE_URL`
- `APP_PASSWORD`
- `APP_COOKIE_SECRET`

## License

Private project.
