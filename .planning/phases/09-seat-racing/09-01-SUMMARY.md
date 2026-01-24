---
phase: 09-seat-racing
plan: 01
subsystem: api
tags: [tanstack-query, zod, typescript, seat-racing, elo-ratings]

# Dependency graph
requires:
  - phase: 07-erg-data-performance
    provides: TanStack Query patterns (useErgTests) and type structure
  - phase: 08-lineup-builder
    provides: TanStack Query patterns (useLineups) and V2 API conventions
provides:
  - TypeScript types for seat racing domain (sessions, pieces, boats, assignments, ratings)
  - Zod validation schemas for form inputs
  - TanStack Query hooks for seat race CRUD operations
  - TanStack Query hooks for athlete ELO ratings
affects: [09-02, 09-03, 09-04, 09-05, 09-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Seat racing types follow Prisma schema structure with nested relationships"
    - "Zod schemas for form validation separate from TypeScript types"
    - "Query hooks with 5-minute stale time for session data"
    - "Mutation hooks invalidate related queries for cache consistency"
    - "Client-side filtering for ratings by side (Port/Starboard/Cox)"

key-files:
  created:
    - src/v2/types/seatRacing.ts
    - src/v2/hooks/useSeatRaceSessions.ts
    - src/v2/hooks/useAthleteRatings.ts
  modified: []

key-decisions:
  - "useAthleteRatings includes client-side side filtering (Port/Starboard/Cox)"
  - "Utility functions for confidence level mapping and time formatting"
  - "Rating history hook returns empty array for MVP (API doesn't exist yet)"

patterns-established:
  - "Seat racing types mirror Prisma schema with SessionWithDetails for nested data"
  - "Mutation hooks require sessionId for query invalidation"
  - "AthleteRating confidence scores map to tier labels (UNRATED/PROVISIONAL/LOW/MEDIUM/HIGH)"

# Metrics
duration: 5min
completed: 2026-01-24
---

# Phase 09 Plan 01: Data Layer Summary

**TypeScript types and TanStack Query hooks for seat racing domain with ELO rating support and nested session details**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-24T19:56:15Z
- **Completed:** 2026-01-24T20:01:05Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- TypeScript types covering all seat racing entities (sessions, pieces, boats, assignments, ratings)
- Zod validation schemas for form inputs with comprehensive validation rules
- TanStack Query hooks for all seat race CRUD operations with proper cache invalidation
- TanStack Query hooks for athlete ELO ratings with client-side filtering by side

## Task Commits

Each task was committed atomically:

1. **Task 1: Create seat racing TypeScript types with Zod schemas** - `71e8293` (feat)
2. **Task 2: Create TanStack Query hooks for seat race sessions** - `b0eb59d` (feat)
3. **Task 3: Create TanStack Query hooks for athlete ratings** - `1c701c0` (feat)

## Files Created/Modified
- `src/v2/types/seatRacing.ts` - Types for SeatRaceSession, SeatRacePiece, SeatRaceBoat, SeatRaceAssignment, AthleteRating with Zod schemas and utility functions
- `src/v2/hooks/useSeatRaceSessions.ts` - TanStack Query hooks for session/piece/boat/assignment CRUD and session processing
- `src/v2/hooks/useAthleteRatings.ts` - TanStack Query hooks for athlete ratings with side filtering and recalculation

## Decisions Made

**1. Client-side filtering for ratings by side**
- Rationale: API returns all ratings, client filters for Port/Starboard-specific rankings
- Implementation: Filter applied in fetchAthleteRatings after API response
- Benefit: Reduces API surface area while enabling flexible UI filtering

**2. Rating history hook returns empty array for MVP**
- Rationale: /api/v1/ratings/history endpoint doesn't exist yet
- Implementation: Try/catch returns empty array if API fails
- Future: Plan 09-08 may add history endpoint if needed for trend visualization

**3. Confidence score utility function maps to tier labels**
- Rationale: UI needs human-readable confidence levels for badge display
- Implementation: getConfidenceLevel maps 0-1 score to UNRATED/PROVISIONAL/LOW/MEDIUM/HIGH
- Thresholds: 0-0.2 PROVISIONAL, 0.2-0.4 LOW, 0.4-0.7 MEDIUM, 0.7+ HIGH

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all TypeScript files compiled successfully, build passed without errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 09-02 (UI Components):**
- All types available for SessionList, RankingsTable, RankingsChart components
- Query hooks ready for data fetching in UI
- Zod schemas ready for form validation in SessionDetails

**Note for Plan 09-08 (Backend Routes):**
- The /api/v1/ratings endpoint referenced in useAthleteRatings does NOT exist yet
- Hooks will return errors until Plan 09-08 creates server/routes/ratings.js
- This is expected and documented in hook comments

---
*Phase: 09-seat-racing*
*Completed: 2026-01-24*
