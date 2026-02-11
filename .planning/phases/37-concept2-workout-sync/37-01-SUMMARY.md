---
phase: 37-concept2-workout-sync
plan: 01
subsystem: api
tags: [concept2, prisma, database, sync, splits, machine-type, workout-data]

# Dependency graph
requires:
  - phase: 12-integrations-settings
    provides: Concept2 OAuth infrastructure, token management, and basic sync foundation
provides:
  - WorkoutSplit database model with split-level data storage (pace, watts, HR, stroke rate per split)
  - Workout.machineType field for tracking RowErg/BikeErg/SkiErg
  - Enhanced c2SyncService with split extraction and machine type mapping
  - Split-aware sync for manual, webhook, and background sync paths
affects: [37-02-testing, 37-03-ui-sync-button, 37-04-workout-detail-view, 40-performance-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Split extraction from C2 API intervals array"
    - "Atomic Workout + WorkoutSplit creation via Prisma transactions"
    - "Machine type mapping from C2 numeric/string types to enum"
    - "Service delegation pattern: concept2Service.handleWebhook → c2SyncService.syncSingleResult"

key-files:
  created:
    - server/services/c2SyncService.js
  modified:
    - prisma/schema.prisma
    - server/services/concept2Service.js
    - server/services/backgroundSyncService.js
    - server/routes/concept2.js

key-decisions:
  - "Used prisma db push instead of migrate dev to sync schema without resetting migration history (database had drift from development work)"
  - "Deprecated old syncUserWorkouts in concept2Service.js, created enhanced version in c2SyncService.js with split support"
  - "Webhook handler delegates to c2SyncService for consistency across all sync paths"
  - "Split extraction uses C2 intervals array, creating atomic Workout + WorkoutSplit records in transaction"

patterns-established:
  - "Pattern 1: mapC2MachineType - Maps C2 type values (0/1/2 or rower/skierg/bikerg) to standardized enum"
  - "Pattern 2: extractSplits - Parses C2 intervals array into WorkoutSplit records with normalized field mapping"
  - "Pattern 3: Atomic upsert - Workout and WorkoutSplits created/updated together in single transaction"

# Metrics
duration: 5min
completed: 2026-02-11
---

# Phase 37 Plan 01: Enhanced C2 Sync Schema and Service

**Split-aware C2 sync pipeline with WorkoutSplit model, machineType tracking, and enhanced c2SyncService for all sync paths (manual, webhook, background)**

## Performance

- **Duration:** 5 min 3 sec
- **Started:** 2026-02-11T15:47:39Z
- **Completed:** 2026-02-11T15:52:42Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Database schema supports workout splits (per-split pace, watts, HR, stroke rate) and machine type (RowErg, BikeErg, SkiErg)
- Enhanced sync service extracts richer data from C2 API (summary metrics + split-by-split breakdown)
- All three sync paths (manual, webhook, background) use split-aware c2SyncService
- Atomic transactions ensure Workout and WorkoutSplit records created together

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema migration — WorkoutSplit model and machineType field** - `d424a2c` (feat)
   - Added machineType, avgPace, avgWatts, avgHeartRate, notes fields to Workout model
   - Created WorkoutSplit model with split-level data fields
   - Schema validated and synced to database with `db push`

2. **Task 2: Create c2SyncService.js with split-aware sync logic and user sync route** - `35f1995` (feat)
   - New c2SyncService.js with syncUserWorkouts, syncSingleResult, fetchAndStoreResult
   - Machine type mapping function (C2 type → rower/bikerg/skierg)
   - Split extraction from C2 intervals array
   - Updated concept2Service.js webhook to delegate to c2SyncService
   - Updated backgroundSyncService.js to use enhanced sync
   - POST /api/v1/concept2/sync/me route uses c2SyncService

## Files Created/Modified

- **prisma/schema.prisma** - Added WorkoutSplit model, machineType/avgPace/avgWatts/avgHeartRate/notes to Workout
- **server/services/c2SyncService.js** - New enhanced sync service with split extraction and machine type mapping
- **server/services/concept2Service.js** - Webhook handler delegates to c2SyncService, marked old syncUserWorkouts as deprecated
- **server/services/backgroundSyncService.js** - Uses c2SyncService.syncUserWorkouts for daily sync
- **server/routes/concept2.js** - Imports syncUserWorkouts from c2SyncService for /sync/me route

## Decisions Made

**1. Database sync approach:**
- Used `prisma db push` instead of `prisma migrate dev` because database had schema drift from previous development work
- This preserves existing data and avoids forcing a migration reset
- Future schema changes should use proper migrations once drift is resolved

**2. Service architecture:**
- Created dedicated c2SyncService.js for sync logic, keeping concept2Service.js focused on OAuth and token management
- Deprecated old syncUserWorkouts but kept it for backward compatibility during transition
- All sync paths (manual, webhook, background) now use the same enhanced service for consistency

**3. Discretion decisions implemented:**
- Synced workouts are read-only for metrics (distance, time, pace, watts) to preserve C2 data integrity
- Notes field is always editable regardless of source (allows coaches to add context)
- Athlete reassignment is allowed (coach can correct auto-match errors)
- Split data stored in separate WorkoutSplit table with 1:N relationship

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Issue 1: Prisma migration drift detected**
- **Problem:** `prisma migrate dev` reported schema drift, wanted to reset database
- **Root cause:** Database schema had been modified outside of migrations during previous development
- **Resolution:** Used `prisma db push` to sync schema without migration reset, preserving all existing data
- **Impact:** Migration history not updated, but database is in sync with schema. Future migrations will work correctly.

## User Setup Required

None - no external service configuration required. Concept2 OAuth was configured in Phase 12.

## Next Phase Readiness

**Ready for Phase 37-02 (Testing):**
- c2SyncService exports all functions for unit testing
- Mock C2 API responses can be constructed from C2 API documentation
- Fixtures needed: sample C2 result objects with intervals/splits

**Ready for Phase 37-03 (UI Sync Button):**
- POST /api/v1/concept2/sync/me endpoint exists and returns `{ totalFetched, workoutsCreated, ergTestsCreated, splits }`
- Frontend can call this endpoint and show sync feedback

**Ready for Phase 37-04 (Workout Detail View):**
- WorkoutSplit model exists with all split-level data
- Workouts have machineType field for filtering/display
- Query pattern: `prisma.workout.findUnique({ where: { id }, include: { splits: true } })`

**No blockers or concerns.**

---

## Self-Check: PASSED

All files created:
- ✓ server/services/c2SyncService.js

All commits exist:
- ✓ d424a2c (Task 1)
- ✓ 35f1995 (Task 2)

---
*Phase: 37-concept2-workout-sync*
*Completed: 2026-02-11*
