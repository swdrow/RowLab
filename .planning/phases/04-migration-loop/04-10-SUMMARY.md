---
phase: 04-migration-loop
plan: 10
subsystem: ui
tags: [react, typescript, zustand, react-query, coach-features]

# Dependency graph
requires:
  - phase: 04-07
    provides: Whiteboard UI components (WhiteboardView, WhiteboardEditor)
  - phase: 04-08
    provides: Fleet management UI (ShellsTable, OarsTable, forms)
  - phase: 04-09
    provides: Availability UI components (AvailabilityGrid, AvailabilityEditor)
  - phase: 04-05
    provides: Data hooks (useWhiteboard, useShells, useOarSets)
  - phase: 04-06
    provides: Availability data hooks (useTeamAvailability, useUpdateAvailability)

provides:
  - CoachWhiteboard page at /beta/coach/whiteboard
  - CoachFleet page at /beta/coach/fleet
  - CoachAvailability page at /beta/coach/availability
  - Route configuration in App.jsx for coach context
  - Page-level state management for modals and editing

affects: [coach-dashboard, navigation, phase-05-flip]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Page-level modal state management pattern
    - Auth-based permission derivation (canEdit from COACH/OWNER roles)
    - Week navigation pattern for date-ranged views
    - Tab interface pattern for related datasets (shells/oars)

key-files:
  created:
    - src/v2/pages/CoachWhiteboard.tsx
    - src/v2/pages/CoachFleet.tsx
    - src/v2/pages/CoachAvailability.tsx
  modified:
    - src/App.jsx

key-decisions:
  - "Use useV2Auth() directly instead of non-existent useSharedStores wrapper"
  - "Derive canEdit from auth store at page level, pass to components as prop"
  - "Week starts Monday with Sunday adjustment logic for availability"
  - "Permission-based athlete editing: coaches edit any, athletes edit own"

patterns-established:
  - "Page component pattern: derive permissions, manage local state, integrate hooks with UI components"
  - "Modal state pattern: separate state for modal visibility and editing entity"
  - "Tab state pattern: single activeTab state with conditional rendering and data fetching"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 04 Plan 10: Coach Pages Summary

**Three coach pages integrating hooks with UI components: whiteboard with view/edit toggle, fleet with tabbed CRUD modals, and availability with week navigation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T19:58:42Z
- **Completed:** 2026-01-23T20:01:40Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- CoachWhiteboard page with view/edit mode toggle and permission checks
- CoachFleet page with tabbed interface for shells and oars, CRUD modals for both
- CoachAvailability page with week navigation and click-to-edit grid
- All three pages accessible via /beta/coach/* routes with V2Layout navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CoachWhiteboard page** - `fe17d91` (feat)
2. **Task 2: Create CoachFleet page** - `736eedc` (feat)
3. **Task 3: Create CoachAvailability page and add routes** - `9e819be` (feat)

## Files Created/Modified
- `src/v2/pages/CoachWhiteboard.tsx` - Page integrating useWhiteboard with WhiteboardView/WhiteboardEditor, toggles between view and edit mode
- `src/v2/pages/CoachFleet.tsx` - Tabbed page for shells and oars with CRUD modals, integrates useShells and useOarSets hooks
- `src/v2/pages/CoachAvailability.tsx` - Week navigation with AvailabilityGrid and editor modal, permission-based athlete editing
- `src/App.jsx` - Added lazy imports and routes for /beta/coach/whiteboard, /beta/coach/fleet, /beta/coach/availability

## Decisions Made

**1. Use useV2Auth() directly instead of useSharedStores**
- Plan referenced non-existent useSharedStores hook
- Discovered actual pattern from existing code: import { useV2Auth } from '../hooks/useSharedStores'
- Used authStore((state) => state.user) to access user data

**2. Derive canEdit from auth store at page level**
- Pattern: `canEdit = user?.activeTeamRole === 'COACH' || user?.activeTeamRole === 'OWNER'`
- Pass canEdit as prop to UI components (WhiteboardView, ShellsTable, etc.)
- Components don't access auth directly, receive permission flag

**3. Week navigation starts Monday**
- Availability grid uses Monday-start weeks (common in rowing scheduling)
- Sunday adjustment: `diff = today.getDate() - day + (day === 0 ? -6 : 1)`
- "This Week" button resets to current Monday

**4. Permission-based athlete availability editing**
- Coaches can edit any athlete's availability
- Athletes can only edit their own availability
- Check: `isCoach || user?.athleteId === athleteId` before allowing edit

## Deviations from Plan

None - plan executed exactly as written.

Plan referenced `useSharedStores` which doesn't exist, but this is a documentation issue in the plan template, not a runtime deviation. The correct pattern (useV2Auth) was already known from prior phases.

## Issues Encountered

None - all pages built successfully, routes added, build passed without TypeScript errors.

## Next Phase Readiness

Coach context pages complete! Ready for:
- Coach navigation items in WorkspaceSidebar (context switch to "coach" should show these routes)
- Integration with backend API (hooks already configured, just need data)
- Athlete context pages (personal availability view, personal stats)

All coach features from Phase 4 migration loop are now accessible at /beta/coach/* routes.

---
*Phase: 04-migration-loop*
*Completed: 2026-01-23*
