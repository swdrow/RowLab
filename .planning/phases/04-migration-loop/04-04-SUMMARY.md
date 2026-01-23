---
phase: 04
plan: 04
subsystem: backend-api
tags: [rest-api, availability, scheduling, team-isolation, authorization]
requires: [prisma-schema, auth-middleware]
provides: [availability-api, team-availability-grid, athlete-availability-edit]
affects: [05-practice-scheduling, coach-scheduling-ui]
tech-stack:
  added: []
  patterns: [service-layer, team-isolation, role-based-auth]
key-files:
  created:
    - server/services/availabilityService.js
    - server/routes/availability.js
  modified:
    - server/index.js
decisions: []
metrics:
  duration: 4 minutes
  completed: 2026-01-23
---

# Phase 04 Plan 04: Availability API Summary

**One-liner:** REST API for athlete availability tracking with team-wide grid view and role-based editing authorization

## What Was Built

Created complete availability tracking API with three endpoints:

1. **GET /api/v1/availability/team** - Team-wide availability grid for coaches
2. **GET /api/v1/availability/:athleteId** - Individual athlete availability for date range
3. **PUT /api/v1/availability/:athleteId** - Update athlete availability with authorization

### Service Layer (`availabilityService.js`)

**getTeamAvailability(teamId, { startDate, endDate })**
- Fetches all athletes in team with their availability records
- Returns structured grid: `[{ athleteId, athleteName, dates: [...] }]`
- Fills missing dates with `NOT_SET` defaults for complete grid
- Orders athletes by last name, then first name

**getAthleteAvailability(athleteId, { startDate, endDate })**
- Returns availability for single athlete
- Array of `{ date, morningSlot, eveningSlot, notes }`
- Fills missing dates with `NOT_SET` defaults

**updateAthleteAvailability(athleteId, availabilityArray)**
- Atomic transaction using Prisma `$transaction`
- Upserts records by `athleteId_date` unique constraint
- Normalizes dates to start of day UTC for consistent keys
- Returns updated records

### REST Endpoints

**Authorization Model:**
- **Athletes:** Can only edit their own availability (via `athlete.userId === req.user.id`)
- **Coaches/Owners:** Can edit any athlete's availability in their team
- All endpoints use `teamIsolation` middleware for multi-tenant safety

**Validation:**
- ISO8601 date format for all date parameters
- AvailabilitySlot enum: `AVAILABLE`, `UNAVAILABLE`, `MAYBE`, `NOT_SET`
- Notes limited to 200 characters
- UUID validation for athleteId

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 332d522 | feat(04-04): create availability service |
| 2 | 4f94810 | feat(04-04): create availability routes and mount |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

**1. Date Normalization**
- All dates normalized to UTC midnight (`date.setUTCHours(0, 0, 0, 0)`)
- Ensures consistent unique key matching for upserts
- Prevents duplicate records due to timezone differences

**2. Fill Missing Dates**
- Both team and athlete endpoints fill missing dates with `NOT_SET`
- Provides complete grid for UI rendering
- Avoids frontend having to compute missing dates

**3. Authorization via athlete.userId**
- Athletes linked to users via `Athlete.userId` field
- Check `athlete.userId === req.user.id` for ownership
- Coaches bypass via role check: `['COACH', 'OWNER'].includes(role)`

**4. Atomic Transactions**
- `updateAthleteAvailability` uses `prisma.$transaction`
- All upserts succeed or all fail
- Prevents partial updates on validation errors

## Integration Points

**Database:**
- `Availability` model with `@@unique([athleteId, date])`
- `AvailabilitySlot` enum: `AVAILABLE`, `UNAVAILABLE`, `MAYBE`, `NOT_SET`
- Cascade delete on `Athlete` deletion

**Middleware:**
- `authenticateToken` - JWT verification
- `teamIsolation` - Ensures `req.user.activeTeamId` set
- `apiLimiter` - Rate limiting for API endpoints

**Future Integrations:**
- **API-05:** Practice session scheduling will consume team availability
- **COACH-06:** Coach dashboard availability heatmap widget
- **COACH-07:** Practice planning view with availability overlay

## Next Phase Readiness

**Blockers:** None

**Concerns:** None - API is ready for frontend consumption

**Dependencies Met:**
- ✓ Prisma schema has Availability model
- ✓ Auth middleware provides team isolation
- ✓ TeamMember role-based authorization works

**Provides for Future:**
- Team availability grid for scheduling conflicts
- Athlete self-service availability management
- Coach override capability for managed athletes
