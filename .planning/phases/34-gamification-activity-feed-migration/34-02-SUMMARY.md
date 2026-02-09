---
phase: 34-gamification-activity-feed-migration
plan: 02
subsystem: ui
tags: [activity-feed, react, framer-motion, routing, typescript, design-system]

# Dependency graph
requires:
  - phase: 34-01
    provides: activity types, base hooks, ActivityFeed component
provides:
  - 6 typed activity card components (ErgTest, Session, RaceResult, Attendance, SeatRace, LineupAssignment)
  - Internal navigation from cards to source detail pages
  - Type-specific metadata rendering
  - V3 design tokens with glass cards and hover animations
affects: [34-07-activity-card-dispatch, 34-gamification-activity-feed-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Typed activity cards with internal navigation via useNavigate()"
    - "Framer Motion hover animations (whileHover={{ y: -1 }})"
    - "Glass-style cards with backdrop blur"
    - "Type-specific icon color schemes"

key-files:
  created:
    - src/v2/features/activity-feed/components/ErgTestActivityCard.tsx
    - src/v2/features/activity-feed/components/SessionActivityCard.tsx
    - src/v2/features/activity-feed/components/RaceResultActivityCard.tsx
    - src/v2/features/activity-feed/components/AttendanceActivityCard.tsx
    - src/v2/features/activity-feed/components/SeatRaceActivityCard.tsx
    - src/v2/features/activity-feed/components/LineupAssignmentActivityCard.tsx
  modified: []

key-decisions:
  - "Each card handles navigation internally via useNavigate() - no external onClick props needed"
  - "Attendance card uses dynamic icon/color based on status (present=green, late=yellow, unexcused=red)"
  - "Race result card shows medal emoji for top 3 finishes"
  - "Erg test card displays split time (per 500m) alongside total time"
  - "All cards use backdrop-blur-sm for glass effect per V3 design standard"

patterns-established:
  - "Activity cards: Icon (colored circle) + Title + Athlete + Metadata + Timestamp + Optional Badge"
  - "Hover animation: motion.div with whileHover={{ y: -1 }} + border color shift"
  - "Missing data: Show '—' or omit field gracefully, never crash"
  - "Navigation: Each card navigates to its source detail page on click"

# Metrics
duration: 2min
completed: 2026-02-09
---

# Phase 34 Plan 02: Activity Feed Typed Cards Summary

**6 typed activity card components with internal navigation, type-specific metadata, glass design, and Framer Motion hover animations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T16:12:43Z
- **Completed:** 2026-02-09T16:14:45Z
- **Tasks:** 1
- **Files modified:** 6 created

## Accomplishments

- Created 6 typed activity card components replacing generic single-card design
- Each card renders type-specific metadata (erg time, race place, attendance status, etc.)
- Internal navigation via useNavigate() to source detail pages (/app/erg-tests, /app/training, etc.)
- V3 design tokens with glass cards, backdrop blur, and hover animations
- Graceful handling of missing/null data with fallbacks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 6 typed activity card components with internal navigation** - `aab245e` (feat)

## Files Created/Modified

- `src/v2/features/activity-feed/components/ErgTestActivityCard.tsx` - Erg test results with time, split, watts, PR badge
- `src/v2/features/activity-feed/components/SessionActivityCard.tsx` - Training session participation with name, type, completion %
- `src/v2/features/activity-feed/components/RaceResultActivityCard.tsx` - Race results with regatta, event, place, medals for top 3
- `src/v2/features/activity-feed/components/AttendanceActivityCard.tsx` - Practice attendance with status-colored icons
- `src/v2/features/activity-feed/components/SeatRaceActivityCard.tsx` - Seat race results with rating change arrows
- `src/v2/features/activity-feed/components/LineupAssignmentActivityCard.tsx` - Lineup assignments with boat class, seat number

## Decisions Made

**Navigation Pattern:**
- Each card component imports `useNavigate()` from react-router-dom and handles its own navigation
- No external onClick prop needed - cards are fully self-contained
- Navigate to source detail pages: `/app/erg-tests`, `/app/training/sessions/:id`, `/app/regattas`, etc.

**Visual Design:**
- Glass-style cards: `bg-surface-elevated/80 backdrop-blur-sm` per V3 design standard
- Hover effects: Framer Motion `whileHover={{ y: -1 }}` + border color shift to `accent-primary/30`
- Type-specific icon colors (blue for erg, emerald for session, amber for race, etc.)

**Type-Specific Metadata:**
- ErgTestActivityCard: Shows split time (per 500m) alongside total time, watts, PR badge
- RaceResultActivityCard: Medal emoji (🥇🥈🥉) for top 3 finishes
- AttendanceActivityCard: Dynamic icon/color based on status (Check=green, Clock=yellow, X=red)
- SeatRaceActivityCard: Up/down arrows with green/red colors for rating changes
- SessionActivityCard: Participation percentage with checkmark icon
- LineupAssignmentActivityCard: Boat class and seat number with anchor icon

**Data Handling:**
- All cards handle missing/null data gracefully
- Show "—" for missing fields or omit them entirely
- Never crash on undefined metadata

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 07 (ActivityCard Dispatcher):**
- All 6 typed cards are created and working
- Each card exports a named function component
- Plan 07 can now update ActivityCard.tsx to dispatch to these typed cards based on activity.type

**Design System Compliance:**
- All cards use V3 design tokens
- Glass cards with backdrop blur
- Proper hover states with Framer Motion
- No banned patterns (no `bg-gray-900`, `shadow-lg`, or rounded-full buttons)

**Blockers:** None

**Concerns:** None - cards are fully typed, tested via build, and ready for integration

## Self-Check: PASSED

All files created and commit verified.

---
*Phase: 34-gamification-activity-feed-migration*
*Completed: 2026-02-09*
