# Roadmap: RowLab UX Redesign

**Created:** 2026-01-23
**Core Value:** Athletes and coaches get a context-aware dashboard experience that adapts to their role

## Milestone: v1.0 — Full UX Redesign (COMPLETE)

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
- [x] 04-01-PLAN.md — Install npm packages (react-hook-form, resolvers, md-editor)
- [x] 04-02-PLAN.md — Whiteboard API endpoints (CRUD + latest)
- [x] 04-03-PLAN.md — OarSet API endpoints (CRUD)
- [x] 04-04-PLAN.md — Availability API endpoints (team view, athlete edit)
- [x] 04-05-PLAN.md — TanStack Query hooks (useWhiteboard, useShells, useOarSets)
- [x] 04-06-PLAN.md — Availability hooks (useTeamAvailability, useAthleteAvailability)
- [x] 04-07-PLAN.md — Whiteboard components (WhiteboardView, WhiteboardEditor)
- [x] 04-08-PLAN.md — Fleet components (tables, forms, CrudModal)
- [x] 04-09-PLAN.md — Availability components (AvailabilityGrid, AvailabilityEditor)
- [x] 04-10-PLAN.md — Coach pages (CoachWhiteboard, CoachFleet, CoachAvailability)
- [x] 04-11-PLAN.md — Human verification checkpoint
- [x] 04-12-PLAN.md — Athlete biometrics (schema, API, types)

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
- [x] 05-01-PLAN.md — User preference store and redirect hook (legacy mode opt-in)
- [x] 05-02-PLAN.md — Route migration (V2 at /app, V1 at /legacy)
- [x] 05-03-PLAN.md — Version toggle component (switch between V1/V2)
- [x] 05-04-PLAN.md — Route analytics (V1 vs V2 usage tracking)
- [x] 05-05-PLAN.md — Feature parity checklist and verification checkpoint

**Success Criteria:**
- New users land on V2 by default
- Existing users can access V1 at `/legacy`
- No regressions from V1 feature set
- Analytics tracking V1/V2 adoption

---

## Milestone: v2.0 — Core Migration (ACTIVE)

Complete V1 to V2 feature migration with world-class UI following "Precision Instrument" design philosophy (Raycast/Linear/Vercel inspired).

### Phase 6: Athletes & Roster Management

**Goal:** Coach has complete visibility into roster with filtering, biometrics, and attendance tracking.

**Dependencies:** None (foundation for all subsequent phases)

**Requirements:** ATH-01, ATH-02, ATH-03, ATH-04, ATH-05, ATH-06, ATH-07, ATH-08, ATT-01, ATT-02, ATT-03, DESIGN-02, DESIGN-03, DESIGN-04

**Plans:** 8 plans

Plans:
- [x] 06-01-PLAN.md — Attendance schema and backend API
- [x] 06-02-PLAN.md — Install @tanstack/react-virtual and VirtualTable component
- [x] 06-03-PLAN.md — Athlete and Attendance types with TanStack Query hooks
- [x] 06-04-PLAN.md — Athletes page with grid/list views, search, filters, profile panel
- [x] 06-05-PLAN.md — CSV bulk import wizard modal
- [x] 06-06-PLAN.md — Attendance recording and history components
- [x] 06-07-PLAN.md — Light and field theme CSS fixes
- [x] 06-08-PLAN.md — Human verification checkpoint

**Delivers:**
- Athletes page with grid/list views
- Search and filter by side preference and capabilities
- Athlete profile with biometrics editing
- Bulk CSV import with preview validation
- Daily attendance recording (present, late, excused, unexcused)
- Attendance history and team summary
- Light/field theme CSS fixes
- Table virtualization for 100+ rows

**Success Criteria:**
1. Coach can view full roster in grid or list view, switch between views, and see all athlete biometrics at a glance
2. Coach can search by name and filter by side preference (port/starboard/both) and capabilities (scull, cox) to find specific athletes
3. Coach can bulk import 50+ athletes from CSV with column mapping preview, and system validates format before committing
4. Coach can record attendance for any practice date and view attendance history for individual athletes or team-wide summaries
5. Tables with 100+ athletes scroll smoothly at 60 FPS with virtualization

---

### Phase 7: Erg Data & Performance

**Goal:** Coach and athletes can track, analyze, and compare erg test performance over time.

**Dependencies:** Phase 6 (athlete roster exists)

**Requirements:** ERG-01, ERG-02, ERG-03, ERG-04, ERG-05, ERG-06, ERG-07, ERG-08, ERG-09

**Plans:** 6 plans

Plans:
- [ ] 07-01-PLAN.md — Erg test types and TanStack Query hooks (data layer)
- [ ] 07-02-PLAN.md — Erg tests page with table, filters, and CRUD forms
- [ ] 07-03-PLAN.md — Athlete erg history with trend charts and personal bests
- [ ] 07-04-PLAN.md — CSV bulk import wizard for erg tests
- [ ] 07-05-PLAN.md — Concept2 sync status and manual sync components
- [ ] 07-06-PLAN.md — Human verification checkpoint

**Delivers:**
- Team erg tests table (sortable, filterable)
- Manual erg test CRUD operations
- Athlete erg history with trend charts
- Bulk CSV import for erg tests
- Concept2 sync status display
- Manual C2 sync trigger

**Success Criteria:**
1. Coach can view all team erg tests in a sortable table, filtering by test type (2k, 6k, etc.) and date range
2. Coach can add, edit, and delete individual erg test results with immediate UI feedback
3. Athlete can view their personal erg history with a line chart showing progress over time
4. Coach can bulk import erg tests from CSV and see which athletes have Concept2 connections with last sync timestamps

---

### Phase 8: Lineup Builder

**Goal:** Coach can build, manage, and export boat lineups with drag-drop interface and full history.

**Dependencies:** Phase 6 (athlete roster for athlete bank)

**Requirements:** LINE-01, LINE-02, LINE-03, LINE-04, LINE-05, LINE-06, LINE-07, LINE-08, LINE-09, LINE-10, LINE-11, LINE-12, MARG-01, MARG-02, MARG-03, MARG-04, MARG-05, DESIGN-05

**Delivers:**
- Lineup builder with boat class selection (8+, 4+, 2x, etc.)
- Drag-drop athletes from bank to seats
- Seat rearrangement and removal
- Seat validation (port/starboard, coxswain)
- Undo/redo with keyboard shortcuts
- Lineup history and versioning
- Save, duplicate, and name lineups
- Print-ready PDF export
- Live average biometrics display
- Boat margin visualizer with shell silhouettes
- Spring-physics drag animations

**Success Criteria:**
1. Coach can create a lineup by selecting boat class, then drag athletes from the bank to seats with spring-physics animation feedback
2. Coach can rearrange athletes between seats or remove them back to bank, with system validating port/starboard preferences and coxswain seat rules
3. Coach can undo/redo any action with Ctrl+Z/Ctrl+Shift+Z, view lineup history, and restore previous versions
4. Coach can save lineup with name/date, duplicate existing lineups, and export print-ready PDF with high-contrast large font
5. Coach can view margin visualizer showing boat silhouettes with calculated distance gaps based on piece times

---

### Phase 9: Seat Racing & Selection

**Goal:** Coach can run seat racing sessions with ELO-based rankings and statistically confident athlete comparisons.

**Dependencies:** Phase 6 (athlete roster for assignments)

**Requirements:** SEAT-01, SEAT-02, SEAT-03, SEAT-04, SEAT-05, SEAT-06, SEAT-07, SEAT-08, SEAT-09, SEAT-10

**Delivers:**
- Seat race session creation with metadata
- Piece management (multiple boats per piece)
- Time entry and athlete assignments
- Switch recording between pieces
- ELO-style ranking calculations
- Confidence intervals on rankings
- Sorted athlete rankings view
- Optimal switch sequence generator
- Configurable parameters (K-factor, piece weight)

**Success Criteria:**
1. Coach can create a seat race session with date/conditions, add multiple pieces with boats and times, and assign athletes to seats
2. Coach can record switches between pieces (which athletes swapped) and system tracks all movements
3. System calculates ELO ratings from results and displays confidence intervals (PROVISIONAL/LOW/MEDIUM/HIGH) based on piece count
4. Coach can view athlete rankings sorted by ELO with confidence badges, and system suggests optimal switch sequences to minimize pieces for statistically significant results

---

### Phase 10: Training Plans & NCAA Compliance

**Goal:** Coach can build periodized training programs with calendar scheduling and NCAA 20-hour rule tracking.

**Dependencies:** Phase 6 (athlete roster for assignments)

**Requirements:** TRAIN-01, TRAIN-02, TRAIN-03, TRAIN-04, TRAIN-05, TRAIN-06, TRAIN-07, TRAIN-08, TRAIN-09, TRAIN-10, ATT-04, NCAA-01, NCAA-02, NCAA-03, NCAA-04

**Delivers:**
- Training calendar (month/week views)
- Workout creation and calendar placement
- Drag-to-reschedule workouts
- Periodization blocks (base, build, peak, taper)
- Template application to date ranges
- Individual/group workout assignments
- Athlete view of assigned plans
- Workout completion marking
- Coach compliance dashboard
- Training load calculations (TSS/volume)
- NCAA daily/weekly hour tracking
- 20-hour limit warnings
- NCAA compliance audit reports
- Attendance linked to training sessions

**Success Criteria:**
1. Coach can view training calendar in month or week view, create workouts, and drag them to reschedule with visual feedback
2. Coach can define periodization blocks (base/build/peak/taper), apply templates to date ranges, and assign plans to individuals or groups
3. Athlete can view their assigned training plan and mark workouts as completed; coach sees compliance dashboard showing who completed what
4. System tracks NCAA hours (daily and weekly totals), warns when approaching 20-hour limit, and generates audit-ready compliance reports

---

### Phase 11: Racing & Regattas

**Goal:** Coach can manage regattas, entries, results, and track team rankings against competitors.

**Dependencies:** Phase 8 (lineups for race entries)

**Requirements:** RACE-01, RACE-02, RACE-03, RACE-04, RACE-05, RACE-06, RACE-07, RACE-08, RACE-09, RACE-10, RANK-01, RANK-02, RANK-03, RANK-04, RANK-05

**Delivers:**
- Regatta management (name, location, dates)
- Race creation within regattas
- Race entries linked to lineups
- Result entry (time, place, margin)
- Auto-calculated margins
- Regatta results summary
- Team rankings from results
- Race Day Command Center
- Heat sheet with progression rules
- Warm-up launch schedule
- External rankings import (Row2k, USRowing, RegattaCentral)
- Internal speed estimates
- Team ranking vs competitors
- Ranking confidence and contributing races

**Success Criteria:**
1. Coach can create regattas with metadata, add races with event details, and link lineup entries to races
2. Coach can enter race results and system auto-calculates margins between finishers; regatta summary shows all results
3. Race Day Command Center shows countdown to next race, heat sheet with progression rules, and warm-up launch schedule
4. Coach can import external rankings, view team's estimated ranking vs competitors with confidence indicators and contributing race data

---

### Phase 12: Settings & Polish

**Goal:** Complete settings migration and ensure all components follow Precision Instrument design language.

**Dependencies:** Phases 6-11 (all features complete)

**Requirements:** SET-01, SET-02, SET-03, SET-04

**Delivers:**
- Full settings page (migrated from V1)
- Integration management (C2, Strava)
- Billing management (Stripe)
- Team member and role management

**Success Criteria:**
1. User can access complete settings page with all V1 settings functionality intact
2. User can connect/disconnect integrations (Concept2, Strava) and see connection status
3. Team owner can manage billing through Stripe integration
4. Coach can manage team members, invite new members, and assign roles

---

## Cross-Cutting Requirements

The following requirements apply across all v2.0 phases:

| Requirement | Description | Application |
|-------------|-------------|-------------|
| DESIGN-01 | All components follow "Precision Instrument" design language | Every phase |
| DESIGN-06 | All forms follow react-hook-form + Zod validation pattern | Phases 6-12 |

---

## Phase Summary

### v1.0 Milestone (Complete)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 1 | Clean Room Setup | 14 | 4 | Complete |
| 2 | Foundation | 8 | 4 | Complete |
| 3 | Vertical Slice | 14 | 8 | Complete |
| 4 | Migration Loop | 11 | 12 | Complete |
| 5 | The Flip | 5 | 5 | Complete |

**v1.0 Total:** 52 requirements across 5 phases

### v2.0 Milestone (Active)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 6 | Athletes & Roster | 14 | 8 | Complete |
| 7 | Erg Data & Performance | 9 | 6 | Pending |
| 8 | Lineup Builder | 18 | — | Pending |
| 9 | Seat Racing | 10 | — | Pending |
| 10 | Training Plans & NCAA | 15 | — | Pending |
| 11 | Racing & Regattas | 15 | — | Pending |
| 12 | Settings & Polish | 4 | — | Pending |

**v2.0 Total:** 85 requirements across 7 phases (84 unique + 1 ATT-04 linking)

---

## Research Flags

Phases requiring deeper research during planning (from SUMMARY.md):

| Phase | Topic | Reason |
|-------|-------|--------|
| 8 | Drag-drop with undo/redo | Complex @dnd-kit + Zustand temporal middleware integration |
| 9 | ELO calculation | Optimal K-factor for rowing, confidence intervals, edge cases |
| 10 | Calendar integration | react-big-calendar virtualization, mobile-first patterns |

Phases with standard patterns (skip research):
- Phase 6: Standard CRUD with virtualization
- Phase 7: Chart library already used, CSV patterns established
- Phase 11: Hierarchical CRUD, established patterns
- Phase 12: Settings migration, no new patterns

---

*Roadmap created: 2026-01-23*
*Last updated: 2026-01-24 — Phase 7 plans created*
