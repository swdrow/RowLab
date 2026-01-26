---
phase: 14-advanced-seat-racing-analytics
plan: 04
subsystem: api
tags: [elo, composite-ranking, statistics, simple-statistics, seat-racing]

# Dependency graph
requires:
  - phase: 14-01
    provides: "Statistical dependencies (simple-statistics)"
provides:
  - "Side-specific ELO tracking (port/starboard/cox)"
  - "Composite ranking service with configurable weight profiles"
  - "Z-score normalization for fair multi-factor comparison"
  - "Erg test type weighting system"
affects: [14-05, 14-06, composite-rankings-api, advanced-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Side-specific rating types with suffix pattern (seat_race_elo_port)"
    - "Z-score + sigmoid normalization for [0,1] score transformation"
    - "Weighted averaging with test type hierarchy"

key-files:
  created:
    - server/services/compositeRankingService.js
  modified:
    - server/services/eloRatingService.js

key-decisions:
  - "Three weight profiles: Performance-First (85/10/5), Balanced (75/15/10), Reliability-Focus (65/15/20)"
  - "Z-score normalization with sigmoid for fair comparison across factors"
  - "Erg test type hierarchy: 2k=1.0, 6k=0.8, 500m=0.6, steady_state=0.3"
  - "90-day rolling window for erg data, 30-day for attendance"
  - "5 data points = 100% confidence threshold"

patterns-established:
  - "Side-specific ratings: Use getOrCreateSideSpecificRating with side suffix pattern"
  - "Composite ranking: Normalize each component separately, then weighted sum"
  - "Confidence scoring: min(component_confidences) for overall confidence"
  - "Tie-breaking: Use on-water ELO as primary tie-breaker for composite scores"

# Metrics
duration: 95 seconds
completed: 2026-01-26
---

# Phase 14 Plan 04: Composite Ranking & Side-Specific ELO Summary

**Composite ranking service combining on-water (ELO), erg performance, and attendance with configurable weight profiles and side-specific ELO tracking (port/starboard/cox)**

## Performance

- **Duration:** 1 min 35 sec
- **Started:** 2026-01-26T19:23:33Z
- **Completed:** 2026-01-26T19:25:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Side-specific ELO tracking enables port/starboard/cox ratings for improved lineup decisions
- Composite ranking combines multiple performance factors with statistical normalization
- Three pre-configured weight profiles with custom weight support
- Erg test type weighting prioritizes gold-standard 2k tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance ELO service with side-specific tracking** - `3fccf88` (feat)
2. **Task 2: Create composite ranking service** - `e833bae` (feat)

## Files Created/Modified
- `server/services/eloRatingService.js` - Added 4 new functions for side-specific rating management
- `server/services/compositeRankingService.js` - Complete composite ranking calculation with normalization

## Decisions Made

**1. Weight profile design**
- Three profiles balancing different coaching philosophies
- Performance-First (85/10/5): On-water results dominate
- Balanced (75/15/10): Default, weighs all factors
- Reliability-Focus (65/15/20): Values attendance/consistency

**2. Z-score normalization with sigmoid**
- Z-score enables fair comparison across different scales (ELO ~1000, attendance 0-1, erg times ~seconds)
- Sigmoid transformation maps to [0,1] range for weighted combination
- Direction parameter handles "higher is better" vs "lower is better" metrics

**3. Erg test type weighting**
- 2k tests weighted 1.0 (gold standard)
- 6k tests weighted 0.8 (endurance)
- 500m tests weighted 0.6 (sprint)
- Steady state weighted 0.3 (practice observation)
- Weighted average prioritizes more significant test types

**4. Rolling time windows**
- 90 days for erg data (captures training block)
- 30 days for attendance (recent reliability)
- Balances recency with sufficient data points

**5. Confidence scoring**
- Component confidence: data_points / 5 (capped at 1.0)
- Overall confidence: minimum of all component confidences
- Conservative approach ensures low confidence when any factor is uncertain

**6. Side-specific rating pattern**
- Suffix pattern: `seat_race_elo_port`, `seat_race_elo_starboard`, `seat_race_elo_cox`
- Preserves backward compatibility with existing `seat_race_elo` (combined rating)
- `updateRatingsWithSideDetection` updates both side-specific and combined ratings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- 14-05: Composite rankings API endpoints can use calculateCompositeRankings
- 14-06: Frontend can display side-specific ratings and composite rankings

**Available functions:**
- `getOrCreateSideSpecificRating(athleteId, teamId, side)` - Create/retrieve side-specific rating
- `updateRatingsWithSideDetection(teamId, athlete1Id, athlete2Id, athlete1Side, athlete2Side, performanceDiff)` - Update ratings with side awareness
- `getAthleteSideRatings(athleteId, teamId)` - Retrieve all side ratings for an athlete
- `getTeamRankingsBySide(teamId, side)` - Get rankings filtered by side
- `calculateCompositeRankings(teamId, { profileId, customWeights })` - Calculate composite rankings with breakdown

**Data requirements:**
- Active athletes with status='active'
- Erg tests with testType field (2k, 6k, 500m, etc.)
- Attendance records with status field (present, late, excused, unexcused)
- Seat race ratings (existing ELO system)

---
*Phase: 14-advanced-seat-racing-analytics*
*Completed: 2026-01-26*
