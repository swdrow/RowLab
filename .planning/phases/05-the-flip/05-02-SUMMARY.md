---
phase: 05-the-flip
plan: 02
subsystem: routing
tags: [react-router, route-migration, v2-promotion]

# Dependency graph
requires:
  - phase: 05-01
    provides: User preference store and version redirect utilities
provides:
  - V2 routes promoted from /beta to /app (default authenticated entry point)
  - V1 routes preserved at /legacy with all internal links updated
  - Backward compatibility via /beta/* redirect to /app
  - Production-ready V2 header (removed BETA badge)
affects: [05-03, user-onboarding, navigation]

# Tech tracking
tech-stack:
  added: []
  patterns: [route-migration-strategy, legacy-url-preservation]

key-files:
  created: []
  modified:
    - src/App.jsx
    - src/pages/AthleteDashboard.jsx
    - src/v2/layouts/V2Layout.tsx

key-decisions:
  - "V2 at /app becomes default authenticated experience"
  - "/beta/* redirects to /app for bookmark compatibility"
  - "V1 preserved at /legacy with internal links updated"
  - "LandingPage links to /app intentionally (drives users to V2)"

patterns-established:
  - "Legacy route migration: preserve functionality under /legacy prefix"
  - "Bookmark compatibility: redirect old URLs to new canonical paths"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 5 Plan 2: Route Flip Summary

**V2 promoted to /app as default authenticated experience, V1 preserved at /legacy with full backward compatibility**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T23:43:37Z
- **Completed:** 2026-01-23T23:46:45Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- V2 routes migrated from /beta to /app (ShellLayout, MeDashboard, Coach pages)
- V1 routes moved from /app to /legacy (all 15 V1 pages preserved)
- Updated 4 internal navigation links in AthleteDashboard.jsx to use /legacy prefix
- Removed BETA badge from V2Layout header
- Added /beta/* redirect to /app for bookmark compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Reorganize routes in App.jsx** - `c16f7f8` (feat)
2. **Task 2: Update hardcoded /app links to /legacy** - `1215b7d` (fix)
3. **Task 3: Update V2Layout header for production** - `93e065a` (feat)

## Files Created/Modified
- `src/App.jsx` - Route configuration: V2 at /app, V1 at /legacy, /beta redirect
- `src/pages/AthleteDashboard.jsx` - Updated internal navigation links to /legacy prefix
- `src/v2/layouts/V2Layout.tsx` - Removed BETA badge, changed title to "RowLab"

## Decisions Made

**V2 at /app as default authenticated experience**
- Rationale: V2 is production-ready and should be the primary user entry point after login
- Impact: New users and returning users see V2 by default at /app

**Preserve V1 at /legacy with full functionality**
- Rationale: Users may need V1 features not yet migrated to V2
- Impact: All V1 pages accessible at /legacy/* with updated internal links

**LandingPage links remain pointing to /app**
- Rationale: Landing page should drive users to V2 (the new default)
- Impact: "Get Started" CTAs lead to V2 experience, not legacy

**/beta/* redirect to /app for bookmark compatibility**
- Rationale: Existing bookmarks to /beta/* from Phase 4 testing should not break
- Impact: Users with old /beta URLs automatically redirected to /app

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**External modification to V2Layout.tsx during execution**
- System reminder indicated V2Layout.tsx was modified to add VersionRedirectGuard component
- This appears to be from plan 05-03 or auto-save/linter
- Not a deviation from 05-02 plan (plan only called for BETA badge removal and title change)
- Noted for completeness but does not affect 05-02 deliverables

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 05-03: V1 Integration**
- V2 is now at /app (default)
- V1 is preserved at /legacy
- VersionToggle component can now enable switching between /app (V2) and /legacy (V1)
- Legacy banner can be added to V1 pages to communicate deprecation

**No blockers or concerns.**

---
*Phase: 05-the-flip*
*Completed: 2026-01-23*
