# Vercel Deployment Guide

To fix the "Build Failed: No Output Directory named 'public' found" error, ensure your Vercel project settings match the following configuration.

## Project Settings in Vercel UI

1.  **Framework Preset**: Select **Next.js**. 
    - *Why:* Even if detected, explicitly selecting it ensures Vercel looks for `.next` instead of `public` or `dist`.
2.  **Root Directory**: Leave as `.` (repository root).
3.  **Build Command**: `next build` (should be default).
4.  **Output Directory**: **LEAVE EMPTY** (Default).
    - **IMPORTANT**: If this is set to `public`, the build will fail because Next.js outputs to `.next`.
5.  **Install Command**: `npm install` (should be default).

## Environment Variables

Ensure the following are set in the Vercel Dashboard (**Settings > Environment Variables**):

- `DATABASE_URL`: Your Neon connection string.
- `APP_PASSWORD`: Your login password.
- `APP_COOKIE_SECRET`: A long random string (32+ chars).
- `NEXT_TELEMETRY_DISABLED`: `1` (optional).

## Troubleshooting "No Output Directory"

If you see an error about the `public` directory, it usually means Vercel is treating the project as a Static Site instead of a Next.js app. The `vercel.json` file added to the repo helps prevent this, but the **Framework Preset** in the UI is the ultimate source of truth.
