# Roadmap: RowLab UX Redesign

**Created:** 2026-01-23
**Core Value:** Athletes and coaches get a context-aware dashboard experience that adapts to their role

## Milestone: v1.0 — Full UX Redesign

Ground-up rebuild with multi-persona Workspace/Context architecture using In-Place Strangler pattern.

### Phase 1: Clean Room Setup

**Goal:** Establish V2 foundation with isolated entry point, design tokens, and build infrastructure.

**Delivers:**
- V2 entry point at `/beta` route
- Design tokens system (CSS custom properties)
- Tailwind config extensions for V2
- CSS isolation via `.v2` class scoping
- Backend schema planning (new Prisma models)

**Requirements:** SETUP-01, SETUP-02, SETUP-03, SETUP-06, MODEL-01 through MODEL-08

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Frontend foundation (V2 directory, design tokens, Tailwind config)
- [x] 01-02-PLAN.md — Backend schema (Prisma models for V2 features)
- [x] 01-03-PLAN.md — V2 entry point (V2Layout + /beta routes)
- [x] 01-04-PLAN.md — Verification checkpoint (human verification)

**Success Criteria:**
- `/beta` route renders V2 app shell
- Design tokens applied via CSS variables
- Prisma schema updated with new models
- Migration runs successfully

---

### Phase 2: Foundation (Shell & Context)

**Goal:** Build the application shell with context-aware navigation and theme system.

**Delivers:**
- ContextRail component (workspace switching)
- WorkspaceSidebar (context-aware navigation)
- ShellLayout wrapper
- Theme persistence (dark/light/field)
- Shared Zustand store integration

**Requirements:** SETUP-04, SETUP-05, SHELL-01 through SHELL-06

**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md — Context store, theme hook, shared stores (foundations)
- [ ] 02-02-PLAN.md — ContextRail component (workspace switching)
- [ ] 02-03-PLAN.md — WorkspaceSidebar component (context-aware navigation)
- [ ] 02-04-PLAN.md — ShellLayout integration + keyboard navigation

**Success Criteria:**
- Shell renders with rail + sidebar + content areas
- Context switching between Me/Coach/Admin works
- Theme persists across sessions
- V1 stores accessible from V2 components

---

### Phase 3: Vertical Slice (Personal Dashboard)

**Goal:** Complete "Me" context with adaptive dashboard and data integrations.

**Delivers:**
- Dashboard page at `/beta/me`
- Adaptive HeadlineWidget with heuristics
- Concept2 logbook integration widget
- Strava activity feed widget
- Unified activity feed with deduplication
- Dashboard preferences API
- Activity API with source tracking

**Requirements:** DASH-01 through DASH-08, MODEL-07, API-03, API-04, API-06, API-08, API-09

**Success Criteria:**
- Dashboard shows personalized headline
- C2 and Strava data display correctly
- Activity feed deduplicates across sources
- User can pin/hide dashboard modules

---

### Phase 4: Migration Loop

**Goal:** Migrate coach features and remaining V1 functionality to V2.

**Delivers:**
- Team Whiteboard (view and edit)
- Fleet Management (shells and oars)
- Athlete biometrics and availability
- Team-wide availability calendar
- All remaining V1 features accessible

**Requirements:** COACH-01 through COACH-07, API-01, API-02, API-05, API-07

**Success Criteria:**
- Coach can post daily whiteboard
- Fleet inventory manageable
- Availability visible at team level
- All V1 features have V2 equivalents

---

### Phase 5: The Flip

**Goal:** Make V2 the default experience, V1 becomes legacy fallback.

**Delivers:**
- V2 at `/` (default)
- V1 at `/legacy` (opt-in fallback)
- Feature parity verification
- Usage analytics (V1 vs V2)
- User preference for legacy mode

**Requirements:** FLIP-01 through FLIP-05

**Success Criteria:**
- New users land on V2 by default
- Existing users can access V1 at `/legacy`
- No regressions from V1 feature set
- Analytics tracking V1/V2 adoption

---

## Phase Summary

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 1 | Clean Room Setup | 14 | 4 | ● Complete |
| 2 | Foundation | 8 | 4 | ○ Planned |
| 3 | Vertical Slice | 14 | — | ○ Pending |
| 4 | Migration Loop | 11 | — | ○ Pending |
| 5 | The Flip | 5 | — | ○ Pending |

**Total:** 45 requirements across 5 phases

---

## Parallel Workstreams

This roadmap uses parallel frontend/backend workstreams:

```
Phase 1-2: [FE] Shell Setup    + [BE] Schema Planning
Phase 3:   [FE] Dashboard      + [BE] Data Integration APIs
Phase 4:   [FE] Feature Migration + [BE] New Feature APIs
Phase 5:   [BOTH] The Flip
```

Backend APIs are scheduled to complete before frontend features need them.

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-23 after Phase 2 planning*
