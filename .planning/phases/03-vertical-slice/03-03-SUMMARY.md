---
phase: 03-vertical-slice
plan: 03
subsystem: api
tags: [activity-feed, deduplication, concept2, strava, prisma, express]

# Dependency graph
requires:
  - phase: 01-clean-room
    provides: Prisma Activity model with source deduplication constraint
  - phase: 03-01
    provides: TanStack Query client singleton for frontend integration
provides:
  - Unified activity feed API endpoint with C2-primary deduplication
  - Activity deduplication service (±5min, ±10% distance tolerance)
  - Source filtering via excludeSources parameter
affects: [03-04-personal-dashboard, future-activity-views]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Activity deduplication via time window + distance tolerance
    - C2 as canonical source for rowing activities
    - User-scoped activities (not team-scoped)

key-files:
  created:
    - server/services/activityService.js
    - server/routes/activities.js
  modified:
    - server/index.js

key-decisions:
  - "C2 is ALWAYS primary for rowing activities (canonical erg data)"
  - "±5 minute time window + ±10% distance tolerance for deduplication"
  - "Activity type normalization (erg/row → rowing, bike/cycling → cycling)"
  - "User-scoped endpoint (not team-isolated) - activities are personal data"
  - "Fetch 2x limit to account for deduplication reducing result count"

patterns-established:
  - "Deduplication grouping: time window (5min blocks) + activity type"
  - "Primary source priority: CONCEPT2 > STRAVA > MANUAL (with rowing override)"
  - "isPrimary flag + duplicates array for cross-source linking"

# Metrics
duration: 15min
completed: 2026-01-23
---

# Phase 03 Plan 03: Unified Activity Feed API Summary

**Activity feed API with C2-primary deduplication using ±5min time window and ±10% distance tolerance**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-23T16:28:39Z
- **Completed:** 2026-01-23T16:33:40Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Activity deduplication service with intelligent primary source selection
- GET /api/v1/activities endpoint with pagination and source filtering
- C2 guaranteed primary for rowing (canonical erg data source)
- Cross-source duplicate linking with isPrimary and duplicates fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Create activity deduplication service** - `38ab3e7` (feat)
2. **Task 2: Create activities route with filtering** - `b0e571a` (feat)
3. **Task 3: Mount activities route in server index** - `af0fc8e` (feat)

## Files Created/Modified
- `server/services/activityService.js` - Deduplication logic with time window and distance tolerance
- `server/routes/activities.js` - Activity feed endpoint with pagination and excludeSources filtering
- `server/index.js` - Mounted /api/v1/activities route with apiLimiter

## Decisions Made

**C2 primary for rowing:** C2 logbook is the canonical source for rowing erg data. When duplicate rowing activities detected across sources (C2 + Strava), C2 is always selected as primary regardless of general source priority.

**±5min time window:** Activities within 5 minutes may be the same workout. Grouping uses 5-minute blocks (rounded down) to reduce comparison overhead.

**±10% distance tolerance:** If both activities have distance data, they must be within 10% to be considered duplicates. Prevents false matches between different workouts on same day.

**Activity type normalization:** "erg", "row", "rowing" all normalize to "rowing" for consistent matching. Same for cycling, running variants.

**Fetch 2x limit:** Fetches `(limit + offset) * 2` activities before deduplication to account for duplicates reducing final count. Caps at 100 to prevent excessive queries.

**User-scoped not team-scoped:** Activities are personal data (C2 logbook, Strava sync). Endpoint uses `req.user.userId` without `teamIsolation` middleware.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation followed research specifications from 03-RESEARCH.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for 03-04 (Personal Dashboard UI):**
- Activity feed API endpoint available at /api/v1/activities
- Supports pagination (limit, offset)
- Supports source filtering (excludeSources)
- Returns deduplicated activities with isPrimary and duplicates fields

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "userId": "uuid",
        "source": "CONCEPT2",
        "sourceId": "12345",
        "activityType": "rowing",
        "title": "2000m Test",
        "date": "2026-01-23T10:00:00Z",
        "data": { "distanceM": 2000, "timeSeconds": 420 },
        "isPrimary": true,
        "duplicates": [
          { "id": "uuid", "source": "STRAVA", "sourceId": "67890" }
        ]
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "count": 15
    }
  }
}
```

**No blockers.** Frontend can consume this endpoint with TanStack Query.

---
*Phase: 03-vertical-slice*
*Completed: 2026-01-23*
