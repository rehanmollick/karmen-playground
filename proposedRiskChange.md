# Risk Analysis — Simple View Redesign Proposal

## Problem Statement

The current Simple mode asks construction PMs to set "Best Case" and "Worst Case" day counts per task using two separate sliders. This fails because:

1. **Wrong mental model** — A PM doesn't think "my best case is 11 days." They think "I'm not very confident about this permit approval." The input question doesn't match how they reason.
2. **Two sliders per card** — Each task takes up ~6 lines. With 10–15 tasks, it's an exhausting scroll through abstract controls.
3. **No prioritization signal** — Critical and non-critical tasks look identical. PMs waste time adjusting tasks that don't affect the end date at all.
4. **Technical jargon in output** — "P50 / P80 / P95" and "50% confidence" mean nothing to someone who schedules concrete pours. They don't map to a decision.
5. **"Run 10,000 Simulations"** — This tells the PM how the math works, not what they're about to get. It sounds like it will take a long time.

---

## Proposed Redesign

### 1. Replace sliders with a single Confidence Selector

Instead of two sliders per task, show one 5-point horizontal radio picker:

```
[Building Permit Application]                           ● CRITICAL
How confident are you this task will finish on time?

  Very         Fairly      Not Sure      At Risk      Major Risk
Confident    Confident
   ●────────────○────────────○────────────○────────────○

  → Modeling 13d–16d around expected 14 days
```

**Each confidence level maps to a PERT spread automatically (hidden from PM):**

| Label          | Optimistic | Pessimistic | Real-world meaning                    |
|----------------|-----------|------------|----------------------------------------|
| Very Confident | ML × 0.93 | ML × 1.07  | Straightforward in-house task          |
| Fairly Confident | ML × 0.85 | ML × 1.20 | Subcontractor work, minor unknowns    |
| Not Sure       | ML × 0.75 | ML × 1.35  | City approval, new crew, site TBD     |
| At Risk        | ML × 0.65 | ML × 1.55  | Known issue, dependency on third party |
| Major Risk     | ML × 0.50 | ML × 1.75  | Highly uncertain — geotechnical, permits, weather |

The "Modeling X–Y days" line gives the PM confirmation that their choice registered, without asking them to type numbers.

**Default pre-selection:** Use the current seed data's opt/pess spread to pick the closest confidence level automatically when the panel loads. This means the PM sees a pre-filled, reasonable starting state — not blank sliders.

---

### 2. Restructure the task list

**Before:** 10–15 cards all shown equally, each 6 lines tall.

**After:**

```
CRITICAL PATH TASKS (affects your end date)          [5 tasks]
┌─────────────────────────────────────────────────────────┐
│ Building Permit Application          ● CRITICAL          │
│ How confident?  ● Very  ○ Fairly  ○ Not Sure  ○ Risk ... │
│ → Modeling 13–16d (expected 14d)                         │
└─────────────────────────────────────────────────────────┘
... (4 more critical tasks) ...

OTHER TASKS (won't change your end date)             ▼ show
  (collapsed by default — PM doesn't need to touch these)
```

Critical path tasks are expanded and come first. Non-critical tasks are collapsed in a disclosure — they still exist and can be adjusted for Advanced users, but the PM isn't distracted by them.

---

### 3. Add a risk hint under each task name

Replace the vague "(could be X–Y)" subtext with a short construction-domain reason:

| Activity type (keyword match) | Hint shown                                 |
|-------------------------------|--------------------------------------------|
| "permit" / "approval"         | "City approvals often run longer than expected" |
| "excavat" / "foundation"      | "Site conditions can cause unexpected delays"   |
| "concrete" / "pour"           | "Weather-sensitive — rain delays are common"    |
| "inspection"                  | "Inspector scheduling can add waiting days"     |
| "steel" / "structure"         | "Fabrication lead times vary by supplier"       |
| (default)                     | *(no hint shown)*                               |

This gives the PM a reason to care about each task without requiring them to know what PERT is.

---

### 4. Rename the run button

**Before:** "Run 10,000 Simulations"
**After:** "Analyze Schedule Risk →"

The PM doesn't care about the simulation count. They want to know their schedule confidence.

---

### 5. Reframe the output stat boxes

The four boxes (Planned / P50 / P80 / P95) need plain-English explanations and a direct recommendation:

**Before:**
```
P50            P80            P95
50% confidence  80% confidence  95% confidence
Jun 12          Jul 3           Jul 28
+18 days from planned  ...
```

**After:**
```
Planned Finish   Best Estimate   Safe to Quote   Conservative
  May 25          Jun 12          Jul 3           Jul 28
  Baseline        50/50 chance    Recommended     Penalty contracts
                  of hitting this  4 of 5 scenarios  19 of 20 scenarios
```

Add a one-line recommendation banner below the boxes:

```
💡 Recommend quoting clients Jul 3 — you have an 80% chance of on-time delivery.
   The current schedule (May 25) has only a 50/50 shot.
```

This converts a technical output into a decision. A PM reads it and knows exactly what to do.

---

### 6. Rename "Completion Distribution" chart

**Before:** "Completion Distribution" (histogram of simulation counts)
**After:** "When could this project actually finish?" with a note:
- "Each bar = how many of our 10,000 scenarios landed on that week"
- Rename tooltip: "Simulations" → "Scenarios finishing this week"

---

## What NOT to change

- Keep the Advanced mode exactly as-is. It's for the CTO/CEO demo — raw PERT inputs, distribution selector, full numbers.
- Keep the Tornado chart. Rename "Sensitivity Analysis" → "Which tasks drive the most risk?" for the simple view, but keep the same chart.
- Keep the CRITICAL badge — it's already a strong signal.

---

## Implementation Scope

Changes are isolated to the Simple mode rendering path inside `UncertaintySliders.tsx`, the `RiskSummary.tsx` stat boxes, and one small rename in `CompletionDistribution.tsx`. The backend, simulation engine, and Advanced mode are untouched.

**Files to change:**
- `frontend/src/components/risk/UncertaintySliders.tsx` — Simple mode card, confidence selector, collapsed non-critical section
- `frontend/src/components/risk/RiskSummary.tsx` — Rename labels, add recommendation banner
- `frontend/src/components/risk/CompletionDistribution.tsx` — Rename title + tooltip

**Files NOT touched:** Backend, `TornadoChart.tsx`, Advanced mode, page layout.

---

## Visual Priority Order

1. **Confidence selector** replaces sliders — biggest UX win, least code
2. **Critical tasks first / collapse non-critical** — removes scroll fatigue
3. **Recommendation banner** in results — turns stats into a decision
4. **Risk hints** under task names — gives construction context
5. **Button + chart renames** — polish, fast to do
