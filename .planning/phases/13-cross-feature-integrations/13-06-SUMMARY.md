---
phase: 13
plan: 06
subsystem: api
tags: [live-erg, concept2, api-endpoint, session-data]
dependency-graph:
  requires:
    - 13-03-SUMMARY.md (LiveSessionData type definition)
    - 07-03-SUMMARY.md (C2 Logbook integration foundation)
  provides:
    - GET /api/v1/sessions/:id/live-data endpoint
    - Real-time athlete erg data aggregation from C2 Logbook
  affects:
    - 13-07 (Live session monitoring UI will consume this endpoint)
tech-stack:
  added: []
  patterns: [C2 API aggregation, live data polling endpoint]
key-files:
  created: []
  modified:
    - server/routes/sessions.js
decisions:
  - decision: Fetch C2 data on-demand per request
    rationale: Simpler than background sync, acceptable for 5s polling interval
    alternatives: [Background job with caching, WebSocket push]
    scope: live-data-endpoint
  - decision: Use C2 workout_type to determine athlete status
    rationale: "JustRow" indicates active workout, other types indicate finished
    alternatives: [Time-based heuristics, separate C2 API calls]
    scope: athlete-status-detection
  - decision: Return all team athletes, not just session participants
    rationale: Session participants not yet tracked in database
    alternatives: [Add session-athlete join table, filter by roster]
    scope: athlete-filtering
metrics:
  duration: 1m 48s
  completed: 2026-01-26
---

# Phase 13 Plan 06: Live Erg Data API Endpoint Summary

**One-liner:** GET /api/v1/sessions/:id/live-data aggregates C2 Logbook data for real-time athlete performance monitoring

## What Was Built

Created a backend API endpoint that aggregates live erg data from Concept2 Logbook for all athletes on a team during an active session.

### Core Components

**Live Data Endpoint** (`server/routes/sessions.js`)
- GET /api/v1/sessions/:id/live-data
- Validates session exists, belongs to team, and is ACTIVE
- Fetches all team athletes with C2 connections
- Aggregates latest workout data from C2 Logbook API
- Returns structured LiveSessionData format

**Response Structure**
```javascript
{
  sessionId: string,
  sessionName: string,
  activePieceId: string,
  activePieceName: string,
  athletes: [{
    athleteId: string,
    athleteName: string,
    distance: number,
    time: number,
    pace: number,
    watts: number,
    strokeRate: number,
    heartRate: number | null,
    strokeCount: number | null,
    status: 'pending' | 'active' | 'finished',
    lastUpdated: string
  }],
  startedAt: string,
  sessionCode: string
}
```

## Technical Implementation

### C2 Logbook API Integration

**Fetch Pattern**
- For each athlete with C2 connection (accessToken exists)
- Call C2 API: `GET /api/users/{c2UserId}/results?type=rower`
- Filter to today's workouts only
- Use most recent workout for athlete data

**Status Detection**
- `workout_type === 'JustRow'` → status: 'active'
- Other workout types → status: 'finished'
- No C2 connection or no today workouts → status: 'pending'

**Error Handling**
- C2 API fetch errors caught per-athlete (don't fail entire request)
- Errors logged with athlete context
- Failed athletes fall back to 'pending' status with zero metrics

### Performance Characteristics

**Per-Request Behavior**
- 1 database query: Fetch session with pieces
- 1 database query: Fetch all team athletes with C2 connections
- N HTTP requests to C2 Logbook (one per connected athlete)
- No caching implemented (acceptable for 5s polling interval)

**Response Time Estimate**
- Team of 20 athletes with 10 connected
- 10 sequential C2 API calls at ~200ms each = 2s
- Total response time: ~2-3s

## Key Decisions

### 1. On-Demand Fetching vs Background Sync

**Chosen:** On-demand fetching per request

**Rationale:**
- Simpler implementation, no background job orchestration
- Frontend polls every 5 seconds, so fresh data guaranteed
- C2 API rate limits not a concern for typical team sizes (20-30 athletes)

**Tradeoff:**
- Higher latency per request (2-3s for 10 connected athletes)
- N+1 query pattern to C2 API (but unavoidable without caching)

**Alternative Considered:**
Background job that syncs C2 data every 5s to database, endpoint returns cached data
- Pros: Faster endpoint response, batch C2 requests
- Cons: More complex, requires job scheduler, stale data possible

**Future Optimization Path:**
If response times become problematic (50+ athletes), implement Redis cache with 5s TTL

### 2. Athlete Filtering Scope

**Chosen:** Return all team athletes, not filtered to session participants

**Rationale:**
- Database schema doesn't yet track which athletes are in a session
- Frontend can filter by presence of erg data if needed
- Coaches want visibility into all connected athletes during live sessions

**Future Enhancement:**
Add SessionAthlete join table to track session participants

### 3. Active Piece Detection

**Chosen:** First incomplete piece (or first piece if all complete)

**Rationale:**
- Pieces table has `completedAt` timestamp field
- Simple query: `pieces.find(p => !p.completedAt)`
- Aligns with workout progression model

## Integration Points

### Frontend Consumption
- 13-05: useLiveErgPolling hook will call this endpoint every 5s
- 13-07: Live session monitoring UI will display aggregated data

### Backend Dependencies
- Concept2Service for token storage (already exists)
- Session/Piece models for active piece detection
- Athlete model with c2Connection relation

## Testing Notes

### Manual Test Command
```bash
# Get active session ID
curl http://localhost:8000/api/v1/sessions/active \
  -H "Authorization: Bearer $TOKEN"

# Fetch live data
curl http://localhost:8000/api/v1/sessions/{sessionId}/live-data \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Responses

**Success (200)**
```json
{
  "sessionId": "...",
  "sessionName": "Morning Practice",
  "activePieceId": "...",
  "activePieceName": "5000m Steady State",
  "athletes": [...],
  "startedAt": "2026-01-26T08:00:00.000Z",
  "sessionCode": "AB3X9K"
}
```

**Session Not Found (404)**
```json
{
  "error": "Session not found"
}
```

**Session Not Active (400)**
```json
{
  "error": "Session is not active"
}
```

## Known Limitations

1. **No Token Refresh**: If athlete's C2 access token expires, endpoint silently marks them as 'pending'
   - Future: Implement token refresh flow in concept2Service

2. **Serial API Calls**: C2 requests are sequential, not parallel
   - Future: Use Promise.all() for parallel fetching (reduce latency)

3. **No Rate Limiting**: C2 API rate limits not tracked
   - Future: Implement rate limit monitoring if needed

4. **No Caching**: Every request hits C2 API
   - Future: Add Redis cache with 5s TTL if performance becomes issue

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria

- ✅ GET /api/v1/sessions/:id/live-data returns athlete erg data
- ✅ Response includes sessionId, sessionName, activePieceId, athletes array
- ✅ Each athlete has distance, time, pace, watts, strokeRate, status
- ✅ Athletes with C2 connection show their latest workout data
- ✅ Athletes without C2 connection show as "pending"
- ✅ API handles C2 fetch errors gracefully

## Files Changed

| File | Changes | Lines |
|------|---------|-------|
| `server/routes/sessions.js` | Added live-data endpoint, imported express-validator | +133 |

## Next Steps

**Immediate (Phase 13)**
- 13-07: Build live session monitoring UI that polls this endpoint

**Future Enhancements**
1. Implement parallel C2 API fetching (Promise.all)
2. Add Redis caching layer for C2 responses (5s TTL)
3. Implement C2 token refresh flow
4. Add SessionAthlete join table for participant filtering
5. Add rate limit monitoring for C2 API

## Performance Optimization Ideas

**If response time becomes issue:**
1. Cache C2 responses in Redis (5s TTL)
2. Use Promise.all() for parallel C2 fetching
3. Background job to pre-fetch and cache during active sessions
4. WebSocket push instead of polling (eliminate endpoint entirely)

**Current benchmarks needed:**
- Response time with 10 connected athletes
- Response time with 50 connected athletes
- C2 API rate limit threshold
