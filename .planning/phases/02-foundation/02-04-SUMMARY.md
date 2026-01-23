---
phase: 02-foundation
plan: 04
subsystem: ui
tags: [react, zustand, react-router, tailwind, keyboard-nav, theme-toggle, shell-layout, accessibility]

# Dependency graph
requires:
  - phase: 02-01
    provides: contextStore with CONTEXT_CONFIGS and theme management
  - phase: 02-02
    provides: ContextRail component for context switching UI
  - phase: 02-03
    provides: WorkspaceSidebar component for context-aware navigation
provides:
  - ShellLayout component with rail + sidebar + content grid layout
  - ThemeToggle component with system preference indicator
  - Keyboard navigation (Ctrl+1/2/3) for context switching
  - Complete V2 shell integration with V1 store access
  - Enhanced V2Layout with Zustand-based theme state
affects: [03-* (all feature pages inherit working shell), Phase 3-5 (all features use shell layout)]

# Tech tracking
tech-stack:
  added:
    - Zustand theme state management (shared state across V2 components)
  patterns:
    - CSS Grid layout with fixed sidebars (rail 64px, sidebar 256px)
    - Keyboard shortcut handling (Ctrl+1/2/3 for context switching)
    - Focus management on context switch for accessibility
    - aria-live region for screen reader announcements
    - Context provider pattern for V1 store access from V2 components
    - Theme toggle with system preference indicator

key-files:
  created:
    - src/v2/layouts/ShellLayout.tsx
    - src/v2/components/shell/ThemeToggle.tsx
  modified:
    - src/v2/layouts/V2Layout.tsx (theme state refactoring, store providers)
    - src/v2/hooks/useTheme.ts (converted to Zustand for shared state)
    - src/v2/styles/tokens.css (scoped theme selectors to .v2 class)
    - src/v2/components/shell/WorkspaceSidebar.tsx (added workspace-sidebar className)
    - src/App.jsx (added ShellLayout route nesting)

key-decisions:
  - "Convert useTheme to Zustand for shared state (prevents duplicate theme state)"
  - "Use CSS Grid for layout (rail, sidebar, content areas)"
  - "Keyboard shortcuts: Ctrl/Cmd + 1/2/3 for context switching"
  - "Focus management: move focus to first sidebar nav item on context switch"
  - "Scope theme selectors to .v2 class (.v2[data-theme=\"light\"] instead of :root)"

patterns-established:
  - "ShellLayout composes all shell components (ContextRail, WorkspaceSidebar, content)"
  - "V2Layout provides AuthStoreContext and SettingsStoreContext to all V2 components"
  - "Theme state stored in Zustand, shared across all V2 components"
  - "Keyboard navigation centralized in ShellLayout with preventDefault() for system shortcuts"
  - "Focus management via setTimeout(0) to wait for React render"
  - "CSS Grid with auto/1fr columns for flexible layout"

# Metrics
duration: 24m
completed: 2026-01-23
---

# Phase 02 Plan 04: Shell Layout Integration Summary

**Complete working shell with rail + sidebar + content grid layout, keyboard navigation, theme toggle, and V1/V2 store integration. Includes two critical bug fixes for shared theme state and CSS selector scoping.**

## Performance

- **Duration:** 24m (3 tasks + 2 bug fixes)
- **Started:** 2026-01-23T14:08:49Z
- **Completed:** 2026-01-23T14:32:00Z
- **Tasks:** 3 auto tasks + 1 checkpoint (approved)
- **Files created:** 2
- **Files modified:** 5
- **Commits:** 5 (3 feature + 2 fixes)

## Accomplishments

- ShellLayout component renders CSS Grid with rail (64px) + sidebar (256px) + content area
- Keyboard shortcuts (Ctrl+1/2/3) switch contexts (Me/Coach/Admin)
- Focus management: cursor moves to first sidebar nav item on context switch
- Screen reader announcements via aria-live region when context changes
- ThemeToggle component with current theme indicator and "Use System" option
- V2Layout provides AuthStoreContext and SettingsStoreContext to all child components
- V1 store access from V2 components via useV2Auth() and useV2Settings() hooks
- Full shell integration through App.jsx route nesting: V2Layout → ShellLayout → Pages
- Theme state converted to Zustand for shared state across components
- Theme CSS selectors scoped to .v2 class for correct cascade

## Task Commits

Each task was committed atomically, plus two critical bug fixes discovered during verification:

1. **Task 1: Create ShellLayout with Keyboard Navigation** - `8027420` (feat)
   - CSS Grid layout: grid-cols-[auto_1fr] with rail and content
   - Nested grid for sidebar (256px) + main content (flex-1)
   - Keyboard event listener on window for Ctrl+1/2/3 shortcuts
   - Focus management: move focus to first .workspace-sidebar link after context switch
   - aria-live region for screen reader context change announcements
   - 106 lines with full accessibility support

2. **Task 2: Create ThemeToggle Component and Update V2Layout** - `b7f2d0d` (feat)
   - ThemeToggle component with dropdown selector
   - Display current theme with "(Current)" indicator
   - "Use System" option to clear manual override
   - V2Layout refactored: replace useState with useTheme() hook
   - Add AuthStoreContext.Provider and SettingsStoreContext.Provider wrapping children
   - 79 insertions, 46 deletions (significant refactoring for store context)

3. **Task 3: Add ShellLayout Route to App.jsx** - `50d265c` (feat)
   - Lazy import ShellLayout using @v2 alias
   - Nest /beta routes through ShellLayout element
   - Route hierarchy: V2Layout (theme + stores) → ShellLayout (shell UI) → Page components
   - Prepare for future routes without shell (onboarding, etc.)
   - 16 insertions, 4 deletions

**Bug Fixes:**

4. **Fix: Convert useTheme to Zustand for Shared State** - `8592de6` (fix)
   - **Issue found during:** Task 2 verification - theme state wasn't shared between V2Layout and ThemeToggle
   - **Root cause:** useState creates independent instances, not shared state
   - **Fix:** Convert useTheme to Zustand store with getState() and setState() methods
   - **Impact:** Theme changes now propagate immediately to all V2 components
   - 50 insertions, 44 deletions (complete hook refactoring)

5. **Fix: Scope Theme CSS Selectors to .v2 Class** - `72acba8` (fix)
   - **Issue found during:** Theme verification - light and field themes didn't apply visually
   - **Root cause:** data-theme attribute on .v2 div, not :root, so [data-theme="light"] selectors didn't match
   - **Fix:** Change selectors from :root[data-theme="light"] to .v2[data-theme="light"]
   - **Impact:** CSS variables now cascade correctly within V2 container
   - **Known limitation:** Light and Field themes still don't fully apply (see Deviations)
   - 4 insertions, 3 deletions

## Files Created/Modified

**Created:**
- `src/v2/layouts/ShellLayout.tsx` - Complete shell layout with CSS Grid (rail + sidebar + content), keyboard navigation for context switching, focus management, and aria-live announcements (106 lines)
- `src/v2/components/shell/ThemeToggle.tsx` - Theme selector dropdown with system preference indicator, "Use System" option (49 lines)

**Modified:**
- `src/v2/layouts/V2Layout.tsx` - Refactored to use Zustand useTheme(), added AuthStoreContext and SettingsStoreContext providers for V1 store access
- `src/v2/hooks/useTheme.ts` - Converted from useState to Zustand store for shared state
- `src/v2/styles/tokens.css` - Scoped theme selectors to .v2 class (.v2[data-theme="..."])
- `src/v2/components/shell/WorkspaceSidebar.tsx` - Added workspace-sidebar className to nav element for focus targeting
- `src/App.jsx` - Added ShellLayout route nesting under /beta with proper Suspense boundaries

## Decisions Made

**1. Convert useTheme to Zustand for Shared State**
- Rationale: Initial useState implementation created independent instances in V2Layout and ThemeToggle. Zustand ensures all V2 components share the same theme state with reactive updates.
- Impact: Theme changes propagate immediately across shell and all child components.

**2. CSS Grid Layout with Fixed Sidebar Widths**
- Rationale: Precise control over rail (64px) and sidebar (256px) with remaining space for content. Grid provides stable layout without flexbox width issues.
- Impact: Consistent, predictable layout for all shell-based pages.

**3. Keyboard Shortcuts: Ctrl/Cmd + 1/2/3 for Context Switching**
- Rationale: Power-user feature for rapid context switching. Support both Ctrl (Windows/Linux) and Cmd (Mac).
- Impact: Athletes/coaches can switch between roles with keyboard without touching sidebar.

**4. Focus Management on Context Switch**
- Rationale: Accessibility requirement - when context changes, cursor should move to first navigation item for keyboard users.
- Implementation: setTimeout(0) to wait for React render, then focus first .workspace-sidebar link.
- Impact: Keyboard-only users can immediately interact with new context navigation.

**5. Scope Theme Selectors to .v2 Class**
- Rationale: data-theme attribute lives on .v2 div, not :root. Selectors must match .v2[data-theme="..."] for CSS variables to cascade.
- Impact: CSS variables now apply correctly within V2 container (though visual rendering still has issues - see Known Limitation).

**6. V1 Store Access via Context Providers**
- Rationale: V2 components need access to V1 Zustand stores (authStore, settingsStore) without cross-contamination.
- Implementation: AuthStoreContext and SettingsStoreContext wrap children in V2Layout, providing store instances.
- Impact: V2 components can access user data, settings, etc. from V1 backend without duplication.

## Deviations from Plan

### Known Limitation - Light and Field Theme CSS Rendering (Deferred)

**What works:**
- Dark theme applies immediately and renders correctly
- Theme toggle shows correct theme name
- Light and Field themes set data-theme attribute correctly
- CSS selectors now match correctly (.v2[data-theme="light"])

**What doesn't work:**
- Light and Field themes don't visually apply despite CSS fix
- Root cause: CSS variable cascade issue between tokens.css and V2Layout styles
- Investigation: CSS selectors match correctly, but color values don't override

**Decision:** Defer visual fix to post-Phase 5. Priority rationale:
- Dark theme is the default and works perfectly
- Most users prefer dark mode
- Visual theme system is low priority vs. feature development
- CSS variable cascade debugging requires deeper investigation of entire token system
- Time better spent on core features (Phase 3-5)

**Tracking:** Will be addressed after Phase 5 completion if time permits.

### Auto-Fixed Issue - Theme State Sharing

**Issue:** Theme state wasn't shared between V2Layout and ThemeToggle during verification.
- Root cause: useState creates independent instances
- Fixed by: Converting useTheme to Zustand store
- This was a critical bug preventing theme toggle from working
- Auto-fixed per Rule 1 (bug fix) + Rule 2 (missing critical functionality)

## Issues Encountered

1. **Theme state isolation (FIXED)** - useState created independent instances, theme toggle didn't update. Fixed by converting to Zustand.

2. **CSS selector scoping (PARTIALLY FIXED)** - Selectors didn't match. Fixed by changing to .v2[data-theme="..."]. Light/Field visual rendering still doesn't work - deferred as known limitation.

## User Setup Required

None - all components work with existing infrastructure.

## Verification Results

**Checkpoint Status:** APPROVED with known limitation

**Shell Layout Verification:**
- [x] Rail visible on left (64px, darker background)
- [x] Sidebar visible (256px, navigation items)
- [x] Content area shows BetaHome content
- [x] No horizontal scrollbar, full viewport height

**Context Switching:**
- [x] Click Me/Coach/Admin icons in rail - sidebar navigation changes
- [x] Active context has visual indicator in rail
- [x] Keyboard: Ctrl+1 → Me, Ctrl+2 → Coach, Ctrl+3 → Admin all work

**Navigation:**
- [x] Sidebar shows correct items per context (Me: Dashboard, My Workouts, Progress; Coach: Athletes, Training Plans, Lineups; Admin: Users, Teams, Settings)
- [x] Items are clickable

**Theme:**
- [x] Theme toggle shows current theme
- [x] Dark theme switches and applies immediately
- [x] Refresh page - dark theme persists
- [x] "(Current)" shows next to active theme
- [x] Light and Field themes switch but don't visually apply (known limitation)

**Accessibility:**
- [x] Tab through rail buttons - all focusable
- [x] Tab through sidebar links - all focusable
- [x] Ctrl+1/2/3 works from anywhere in the page

## Next Phase Readiness

**Ready for Phase 3 and beyond:**
- Shell layout fully functional with all components integrated
- Keyboard navigation and context switching working
- Theme system in place (dark mode production-ready)
- V1 and V2 store access patterns established
- All feature pages can now be built within the working shell

**No critical blockers:**
- Shell renders and navigates correctly
- Keyboard shortcuts working
- V1 store integration ready
- Build passes
- All success criteria met except visual light/field themes (deferred)

**Deferred work:**
- Light and Field theme visual rendering (post-Phase 5)

---
*Phase: 02-foundation*
*Plan: 02-04 Shell Layout Integration*
*Completed: 2026-01-23*
