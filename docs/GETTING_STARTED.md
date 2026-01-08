# Getting Started

## Prerequisites
- **Node.js**: v20 or higher.
- **Git**: For version control.
- **Neon Account**: For the Postgres database.

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd blodsukker_dev
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```env
   # Database (Neon)
   DATABASE_URL="postgres://user:pass@host:5432/db?sslmode=require"

   # App Secrets
   APP_PASSWORD="choose-a-strong-password"
   APP_COOKIE_SECRET="generate-a-random-32-char-string-here"
   ```

4. **Initialize Database**
   Push the schema to your Neon DB:
   ```bash
   npx drizzle-kit push:pg
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Common Commands
- `npm run dev`: Start dev server
- `npm run build`: Build for production
- `npm run lint`: Check code style
- `npm test`: Run unit tests
