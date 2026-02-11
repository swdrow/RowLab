---
phase: 37-warm-copper-design-sweep
plan: 04
subsystem: ui
tags: [canvas, design-tokens, tailwind, css]

# Dependency graph
requires:
  - phase: 37-warm-copper-design-sweep
    provides: Canvas design system components and tokens
provides:
  - Unified border tokens across all Canvas pages
  - Consistent border-white/[0.06] usage
affects: [37-warm-copper-design-sweep]

# Tech tracking
tech-stack:
  added: []
  patterns: [Canvas border token consistency]

key-files:
  created: []
  modified:
    - src/v2/pages/canvas/CanvasLineupBuilderPage.tsx
    - src/v2/pages/canvas/CanvasSeatRacingPage.tsx
    - src/v2/pages/canvas/CanvasErgTestsPage.tsx
    - src/v2/pages/canvas/CanvasRecruitingPage.tsx
    - src/v2/pages/canvas/CanvasAthletesPage.tsx

key-decisions:
  - "Replace border-ink-border with border-white/[0.06] for Canvas consistency"
  - "No rounded corners on panel containers (Canvas = sharp corners)"
  - "CanvasAttendancePage already correct, no changes needed"

patterns-established:
  - "Canvas border standard: border-white/[0.06] (not border-ink-border)"
  - "Canvas pages use sharp corners (no rounded-xl/rounded-lg on panels)"

# Metrics
duration: 5min
completed: 2026-02-11
---

# Phase 37.1 Plan 04: Canvas Pages Token Consistency Summary

**Unified Canvas page borders from border-ink-border to border-white/[0.06] across 5 pages for design token consistency**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-11T22:35:06Z
- **Completed:** 2026-02-11T22:35:06Z
- **Tasks:** 1 (single task plan)
- **Files modified:** 5

## Accomplishments
- Replaced all border-ink-border tokens with border-white/[0.06] in Canvas pages
- Updated CanvasLineupBuilderPage, CanvasSeatRacingPage, CanvasErgTestsPage, CanvasRecruitingPage, and CanvasAthletesPage
- Verified CanvasAttendancePage, CanvasSettingsPage, and CanvasRankingsPage already using correct tokens
- Confirmed no rounded-xl or rounded-lg issues (Canvas follows sharp corner standard)

## Task Commits

1. **Task 1: Canvas border token unification** - `b3ba35b` (style)

## Files Created/Modified
- `src/v2/pages/canvas/CanvasLineupBuilderPage.tsx` - Updated 3 border instances
- `src/v2/pages/canvas/CanvasSeatRacingPage.tsx` - Updated 9 border instances
- `src/v2/pages/canvas/CanvasErgTestsPage.tsx` - Updated 4 border instances
- `src/v2/pages/canvas/CanvasRecruitingPage.tsx` - Updated 2 border instances
- `src/v2/pages/canvas/CanvasAthletesPage.tsx` - Updated 10 border instances

## Decisions Made
- **Token migration:** Replaced all `border-ink-border` with `border-white/[0.06]` per Canvas standard
- **No changes for 3 pages:** CanvasAttendancePage already using correct tokens (border-white/[0.04]), CanvasSettingsPage and CanvasRankingsPage have no borders
- **No rounded corner issues found:** Canvas pages already follow sharp corner standard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward token replacement across Canvas pages.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All Canvas pages now use consistent border tokens. Ready for:
- Additional Canvas page migrations
- Canvas component consistency audits
- Phase 37.1 completion and wrap-up

---
*Phase: 37-warm-copper-design-sweep*
*Completed: 2026-02-11*

## Self-Check: PASSED

All commits and files verified:
- Commit b3ba35b exists
- All 5 modified Canvas pages exist
