---
phase: 05-the-flip
plan: 03
subsystem: navigation
tags: [ui, version-switching, toggle, navigation]
requires: ["05-01"]
provides:
  - "VersionToggle component for V1/V2 switching"
  - "VersionRedirectGuard for automatic redirects"
  - "Toggle button integration in both V1 and V2 layouts"
affects: ["05-02"]
tech-stack:
  added: []
  patterns: ["Component wrapper pattern for hook integration"]
key-files:
  created:
    - src/v2/components/shell/VersionToggle.tsx
    - src/v2/components/shell/VersionRedirectGuard.tsx
  modified:
    - src/v2/layouts/V2Layout.tsx
    - src/layouts/AppLayout.jsx
decisions:
  - decision: "Dual styling approach for V1 vs V2 contexts"
    rationale: "V2 uses design tokens, V1 uses legacy classes"
    impact: "Single component works in both environments"
  - decision: "Wrapper component pattern for useVersionRedirect"
    rationale: "Separates hook logic from layout structure"
    impact: "Clean integration, testable in isolation"
  - decision: "Navigate with replace: true for version switches"
    rationale: "Avoids polluting browser history with version toggle entries"
    impact: "Better UX - back button returns to previous page, not previous version"
metrics:
  duration: "3m 17s"
  completed: 2026-01-23
---

# Phase 5 Plan 3: Version Toggle UI Summary

**One-liner:** Version toggle button with dual styling enables seamless V1/V2 switching in both layouts.

## What Was Built

### Components Created

**VersionToggle.tsx** - Dual-context toggle button
- Props: `currentVersion: 'v1' | 'v2'`
- V2 mode: "Use Legacy" button with V2 design tokens
- V1 mode: "Try New Version" button with V1 classes
- Updates `userPreferenceStore.setLegacyMode()`
- Navigates immediately with `replace: true`

**VersionRedirectGuard.tsx** - Hook wrapper component
- Calls `useVersionRedirect()` hook
- Wraps children with fragment (transparent wrapper)
- Enables hook integration without layout changes

### Integration Points

**V2Layout.tsx**
- Imported and rendered `VersionToggle` in header
- Placed before `ThemeToggle` in controls area
- Wrapped `Outlet` with `VersionRedirectGuard`

**AppLayout.jsx (V1)**
- Imported and rendered `VersionToggle` in TopNav
- Placed before `WorkspaceSwitcher` in breadcrumb area
- Shows "Try New Version" button to V1 users

## Key Implementation Details

### Dual Styling Strategy

```tsx
// V2 mode - uses design tokens
<button className="text-txt-secondary hover:text-txt-primary hover:bg-bg-surface-elevated">
  Use Legacy
</button>

// V1 mode - uses legacy classes
<button className="text-text-secondary hover:text-text-primary hover:bg-dark-card">
  Try New Version
</button>
```

This approach allows a single component to adapt to both V1 and V2 styling systems.

### Navigation Flow

```tsx
const handleToggle = () => {
  if (currentVersion === 'v2') {
    setLegacyMode(true);
    navigate('/legacy', { replace: true });
  } else {
    setLegacyMode(false);
    navigate('/app', { replace: true });
  }
};
```

- Updates preference store immediately (localStorage persists)
- Navigates with `replace: true` to avoid history pollution
- VersionRedirectGuard hook ensures preference is enforced on subsequent page loads

## Verification Results

**TypeScript Compilation:** ✓ No errors in new files
**Component Integration:** ✓ Toggle appears in both V2 and V1 layouts
**Import Resolution:** ✓ @v2 path alias works correctly
**Git Commits:** ✓ 4 atomic commits (1 per task)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 05-02 (Flip Mechanics):**
- ✓ VersionToggle UI component ready for FLIP date visibility
- ✓ User preference store already integrated
- ✓ Version redirect logic already integrated via VersionRedirectGuard

**Dependencies satisfied:**
- Plan 05-01 (user preference store) complete
- userPreferenceStore.ts available at src/v2/stores/userPreferenceStore.ts
- useVersionRedirect.ts available at src/v2/hooks/useVersionRedirect.ts

**Blockers:** None

**Concerns:** None

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | bca1980 | Create VersionToggle component with dual styling |
| 2 | cbcac15 | Add VersionToggle to V2Layout header |
| 3 | 35f738d | Add VersionToggle to V1 AppLayout |
| 4 | 1e40b8c | Integrate useVersionRedirect into V2Layout via guard |

---
*Summary created: 2026-01-23*
*Phase 5 progress: 2/3 plans complete*
