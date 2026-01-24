---
phase: 08
plan: 07
title: "Live Biometrics Display"
subsystem: lineup-builder
tags: [biometrics, statistics, real-time, ux]

requires:
  - phase: 08
    plan: 02
    provides: lineup-workspace-foundation

provides:
  - live-biometrics-calculation
  - average-weight-height-display
  - erg-2k-statistics
  - per-boat-and-total-stats

affects:
  - future-phases: []

tech-stack:
  added: []
  patterns:
    - useMemo-performance-optimization
    - zustand-subscription-reactivity

key-files:
  created:
    - src/v2/utils/biometricsCalculations.ts
    - src/v2/components/lineup/BiometricsPanel.tsx
  modified:
    - src/v2/components/lineup/LineupWorkspace.tsx
    - src/v2/components/lineup/index.ts

decisions:
  - id: BIOM-01
    decision: "Exclude coxswains from erg averages"
    rationale: "Coxswains don't row, so their erg times (if they have any) shouldn't affect boat averages"
    impact: "More accurate performance metrics for rowing lineups"

  - id: BIOM-02
    decision: "Parse 2k times from latestErgTest.time field"
    rationale: "Athletes have latestErgTest with testType and time in MM:SS.s format"
    impact: "Need to parse time string to seconds for calculations"

  - id: BIOM-03
    decision: "Show panel only when boats exist"
    rationale: "Empty state is handled within BiometricsPanel, but no need to show when no boats at all"
    impact: "Cleaner workspace when starting from scratch"

  - id: BIOM-04
    decision: "Position panel below toolbar, above boats"
    rationale: "Always visible (Option A from plan), doesn't require sidebar space"
    impact: "Horizontal strip layout - compact and accessible"

metrics:
  duration: 4.5min
  completed: 2026-01-24
---

# Phase 08 Plan 07: Live Biometrics Display Summary

> Implemented live biometrics panel showing average weight, height, and 2k split for lineup athletes

## What Was Built

### Biometrics Calculation Utility (biometricsCalculations.ts)
Created comprehensive utility for calculating lineup statistics:
- **calculateBoatBiometrics**: Per-boat averages with min/max ranges
- **calculateTotalBiometrics**: Aggregated stats across all boats with deduplication
- **Athlete extraction**: Separate handling for rowers (seats) and coxswains
- **2k parsing**: Parse MM:SS.s format from latestErgTest to seconds
- **Formatting**: Weight (kg), height (cm), and split (MM:SS.s) display formatters
- **Edge cases**: Null handling, missing data, empty boats

### BiometricsPanel Component
Live statistics display that updates with lineup changes:
- **Automatic updates**: Subscribes to activeBoats from lineupStore
- **Performance optimization**: useMemo prevents recalculation during drag
- **Multi-boat support**: Shows per-boat stats when multiple boats exist
- **Total statistics**: Combined stats across all assigned athletes
- **Empty state**: "No athletes assigned" when no assignments
- **Compact layout**: Grid display with value and range (min-max)
- **V2 design tokens**: Consistent styling with border, background, text colors

### Workspace Integration
Added panel to lineup builder workflow:
- **Position**: Below toolbar, above boat area (Option A - horizontal strip)
- **Conditional render**: Only shows when boats exist
- **Real-time updates**: Changes on drag end (activeBoats update)
- **No layout shift**: Fixed positioning prevents jarring updates

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### Coxswain Handling
**Decision**: Exclude coxswains from erg averages but include in weight/height stats.

**Reasoning**: Coxswains don't row, so their erg times (if recorded) shouldn't affect performance metrics. However, they contribute to boat weight, so include them in biometric averages.

**Implementation**:
```typescript
// Separate rowers and all athletes
const { all, rowers } = getBoatAthletes(boat);

// Weight/height use all athletes
const weights = all.map(a => a.weightKg).filter(w => w !== null);

// 2k stats use only rowers
const erg2kTimes = rowers.map(a => parse2kTime(a)).filter(t => t !== null);
```

### Data Parsing Strategy
**Decision**: Parse 2k times from `latestErgTest.time` field in MM:SS.s format.

**Reasoning**: Athletes have `latestErgTest` property with `testType` and `time`. Need to:
1. Check if latest test is "2k" type
2. Parse time string (e.g., "6:32.5") to seconds
3. Return null if no 2k test exists

**Edge cases handled**:
- No latestErgTest property
- Test type is not "2k"
- Time format doesn't match regex
- Partial time values (missing tenths)

### Performance Optimization
**Decision**: Use useMemo for biometrics calculation.

**Reasoning**: Calculations happen on every render. During drag operations, LineupWorkspace re-renders frequently but activeBoats doesn't change until drag end. useMemo prevents recalculation until activeBoats actually changes.

**Result**: Smooth drag experience, no calculation overhead during drag motion.

## Verification Results

All verification criteria met:
- ✅ BiometricsPanel shows in lineup builder workspace
- ✅ Adding athlete to seat updates averages immediately
- ✅ Removing athlete updates averages immediately
- ✅ Swapping athletes updates averages correctly
- ✅ Per-boat and total statistics both shown
- ✅ Missing data handled gracefully (shows "--" not errors)
- ✅ Format is readable (proper units, decimal places)

## Example Output

**Single boat with 3 athletes assigned**:
```
Lineup Biometrics                                          3 athletes
─────────────────────────────────────────────────────────────────
Weight          Height          2k Avg
78.5 kg         186 cm          6:32.5
Range: 72-85 kg Range: 178-195 cm  Range: 6:28.0 - 6:40.0
```

**Multiple boats**:
```
Lineup Biometrics                                          8 athletes
─────────────────────────────────────────────────────────────────
Total
Weight: 77.2 kg    Height: 184 cm    2k Avg: 6:35.0

Varsity 8+ - Seaweed
Weight: 78.0 kg    Height: 185 cm    2k Avg: 6:32.0

JV 8+ - Kelp
Weight: 76.5 kg    Height: 183 cm    2k Avg: 6:38.0
```

## LINE-12 Completion

✅ **Requirement**: System displays average biometrics as lineup is built

**Implementation**:
- Averages for weight (kg), height (cm), and 2k split (MM:SS.s)
- Updates in real-time as athletes are assigned/removed
- Per-boat stats for detailed comparison
- Total stats for overall lineup assessment
- Graceful handling of missing data

**Coach workflow**:
1. Add boat to workspace
2. Drag athletes to seats
3. BiometricsPanel updates showing averages
4. Compare per-boat stats when building multiple boats
5. Make informed decisions based on live metrics

## Commits

| Hash | Message |
|------|---------|
| 4c02a24 | feat(08-07): create biometricsCalculations utility |
| ad57efb | feat(08-07): create BiometricsPanel component |
| 894880f | feat(08-07): integrate BiometricsPanel into LineupWorkspace |

## Next Phase Readiness

**Ready for**: Plan 08-08+ (version history, PDF export, margin visualizer)

**Blockers**: None

**Concerns**: None

**Dependencies satisfied**:
- ✅ LineupWorkspace exists (08-02)
- ✅ activeBoats in lineupStore (08-02)
- ✅ Athlete type with weightKg, heightCm (existing)
- ✅ latestErgTest data (existing)

## Files Changed

**Created**:
- `src/v2/utils/biometricsCalculations.ts` (267 lines)
- `src/v2/components/lineup/BiometricsPanel.tsx` (180 lines)

**Modified**:
- `src/v2/components/lineup/LineupWorkspace.tsx` (+6 lines)
- `src/v2/components/lineup/index.ts` (+1 export)

**Total**: 453 lines added

---

**Plan Duration**: 4.5 minutes
**Completed**: 2026-01-24 20:16 UTC
**Status**: ✅ Complete - LINE-12 implemented
