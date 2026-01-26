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
- [x] 07-01-PLAN.md — Erg test types and TanStack Query hooks (data layer)
- [x] 07-02-PLAN.md — Erg tests page with table, filters, and CRUD forms
- [x] 07-03-PLAN.md — Athlete erg history with trend charts and personal bests
- [x] 07-04-PLAN.md — CSV bulk import wizard for erg tests
- [x] 07-05-PLAN.md — Concept2 sync status and manual sync components
- [x] 07-06-PLAN.md — Human verification checkpoint

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

### Phase 8: Lineup Builder (COMPLETE)

**Goal:** Coach can build, manage, and export boat lineups with drag-drop interface and full history.

**Dependencies:** Phase 6 (athlete roster for athlete bank)

**Requirements:** LINE-01, LINE-02, LINE-03, LINE-04, LINE-05, LINE-06, LINE-07, LINE-08, LINE-09, LINE-10, LINE-11, LINE-12, MARG-01, MARG-02, MARG-03, MARG-04, MARG-05, DESIGN-05

**Plans:** 10 plans

Plans:
- [x] 08-01-PLAN.md — Lineup builder foundation (types, AthleteBank, BoatView components)
- [x] 08-02-PLAN.md — Drag-drop with auto-swap (DndContext, SeatSlot, DragOverlay)
- [x] 08-03-PLAN.md — Validation warnings and spring animations
- [x] 08-04-PLAN.md — Undo/redo UI and keyboard shortcuts
- [x] 08-05-PLAN.md — Version history and save/duplicate dialogs
- [x] 08-06-PLAN.md — PDF export (jsPDF + html2canvas)
- [x] 08-07-PLAN.md — Live biometrics panel
- [x] 08-08-PLAN.md — Boat margin visualizer with shell silhouettes
- [x] 08-09-PLAN.md — Mobile UI with tap-to-select workflow
- [x] 08-10-PLAN.md — Page integration and human verification

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

### Phase 9: Seat Racing & Selection (COMPLETE)

**Goal:** Coach can run seat racing sessions with ELO-based rankings and statistically confident athlete comparisons.

**Dependencies:** Phase 6 (athlete roster for assignments)

**Requirements:** SEAT-01, SEAT-02, SEAT-03, SEAT-04, SEAT-05, SEAT-06, SEAT-07, SEAT-08, SEAT-09, SEAT-10

**Plans:** 9 plans

Plans:
- [x] 09-01-PLAN.md — Types and TanStack Query hooks for seat racing data layer
- [x] 09-02-PLAN.md — Rankings table, confidence badges, session list UI components
- [x] 09-03-PLAN.md — Session wizard foundation and Step 1 (metadata)
- [x] 09-04-PLAN.md — Wizard Step 2 (piece and boat management with time entry)
- [x] 09-05-PLAN.md — Wizard Step 3 (athlete assignment to seats)
- [x] 09-06-PLAN.md — Wizard Step 4 (review) and API submission with rating calculation
- [x] 09-07-PLAN.md — Main Seat Racing page and routing integration
- [x] 09-08-PLAN.md — Ratings API endpoint and parameters panel
- [x] 09-09-PLAN.md — Human verification checkpoint

**Bug Fixes During Verification:**
- Fixed `marginCalculationService.js` import statement inside comment block
- Fixed `seatRaces.js` process endpoint to use `results` array directly from `analyzeSession()`

**Delivers:**
- Seat race session creation with metadata
- Piece management (multiple boats per piece)
- Time entry and athlete assignments
- Switch recording between pieces (auto-detected)
- ELO-style ranking calculations
- Confidence intervals on rankings
- Sorted athlete rankings view
- Configurable parameters display (K-factor)
- Note: Advanced matrix seat racing and Bradley-Terry model planned for Phase 14

**Success Criteria:**
1. Coach can create a seat race session with date/conditions, add multiple pieces with boats and times, and assign athletes to seats
2. Coach can record switches between pieces (which athletes swapped) and system tracks all movements
3. System calculates ELO ratings from results and displays confidence intervals (PROVISIONAL/LOW/MEDIUM/HIGH) based on piece count
4. Coach can view athlete rankings sorted by ELO with confidence badges

---

### Phase 10: Training Plans & NCAA Compliance (COMPLETE)

**Goal:** Coach can build periodized training programs with calendar scheduling and NCAA 20-hour rule tracking.

**Dependencies:** Phase 6 (athlete roster for assignments)

**Requirements:** TRAIN-01, TRAIN-02, TRAIN-03, TRAIN-04, TRAIN-05, TRAIN-06, TRAIN-07, TRAIN-08, TRAIN-09, TRAIN-10, ATT-04, NCAA-01, NCAA-02, NCAA-03, NCAA-04

**Plans:** 11 plans

Plans:
- [x] 10-00-PLAN.md — Backend API for NCAA compliance, training load, and attendance-training linkage (ATT-04)
- [x] 10-01-PLAN.md — Dependencies, types, and utility functions
- [x] 10-02-PLAN.md — TanStack Query hooks for training data
- [x] 10-03-PLAN.md — Training calendar with month/week views
- [x] 10-04-PLAN.md — Workout form with dynamic exercises
- [x] 10-05-PLAN.md — Drag-drop calendar rescheduling
- [x] 10-06-PLAN.md — Periodization timeline and blocks
- [x] 10-07-PLAN.md — Plan assignment management
- [x] 10-08-PLAN.md — Compliance dashboard and charts
- [x] 10-09-PLAN.md — NCAA warnings and audit reports
- [x] 10-10-PLAN.md — Page integration and verification

**Feedback for Phase 13:**
- Restructure data model: Practice → Workouts (instead of Workout → Exercises)
- Integration: Calendar → Live Erg session launch

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

### Phase 11: Racing & Regattas (COMPLETE)

**Goal:** Coach can manage regattas, entries, results, and track team rankings against competitors.

**Dependencies:** Phase 8 (lineups for race entries)

**Requirements:** RACE-01, RACE-02, RACE-03, RACE-04, RACE-05, RACE-06, RACE-07, RACE-08, RACE-09, RACE-10, RANK-01, RANK-02, RANK-03, RANK-04, RANK-05

**Plans:** 10 plans

Plans:
- [x] 11-00-PLAN.md — Backend API foundation (routes, schema, seed data)
- [x] 11-01-PLAN.md — Schema, seed data, and TypeScript types
- [x] 11-02-PLAN.md — TanStack Query hooks for regattas, rankings, checklists
- [x] 11-03-PLAN.md — Regatta form components (RegattaForm, EventForm, RaceForm, ResultsForm)
- [x] 11-04-PLAN.md — Results display and margin components
- [x] 11-05-PLAN.md — Warmup calculator utility
- [x] 11-06-PLAN.md — Race day timeline and warmup components
- [x] 11-07-PLAN.md — Pre-race checklist components
- [x] 11-08-PLAN.md — Team rankings components
- [x] 11-09-PLAN.md — Page integration and navigation

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
1. [x] Coach can create regattas with metadata, add races with event details, and link lineup entries to races
2. [x] Coach can enter race results and system auto-calculates margins between finishers; regatta summary shows all results
3. [x] Race Day Command Center shows countdown to next race, heat sheet with progression rules, and warm-up launch schedule
4. [x] Coach can import external rankings, view team's estimated ranking vs competitors with confidence indicators and contributing race data

---

### Phase 12: Settings, Photos & Design Polish

**Goal:** Complete settings migration, athlete photo uploads, and comprehensive design polish to achieve "Precision Instrument" quality across all V2 components.

**Dependencies:** Phases 6-11 (all features complete)

**Requirements:** SET-01, SET-02, SET-03, SET-04, PHOTO-01, PHOTO-02, PHOTO-03, POLISH-01 through POLISH-12

**Delivers:**

#### Settings & Photos
- Full settings page (migrated from V1)
- Integration management (C2, Strava)
- Billing management (Stripe)
- Team member and role management
- Athlete photo upload with face detection cropping
- Automatic headshot standardization via AI cropping service
- Profile photo fallback for non-headshot images

#### Design System Audit
- Token review: colors, spacing, typography, shadows, radii
- Component inventory: audit all V2 components for consistency
- Design language documentation (internal style guide)

#### Component Polish (by feature area)
- **Athletes Page:** Card hover states, profile panel animations, grid/list transitions
- **Erg Data:** Chart styling, table row hover, trend indicators
- **Lineup Builder:** Drag feedback polish, seat slot animations, PDF export styling
- **Seat Racing:** Wizard step transitions, confidence badge styling, rankings table
- **Training Calendar:** Event card design, drag preview, periodization block colors
- **Compliance Dashboard:** Warning styling, chart polish, audit report formatting

#### Micro-Interactions & Animation
- Framer Motion spring configs standardized across app
- Loading skeletons for all data-fetching components
- Button press/hover states with subtle scale transforms
- Modal open/close animations (slide + fade)
- Toast notifications with entrance/exit animations
- Drag-drop feedback (scale, shadow, rotation hints)

#### State Design
- Empty states: Illustrations + helpful CTAs for all list views
- Error states: Friendly error messages with retry actions
- Loading states: Skeleton loaders matching content shape
- Success states: Subtle confirmation feedback (checkmarks, color flash)

#### Theme Consistency
- Dark theme: Final polish, ensure all components render correctly
- Light theme: Fix CSS cascade issues, ensure contrast ratios
- Field theme: High-contrast outdoor mode, large touch targets

#### Responsive & Mobile
- Mobile breakpoint audit (all pages tested at 375px, 768px, 1024px)
- Touch-friendly tap targets (minimum 44px)
- Mobile navigation polish
- Swipe gestures where appropriate (calendar, cards)

#### Accessibility (WCAG 2.1 AA)
- Focus ring visibility on all interactive elements
- Keyboard navigation for all features
- Screen reader labels (aria-labels, roles)
- Color contrast verification (4.5:1 minimum)
- Reduced motion support (@media prefers-reduced-motion)

#### Typography & Icons
- Type scale audit (consistent heading hierarchy)
- Icon system review (Lucide icons, consistent sizing)
- Text truncation with tooltips for long content

**Success Criteria:**
1. User can access complete settings page with all V1 settings functionality intact
2. User can connect/disconnect integrations (Concept2, Strava) and see connection status
3. Team owner can manage billing through Stripe integration
4. Coach can manage team members, invite new members, and assign roles
5. Coach can upload athlete photos; system auto-detects faces and crops to standardized headshot format
6. Non-headshot photos (team photos, action shots) can be uploaded as profile photos without cropping
7. All components pass design audit against "Precision Instrument" checklist (Raycast/Linear/Vercel quality)
8. All interactive elements have polished hover, focus, and active states with appropriate animations
9. App renders correctly across dark, light, and field themes with no CSS cascade issues
10. All pages are responsive and usable on mobile devices (375px minimum)
11. App meets WCAG 2.1 AA accessibility standards (keyboard nav, screen readers, contrast)
12. Loading, empty, and error states are designed and implemented for all data views

---

### Phase 13: Cross-Feature Integrations

**Goal:** Tie features together to create seamless workflows across calendar, live erg monitoring, performance tracking, and attendance.

**Dependencies:** Phase 7 (Erg Data), Phase 10 (Training Plans)

**Requirements:** INT-01 through INT-08 (to be defined during planning)

**Plans:** 12 plans

Plans:
- [ ] 13-01-PLAN.md — Dependencies and Prisma Session/Piece models
- [ ] 13-02-PLAN.md — TypeScript types and TanStack Query hooks for sessions
- [ ] 13-03-PLAN.md — Sessions API backend (CRUD, live-data, join)
- [ ] 13-04-PLAN.md — Global search with cmdk CommandPalette
- [ ] 13-05-PLAN.md — Live Erg dashboard components with polling
- [ ] 13-06-PLAN.md — Live erg data API endpoint
- [ ] 13-07-PLAN.md — Automatic attendance recording
- [ ] 13-08-PLAN.md — Activity feed with infinite scroll
- [ ] 13-09-PLAN.md — Cross-feature navigation (HoverCard, Breadcrumbs, Header)
- [ ] 13-10-PLAN.md — Session creation UI (form, pieces, recurrence)
- [ ] 13-11-PLAN.md — Session pages and route registration
- [ ] 13-12-PLAN.md — Dashboard widgets with react-grid-layout

**Planned Features:**

1. **Training Data Model Restructure**
   - Rename: Practice → Session (calendar event), Workout → Piece (segment within session)
   - Practice types: Erg, Row, Lift, Run, Cross-train
   - Pieces: 40' SS, 5x4', intervals, etc.

2. **Calendar → Live Erg Integration**
   - Click workout piece in calendar → "Start Live Session"
   - Links to live erg dashboard with rank per piece
   - Athletes connect ergs to scheduled session
   - Real-time data monitoring during practice
   - Post-session: "View Results" shows recorded data

3. **Practice → Performance Tracking**
   - Piece results automatically feed into athlete profiles
   - Historical piece data accessible from calendar events
   - Coach can review any past practice and see all results

4. **Attendance → Training Link Enhancement**
   - Attendance automatically logged when athletes join live session
   - NCAA hours auto-calculated from actual practice participation
   - Discrepancy alerts (scheduled vs actual duration)

5. **Cross-Feature Search**
   - Global search finds athletes, practices, erg tests, lineups
   - Quick navigation between related entities

6. **Unified Activity Timeline**
   - Single view of athlete's complete activity history
   - Combines: erg tests, practice participation, race results, attendance

**Delivers:**
- Restructured Practice → Pieces data model
- Calendar-to-live-erg session launching
- Automatic attendance from session participation
- Cross-feature navigation and linking
- Unified athlete activity timeline

**Success Criteria:**
1. Coach can schedule a practice with multiple pieces, then click a piece to launch a live erg session
2. Athlete erg data from live session automatically links back to the calendar event
3. Attendance is auto-recorded when athletes participate in live sessions
4. Coach can navigate from any entity to related entities (athlete → their practices → their erg results)

---

### Phase 14: Advanced Seat Racing Analytics ⚡ DIFFERENTIATOR

**Goal:** World-class, scientifically rigorous athlete ranking system using matrix seat racing, Bradley-Terry statistical models, optimal swap scheduling, and passive ELO tracking from practice data.

**Dependencies:** Phase 9 (basic seat racing infrastructure), Phase 13 (Session model for passive tracking)

**Research:** Complete (14-RESEARCH.md)

**Requirements:** MATRIX-01 through MATRIX-12

**Plans:** 14 plans

Plans:
- [ ] 14-01-PLAN.md — Dependencies (simple-statistics, jstat, fmin) and TypeScript types
- [ ] 14-02-PLAN.md — Bradley-Terry model service with boat speed normalization (TDD: MLE, confidence intervals, shell bias correction)
- [ ] 14-03-PLAN.md — Matrix planner service (Latin Square scheduling)
- [ ] 14-04-PLAN.md — Composite ranking service and side-specific ELO
- [ ] 14-05-PLAN.md — API endpoints for all advanced ranking features
- [ ] 14-06-PLAN.md — TanStack Query hooks for advanced rankings
- [ ] 14-07-PLAN.md — Comparison graph and probability matrix components (vis-network)
- [ ] 14-08-PLAN.md — Matrix planner UI and swap schedule views
- [ ] 14-09-PLAN.md — Composite rankings UI with weight profile selector
- [ ] 14-10-PLAN.md — Bradley-Terry rankings with confidence visualization
- [ ] 14-11-PLAN.md — Pages, routing, and component exports
- [ ] 14-12-PLAN.md — Navigation integration and human verification
- [ ] 14-13-PLAN.md — Passive ELO tracking service (swap detection, practice observations, 0.5x weight)
- [ ] 14-14-PLAN.md — Passive tracking API endpoints (record observations, apply to ratings)

**Delivers:**
- Bradley-Terry ranking algorithm with MLE optimization
- Boat speed bias correction in Bradley-Terry model
- Matrix session planner with Latin Square scheduling
- Comparison graph visualization (vis-network)
- Probability matrix heatmap (P(A beats B))
- Composite rankings (on-water + erg + attendance)
- Side-specific ELO tracking (port/starboard/cox)
- Weight profile configuration (Performance-First, Balanced, Reliability)
- **Passive ELO tracking from practice data (unique differentiator)**
- Background ELO updates with 0.5x weight for practice observations
- Two new pages: Advanced Rankings, Matrix Planner

**Success Criteria:**
1. Coach can plan a matrix seat race session specifying athletes, boats, and pieces; system generates statistically optimal swap schedule
2. System uses Bradley-Terry model to produce athlete rankings with proper confidence intervals that update as more data is collected
3. Coach can see comparison graph showing which athletes have direct/indirect comparisons and where gaps exist
4. Rankings account for boat speed differences and environmental conditions across pieces
5. Scientific methodology is documented and defensible to NCAA compliance or coaching staff review
6. Composite rankings incorporate erg performance and attendance as coach-configurable secondary factors with clear weight breakdown
7. Coach can view ranking breakdown showing contribution from on-water performance (primary), erg tests, and attendance
8. Practice observations automatically update ELO rankings with reduced weight (0.5x) when lineup changes with time data are detected

---

## Milestone: v2.1 — Feature Expansion (PLANNED)

Feature toggles, gamification, design overhaul, and lineup improvements.

### Phase 15: Feature Toggles & Recruiting

**Goal:** Progressive unlock system for advanced features and basic recruit visit management.

**Dependencies:** Phase 12 (settings)

**Requirements:** TOGGLE-01, TOGGLE-02, RECRUIT-01 through RECRUIT-03, NOTIFY-01

**Plans:** 10 plans

Plans:
- [ ] 15-01-PLAN.md — Feature preferences store and TypeScript types
- [ ] 15-02-PLAN.md — Feature toggle UI in settings (FeaturesSection, FeatureGroupCard)
- [ ] 15-03-PLAN.md — Navigation/page conditional rendering (FeatureGuard, FeatureDiscoveryHint)
- [ ] 15-04-PLAN.md — Recruit visit Prisma schema and CRUD API endpoints
- [ ] 15-05-PLAN.md — TanStack Query hooks and calendar event components
- [ ] 15-06-PLAN.md — Lexical rich text editor and DOMPurify sanitization
- [ ] 15-07-PLAN.md — Visit schedule form (PDF upload + rich text)
- [ ] 15-08-PLAN.md — Host athlete dashboard widget and recruiting page
- [ ] 15-09-PLAN.md — Sonner toast notifications and notification preferences
- [ ] 15-10-PLAN.md — Integration verification checkpoint

**Delivers:**
- Progressive unlock system in team settings
- Feature groups (Core always on, Advanced opt-in)
- Feature-gated navigation (disabled features hidden)
- Recruit visit calendar events with host assignment
- Visit schedule upload (PDF) or creation (rich text)
- Host athlete dashboard widget for assigned visits
- Smart notifications foundation (Sonner toasts, preferences store)

**Success Criteria:**
1. Coach can toggle advanced features on/off in settings
2. UI adapts to show only enabled features (navigation hides disabled)
3. Coach can create recruit visits with host assignment
4. Host athlete sees assigned visits in dashboard
5. Visit schedules can be uploaded (PDF) or created inline (rich text)

---

### Phase 16: Gamification & Engagement ✅

**Goal:** Achievement system, PRs, team challenges, and engagement features.

**Dependencies:** Phase 6-7 (athlete data, erg data)

**Requirements:** ACH-01, ACH-02, PR-01, PR-02, CHAL-01, CHAL-02, JOURNEY-01, STREAK-01

**Plans:** 12 plans

Plans:
- [x] 16-01-PLAN.md — Prisma schema (Achievement, PersonalRecord, Challenge, Streak models)
- [x] 16-02-PLAN.md — TypeScript types for gamification domain
- [x] 16-03-PLAN.md — Achievement service (definition, progress, unlocking)
- [x] 16-04-PLAN.md — Personal records service (PR detection, ranks, history)
- [x] 16-05-PLAN.md — Challenge service (creation, enrollment, leaderboards)
- [x] 16-06-PLAN.md — TanStack Query hooks (achievements, PRs, challenges)
- [x] 16-07-PLAN.md — Streak service (PostgreSQL window functions)
- [x] 16-08-PLAN.md — Achievement UI (badges, progress, grid with rarity)
- [x] 16-09-PLAN.md — PR celebration UI (inline gold highlight, shareable cards)
- [x] 16-10-PLAN.md — Challenge UI (leaderboard with 5s polling, create form)
- [x] 16-11-PLAN.md — Pages (StreakDisplay, SeasonJourney, AchievementsPage, ChallengesPage)
- [x] 16-12-PLAN.md — Routes and navigation integration

**Delivers:**
- Achievement system with badges and milestones
- Personal records wall with celebrations
- Team challenges with leaderboards
- Season journey visualization
- Streak tracking
- Per-athlete gamification opt-out

**Success Criteria:**
1. ✅ Athletes earn achievements automatically
2. ✅ New PRs trigger celebratory animations
3. ✅ Coach can create team challenges
4. ✅ Athletes can view season journey timeline

---

### Phase 17: Complete Design Overhaul 🎨

**Goal:** Rebuild design system with "Rowing Instrument" aesthetic.

**Dependencies:** All previous phases (components to update)

**Requirements:** DESIGN-01 through DESIGN-07

**Delivers:**
- Warm color system (dark and light modes)
- Typography system with data-forward metrics
- Component library rebuild with tactile interactions
- Animation system (spring physics)
- Theme polish (dark, light, field)
- Mobile responsive overhaul
- Landing page redesign

**Success Criteria:**
1. Color system updated with warm tones
2. All components have satisfying interactions
3. Animations consistent with spring physics
4. Landing page matches app aesthetic

---

### Phase 18: Lineup & Boat Configuration Improvements

**Goal:** Enhanced lineup builder with custom configs, rigging, and equipment tracking.

**Dependencies:** Phase 8 (lineup builder), Phase 4 (fleet)

**Requirements:** BOAT-01 through BOAT-04, LINEUP-01 through LINEUP-05

**Delivers:**
- Custom boat configurations
- Rigging profiles per boat/athlete
- Equipment assignment and tracking
- Lineup comparison view
- Historical lineup analysis
- Lineup templates
- Enhanced PDF export

**Success Criteria:**
1. Coach can create custom boat configurations
2. Rigging settings stored per boat
3. Equipment conflicts are warned
4. Lineups can be compared side-by-side

---

## Milestone: v2.2 — Advanced Analytics (PLANNED)

Telemetry, AI optimization, predictive modeling, and mobile coxswain experience.

### Phase 19: Telemetry & Combined Scoring

**Goal:** Import telemetry data from rowing sensors and create combined rankings.

**Dependencies:** Phase 14 (rankings foundation)

**Requirements:** TEL-01 through TEL-08

**Delivers:**
- Empower, Peach, NK SpeedCoach import
- Force curve visualization
- Stroke timing and synchronization analysis
- Combined scoring engine
- Multi-metric rankings

**Success Criteria:**
1. Coach can import telemetry files from major vendors
2. Force curves and stroke timing visualizations work
3. Combined scoring produces multi-source rankings

---

### Phase 20: AI Lineup Optimizer (v2)

**Goal:** AI-powered lineup recommendations with explanations.

**Dependencies:** Phase 8, Phase 14, Phase 19

**Requirements:** AI-01 through AI-08

**Delivers:**
- Enhanced multi-objective optimization
- Constraint configuration
- Scenario comparison view
- Explanation system
- Coach override learning
- Optional LLM integration

**Success Criteria:**
1. AI generates recommendations with clear explanations
2. Constraints respected and violations flagged
3. Coach can compare scenarios side-by-side

---

### Phase 21: Predictive Analytics

**Goal:** Data-driven predictions for performance, 2k potential, and injury risk.

**Dependencies:** Phase 7, Phase 10, Phase 14, Phase 19

**Requirements:** PRED-01 through PRED-08

**Delivers:**
- Predictive 2k calculator
- Race outcome predictions
- Training response modeling
- Injury risk indicators
- Progress projections
- Prediction dashboard

**Success Criteria:**
1. 2k predictions within 3 seconds 80% of time
2. Injury risk indicators >60% accuracy
3. All predictions include uncertainty communication

---

### Phase 22: Coxswain Mobile View

**Goal:** Dedicated mobile interface for on-water use with offline support.

**Dependencies:** Phase 13 (sessions), PWA infrastructure

**Requirements:** COX-01 through COX-08

**Delivers:**
- Mobile-optimized layout (56px touch targets)
- Lineup reference
- Piece timer with audio cues
- Stroke rate counter
- Full offline mode
- Race day mode
- Coach communication

**Success Criteria:**
1. Works entirely offline
2. Usable in direct sunlight
3. Times sync when connectivity restored

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

### v2.0 Milestone (Complete)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 6 | Athletes & Roster | 14 | 8 | Complete |
| 7 | Erg Data & Performance | 9 | 6 | Complete |
| 8 | Lineup Builder | 18 | 10 | Complete |
| 9 | Seat Racing | 10 | 9 | Complete |
| 10 | Training Plans & NCAA | 15 | 11 | Complete |
| 11 | Racing & Regattas | 15 | 10 | Complete |
| 12 | Settings & Polish | 19 | 17 | Complete |
| 13 | Cross-Feature Integrations | 8 | 12 | Complete |
| 14 | Advanced Seat Racing Analytics | 12 | 14 | Complete |

**v2.0 Total:** 120 requirements across 9 phases

### v2.1 Milestone (In Progress)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 15 | Feature Toggles & Recruiting | 6 | 10 | Complete ✅ |
| 16 | Gamification & Engagement | 8 | 12 | Complete ✅ |
| 17 | Complete Design Overhaul | 7 | TBD | Planned |
| 18 | Lineup & Boat Improvements | 9 | TBD | Planned |

**v2.1 Total:** 30 requirements across 4 phases (2 complete, 2 planned)

### v2.2 Milestone (Planned)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 19 | Telemetry & Combined Scoring | 8 | TBD | Planned |
| 20 | AI Lineup Optimizer (v2) | 8 | TBD | Planned |
| 21 | Predictive Analytics | 8 | TBD | Planned |
| 22 | Coxswain Mobile View | 8 | TBD | Planned |

**v2.2 Total:** 32 requirements across 4 phases

---

## Research Flags

Phases requiring deeper research during planning:

| Phase | Topic | Reason |
|-------|-------|--------|
| 8 | Drag-drop with undo/redo | Complex @dnd-kit + Zustand temporal middleware integration |
| 9 | ELO calculation | Optimal K-factor for rowing, confidence intervals, edge cases |
| 10 | Calendar integration | react-big-calendar virtualization, mobile-first patterns |
| 14 | **Bradley-Terry & Matrix Racing** | **DEEP RESEARCH COMPLETE** — See 14-RESEARCH.md |
| 15 | **Feature toggles & Recruiting** | **RESEARCH COMPLETE** — See 15-RESEARCH.md |
| 16 | **Gamification patterns** | Achievement system design, streak mechanics, engagement psychology |
| 17 | **Design system rebuild** | Framer Motion patterns, spring physics, satisfying interactions |
| 19 | **Telemetry file formats** | Empower, Peach, NK have different file structures and metrics |
| 20 | **AI/LLM integration** | GPT/Claude API patterns, prompt engineering for lineup optimization |
| 21 | **Predictive modeling** | ML model selection, training data requirements, accuracy metrics |
| 22 | **PWA offline patterns** | Service worker caching, IndexedDB, background sync strategies |

Phases with standard patterns (skip research):
- Phase 6: Standard CRUD with virtualization
- Phase 7: Chart library already used, CSV patterns established
- Phase 11: Hierarchical CRUD, established patterns
- Phase 12: Settings migration, no new patterns
- Phase 18: Lineup builder extensions, established patterns

---

*Roadmap created: 2026-01-23*
*Last updated: 2026-01-26 — Phase 15 planning complete (10 plans in 5 waves)*
