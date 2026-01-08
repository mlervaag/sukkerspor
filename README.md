# Sukkerspor

A mobile-first blood glucose logging app built with Next.js, Tailwind CSS, and Drizzle ORM on Neon Postgres.

## Features

- 📊 **Dashboard** — Weekly stats, compliance tracking, and trend overview
- 📝 **Logging** — Add and edit glucose readings with meal context
- 🔒 **Password Auth** — Simple password-based authentication with secure cookies
- 📱 **Mobile-First** — Scandinavian-inspired design optimized for phones

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Neon Postgres + Drizzle ORM
- **Hosting:** Vercel

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

## Deployment

See [docs/deploy-vercel.md](docs/deploy-vercel.md) for Vercel deployment instructions.

## License

Private project.
