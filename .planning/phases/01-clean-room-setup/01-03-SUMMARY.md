---
phase: 01-clean-room-setup
plan: 03
subsystem: ui
tags: [react, typescript, router, layout, theme]

# Dependency graph
requires:
  - phase: 01-01
    provides: V2 directory structure with @v2 path alias, BetaHome placeholder, v2.css entry point
provides:
  - V2Layout component with .v2 CSS isolation wrapper
  - Theme switching (dark/light/field) with localStorage persistence
  - /beta route integrated into application router
affects: [01-04, 02-foundation, all-v2-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - V2Layout as parent for all V2 routes
    - data-theme attribute for theme switching (omit for dark default)
    - @v2 path alias for all V2 imports

key-files:
  created:
    - src/v2/layouts/V2Layout.tsx
  modified:
    - src/App.jsx

key-decisions:
  - "Theme defaults to dark (no data-theme attribute); light/field use data-theme"
  - "V2Layout wraps all /beta routes for CSS isolation via .v2 class"
  - "Use @v2 path alias for all V2 lazy imports in App.jsx"

patterns-established:
  - "V2 route pattern: lazy import using @v2 alias, V2Layout as parent"
  - "Theme persistence: localStorage key 'v2-theme'"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 1 Plan 03: V2 Entry Point Summary

**V2Layout component with theme switching and /beta routes integrated into application router**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T01:55:55Z
- **Completed:** 2026-01-23T01:57:20Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created V2Layout component with `.v2` class wrapper for CSS isolation
- Implemented three-theme switching (dark/light/field) with localStorage persistence
- Integrated /beta routes into App.jsx using @v2 path alias
- Build verification passed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create V2Layout Component** - `4a545a2` (feat)
2. **Task 2: Add V2 Routes to App.jsx** - `f8fc084` (feat)

## Files Created/Modified
- `src/v2/layouts/V2Layout.tsx` - V2 layout wrapper with theme switching and CSS isolation
- `src/App.jsx` - Added lazy imports for V2Layout/BetaHome and /beta route

## Decisions Made
- Theme defaults to dark (no data-theme attribute rendered); only light/field themes set data-theme
- V2Layout renders as parent element for all /beta routes, providing .v2 class wrapper
- Used same Suspense/LoadingFallback pattern as existing V1 routes for consistency

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- V2 entry point complete, /beta route accessible
- V2Layout provides CSS isolation for all nested V2 components
- Ready for Plan 01-04 (Component Library Bootstrap) or Phase 2 foundation work

---
*Phase: 01-clean-room-setup*
*Completed: 2026-01-23*
