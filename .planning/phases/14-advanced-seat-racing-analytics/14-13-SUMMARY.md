---
phase: 14
plan: 13
subsystem: analytics
tags: [elo-rating, passive-tracking, practice-data, backend-service]
completed: 2026-01-26
duration: 4min

requires:
  - phase: 14
    plan: 01
    why: ELO rating service foundation
  - phase: 14
    plan: 02
    why: Bradley-Terry model concepts for comparison logic
  - phase: 13
    plan: 01
    why: Session and Piece models for practice data

provides:
  - artifact: PassiveObservation model
    what: Database model tracking lineup changes from practice
    significance: Enables continuous ranking updates without formal seat races
  - artifact: passiveEloService.js
    what: Service for detecting swaps and updating ELO with reduced weight
    significance: Unique differentiator for automatic ranking improvement
  - capability: Passive ELO tracking
    what: 0.5x weighted ELO updates from practice observations
    scope: Background process applying observations to athlete ratings

affects:
  - phase: 14
    plan: 14
    how: Frontend will display passive observation history
  - phase: 14
    plan: 15
    how: Prediction confidence benefits from passive observations

tech-stack:
  added:
    - library: none
      why: Uses existing Prisma and ELO service infrastructure
  patterns:
    - pattern: Swap detection algorithm
      where: detectSwapsFromSession function
      rationale: Compares consecutive piece lineups to find 1:1 athlete swaps
    - pattern: Weighted K-factor adjustment
      where: updateRatingsFromSeatRace weight parameter
      rationale: Passive observations have 0.5x impact vs formal seat races
    - pattern: Background observation application
      where: applyPendingObservations function
      rationale: Decouple observation recording from ELO updates

key-files:
  created:
    - path: server/services/passiveEloService.js
      why: Core service for passive ELO tracking
      exports: [detectSwapsFromSession, recordPassiveObservation, applyPendingObservations, getAthletePassiveHistory]
    - path: server/services/__tests__/passiveEloService.test.js
      why: Unit tests for swap detection and observation logic
      coverage: 13 tests covering edge cases
  modified:
    - path: prisma/schema.prisma
      why: Add PassiveObservation model with relationships
      changes: New model + reverse relations on Team, Session, Athlete
    - path: server/services/eloRatingService.js
      why: Add weight parameter support for passive observations
      changes: Accept options object with weight factor for K-adjustment

decisions:
  - id: passive-weight-default
    decision: Use 0.5x weight for passive observations
    rationale: Practice data less controlled than formal seat races - reduce impact
    alternatives:
      - value: 0.3x weight
        rejected: Too conservative, would take too many observations to converge
      - value: 0.7x weight
        rejected: Too aggressive, could overweight noisy practice data

  - id: min-split-threshold
    decision: Ignore split differences below 0.5 seconds
    rationale: Sub-second differences likely measurement noise or conditions

  - id: swap-detection-logic
    decision: Only record observations for clean 1:1 athlete swaps
    rationale: Multiple swaps create ambiguous attribution - can't determine individual impact

  - id: deferred-application
    decision: Record observations separately from applying to ELO
    rationale: Allows batch processing, dry-run testing, and audit trail
---

# Phase 14 Plan 13: Passive ELO Tracking Service Summary

**One-liner:** Background service that detects lineup swaps from practice and applies 0.5x weighted ELO updates automatically

## What Was Built

Implemented the passive ELO tracking service - the unique differentiator that enables continuous ranking improvement from practice data without requiring formal seat race sessions.

### Core Components

1. **PassiveObservation Model**
   - Tracks boat lineups and swapped athletes
   - Stores split time differences
   - Links to Session/Piece (Phase 13 integration)
   - Includes weight factor and application status

2. **Swap Detection**
   - `detectSwapsFromSession()`: Analyzes consecutive pieces for 1:1 athlete swaps
   - `findSwappedAthletes()`: Identifies exactly which athletes differ between lineups
   - Only processes clean swaps (exactly one athlete changed)

3. **Observation Recording**
   - `recordPassiveObservation()`: Manual split difference entry
   - `recordSplitObservation()`: Simplified "boat A did X, boat B did Y" input
   - Validates swap clarity, ignores sub-0.5s noise

4. **ELO Application**
   - `applyPendingObservations()`: Background processor for queued observations
   - `updateRatingsFromSeatRace()`: Enhanced with weight parameter support
   - Batch processing with dry-run capability

5. **Query Functions**
   - `getAthletePassiveHistory()`: View observation history per athlete
   - `getTeamPassiveStats()`: Total/applied/pending counts

### Weight Factor System

Modified `eloRatingService.js` to accept options object:
```javascript
updateRatingsFromSeatRace(teamId, winner, loser, margin, { weight: 0.5 })
```

K-factor calculation now: `K_FACTOR * marginFactor * weightFactor`
- Formal seat races: weight = 1.0 (full impact)
- Practice observations: weight = 0.5 (half impact)

## Technical Approach

### Swap Detection Algorithm

Compare consecutive pieces in a session:
1. For each boat, extract athlete IDs in previous and current piece
2. Identify athletes unique to each lineup
3. If exactly 1:1 swap detected, record as potential observation
4. Link to piece times if available

### Observation Flow

```
Practice Session
  ↓
Detect Swaps (auto or manual entry)
  ↓
Record PassiveObservation (appliedToRatings: false)
  ↓
Background Process: applyPendingObservations()
  ↓
Update ELO with 0.5x weight
  ↓
Mark observation as applied
```

### Data Model Design

```prisma
PassiveObservation {
  boat1Athletes: String[]      // Full lineup
  boat2Athletes: String[]      // Full lineup
  swappedAthlete1Id: String    // Unique to boat1
  swappedAthlete2Id: String    // Unique to boat2
  splitDifferenceSeconds: Float // Positive = boat1 faster
  weight: Float                 // Default 0.5
  appliedToRatings: Boolean    // Background processing flag
}
```

## Testing

**13 unit tests** covering:
- Swap detection for pairs, 4s, 8s
- Multi-swap rejection (can't attribute individual impact)
- Identical lineup detection (no swaps)
- Observation recording with default and custom weights
- Minimum threshold filtering (0.5s)
- ELO update application logic
- Winner determination from split sign (positive vs negative)
- Dry-run mode (calculate without persisting)

All tests passing with mocked Prisma and ELO service.

## Integration Points

### Phase 13 (Practice Sessions)
- Links observations to `Session` and `Piece` models
- Uses session structure for swap detection
- Reads split times from piece lineups

### Phase 14-01 (ELO Foundation)
- Extends `updateRatingsFromSeatRace` with weight parameter
- Uses same rating calculation logic with scaled K-factor
- Shares `AthleteRating` model

### Phase 14-02 (Bradley-Terry)
- Complements formal ranking algorithms
- Passive observations feed into overall ranking confidence
- Both systems use same underlying athlete ratings

## Deviations from Plan

### Rule 2 Auto-additions (Missing Critical Functionality)

**1. Weight parameter support in eloRatingService.js**
- **Found during:** Task 2 implementation
- **Issue:** `updateRatingsFromSeatRace()` had no weight parameter
- **Fix:** Modified function signature to accept options object with weight factor
- **Rationale:** Required for passive tracking to work - critical for correctness
- **Files modified:** `server/services/eloRatingService.js`
- **Commit:** dee630f

## Performance Considerations

1. **Batch Processing**
   - `applyPendingObservations()` limits to 100 observations per call
   - Background job can run periodically without blocking UI

2. **Index Strategy**
   - `@@index([teamId])` - Filter by team
   - `@@index([appliedToRatings])` - Find pending observations
   - `@@index([sessionId])` - Link to practice sessions

3. **Query Optimization**
   - Swap detection uses `orderBy: { sequenceNumber: 'asc' }` for efficient comparison
   - Athlete history limits to 50 recent observations

## Next Phase Readiness

### For 14-14 (Frontend Display)
✅ Service exports `getAthletePassiveHistory()` for UI display
✅ Observation includes source ('auto_detect', 'manual', 'split_observation')
✅ Applied timestamp available for "last updated" display

### For 14-15 (Predictive Models)
✅ Passive observations increase rating confidence over time
✅ `racesCount` incremented even for passive observations
✅ Weight factor visible for confidence scoring

### Open Questions
- **When to run background processor?** Options: after session completion, cron job, on-demand
- **UI for manual observation entry?** Simple form vs integrated into session view
- **Notification for applied observations?** Silent vs user feedback

## Lessons Learned

1. **Weight parameter design:** Options object better than positional parameter for backward compatibility
2. **Export constants explicitly:** Need `export const` for test imports, not just in default object
3. **Swap ambiguity:** Clean 1:1 swaps only - multiple swaps create attribution problems
4. **Minimum thresholds:** Sub-0.5s differences likely noise, ignore rather than process

## Metrics

- **Tasks completed:** 3/3
- **Tests added:** 13 (all passing)
- **Files created:** 2
- **Files modified:** 2
- **Lines added:** ~440 (service) + ~250 (tests)
- **Duration:** 4 minutes
- **Commits:** 3 atomic commits

## Git History

```
afe391d test(14-13): add comprehensive unit tests for passive ELO service
dee630f feat(14-13): implement passive ELO tracking service
d3c2fda feat(14-13): add PassiveObservation model for passive ELO tracking
```

---

**Status:** ✅ Complete - Passive ELO tracking service operational with full test coverage
