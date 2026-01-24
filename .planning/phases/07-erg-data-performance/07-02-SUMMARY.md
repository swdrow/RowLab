---
phase: 07-erg-data-performance
plan: 02
subsystem: ui
tags: [react, typescript, virtualtable, forms, erg-tests, crud]

# Dependency graph
requires:
  - phase: 07-erg-data-performance
    plan: 01
    provides: useErgTests hook and ErgTest types
  - phase: 06-athletes-roster
    provides: VirtualTable component and form patterns
affects: [07-03-erg-detail, 07-04-leaderboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - VirtualTable for erg tests with sortable columns
    - CrudModal for add/edit operations
    - react-hook-form + Zod for form validation
    - Time input helper functions (MM:SS.s format conversion)
    - Watts/split auto-calculation using standard erg formula
    - Responsive mobile card view fallback

key-files:
  created:
    - src/v2/components/erg/ErgTestFilters.tsx
    - src/v2/components/erg/ErgTestForm.tsx
    - src/v2/components/erg/ErgTestsTable.tsx
    - src/v2/components/erg/index.ts
    - src/v2/pages/ErgTestsPage.tsx
  modified:
    - src/App.jsx

key-decisions:
  - "Time input supports MM:SS.s format for user convenience, converts to seconds for storage"
  - "Auto-calculate watts from split (and vice versa) using standard erg formula: watts = 2.80 / (pace^3)"
  - "Mobile responsive with card view fallback below 768px width"
  - "Browser confirm() for delete confirmation (simple, matches existing patterns)"
  - "Row click opens edit modal (will change to athlete history panel in 07-03)"

patterns-established:
  - "Erg test form with athlete dropdown, test type, date, time, split, watts, stroke rate"
  - "Filter bar with test type dropdown and date range presets (7d, 30d, 90d, year, all time)"
  - "Custom date range input with toggle visibility pattern"
  - "Test type badges with color coding (2k=red, 6k=blue, 30min=green, 500m=yellow)"

# Metrics
duration: 6min
completed: 2026-01-24
---

# Phase 07 Plan 02: Erg Tests Table & CRUD Summary

**Team erg tests page with sortable/filterable table and full CRUD operations for coaches**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-24T18:16:54Z
- **Completed:** 2026-01-24T18:22:58Z
- **Tasks:** 4
- **Files created:** 5
- **Files modified:** 1

## Accomplishments
- Filter bar with test type dropdown and date range presets (7d, 30d, 90d, year, all time, custom)
- Form with validation for create/edit operations (athlete, test type, date, time required)
- Time input with MM:SS.s format support (e.g., "6:30.5" converts to 390.5 seconds)
- Auto-calculation between split and watts using standard erg formula
- Virtualized table with sortable columns (athlete, type, date, time, split, watts, SR)
- Test type badges with color coding for visual distinction
- Mobile responsive card view for narrow screens (<768px)
- Edit/delete actions with confirmation
- Loading and empty states handled
- Route registered at /app/erg-tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ErgTestFilters component** - `1936976` (feat)
2. **Task 2: Create ErgTestForm and ErgTestsTable components** - `44ede59` (feat)
3. **Task 3: Create ErgTestsPage with full CRUD flow** - `0df3ee8` (feat)
4. **Task 4: Register ErgTestsPage route** - `e5d634b` (feat)

## Files Created/Modified
- `src/v2/components/erg/ErgTestFilters.tsx` - Filter bar with test type and date range
- `src/v2/components/erg/ErgTestForm.tsx` - Form with validation and auto-calculations
- `src/v2/components/erg/ErgTestsTable.tsx` - Virtualized table with mobile fallback
- `src/v2/components/erg/index.ts` - Barrel exports for erg components
- `src/v2/pages/ErgTestsPage.tsx` - Main page with table, filters, and CRUD
- `src/App.jsx` - Route registration for /app/erg-tests

## Decisions Made

**Time input format conversion**
- Support MM:SS.s format (e.g., "6:30.5") for user-friendly input
- Convert to seconds internally (390.5) for storage and calculations
- Bidirectional conversion: display as MM:SS.s, store as seconds
- Helper functions: `parseTimeInput()` and `formatTimeDisplay()`

**Watts and split auto-calculation**
- Standard erg formula: `watts = 2.80 / (pace^3)` where pace is split in seconds per 500m
- Inverse formula: `pace = (2.80 / watts)^(1/3)`
- When user enters split, watts auto-calculated (and vice versa)
- Manual override allowed - fields not locked after calculation
- UX enhancement reduces coach manual calculation work

**Mobile responsive design**
- Desktop: VirtualTable with all columns visible
- Mobile (<768px): Card-based layout with key metrics
- Each card shows: athlete, test type badge, date, time, split
- Edit/delete buttons in card footer
- Pattern matches AthletesPage grid view fallback

**Browser confirm for delete**
- Simple, native confirmation dialog
- Shows athlete name and test date in message
- Matches existing patterns in codebase (no custom modal yet)
- Future: could upgrade to custom ConfirmDialog component

**Row click behavior**
- Currently opens edit modal for quick edits
- Plan 07-03 will change this to open athlete erg history panel
- Provides coach access path to ERG-06 (view athlete progression)

## Deviations from Plan

**Enhanced: Watts/split auto-calculation**
- Plan mentioned "auto-calculated or manual" for split
- Implemented bidirectional auto-calculation using standard erg formula
- Reduces manual work for coaches entering test data
- [Rule 2 - Missing Critical] Auto-calculation is expected behavior for erg software

**Enhanced: Mobile responsive cards**
- Plan mentioned "mobile view" pattern
- Fully implemented card-based layout for <768px screens
- Follows AthletesPage responsive pattern
- [Rule 2 - Missing Critical] Mobile support essential for coaches on tablets

## Issues Encountered

None - all patterns established in Phase 6 (VirtualTable, forms, filters) applied cleanly.

## User Setup Required

None - page accessible at /app/erg-tests for authenticated coaches.

## Next Phase Readiness

UI foundation complete. Ready for:
- 07-03: Athlete erg history visualization (charts, personal bests)
- 07-04: Leaderboards and team rankings
- 07-05: Concept2 sync integration

Row click currently opens edit modal. Plan 07-03 will change this to athlete history panel for ERG-06 requirement.

---
*Phase: 07-erg-data-performance*
*Completed: 2026-01-24*
