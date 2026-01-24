# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v2.0 — Core Migration
**Phase:** 8 (Lineup Builder) — In Progress
**Status:** Plan 08-07 complete
**Last activity:** 2026-01-24 — Completed 08-07-PLAN.md

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Context-aware dashboard experience that adapts to athlete/coach role
**v2.0 focus:** Complete V1 to V2 migration with "Precision Instrument" design philosophy

## Progress

### v1.0 Milestone (Complete)

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Clean Room Setup | Complete | 4/4 |
| 2 | Foundation | Complete | 4/4 |
| 3 | Vertical Slice | Complete | 7/7 |
| 4 | Migration Loop | Complete | 12/12 |
| 5 | The Flip | Complete | 5/5 |

v1.0 Progress: 100% Complete

### v2.0 Milestone (Active)

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 6 | Athletes & Roster | Complete | 6/6 |
| 7 | Erg Data & Performance | Complete | 6/6 |
| 8 | Lineup Builder | In Progress | 7/— |
| 9 | Seat Racing | Pending | —/— |
| 10 | Training Plans & NCAA | Pending | —/— |
| 11 | Racing & Regattas | Pending | —/— |
| 12 | Settings & Polish | Pending | —/— |

v2.0 Progress: ███░░░░░░░░░ 29%

## Quick Context

**Architecture:** In-Place Strangler pattern (v1.0)
- V2 at `/app` (default)
- V1 at `/legacy` (fallback)
- Shares existing Zustand stores with V1

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS 3.4, Framer Motion, TanStack Query v5, TanStack Table, TanStack Virtual

**v2.0 Design Philosophy:** "Precision Instrument" (Raycast/Linear/Vercel inspired)

**Codebase Map:** .planning/codebase/ (7 documents, 1,978 lines)

## Accumulated Decisions

See STATE.md.backup for full v1.0 decision history (211 decisions across 5 phases)

Key architectural decisions carrying forward:
- TanStack Query for server state, Zustand for complex client state only
- Feature-based organization in src/v2/features/
- react-hook-form + Zod for all form validation
- @dnd-kit for drag-drop interactions
- recharts for data visualization

### v2.0 Decisions (Phases 6-7)

| Plan | Decision | Rationale |
|------|----------|-----------|
| 06-02 | VirtualTable uses TanStack Virtual + Table | Combines virtualization for performance with full table features (sorting, filtering) |
| 06-02 | 20-item overscan for virtualization | Balances performance with smooth scrolling, prevents blank areas during fast scroll |
| 06-02 | Generic TypeScript VirtualTable component | Enables reuse across athletes, erg data, and all future large tables |
| 06-01 | Used db push instead of migration | Database had drift from migration history, db push syncs schema directly for development |
| 06-01 | Status as string instead of Prisma enum | Provides flexibility for future status additions without schema migration |
| 06-01 | Unique constraint on athleteId + date | Ensures one attendance record per athlete per day, upsert prevents duplicates |
| 06-01 | Bulk operations with Prisma transactions | Ensures atomicity when recording attendance for multiple athletes |
| 06-03 | Client-side filtering for athletes | Reduces API calls, improves UX responsiveness for small datasets (<200 athletes) |
| 06-03 | Attendance map conversion for O(1) lookup | Eliminates O(n) find() calls when rendering roster with attendance status |
| 06-03 | Separate hooks by access pattern | useAttendance (date), useAthleteAttendance (athlete), useAttendanceSummary (stats) |
| 06-07 | Always apply data-theme attribute for all themes | CSS cascade requires attribute presence for selectors like .v2[data-theme="X"] to match |
| 06-07 | Explicit CSS selectors for each theme | Each theme needs .v2[data-theme="X"] selector for proper cascade behavior |
| 06-07 | Field theme uses high-contrast amber/yellow | Outdoor rowing requires high visibility in bright sunlight conditions |
| 06-04 | Deterministic HSL colors for avatars | Provides consistent visual identity without photo uploads, better distribution than RGB hash |
| 06-04 | LocalStorage for view preference | Maintains user preference between sessions without requiring server state |
| 06-04 | Slide-out panel for editing | Better spatial context than modal - user can see roster while editing |
| 06-04 | Responsive grid layout (1-4 columns) | Optimizes space usage across all screen sizes while maintaining readability |
| 06-05 | PapaParse for CSV parsing | Industry standard with worker thread support for large files, automatic type inference |
| 06-05 | Fuzzy column matching | Normalize case/punctuation for auto-mapping common variations (first/fname/First Name all match) |
| 06-05 | Partial import strategy | Allow importing valid rows while showing errors for invalid ones - doesn't block bulk import |
| 06-05 | Worker threads at 500KB threshold | Prevents UI blocking during large CSV parsing (~5,000 rows with 10 columns) |
| 06-06 | Single-letter status labels (P/L/E/U) | Compact display for mobile, full words shown on hover/title |
| 06-06 | Attendance rate = (present + late) / total | Late arrivals count toward attendance for coaching purposes |
| 06-06 | Summary sorted by rate descending | Coaches quickly identify low-attendance athletes needing intervention |
| 06-06 | Date presets (7d/30d/90d) | Common reporting periods for coaching analysis |
| 07-01 | Query keys include filters for erg tests | Enables proper cache isolation when filtering by athlete/testType/date |
| 07-01 | Separate hooks by access pattern for erg data | useErgTests, useAthleteErgHistory, useErgLeaderboard provide clarity and prevent over-fetching |
| 07-01 | C2 status staleTime 5 minutes | Connection status changes infrequently, reduces unnecessary API calls |
| 07-01 | useTeamC2Statuses for bulk queries | Provided but UI should use individual queries to avoid N+1 at load time |
| 07-02 | Time input supports MM:SS.s format | Converts to seconds for storage, user-friendly input reduces data entry errors |
| 07-02 | Auto-calculate watts from split (and vice versa) | Using standard erg formula (watts = 2.80 / pace^3) reduces manual calculation work |
| 07-02 | Mobile card view below 768px | Responsive design essential for coaches using tablets on deck |
| 07-02 | Test type color coding (2k=red, 6k=blue, etc) | Visual distinction helps coaches quickly identify test types in table |
| 07-04 | parseTimeToSeconds() supports multiple formats | Handles MM:SS.s, MM:SS, HH:MM:SS, and numeric seconds for CSV import flexibility |
| 07-04 | parseTestType() normalizes test type variations | Maps 2k/2K/2000m/2000 → canonical types, reduces data entry errors |
| 07-04 | Athlete matching uses fuzzy search | Handles "First Last" or "Last, First" formats with partial matching for CSV import |
| 07-04 | Worker threads at 500KB CSV threshold | Same as Phase 6 pattern - prevents UI blocking for ~5,000 rows |
| 07-05 | 60-minute stale threshold for C2 sync | Balances alerting coaches to outdated data without excessive yellow badges during normal usage |
| 07-05 | Custom relative time formatting | More readable than absolute timestamps, matches modern UI patterns (2m ago, 3h ago, etc) |
| 07-05 | Team C2 status uses bulk query | useTeamC2Statuses prevents N+1 query problem when loading team overview |
| 07-05 | Slide-out panel for C2 status | Non-modal allows viewing tests while checking status, matches Linear/GitHub patterns |
| 08-01 | Use existing lineupStore instead of new V2 store | lineupStore has undo/redo middleware, boat management, API integration - V1/V2 can share state during migration |
| 08-01 | Display seats bow-at-top by reversing store order | boatConfig generates seats high-to-low, but traditional notation shows bow at top - reverse in display layer |
| 08-01 | Defer shell selector to future enhancement | Plan scope is foundational components - shell assignment can be added post-creation via boat header edit |
| 08-02 | Track source position in drag data for auto-swap | Source tracking (bank/seat/coxswain) enables proper athlete exchange when dropping on occupied seats |
| 08-02 | Use DragOverlay for cursor preview | Shows full athlete card at cursor during drag, better visibility than transform-only approach |
| 08-02 | Green border for all drop zones, defer red for validation | Plan scope is core drag-drop, validation warnings come in 08-03 |
| 08-02 | 10px mouse activation, 250ms touch delay | Prevents accidental drags, balances responsiveness with intentionality |
| 08-03 | Validation warnings never block assignment | Trust the coach - warnings are informational only, coach knows best for experimental lineups |
| 08-03 | Warning badges always visible (not hover-only) | Per CONTEXT.md: constant awareness required, no hover interaction needed |
| 08-03 | Spring physics for all drag-drop animations | Spring physics feel more natural, velocity-aware, don't require precise timing curves |
| 08-03 | Shared spring config (stiffness: 300, damping: 28) | Consistent animation feel across all drag-drop interactions throughout lineup builder |
| 08-06 | jsPDF + html2canvas for client-side PDF | Keeps feature self-contained, works offline, faster than server-side Puppeteer |
| 08-06 | Print layout uses inline styles, not Tailwind | html2canvas captures computed styles, inline styles ensure consistent rendering |
| 08-06 | Off-screen rendering with position absolute | Classic off-screen pattern, doesn't affect viewport scroll, hidden from user |
| 08-06 | US Letter format as default, A4 as option | US rowing programs use Letter, international programs use A4 |
| 08-06 | Scale down to single page if content exceeds height | Simpler UX, most lineups fit on one page, multi-page adds complexity |
| 08-07 | Exclude coxswains from erg averages | Coxswains don't row, so their erg times shouldn't affect boat performance metrics |
| 08-07 | Parse 2k times from latestErgTest.time | Athletes have latestErgTest with testType and time in MM:SS.s format requiring parsing |
| 08-07 | useMemo for biometrics calculation | Prevents recalculation during drag operations, only updates when activeBoats changes |
| 08-07 | Position panel below toolbar, above boats | Horizontal strip layout - always visible, compact, doesn't require sidebar space |

## Session Continuity

**Last session:** 2026-01-24T20:16:48Z
**Stopped at:** Completed 08-07-PLAN.md (Live Biometrics Display)
**Resume file:** None — ready for next plan

## Known Limitations

None - all v2.0 foundation issues resolved.

## Next Action

Continue Phase 8 execution with remaining plans.

**Phase 8 Scope:**
- Lineup builder foundation (AthleteBank, BoatView, AddBoatButton) ✓
- Drag-drop seat assignment ✓
- Seat validation warnings ✓
- Undo/redo UI controls ✓
- Save/load lineups ✓
- Export as PDF ✓
- Live biometrics display ✓
- Duplicate lineups (remaining)
- Version history (remaining)
- Boat margin visualizer (remaining)
- Multi-boat workspace (remaining)

---
*Last updated: 2026-01-24 — Completed 08-07: Live Biometrics Display*
