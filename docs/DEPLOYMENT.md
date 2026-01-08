# Deployment Guide

This project is optimized for deployment on **Vercel**.

## 1. Vercel Project Setup

1. Import the repository into Vercel.
2. **Framework Preset**: Next.js.
3. **Root Directory**: `./` (Default)

## 2. Environment Variables

You must configure the following in the Vercel Project Settings > Environment Variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your Neon Postgres connection string. |
| `APP_PASSWORD` | The password you want to use to log in. |
| `APP_COOKIE_SECRET` | A long, random string (32+ chars) to sign session cookies. |

**Important**:
- `APP_COOKIE_SECRET` should be generated securely.
- Do not check these into Git.

## 3. Database Migration
Drizzle Kit runs locally or in CI/CD, not usually strictly at runtime.
**Recommended**: Run migrations/push locally or in a GitHub Action before deployment triggers.
```bash
npx drizzle-kit push:pg
```
*Note: Since this is using `push:pg`, we are prototyping quickly. For strict production, consider standard Drizzle migrations.*

## 4. Verification
After deployment:
1. Visit the production URL.
2. `/login` should appear.
3. Log in.
4. Visit `/api/health` to confirm database connectivity.
