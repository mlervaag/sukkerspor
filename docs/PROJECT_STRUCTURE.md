# Project Structure

This document outlines the organization of code in `src/`.

## Directory Tree

```
src/
├── app/                        # Next.js App Router
│   ├── (authenticated)/        # Protected Routes Group (requires login)
│   │   ├── layout.tsx          # Wrapper with BottomNav
│   │   ├── page.tsx            # "Oversikt" (Dashboard)
│   │   ├── log/                # "Logg" (Weekly view)
│   │   └── settings/           # "Innstillinger"
│   ├── api/                    # API Endpoints (Next.js Route Handlers)
│   │   ├── auth/               # Login logic
│   │   ├── readings/           # POST/GET/DELETE readings
│   │   ├── backup/             # Import/Export
│   │   ├── report/             # PDF generation
│   │   └── health/             # Health check
│   └── login/                  # Public Login Page
│
├── components/                 # React Components
│   ├── dashboard/              # Overview Widgets (Stats, Trends, Breakdown)
│   ├── log/                    # Log-specific (ReadingCard, ReadingModal)
│   ├── report/                 # Report specific UI
│   ├── settings/               # Settings forms
│   └── ui/                     # Generic UI (Button, Input, Modal, Icons)
│
├── lib/                        # Core Logic & Utilities
│   ├── auth/                   # Session & Crypto (HMAC)
│   ├── backup/                 # JSON Validation & Transformation
│   ├── db/                     # Database Connection & Schema
│   ├── domain/                 # Business Logic (Analytics, Reading types)
│   ├── report/                 # PDF Generation Logic
│   └── utils/                  # Helpers (cn, date formatting)
│
└── middleware.ts               # Global request interception (Auth)
```

## Key Locations

- **`src/lib/db/schema.ts`**: The Source of Truth for the data model.
- **`src/lib/domain/analytics.ts`**: The brain of the dashboard. All math happens here.
- **`src/app/api/readings/route.ts`**: The primary data ingress/egress point.
- **`src/middleware.ts`**: Authentication gatekeeper.

## Naming Conventions
- **Files**: `kebab-case.ts/tsx`
- **Components**: `PascalCase`
- **Database Tables**: `snake_case` (Postgres standard)
- **Domain Types**: `PascalCase` (e.g., `GlucoseReading`)
