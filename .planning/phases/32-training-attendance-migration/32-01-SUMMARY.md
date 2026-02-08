---
phase: 32-training-attendance-migration
plan: 01
subsystem: ui
tags: [tailwind, css-variables, design-tokens, react-big-calendar, react-hook-form, periodization, training-calendar]

# Dependency graph
requires:
  - phase: 30-erg-data-migration
    provides: V3 token migration pattern (resolveVar helper, runtime CSS property resolution)
  - phase: 24-foundation-design-system
    provides: V3 design token system (tokens.css, Tailwind config)
provides:
  - 11 training components migrated to V3 warm design tokens
  - Calendar CSS overrides using V3 CSS custom properties
  - Runtime V3 color resolution for workout type and periodization phase colors
  - font-mono on all numeric displays across training UI
affects: [32-03-calendar-enhancements, 32-04-attendance-ux, 32-05-cross-cutting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "resolveVar() helper for runtime CSS custom property resolution with SSR fallback"
    - "V3 token mapping: accent-* -> interactive-*/data-* semantic tokens"
    - "Calendar CSS overrides using var(--color-*) references to tokens.css"

key-files:
  created: []
  modified:
    - src/v2/components/training/calendar/TrainingCalendar.tsx
    - src/v2/components/training/calendar/CalendarToolbar.tsx
    - src/v2/components/training/calendar/WorkoutEventCard.tsx
    - src/v2/components/training/calendar/DragDropCalendar.tsx
    - src/v2/styles/calendar-overrides.css
    - src/v2/utils/calendarHelpers.ts
    - src/v2/components/training/workouts/WorkoutForm.tsx
    - src/v2/components/training/workouts/ExerciseFieldArray.tsx
    - src/v2/components/training/periodization/PeriodizationTimeline.tsx
    - src/v2/components/training/periodization/BlockForm.tsx
    - src/v2/components/training/periodization/TemplateApplicator.tsx

key-decisions:
  - "CalendarEmptyState.tsx already clean - delegates to shared EmptyState component, no changes needed"
  - "Periodization phase colors mapped to V3 semantic tokens: base=data-good, build=data-warning, peak=data-poor, taper=data-excellent"
  - "Workout type colors mapped to V3 semantic tokens: erg=data-poor, row=data-good, cross_train=data-excellent, strength=data-warning, recovery=chart-2"
  - "Legacy accent-* tokens (not in Tailwind config) mapped by studying Phase 30 migrated components"

patterns-established:
  - "accent-primary -> interactive-primary for action/focus colors"
  - "accent-destructive -> data-poor for error/danger colors"
  - "accent-warning -> data-warning for warning indicators"
  - "accent-success -> data-excellent for success indicators"
  - "bg-surface-default -> bg-bg-surface, bg-surface-elevated -> bg-bg-surface-elevated"

# Metrics
duration: 13min
completed: 2026-02-08
---

# Phase 32 Plan 01: V3 Design Token Migration for Calendar, Workout, and Periodization Components Summary

**11 training components migrated to V3 warm design tokens with zero hardcoded colors, runtime CSS variable resolution for periodization/workout type colors, and font-mono on all numeric displays**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-08T14:41:02Z
- **Completed:** 2026-02-08T14:54:18Z
- **Tasks:** 2/2
- **Files modified:** 11

## Accomplishments
- Migrated all 6 calendar components + CSS overrides to V3 tokens (TrainingCalendar, CalendarToolbar, WorkoutEventCard, DragDropCalendar, CalendarEmptyState, calendar-overrides.css)
- Migrated all 5 workout and periodization form components to V3 tokens (WorkoutForm, ExerciseFieldArray, PeriodizationTimeline, BlockForm, TemplateApplicator)
- Rewrote calendarHelpers.ts color functions to resolve V3 CSS custom properties at runtime with SSR-safe fallbacks
- Added font-mono to all numeric displays (TSS values, durations, week counts, sets/reps, pace targets)
- Replaced all legacy `<style jsx global>` blocks in calendar components with V3 CSS variable references

## Task Commits

Each task was committed atomically:

1. **Task 1: V3 design token migration for calendar components + CSS overrides** - `46a6b12` (style)
2. **Task 2: V3 design token migration for workout and periodization components** - `4058bc7` (style)

## Files Created/Modified
- `src/v2/components/training/calendar/TrainingCalendar.tsx` - Loading overlay + full CSS-in-JS block migrated to V3 CSS vars
- `src/v2/components/training/calendar/CalendarToolbar.tsx` - Toolbar surface/button colors migrated to V3 tokens
- `src/v2/components/training/calendar/WorkoutEventCard.tsx` - Added font-mono to TSS display
- `src/v2/components/training/calendar/DragDropCalendar.tsx` - Loading overlay + dragging indicator + full CSS-in-JS block migrated to V3 CSS vars
- `src/v2/styles/calendar-overrides.css` - Replaced accent-primary with interactive-primary CSS vars
- `src/v2/utils/calendarHelpers.ts` - Added resolveVar() helper, rewrote getWorkoutTypeColor() and getPeriodizationColor() to use V3 tokens
- `src/v2/components/training/workouts/WorkoutForm.tsx` - Form fields, error states, submit button, TSS display all migrated to V3 tokens + font-mono
- `src/v2/components/training/workouts/ExerciseFieldArray.tsx` - Exercise cards, numeric inputs, action buttons migrated to V3 tokens + font-mono
- `src/v2/components/training/periodization/PeriodizationTimeline.tsx` - Timeline blocks, today indicator, add button migrated to V3 tokens + font-mono
- `src/v2/components/training/periodization/BlockForm.tsx` - Phase radio buttons, duration indicator, focus areas, submit button migrated to V3 tokens + font-mono
- `src/v2/components/training/periodization/TemplateApplicator.tsx` - Template selector, conflict warnings, checkbox, submit button migrated to V3 tokens

## Decisions Made
- CalendarEmptyState.tsx was already clean (delegates to shared EmptyState component) - no modifications needed
- Mapped legacy accent-* tokens not defined in Tailwind config to V3 equivalents by studying Phase 30 migrated erg components
- Used resolveVar() pattern from Phase 30 for runtime CSS property resolution (calendarHelpers color functions need hex strings for react-big-calendar inline styles)
- Hex fallback values in resolveVar() calls are SSR-safe defaults, not hardcoded UI colors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored linter auto-formatted compliance files**
- **Found during:** Task 1 and Task 2 (git staging)
- **Issue:** Editing training files triggered ESLint auto-formatting on unrelated compliance component files (ComplianceDashboard.tsx, NCAA20HourWarning.tsx, NCAAAuditReport.tsx, TrainingLoadChart.tsx, WeeklyHoursTable.tsx, AttendanceTrainingLinkPanel.tsx)
- **Fix:** Restored compliance files via `git checkout HEAD --` before each task commit to avoid including unrelated changes
- **Files affected:** 6 compliance files (restored, not committed)
- **Verification:** git status confirmed only task-related files staged

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Cosmetic issue only - prevented unrelated linter formatting changes from polluting task commits. No scope creep.

## Issues Encountered
None - plan executed as specified.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All calendar, workout, and periodization components now use V3 warm design tokens exclusively
- Plan 32-02 (compliance, session, assignment components) can proceed independently
- Plan 32-03 (calendar enhancements) has its V3 token prerequisite satisfied
- All numeric displays use font-mono for consistent data-forward aesthetic

## Self-Check: PASSED

---
*Phase: 32-training-attendance-migration*
*Completed: 2026-02-08*
