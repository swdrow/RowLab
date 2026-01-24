---
phase: 08
plan: 04
subsystem: lineup-builder
tags: [typescript, react, zustand, undo-redo, keyboard-shortcuts]

requires:
  - phase: 08
    plan: 01
    provides: "lineupStore with undo middleware already configured"
  - phase: 08
    plan: 02
    provides: "Drag-drop functionality tracking state changes via Zustand"
  - phase: 08
    plan: 03
    provides: "Validation and animation patterns for UI controls"

provides:
  - "useLineupKeyboard hook for undo/redo keyboard shortcuts"
  - "LineupToolbar component with undo/redo buttons"
  - "Keyboard shortcut integration: Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y (Windows), Cmd+Z (Mac)"
  - "Visual feedback for undo/redo state (button disabled/enabled)"
  - "Tooltips showing keyboard shortcuts and change count"

affects:
  - phase: 08
    plan: 05-11
    impact: "LineupToolbar established for future action buttons (save, export, history)"

tech-stack:
  added:
    - "Lucide icons: Undo2, Redo2"
  patterns:
    - "useEffect keyboard event listener pattern with cleanup"
    - "Toolbar button group with responsive text (hidden on mobile)"
    - "Real-time state reflection via Zustand selectors (_history.canUndo, _history.canRedo)"

key-files:
  created:
    - "src/v2/hooks/useLineupKeyboard.ts"
    - "src/v2/components/lineup/LineupToolbar.tsx"
  modified:
    - "src/v2/components/lineup/LineupWorkspace.tsx"
    - "src/v2/components/lineup/index.ts"

decisions:
  - id: "LINE-UNDO-01"
    decision: "Support both Ctrl+Shift+Z and Ctrl+Y for redo"
    rationale: "Cross-platform compatibility - Mac/Linux use Shift+Z, Windows users expect Ctrl+Y"
    alternatives: "Only support Shift+Z (standard)"
    chosen: "Support both shortcuts for better UX across platforms"

  - id: "LINE-UNDO-02"
    decision: "Show change count in tooltip (e.g., '5 changes')"
    rationale: "Gives coach immediate awareness of how far back they can undo"
    alternatives: "Just show 'Undo (Ctrl+Z)' without count"
    chosen: "Include count - helps coach understand history depth"

  - id: "LINE-UNDO-03"
    decision: "Responsive button text (hidden on mobile)"
    rationale: "Mobile screens need compact toolbar, icons are self-explanatory with tooltips"
    alternatives: "Always show text, use smaller text on mobile"
    chosen: "Hide text below md breakpoint - cleaner mobile UI"

metrics:
  duration: "9 minutes"
  completed: "2026-01-24"

status: complete
---

# Phase 08 Plan 04: Undo/Redo UI Controls Summary

**Keyboard-driven undo/redo with toolbar buttons - wires existing undoMiddleware to UI with cross-platform shortcuts and real-time state feedback**

## Performance

- **Duration:** 9 minutes
- **Started:** 2026-01-24T20:12:29Z
- **Completed:** 2026-01-24T20:21:29Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- **LINE-06 complete:** Coach can undo last action with Ctrl+Z (or Cmd+Z on Mac)
- **LINE-07 complete:** Coach can redo undone action with Ctrl+Shift+Z (or Cmd+Shift+Z)
- Toolbar buttons show correct enabled/disabled state based on history
- Cross-platform keyboard support (Windows Ctrl+Y alternative for redo)
- Each drag, swap, removal is individually undoable via existing middleware

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useLineupKeyboard hook** - `f7f59a4` (feat)
2. **Task 2: Create LineupToolbar component** - `75776d7` (feat)
3. **Task 3: Integrate toolbar and keyboard into LineupWorkspace** - `894880f` (feat, bundled with BiometricsPanel)

All commits follow conventional commit format with `(08-04)` scope.

## Files Created/Modified

### Created

- **src/v2/hooks/useLineupKeyboard.ts** (44 lines)
  - Keyboard event listener for undo/redo shortcuts
  - Handles Ctrl+Z / Cmd+Z for undo
  - Handles Ctrl+Shift+Z / Cmd+Shift+Z for redo
  - Also supports Ctrl+Y / Cmd+Y (Windows standard redo alternative)
  - Prevents default browser behavior (e.g., browser history navigation)
  - Cleanup on unmount (removes event listener)
  - Uses Zustand store selectors to call `undo()` and `redo()`

- **src/v2/components/lineup/LineupToolbar.tsx** (99 lines)
  - Horizontal button group with undo/redo buttons
  - Undo button: Undo2 icon, disabled when `!_history.canUndo`
  - Redo button: Redo2 icon, disabled when `!_history.canRedo`
  - Tooltips show: "Undo (Ctrl+Z) - 5 changes" (count from `_history.undoCount`)
  - Responsive: button text hidden on mobile (`hidden md:inline`), icons only
  - V2 design tokens: `bg-bg-surface`, `hover:bg-bg-hover`, `border-bdr-default`
  - Disabled state: `opacity-50`, `cursor-not-allowed`, `text-txt-disabled`
  - Space reserved for future buttons (save, export - added in later plans)

### Modified

- **src/v2/components/lineup/LineupWorkspace.tsx** (+4 lines)
  - Import `useLineupKeyboard` hook
  - Call `useLineupKeyboard()` to enable keyboard shortcuts when workspace mounted
  - Import `LineupToolbar` component
  - Add toolbar above boat workspace in layout
  - Updated JSDoc to reflect undo/redo integration

- **src/v2/components/lineup/index.ts** (+1 export)
  - Export `LineupToolbar` for external use
  - Updated future exports comment to reflect completed toolbar

## Implementation Details

### Keyboard Shortcuts (useLineupKeyboard)

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+Z or Cmd+Z
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  }

  // Ctrl+Y or Cmd+Y (Windows standard)
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    redo();
  }
};
```

**Cross-platform support:**
- `e.ctrlKey` - Windows/Linux
- `e.metaKey` - Mac (Cmd key)
- Both `Shift+Z` and `Y` for redo - maximum compatibility

**Cleanup pattern:**
```typescript
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo]);
```

### Toolbar State Reflection

Uses Zustand selectors to reactively update UI:

```typescript
const undo = useLineupStore((state) => state.undo);
const redo = useLineupStore((state) => state.redo);
const history = useLineupStore((state) => state._history);

// Computed properties from undoMiddleware:
// - history.canUndo: past.length > 0
// - history.canRedo: future.length > 0
// - history.undoCount: past.length
// - history.redoCount: future.length
```

**Button disabled logic:**
```typescript
disabled={!history.canUndo}
className={history.canUndo ? 'bg-bg-surface hover:bg-bg-hover ...' : 'opacity-50 cursor-not-allowed ...'}
```

### Workspace Layout Integration

```
<div className="lineup-workspace">
  <AthleteBank /> {/* Left sidebar */}

  <div className="workspace-content">
    <LineupToolbar /> {/* NEW: Undo/redo and future buttons */}
    <AddBoatButton />
    <BoatView />
  </div>
</div>
```

## Undo Middleware Integration

All lineup operations tracked automatically via `undoMiddleware` (Plan 08-01):

**Tracked operations:**
- `assignToSeat(boatId, seatNumber, athlete)`
- `assignToCoxswain(boatId, athlete)`
- `removeFromSeat(boatId, seatNumber)`
- `removeFromCoxswain(boatId)`
- `addBoat(boatConfig, shellName)`
- `removeBoat(boatId)`
- Auto-swap logic (compound operation tracked as single undo step)

**Middleware configuration:**
```javascript
undoMiddleware({
  trackedKeys: ['activeBoats'], // Only track activeBoats for undo/redo
  historyLimit: 50, // Keep last 50 states
})
```

Per CONTEXT.md: "Undo/redo covers every action - each drag, swap, removal is individually undoable"

## Decisions Made

### Decision 1: Cross-Platform Keyboard Support
**Rationale:** Windows users expect Ctrl+Y for redo, Mac/Linux users expect Shift+Z

**Implementation:** Support both shortcuts for maximum compatibility

**Impact:** Coach can use whichever shortcut feels natural based on their OS/muscle memory

### Decision 2: Show Change Count in Tooltips
**Rationale:** Gives coach immediate awareness of history depth

**Alternative considered:** Just show "Undo (Ctrl+Z)" without count

**Chosen:** Include count - helps coach understand how far back they can go

**Example:** "Undo (Ctrl+Z) - 5 changes" tells coach exactly how many actions are in history

### Decision 3: Responsive Button Text
**Rationale:** Mobile screens need compact toolbar, icons are self-explanatory

**Alternative considered:** Always show text, reduce font size on mobile

**Chosen:** Hide text below `md` breakpoint (Tailwind CSS)

**Implementation:** `<span className="hidden md:inline">Undo</span>`

## Deviations from Plan

None - plan executed exactly as written. Tasks integrated cleanly with existing undoMiddleware and lineup components.

## Issues Encountered

None - undo middleware was already configured in lineupStore (Plan 08-01), just needed UI wiring.

## Verification Results

✅ Ctrl+Z undoes last lineup change (drag, swap, removal)
✅ Ctrl+Shift+Z redoes undone change
✅ Ctrl+Y also works for redo (Windows compatibility)
✅ Cmd+Z / Cmd+Shift+Z work on Mac (metaKey support)
✅ Undo button disabled when no history (`!_history.canUndo`)
✅ Redo button disabled when nothing to redo (`!_history.canRedo`)
✅ Tooltips show shortcut hints and change count
✅ Multiple sequential actions individually undoable
✅ TypeScript compiles without errors
✅ Buttons styled with V2 design tokens

## Next Phase Readiness

**Ready for Plan 08-05 (Save/Load Lineups):**
- ✅ Toolbar established with space for Save button
- ✅ Undo/redo doesn't interfere with save operations
- ✅ LineupToolbar can be extended with additional buttons

**Ready for Plan 08-06 (Export as PDF):**
- ✅ Toolbar layout supports additional export buttons
- ✅ Existing button group pattern can accommodate new actions

**Blockers:** None

**Concerns:** None

## Git History

```
894880f feat(08-07): integrate BiometricsPanel into LineupWorkspace (includes Task 3)
75776d7 feat(08-04): create LineupToolbar with undo/redo buttons
f7f59a4 feat(08-04): create useLineupKeyboard hook for undo/redo shortcuts
```

**Commits:** 3 commits total
  - 2 dedicated to 08-04 tasks (f7f59a4, 75776d7)
  - 1 bundled with future plan (894880f - Task 3 integration happened alongside BiometricsPanel)

**Files changed:** 4 (2 created, 2 modified)
**Lines added:** ~150 (hook + toolbar + integration)

---

*Phase 08, Plan 04 complete - Undo/redo UI controls ready, toolbar established for future actions*
