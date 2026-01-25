---
phase: 12-settings-photos-polish
plan: 05
subsystem: ui
tags: [settings, billing, stripe, team-visibility, zustand]

# Dependency graph
requires:
  - phase: 12-settings-photos-polish
    plan: 02
    provides: useTeamSettings, useUpdateTeamVisibility hooks
  - phase: 12-settings-photos-polish
    plan: 01
    provides: Toast system, LoadingSkeleton, SPRING_CONFIG
provides:
  - TeamSection component for athlete visibility settings
  - BillingSection component for subscription management
  - UsageBar component for resource usage display
  - PlanCard component for subscription plan display
affects: [12-06, settings-page-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [v1-store-integration, section-component-pattern, access-control-pattern]

key-files:
  created:
    - src/v2/features/settings/components/TeamSection.tsx
    - src/v2/features/settings/components/BillingSection.tsx
    - src/v2/features/settings/components/UsageBar.tsx
    - src/v2/features/settings/components/PlanCard.tsx
  modified: []

key-decisions:
  - "V1 subscriptionStore for Stripe integration preserves backward compatibility"
  - "Animated Toggle with SPRING_CONFIG for consistent micro-interactions"
  - "Section component pattern with accent colors for visual hierarchy"
  - "Access restriction pattern for owner-only billing features"

patterns-established:
  - "Owner-gated sections with AccessRestricted fallback"
  - "Loading skeleton per section for progressive disclosure"
  - "Toast notifications for mutation feedback"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 12 Plan 05: Team & Billing Sections Summary

**Team visibility controls and subscription billing management for team owners with Stripe integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T17:28:25Z
- **Completed:** 2026-01-25T17:31:27Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments

- TeamSection with three visibility toggles (rankings, erg data, lineups)
- BillingSection with current plan, usage stats, and Stripe portal
- UsageBar with color-coded progress (normal/near-limit/at-limit)
- PlanCard with status badge and billing date formatting
- Access restriction for non-owner billing access
- Toast notifications for save confirmation/errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TeamSection component** - `a16f957` (feat)
2. **Task 2: Create UsageBar and PlanCard components** - `4467ab1` (feat)
3. **Task 3: Create BillingSection component** - `ee142b9` (feat)

## Files Created

- `src/v2/features/settings/components/TeamSection.tsx` - Athlete visibility settings with animated toggles
- `src/v2/features/settings/components/UsageBar.tsx` - Progress bar for resource usage display
- `src/v2/features/settings/components/PlanCard.tsx` - Subscription plan card with Stripe integration
- `src/v2/features/settings/components/BillingSection.tsx` - Complete billing management section

## Decisions Made

- **V1 subscriptionStore integration**: Used existing Zustand store for Stripe billing operations instead of creating new TanStack Query hooks, maintains backward compatibility with V1 billing page
- **Section component pattern**: Reusable Section component with accent color configuration (violet/green/orange) for visual hierarchy
- **Animated Toggle**: Custom Toggle component using Framer Motion with SPRING_CONFIG for consistent animation feel
- **Access restriction pattern**: AccessRestricted component shows clear message for non-owners trying to access billing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components created successfully following established V2 patterns.

## User Setup Required

None - billing and team settings use existing API endpoints.

## Next Phase Readiness

- Team and Billing sections ready for integration into SettingsPage shell (Plan 03)
- All must_haves verified:
  - Team owner can toggle athlete visibility settings
  - Team owner can view current subscription plan
  - Team owner can see usage statistics (athletes, coaches)
  - Manage Billing button redirects to Stripe portal
  - Non-owner sees access restricted message on billing tab

---
*Phase: 12-settings-photos-polish*
*Completed: 2026-01-25*
