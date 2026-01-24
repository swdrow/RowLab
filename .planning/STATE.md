# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v2.0 — Core Migration
**Phase:** 7 (Erg Data & Performance) — In Progress
**Status:** Plan 07-02 complete (Erg Tests Table & CRUD)
**Last activity:** 2026-01-24 — Completed 07-02-PLAN.md

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
| 7 | Erg Data & Performance | In Progress | 2/? |
| 8 | Lineup Builder | Pending | —/— |
| 9 | Seat Racing | Pending | —/— |
| 10 | Training Plans & NCAA | Pending | —/— |
| 11 | Racing & Regattas | Pending | —/— |
| 12 | Settings & Polish | Pending | —/— |

v2.0 Progress: █░░░░░░░░░░░ 8%

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

## Session Continuity

**Last session:** 2026-01-24T18:22:58Z
**Stopped at:** Completed 07-02-PLAN.md (Erg Tests Table & CRUD)
**Resume file:** None — ready for next plan in Phase 7

## Known Limitations

None - all v2.0 foundation issues resolved.

## Next Action

Continue Phase 7 execution with next plan.

**Phase 7 Scope:**
- Erg test data layer (types, hooks) ✓
- Erg test table with virtualization ✓
- Erg test detail/edit forms ✓
- Erg history visualization (charts, personal bests)
- Leaderboard views
- Concept2 sync integration

---
*Last updated: 2026-01-24 — Completed 07-02: Erg Tests Table & CRUD*
