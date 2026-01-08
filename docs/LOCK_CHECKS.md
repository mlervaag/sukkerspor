# Lock Checks

This document defines the invariants and checks required for a safe release of Sukkerspor v1.

## Invariants

| Invariant | Method of Verification |
|-----------|------------------------|
| **Auth Gating** | Unauthenticated request to `/log` should 302 to `/login`. |
| **API Gating** | Unauthenticated request to `/api/readings` should 401. |
| **Sensitive Cache** | Private GET endpoints must return `Cache-Control: private, no-store`. |
| **Mutation Safety** | PUT/POST/DELETE must return `Cache-Control: no-store`. |
| **Timezone Integrity** | `day_key` must be computed in `Europe/Oslo` only. |
| **Data Safety** | Deletion must be transactional. |
| **Backup Integrity** | Exported backup must validate and re-import successfully. |

## Automated Checks

Run these commands before every release:

```bash
# Production build
npm run build

# Linting
npm run lint

# Type checking
npm run typecheck

# Unit tests
npm test
```

## Manual Checklists

### 1. Data Integrity Flow
- [ ] Add a reading.
- [ ] Edit the reading.
- [ ] Export backup.
- [ ] Import the same backup.
- [ ] Verify reading is identical.

### 2. Export/Import Schema v1
- [ ] Check that `settings` are preserved (report language, profile).
- [ ] Check that `food_text` is preserved.

### 3. Report Generation
- [ ] Generate PDF in Norwegian.
- [ ] Generate PDF in English.
- [ ] Confirm language preference persists after refresh.
