# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v1.0 — Full UX Redesign
**Phase:** 1 (Clean Room Setup)
**Status:** In progress
**Last activity:** 2026-01-23 — Completed 01-03-PLAN.md

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Context-aware dashboard experience that adapts to athlete/coach role
**Current focus:** Phase 1 - Clean Room Setup

## Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Clean Room Setup | ◐ In progress | 3/4 |
| 2 | Foundation | ○ Pending | — |
| 3 | Vertical Slice | ○ Pending | — |
| 4 | Migration Loop | ○ Pending | — |
| 5 | The Flip | ○ Pending | — |

Progress: ███░░░░░░░ ~30%

## Quick Context

**Architecture:** In-Place Strangler pattern
- V2 at `/beta` route with `src/v2/` directory
- Shares existing Zustand stores with V1
- V1 remains untouched until V2 feature parity

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS 3.4, Framer Motion

**Codebase Map:** .planning/codebase/ (7 documents, 1,978 lines)

## Accumulated Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | Use selector strategy (important: '.v2') for CSS isolation | Complete isolation without separate builds |
| 01-01 | Three-level token system (palette → semantic → component) | Maintainable design system with theme support |
| 01-01 | Support dark/light/field themes | Field theme for high-contrast outdoor visibility |
| 01-02 | Equipment enums for type safety | Prevents invalid values, provides autocomplete, database validation |
| 01-02 | JSON storage for default schedules | Flexible weekly patterns without separate table per day |
| 01-02 | Activity deduplication at database level | Unique constraint on (source, sourceId) prevents sync duplicates |
| 01-02 | Morning/evening availability granularity | Matches rowing practice scheduling (AM and PM sessions) |
| 01-03 | Theme defaults to dark (no data-theme attribute) | Cleaner markup; only light/field themes set data-theme |
| 01-03 | V2Layout wraps all /beta routes | Provides .v2 class for CSS isolation |
| 01-03 | Use @v2 path alias for V2 lazy imports | Consistent import pattern, works with Vite alias config |

## Session Continuity

**Last session:** 2026-01-23 01:57:20 UTC
**Stopped at:** Completed 01-03-PLAN.md
**Resume file:** None

## Next Action

Continue Phase 1 with 01-04-PLAN.md (Component Library Bootstrap) or complete phase.

---
*Last updated: 2026-01-23 — Completed 01-03-PLAN.md*
