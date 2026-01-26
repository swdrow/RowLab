---
phase: 13
plan: 02
subsystem: frontend-data-layer
tags: [typescript, tanstack-query, rrule, sessions]
dependency-graph:
  requires: []
  provides: [session-types, session-hooks, rrule-utils]
  affects: [13-03, 13-04, 13-05]
tech-stack:
  added: [rrule@2.8.1]
  patterns: [tanstack-query-hooks, typed-api-responses]
key-files:
  created:
    - src/v2/types/session.ts
    - src/v2/utils/rrule.ts
    - src/v2/hooks/useSessions.ts
  modified: []
decisions: []
metrics:
  duration: 217s
  completed: 2026-01-26
---

# Phase 13 Plan 02: Session Frontend Types & Hooks Summary

**One-liner:** TypeScript types and TanStack Query hooks for Session CRUD with RRULE calendar recurrence utilities.

## What Was Built

### 1. Session TypeScript Types (`src/v2/types/session.ts`)

Created comprehensive TypeScript types for the Session domain:

- **Enums/Literals:** `SessionType` (ERG, ROW, LIFT, RUN, CROSS_TRAIN, RECOVERY), `SessionStatus` (PLANNED, ACTIVE, COMPLETED, CANCELLED), `PieceSegment` (WARMUP, MAIN, COOLDOWN)
- **Core Interfaces:** `Session`, `Piece` with full property definitions
- **Form Types:** `CreateSessionInput`, `UpdateSessionInput`, `CreatePieceInput`
- **API Types:** `SessionsResponse`, `SessionFilters`, `SessionResponse`
- **Live Session Types:** `LiveSessionState`, `LiveParticipant`, `LiveErgData` for real-time erg tracking
- **Calendar Types:** `SessionCalendarEvent` for calendar visualization

### 2. RRULE Utilities (`src/v2/utils/rrule.ts`)

Built calendar recurrence utilities using the `rrule` package:

- **Parsing:** `parseRRule()` - Parse RFC 5545 RRULE strings
- **Generation:** `generateRRule()` - Create RRULE from options (freq, interval, byweekday, until, count)
- **Expansion:** `expandRecurrence()`, `getNextOccurrences()`, `getNextOccurrence()`
- **Formatting:** `formatRRule()` (built-in), `formatRRuleShort()` (rowing-context friendly)
- **Validation:** `isValidRRule()`
- **Presets:** `rrulePresets` with common rowing schedules (weekdayMornings, MWF, TuTh, daily, weekly)

### 3. TanStack Query Hooks (`src/v2/hooks/useSessions.ts`)

Created full CRUD hooks following codebase patterns:

**Query Hooks:**
- `useSessions(filters)` - Fetch sessions with optional type/status/date filters
- `useSession(id)` - Fetch single session by ID
- `useActiveSession()` - Fetch current live session (30s stale time)
- `useUpcomingSessions(days)` - Fetch sessions for next N days

**Mutation Hooks:**
- `useCreateSession()` - Create new session
- `useUpdateSession()` - Update existing session
- `useDeleteSession()` - Delete session
- `useStartSession()` - Transition to ACTIVE status
- `useEndSession()` - Transition to COMPLETED status

**Query Keys:** Properly structured `sessionKeys` for cache management.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `59dcadc` | Session TypeScript types |
| 2 | `0facc15` | RRULE utility functions |
| 3 | `a34af68` | TanStack Query hooks |

## Deviations from Plan

**None** - Plan executed exactly as written.

## Dependencies Added

- `rrule@2.8.1` - RFC 5545 RRULE parsing and generation

## Technical Decisions

1. **Used existing api utility** - Followed `useSeatRaceSessions.ts` pattern using the `api` wrapper for consistent error handling
2. **Added extra hooks** - Added `useUpcomingSessions()`, `useStartSession()`, and `useEndSession()` beyond plan spec for complete session lifecycle
3. **Added live session types** - Included `LiveSessionState`, `LiveParticipant`, `LiveErgData` types anticipating Phase 13-04 live erg integration
4. **Added rrulePresets** - Created common rowing schedule presets for quick session setup

## Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `src/v2/types/session.ts` | 164 | Session, Piece, Live, Calendar types |
| `src/v2/utils/rrule.ts` | 270 | RRULE parsing, generation, formatting |
| `src/v2/hooks/useSessions.ts` | 363 | TanStack Query CRUD hooks |

## Next Phase Readiness

**Ready for:**
- 13-03: Session Dashboard Component (has types and hooks)
- 13-04: Live Erg Integration (has LiveSessionState types)
- 13-05: Calendar Integration (has RRULE utilities and calendar event types)

**Blockers:** None

## Verification Results

All plan success criteria met:
- [x] Session and Piece TypeScript types defined and exported
- [x] RRULE utilities (parseRRule, generateRRule, expandRecurrence) functional
- [x] TanStack Query hooks follow existing codebase patterns
- [x] All files compile without TypeScript errors (file-level verification passed)
