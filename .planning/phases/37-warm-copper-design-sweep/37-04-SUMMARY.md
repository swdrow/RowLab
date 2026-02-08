---
phase: 37-warm-copper-design-sweep
plan: 04
subsystem: ui-design
tags: [design-system, copper, builder-pages, seat-racing]
requires: [37-01, 37-02, 37-03]
provides: [copper-builder-toolbars, copper-seat-racing]
affects: []
tech-stack:
  added: []
  patterns: [compact-workspace-toolbar, copper-editorial-hero]
key-files:
  created: []
  modified:
    - src/v2/pages/SeatRacingPage.tsx
decisions:
  - decision: LineupBuilder and MatrixPlanner get compact copper toolbars instead of full heroes
    rationale: Full-screen workspaces need maximum vertical space; compact toolbar preserves workspace area while providing copper branding
    impact: Establishes pattern for future workspace pages
  - decision: SeatRacingPage gets full copper editorial treatment
    rationale: Standard data/analytics page (not workspace), benefits from full hero header with context
    impact: Consistent with other data pages like Regattas and Rankings
metrics:
  duration: 480
  completed: 2026-02-08
---

# Phase 37 Plan 04: Builder Pages Copper Design Summary

Workspace pages get compact copper toolbars; SeatRacing gets full editorial treatment

## What Was Built

Applied warm copper editorial design to 3 Builder pages with different patterns based on page type:

**Compact workspace treatment (LineupBuilder, MatrixPlanner):**
- Thin copper-accented toolbar at top
- Category label in copper uppercase tracking
- Copper gradient divider line
- Maximum workspace area preserved

**Full editorial treatment (SeatRacing):**
- Copper hero header with category/title/subtitle
- Copper gradient primary buttons
- Copper tab underlines
- Linear-inspired clean table design
- Copper section headers with dots
- Glass morphism on cards

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 69522d4* | LineupBuilder + MatrixPlanner compact copper toolbars (already complete from 37-03) |
| 2 | f0edf02 | SeatRacingPage full copper editorial redesign |

*Task 1 was already completed in plan 37-03

## Implementation Details

### Task 1: LineupBuilderPage + MatrixPlannerPage

**Status:** Already complete from plan 37-03 (commit 69522d4)

Both workspace pages received compact copper toolbar treatment:
- `LineupBuilderPage.tsx`: Minimal 52-line wrapper with copper toolbar
- `MatrixPlannerPage.tsx`: 94-line page with copper toolbar + benefits section
- Toolbar pattern: thin bar, copper gradient accent, workspace label, preserved vertical space
- Benefit cards updated with visible borders (`border-ink-border`)

### Task 2: SeatRacingPage (606 lines)

Full copper editorial redesign applied to complex seat racing page:

**Hero header:**
- Category: "ATHLETE EVALUATION" in copper uppercase
- Title: "Seat Racing" in `font-display`
- Subtitle: "Compare athletes with data-driven rankings"
- Copper gradient background wash and divider line

**Tabs:**
- Active tab: `border-accent-copper text-ink-bright`
- Inactive tab: `border-transparent text-ink-secondary hover:text-ink-bright`

**Buttons:**
- Primary: copper gradient with glow (`shadow-glow-copper`)
- Secondary: `border-ink-border` with copper hover
- "All" filter: copper gradient when active

**Section headers:**
- Copper dots + uppercase label + gradient divider
- "Advanced Analytics" section with 4 feature cards

**Cards & panels:**
- All cards: `border-ink-border` (visible borders)
- FeatureCard: copper hover states, copper icon backgrounds
- Modal panels: `bg-ink-surface border-ink-border`
- Slide-out panels: `bg-ink-surface border-l border-ink-border`

**Replaced tokens:**
- `bg-bg-*` → `bg-ink-*`
- `txt-*` → `ink-*`
- `bdr-*` → `ink-border`
- `interactive-primary` → `accent-copper` gradient
- `shadow-glow-blue` → `shadow-glow-copper`

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Workspace vs Data page patterns established:**
   - Workspaces (LineupBuilder, MatrixPlanner): compact copper toolbar
   - Data pages (SeatRacing, Regattas, Rankings): full copper hero
   - This pattern will guide all future page redesigns

2. **Section header consistency:**
   - Copper dot + uppercase label + gradient divider
   - Applied to "Advanced Analytics" section in SeatRacing
   - Already used in Benefits section of MatrixPlanner

3. **Filter button treatment:**
   - Active "All" filter: copper gradient (matches primary actions)
   - Port/Starboard filters: keep data-poor/data-excellent colors (domain-specific)
   - Secondary filters: `border-ink-border` with colored hover states

## Verification

✅ All files updated with copper design tokens
✅ No blue remnants (`accent-primary`, `shadow-glow-blue`, `bg-blue-`, `border-blue-`)
✅ No invisible borders (`from-white/`, `to-white/`)
✅ `font-display` used in hero titles
✅ Visible card borders throughout (`border-ink-border`)
✅ Copper gradients on primary actions
✅ TypeScript validation: Pre-existing errors unrelated to changes

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Ready for:** Plan 37-05 (remaining pages in Phase 37)

## Self-Check: PASSED

All modified files exist and committed:
- ✅ src/v2/pages/SeatRacingPage.tsx (f0edf02)
- ✅ src/v2/pages/LineupBuilderPage.tsx (69522d4, from 37-03)
- ✅ src/v2/pages/MatrixPlannerPage.tsx (69522d4, from 37-03)
