---
phase: 03-vertical-slice
plan: 04
subsystem: data-layer
tags: [tanstack-query, react-hooks, typescript, axios, dashboard]

# Dependency graph
requires:
  - phase: 03-01
    provides: QueryClient singleton with TanStack Query v5
  - phase: 03-02
    provides: Dashboard preferences API endpoints
  - phase: 03-03
    provides: Unified activity feed API with deduplication

provides:
  - useDashboardPrefs hook with mutations and helpers
  - useActivityFeed hook with pagination and source filtering
  - Dashboard TypeScript types matching backend schema
  - Formatting helpers for activity display

affects: [03-05, dashboard-ui, activity-widgets, personal-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Stable queryKey using primitive values (prevents refetch loops)"
    - "Optimistic cache updates via queryClient.setQueryData"
    - "Helper functions exported alongside hooks for view logic"
    - "API response wrapper type for consistent error handling"

key-files:
  created:
    - src/v2/types/dashboard.ts
    - src/v2/hooks/useDashboardPrefs.ts
    - src/v2/hooks/useActivityFeed.ts
  modified: []

key-decisions:
  - "Sort excludeSources array for stable queryKey"
  - "Export formatting helpers from hooks (not separate utils)"
  - "10min staleTime for preferences vs 5min for activities"

patterns-established:
  - "Pattern: Stable queryKey using primitive values - Sort arrays before stringifying to prevent refetch on equivalent data"
  - "Pattern: Helper methods on hook return - setPinnedModules and toggleSourceVisibility encapsulate common mutations"
  - "Pattern: Formatting helpers colocated with hooks - getActivityTypeName, formatDuration, formatDistance exported from useActivityFeed"

# Metrics
duration: 8min
completed: 2026-01-23
---

# Phase 03 Plan 04: Create TanStack Query Hooks

**TanStack Query hooks with stable caching, optimistic updates, and colocated formatting helpers for dashboard preferences and activity feed**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-23T16:40:05Z
- **Completed:** 2026-01-23T16:47:59Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- TypeScript types matching backend API response shapes
- useDashboardPrefs hook with mutations and cache optimization
- useActivityFeed hook with pagination and stable queryKey pattern
- Formatting helpers for activity display (type names, duration, distance)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard TypeScript types** - `e84e6ae` (feat)
2. **Task 2: Create useDashboardPrefs hook** - `18a508b` (feat)
3. **Task 3: Create useActivityFeed hook** - `1243717` (feat)

## Files Created/Modified
- `src/v2/types/dashboard.ts` - TypeScript interfaces for Activity, DashboardPreferences, and API responses
- `src/v2/hooks/useDashboardPrefs.ts` - Hook for fetching/updating preferences with helper methods
- `src/v2/hooks/useActivityFeed.ts` - Hook for fetching activities with pagination plus formatting helpers

## Decisions Made

**Sort excludeSources for stable queryKey**
- Prevents refetch when same sources in different order
- Pattern: `excludeSources.sort().join(',')`

**Export formatting helpers from hooks**
- Colocate view logic with data fetching
- getActivityTypeName, formatDuration, formatDistance exported from useActivityFeed
- Alternative would be separate utils file, but these are tightly coupled to activity data

**Different staleTimes for preferences vs activities**
- Preferences: 10min (change infrequently, user-initiated)
- Activities: 5min (synced from external sources, may update more often)

**Helper methods on hook return object**
- setPinnedModules and toggleSourceVisibility encapsulate mutation logic
- Avoids exposing mutation internals to components
- Makes common operations one-liners in components

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript types matched backend schema, hooks compiled without errors, build passed.

## Next Phase Readiness

Data layer complete. Ready for dashboard UI components:
- useDashboardPrefs provides preferences with mutations
- useActivityFeed provides paginated activities
- Formatting helpers available for widgets
- Types ensure type safety between frontend and backend

Next: Plan 03-05 will consume these hooks to build dashboard widgets.

---
*Phase: 03-vertical-slice*
*Completed: 2026-01-23*
