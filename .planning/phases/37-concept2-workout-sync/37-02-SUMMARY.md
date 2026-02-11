---
phase: 37-concept2-workout-sync
plan: 02
subsystem: testing
tags: [nock, vitest, tdd, concept2, fixtures, http-mocking]

# Dependency graph
requires:
  - phase: 37-01
    provides: c2SyncService.js interface definition
provides:
  - Nock-based C2 API mock server for offline testing
  - Anonymized C2 workout fixture data (8 workouts covering all machine types)
  - TDD test suite defining sync pipeline contract
affects: [37-03, 37-04, 37-05, 37-06]

# Tech tracking
tech-stack:
  added: [nock@^13.5.6]
  patterns: [TDD RED-GREEN-REFACTOR, HTTP mocking with nock, fixture-based testing]

key-files:
  created:
    - server/tests/mocks/c2ApiMock.js
    - server/tests/fixtures/c2Workouts.json
    - server/tests/c2-sync.test.js
  modified:
    - package.json

key-decisions:
  - "Use nock for HTTP mocking (Node.js native, better than MSW for backend testing)"
  - "TDD approach: tests define contract before implementation exists"
  - "Fixture data includes all machine types (RowErg/BikeErg/SkiErg) and edge cases (no HR data)"
  - "Tests verify pure functions only (no database required for data transformation logic)"

patterns-established:
  - "HTTP mock pattern: mockC2Api() returns nock scopes for all C2 endpoints"
  - "Fixture pattern: c2Workouts.json provides realistic anonymized data"
  - "TDD test pattern: import with try/catch, stub functions if not implemented"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 37 Plan 02: C2 API Test Infrastructure Summary

**Nock-based C2 API mock server with anonymized fixtures and TDD test suite defining sync pipeline contract**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-02-11T15:48:17Z
- **Completed:** 2026-02-11T15:51:58Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed nock for deterministic HTTP mocking without real API calls
- Created 8 anonymized C2 workout fixtures covering all machine types and edge cases
- Wrote 27 TDD tests defining the sync pipeline contract (21 RED, 6 GREEN as expected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install nock and create C2 API mock server with fixtures** - `83bf511` (chore)
2. **Task 2: Write sync pipeline integration tests** - `97d7afc` (test - TDD RED)

## Files Created/Modified

### Created
- `server/tests/mocks/c2ApiMock.js` - Nock-based HTTP interceptors for C2 OAuth and API endpoints
  - mockC2Api(): Sets up nock scopes for token exchange, user profile, paginated results, single result detail
  - cleanupMocks(): Removes all interceptors
  - Supports pagination query params
- `server/tests/fixtures/c2Workouts.json` - 8 anonymized workouts with realistic data
  - RowErg: 2k (4 splits), 6k (6 splits), 10k (10 splits, no HR), 5k (10 splits), 500m (1 split)
  - BikeErg: 30min piece (6 time-based splits)
  - SkiErg: 5k (5 splits), 3k (3 splits)
  - Includes heart_rate, stroke_data, intervals with pace/watts/HR/dragFactor
- `server/tests/c2-sync.test.js` - TDD test suite (27 tests, 21 RED as expected)
  - Tests for mapC2MachineType() - C2 type (0/1/2) → machine type (rower/skierg/bikerg)
  - Tests for extractSplits() - Parse intervals array with sequential numbering
  - Tests for convertC2Workout() - Transform C2 result to Workout format with machineType, avgPace, avgWatts, avgHeartRate
  - Tests for deduplication via c2LogbookId
  - Fixture validation tests (all passing)

### Modified
- `package.json` - Added nock@^13.5.6 as dev dependency

## Decisions Made

1. **Chose nock over MSW for HTTP mocking**
   - Rationale: nock is Node.js-native, better for backend-only testing. MSW is browser/service-worker focused.
   - Source: 37-RESEARCH.md recommendation

2. **TDD approach with try/catch import**
   - Rationale: Tests define the contract for c2SyncService.js before it exists (Plan 37-01 runs in parallel)
   - Pattern: Import functions with try/catch, stub with "Not implemented" errors if not found
   - Expected outcome: Tests fail RED until implementation exists (GREEN in Plan 37-01 or 37-03)

3. **Fixture data includes edge cases**
   - Rationale: Real C2 data varies - some workouts lack HR data, different machine types, various split counts
   - Coverage: All 3 machine types, workouts with/without HR, distances from 500m to 12km

4. **Tests verify pure functions only (no DB)**
   - Rationale: Data transformation logic (mapC2MachineType, extractSplits, convertC2Workout) doesn't require database
   - Benefit: Fast, isolated unit tests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - nock installation and test setup proceeded smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 37-03 (c2SyncService.js implementation) or Plan 37-01 completion:
- Test contract defined for mapC2MachineType, extractSplits, convertC2Workout
- Mock server ready to intercept C2 API calls in tests
- Fixture data available for realistic test scenarios
- TDD RED phase complete (21 tests awaiting GREEN implementation)

**Blockers:** None

**Concerns:** None - tests define clear contract for sync service functions

---
*Phase: 37-concept2-workout-sync*
*Completed: 2026-02-11*

## Self-Check: PASSED

All created files exist:
- server/tests/mocks/c2ApiMock.js
- server/tests/fixtures/c2Workouts.json
- server/tests/c2-sync.test.js

All commits verified:
- 83bf511 (Task 1)
- 97d7afc (Task 2)
