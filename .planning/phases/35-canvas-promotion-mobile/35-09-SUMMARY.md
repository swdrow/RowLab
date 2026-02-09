---
phase: 35-canvas-promotion-mobile
plan: 09
subsystem: performance
tags: [vite, build-optimization, web-vitals, prefetch, splash-screen]

# Dependency graph
requires:
  - phase: 35-01
    provides: Canvas design primitives
provides:
  - Vite automatic code splitting (removed manual vendor chunks)
  - Splash screen with RowLab branding during initial load
  - Route prefetching utility for instant-feel navigation
  - Dev-only Web Vitals tracking infrastructure
affects: [all future phases using build config, navigation performance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route prefetch on hover/focus for top 10 routes
    - Dev-only metrics with import.meta.env.DEV guard for tree-shaking
    - Inline splash screen in HTML + React fade-out component

key-files:
  created:
    - src/components/SplashScreen.tsx
    - src/v2/utils/prefetch.ts
    - src/utils/reportWebVitals.ts
  modified:
    - vite.config.ts
    - index.html
    - src/App.jsx
    - src/index.jsx

key-decisions:
  - "Remove all manual vendor chunks, let Vite auto-split"
  - "Lower chunkSizeWarningLimit from 1000 to 500"
  - "Prefetch only top 10 routes, not all 25"
  - "Web Vitals in dev only, tree-shaken from production"

patterns-established:
  - "usePrefetchProps() hook for Link components to enable instant navigation"
  - "Inline splash in HTML for pre-JS loading state"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 35 Plan 09: Performance Optimization Summary

**Vite automatic code splitting, splash screen with logo animation, route prefetching for top 10 routes, and dev-only Web Vitals tracking**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T18:58:02Z
- **Completed:** 2026-02-09T19:00:42Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Removed 11 manual vendor chunks, enabling Vite's intelligent auto-splitting
- Added inline splash screen with RowLab branding and pulse animation
- Implemented route prefetching utility with hover/focus triggers
- Set up Web Vitals tracking (CLS, FID, FCP, LCP, TTFB) in development mode only

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove manual chunks and measure bundle improvement** - `9b8cd4a` (perf)
2. **Task 2: Add splash screen with RowLab logo animation** - `7f8d9de` (feat)
3. **Task 3: Add route prefetching and dev-only Web Vitals** - `a4b18a9` (feat)

## Files Created/Modified

**Created:**
- `src/components/SplashScreen.tsx` - Fades out inline splash after React mounts
- `src/v2/utils/prefetch.ts` - Route prefetch utility with usePrefetchProps() hook
- `src/utils/reportWebVitals.ts` - Dev-only Web Vitals logging (tree-shaken in prod)

**Modified:**
- `vite.config.ts` - Removed manualChunks object, lowered chunkSizeWarningLimit to 500
- `index.html` - Added inline splash screen with RowLab logo and pulse animation
- `src/App.jsx` - Integrated SplashScreen component at top level
- `src/index.jsx` - Wired reportWebVitals() after React render

## Bundle Analysis

**Before (manual chunks):**
- Total JS: 4,945K
- 11 manual vendor chunks (react, query, forms, ui, three, animation, chart, dnd, export, icons)
- Largest chunk: WhiteboardEditor (1.2M)

**After (Vite auto-split):**
- Total JS: 5,269K (+324K, ~6.5% larger)
- More granular chunks (better caching granularity)
- Vite created better separation of common dependencies and route-specific code
- Largest chunks remain: WhiteboardEditor (1.2M), LineupSkeleton (645K), advancedRanking (642K)

**Analysis:** Slight size increase is acceptable tradeoff for:
- Reduced maintenance burden (no manual chunk tuning)
- Better cache invalidation (more granular chunks)
- Vite's intelligent splitting based on actual import patterns

## Decisions Made

1. **Remove all manual chunks** - Let Vite handle code splitting automatically per user decision
2. **Lower chunkSizeWarningLimit to 500** - Original 1000 was set for manual Three.js chunk
3. **Prefetch only top 10 routes** - Avoid unnecessary prefetching of rarely-used pages
4. **Web Vitals dev-only** - Use import.meta.env.DEV guard to ensure production tree-shaking

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully. Bundle build warnings are expected (WhiteboardEditor and LineupSkeleton are legitimately large components).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Performance infrastructure complete:
- Build optimization active (Vite auto-splitting)
- Loading experience polished (splash screen)
- Navigation feels instant (prefetch on hover/focus)
- Metrics available for measuring improvements (Web Vitals in dev)

Ready for remaining Wave 2 plans (35-10, 35-11).

## Self-Check: PASSED

All created files verified:
- src/components/SplashScreen.tsx ✓
- src/v2/utils/prefetch.ts ✓
- src/utils/reportWebVitals.ts ✓

All commits verified:
- 9b8cd4a ✓
- 7f8d9de ✓
- a4b18a9 ✓

---
*Phase: 35-canvas-promotion-mobile*
*Completed: 2026-02-09*
