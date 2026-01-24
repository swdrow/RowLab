---
phase: 09-seat-racing
plan: 02
subsystem: ui
tags: [react, tanstack-table, recharts, framer-motion, seat-racing, rankings]

# Dependency graph
requires:
  - phase: 09-01
    provides: "Seat racing types, schemas, and TanStack Query hooks"
provides:
  - "ConfidenceBadge visual component with 5 confidence tiers"
  - "RankingsTable sortable table with TanStack Table"
  - "RankingsChart horizontal bar chart with recharts"
  - "SessionList animated session cards with Framer Motion"
affects: [09-03-session-management, 09-04-piece-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Confidence tier badge component pattern (UNRATED/PROVISIONAL/LOW/MEDIUM/HIGH)"
    - "TanStack Table with sorting and filtering for rankings"
    - "Recharts horizontal bar chart with opacity-based confidence visualization"
    - "Framer Motion list animations for session cards"

key-files:
  created:
    - src/v2/components/seat-racing/ConfidenceBadge.tsx
    - src/v2/components/seat-racing/RankingsTable.tsx
    - src/v2/components/seat-racing/RankingsChart.tsx
    - src/v2/components/seat-racing/SessionList.tsx
    - src/v2/components/seat-racing/index.ts
  modified: []

key-decisions:
  - "Confidence opacity visualization: 0.3 base + confidence * 0.7 for bar charts"
  - "Side badges use same colors as AthletesTable (Port=red, Starboard=green)"
  - "Rating color scale: blue >=1200, orange >=800, muted <800"
  - "Top 3 ranks highlighted with orange/bold styling"
  - "Relative date formatting: Today/Yesterday/N days ago for recent sessions"
  - "Delete confirmation dialog for destructive session actions"

patterns-established:
  - "ConfidenceBadge: Reusable confidence tier indicator with dot-only mode"
  - "TanStack Table pattern: sorting, filtering, empty states"
  - "Framer Motion: AnimatePresence for list item removal animations"

# Metrics
duration: 4min
completed: 2026-01-24
---

# Phase 09 Plan 02: Display Components Summary

**Sortable rankings table, confidence badges, session list, and bar chart for ELO visualization**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-24T22:16:14Z
- **Completed:** 2026-01-24T22:20:30Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Created ConfidenceBadge component with 5 confidence tiers (UNRATED/PROVISIONAL/LOW/MEDIUM/HIGH)
- Built RankingsTable with TanStack Table sorting, side filtering, and recalculate button
- Implemented SessionList with Framer Motion animations and delete confirmation
- Added RankingsChart horizontal bar visualization using recharts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ConfidenceBadge component** - `25319f7` (feat)
2. **Task 2: Create RankingsTable component with TanStack Table** - `6cacb4d` (feat)
3. **Task 3: Create SessionList component** - `39a2253` (feat)
4. **Task 4: Create barrel export and RankingsChart placeholder** - `dc0b4be` (feat)

## Files Created/Modified

- `src/v2/components/seat-racing/ConfidenceBadge.tsx` - Visual badge showing confidence level tiers with color coding
- `src/v2/components/seat-racing/RankingsTable.tsx` - Sortable rankings table with 6 columns, side filter, recalculate button
- `src/v2/components/seat-racing/SessionList.tsx` - Card-based session list with relative dates, delete confirmation, animations
- `src/v2/components/seat-racing/RankingsChart.tsx` - Horizontal bar chart showing top N athletes with opacity-based confidence
- `src/v2/components/seat-racing/index.ts` - Barrel exports for all seat racing components

## Decisions Made

**Confidence tier thresholds**: Used getConfidenceLevel() from types/seatRacing.ts with thresholds at 0.2, 0.4, 0.7 for PROVISIONAL/LOW/MEDIUM/HIGH tiers

**Side badge color consistency**: Matched AthletesTable pattern (Port=red, Starboard=green, Both=blue, Cox=purple) for visual consistency across V2 components

**Rating color scale from V1**: Preserved V1 RankingsDisplay color scale (blue >=1200, orange >=800, muted <800) for familiarity

**Top 3 rank highlighting**: Applied orange/bold styling to ranks 1-3 to emphasize top performers

**Bar chart opacity visualization**: Used formula (0.3 + confidence * 0.7) to map confidence score to bar opacity, providing visual indication of rating reliability without cluttering with badges

**Relative date formatting**: Sessions show "Today", "Yesterday", "N days ago" for dates within 7 days, then formatted date for older sessions

**Delete confirmation pattern**: Used Framer Motion modal dialog for confirmation to prevent accidental deletion of seat race sessions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components implemented successfully following existing V2 patterns from Phases 6-8.

## Next Phase Readiness

**Ready for:**
- Phase 09-03 (Session Management) - components ready to consume useAthleteRatings and useSeatRaceSessions hooks
- Phase 09-04 (Piece Management) - SessionList ready to display sessions with piece counts when extended
- Phase 09-05 (Rankings Page) - All display components ready for integration into full rankings view

**Notes:**
- Hook imports (useAthleteRatings, useSeatRaceSessions) are references in plan but will be integrated when hooks are used in context (Phase 09-03+)
- All components follow V2 design tokens and patterns established in Phases 6-8
- RankingsChart uses recharts library already installed in project

---
*Phase: 09-seat-racing*
*Completed: 2026-01-24*
