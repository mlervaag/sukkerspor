# FINAL_LOCK_CHECKS_WINDOWS.md

## Automated Checks (Windows)

Run before every release:

```powershell
cmd /c npm run build
cmd /c npm run lint
cmd /c npm run typecheck
cmd /c npm test
cmd /c node scripts/smoke.mjs --password=YOUR_PASSWORD
```

---

## API Invariant Checks (curl via cmd /c)

### 1. Health Endpoint (Public)
```powershell
cmd /c curl -s -o NUL -w "%%{http_code}" http://localhost:3000/api/health
# Expected: 200

cmd /c curl -s -D - http://localhost:3000/api/health | findstr "Cache-Control"
# Expected: Cache-Control: no-store
```

### 2. Auth Gating (API Returns 401)
```powershell
cmd /c curl -s -o NUL -w "%%{http_code}" http://localhost:3000/api/readings
# Expected: 401
```

### 3. Auth Gating (Page Redirects)
```powershell
cmd /c curl -s -o NUL -w "%%{http_code}" http://localhost:3000/log
# Expected: 307 (redirect to /login)
```

### 4. Readings GET Caching
```powershell
# First login to get cookie, then:
cmd /c curl -s -D - -H "Cookie: session=..." http://localhost:3000/api/readings | findstr "Cache-Control"
# Expected: Cache-Control: private, no-store
```

### 5. Backup Export Caching
```powershell
cmd /c curl -s -D - -H "Cookie: session=..." http://localhost:3000/api/backup/export | findstr "Cache-Control"
# Expected: Cache-Control: private, no-store
```

### 6. Backup Import Caching
```powershell
cmd /c curl -s -D - -X POST -H "Cookie: session=..." -H "Content-Type: application/json" -d "{\"schema_version\":1,\"readings\":[]}" http://localhost:3000/api/backup/import | findstr "Cache-Control"
# Expected: Cache-Control: no-store
```

---

## Transaction Invariant Checks

### 7. Import Atomicity (Rollback Test)
To verify rollback on failure:
1. Export current backup
2. Temporarily add `throw new Error("SIMULATED_FAIL")` after `tx.delete()` in `import.ts`
3. Attempt import
4. Verify readings are NOT deleted (transaction rolled back)
5. Revert the simulated error

### 8. Delete Atomicity (Rollback Test)
To verify rollback on failure:
1. Temporarily add `throw new Error("SIMULATED_FAIL")` after `tx.delete()` in DELETE handler
2. Attempt delete
3. Verify reading still exists (transaction rolled back)
4. Revert the simulated error

---

## Manual Verification Checklist

### Data Integrity Flow
- [ ] Create a new reading with all fields filled
- [ ] Verify it appears in the week list
- [ ] Edit the reading
- [ ] Verify changes are saved
- [ ] Delete the reading
- [ ] Verify it disappears

### Backup Round-Trip
- [ ] Export backup
- [ ] Verify JSON contains `schema_version: 1`
- [ ] Import the same backup
- [ ] Verify import succeeds (200)
- [ ] Verify data is identical

### Week Navigation
- [ ] Open Log page
- [ ] Verify request uses `weekStartDayKey=YYYY-MM-DD` (not `date=...Z`)
- [ ] Navigate to previous week
- [ ] Navigate to next week
- [ ] Verify readings appear on correct days

### PDF Report
- [ ] Generate PDF (Norwegian)
- [ ] Generate PDF (English)
- [ ] Verify both download correctly
- [ ] Verify language preference persists

### Runtime Verification (Vercel)
To confirm Node.js runtime on Vercel:
1. Check Vercel function logs for `/api/backup/import` → should show "nodejs" runtime
2. Check Vercel function logs for `/api/readings/[id]` → should show "nodejs" runtime
3. No "Edge" indicators

---

## Summary

| Check | Command | Expected |
|-------|---------|----------|
| Build | `cmd /c npm run build` | Exit 0 |
| Lint | `cmd /c npm run lint` | No errors |
| Typecheck | `cmd /c npm run typecheck` | Exit 0 |
| Tests | `cmd /c npm test` | 16 passed |
| Smoke | `cmd /c node scripts/smoke.mjs --password=...` | 12 passed |
| Health | `curl /api/health` | 200, no-store |
| API auth | `curl /api/readings` | 401 |
| Page auth | `curl /log` | 307 |
