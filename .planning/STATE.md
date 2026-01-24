# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v2.0 — Core Migration
**Phase:** 6 (Athletes & Roster Management) — In Progress
**Status:** Plan 06-01 complete (Attendance backend)
**Last activity:** 2026-01-24 — Completed 06-01-PLAN.md

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
| 6 | Athletes & Roster | In Progress | 7/? |
| 7 | Erg Data & Performance | Pending | —/— |
| 8 | Lineup Builder | Pending | —/— |
| 9 | Seat Racing | Pending | —/— |
| 10 | Training Plans & NCAA | Pending | —/— |
| 11 | Racing & Regattas | Pending | —/— |
| 12 | Settings & Polish | Pending | —/— |

v2.0 Progress: ░░░░░░░░░░░░ 0%

## Quick Context

**Architecture:** In-Place Strangler pattern (v1.0)
- V2 at `/app` (default)
- V1 at `/legacy` (fallback)
- Shares existing Zustand stores with V1

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS 3.4, Framer Motion, TanStack Query v5, TanStack Table, TanStack Virtual

**v2.0 Design Philosophy:** "Precision Instrument" (Raycast/Linear/Vercel inspired)

**Codebase Map:** .planning/codebase/ (7 documents, 1,978 lines)

## Phase 6 Overview

**Goal:** Coach has complete visibility into roster with filtering, biometrics, and attendance tracking

**Requirements (14):**
- ATH-01 through ATH-08 (Athletes Page)
- ATT-01 through ATT-03 (Attendance Tracking)
- DESIGN-02, DESIGN-03, DESIGN-04 (Theme fixes, virtualization)

**Success Criteria:**
1. Coach can view full roster in grid or list view with biometrics
2. Coach can search and filter by side preference and capabilities
3. Coach can bulk import from CSV with preview validation
4. Coach can record and view attendance history
5. Tables scroll smoothly at 60 FPS with 100+ athletes

**Dependencies:** None (foundation phase)

**Research Flag:** SKIP (standard CRUD patterns)

## Accumulated Decisions

See STATE.md.backup for full v1.0 decision history (211 decisions across 5 phases)

Key architectural decisions carrying forward:
- TanStack Query for server state, Zustand for complex client state only
- Feature-based organization in src/v2/features/
- react-hook-form + Zod for all form validation
- @dnd-kit for drag-drop interactions
- recharts for data visualization

### v2.0 Decisions (Phase 6)

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

## Session Continuity

**Last session:** 2026-01-24T15:48:57Z
**Stopped at:** Completed 06-01-PLAN.md (Attendance backend)
**Resume file:** None — ready for next plan in Phase 6

## Known Limitations

None - all v2.0 foundation issues resolved.

## Next Action

Run `/gsd:plan-phase 6` to create executable plans for Athletes & Roster Management phase.

**Phase 6 Scope:**
- Athletes page with grid/list views, search, filters
- Athlete profile with biometrics editing
- Bulk CSV import with preview
- Attendance recording and history
- Light/field theme CSS fixes
- Table virtualization

---
*Last updated: 2026-01-24 — Completed 06-01: Attendance backend*
