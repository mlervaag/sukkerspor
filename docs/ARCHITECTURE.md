# Architecture Overview

## Technology Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Neon](https://neon.tech/) (Serverless Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth**: Custom HMAC-signed stateless session cookies (Edge compatible)

## Authentication Strategy
We use a lightweight, stateless authentication system designed for zero-latency edge lookups.
1. **Login**: User POSTs password to `/api/auth/login`.
2. **Token generation**: Server validates password against `APP_PASSWORD`. If valid, it creates an HMAC-SHA256 signature of the password using `APP_COOKIE_SECRET`.
3. **Session**: This signature is stored in a `session` cookie (HttpOnly, Secure, SameSite=Lax).
4. **Verification**: `middleware.ts` intercepts requests. It re-computes the HMAC of the `APP_PASSWORD` and compares it to the cookie value. If they match, the request proceeds.
5. **Advantage**: No database lookup required for authentication, extremely fast, works on Vercel Edge Middleware.

## Data Flow
- **Fetching**: Client-side data fetching uses `SWR` (Stale-While-Revalidate) for reactivity and cache management.
- **Mutations**: Standard `fetch` calls to API routes (`/api/readings`).
- **State**: The app is designed to be "optimistic UI" friendly, but currently relies on `mutate()` from SWR to refresh data after inputs.
- **Timezones**:
  - The database stores all timestamps in **UTC**.
  - server-side logic in `src/lib/domain` converts UTC to "Europe/Oslo" day-keys (YYYY-MM-DD) for grouping.
  - The UI formats these dates for display using `date-fns` with Norwegian locale.

## Database Schema Design
- **`glucose_readings`**: The central table. Contains the raw `value_mmol_l` and boolean flags for context (`is_fasting`, `is_post_meal`).
- **`user_settings`**: A "singleton" table implementation. We use a fixed ID (`singleton`) to store user-wide preferences like report language.
- **`event_log`**: An append-only audit log for sensitive operations (bulk delete, import, export).

## Clinical Logic (Overview v1.1)
The application separates "Domain Logic" from "UI Logic":
- `src/lib/domain/analytics.ts`: Pure functions that take readings and return statistical objects (averages, trends, compliance).
- `src/app/(authenticated)/page.tsx`: The UI layer that consumes these stats. It does *not* calculate averages itself.
- **Hard Rules**:
  - Fasting Threshold: < 5.3 mmol/L
  - Post-meal Threshold: < 6.7 mmol/L
  - These are defined in `THRESHOLDS` constant and used consistently across validation and analytics.
