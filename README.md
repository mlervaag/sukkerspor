# Sukkerspor

A mobile-first blood glucose logging app for gestational diabetes, built with Next.js, Tailwind CSS, and Drizzle ORM on Neon Postgres.

## Features

### 📊 Dashboard (Overview v1.1)
- **Target Status Summary** — Instant view of fasting and post-meal averages compared to clinical reference values.
- **Over-Target Tracking** — 7-day and 14-day counts of readings above reference, with clinical threshold alerts.
- **Coverage Metrics** — Visual tracking of logging frequency for fasting and post-meal readings.
- **Meal Breakdown** — Detailed analytics per meal type (breakfast, lunch, etc.) with over-target proportions.
- **Trend Sparkline** — 7-day smoothed trend visualization (Stabil, Økende, Synkende).
- **Quick Actions** — Fast entry modal and report generation access.

### 📝 Logging & Management
- **Smart Logging** — Categorized readings (Fasting vs. Post-Meal) with meal type and food notes.
- **Log Indicators** — Visual amber-border markers for readings exceeding target thresholds.
- **Data Mobility** — JSON Export/Import with schema versioning for backups and migration.
- **Detailed Reports** — Generate PDF summaries in Norwegian or English for medical consultation.
- **Privacy First** — All data is private to the user, with localized storage logic.

### 🔒 Security & Safety
- **Clinical Integrity** — Neutral neutral wording; targets presented as "Referanseverdier" based on Helsenorge/Diabetesforbundet.
- **Authentication** — Password-protected access with Edge-compatible HMAC session tokens.
- **Secure Cookies** — HttpOnly, Secure (Production), and SameSite=Lax cookie policies.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Vanilla CSS + Tailwind |
| **Database** | Neon Postgres + Drizzle ORM |
| **Auth** | HMAC-signed session cookies |
| **Testing** | Vitest + Custom Smoke Tests |
| **PDF** | pdf-lib |

---

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/    # Dashboard, Log, Settings (Protected)
│   ├── api/                # Readings, Backup, Report, Health API
│   └── login/              # Public login entry
├── components/
│   ├── dashboard/          # Specialized v1.1 stat widgets
│   ├── log/                # Reading cards, Entry modals
│   └── report/             # PDF generation triggers
├── lib/
│   ├── auth/               # Edge-compatible crypto sessions
│   ├── db/                 # Drizzle schema & Postgres pool
│   ├── domain/             # Analytics engine & clinical logic
│   └── report/             # PDF templates & translations
└── middleware.ts           # Global auth guarding
```

---

## Getting Started

### Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.local.example` to `.env.local` and configure your credentials:
   ```env
   DATABASE_URL="postgres://..."
   APP_PASSWORD="your-secure-password"
   APP_COOKIE_SECRET="32-char-random-string"
   ```

3. **Database Migration**:
   ```bash
   npx drizzle-kit push:pg
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

### High-Reliability Build (Windows)
If you encounter `readlink EINVAL` errors during build, use the integrated clean script:
```bash
npm run clean && npm run build
```

---

## API Reference

### Glucose Readings
- `GET /api/readings` — List readings (supports `weekStartDayKey` or 14d lookback).
- `POST /api/readings` — Create new log entry.
- `GET /api/readings/[id]` — Fetch single entry.
- `PUT /api/readings/[id]` — Update entry.
- `DELETE /api/readings/bulk` — Delete by `dayKey`, `week`, or recursive `all=true`.

### System & Reports
- `GET /api/report/pdf` — Generates clinical PDF (Range: `week`, `month`, `all`).
- `GET /api/settings` — Fetch user preferences (singleton).
- `GET /api/backup/export` — JSON Data dump.
- `GET /api/health` — DB connectivity check.

---

## Database Schema

### `glucose_readings`
Core clinical data storage.
- `measured_at`: UTC Timestamp.
- `day_key`: Derived YYYY-MM-DD (Europe/Oslo).
- `value_mmol_l`: Numeric (4,1).
- `is_fasting` / `is_post_meal`: Binary classification.
- `meal_type`: Categorical (frokost, lunsj, etc.).
- `food_text`: Text-based food logs.

### `user_settings` (Singleton)
- `due_date`: Clinical target date.
- `diagnosis_date`: Reference point for reports.
- `report_language`: Preferred output (no/en).

### `event_log`
Audit trail for significant mutations (create, delete, import).

---

## License
Private project.
