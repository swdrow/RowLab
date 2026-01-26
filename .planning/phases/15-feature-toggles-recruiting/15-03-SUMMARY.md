---
phase: 15-feature-toggles-recruiting
plan: 03
subsystem: ui-components
tags: [react, feature-guards, navigation, framer-motion, zustand]

# Dependency graph
requires:
  - phase: 15-feature-toggles-recruiting
    plan: 01
    provides: Feature preference store and hooks
affects: [15-04, 15-05, 15-06, 15-07, 15-08, 15-09, navigation-filtering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FeatureGuard render prop pattern with default/Hidden variants"
    - "Feature-based navigation filtering with route mapping"
    - "Discovery hints with Framer Motion animations"

key-files:
  created:
    - src/v2/components/common/FeatureGuard.tsx
    - src/v2/components/common/FeatureDiscoveryHint.tsx
  modified:
    - src/v2/components/shell/WorkspaceSidebar.tsx
    - src/v2/components/common/index.ts

key-decisions:
  - "FeatureGuard.Hidden variant returns null (for navigation items) vs default shows FeatureDiscoveryHint"
  - "Navigation filtering uses route-to-feature mapping with null for always-visible core routes"
  - "Discovery hint links to /app/settings?tab=features for feature enablement"
  - "Zustand store selector pattern (isFeatureEnabled) for reactive navigation updates"

patterns-established:
  - "Feature guard component composition (render children when enabled, fallback when disabled)"
  - "Discovery hint as default fallback UI with lock icon and settings link"
  - "Route-to-feature mapping constant for declarative navigation filtering"
  - "Framer Motion fade-in for feature discovery hints"

# Metrics
duration: 5.5min
completed: 2026-01-26
---

# Phase 15 Plan 03: FeatureGuard Components Summary

**Feature guard components with navigation filtering - conditional rendering and discovery hints for progressive feature unlocks**

## Performance

- **Duration:** 5 min 30 sec
- **Started:** 2026-01-26T20:24:39Z
- **Completed:** 2026-01-26T20:30:09Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 2

## Accomplishments

- Created FeatureGuard component with default and Hidden variants for conditional rendering
- Created FeatureDiscoveryHint component with lock icon, feature name/description, and settings link
- Integrated feature-based navigation filtering into WorkspaceSidebar
- Exported components from common/index.ts for easy importing
- Navigation automatically hides/shows based on feature toggle state (reactive)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FeatureGuard and FeatureDiscoveryHint components** - `d881ee6` (feat)
2. **Task 2: Update WorkspaceSidebar to filter navigation by features** - `61493ed` (feat)
3. **Task 3: Export components and add to common index** - `7e6ff0d` (feat)

## Files Created/Modified

### Created

- **src/v2/components/common/FeatureGuard.tsx** - Component with two variants:
  - Default: Shows children when enabled, FeatureDiscoveryHint (or custom fallback) when disabled
  - Hidden: Shows children when enabled, null when disabled (for navigation)
  - Uses useFeature hook for reactive feature state

- **src/v2/components/common/FeatureDiscoveryHint.tsx** - Discovery hint UI:
  - Lock icon from lucide-react
  - Feature name (bold) and description from ALL_FEATURES lookup
  - "Enable in Settings" link to /app/settings?tab=features
  - Dashed border, muted background, centered content
  - Framer Motion fade-in animation (opacity 0→1, y 10→0, 300ms)

### Modified

- **src/v2/components/shell/WorkspaceSidebar.tsx** - Navigation filtering:
  - Import useFeaturePreferenceStore and FeatureId
  - Define NAV_ITEM_FEATURES mapping (route paths to feature IDs or null)
  - Filter navItems before rendering based on isFeatureEnabled
  - Core routes (null mapping) always visible
  - Advanced routes only visible when feature enabled
  - Updated component documentation to reflect feature filtering

- **src/v2/components/common/index.ts** - Added exports for FeatureGuard and FeatureDiscoveryHint

## Decisions Made

1. **FeatureGuard Variants**: Created two variants for different use cases - default variant shows discovery hint when disabled (for page content), Hidden variant returns null (for navigation items that should disappear)

2. **Navigation Filtering Strategy**: Use declarative route-to-feature mapping (NAV_ITEM_FEATURES) rather than inline conditionals. Routes map to null (always visible core features) or FeatureId (feature-gated advanced features)

3. **Discovery Hint Design**: Show lock icon, feature name/description from config, and direct link to settings. This educates users about available features without being intrusive

4. **Reactive Navigation**: Use Zustand store selector pattern (useFeaturePreferenceStore(state => state.isFeatureEnabled)) so navigation automatically updates when features are toggled (no page refresh needed)

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- ✅ FeatureGuard renders children when feature enabled, fallback when disabled
- ✅ FeatureDiscoveryHint shows feature name, description, and settings link
- ✅ Navigation filters out disabled advanced features
- ✅ Core features always appear in navigation
- ✅ Feature toggle in settings immediately updates navigation (Zustand reactivity)

## Issues Encountered

None - all tasks completed without issues. Build succeeds with new components.

## User Setup Required

None - components integrate with existing feature preference store from plan 15-01.

## Next Phase Readiness

**Ready for:**
- 15-04+: Individual feature implementations can use FeatureGuard for conditional rendering
- Any page can use `<FeatureGuard featureId="recruiting">` to gate content
- Navigation automatically adapts as features are enabled

**Foundation established:**
- FeatureGuard component for conditional rendering
- FeatureDiscoveryHint for feature education
- Navigation filtering infrastructure
- Reactive updates via Zustand store

**Usage patterns:**

```tsx
// Page content (shows discovery hint when disabled)
<FeatureGuard featureId="recruiting">
  <RecruitingDashboard />
</FeatureGuard>

// Navigation item (hides when disabled)
<FeatureGuard.Hidden featureId="recruiting">
  <NavLink to="/recruiting">Recruiting</NavLink>
</FeatureGuard.Hidden>

// Custom fallback
<FeatureGuard
  featureId="matrix-seat-racing"
  fallback={<CustomMessage />}
>
  <MatrixView />
</FeatureGuard>
```

**No blockers or concerns.**

---
*Phase: 15-feature-toggles-recruiting*
*Completed: 2026-01-26*
