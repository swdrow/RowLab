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
- [x] 02-01-PLAN.md — Context store, theme hook, shared stores (foundations)
- [x] 02-02-PLAN.md — ContextRail component (workspace switching)
- [x] 02-03-PLAN.md — WorkspaceSidebar component (context-aware navigation)
- [x] 02-04-PLAN.md — ShellLayout integration + keyboard navigation

**Success Criteria:**
- [x] Shell renders with rail + sidebar + content areas
- [x] Context switching between Me/Coach/Admin works
- [x] Theme persists across sessions (dark mode; light/field deferred)
- [x] V1 stores accessible from V2 components

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

**Plans:** 8 plans

Plans:
- [x] 03-01-PLAN.md — Install TanStack Query v5 and QueryClientProvider setup
- [x] 03-02-PLAN.md — Dashboard preferences API (GET/PUT /api/v1/dashboard-preferences)
- [x] 03-03-PLAN.md — Activity feed API with deduplication service
- [x] 03-04-PLAN.md — TanStack Query hooks (useDashboardPrefs, useActivityFeed)
- [x] 03-05-PLAN.md — Adaptive headline hook and HeadlineWidget component
- [x] 03-06-PLAN.md — ActivityCard and UnifiedActivityFeed components
- [x] 03-07-PLAN.md — DashboardGrid with bento layout and MeDashboard page
- [x] 03-08-PLAN.md — Human verification checkpoint

**Bug Fixes During Verification:**
- Merged V2 Tailwind tokens into main config (V2 config wasn't being used by PostCSS)
- Renamed conflicting tokens: `text-text-*` → `text-txt-*`, `border-border-*` → `border-bdr-*`
- Fixed `card-bg` token to use elevated surface color for proper contrast

**Success Criteria:**
- [x] Dashboard shows personalized headline (skeleton renders; content requires auth)
- [x] C2 and Strava data display correctly (API ready; requires auth)
- [x] Activity feed deduplicates across sources (dedup service implemented)
- [x] User can pin/hide dashboard modules (preferences API and drag-drop ready)

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

**Plans:** 11 plans

Plans:
- [ ] 04-01-PLAN.md — Install npm packages (react-hook-form, resolvers, md-editor)
- [ ] 04-02-PLAN.md — Whiteboard API endpoints (CRUD + latest)
- [ ] 04-03-PLAN.md — OarSet API endpoints (CRUD)
- [ ] 04-04-PLAN.md — Availability API endpoints (team view, athlete edit)
- [ ] 04-05-PLAN.md — TanStack Query hooks (useWhiteboard, useShells, useOarSets)
- [ ] 04-06-PLAN.md — Availability hooks (useTeamAvailability, useAthleteAvailability)
- [ ] 04-07-PLAN.md — Whiteboard components (WhiteboardView, WhiteboardEditor)
- [ ] 04-08-PLAN.md — Fleet components (tables, forms, CrudModal)
- [ ] 04-09-PLAN.md — Availability components (AvailabilityGrid, AvailabilityEditor)
- [ ] 04-10-PLAN.md — Coach pages (CoachWhiteboard, CoachFleet, CoachAvailability)
- [ ] 04-11-PLAN.md — Human verification checkpoint

**Success Criteria:**
- Coach can post daily whiteboard
- Fleet inventory manageable
- Availability visible at team level
- All V1 features have V2 equivalents

---

### Phase 5: The Flip

**Goal:** Make V2 the default experience, V1 becomes legacy fallback.

**Delivers:**
- V2 at `/app` (default authenticated entry)
- V1 at `/legacy` (opt-in fallback)
- Feature parity verification
- Usage analytics (V1 vs V2)
- User preference for legacy mode

**Requirements:** FLIP-01 through FLIP-05

**Plans:** 5 plans

Plans:
- [ ] 05-01-PLAN.md — User preference store and redirect hook (legacy mode opt-in)
- [ ] 05-02-PLAN.md — Route migration (V2 at /app, V1 at /legacy)
- [ ] 05-03-PLAN.md — Version toggle component (switch between V1/V2)
- [ ] 05-04-PLAN.md — Route analytics (V1 vs V2 usage tracking)
- [ ] 05-05-PLAN.md — Feature parity checklist and verification checkpoint

**Success Criteria:**
- New users land on V2 by default
- Existing users can access V1 at `/legacy`
- No regressions from V1 feature set
- Analytics tracking V1/V2 adoption

---

## Phase Summary

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 1 | Clean Room Setup | 14 | 4 | Complete |
| 2 | Foundation | 8 | 4 | Complete |
| 3 | Vertical Slice | 14 | 8 | Complete |
| 4 | Migration Loop | 11 | 12 | Complete |
| 5 | The Flip | 5 | 5 | Pending |

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
*Last updated: 2026-01-23 after Phase 5 planning*
