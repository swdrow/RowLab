---
phase: 10-training-plans-ncaa-compliance
plan: 01
subsystem: training
tags: [react-big-calendar, date-fns, typescript, tss, ncaa-compliance, training-plans]

# Dependency graph
requires:
  - phase: 06-athletes-roster
    provides: Athlete types and roster data access
  - phase: 07-erg-data-performance
    provides: WorkoutData patterns and erg test integration
provides:
  - Training type system (PeriodizationBlock, PlannedWorkout, TrainingPlan)
  - TSS calculation engine (power-based, HR fallback, estimation)
  - NCAA compliance validation (weekly 20h limit, daily 4h limit, competition 3h rule)
  - Calendar helpers (recurring events, date bounds, event conversion)
affects: [10-02, 10-03, 10-04, 10-05, 10-06]

# Tech tracking
tech-stack:
  added: [react-big-calendar@1.19.4, date-fns@4.1.0]
  patterns: [TSS calculation with power/HR fallback, NCAA compliance checking, RRULE parsing for recurring workouts]

key-files:
  created:
    - src/v2/types/training.ts
    - src/v2/utils/tssCalculator.ts
    - src/v2/utils/ncaaRules.ts
    - src/v2/utils/calendarHelpers.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Power-based TSS with HR and duration fallbacks for rowing workouts"
  - "NCAA competitions count as 3 hours regardless of actual duration"
  - "CalendarEvent.resource.planId enables drag-drop plan filtering"
  - "NCAA week runs Monday-Sunday with 20h weekly and 4h daily limits"
  - "Simple RRULE parsing for FREQ=WEEKLY;BYDAY=MO,WE,FR patterns"

patterns-established:
  - "TSS calculation: power-based (IF formula) → HR fallback → duration estimate"
  - "NCAA compliance: check daily/weekly limits before scheduling"
  - "Recurring event expansion: parse RRULE weekdays and generate instances in range"

# Metrics
duration: 8min
completed: 2026-01-25
---

# Phase 10 Plan 01: Foundation Types & Utilities Summary

**TSS calculation engine with power/HR fallback, NCAA compliance validation enforcing 20h weekly limit, and calendar helpers for recurring workouts with RRULE parsing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-25T02:45:18Z
- **Completed:** 2026-01-25T02:53:29Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Installed react-big-calendar and date-fns for Phase 10 calendar UI
- Created comprehensive training type system with 20+ types covering plans, workouts, periodization, assignments, completions, NCAA compliance
- Implemented TSS calculation with 3-tier fallback: power-based (most accurate) → HR-based → duration estimate
- Built NCAA compliance engine respecting 20-hour weekly limit, 4-hour daily limit, and 3-hour competition rule
- Created calendar helpers for recurring workouts, date ranges, event conversion, and color coding

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-big-calendar and date-fns** - `5323c05` (chore)
2. **Task 2: Create training types** - `50e9d1d` (feat)
3. **Task 3: Create utility functions** - `c693b53` (feat)

**Import cleanup:** `e2819a6` (fix)

## Files Created/Modified

Created:
- `src/v2/types/training.ts` - Training types (PeriodizationBlock, PlannedWorkout, TrainingPlan, WorkoutAssignment, WorkoutCompletion, CalendarEvent, WorkoutData, PracticeSession, NCAAAuditEntry, NCAAComplianceReport)
- `src/v2/utils/tssCalculator.ts` - TSS calculation functions (calculateTSS, calculateWeeklyLoad, estimateTSSFromPlan)
- `src/v2/utils/ncaaRules.ts` - NCAA compliance functions (calculateWeeklyHours, validateDailyHours, wouldExceedLimit, generateWeeklyReport)
- `src/v2/utils/calendarHelpers.ts` - Calendar utility functions (getWeekBounds, getMonthBounds, formatCalendarDate, parseRRuleWeekdays, expandRecurringEvent, workoutToCalendarEvent, getWorkoutTypeColor, getPeriodizationColor)

Modified:
- `package.json` - Added react-big-calendar@1.19.4 and date-fns@4.1.0
- `package-lock.json` - Locked dependency versions

## Decisions Made

**1. TSS calculation with 3-tier fallback**
- Power-based (most accurate): Uses FTP and intensity factor formula (duration * watts * IF) / (FTP * 3600) * 100
- HR-based fallback: Uses FTHR when power unavailable, hrTSS = (duration / 3600) * IF² * 100
- Duration estimate (least accurate): Assumes moderate intensity (IF = 0.75) when no metrics available
- **Rationale:** Rowing teams have varying equipment - some have power meters, some only HR monitors, some neither. Fallback ensures TSS available for all workouts while preferring accuracy when data exists.

**2. NCAA competition counts as 3 hours regardless of duration**
- Hardcoded COMPETITION_HOURS = 3 constant
- Applied in calculateWeeklyHours and wouldExceedLimit functions
- **Rationale:** NCAA Bylaw 17.1.7.2 specifies competitions count as 3 CARA hours regardless of actual length. This is a compliance requirement, not an implementation choice.

**3. CalendarEvent.resource includes planId for filtering**
- resource.planId populated from workout.planId in workoutToCalendarEvent and expandRecurringEvent
- Enables drag-drop calendar to filter events by active training plan
- **Rationale:** Coaches may have multiple concurrent plans (team plan, individual plans, archived plans). Plan filtering prevents clutter and allows focused view of specific plan's workouts.

**4. NCAA week runs Monday-Sunday**
- startOfWeek uses { weekStartsOn: 1 } (Monday)
- calculateWeeklyHours filters sessions in 7-day interval from Monday
- **Rationale:** NCAA defines compliance week as Monday-Sunday, not calendar week. Critical for accurate compliance reporting when week boundaries matter.

**5. Simple RRULE parsing instead of full rrule library**
- parseRRuleWeekdays supports only FREQ=WEEKLY;BYDAY=MO,WE,FR pattern
- Maps day abbreviations (MO, TU, etc.) to JS weekday numbers (1, 2, etc.)
- **Rationale:** Most training plans use simple weekly recurrence (e.g., "Monday/Wednesday/Friday practice"). Full RRULE spec adds complexity and dependency weight. Can expand later if complex patterns needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused imports**
- **Found during:** Task 3 verification (TypeScript compilation)
- **Issue:** calendarHelpers.ts imported addDays, addWeeks, isAfter but never used them. ncaaRules.ts imported endOfWeek but never used it. TypeScript compiler flagged as errors.
- **Fix:** Removed unused imports from both files
- **Files modified:** src/v2/utils/calendarHelpers.ts, src/v2/utils/ncaaRules.ts
- **Verification:** npx tsc --noEmit passed without errors for all new files
- **Committed in:** e2819a6 (separate fix commit after main task)

---

**Total deviations:** 1 auto-fixed (1 bug - unused imports)
**Impact on plan:** Minor cleanup for code quality. No functional impact, just TypeScript linting compliance.

## Issues Encountered

None - plan executed smoothly.

## User Setup Required

None - no external service configuration required. This plan establishes foundation types and utilities used by future plans.

## Next Phase Readiness

**Ready for Plan 10-02 (TanStack Query hooks):**
- All training types defined and exported
- TSS calculation functions ready for use in workout creation/completion hooks
- NCAA compliance functions ready for use in practice session hooks
- Calendar helpers ready for use in calendar component

**Ready for Plan 10-03 (Calendar component):**
- CalendarEvent type with resource.planId for filtering
- workoutToCalendarEvent and expandRecurringEvent for event generation
- getWorkoutTypeColor and getPeriodizationColor for visual coding
- getWeekBounds and getMonthBounds for navigation

**Ready for Plan 10-04 (Plan creation wizard):**
- TrainingPlan and TrainingPlanFormData types
- PeriodizationBlock and PlannedWorkout types
- estimateTSSFromPlan for workout estimation during plan creation

**Ready for Plan 10-05 (NCAA compliance UI):**
- PracticeSession and NCAAAuditEntry types
- calculateWeeklyHours, validateDailyHours, wouldExceedLimit functions
- generateWeeklyReport for compliance report generation
- NCAA constants (20h weekly limit, 4h daily limit, 18h warning threshold)

**No blockers.** All foundation code compiles cleanly and is ready for consumption.

---
*Phase: 10-training-plans-ncaa-compliance*
*Plan: 01*
*Completed: 2026-01-25*
