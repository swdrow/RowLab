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

## Milestone: v2.0 — Core Migration (COMPLETE)

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
- [x] 13-01-PLAN.md — Dependencies and Prisma Session/Piece models
- [x] 13-02-PLAN.md — TypeScript types and TanStack Query hooks for sessions
- [x] 13-03-PLAN.md — Sessions API backend (CRUD, live-data, join)
- [x] 13-04-PLAN.md — Global search with cmdk CommandPalette
- [x] 13-05-PLAN.md — Live Erg dashboard components with polling
- [x] 13-06-PLAN.md — Live erg data API endpoint
- [x] 13-07-PLAN.md — Automatic attendance recording
- [x] 13-08-PLAN.md — Activity feed with infinite scroll
- [x] 13-09-PLAN.md — Cross-feature navigation (HoverCard, Breadcrumbs, Header)
- [x] 13-10-PLAN.md — Session creation UI (form, pieces, recurrence)
- [x] 13-11-PLAN.md — Session pages and route registration
- [x] 13-12-PLAN.md — Dashboard widgets with react-grid-layout

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
- [x] 14-01-PLAN.md — Dependencies (simple-statistics, jstat, fmin) and TypeScript types
- [x] 14-02-PLAN.md — Bradley-Terry model service with boat speed normalization (TDD: MLE, confidence intervals, shell bias correction)
- [x] 14-03-PLAN.md — Matrix planner service (Latin Square scheduling)
- [x] 14-04-PLAN.md — Composite ranking service and side-specific ELO
- [x] 14-05-PLAN.md — API endpoints for all advanced ranking features
- [x] 14-06-PLAN.md — TanStack Query hooks for advanced rankings
- [x] 14-07-PLAN.md — Comparison graph and probability matrix components (vis-network)
- [x] 14-08-PLAN.md — Matrix planner UI and swap schedule views
- [x] 14-09-PLAN.md — Composite rankings UI with weight profile selector
- [x] 14-10-PLAN.md — Bradley-Terry rankings with confidence visualization
- [x] 14-11-PLAN.md — Pages, routing, and component exports
- [x] 14-12-PLAN.md — Navigation integration and human verification
- [x] 14-13-PLAN.md — Passive ELO tracking service (swap detection, practice observations, 0.5x weight)
- [x] 14-14-PLAN.md — Passive tracking API endpoints (record observations, apply to ratings)

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

## Milestone: v2.1 — Feature Expansion (COMPLETE)

Feature toggles, gamification, design overhaul, and lineup improvements.

### Phase 15: Feature Toggles & Recruiting

**Goal:** Progressive unlock system for advanced features and basic recruit visit management.

**Dependencies:** Phase 12 (settings)

**Requirements:** TOGGLE-01, TOGGLE-02, RECRUIT-01 through RECRUIT-03, NOTIFY-01

**Plans:** 10 plans

Plans:
- [x] 15-01-PLAN.md — Feature preferences store and TypeScript types
- [x] 15-02-PLAN.md — Feature toggle UI in settings (FeaturesSection, FeatureGroupCard)
- [x] 15-03-PLAN.md — Navigation/page conditional rendering (FeatureGuard, FeatureDiscoveryHint)
- [x] 15-04-PLAN.md — Recruit visit Prisma schema and CRUD API endpoints
- [x] 15-05-PLAN.md — TanStack Query hooks and calendar event components
- [x] 15-06-PLAN.md — Lexical rich text editor and DOMPurify sanitization
- [x] 15-07-PLAN.md — Visit schedule form (PDF upload + rich text)
- [x] 15-08-PLAN.md — Host athlete dashboard widget and recruiting page
- [x] 15-09-PLAN.md — Sonner toast notifications and notification preferences
- [x] 15-10-PLAN.md — Integration verification checkpoint

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

**Goal:** Rebuild design system with "Rowing Instrument" aesthetic - warm color system, data-forward typography, tactile component interactions, spring physics animations, theme polish, mobile responsive overhaul, and landing page redesign.

**Dependencies:** All previous phases (components to update)

**Requirements:** DESIGN-01 through DESIGN-07

**Plans:** 8 plans

Plans:
- [x] 17-01-PLAN.md — Warm color palette foundation (tokens.css, tailwind.config.js)
- [x] 17-02-PLAN.md — Typography system (Inter headings, Geist Mono data metrics)
- [x] 17-03-PLAN.md — Theme updates (dark.css, light.css, field.css with warm stone palette)
- [x] 17-04-PLAN.md — Animation system (spring configs, CSS keyframes)
- [x] 17-05-PLAN.md — Core UI components (Button, Card, Toggle with tactile feedback)
- [x] 17-06-PLAN.md — Modal, Input, Table components with warm palette)
- [x] 17-07-PLAN.md — Mobile responsive overhaul (MobileNav, MobileCard, touch targets)
- [x] 17-08-PLAN.md — Final verification checkpoint (superseded by Canvas design system)

**Delivers:**
- Warm color system (dark and light modes with stone neutrals)
- Typography system with data-forward metrics (Inter + Geist Mono)
- Component library rebuild with tactile interactions (0.96 press, hover lift)
- Animation system (spring physics per CONTEXT.md spec)
- Theme polish (dark, light, field with warm tones)
- Mobile responsive overhaul (44px touch targets, swipe gestures)

**Success Criteria:**
1. Color system updated with warm tones (#0F0F0F base, stone palette)
2. Typography feels like "precision instrument" for data display
3. All components have tactile, satisfying interactions
4. Animations consistent with spring physics (stiffness: 400, damping: 17)
5. Mobile experience is fully polished with 44px touch targets

---

### Phase 18: Lineup & Boat Configuration Improvements ✅

**Goal:** Enhanced lineup builder with custom configs, rigging, and equipment tracking.

**Dependencies:** Phase 8 (lineup builder), Phase 4 (fleet)

**Requirements:** BOAT-01 through BOAT-04, LINEUP-01 through LINEUP-05

**Plans:** 11 plans

Plans:
- [x] 18-01-PLAN.md — Dependencies and Prisma schema (RiggingProfile, LineupTemplate, EquipmentAssignment)
- [x] 18-02-PLAN.md — TypeScript types for rigging, templates, and equipment
- [x] 18-03-PLAN.md — Rigging service and API endpoints
- [x] 18-04-PLAN.md — Lineup template service and API endpoints
- [x] 18-05-PLAN.md — Equipment assignment service and API endpoints
- [x] 18-06-PLAN.md — Lineup search API endpoint
- [x] 18-07-PLAN.md — TanStack Query hooks (rigging, templates, equipment, search)
- [x] 18-08-PLAN.md — RiggingPanel and EquipmentPicker components
- [x] 18-09-PLAN.md — TemplateManager and LineupComparison components
- [x] 18-10-PLAN.md — HistoricalLineupBrowser component
- [x] 18-11-PLAN.md — Enhanced export utilities (Excel, PDF with QR)

**Delivers:**
- Custom boat configurations
- Rigging profiles per boat/athlete
- Equipment assignment and tracking
- Lineup comparison view
- Historical lineup analysis
- Lineup templates
- Enhanced PDF export with QR codes
- Excel export with lazy-loaded xlsx

**Success Criteria:**
1. ✅ Coach can create custom boat configurations (RiggingPanel)
2. ✅ Rigging settings stored per boat (RiggingProfile service + API)
3. ✅ Equipment conflicts are warned (EquipmentPicker with conflict detection)
4. ✅ Lineups can be compared side-by-side (LineupComparison component)

---

### Phase 19: Warm Color Design System & Landing Page 🎨

**Goal:** Implement a warm, inviting design system following Figma-style guidelines with direct code implementation. Transform the landing page and core UI with a cream/warm color palette, colorful accents, and strategic use of blues/purples as cool antagonist colors.

**Dependencies:** Phase 17 (design tokens and component foundations)

**Requirements:** DESIGN-19-01 through DESIGN-19-08

**Plans:** 6 plans

Plans:
- [x] 19-01-PLAN.md — Warm color design tokens (CSS variables + Tailwind)
- [x] 19-02-PLAN.md — Warm landing page CSS stylesheet
- [x] 19-03-PLAN.md — LandingPageWarm React component
- [x] 19-04-PLAN.md — Warm image overlays and gallery treatment
- [x] 19-05-PLAN.md — Route setup and final polish
- [x] 19-06-PLAN.md — Human verification checkpoint (superseded by Canvas design system)

**Design Philosophy:**
- **Primary palette:** Warm creams, ambers, terracottas, warm grays
- **Accent colors:** Coral, golden yellow, warm orange, soft red
- **Antagonist colors:** Deep blues and purples for contrast and CTAs
- **Typography:** Clean, modern with warm undertones
- **Approach:** Direct implementation following Figma-style component guidelines

**Delivers:**
- Warm color design token system (CSS variables + Tailwind)
- Landing page complete rebuild with warm aesthetic
- Hero section with video/image backgrounds and warm overlays
- Features bento grid with warm card styling
- Gallery section showcasing rowing imagery
- CTA sections with antagonist blue/purple accents
- Footer with warm neutral tones
- Core UI component updates (buttons, cards, inputs)

**Assets Available:**
- 16 rowing images (rowing-1.jpg through rowing-16.jpg)
- 5 videos (hero-video.mp4, video-2/3/5/6.mp4)

**Success Criteria:**
1. Warm color palette implemented as design tokens
2. Landing page fully rebuilt with new warm aesthetic
3. Blues/purples used strategically as antagonist accent colors
4. All rowing imagery integrated with warm color overlays
5. Responsive design works across all breakpoints
6. Component library updated with warm color variants

---

## Milestone: v2.2 — Advanced Analytics (PLANNED)

Telemetry, AI optimization, predictive modeling, and mobile coxswain experience.

### Phase 20: Telemetry & Combined Scoring

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

### Phase 21: AI Lineup Optimizer (v2)

**Goal:** AI-powered lineup recommendations with explanations.

**Dependencies:** Phase 8, Phase 14, Phase 20

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

### Phase 22: Predictive Analytics

**Goal:** Data-driven predictions for performance, 2k potential, and injury risk.

**Dependencies:** Phase 7, Phase 10, Phase 14, Phase 20

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

### Phase 23: Coxswain Mobile View

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

## Milestone: v3.0 — App Redesign (COMPLETE)

Complete frontend redesign with Canvas design system, world-class UX for every feature, V1/V2 migration completion, mobile responsiveness, and performance optimization.

**Milestone Goal:** Transform all features to Canvas design language (chamfered panels, ruled headers, log-tape layouts), eliminate V1/V2/old-V3 code, achieve mobile-first responsiveness, and deliver industry-leading user experience across all workflows.

### Phase 24: Foundation & Design System

**Goal:** Establish V3 foundation with unified warm dark design system, shared component library, testing infrastructure, and design governance.

**Dependencies:** Phase 17 (warm color tokens), Phase 19 (warm design patterns)

**Requirements:** DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07, TC-01

**Success Criteria:**
1. User can see unified warm dark token system across all app pages (zero V1 blue remnants)
2. Developer can use shared component library (Button, Card, Input, Modal, Select, Toast) that automatically applies design tokens
3. User can see glass card effects with backdrop blur on all card components
4. User can see spring physics animations (Framer Motion presets) on all interactive elements
5. Developer cannot merge code with raw Tailwind colors (ESLint rules enforce token usage)
6. All shared components have smoke tests with accessibility assertions (jest-axe)

**Plans:** 8 plans

Plans:
- [x] 24-01-PLAN.md — Dependencies + unified design tokens + glass/gradient Tailwind utilities
- [x] 24-02-PLAN.md — ESLint design token enforcement + jest-axe test infrastructure
- [x] 24-03-PLAN.md — Select component (Headless UI Listbox) + Toast component (Sonner)
- [x] 24-04-PLAN.md — Glass card effects + micro-interactions on existing components
- [x] 24-05-PLAN.md — V1 blue class migration (58 files → zero violations)
- [x] 24-06-PLAN.md — Component smoke tests with accessibility assertions (89 tests)
- [x] 24-07-PLAN.md — Verification checkpoint (human approved)
- [x] 24-08-PLAN.md — V1 blue migration (pages/layouts) + brand token normalization

---

### Phase 25: State Management Migration

**Goal:** Migrate all server state from V1/V2 Zustand stores to TanStack Query, establish max 5 UI-only stores, enable multi-tab synchronization, and add database sync for lineup drafts. Hard cutover (no compatibility bridge needed — no active users).

**Dependencies:** Phase 24 (foundation)

**Requirements:** SM-01, SM-02, SM-03, SM-04, SM-05

**Success Criteria:**
1. User's data is consistent across all views (all server state migrated to TanStack Query from 18 V1 Zustand stores)
2. Developer maintains max 5 UI-only Zustand stores (lineupBuilder, featurePreference, notification, context, csvImport)
3. User's lineup changes persist across devices and sessions (database sync replaces localStorage-only)
4. User sees consistent data across browser tabs (multi-tab cache synchronization)
5. N/A — hard cutover, no compatibility bridge needed (per CONTEXT.md)

**Plans:** 7 plans

Plans:
- [x] 25-01-PLAN.md — Dependencies, query key factories, Prisma lineup draft migration
- [x] 25-02-PLAN.md — AuthContext provider + BroadcastChannel multi-tab sync
- [x] 25-03-PLAN.md — AuthStore migration (264 refs across 47 files)
- [x] 25-04-PLAN.md — Standardize TQ hooks batch 1 + delete 8 V1 stores
- [x] 25-05-PLAN.md — Standardize TQ hooks batch 2 + delete 7 V1 stores
- [x] 25-06-PLAN.md — Lineup draft hooks + lineupBuilder store split
- [x] 25-07-PLAN.md — V2 store cleanup + final verification

---

### Phase 26: Route & Navigation Cleanup

**Goal:** Unify all routes under /app/*, redirect legacy routes, preserve deep links, and implement route-based code splitting.

**Dependencies:** Phase 25 (state migration complete)

**Requirements:** RN-01, RN-02, RN-03, RN-04

**Success Criteria:**
1. User accesses all features under single /app/* namespace
2. User is automatically redirected from /beta/* and /legacy/* to correct /app/* routes
3. User's bookmarks and deep links are preserved through redirect guards
4. User experiences faster page loads via route-based code splitting (lazy loading all pages)

**Plans:** 2 plans

Plans:
- [x] 26-01-PLAN.md — Route consolidation (mapping utility, redirect component, App.jsx rewiring)
- [x] 26-02-PLAN.md — Optimization & cleanup (Vite chunks, deprecate version switching infra)

---

### Phase 27: Dashboard Rebuild

**Goal:** Create exception-based coach dashboard and progress-focused athlete dashboard with customizable widgets.

**Dependencies:** Phase 26 (route cleanup)

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, ES-01, ES-02, ES-03, ES-04, ES-05, ES-06

**Success Criteria:**
1. Coach can see exception-based dashboard with red/yellow/green status indicators showing what needs attention
2. Coach can see metric cards with trend sparklines and trigger quick actions (Start practice, Log attendance, Create workout)
3. Athlete can see progress-focused personal dashboard (PRs, next workout, achievements)
4. User can reorder dashboard widgets to customize layout and sees meaningful content (not empty skeleton blocks)
5. User sees illustration + explanation + CTA on every empty state (no blank screens)
6. User can complete progressive onboarding with skip buttons on every step and take guided tours via driver.js element highlighting

**Plans:** 7 plans

Plans:
- [x] 27-01-PLAN.md — Dependencies + widget registry + dashboard hooks
- [x] 27-02-PLAN.md — Enhanced empty states + geometric animations
- [x] 27-03-PLAN.md — Coach dashboard (exception banner, hero card, metrics, quick actions)
- [x] 27-04-PLAN.md — Athlete dashboard (personal stats, PRs, multi-team unified view)
- [x] 27-05-PLAN.md — Widget catalog + size presets + edit mode + page wiring
- [x] 27-06-PLAN.md — Progressive onboarding wizard + setup checklist + smart defaults
- [x] 27-07-PLAN.md — Driver.js guided tours + verification checkpoint

---

### Phase 28: Athletes Feature Migration

**Goal:** Migrate athletes roster to V3 with richer profiles, performance trends, bulk actions, and skeleton loaders.

**Dependencies:** Phase 27 (dashboard foundation)

**Requirements:** ATH-01, ATH-02, ATH-03, ATH-04, CW-01, CW-02, CW-03

**Success Criteria:**
1. User can see richer athlete profiles with performance trends and quick actions
2. User can search, sort, and filter athlete roster with instant results
3. User can perform bulk actions on athletes (select multiple, export)
4. User sees skeleton loaders (not spinners) when athlete data loads
5. User experiences optimistic UI for mutations (actions feel instant)
6. User can use keyboard shortcuts for common actions

**Plans:** 8 plans

Plans:
- [x] 28-01-PLAN.md — Foundation: schema updates (status/classYear), types, hooks (auto-save, selection, detail)
- [x] 28-02-PLAN.md — Roster page: three view modes (grid/table/compact), filter bar, bulk actions
- [x] 28-03-PLAN.md — Keyboard shortcuts (J/K/E/X///?) + Cmd+K command palette athletes
- [x] 28-04-PLAN.md — Profile slide-out panel: hero stats, erg sparkline, attendance heatmap, quick actions
- [x] 28-05-PLAN.md — Full profile page (/app/athletes/:id): activity timeline, achievements, multi-team tabs
- [x] 28-06-PLAN.md — CSV import rebuild: drag-drop, column mapping, progress indicator
- [x] 28-07-PLAN.md — Auto-save edit form + quick-mark attendance with optimistic UI
- [x] 28-08-PLAN.md — V1/V2 cleanup, skeleton enforcement, verification checkpoint

---

### Phase 29: Lineup Builder Migration ✅

**Goal:** Migrate lineup builder to V3 with database sync, improved undo/redo, magnetic drag-drop, and keyboard accessibility.

**Dependencies:** Phase 28 (athletes data available)

**Requirements:** LB-01, LB-02, LB-03, LB-04, CW-01, CW-02, CW-03

**Success Criteria:**
1. User's lineup changes sync to database (not just localStorage)
2. User can undo/redo lineup changes with improved performance
3. User experiences drag-drop with magnetic snap, elevation shadows, and 100ms spring animations
4. User can access lineup builder with keyboard (spacebar pick up, arrows move, space drop)
5. User experiences optimistic UI for all mutations (actions feel instant)
6. User can use keyboard shortcuts for common actions across all features

**Plans:** 5 plans

Plans:
- [x] 29-01-PLAN.md — Foundation hooks: command-based undo/redo + optimistic mutations
- [x] 29-02-PLAN.md — Keyboard accessibility + magnetic snap + DnD accessibility
- [x] 29-03-PLAN.md — Migrate toolbar, sidebar, boat components from V1 store
- [x] 29-04-PLAN.md — Migrate dialogs, mobile, page + skeleton loaders
- [x] 29-05-PLAN.md — V3 design compliance audit + human verification

---

### Phase 30: Erg Data Migration

**Goal:** Migrate erg data feature to V3 with improved visualizations, PR celebrations, and gamification integration.

**Dependencies:** Phase 28 (athletes)

**Requirements:** ERG-01, ERG-02, ERG-03, CW-01, CW-02, CW-03

**Success Criteria:**
1. User can see improved erg leaderboard with better UX
2. User sees PR celebration animations when personal records are set
3. User can see erg data integrated with gamification (badges, milestones)
4. User experiences optimistic UI for all mutations
5. User can use keyboard shortcuts for common actions
6. User sees skeleton loaders instead of spinners on every page

**Plans:** 4 plans

Plans:
- [x] 30-01-PLAN.md — V3 design token migration for all erg components (14 components + PRCelebration)
- [x] 30-02-PLAN.md — Skeleton loaders + keyboard shortcuts (CW-03, CW-02)
- [x] 30-03-PLAN.md — Improved leaderboard + PR celebration integration + gamification (ERG-01, ERG-02, ERG-03)
- [x] 30-04-PLAN.md — V1 legacy cleanup + human verification

---

### Phase 31: Seat Racing Migration

**Goal:** Migrate seat racing to V3 with warm design system, improved data visualizations, and animated ELO charts.

**Dependencies:** Phase 28 (athletes)

**Requirements:** SR-01, SR-02, SR-03, CW-01, CW-02, CW-03

**Success Criteria:**
1. User can see seat racing with warm design system applied consistently
2. User can see improved data visualizations with animated transitions
3. User can see ELO ranking distribution chart with better interactivity
4. User experiences optimistic UI for all mutations
5. User can use keyboard shortcuts for common actions
6. User sees skeleton loaders instead of spinners on every page

**Plans:** 6 plans

Plans:
- [x] 31-01-PLAN.md — V3 design token migration + ConfidenceRing, ELOSparkline, SegmentedControl
- [x] 31-02-PLAN.md — Data visualizations: Bradley-Terry gradient bands, ProbabilityMatrix hues, ComparisonGraph click-to-expand
- [x] 31-03-PLAN.md — Ranking detail slide-out panel (ELO history, composite breakdown, recent sessions)
- [x] 31-04-PLAN.md — Session wizard overhaul: 3-step flow, horizontal slides, segmented time input, rankings impact preview
- [x] 31-05-PLAN.md — Matrix planner (driver.js tour, generate session), keyboard shortcuts, optimistic UI, skeleton loaders
- [x] 31-06-PLAN.md — Human verification checkpoint

---

### Phase 32: Training & Attendance Migration

**Goal:** Migrate training and attendance features to V3 with simplified flows, drag-to-reschedule, and NCAA compliance at-a-glance.

**Dependencies:** Phase 28 (athletes)

**Requirements:** TR-01, TR-02, TR-03, AT-01, AT-02, AT-03, CW-01, CW-02, CW-03

**Success Criteria:**
1. User can create training sessions with simplified flow (fewer steps)
2. User can see improved calendar view with drag-to-reschedule
3. User can see NCAA compliance status at a glance
4. User can mark attendance with one-tap interactions
5. User can see attendance streak visibility for each athlete
6. User sees real-time attendance updates during practice

**Plans:** 6 plans

Plans:
- [x] 32-01-PLAN.md — V3 design token migration for calendar, workout, and periodization components
- [x] 32-02-PLAN.md — V3 design token migration for compliance, session, assignment components and pages
- [x] 32-03-PLAN.md — Calendar enhancements: simplified 2-step session creation, drag-to-reschedule with spring physics, ComplianceBadge
- [x] 32-04-PLAN.md — Attendance UX: one-tap P/L/E/U buttons, attendance streak badges, LiveAttendancePanel
- [x] 32-05-PLAN.md — Cross-cutting: keyboard shortcuts, optimistic UI audit, skeleton loaders
- [x] 32-06-PLAN.md — Human verification checkpoint

---

### Phase 33: Regattas & Rankings Migration

**Goal:** Migrate regattas and rankings to V3 with polished race day command center, live WebSocket updates, and clearer visualizations.

**Dependencies:** Phase 29 (lineups for race entries)

**Requirements:** REG-01, REG-02, RK-01, RK-02, RT-01, RT-02, RT-03, RT-04, CW-01, CW-02, CW-03

**Success Criteria:**
1. User can see polished race day command center with improved results entry
2. User can see live race updates via WebSocket during regattas
3. User can see clearer ranking visualizations with animated transitions
4. User can see NCAA compliance export for rankings
5. User sees live erg data via WebSocket (replaces polling)
6. User sees connection health indicator (green/yellow/red dot)
7. User's offline mutations queue and sync automatically on reconnect

**Plans:** 6 plans

Plans:
- [x] 33-01-PLAN.md — V3 token migration for regatta components (10 files)
- [x] 33-02-PLAN.md — V3 token migration for rankings components + pages (7 files)
- [x] 33-03-PLAN.md — WebSocket infrastructure (server race day events, client hooks, connection indicator)
- [x] 33-04-PLAN.md — Animated rankings, NCAA export, improved results entry
- [x] 33-05-PLAN.md — Keyboard shortcuts, optimistic UI, skeleton loaders, offline queue
- [x] 33-06-PLAN.md — Human verification checkpoint

---

### Phase 34: Gamification & Activity Feed Migration

**Goal:** Migrate gamification and activity feed to V3 with integrated achievements, quiet gamification, and meaningful event cards.

**Dependencies:** Phase 30 (erg data for gamification)

**Requirements:** GM-01, GM-02, GM-03, AF-01, AF-02, CP-01, CP-02, CP-03, CW-01, CW-02, CW-03

**Success Criteria:**
1. User can see achievements integrated into athlete profiles (not disconnected)
2. User experiences quiet gamification (streaks, PRs, milestones) not shouty (points, spin-wheels)
3. User can see team challenges and season milestones
4. User can see activity feed with meaningful event cards (not empty)
5. User can trigger actions from command palette (Create athlete, Start practice, Log erg test)
6. User can see recent commands and context-aware suggestions in cmd+k with keyboard shortcuts displayed

**Plans:** 8 plans

Plans:
- [x] 34-01-PLAN.md — Skeleton loader system (base + card/table/list variants with shimmer)
- [x] 34-02-PLAN.md — Activity feed typed cards (6 card types with internal navigation)
- [x] 34-03-PLAN.md — Gamification V3 design migration (16 components + 2 pages)
- [x] 34-04-PLAN.md — Command palette actions + keyboard shortcuts system
- [x] 34-05-PLAN.md — Season milestones backend API + timeline + optimistic UI
- [x] 34-07-PLAN.md — Activity feed timeline container + card dispatcher
- [x] 34-08-PLAN.md — Achievements in athlete profiles + team challenges section
- [x] 34-06-PLAN.md — Integration wiring + skeleton loader deployment + verification

---

### Phase 35: Canvas Promotion + Mobile Responsiveness

**Goal:** Make Canvas the default design system (swap /canvas → /app routes), achieve mobile-first responsiveness (375px-1440px) for all Canvas pages, optimize performance with code splitting and virtualization, and enforce performance budgets.

**Dependencies:** Phase 34 (all feature migrations complete), Phase 38-old (Canvas pages built at /canvas/*)

**Note:** Phase 38 (Full Canvas Design System Redesign) was completed — 7/7 plans, 25 Canvas pages, 15 Canvas primitives all built and routed at `/canvas/*`. This phase promotes Canvas to be the default and makes it mobile-ready.

**Requirements:** MR-01, MR-02, MR-03, MR-04, PO-01, PO-02, PO-03, PO-04, TC-02, TC-03, TC-04, RN-05

**Success Criteria:**
1. Canvas pages serve at /app/* (replaces old V3 warm pages as default)
2. User can use the app on any device from 375px to 1440px without horizontal scroll
3. User can tap touch targets that are at least 44px on mobile devices
4. User sees simplified mobile navigation (bottom tab bar on small screens)
5. Coach can run tablet-optimized workflows during practice (landscape, touch-friendly)
6. User experiences fast initial load via route-based code splitting (<200KB initial bundle)
7. User can scroll large lists smoothly via TanStack Virtual (>100 items)
8. User experiences <2.5s LCP and <0.1 CLS on initial page load
9. Critical paths have smoke tests (auth, lineup save, seat race calc, erg import)
10. All new components include accessibility assertions (jest-axe)

**Plans:** 11 plans — **COMPLETE** (2026-02-09)

Plans:
- [x] 35-01-PLAN.md — Route swap: promote Canvas to /app default, remove prototype routes
- [x] 35-02-PLAN.md — Mobile navigation: wire MobileNav into CanvasLayout with Canvas styling
- [x] 35-03-PLAN.md — Canvas primitive mobile adaptation (chamfer, ruled, console, table, ticket)
- [x] 35-04-PLAN.md — Test infrastructure + backend API smoke tests (jest-axe, web-vitals, auth/lineup/erg/C2)
- [x] 35-05-PLAN.md — Mobile responsiveness: dashboards & simple pages (8 pages)
- [x] 35-06-PLAN.md — Mobile responsiveness: data table pages (7 pages)
- [x] 35-07-PLAN.md — Mobile responsiveness: complex interaction pages (4 pages)
- [x] 35-08-PLAN.md — Mobile responsiveness: session, fleet, whiteboard pages (6 pages)
- [x] 35-09-PLAN.md — Performance: bundle optimization, splash screen, route prefetch, Web Vitals
- [x] 35-10-PLAN.md — Frontend smoke tests for critical paths (auth, lineup, erg, seat race, C2, workout)
- [x] 35-11-PLAN.md — Accessibility tests + 60% coverage enforcement + Lighthouse CI

---

### Phase 36: Dead Code Cleanup

**Goal:** Remove ALL non-Canvas page components, V1/V2 remnants, old V3 warm/copper design tokens, unused CSS, feature toggles, and CSS scoping hacks. Deliver a single clean Canvas-only codebase.

**Dependencies:** Phase 35 (Canvas is default, old pages no longer routed)

**Requirements:** CL-01, CL-02, CL-03, CL-04

**Success Criteria:**
1. Developer can work in clean codebase with V1/V2 dead code removed
2. All non-Canvas page components deleted (old /app pages, warm copper pages)
3. Old design tokens removed (warm copper, V2 glass cards, etc.) — Canvas tokens only
4. User is not affected by V1/V2 CSS scoping (removed after migration)
5. Developer can work without feature toggles (removed after full cutover)
6. Bundle size reduced by removal of dead code

**Plans:** 5 plans

Plans:
- [x] 36-01-PLAN.md — Remove 30 dead V2 pages + clean App.jsx imports + record baseline bundle size
- [x] 36-02-PLAN.md — Remove 19 dead V1 pages + 4 dead layouts
- [x] 36-03-PLAN.md — Remove ~100 dead V1 components (preserve auth/landing dependencies)
- [x] 36-04-PLAN.md — Remove dead Zustand stores + CSS scoping + audit feature toggles
- [x] 36-05-PLAN.md — Remove dead CSS tokens + hooks/utils cleanup + final bundle comparison

---

### Phase 36.1: v3.0 Tech Debt Closure

**Goal:** Close remaining tech debt from v3.0 milestone audit: fix TypeScript errors, repair test failures, wire real exception data, resolve brand color tokens, and update all planning documentation to reflect completion.

**Dependencies:** Phase 36 (dead code cleanup complete)

**Gap Closure:** Closes gaps from v3.0-MILESTONE-AUDIT.md

**Requirements:** DS-01 (partial → complete)

**Success Criteria:**
1. DS-01 fully satisfied — brand color tokens defined or ESLint exception for IntegrationsSection.tsx
2. Zero TypeScript errors (66 → 0) in marginCalculations.ts, ergCsvParser.ts, warmupCalculator.ts, rrule.ts
3. All tests pass (263/263) — fix or remove 4 obsolete authStore test failures
4. useExceptions returns real data (not stub) for dashboard ExceptionAlertsWidget
5. GitHub issue #4 composite ranking edge case resolved
6. REQUIREMENTS.md checkboxes updated for phases 25-36
7. ROADMAP.md plan checkboxes accurate
8. README.md roadmap section reflects v3.0 completion

**Plans:** 5 plans

Plans:
- [x] 36.1-01-PLAN.md — TypeScript quick fixes in 4 target utils + DS-01 brand color resolution
- [x] 36.1-02-PLAN.md — Delete obsolete V1 authStore tests (4 failures → 0)
- [x] 36.1-03-PLAN.md — GitHub issue #4 deeper fix (composite rankings edge cases + tests)
- [x] 36.1-04-PLAN.md — Wire useExceptions to real backend aggregation endpoint
- [x] 36.1-05-PLAN.md — Documentation updates (REQUIREMENTS, ROADMAP, README, STATE)

---

## Cross-Cutting Requirements

The following requirements apply across all v3.0 phases:

| Requirement | Description | Application |
|-------------|-------------|-------------|
| CW-01 | Optimistic UI for all mutations | Phases 28-34 (complete) |
| CW-02 | Keyboard shortcuts for common actions | Phases 28-34 (complete) |
| CW-03 | Skeleton loaders instead of spinners | Phases 28-34 (complete) |
| TC-01 | Vitest + Testing Library + MSW infrastructure | Phase 24 (complete) |
| TC-02 | Critical paths have smoke tests | Phase 35 |
| TC-03 | All new components include accessibility assertions | Phase 35 |
| TC-04 | New V3 component coverage reaches 60% target | Phase 35 |

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

### v2.1 Milestone (Complete)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 15 | Feature Toggles & Recruiting | 6 | 10 | Complete ✅ |
| 16 | Gamification & Engagement | 8 | 12 | Complete ✅ |
| 17 | Complete Design Overhaul | 7 | 8 | Complete ✅ (superseded by Canvas) |
| 18 | Lineup & Boat Improvements | 9 | 11 | Complete ✅ |
| 19 | Warm Design System & Landing Page | 8 | 6 | Complete ✅ (superseded by Canvas) |

**v2.1 Total:** 38 requirements across 5 phases

### v2.2 Milestone (Planned)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 20 | Telemetry & Combined Scoring | 8 | TBD | Planned |
| 21 | AI Lineup Optimizer (v2) | 8 | TBD | Planned |
| 22 | Predictive Analytics | 8 | TBD | Planned |
| 23 | Coxswain Mobile View | 8 | TBD | Planned |

**v2.2 Total:** 32 requirements across 4 phases

### v3.0 Milestone (In Progress)

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 24 | Foundation & Design System | 8 | 8 | Complete ✅ |
| 25 | State Management Migration | 5 | 7 | Complete ✅ |
| 26 | Route & Navigation Cleanup | 4 | 2 | Complete ✅ |
| 27 | Dashboard Rebuild | 12 | 7 | Complete ✅ |
| 28 | Athletes Feature Migration | 7 | 8 | Complete ✅ |
| 29 | Lineup Builder Migration | 7 | 5 | Complete ✅ |
| 30 | Erg Data Migration | 6 | 4 | Complete ✅ |
| 31 | Seat Racing Migration | 6 | 6 | Complete ✅ |
| 32 | Training & Attendance Migration | 9 | 6 | Complete ✅ |
| 33 | Regattas & Rankings Migration | 10 | 6 | Complete ✅ |
| 34 | Gamification & Activity Feed | 9 | 8 | Complete ✅ |
| 35 | Canvas Promotion + Mobile | 12 | 11 | Complete ✅ |
| 36 | Dead Code Cleanup | 4 | 5 | Complete ✅ |
| 36.1 | v3.0 Tech Debt Closure | 1 | 5 | Complete ✅ |
| ~~37~~ | ~~Warm Copper Sweep~~ | — | — | Removed (superseded by Canvas) |
| ~~38~~ | ~~Canvas Redesign~~ | — | 7 | Absorbed (work complete, route swap in Phase 35) |

**v3.0 Total:** 14 phases (14 complete)

---

## Research Flags

Phases requiring deeper research during planning:

| Phase | Topic | Reason |
|-------|-------|--------|
| 35 | **Canvas mobile patterns** | Canvas design has chamfered panels, ruled headers — need mobile adaptation strategy for these bespoke primitives |
| 35 | **Touch interaction for Canvas** | How do Canvas components (DataTable, LogEntry, ConsoleReadout) adapt to touch? |
| 35 | **Bottom tab bar + Canvas toolbar** | Canvas has its own toolbar — reconcile with mobile bottom nav |

Completed research (archived):
- Phase 14: Bradley-Terry & Matrix Racing — See 14-RESEARCH.md
- Phase 15: Feature toggles & Recruiting — See 15-RESEARCH.md
- Phase 19: Penpot Design System — See 19-RESEARCH.md
- Phase 38: Canvas Design System — See 38-RESEARCH.md

Phases with standard patterns (skip research):
- Phase 36: Code deletion and cleanup (mechanical removal)

---

## Milestone: v3.1 — Integrations, Analytics & Social Sharing (PLANNED)

Connect RowLab to external platforms (Concept2 Logbook, Strava, Garmin), build a share card image generation platform, create performance analytics from real workout data, and enable cross-platform social sharing. The pipeline: data flows in (C2, Garmin) → gets analyzed (power curves, fitness models) → visualized as share cards → pushed out to social platforms (Strava).

### Phase 37: Concept2 Workout Sync

**Goal:** Connect to Concept2 REST API (read-only), sync real workouts from admin's C2 logbook, store in database, and display synced workouts in the app.

**Dependencies:** Phase 7 (C2 sync status display), Phase 12 (C2 OAuth integration)

**Requirements:** C2-01 through C2-06

**Delivers:**
- C2 REST API client (read-only, using existing OAuth tokens)
- Workout sync service (manual trigger + optional scheduled polling)
- Workout storage schema (Prisma models for C2 workout data with splits, stroke data, HR)
- Synced workout display in erg data views and activity feed
- Admin account tested with real C2 logbook data
- Deduplication to prevent duplicate imports on re-sync
- Testing infrastructure: anonymized real data seed fixtures, C2 API mock server for deterministic tests

**Success Criteria:**
1. Admin can trigger C2 workout sync and see real workouts from their logbook in RowLab
2. Workouts stored in database with full metadata (splits, stroke data, heart rate, drag factor)
3. Synced workouts display in erg data views with proper formatting (time, pace, watts, HR)
4. Re-syncing does not create duplicate records
5. Sync handles pagination for accounts with many workouts
6. C2 API mock server enables offline testing of sync pipeline

**Plans:** 6 plans

Plans:
- [x] 37-01-PLAN.md — Schema migration (WorkoutSplit model, machineType) + sync service enhancement
- [x] 37-02-PLAN.md — C2 API test infrastructure (nock mock server, fixtures, sync tests)
- [x] 37-03-PLAN.md — Historical import endpoints + coach sync with auto-match
- [x] 37-04-PLAN.md — Frontend erg table enhancements (source filter, C2 badge, machine type, sync button)
- [x] 37-05-PLAN.md — Workout detail view (summary card + splits table)
- [x] 37-06-PLAN.md — Historical import UI + activity feed integration + verification

---

### Phase 38: Share Card Platform

**Goal:** Build a share card generation service with multiple card types and formats. Port the Cairo+Pango renderer into a RowLab API endpoint, support multiple templates (erg results, PR celebrations, regatta results, season recaps), and multiple output formats (1:1 square, 9:16 story).

**Dependencies:** Phase 37 (workout data available in database)

**Requirements:** SC-01 through SC-10

**Delivers:**

*Core Service:*
- Python Cairo+Pango share card renderer as a backend service
- API endpoint to generate share card PNG from workout ID
- Generated image storage and retrieval via stable URL
- Extensible template system for multiple card types and erg types

*Card Templates:*
- **Erg summary card** — metrics, splits, power bars (current v5 design)
- **Erg charts card** — power/HR/cadence over distance
- **PR celebration card** — gold/trophy design triggered on personal records, before/after comparison
- **Regatta results card** — race placement, margin, crew list, event details
- **Season recap card** — "Spotify Wrapped for rowing": total meters, workouts, PRs, improvements over a season
- **Team leaderboard card** — weekly/monthly team rankings snapshot

*Output Formats:*
- 1:1 square (2160x2160) — Instagram feed, general sharing
- 9:16 story (2160x3840) — Instagram/TikTok stories

**Success Criteria:**
1. API endpoint accepts a workout ID and card type, returns generated PNG
2. All 6 card templates render correctly with real data
3. Both 1:1 and 9:16 formats available for each template
4. Images stored and retrievable via stable URL for sharing
5. Card design maintains current v5 aesthetic (dark bg, warm panels, copper/gold/rose accents)
6. Template system extensible for future erg types (RowErg 2K, SkiErg, etc.)
7. "RowLab" branding present on all cards for organic marketing

**Plans:** TBD

---

### Phase 39: Strava Integration & Cross-Platform Sync

**Goal:** Register RowLab as a Strava API application, post C2 workouts to Strava with share card images, and sync workouts from Strava (excluding those that originated from C2 or RowLab).

**Dependencies:** Phase 37 (C2 workout data), Phase 38 (share card generation)

**Requirements:** STR-01 through STR-07

**Delivers:**
- Strava API app registration and OAuth flow (using existing Strava OAuth infrastructure from Phase 12)
- Post workout to Strava with activity details and share card image attachments
- Strava workout sync (inbound) — pull user's Strava activities
- Source tracking on all workouts (origin: concept2 | strava | rowlab | manual)
- Deduplication logic: skip Strava activities that originated from C2 or RowLab posts
- Bi-directional sync dashboard showing sync status per platform
- End-to-end integration test: C2 sync → workout stored → share card generated → Strava post created

**Success Criteria:**
1. User can select a synced C2 workout and post it to Strava with generated share card images attached
2. Posted Strava activity includes correct workout data (distance, time, HR, splits)
3. User can sync workouts FROM Strava into RowLab
4. Strava sync filters out activities that were originally posted from C2/RowLab (no duplicates)
5. Source tracking clearly shows where each workout originated
6. Strava OAuth flow works end-to-end with existing integration settings
7. E2E test validates full pipeline: C2 → store → card → Strava

**Plans:** TBD

---

### Phase 40: Performance Analytics Engine

**Goal:** Build intelligence on accumulated workout data — power curves, cross-erg predictions, overtraining detection, pacing analysis, and automated practice recaps. This is the analytics layer that transforms raw data into coaching insights.

**Dependencies:** Phase 37 (accumulated C2 workout data with splits, stroke data, HR)

**Requirements:** PA-01 through PA-08

**Delivers:**

*Power Analysis:*
- **Power curve generation** — best efforts at all distances (100m to 60min), plotted as watts vs duration. The gold standard in cycling (Strava/TrainingPeaks/WKO5) but doesn't exist for rowing ergs. First in industry.
- **Cross-erg correlation models** — "Your BikeErg 4K predicts a RowErg 2K of ~6:28." Start with published conversion formulas, refine with real data over time. Unique in the industry.

*Health & Recovery:*
- **HR drift detection** — if heart rate rises throughout a steady-state piece at constant power, that's cardiac drift (early overtraining signal). Automatic detection from stroke-level HR data.
- **Split consistency scoring** — quantify pacing evenness (0-100 score). Perfectly even = 100, wild swings score lower. Surfaced on workout detail views.

*Coaching Automation:*
- **Practice session auto-recap** — after practice ends, auto-generate summary: "Today: 6 athletes completed 4x1K BikeErg. Team avg 1:30.2/1K. 2 PRs set. 1 absent." Delivered as notification with optional share card attachment. Connects data (37) → cards (38) → notifications (15).

**Success Criteria:**
1. Athlete can see their power curve across all erg distances with best efforts highlighted
2. Coach can see predicted times for untested distances based on cross-erg models
3. System automatically flags athletes showing HR drift patterns (overtraining risk)
4. Each workout displays a split consistency score
5. Practice recap auto-generates after live sessions end, with correct aggregate stats
6. All analytics update incrementally as new workouts sync

**Plans:** TBD

---

### Phase 41: Fitness Intelligence & Training Load

**Goal:** Implement fitness/fatigue modeling (CTL/ATL/TSB) for the entire team, enabling coaches to see who's peaking, who's fatigued, and when to taper for regattas. Premium coaching intelligence that nobody offers in a team rowing context.

**Dependencies:** Phase 37 (consistent workout data flow), Phase 40 (analytics foundation)

**Requirements:** FI-01 through FI-06

**Delivers:**

*Fitness/Fatigue Model:*
- **CTL (Chronic Training Load)** — 42-day exponentially weighted average of daily TSS. Represents fitness.
- **ATL (Acute Training Load)** — 7-day exponentially weighted average of daily TSS. Represents fatigue.
- **TSB (Training Stress Balance)** — CTL minus ATL. Positive = fresh, negative = fatigued. The "form" number.
- **TSS calculation from erg data** — power-based TSS (most accurate), HR-based fallback, duration-based last resort.

*Team Dashboard:*
- **Team training load dashboard** — all athletes' CTL/ATL/TSB on one view. Color-coded: green (building), yellow (heavy load), red (overtraining risk), blue (tapering).
- **Peak prediction for regattas** — given a target date, show each athlete's projected TSB curve. "At current load, athlete X will peak on March 15."
- **Overtraining risk alerts** — automatic warnings when ATL/CTL ratio exceeds threshold or TSB drops below -30.

**Success Criteria:**
1. Each athlete has a fitness chart showing CTL, ATL, and TSB curves over time
2. Coach can see team-wide training load dashboard with all athletes color-coded by load status
3. Coach can set a target regatta date and see projected fitness curves for the team
4. System alerts when an athlete's training load enters overtraining risk zone
5. TSS calculated automatically from synced C2 workout power data
6. Model updates incrementally as new workouts sync (not batch recalculation)

**Plans:** TBD

---

### Phase 42: Garmin Connect & On-Water Data

**Goal:** Integrate Garmin Connect to sync on-water rowing sessions with GPS traces, boat speed, stroke rate, and HR. This completes the picture: ergs tell you fitness, water tells you boat-moving ability. Combined erg + on-water profiles enable data-driven lineup decisions.

**Dependencies:** Phase 37 (workout storage patterns established). Can be developed in parallel with Phases 40-41.

**Requirements:** GC-01 through GC-07

**Delivers:**

*Data Sync:*
- Garmin Connect OAuth flow and workout sync
- On-water session data: GPS traces, boat speed, stroke rate, HR
- Activity type detection (rowing vs cycling vs running — only sync rowing)
- Deduplication with C2 data (some coaches record both erg + Garmin simultaneously)

*Visualization:*
- Course maps with speed/HR color overlay (fast = green, slow = red)
- Session visualization: boat speed, stroke rate, HR over distance/time
- Split-by-split analysis for on-water pieces

*Combined Profiles:*
- Unified athlete view: erg performance + on-water performance side by side
- Cross-domain insights: "Athlete X is fast on the erg but slow on water — technique issue?"
- On-water share cards (GPS map + metrics) using Phase 38 card platform

**Success Criteria:**
1. User can connect Garmin account and sync on-water rowing sessions
2. On-water sessions display with GPS course map and speed/HR overlays
3. Only rowing activities sync (not cycling, running, etc.)
4. Athlete profile shows erg and on-water data side by side
5. Garmin data deduplicates with C2 data when both recorded simultaneously
6. On-water share cards render course map with key metrics

**Plans:** TBD

---

### v3.1 Phase Summary

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 37 | Concept2 Workout Sync | 6 | 6 plans | In Progress |
| 38 | Share Card Platform | 10 | TBD | Planned |
| 39 | Strava Integration & Cross-Platform Sync | 7 | TBD | Planned |
| 40 | Performance Analytics Engine | 8 | TBD | Planned |
| 41 | Fitness Intelligence & Training Load | 6 | TBD | Planned |
| 42 | Garmin Connect & On-Water Data | 7 | TBD | Planned |

**v3.1 Total:** 44 requirements across 6 phases

**Dependency Chain:**
```
Phase 37 (C2 data) ──┬── Phase 38 (share cards) ── Phase 39 (Strava)
                      ├── Phase 40 (analytics) ──── Phase 41 (fitness intelligence)
                      └── Phase 42 (Garmin) [parallel, independent]
```

---

## Research Flags (v3.1)

| Phase | Topic | Reason |
|-------|-------|--------|
| 37 | **Concept2 REST API** | API endpoints, auth flow, rate limits, data format, pagination |
| 38 | **Cairo+Pango as service** | Deployment options (subprocess, microservice, serverless), image storage, multi-template architecture |
| 39 | **Strava API v3** | Activity creation with images, webhook subscriptions, deduplication patterns, rate limits |
| 40 | **Power curve algorithms** | Best-effort extraction from workout history, cross-erg regression models, HR drift detection thresholds |
| 41 | **CTL/ATL/TSB for rowing** | TSS calculation from erg power data, appropriate time constants for rowing (vs cycling defaults), team-wide visualization |
| 42 | **Garmin Connect API** | OAuth flow, activity types, GPS data format (FIT/TCX), rate limits, rowing activity detection |

---

## Deferred Ideas (v3.1+)

Ideas evaluated but deferred for future consideration:

| Idea | Reason Deferred | Revisit When |
|------|----------------|--------------|
| Apple Health / Google Fit | Requires native mobile app | RowLab goes native mobile |
| TrainingPeaks integration | Feeds competitor ecosystem | Never (make RowLab's training better instead) |
| ErgData / PM5 Bluetooth live | Requires native app + BLE | RowLab goes native mobile |
| Animated video share cards | High effort (FFmpeg), marginal gain over static | Static cards prove social traction |
| AI workout prescription | Belongs in AI/ML milestone | v2.2 Phase 21-22 |
| Auto-detect training phases | Academic, not immediately actionable | After Phase 41 fitness models mature |
| Public athlete profiles | Good viral loop but significant effort | After v3.1 core pipeline works |
| Embeddable team widgets | Nice to have, not urgent | After public profiles |

---

*Roadmap created: 2026-01-23*
*Last updated: 2026-02-11 — v3.0 milestone complete: all 14 phases (24-36.1) delivered, tech debt closed*
