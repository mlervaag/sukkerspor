# Overview v1.1 Implementation Plan

Conservative, iteration-based approach with minimal risk and maximum clarity.

---

## Hard Rules (Enforced Throughout)

- **No new data fields** unless explicitly necessary
- **No new charts** unless clearly low-risk
- **No AI features**
- **No notifications**
- **6–10 cards total** on Overview

---

## Iteration 1: Core Status Widgets

**Goal:** Deliver clinically-relevant status at a glance using existing data fields.

### Scope

| Widget | Description |
|--------|-------------|
| Target Status Summary | Average fasting vs 5.3, average post-meal vs 6.7 with status indicator |
| Over-Target Count (7d/14d) | Count readings exceeding thresholds; highlight if 14d > 3 |
| Coverage Indicator | Days with at least one fasting/post-meal reading this week |

### Out of Scope

- Meal-type breakdown
- Trend sparkline
- Quick action buttons
- Any schema changes
- Any PDF/report changes

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User interprets status as medical diagnosis | Medium | High | Disclaimer on every card; neutral language only |
| Misclassification of fasting/post-meal | Low | Medium | Rely on existing explicit flags; no inference |

### Failure Modes

1. **Average shows null when no readings** → Show "—" placeholder
2. **Color coding causes anxiety** → Use amber only, never red
3. **Over-target count is misleading without context** → Always show both 7d and 14d side by side

### Binary Tests

| Test | Pass Criterion |
|------|----------------|
| T1.1 | Target Status shows "—" when no fasting readings exist |
| T1.2 | Target Status shows amber icon when avg fasting > 5.3 |
| T1.3 | Over-target count shows correct 7d count for test dataset |
| T1.4 | Over-target count shows correct 14d count for test dataset |
| T1.5 | Over-target badge appears when 14d count > 3 |
| T1.6 | Coverage shows "5/7" when 5 unique days have readings |
| T1.7 | All widgets load without console errors |
| T1.8 | Build succeeds with `npm run build` |

### Definition of Done (DoD)

- [ ] All binary tests pass
- [ ] No new TypeScript errors
- [ ] Disclaimer visible on Overview page
- [ ] All text in Norwegian
- [ ] Manual visual review on mobile viewport (375px width)

---

## Iteration 2: Meal Breakdown + Reading Card Enhancement

**Goal:** Enable meal-level insight and improve log readability without new data fields.

### Scope

| Widget/Feature | Description |
|----------------|-------------|
| Meal-Type Breakdown | Group post-meal readings by `mealType`; show avg + over-target count per meal |
| Reading Card Target Indicator | Amber left border on cards where value exceeds applicable threshold |

### Out of Scope

- Trend sparkline (deferred to Iteration 3)
- Quick action buttons
- Any schema changes
- PDF updates

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low sample size per meal type | Medium | Low | Only show meal types with ≥3 readings |
| Amber border adds visual noise | Low | Low | Subtle 2px border, not full card color |

### Failure Modes

1. **Meal type null renders as "undefined"** → Use `mealType || "Annet"` fallback
2. **Reading card indicator for unclassified reading** → No indicator if neither `isFasting` nor `isPostMeal`

### Binary Tests

| Test | Pass Criterion |
|------|----------------|
| T2.1 | Meal breakdown only shows meals with ≥3 readings |
| T2.2 | Meal breakdown shows correct avg for "Frokost" |
| T2.3 | Meal breakdown shows correct over-target count for "Middag" |
| T2.4 | Reading card shows amber border when fasting > 5.3 |
| T2.5 | Reading card shows amber border when post-meal > 6.7 |
| T2.6 | Reading card shows no border when value within target |
| T2.7 | Unclassified readings show no indicator |
| T2.8 | Build succeeds with `npm run build` |

### Definition of Done (DoD)

- [ ] All binary tests pass
- [ ] No regression in Iteration 1 widgets
- [ ] Meal breakdown card respects "—" for empty states
- [ ] Visual review on mobile confirms readability

---

## Iteration 3: Trend Sparkline + Quick Actions

**Goal:** Add directional trend visualization and streamline common actions.

### Scope

| Widget | Description |
|--------|-------------|
| 7-Day Trend Sparkline | Simple line chart showing daily average; labeled "Stabil"/"Økende"/"Synkende" |
| Quick Actions Card | Two buttons: "+ Ny måling" (opens reading modal), "Generer rapport" (opens report flow) |

### Out of Scope

- Personal target override settings
- Due date countdown
- Any schema changes
- Any new API endpoints

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Noise misinterpreted as trend | Medium | Medium | Use 3-day rolling average; label as "retning" not "trend" |
| Chart library adds bundle size | Low | Low | Use simple SVG path, no external chart library |

### Failure Modes

1. **Fewer than 3 days of data** → Show placeholder "Ikke nok data ennå"
2. **Sparkline misleads with single outlier** → Rolling average smooths this

### Binary Tests

| Test | Pass Criterion |
|------|----------------|
| T3.1 | Sparkline shows placeholder when < 3 days of data |
| T3.2 | Sparkline renders 7 points for full week |
| T3.3 | "Stabil" label appears when stddev of 7d avg < 0.5 |
| T3.4 | "+ Ny måling" button opens reading modal |
| T3.5 | "Generer rapport" button navigates to report page or opens modal |
| T3.6 | Build succeeds with `npm run build` |

### Definition of Done (DoD)

- [ ] All binary tests pass
- [ ] Final card count is 6–8 (within limit)
- [ ] No regressions in Iteration 1 or 2 widgets
- [ ] User signoff on visual layout

---

## Final Widget Layout (Target: 8 Cards)

```
┌─────────────────────────────────────┐
│ [1] Target Status Summary           │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [2] Over-Target Count (7d / 14d)    │
└─────────────────────────────────────┘
┌──────────────────┬──────────────────┐
│ [3] Coverage     │ [4] 7-Day Trend  │
└──────────────────┴──────────────────┘
┌─────────────────────────────────────┐
│ [5] Meal Breakdown                  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [6] Today Status (existing)         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [7] Last 3 Readings (existing)      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [8] Quick Actions                   │
└─────────────────────────────────────┘
```

---

## Risk Summary

| Category | Iteration 1 | Iteration 2 | Iteration 3 |
|----------|-------------|-------------|-------------|
| Schema changes | None | None | None |
| New dependencies | None | None | None (SVG path) |
| Medical advice risk | **Medium** (mitigated) | Low | Low |
| Complexity | Low | Low | Medium |
