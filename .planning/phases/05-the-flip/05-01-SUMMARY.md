---
phase: 05-the-flip
plan: 01
subsystem: state-management
tags: [zustand, localStorage, react-router, version-switching]

# Dependency graph
requires:
  - phase: 04-migration-loop
    provides: V2 coach features complete, ready for flip preparation
provides:
  - Zustand store for user legacy mode preference with localStorage persistence
  - React hook for automatic version redirects based on preference
  - Foundation for FLIP-04 user opt-in capability
affects: [05-02-flip-mechanics, 05-03-v1-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Manual localStorage integration in Zustand store (simpler than persist middleware)
    - Version redirect hook with excluded auth routes
    - Route mapping between V1 and V2 versions

key-files:
  created:
    - src/v2/stores/userPreferenceStore.ts
    - src/v2/hooks/useVersionRedirect.ts
  modified:
    - tsconfig.json

key-decisions:
  - "Default to V2 (useLegacyMode: false) — V2 is the primary experience"
  - "Manual localStorage over persist middleware — simpler pattern matching research"
  - "Exclude auth routes from redirect logic — prevents login loop scenarios"
  - "Use replace: true for redirects — avoids polluting browser history"

patterns-established:
  - "SSR-safe localStorage access with typeof window checks"
  - "Route mapping with fallback to home for unmapped paths"
  - "Preference change triggers immediate redirect via useEffect"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 5 Plan 01: User Preference Store Summary

**Zustand store with localStorage persistence and version redirect hook for legacy mode opt-in**

## Performance

- **Duration:** 2 min 9 sec
- **Started:** 2026-01-23T23:37:04Z
- **Completed:** 2026-01-23T23:39:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- User preference store with typed state (useLegacyMode, setLegacyMode, clearPreference)
- localStorage persistence to rowlab_use_legacy key with default false (V2 mode)
- Version redirect hook with route mapping between V1 and V2
- SSR-safe implementation with typeof window guards

## Task Commits

Each task was committed atomically:

1. **Task 1: Create userPreferenceStore with localStorage persistence** - `09cf59d` (feat)
2. **Task 2: Create useVersionRedirect hook** - `2b76080` (feat)

**Deviation fix:** `dba8a3f` (fix: add @v2 path alias to tsconfig.json)

## Files Created/Modified
- `src/v2/stores/userPreferenceStore.ts` - Zustand store for legacy mode preference, persists to localStorage
- `src/v2/hooks/useVersionRedirect.ts` - Hook that redirects between V2 and /legacy based on preference
- `tsconfig.json` - Added @v2 path alias for TypeScript module resolution

## Decisions Made

**1. Default to V2 mode (useLegacyMode: false)**
- V2 is the primary experience; legacy mode is opt-in
- Matches FLIP-04 strategy: V2 first, fallback to V1 available

**2. Manual localStorage over Zustand persist middleware**
- Simpler pattern matching 05-RESEARCH.md findings
- Direct control over storage key and serialization
- Fewer abstractions to debug

**3. Exclude auth routes from redirect logic**
- Prevents login loops when switching versions
- Auth routes (/login, /register, /join, /concept2/callback, /settings/integrations) work in both versions

**4. Use replace: true for navigation**
- Avoids polluting browser history with redirects
- User back button behavior is cleaner

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added @v2 path alias to tsconfig.json**
- **Found during:** Task 2 (useVersionRedirect implementation)
- **Issue:** TypeScript couldn't resolve @v2 imports despite Vite config having the alias
- **Fix:** Added "@v2/*": ["src/v2/*"] to tsconfig.json paths configuration
- **Files modified:** tsconfig.json
- **Verification:** Full project TypeScript compilation succeeds, no errors in new files
- **Committed in:** dba8a3f (separate fix commit)

**2. [Rule 2 - Missing Critical] Added SSR-safe localStorage guards**
- **Found during:** Task 1 (userPreferenceStore implementation)
- **Issue:** localStorage access would crash during server-side rendering (Vite SSR scenarios)
- **Fix:** Added `typeof window !== 'undefined'` checks before localStorage access
- **Files modified:** src/v2/stores/userPreferenceStore.ts
- **Verification:** Store initializes with default false when window unavailable
- **Committed in:** 09cf59d (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both missing critical configuration)
**Impact on plan:** Both essential for correct operation. tsconfig fix enables TypeScript to resolve existing @v2 imports used throughout codebase. SSR guards prevent crashes in edge cases.

## Issues Encountered
None - execution proceeded as planned after auto-fixes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

**Ready for 05-02 (Flip Mechanics):**
- ✓ Preference store infrastructure complete
- ✓ Redirect hook ready to integrate into App component
- ✓ Route mapping logic established
- ✓ localStorage key defined (rowlab_use_legacy)

**No blockers.** Ready to proceed with flip switch implementation and UI toggle.

---
*Phase: 05-the-flip*
*Completed: 2026-01-23*
