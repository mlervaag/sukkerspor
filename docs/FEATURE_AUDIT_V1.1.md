# Feature Audit: Gestational Diabetes Logging App

## Clinical Sources Used

| Source | Status | Key Content |
|--------|--------|-------------|
| [Helsenorge](https://www.helsenorge.no/sykdom/svangerskap/svangerskapsdiabetes/) | Current | Standard targets, measurement frequency |
| [Diabetesforbundet](https://www.diabetes.no/hva-er-diabetes/typer-diabetes/svangerskapsdiabetes/) | Current | Targets, consequences, follow-up guidance |
| [Legeforeningen NGF 2014](https://www.legeforeningen.no/foreningsledd/fagmed/norsk-gynekologisk-forening/veiledere/arkiv-utgatte-veiledere/veileder-i-fodselshjelp-2014/8-b.-svangerskapsdiabetes-ny) | ⚠️ Archived | Diagnostic definitions, HbA1c thresholds |

### Verified Clinical Targets
From Helsenorge and Diabetesforbundet (current sources):
- **Fasting**: under 5.3 mmol/L
- **2 hours after meal start**: under 6.7 mmol/L
- **Escalation threshold**: >3 readings over target in 2 weeks → refer to hospital

---

## 1. Feature Backlog (20 Items)

### Overview Widgets

| # | Feature | Why It Matters | Data Needed | Effort | Risk | Failure Modes |
|---|---------|----------------|-------------|--------|------|----------------|
| 1 | **Target Status Card** | Shows at-a-glance compliance vs standard targets | `is_fasting`, `value_mmol_l` | S | Low | User interprets as diagnosis. **Mitigation**: Disclaimer + "discuss with clinician" |
| 2 | **Over-Target Count (7/14d)** | Matches clinical escalation rule (>3 in 2wks) | `value_mmol_l`, `is_fasting`, `is_post_meal` | S | Medium | Fasting/post-meal misclassification. **Mitigation**: Require explicit flag selection |
| 3 | **Coverage Indicator** | Ensures sufficient logging for clinical review | `day_key`, `is_fasting`, `is_post_meal` | S | Low | May stress user to over-measure. **Mitigation**: Frame as "completeness for your clinician" |
| 4 | **7-Day Trend Sparkline** | Quick visual for direction (improving/stable/worsening) | `value_mmol_l`, `measuredAt` | M | Medium | Noise misinterpreted as trend. **Mitigation**: Smooth with 3-day rolling avg |
| 5 | **Meal-Type Breakdown** | Identifies which meals cause spikes | `meal_type`, `value_mmol_l` | M | Low | Low sample size per meal. **Mitigation**: Show only with ≥3 readings per type |
| 6 | **Fasting vs Post-Meal Split** | Clinical reports need this separation | `is_fasting`, `is_post_meal`, `value_mmol_l` | S | Low | Missing flags. **Mitigation**: Prompt to classify if missing |
| 7 | **Days Until Due Date** | Context for how many weeks remain | Needs: `due_date` setting | S | Low | None if optional |
| 8 | **Average by Period Widget** | Shows avg fasting/post-meal values | `value_mmol_l`, `is_fasting`, `is_post_meal` | S | Low | Avg can hide outliers. **Mitigation**: Show alongside over-target count |

### Log Enhancements

| # | Feature | Why It Matters | Data Needed | Effort | Risk | Failure Modes |
|---|---------|----------------|-------------|--------|------|----------------|
| 9 | **Visual Target Line in Cards** | Immediate feedback on each reading | `value_mmol_l`, `is_fasting` | S | Low | None |
| 10 | **Color Coding (Green/Amber/Red)** | Quick scan of readings | `value_mmol_l`, targets | S | Medium | Red may cause anxiety. **Mitigation**: Use amber for over-target, red only for significant |
| 11 | **Time Since Meal Field** | More accurate post-meal classification | Needs: `meal_start_time` OR computed from `meal_type` + `measuredAt` | M | Medium | Complex to calculate reliably |
| 12 | **Quick Add Templates** | Common patterns (e.g., "Frokost + 2hr") | Existing fields | M | Low | None |
| 13 | **Reminder Nudges** | Ensure measurement frequency | Needs: push notifications | L | Medium | Notification fatigue |
| 14 | **Food Photo Attachment** | Visual food diary for clinician | Needs: new `food_image` field | L | High | Storage/privacy complexity |

### Settings & Reports

| # | Feature | Why It Matters | Data Needed | Effort | Risk | Failure Modes |
|---|---------|----------------|-------------|--------|------|----------------|
| 15 | **Personal Target Override** | Some clinicians adjust targets | Needs: `fasting_target`, `post_meal_target` settings | M | Medium | User may set unsafe values. **Mitigation**: Show standard as "recommended", allow override with warning |
| 16 | **Weekly Summary Email/PDF** | Clinician-ready export | Existing | M | Low | None |
| 17 | **Due Date & Diagnosis Date Settings** | Report context | Needs: `due_date`, `diagnosis_date` | S | Low | None |
| 18 | **Gestational Week Display** | Context for progression | Needs: `due_date` | S | Low | None |

### Data Quality

| # | Feature | Why It Matters | Data Needed | Effort | Risk | Failure Modes |
|---|---------|----------------|-------------|--------|------|----------------|
| 19 | **Incomplete Reading Warning** | Flag readings without fasting/post-meal classification | `is_fasting`, `is_post_meal` | S | Low | None |
| 20 | **Duplicate Detection** | Prevent accidental double-entry | `measuredAt`, `value_mmol_l` | S | Low | False positives for similar times |

### Future AI (Post-v1)

| # | Feature | Why It Matters | Data Needed | Effort | Risk | Failure Modes |
|---|---------|----------------|-------------|--------|------|----------------|
| 21 | **Food-Spike Correlation** | Suggest which foods cause issues | `foodText`, `value_mmol_l` | L | High | Correlation ≠ causation. **Mitigation**: Frame as "pattern" not "cause" |
| 22 | **Predictive Warning** | Alert before likely high reading | Historical patterns | L | High | Medical device territory. **Avoid completely for v1** |

---

## 2. Overview Section Design (v1.1)

### Layout: 6 Cards, Mobile-First

```
┌─────────────────────────────────────┐
│ [1] Target Status Summary           │
│ ● Fasting: 4.9 avg (target <5.3)   │
│ ● Post-meal: 6.2 avg (target <6.7) │
│ ✓ Within standard targets          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [2] Over-Target Count               │
│ Last 7 days:  2                     │
│ Last 14 days: 4   ⚠ (>3 = discuss) │
└─────────────────────────────────────┘
┌──────────────────┬──────────────────┐
│ [3] Coverage     │ [4] 7-Day Trend  │
│ 5/7 days logged  │ ▁▂▃▂▁▂▃ → Stable │
└──────────────────┴──────────────────┘
┌─────────────────────────────────────┐
│ [5] Meal Breakdown (Last 14d)       │
│ Frokost: 5.8 avg │ ████░░ (3 over)  │
│ Lunsj:   5.2 avg │ █████░ (1 over)  │
│ Middag:  6.4 avg │ ███░░░ (2 over)  │
│ Kvelds:  5.0 avg │ ██████ (0 over)  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [6] Quick Actions                   │
│ [+ Ny måling]  [📄 Generer rapport] │
└─────────────────────────────────────┘
```

### Default Filters
- **Primary**: Last 7 days
- **Secondary toggle**: Last 14 days
- **Rationale**: Matches clinical escalation rule (>3 over target in 2 weeks)

### Widget Priority (Build Order)
1. Target Status Summary (S)
2. Over-Target Count (S)
3. Coverage Indicator (S)
4. Meal Breakdown (M)
5. 7-Day Trend (M)
6. Quick Actions (S)

---

## 3. Clinical Target Handling

### Standard Reference Targets
| Measurement | Target | Source |
|-------------|--------|--------|
| Fasting | < 5.3 mmol/L | Helsenorge, Diabetesforbundet |
| 2hr post-meal | < 6.7 mmol/L | Helsenorge, Diabetesforbundet |
| Escalation rule | >3 over target in 2 weeks | Helsenorge |

### Presentation Strategy (Neutral)
- Show targets as **"standard reference values"** not recommendations
- Use **visual indicators** (color/icons) but avoid alarmist language
- Always include **"discuss with your clinician"** for any flag

### Suggested Copy

**Target Card Header:**
> "Referanseverdier (standardmål)"

**Over-Target Alert:**
> "⚠ Du har hatt {n} målinger over referanseverdiene de siste 14 dagene. Ved mer enn 3 anbefales det å diskutere med jordmor eller lege."

**Disclaimer (Settings/Footer):**
> "Målverdiene som vises er basert på Helsenorges anbefalinger for svangerskapsdiabetes. Din lege eller jordmor kan ha satt andre mål for deg. Appen gir ikke medisinsk råd — diskuter alltid dine verdier med helsepersonell."

**PDF Report Header:**
> "Referanseverdier brukt: Fastende < 5.3 mmol/L, 2t etter måltid < 6.7 mmol/L (Helsenorge). Verdiene bør diskuteres med behandlende helsepersonell."

---

## 4. Quick Wins Shortlist (Top 5)

### 1. Target Status Summary Widget
**Acceptance Criteria:**
- Shows avg fasting and avg post-meal for selected period (7d/14d)
- Shows "within target" or "over target" status for each
- Calculation: fasting readings vs 5.3, post-meal readings vs 6.7

**UI:**
- Card with two rows (fasting/post-meal)
- Green check or amber warning icon per row
- Disclaimer link at bottom

**Effort:** S (1-2 days)

---

### 2. Over-Target Count Widget
**Acceptance Criteria:**
- Counts readings where value exceeds target (fasting>5.3 OR post-meal>6.7)
- Shows count for last 7 days and last 14 days
- Highlights if 14-day count > 3

**UI:**
- Two numbers with labels
- Amber badge if >3 in 14d
- Tooltip: "Ved mer enn 3 bør du kontakte jordmor/lege"

**Effort:** S (1 day)

---

### 3. Visual Target Line on Reading Cards
**Acceptance Criteria:**
- Reading card shows subtle visual indicator if over target
- Based on `is_fasting→5.3` or `is_post_meal→6.7`
- No change to readings without classification

**UI:**
- Amber left border on card if over target
- Optional: small ⚠ icon next to value

**Effort:** S (1 day)

---

### 4. Coverage Indicator Widget
**Acceptance Criteria:**
- Shows number of days with at least one fasting reading
- Shows number of days with at least one post-meal reading
- Goal: 7/7 days each type (or custom goal)

**UI:**
- Progress bar or "5/7 dager" text
- Separate row for fasting and post-meal

**Effort:** S (1 day)

---

### 5. Meal-Type Breakdown Widget
**Acceptance Criteria:**
- Groups post-meal readings by `meal_type`
- Shows avg value and over-target count per meal
- Only shows meal types with ≥3 readings

**UI:**
- Horizontal bar chart or simple table
- Color-coded bar fill (green/amber)

**Effort:** M (2-3 days)

---

## Summary

| Category | Count |
|----------|-------|
| Total Features | 22 |
| Overview Widgets | 8 |
| Log Enhancements | 6 |
| Settings/Reports | 4 |
| Data Quality | 2 |
| Future AI | 2 |

**Recommended Next Steps:**
1. Implement Quick Win #1 (Target Status Summary)
2. Implement Quick Win #2 (Over-Target Count)
3. Implement Quick Win #3 (Visual Target Line)
4. Add disclaimer copy to Overview and PDF
5. Test with user (gestational diabetes patient) for feedback
