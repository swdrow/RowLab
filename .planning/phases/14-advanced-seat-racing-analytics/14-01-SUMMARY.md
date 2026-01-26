---
phase: 14-advanced-seat-racing-analytics
plan: 01
subsystem: foundation
tags: [typescript, zod, simple-statistics, jstat, fmin, bradley-terry, elo, ranking]

# Dependency graph
requires:
  - phase: 09-seat-racing
    provides: Basic ELO rating system, AthleteRating types, Side types
provides:
  - Statistical computing libraries (simple-statistics, jstat, fmin)
  - TypeScript types for Bradley-Terry model
  - TypeScript types for comparison graphs
  - TypeScript types for matrix session planning
  - TypeScript types for composite rankings
  - TypeScript types for side-specific ratings
  - TypeScript types for passive tracking
  - Zod validation schemas for advanced ranking APIs
  - Default weight profiles for composite rankings
affects: [14-02, 14-03, 14-04, 14-05, 14-06, 14-07, advanced-analytics]

# Tech tracking
tech-stack:
  added: [simple-statistics@7.8.8, jstat@1.9.6, fmin@0.0.4]
  patterns: [Bradley-Terry model types, composite ranking patterns, side-specific rating tracking]

key-files:
  created: [src/v2/types/advancedRanking.ts]
  modified: [package.json, package-lock.json]

key-decisions:
  - "simple-statistics for statistical functions (descriptive stats, distributions)"
  - "jstat for probability distributions and statistical tests"
  - "fmin for Nelder-Mead optimization (Bradley-Terry MLE fitting)"
  - "Composite ranking weights must sum to 1.0 (enforced by Zod schema)"
  - "Default weight profiles: Performance-First (85/10/5), Balanced (75/15/10), Reliability (65/15/20)"
  - "Side-specific ratings track Port/Starboard/Cox separately for dual-side athletes"

patterns-established:
  - "Probability matrix uses ProbabilityPair type with significance testing"
  - "Comparison graph uses nodes/edges/gaps structure for visualization"
  - "Matrix planner uses BIBD-inspired swap schedules with coverage metrics"
  - "Passive tracking weights practice observations at 0.5 vs 1.0 for formal seat races"

# Metrics
duration: 3min
completed: 2026-01-26
---

# Phase 14 Plan 01: Foundation and Type System Summary

**Statistical computing libraries (simple-statistics, jstat, fmin) and comprehensive TypeScript types for Bradley-Terry model, comparison graphs, composite rankings, and side-specific ratings**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-01-26T17:36:53Z
- **Completed:** 2026-01-26T17:39:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Installed statistical computing dependencies for Bradley-Terry MLE and confidence intervals
- Created comprehensive type system covering all Phase 14 features
- Defined Zod validation schemas for API input validation
- Established default weight profiles for composite rankings

## Task Commits

Each task was committed atomically:

1. **Task 1: Install statistical computing dependencies** - `3fccf88` (chore)
2. **Task 2: Create advanced ranking TypeScript types** - `2049f17` (feat)

## Files Created/Modified
- `package.json` - Added simple-statistics@7.8.8, jstat@1.9.6, fmin@0.0.4
- `package-lock.json` - Locked dependency versions
- `src/v2/types/advancedRanking.ts` - Complete type system for Phase 14 features

## Decisions Made

**Statistical library selection:**
- simple-statistics: Pure JavaScript, no native dependencies, good for descriptive stats
- jstat: Probability distributions and statistical tests (confidence intervals)
- fmin: Nelder-Mead optimization for Bradley-Terry maximum likelihood estimation

**Type system design:**
- Bradley-Terry model tracks strength, log-strength, standard error, and 95% CI
- Comparison graph separates nodes (athletes), edges (head-to-head), and gaps (missing comparisons)
- Matrix planner generates swap schedules with coverage and balance metrics
- Composite rankings use weighted combination (onWater + erg + attendance = 1.0)
- Side-specific ratings allow Port/Starboard/Cox tracking for dual-side athletes
- Passive tracking weights practice observations at 0.5 vs 1.0 for formal races

**Default weight profiles:**
- Performance-First: 85% on-water, 10% erg, 5% attendance
- Balanced (default): 75% on-water, 15% erg, 10% attendance
- Reliability: 65% on-water, 15% erg, 20% attendance

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all packages installed successfully, TypeScript types compiled without errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 14-02 (Bradley-Terry Model Implementation):**
- Statistical libraries available for MLE fitting
- BradleyTerryStrength and BradleyTerryModel types defined
- Zod schemas ready for API validation

**Ready for Plan 14-03 (Comparison Graph):**
- ComparisonNode, ComparisonEdge, ComparisonGap types defined
- Graph statistics interface ready for connectivity analysis

**Ready for Plan 14-04 (Matrix Session Planner):**
- SwapSchedule and SwapPiece types defined
- MatrixPlannerInput schema ready for validation

**Ready for Plan 14-05 (Composite Rankings):**
- RankingWeightProfile and CompositeRanking types defined
- DEFAULT_WEIGHT_PROFILES available for UI selection
- Weight validation schema ensures weights sum to 1.0

**Ready for Plan 14-06 (Side-Specific Ratings):**
- SideSpecificRating and AthleteWithSideRatings types defined
- Supports Port/Starboard/Cox rating tracking

**Ready for Plan 14-07 (Passive Tracking):**
- PracticeObservation and PassiveTrackingConfig types defined
- Weight system (0.5 practice, 1.0 formal) established

**No blockers:** Foundation is complete for all Phase 14 implementation plans.

---
*Phase: 14-advanced-seat-racing-analytics*
*Completed: 2026-01-26*
