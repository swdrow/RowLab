---
phase: 15-feature-toggles-recruiting
plan: 02
subsystem: ui
tags: [react, zustand, settings, feature-toggles, permissions]

# Dependency graph
requires:
  - phase: 15-01
    provides: Feature toggle type system and store with localStorage persistence
provides:
  - Feature toggle settings UI with permission-based editing
  - FeatureToggleRow component with animated toggle switch
  - FeatureGroupCard component for organizing features by category
  - FeaturesSection integrated into settings page
affects: [15-03, recruiting, seat-racing, training]

# Tech tracking
tech-stack:
  added: []
  patterns: [permission-based-ui, animated-toggles, feature-group-cards]

key-files:
  created:
    - src/v2/features/settings/components/FeatureToggleRow.tsx
    - src/v2/features/settings/components/FeatureGroupCard.tsx
    - src/v2/features/settings/components/FeaturesSection.tsx
  modified:
    - src/v2/types/settings.ts
    - src/v2/features/settings/components/SettingsTabs.tsx
    - src/v2/features/settings/pages/SettingsPage.tsx
    - src/v2/features/settings/components/index.ts

key-decisions:
  - "Use permission check (OWNER/ADMIN) to control feature toggle editing"
  - "Show 'Always on' badge for core features instead of disabled toggle"
  - "Display info banners explaining core vs advanced features"
  - "Use animated toggle switch matching existing V2 design patterns"

patterns-established:
  - "FeatureToggleRow: Standard pattern for feature toggle UI with description and control"
  - "FeatureGroupCard: Card-based grouping with header, info banner, and feature list"
  - "Permission-based editing: Only OWNER/ADMIN can toggle, others see view-only state"

# Metrics
duration: 4min
completed: 2026-01-26
---

# Phase 15 Plan 02: Feature Toggle Settings UI Summary

**Feature toggle settings UI with animated switches, permission checks, and core/advanced feature grouping**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-26T20:24:39Z
- **Completed:** 2026-01-26T20:28:44Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Created "Features" tab in settings navigation with ToggleLeft icon
- Built FeatureToggleRow component with animated toggle switch and "Always on" badge for core features
- Built FeatureGroupCard component with info banners explaining feature types
- Integrated FeaturesSection into SettingsPage with permission-based editing (OWNER/ADMIN only)
- Connected to featurePreferenceStore for persistent toggle state in localStorage

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 'features' tab type and update SettingsTabs** - `c10e32b` (feat)
   - Added 'features' to SettingsTab type
   - Imported ToggleLeft icon from lucide-react
   - Added features tab to navigation before team tab

2. **Task 2: Create FeatureToggleRow and FeatureGroupCard components** - `6f0d236` (feat)
   - FeatureToggleRow displays feature with toggle or "Always on" badge
   - Animated toggle switch with glow effect when enabled
   - FeatureGroupCard groups related features with header and info banners
   - Both components support disabled state for non-admin users

3. **Task 3: Create FeaturesSection and integrate into SettingsPage** - `229c539` (feat)
   - FeaturesSection manages feature toggles with permission checks
   - Shows info banner for non-admin users (view only)
   - Displays core and advanced feature groups
   - Connected to featurePreferenceStore for state management
   - Added to SettingsPage tab routing with validTabs update

## Files Created/Modified

- `src/v2/types/settings.ts` - Added 'features' to SettingsTab type
- `src/v2/features/settings/components/SettingsTabs.tsx` - Added ToggleLeft icon and features tab
- `src/v2/features/settings/components/FeatureToggleRow.tsx` - Individual feature toggle row component
- `src/v2/features/settings/components/FeatureGroupCard.tsx` - Feature group card with info banners
- `src/v2/features/settings/components/FeaturesSection.tsx` - Main features section with permission checks
- `src/v2/features/settings/pages/SettingsPage.tsx` - Added features tab routing
- `src/v2/features/settings/components/index.ts` - Exported new components

## Decisions Made

**1. Permission-based editing (OWNER/ADMIN only)**
- Rationale: Feature toggles affect entire team, so only team owners and admins should control them
- Implementation: Check activeTeamRole in FeaturesSection, pass canEdit to child components
- Non-admin users see view-only state with info banner

**2. "Always on" badge for core features**
- Rationale: Core features cannot be toggled off, so showing a disabled toggle would be confusing
- Implementation: FeatureToggleRow checks feature.group === 'core' and shows badge instead of toggle
- Provides clear visual distinction between core and advanced features

**3. Info banners for feature groups**
- Rationale: Users need context about why core features are always enabled and how to use advanced features
- Implementation: FeatureGroupCard shows different banners for 'core' and 'advanced' groups
- Helps with feature discovery and understanding

**4. Animated toggle switch pattern**
- Rationale: Consistent with existing V2 PreferencesSection toggle implementation
- Implementation: Motion span with spring animation, glow effect when enabled
- Maintains V2 design system cohesion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation followed V2 patterns established in PreferencesSection (Toggle component, SettingRow pattern, SectionCard layout).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- 15-03: FeatureGuard wrapper components to conditionally render features
- Any phase that needs to check if advanced features are enabled
- Recruiting features (15-04+) that will use feature guards

**Provides:**
- Working feature toggle UI accessible at Settings > Features tab
- Permission system preventing non-admins from changing settings
- Visual distinction between core (always on) and advanced (toggleable) features
- localStorage persistence of toggle state via featurePreferenceStore

**Notes:**
- Core features are always enabled regardless of store state (enforced in store logic)
- Advanced features default to disabled and can be toggled by OWNER/ADMIN
- UI follows V2 design system (surfaces, colors, typography, animations)

---
*Phase: 15-feature-toggles-recruiting*
*Completed: 2026-01-26*
