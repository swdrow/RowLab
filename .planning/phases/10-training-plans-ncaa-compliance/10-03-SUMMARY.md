---
phase: 10-training-plans-ncaa-compliance
plan: 03
subsystem: ui
tags: [react-big-calendar, date-fns, training, calendar, framer-motion]

# Dependency graph
requires:
  - phase: 10-01
    provides: CalendarEvent type, calendarHelpers utilities, useCalendarEvents hook
provides:
  - TrainingCalendar component with month/week views
  - CalendarToolbar component with navigation and view switching
  - WorkoutEventCard component with type-based color coding
  - Index exports for calendar module
affects: [10-04, 10-05, training-plan-wizard, workout-creation]

# Tech tracking
tech-stack:
  added: []
  patterns: [react-big-calendar integration, date-fns localizer, CSS-in-JS styling with V2 tokens]

key-files:
  created:
    - src/v2/components/training/calendar/WorkoutEventCard.tsx
    - src/v2/components/training/calendar/CalendarToolbar.tsx
    - src/v2/components/training/calendar/TrainingCalendar.tsx
    - src/v2/components/training/calendar/index.ts
  modified: []

key-decisions:
  - "Monday week start for calendar (weekStartsOn: 1)"
  - "Custom toolbar and event components for V2 design integration"
  - "CSS-in-JS for calendar styling to integrate V2 design tokens"
  - "Loading spinner overlay for async event fetching"
  - "Error fallback for failed calendar event loading"

patterns-established:
  - "react-big-calendar integration pattern with date-fns localizer"
  - "Custom toolbar component pattern for calendar navigation"
  - "Custom event rendering with type-based color coding"
  - "CSS variables for theme integration (--surface-*, --txt-*, --bdr-*)"

# Metrics
duration: 6min
completed: 2026-01-25
---

# Phase 10 Plan 03: Training Calendar UI

**React-big-calendar integration with month/week views, custom toolbar navigation, and type-based workout event rendering using V2 design tokens**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-25T02:57:08Z
- **Completed:** 2026-01-25T03:02:36Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Training calendar with month and week views using react-big-calendar
- Custom toolbar with Today button, prev/next navigation, and view switcher
- Custom event cards displaying workout name, TSS, and recurring icons
- Full V2 design token integration with dark theme support
- Event selection and slot selection callback support

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkoutEventCard component** - `f2748eb` (feat)
2. **Task 2: Create CalendarToolbar component** - `f571c3e` (feat)
3. **Task 3: Create TrainingCalendar component and index** - `b47ce9d` (feat)

## Files Created/Modified
- `src/v2/components/training/calendar/WorkoutEventCard.tsx` - Custom event component with type-based colors, TSS display, and recurring icon
- `src/v2/components/training/calendar/CalendarToolbar.tsx` - Custom toolbar with Today/prev/next navigation and month/week view switcher
- `src/v2/components/training/calendar/TrainingCalendar.tsx` - Main calendar component with react-big-calendar, date-fns localizer, and V2 styling
- `src/v2/components/training/calendar/index.ts` - Module exports for calendar components

## Decisions Made
- **Monday week start:** Used `weekStartsOn: 1` in localizer to start weeks on Monday (typical for rowing programs)
- **Custom components over defaults:** Built custom toolbar and event components to match V2 design system instead of using react-big-calendar defaults
- **CSS-in-JS for styling:** Used styled-jsx global styles to override react-big-calendar CSS with V2 design tokens
- **Loading state overlay:** Added spinner overlay instead of inline loading state to preserve calendar layout
- **Error boundary fallback:** Simple error message for failed event loading without breaking page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components integrated smoothly with existing hooks and utilities from 10-01 and 10-02.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Plan 10-04: Drag-drop calendar rescheduling using useRescheduleWorkout
- Plan 10-05: Workout creation modal with onSelectSlot integration
- Plan 10-06: Training plan wizard with calendar preview

**Available:**
- TrainingCalendar component for team-wide calendar view
- CalendarToolbar for custom navigation UI
- WorkoutEventCard for consistent event rendering
- onSelectEvent callback for editing existing workouts
- onSelectSlot callback for creating new workouts

---
*Phase: 10-training-plans-ncaa-compliance*
*Completed: 2026-01-25*
