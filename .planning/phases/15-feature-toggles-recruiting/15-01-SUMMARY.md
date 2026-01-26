---
phase: 15-feature-toggles-recruiting
plan: 01
subsystem: state-management
tags: [zustand, typescript, feature-toggles, localStorage, hooks]

# Dependency graph
requires:
  - phase: 12-settings-photos-polish
    provides: Settings infrastructure and Zustand store patterns
provides:
  - Feature toggle type system with core vs advanced distinction
  - Zustand store with localStorage persistence for feature preferences
  - React hooks for checking and controlling feature state
affects: [15-02, 15-03, 15-04, 15-05, 15-06, 15-07, 15-08, 15-09, settings-ui, navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Feature preference store with persist middleware"
    - "Core features always enabled, advanced features toggleable"
    - "Multiple hook abstractions (full, simple, group-level)"

key-files:
  created:
    - src/v2/types/feature-toggles.ts
    - src/v2/stores/featurePreferenceStore.ts
    - src/v2/hooks/useFeaturePreference.ts
  modified: []

key-decisions:
  - "Core features (6) always return enabled=true, cannot be toggled off"
  - "Advanced features (7) default to disabled, can be toggled by user"
  - "Use Zustand persist middleware with localStorage for team-level preferences"
  - "Provide multiple hook abstractions: full (useFeaturePreference), simple (useFeature), group-level (useFeatureGroup)"

patterns-established:
  - "Feature IDs as literal union type for type safety"
  - "SSR-safe localStorage access with typeof window check"
  - "Store actions no-op for core features (safety checks)"
  - "Comprehensive JSDoc examples in hook definitions"

# Metrics
duration: 2.5min
completed: 2026-01-26
---

# Phase 15 Plan 01: Feature Preference Store Summary

**Zustand store with localStorage persistence for progressive feature unlocks, 13 features (6 core + 7 advanced) with type-safe hooks**

## Performance

- **Duration:** 2 min 35 sec
- **Started:** 2026-01-26T20:12:40Z
- **Completed:** 2026-01-26T20:15:15Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created complete TypeScript type system for 13 features (6 core, 7 advanced)
- Implemented Zustand store with persist middleware and localStorage under 'rowlab-feature-preferences' key
- Built four React hooks: useFeaturePreference (full), useFeature (simple), useFeatureGroup, useFeatureGroups
- Core features always return enabled=true regardless of store state (safety mechanism)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create feature toggle TypeScript types** - `76b0032` (feat)
2. **Task 2: Create feature preference Zustand store** - `1812f9f` (feat)
3. **Task 3: Create useFeaturePreference hook** - `06248cb` (feat)

## Files Created/Modified

- `src/v2/types/feature-toggles.ts` - TypeScript types: FeatureId (13 features), FeatureConfig, FeatureGroup, FeaturePreferenceState. Constants: CORE_FEATURES, ADVANCED_FEATURES, ALL_FEATURES, FEATURE_GROUPS
- `src/v2/stores/featurePreferenceStore.ts` - Zustand store with persist middleware, localStorage key 'rowlab-feature-preferences'. Actions: toggleFeature, enableFeature, disableFeature, resetToDefaults. Computed: isFeatureEnabled (always true for core)
- `src/v2/hooks/useFeaturePreference.ts` - Four hooks with comprehensive JSDoc examples: useFeaturePreference (enabled/toggle/isCore), useFeature (boolean only), useFeatureGroup (group features with state), useFeatureGroups (all groups)

## Decisions Made

1. **Core vs Advanced Feature Split**: 6 core features (roster, attendance, lineup-builder, erg-data, training-calendar, basic-seat-racing) always enabled. 7 advanced features (matrix-seat-racing, bradley-terry, periodization, tss-tracking, ncaa-compliance, racing-regattas, recruiting) toggleable
2. **Store Safety Checks**: All toggle/enable/disable actions check `isCoreFeature()` and no-op for core features, ensuring core features cannot be accidentally disabled
3. **Multiple Hook Abstractions**: Provide both full-featured hook (useFeaturePreference with toggle) and simple boolean hook (useFeature) for different use cases
4. **SSR Safety**: Use `typeof window !== 'undefined'` check before localStorage access, following existing userPreferenceStore pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. TypeScript compilation successful with `--skipLibCheck` flag (pre-existing node_modules TypeScript errors unrelated to new code).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- 15-02: Feature discovery UI (can consume hooks to show feature groups)
- 15-03: Settings integration (can use useFeatureGroup to build toggle UI)
- 15-04+: Individual feature implementations can use useFeature for conditional rendering

**Foundation established:**
- Type-safe feature identification system
- Persistent preference storage
- Multiple ergonomic hooks for different use cases
- Safety guarantees (core features always enabled)

**No blockers or concerns.**

---
*Phase: 15-feature-toggles-recruiting*
*Completed: 2026-01-26*
