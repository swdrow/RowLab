---
phase: 14-advanced-seat-racing-analytics
plan: 05
subsystem: backend-api
tags: [api, rest, express, routing, advanced-analytics]

requires:
  - 14-02-bradley-terry-model
  - 14-03-matrix-planner
  - 14-04-composite-rankings

provides:
  - advanced-ranking-api-endpoints
  - bradley-terry-api
  - matrix-planner-api
  - composite-rankings-api
  - side-specific-ratings-api
  - comparison-graph-api

affects:
  - 14-06-comparison-graph-viz
  - 14-07-bradley-terry-ui
  - 14-08-matrix-planner-ui
  - 14-09-composite-rankings-ui

tech-stack:
  added: []
  patterns:
    - express-routing
    - rest-api
    - middleware-authentication
    - structured-error-handling

key-files:
  created:
    - server/routes/advancedRanking.js
  modified:
    - server/index.js

decisions:
  - id: auth-middleware-pattern
    choice: Use authenticateToken + requireTeam for all routes
    rationale: Consistent with existing API patterns in ratings.js and seatRaces.js
    alternatives: [router-level middleware, individual route middleware]

  - id: error-codes
    choice: Use structured error codes (NO_TEAM, INVALID_INPUT, SERVER_ERROR, etc.)
    rationale: Enables frontend to handle errors programmatically
    alternatives: [string messages only, numeric codes]

  - id: team-id-source
    choice: Support teamId query param with fallback to activeTeamId
    rationale: Flexibility for admin views while defaulting to current team
    alternatives: [activeTeamId only, required teamId param]

  - id: athlete-enrichment
    choice: Enrich API responses with athlete names/details
    rationale: Reduces frontend API calls and improves UX
    alternatives: [return IDs only, separate endpoint]

metrics:
  duration: 136s
  completed: 2026-01-26
---

# Phase 14 Plan 05: Advanced Ranking API Endpoints Summary

**One-liner:** REST API endpoints for Bradley-Terry rankings, matrix planning, composite rankings, and side-specific ratings

## What Was Built

Created comprehensive API layer (`server/routes/advancedRanking.js`) exposing 9 RESTful endpoints for Phase 14's advanced analytics features:

**Bradley-Terry Rankings (2 endpoints):**
- `GET /bradley-terry` - Fit Bradley-Terry model and return ranked athletes with strength parameters
- `GET /probability-matrix` - Generate pairwise win probability matrix

**Matrix Session Planner (2 endpoints):**
- `POST /matrix-planner/generate` - Generate optimal swap schedule for seat racing
- `POST /matrix-planner/validate` - Validate manually-created schedules

**Composite Rankings (2 endpoints):**
- `GET /composite` - Calculate weighted composite rankings from multiple data sources
- `GET /weight-profiles` - Return available weight profiles (balanced, performance, potential)

**Side-Specific Ratings (2 endpoints):**
- `GET /by-side` - Get team rankings filtered by side (Port/Starboard/Cox)
- `GET /athlete/:athleteId/sides` - Get all side-specific ratings for an athlete

**Analysis Tools (1 endpoint):**
- `GET /comparison-graph` - Generate comparison graph with nodes, edges, gaps, and connectivity metrics

**Helper Functions:**
- `extractComparisons()` - Extracts pairwise athlete comparisons from seat race sessions

All endpoints:
- Use `authenticateToken` + `requireTeam` middleware for security
- Return structured JSON: `{ success: boolean, data?: object, error?: { code, message } }`
- Include proper error handling with logger integration
- Enrich responses with athlete names/details

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### API Response Patterns

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "NO_TEAM|INVALID_INPUT|SERVER_ERROR|...",
    "message": "Human-readable error message"
  }
}
```

### Error Codes
- `NO_TEAM` - No active team ID available
- `INVALID_INPUT` - Request validation failed
- `SERVER_ERROR` - Internal server error
- `PLANNER_ERROR` - Matrix planner-specific errors
- `VALIDATION_ERROR` - Schedule validation failures

### Comparison Extraction Logic

The `extractComparisons()` helper:
1. Loads all seat race sessions for the team
2. For each piece, compares every pair of boats
3. Identifies swapped athletes (exactly 1 athlete difference)
4. Calculates margin (including handicaps)
5. Returns array of `{ athlete1Id, athlete2Id, winner, margin }`

This feeds into Bradley-Terry model fitting and comparison graph generation.

### Integration Points

**Services Used:**
- `bradleyTerryService.js` - Model fitting and probability calculations
- `matrixPlannerService.js` - Schedule generation and validation
- `compositeRankingService.js` - Multi-source ranking calculations
- `eloRatingService.js` - Side-specific rating queries

**Authentication Flow:**
1. `apiLimiter` (rate limiting)
2. `authenticateToken` (JWT validation)
3. `requireTeam` (team context check)
4. Route handler

## Testing Notes

**Manual Testing Approach:**
```bash
# Test authentication requirement
curl http://localhost:8000/api/v1/advanced-ranking/weight-profiles

# With authentication (example)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/advanced-ranking/weight-profiles
```

**Key Test Cases:**
- [ ] Bradley-Terry with no seat race data returns empty result
- [ ] Matrix planner requires at least 2 athletes
- [ ] Composite rankings work with custom weight profiles
- [ ] Side filtering returns only requested side
- [ ] Comparison graph calculates connectivity correctly
- [ ] All routes reject requests without auth
- [ ] All routes reject requests without team context

## Next Phase Readiness

**Ready for:**
- 14-06 (Comparison Graph Viz) - API endpoint ready
- 14-07 (Bradley-Terry UI) - API endpoints ready
- 14-08 (Matrix Planner UI) - API endpoints ready
- 14-09 (Composite Rankings UI) - API endpoints ready

**Dependencies Complete:**
- ✓ 14-02 (Bradley-Terry Service)
- ✓ 14-03 (Matrix Planner Service)
- ✓ 14-04 (Composite Rankings Service)

**Blockers:** None

**Concerns:** None - API layer is complete and follows established patterns

## Performance Considerations

**Potential Bottlenecks:**
1. `extractComparisons()` loads all sessions with nested includes (pieces → boats → assignments)
   - Consider caching for large teams
   - Add pagination if >1000 sessions
2. Bradley-Terry model fitting is O(n² iterations) where n = athlete count
   - Should be fine for teams <100 athletes
   - Consider async processing for larger datasets
3. Comparison graph generates all possible pairs O(n²)
   - Consider limiting to active athletes only

**Optimization Opportunities:**
- Add Redis caching for frequently-requested rankings
- Implement incremental Bradley-Terry updates (vs. full refit)
- Add `updatedAt` timestamps to enable conditional requests

## File Manifest

```
server/routes/advancedRanking.js     550 lines  (created)
server/index.js                        +2 lines  (modified)
```

## API Endpoint Reference

| Method | Path | Purpose | Auth | Query/Body Params |
|--------|------|---------|------|-------------------|
| GET | `/bradley-terry` | Fit BT model | Required | `teamId?` |
| GET | `/probability-matrix` | Win probabilities | Required | `teamId?` |
| POST | `/matrix-planner/generate` | Generate schedule | Required | `athleteIds[], boatClass, pieceCount?, prioritizeAthletes?` |
| POST | `/matrix-planner/validate` | Validate schedule | Required | `schedule` |
| GET | `/composite` | Composite rankings | Required | `teamId?, profileId?, customWeights?` |
| GET | `/weight-profiles` | Available profiles | Required | - |
| GET | `/by-side` | Side rankings | Required | `teamId?, side?` |
| GET | `/athlete/:athleteId/sides` | Athlete sides | Required | `teamId?` |
| GET | `/comparison-graph` | Graph data | Required | `teamId?` |

## Commits

- `4287741` - feat(14-05): create advanced ranking API routes
- `52c6a67` - feat(14-05): register advanced ranking routes in server
