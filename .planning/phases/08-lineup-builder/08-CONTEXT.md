# Phase 8: Lineup Builder - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Coach can build, manage, and export boat lineups with drag-drop interface and full history. Includes boat class selection, seat validation, undo/redo, versioning, save/duplicate/export, live biometrics display, and margin visualizer. Seat racing and comparative analysis are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Drag-drop interaction
- Full athlete card shown at cursor during drag (name, photo/avatar, side preference)
- Seats show glow/highlight border on drag-over (green=valid, red=invalid) — Linear-style subtle feedback
- Dropping on occupied seat triggers auto-swap — athletes exchange places automatically
- Touch devices use tap-to-select, tap-to-place workflow — no drag on mobile to avoid scroll conflicts

### Workspace layout
- Boat seats arranged vertically (bow at top, stern at bottom) — mirrors how lineups are written
- Athlete bank positioned in left sidebar — classic builder pattern
- Default single boat view with tabs; optional split view for multi-boat comparison when needed
- Full redesign for mobile — different UI entirely for small screens, not just responsive adjustments

### Validation & constraints
- Port/starboard validation: soft warning — allow drop but show warning badge, coach can override
- Coxswain seat validation: soft warning — non-cox in cox seat shows warning, flexibility for unusual situations
- Warnings always visible on seats as badges — constant awareness, no hover required
- Save always allowed regardless of warnings — warnings are informational only, coach knows best
- Validation strictness configurable in settings — coach can toggle safety features on/off
- Default: minimal friction (warnings visible, no blocks or confirms) — trust the coach

### History & versioning
- Undo/redo covers every action — each drag, swap, removal is individually undoable
- Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z (standard)
- Auto-save versions on each explicit save — system maintains version history automatically
- Version history accessed via dropdown menu — compact, keeps builder clean
- Simple side-by-side version comparison (no diff highlighting) — two versions displayed at once

### Claude's Discretion
- Spring-physics animation easing and timing
- Exact drag preview positioning and shadow
- Warning badge icon design
- Version dropdown styling
- Biometrics display placement and density
- Margin visualizer implementation details
- PDF export layout and styling

</decisions>

<specifics>
## Specific Ideas

- Validation settings should be per-user preference in app settings, not per-lineup
- Mobile UI should be a distinct experience, not just "shrunk desktop" — worth the extra design work
- Coach workflows vary: some want strict validation, others want speed. Configurability respects both.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-lineup-builder*
*Context gathered: 2026-01-24*
