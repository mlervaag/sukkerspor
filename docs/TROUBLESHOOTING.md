# Troubleshooting

## Build Errors

### `readlink: EINVAL` (Windows)
**Symptom**: `npm run build` fails with an `EINVAL` error pointing to `.next/server/...`.
**Cause**: filesystem locking or symlink issues with Next.js cache on Windows.
**Fix**: Use the safely implemented clean build command:
```bash
npm run clean
npm run build
```
Or simply:
```bash
npm run build
```
(We have configured `prebuild` to clean automatically in `package.json`, but if you run `next build` directly you might hit it).

## Database Issues

### Connection Errors
**Symptom**: App crashes or `/api/health` returns error.
**Check**:
- Is `DATABASE_URL` correct in `.env.local`?
- Is the Neon compute active? (It might sleep after inactivity).
- Are you hitting connection limits? (Neon Serverless handles this well, but check dashboard).

## Authentication

### "Unauthorized" Loop
**Symptom**: You log in, but are immediately redirected back to login.
**Cause**: Cookie mismatch or Secret rotation.
**Fix**:
1. Clear browser cookies for localhost.
2. Ensure `APP_COOKIE_SECRET` matches between server restarts (keep it constant in `.env.local`).
3. Ensure you are not mixing `http` and `https` contexts if `Secure` cookies are enforced (Dev is `Lax`, Prod is `Secure`).
