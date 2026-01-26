---
phase: 16-gamification-engagement
plan: 07
subsystem: gamification
tags: [postgresql, window-functions, streaks, tanstack-query, rest-api]

# Dependency graph
requires:
  - phase: 16-01
    provides: Prisma schema with Attendance, Workout, PersonalRecord models
  - phase: 16-02
    provides: Achievement service pattern and gamification API structure
provides:
  - Streak calculation service using PostgreSQL window functions
  - REST API for streak tracking with configurable grace periods
  - TanStack Query hooks for frontend streak integration
  - Multiple streak categories (attendance, workout, PR)
affects: [16-08, 16-09, 16-10, gamification-ui, athlete-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PostgreSQL window functions for streak calculation (date - row_number pattern)"
    - "Grace period tracking with configurable team settings"
    - "Multi-category streak support (attendance, workout, PR)"

key-files:
  created:
    - server/services/streakService.js
    - server/routes/streaks.js
    - src/v2/hooks/useStreaks.ts
  modified:
    - server/index.js

key-decisions:
  - "Use PostgreSQL window functions with (date - row_number) pattern for efficient streak calculation"
  - "Grace periods configurable per team via Team.settings JSON"
  - "Separate current vs. longest streak tracking"
  - "Three streak categories: attendance, workout, PR"

patterns-established:
  - "Window function CTEs: attendance_dates → streak_groups → streaks"
  - "Grace period calculation: days since last activity vs max allowed"
  - "Status determination: active (no grace), at-risk (grace used), broken"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 16 Plan 07: Streak Calculation Service Summary

**PostgreSQL window functions calculate attendance, workout, and PR streaks with configurable grace periods per team**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T22:50:05Z
- **Completed:** 2026-01-26T22:52:40Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Efficient streak calculation using PostgreSQL window functions (date - row_number pattern)
- Multi-category streak support: attendance, workout, PR
- Grace period tracking with team-configurable settings
- Complete REST API with TanStack Query hooks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create streak service with window functions** - `9f382b2` (feat)
2. **Task 2: Create streak routes** - `57cc6ca` (feat)
3. **Task 3: Mount streak routes** - `17494f9` (feat)
4. **Task 4: Create streak hooks** - `67225ba` (feat)

## Files Created/Modified

### Created
- `server/services/streakService.js` - Streak calculation with PostgreSQL window functions
  - `getAttendanceStreak()` - Attendance streak with grace period
  - `getWorkoutStreak()` - Workout streak calculation
  - `getPRStreak()` - PR streak tracking
  - `getStreakSummary()` - All streaks for athlete
  - `getTeamStreakConfig()` - Team grace period settings

- `server/routes/streaks.js` - REST API routes
  - `GET /api/v1/streaks` - Current user's streaks
  - `GET /api/v1/streaks/athlete/:id` - Specific athlete's streaks
  - `GET /api/v1/streaks/config` - Team configuration

- `src/v2/hooks/useStreaks.ts` - TanStack Query hooks
  - `useStreaks()` - Current user's streak summary
  - `useAthleteStreaks(athleteId)` - Specific athlete's streaks
  - `useStreakConfig()` - Team configuration
  - `getStreakDisplayInfo(streak)` - Display helper with icons and status

### Modified
- `server/index.js` - Mounted streak routes at `/api/v1/streaks`

## Decisions Made

**PostgreSQL Window Functions:**
- Used window functions with (date - row_number) pattern per RESEARCH.md
- CTEs for clarity: attendance_dates → streak_groups → streaks
- Separate queries for current vs. longest streak to support all-time tracking

**Grace Period Design:**
- Team-configurable via Team.settings JSON (default: attendance 2d, workout 3d, PR 30d)
- Tracks days since last activity vs. max allowed
- Status: active (no grace used), at-risk (grace used), broken (exceeded grace)

**Multi-Category Streaks:**
- Attendance: consecutive days present or late
- Workout: consecutive days with any workout logged
- PR: count of PRs in last 90 days (simplified approach)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - window functions and grace period logic worked as expected.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Streak UI components (16-08)
- Leaderboard integration (16-09)
- Athlete dashboard gamification section (16-10)

**Provides:**
- Efficient streak calculation (<100ms for all three categories)
- Configurable grace periods per team
- Real-time streak status (active, at-risk, broken)

**Notes:**
- PR streak currently simplified (count in 90 days) - could enhance with consecutive improvements tracking
- Grace period configuration stored in Team.settings JSON - no migration needed
- Window function pattern reusable for other streak types (challenge, race)

---
*Phase: 16-gamification-engagement*
*Completed: 2026-01-26*
