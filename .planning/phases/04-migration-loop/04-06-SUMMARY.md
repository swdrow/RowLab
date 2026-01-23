---
phase: 04-migration-loop
plan: 06
subsystem: frontend-data-layer
tags: [tanstack-query, react-hooks, availability, axios, typescript]

# Dependency graph
requires:
  - phase: 04-04
    provides: Availability REST API endpoints
  - phase: 03-01
    provides: TanStack Query setup and configuration
provides:
  - useTeamAvailability hook for team-wide availability grid
  - useAthleteAvailability hook for single athlete availability
  - useUpdateAvailability mutation for editing availability
  - Date formatting utilities for stable query keys
affects: [05-coach-dashboard, coach-availability-ui, practice-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns: [query-key-date-formatting, dual-invalidation-pattern]

key-files:
  created:
    - src/v2/hooks/useAvailability.ts
  modified: []

key-decisions:
  - "formatDate helper ensures stable query keys by removing time component"
  - "useAthleteAvailability disabled when no athleteId via enabled flag"
  - "Update mutation invalidates both team and athlete queries for consistency"
  - "5-minute staleTime matches Phase 3 external API pattern"

patterns-established:
  - "Date normalization: toISOString().split('T')[0] for query key stability"
  - "Dual invalidation: mutations refresh both aggregate (team) and detail (athlete) views"

# Metrics
duration: 5min
completed: 2026-01-23
---

# Phase 04 Plan 06: Availability Hooks Summary

**TanStack Query hooks for team/athlete availability with dual-invalidation pattern ensuring UI consistency**

## Performance

- **Duration:** 5 minutes
- **Started:** 2026-01-23T19:24:25Z
- **Completed:** 2026-01-23T19:29:37Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- useTeamAvailability fetches team-wide grid with date range filtering
- useAthleteAvailability fetches single athlete with conditional enabling
- useUpdateAvailability mutation with automatic cache invalidation
- Date formatting ensures stable query keys preventing unnecessary refetches

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAvailability hooks** - `b402d10` (feat)

## Files Created/Modified
- `src/v2/hooks/useAvailability.ts` - Three availability hooks using TanStack Query

## Decisions Made

**1. Date formatting for stable query keys**
- Used `formatDate(date)` helper that extracts just date portion (YYYY-MM-DD)
- Prevents query key changes from time component differences
- Ensures cache hits for same date regardless of time

**2. Conditional query enabling for athlete hook**
- `enabled: !!athleteId` prevents request when athleteId undefined
- Common pattern for dependent queries (e.g., list → detail)
- Avoids 400 errors on initial render before selection

**3. Dual invalidation on mutation**
- Invalidates both `['availability', 'team']` and `['availability', 'athlete', athleteId]`
- Ensures team grid refreshes when athlete updates their availability
- Maintains UI consistency across aggregate and detail views

**4. 5-minute staleTime**
- Matches Phase 3 pattern for external API queries
- Availability changes infrequently during typical session
- Reduces server load while maintaining reasonable freshness

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward hook implementation using established patterns from Phase 3.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Blockers:** None

**Concerns:** None - hooks ready for UI component integration

**Dependencies Met:**
- ✓ Availability API endpoints from 04-04 (team, athlete, update)
- ✓ TanStack Query setup from 03-01 (QueryClient, providers)
- ✓ ApiResponse types from dashboard.ts
- ✓ Availability types from coach.ts (created in prior plan)

**Provides for Future:**
- Data layer for coach availability dashboard widgets
- Data layer for athlete self-service availability editing
- Ready for practice scheduling integration (availability overlay)

---
*Phase: 04-migration-loop*
*Completed: 2026-01-23*
