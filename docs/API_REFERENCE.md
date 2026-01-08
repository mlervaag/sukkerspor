# API Reference

All API routes are prefixed with `/api`.
Responses are JSON.
Authentication is required for all routes except `/auth/login` and `/health`.

## Readings

### List Readings
`GET /api/readings`

**Query Params:**
- `weekStartDayKey` (optional): `YYYY-MM-DD` (Monday) - Returns readings for that week.
- `date` (optional): `ISO8601` - Returns readings for the week containing this date.

**Response:** Array of `GlucoseReading`.

### Create Reading
`POST /api/readings`

**Body:**
```json
{
  "valueMmolL": "5.5",
  "measuredAt": "2024-01-01T12:00:00Z",
  "isFasting": true,
  "isPostMeal": false,
  "mealType": "frokost", // optional
  "foodText": "Oatmeal" // optional
}
```

### Get Single Reading
`GET /api/readings/[id]`

### Update Reading
`PUT /api/readings/[id]`

### Bulk Delete
`DELETE /api/readings/bulk`

**Query Params (One required):**
- `dayKey`: `YYYY-MM-DD` - Delete all for specific day.
- `week`: `ISO8601` - Delete all for specific week.
- `all`: `true` - Delete EVERYTHING.

## Reports
`GET /api/report/pdf`

**Query Params:**
- `range`: `week` | `month` | `all`
- `lang`: `no` | `en`

**Response:** `application/pdf` (Download)

## Backup
`GET /api/backup/export` -> Returns JSON dump.
`POST /api/backup/import` -> Accepts JSON dump (Schema Version 1).

## Health
`GET /api/health`
Returns `{ status: "healthy" }` if DB connection is alive.
