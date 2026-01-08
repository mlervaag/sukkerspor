# Testing Strategy

We employ a multi-layered testing strategy to ensure correctness without slowing down development.

## 1. Unit Tests (Vitest)
Used for pure logic, especially domain calculations and data transformations.

**Run:** `npm test`

- **Location**: `src/lib/**/*.test.ts`
- **Scope**:
  - `analytics.test.ts`: Verifies averages, trends, and thresholds.
  - `validate.test.ts`: Verifies backup import validation logic.
  - `day-key.test.ts`: Verifies timezone handling logic.

## 2. Smoke Tests (Custom Script)
A lightweight end-to-end test suite that verifies the API and Auth flow against a real (or dev) database.

**Run:** `node scripts/smoke.mjs --password=[YOUR_APP_PASSWORD]`

- **What it tests**:
  - Login flow (cookie retrieval)
  - Creating a reading
  - Reading the reading back
  - Deleting the reading
- **Note**: This runs "live" against the configured `DATABASE_URL`. Do not run against production data unless you intend to create/delete test data.

## 3. Static Analysis
Running before every build and usually on specific file saves.

- **Linting**: `npm run lint` (ESLint with Next.js config)
- **Typecheck**: `npm run typecheck` (TypeScript compiled with `--noEmit`)

## 4. Manual Verification
Key scenarios to check manually before release:
1. **Empty State**: Clear DB and verify dashboard handles 0 readings gracefully.
2. **Mobile Layout**: Check "Oversikt" on a 375px viewport (Chrome DevTools).
3. **Report Generation**: Generate a PDF and verify the date range and language.
