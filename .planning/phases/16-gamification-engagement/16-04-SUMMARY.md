---
phase: 16-gamification-engagement
plan: 04
status: complete
subsystem: backend-gamification
tags: [personal-records, pr-detection, api, backend]

dependencies:
  requires:
    - "16-01: PersonalRecord model with contextual scoping"
    - "07: ErgTest model and service layer"
  provides:
    - "PR detection service with automatic processing"
    - "REST API for PR data retrieval and trends"
  affects:
    - "16-06: PR celebration UI components"
    - "16-08: Performance dashboard integration"

tech-stack:
  added:
    - "prDetectionService.js: Contextual PR detection logic"
    - "personalRecords.js routes: REST API layer"
  patterns:
    - "Auto-detection hooks in service layer"
    - "Multi-context PR scoping (all-time, season)"
    - "Team rank calculation via aggregation"

key-files:
  created:
    - "server/services/prDetectionService.js"
    - "server/routes/personalRecords.js"
  modified:
    - "server/services/ergTestService.js"
    - "server/index.js"

decisions:
  - id: "pr-auto-detection"
    title: "Automatic PR detection on test creation"
    rationale: "Integrate processNewErgTest() in ergTestService to detect and record PRs immediately when tests are created, ensuring real-time PR tracking without batch processing"
    alternatives: ["Batch processing via cron job", "Manual PR detection on query"]
    chosen: "Auto-detection in createErgTest service"

  - id: "season-calculation"
    title: "Fall/Spring season boundaries"
    rationale: "Use Aug-Dec for Fall, Jan-May for Spring, aligned with NCAA rowing seasons. Summer months (Jun-Jul) use most recent Spring season"
    alternatives: ["Calendar year seasons", "Custom team-defined seasons"]
    chosen: "Fixed NCAA-aligned seasons"

  - id: "team-rank-calculation"
    title: "Team rank via athlete grouping"
    rationale: "Use Prisma groupBy with _min aggregation to count athletes with better all-time bests, avoiding N+1 queries"
    alternatives: ["Raw SQL subqueries", "Post-query sorting in JavaScript"]
    chosen: "Prisma groupBy aggregation"

metrics:
  duration: "5 minutes"
  completed: "2026-01-26"
---

# Phase 16 Plan 04: PR Detection & Team Records API Summary

**One-liner:** Backend service and REST API for automatic PR detection with contextual scoping (all-time, season) and team records.

## What Was Built

### 1. PR Detection Service (server/services/prDetectionService.js)

**Core Functions:**
- `getCurrentSeason()` - Determines Fall (Aug-Dec) or Spring (Jan-May) based on date
- `detectPRs()` - Checks if result is PR in multiple contexts (all-time, season), includes team rank
- `recordPR()` - Upserts PR record with improvement delta
- `processNewErgTest()` - Auto-detects and records PRs after test creation
- `getAthletePRHistory()` - Full PR history for athlete
- `getAthleteCurrentPRs()` - Best all-time PR per test type
- `getTeamRecords()` - Team-wide best results for each test type
- `getResultTrend()` - Last N results for sparkline visualization
- `getPRCelebrationData()` - Combined PR contexts + trend data for UI

**Key Logic:**
- PRs detected in two contexts: all-time and season
- Team rank calculated by counting athletes with better all-time bests using Prisma groupBy
- Improvement delta stored as `previousBest - result` (positive = faster)
- Season boundaries: Fall (Aug 1 - Dec 31), Spring (Jan 1 - May 31)

### 2. Personal Records Routes (server/routes/personalRecords.js)

**Endpoints:**
- `GET /api/v1/personal-records` - Current user's PRs
- `GET /api/v1/personal-records/athlete/:athleteId` - Athlete-specific PRs
- `GET /api/v1/personal-records/history/:athleteId` - Full PR history
- `GET /api/v1/personal-records/team-records` - Team-wide records by test type
- `GET /api/v1/personal-records/detect/:testId` - PR celebration data (contexts + trends)
- `GET /api/v1/personal-records/trend/:athleteId/:testType` - Sparkline data (configurable limit 3-10)

**Security:**
- All routes require `authenticateToken` and `teamIsolation` middleware
- Athlete validation ensures data belongs to active team

### 3. Integration with Erg Test Creation

**Modified ergTestService.createErgTest():**
- Calls `processNewErgTest()` after test creation
- Returns formatted test with `prDetection` field containing:
  - `testId`: Test identifier
  - `contexts`: Array of PR contexts (all-time, season) with isPR, previousBest, improvement, rank
  - `isPR`: Boolean indicating if any PR was achieved
  - `prScopes`: Array of PR scope names (e.g., ["all-time", "season"])

**Modified server/index.js:**
- Imported and mounted `personalRecordsRoutes` at `/api/v1/personal-records`

## Technical Highlights

### Performance Optimizations
1. **Team Rank Calculation:** Uses Prisma groupBy with _min aggregation instead of N+1 queries
2. **PR Context Detection:** Single query per context (all-time, season) with lt (less than) operator
3. **Trend Data:** Limited to 5-10 results with single query and reverse sort

### Data Consistency
1. **Upsert Pattern:** Uses Prisma upsert with unique constraint `athlete_pr_unique` to prevent duplicate PR records
2. **Transaction Safety:** PR detection runs after successful test creation, ensuring test exists before recording PRs
3. **Type Conversion:** Explicit Number() conversion for Decimal fields (timeSeconds) to avoid precision issues

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Manual testing required:**
1. Create erg test via POST /api/v1/erg-tests and verify prDetection in response
2. Check GET /api/v1/personal-records/team-records returns correct team records
3. Verify season detection: tests in Aug-Dec show Fall season, Jan-May show Spring
4. Confirm team rank calculation: athlete with fastest time gets rank 1
5. Test trend data with multiple tests for same athlete/testType

**Edge cases handled:**
- No previous tests (first test is always a PR)
- Summer months (Jun-Jul) use Spring season context
- Athletes with no PRs return empty array
- Missing test for detect/:testId returns 404

## Integration Points

**Upstream Dependencies:**
- PersonalRecord model (16-01) for PR storage
- ErgTest model for test data and queries
- Athlete model for team isolation

**Downstream Consumers:**
- 16-06: PR celebration modal (uses getPRCelebrationData)
- 16-08: Performance dashboard (uses getAthleteCurrentPRs, getResultTrend)
- Frontend PR display components (uses athlete and team record endpoints)

## Next Phase Readiness

**Ready to proceed:** Yes

**Unblocked work:**
- PR celebration UI can now fetch real-time PR data
- Performance dashboards can display trends and team records
- Achievement progress tracking can reference PR data

**Known limitations:**
- Training-block scope not yet implemented (planned for future phase)
- No PR history filtering by date range (could be added if needed)
- Team records don't filter by gender/weight class (feature request)

## Files Changed

**Created (2):**
- `server/services/prDetectionService.js` (315 lines)
- `server/routes/personalRecords.js` (208 lines)

**Modified (2):**
- `server/services/ergTestService.js` (+6 lines): Import and call processNewErgTest
- `server/index.js` (+2 lines): Import and mount personalRecordsRoutes

**Total:** 531 lines added, 2 files modified
