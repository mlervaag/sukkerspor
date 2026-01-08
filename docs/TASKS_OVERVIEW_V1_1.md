# Tasks: Overview v1.1

Concrete tasks per iteration with exact file targets based on current repo structure.

---

## File Reference Map

| Purpose | File Path |
|---------|-----------|
| Overview page | `src/app/(authenticated)/page.tsx` |
| Analytics/stats logic | `src/lib/domain/analytics.ts` |
| Domain types | `src/lib/domain/types.ts` |
| StatCard component | `src/components/dashboard/stat-card.tsx` |
| Reading card | `src/components/log/reading-card.tsx` |
| DB schema | `src/lib/db/schema.ts` |
| Report flow | `src/components/report/generate-report-flow.tsx` |
| Reading modal | `src/components/log/reading-modal.tsx` |

---

## Iteration 1: Core Status Widgets

### Task 1.1: Add Over-Target Count to Analytics

**File:** `src/lib/domain/analytics.ts`

**Changes:**
- Add `overTargetCount7d: number` and `overTargetCount14d: number` to `DashboardStats` interface
- Implement counting logic in `computeDashboardStats()`:
  - Filter readings where `isFasting && value > 5.3` OR `isPostMeal && value > 6.7`
  - Separate counts by 7-day and 14-day windows

**Acceptance Criteria:**
- [ ] New fields present in interface
- [ ] Counts correct given test data
- [ ] No breaking changes to existing consumers

---

### Task 1.2: Add Coverage Stats to Analytics

**File:** `src/lib/domain/analytics.ts`

**Changes:**
- Add `coverageFasting: number` (days with ≥1 fasting reading / 7)
- Add `coveragePostMeal: number` (days with ≥1 post-meal reading / 7)
- Compute by grouping readings by `dayKey`, then counting unique days per type

**Acceptance Criteria:**
- [ ] Coverage fields return values 0–7 (as count, not percentage)
- [ ] Correctly handles empty reading set (returns 0)

---

### Task 1.3: Create TargetStatusCard Widget

**File to create:** `src/components/dashboard/target-status-card.tsx`

**Dependencies:** Uses `DashboardStats` from analytics

**Props:**
```ts
interface TargetStatusCardProps {
  stats: DashboardStats;
}
```

**Renders:**
- Row 1: "Fastende: {avg} mmol/L" + status icon (check/warning)
- Row 2: "Etter måltid: {avg} mmol/L" + status icon
- Footer: Link to disclaimer or inline disclaimer text

**Acceptance Criteria:**
- [ ] Shows "—" when avg is null
- [ ] Shows amber icon (⚠) when avg > threshold
- [ ] Shows green check (✓) when avg ≤ threshold
- [ ] Disclaimer text visible

---

### Task 1.4: Create OverTargetCountCard Widget

**File to create:** `src/components/dashboard/over-target-count-card.tsx`

**Props:**
```ts
interface OverTargetCountCardProps {
  count7d: number;
  count14d: number;
}
```

**Renders:**
- Two columns: "Siste 7 dager: {n}" | "Siste 14 dager: {n}"
- Amber badge on 14d if count > 3
- Tooltip/hover text: "Ved mer enn 3 målinger over referanseverdiene bør du diskutere med jordmor/lege"

**Acceptance Criteria:**
- [ ] Both counts render correctly
- [ ] Badge appears when 14d > 3
- [ ] Badge hidden when 14d ≤ 3

---

### Task 1.5: Create CoverageCard Widget

**File to create:** `src/components/dashboard/coverage-card.tsx`

**Props:**
```ts
interface CoverageCardProps {
  fastingDays: number;
  postMealDays: number;
}
```

**Renders:**
- Row 1: "Fastende: {n}/7 dager"
- Row 2: "Etter måltid: {n}/7 dager"
- Simple progress bar visualization (optional)

**Acceptance Criteria:**
- [ ] Shows 0/7 when no readings
- [ ] Correctly reflects days not count of readings

---

### Task 1.6: Add Disclaimer to Overview Page

**Files:** `src/app/(authenticated)/page.tsx`

**Changes:**
- Add footer section below all widgets
- Render disclaimer text (see COPY_AND_DISCLAIMERS.md)

**Acceptance Criteria:**
- [ ] Disclaimer visible on page load
- [ ] Text matches approved copy
- [ ] Does not interfere with widget layout

---

### Task 1.7: Integrate New Widgets into Overview Page

**File:** `src/app/(authenticated)/page.tsx`

**Changes:**
- Import `TargetStatusCard`, `OverTargetCountCard`, `CoverageCard`
- Update `useSWR` query to fetch 14 days of data (change `startOfWeek` to `subDays(now, 14)`)
- Compute both 7d and 14d stats (filter 7d subset)
- Render new widgets in grid

**Acceptance Criteria:**
- [ ] New widgets render without errors
- [ ] Existing "Today Status" and "Last 3 Readings" remain functional
- [ ] Data fetches 14 days of readings

---

## Iteration 2: Meal Breakdown + Reading Card Enhancement

### Task 2.1: Add Meal Stats to Analytics

**File:** `src/lib/domain/analytics.ts`

**Changes:**
- Add helper function `computeMealBreakdown(readings: GlucoseReading[])`
- Returns:
```ts
interface MealStat {
  mealType: string;
  count: number;
  average: number | null;
  overTargetCount: number;
}
```
- Only includes meal types with count ≥ 3

**Acceptance Criteria:**
- [ ] Returns empty array if no meals have ≥3 readings
- [ ] Correctly groups by `mealType`
- [ ] `null` mealType mapped to "Annet"

---

### Task 2.2: Create MealBreakdownCard Widget

**File to create:** `src/components/dashboard/meal-breakdown-card.tsx`

**Props:**
```ts
interface MealBreakdownCardProps {
  meals: MealStat[];
}
```

**Renders:**
- One row per meal type showing: name, avg value, over-target count
- Simple horizontal bar showing over-target proportion
- Message "Ikke nok data" if meals array empty

**Acceptance Criteria:**
- [ ] Only shows meals with ≥3 readings
- [ ] Shows placeholder when no qualifying meals
- [ ] Norwegian meal names used

---

### Task 2.3: Add Target Indicator to Reading Card

**File:** `src/components/log/reading-card.tsx`

**Changes:**
- Import `THRESHOLDS` from `@/lib/domain/analytics`
- Compute `isOverTarget`:
  - `isFasting && value > 5.3`
  - `isPostMeal && value > 6.7`
- Add `border-l-2 border-amber-500` class when over target

**Acceptance Criteria:**
- [ ] Amber border visible when over target
- [ ] No border when within target
- [ ] No border when neither `isFasting` nor `isPostMeal`

---

### Task 2.4: Integrate MealBreakdownCard into Overview

**File:** `src/app/(authenticated)/page.tsx`

**Changes:**
- Import new component
- Call `computeMealBreakdown()` with 14d readings
- Add to widget grid

**Acceptance Criteria:**
- [ ] Widget renders in correct position
- [ ] No console errors

---

## Iteration 3: Trend Sparkline + Quick Actions

### Task 3.1: Add Trend Calculation to Analytics

**File:** `src/lib/domain/analytics.ts`

**Changes:**
- Add function `computeDailyAverages(readings: GlucoseReading[]): { date: string; avg: number }[]`
- Returns array of daily averages for last 7 days
- Applies 3-day rolling average for smoothing
- Add `trendLabel: "Stabil" | "Økende" | "Synkende" | null` derived from slope

**Acceptance Criteria:**
- [ ] Returns null/empty when < 3 days of data
- [ ] Correct rolling average calculation

---

### Task 3.2: Create TrendSparklineCard Widget

**File to create:** `src/components/dashboard/trend-sparkline-card.tsx`

**Props:**
```ts
interface TrendSparklineCardProps {
  dailyAverages: { date: string; avg: number }[];
  label: "Stabil" | "Økende" | "Synkende" | null;
}
```

**Renders:**
- SVG path sparkline (no external chart library)
- Label: "Retning: {label}" below sparkline
- Placeholder: "Ikke nok data ennå" when insufficient data

**Acceptance Criteria:**
- [ ] SVG renders without errors
- [ ] Placeholder shown when < 3 days
- [ ] Label matches computed trend

---

### Task 3.3: Create QuickActionsCard Widget

**File to create:** `src/components/dashboard/quick-actions-card.tsx`

**Props:**
```ts
interface QuickActionsCardProps {
  onAddReading: () => void;
  onGenerateReport: () => void;
}
```

**Renders:**
- Two buttons: "+ Ny måling" and "Generer rapport"
- Consistent button styling

**Acceptance Criteria:**
- [ ] Add reading button triggers modal open callback
- [ ] Report button navigates to `/settings` (report tab) or opens modal

---

### Task 3.4: Integrate Final Widgets into Overview

**File:** `src/app/(authenticated)/page.tsx`

**Changes:**
- Import and render `TrendSparklineCard` and `QuickActionsCard`
- Wire up button callbacks (reading modal state, navigation)
- Final widget ordering and layout cleanup

**Acceptance Criteria:**
- [ ] Total card count is 6–8
- [ ] All widgets render on mobile viewport
- [ ] No regressions

---

## Summary: Files to Create

| Iteration | New Files |
|-----------|-----------|
| 1 | `target-status-card.tsx`, `over-target-count-card.tsx`, `coverage-card.tsx` |
| 2 | `meal-breakdown-card.tsx` |
| 3 | `trend-sparkline-card.tsx`, `quick-actions-card.tsx` |

## Summary: Files to Modify

| File | Iterations |
|------|------------|
| `src/lib/domain/analytics.ts` | 1, 2, 3 |
| `src/app/(authenticated)/page.tsx` | 1, 2, 3 |
| `src/components/log/reading-card.tsx` | 2 |
