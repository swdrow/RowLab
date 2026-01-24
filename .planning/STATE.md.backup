# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v1.0 — Full UX Redesign
**Phase:** 3 (Vertical Slice) — IN PROGRESS
**Status:** Phase 3 plan 02 of 04 complete
**Last activity:** 2026-01-23 — Completed 03-02-PLAN.md (Dashboard Preferences API)

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Context-aware dashboard experience that adapts to athlete/coach role
**Current focus:** Ready for Phase 3 - Vertical Slice (Personal Dashboard)

## Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Clean Room Setup | ● Complete | 4/4 |
| 2 | Foundation | ● Complete | 4/4 |
| 3 | Vertical Slice | ◐ In Progress | 2/4 |
| 4 | Migration Loop | ○ Pending | — |
| 5 | The Flip | ○ Pending | — |

Progress: █████░░░░░ ~50%

## Quick Context

**Architecture:** In-Place Strangler pattern
- V2 at `/beta` route with `src/v2/` directory
- Shares existing Zustand stores with V1
- V1 remains untouched until V2 feature parity

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS 3.4, Framer Motion

**Codebase Map:** .planning/codebase/ (7 documents, 1,978 lines)

## Phase 1 Deliverables

| Plan | Description | Status |
|------|-------------|--------|
| 01-01 | Frontend foundation (tokens, Tailwind) | ● Complete |
| 01-02 | Backend schema (8 Prisma models) | ● Complete |
| 01-03 | V2 entry point (V2Layout + /beta) | ● Complete |
| 01-04 | Verification checkpoint | ● Approved |

**Commits:** 12 commits across 4 plans

## Phase 2 Deliverables

| Plan | Description | Status |
|------|-------------|--------|
| 02-01 | Context store, theme hook, shared stores | ● Complete |
| 02-02 | ContextRail component | ● Complete |
| 02-03 | WorkspaceSidebar component | ● Complete |
| 02-04 | Shell layout integration, keyboard navigation, theme toggle | ● Complete |

**Commits:** 9 task commits + 1 metadata commit

## Phase 3 Deliverables

| Plan | Description | Status |
|------|-------------|--------|
| 03-01 | TanStack Query setup | ● Complete |
| 03-02 | Dashboard preferences API endpoints | ● Complete |
| 03-03 | Dashboard preferences store | ○ Pending |
| 03-04 | Personal dashboard UI | ○ Pending |

**Commits (so far):** 3 task commits

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
| 02-01 | Default context: 'me' (athlete view) | Athlete view is primary use case, coaches/admins are power users |
| 02-01 | System preference as default theme | Respects OS dark mode unless user explicitly overrides |
| 02-01 | Share Zustand store instances via Context, not values | Avoids re-render loop pitfall (Pattern from 02-RESEARCH.md) |
| 02-01 | Three-theme support (dark/light/field) | Matches Phase 1 token system design |
| 02-03 | Use Lucide React icons with string-to-component mapping | contextStore uses string icon names for flexibility, ICON_MAP bridges to components |
| 02-03 | Navigation items from contextStore CONTEXT_CONFIGS | Consume existing navigation config rather than duplicating |
| 02-03 | V2 design tokens for all sidebar styling | Active state uses bg-action-primary, inactive uses text-text-secondary with hover states |
| 02-02 | Use inline SVG icons (Lucide-style) for rail | Avoids icon library dependency, keeps bundle small |
| 02-02 | 64px rail width (w-16) | Comfortable click targets meeting WCAG requirements |
| 02-02 | layoutId="activeContext" for indicator animation | Framer Motion shared element transition pattern |
| 02-04 | Convert useTheme to Zustand for shared state | useState created independent instances; Zustand ensures all V2 components share theme state |
| 02-04 | CSS Grid layout with fixed sidebar widths (rail 64px, sidebar 256px) | Precise layout control, stable across all pages |
| 02-04 | Keyboard shortcuts Ctrl/Cmd+1/2/3 for context switching | Power-user rapid context switching without UI interaction |
| 02-04 | Focus management: move to first sidebar item on context switch | Accessibility requirement for keyboard-only users |
| 02-04 | Scope theme CSS selectors to .v2[data-theme="..."] | data-theme on .v2 div not :root; selectors must match for cascade |
| 02-04 | V1 store access via Context providers (AuthStoreContext, SettingsStoreContext) | V2 components access V1 Zustand stores without cross-contamination |
| 02-04 | Defer light/field theme visual rendering to post-Phase 5 | Dark theme works; light/field have CSS cascade issues; low priority vs. feature development |
| 03-02 | Upsert pattern for dashboard preferences PUT endpoint | Single atomic operation for create-or-update eliminates race conditions |
| 03-02 | Return empty arrays as defaults for missing preferences | Avoids 404 errors for new users, provides predictable response shape |
| 03-02 | Validate hiddenSources against full ActivitySource enum | Includes CALENDAR, WATER_SESSION for future-proofing beyond plan spec |
| 03-02 | Dashboard preferences are per-user, not per-team | authenticateToken without teamIsolation - same preferences across all teams |

## Session Continuity

**Last session:** 2026-01-23 16:17 UTC
**Stopped at:** Completed 03-02-PLAN.md (Dashboard Preferences API)
**Resume file:** None

## Known Limitations

- **Light/Field themes:** CSS cascade issue prevents visual theme changes. Dark theme works. Deferred to post-Phase 5.

## Next Action

Continue Phase 3: Execute plan 03-03 (Dashboard Preferences Store) with `/gsd:execute-phase 3 03`

---
*Last updated: 2026-01-23 — Phase 3 in progress (2/4 plans complete)*
