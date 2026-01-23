# Requirements: RowLab UX Redesign

**Defined:** 2026-01-23
**Core Value:** Athletes and coaches get a context-aware dashboard experience that adapts to their role

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Setup & Architecture

- [ ] **SETUP-01**: V2 entry point created at `/beta` route
- [ ] **SETUP-02**: CSS isolation implemented via `.v2` class scoping
- [ ] **SETUP-03**: Design tokens system with CSS custom properties
- [ ] **SETUP-04**: Theme modes (dark/light/field) with persistence
- [ ] **SETUP-05**: Shared Zustand store integration between V1 and V2
- [ ] **SETUP-06**: Tailwind config extended for V2 design tokens

### Shell & Navigation

- [ ] **SHELL-01**: ContextRail component for workspace switching
- [ ] **SHELL-02**: WorkspaceSidebar with context-aware navigation items
- [ ] **SHELL-03**: ShellLayout wrapper with rail + sidebar + content areas
- [ ] **SHELL-04**: Context state management (Me/Coach/Admin personas)
- [ ] **SHELL-05**: Theme toggle with system preference detection
- [ ] **SHELL-06**: Keyboard navigation support for accessibility

### Personal Dashboard

- [ ] **DASH-01**: Dashboard page at `/beta/me`
- [ ] **DASH-02**: HeadlineWidget with adaptive type selection
- [ ] **DASH-03**: useAdaptiveHeadline hook with heuristics
- [ ] **DASH-04**: Concept2 logbook data widget
- [ ] **DASH-05**: Strava activity feed widget
- [ ] **DASH-06**: Unified activity feed with source badges
- [ ] **DASH-07**: Dashboard preferences (pin/hide modules)
- [ ] **DASH-08**: Empty states for missing integrations

### Coach Features

- [ ] **COACH-01**: Team Whiteboard view with daily content
- [ ] **COACH-02**: Whiteboard editor for coaches
- [ ] **COACH-03**: Fleet Management: shells list and CRUD
- [ ] **COACH-04**: Fleet Management: oar sets list and CRUD
- [ ] **COACH-05**: Athlete biometrics display (side preference, can scull/cox)
- [ ] **COACH-06**: Availability calendar for team view
- [ ] **COACH-07**: Individual athlete availability editing

### Backend: Data Models

- [ ] **MODEL-01**: Shell model for fleet management
- [ ] **MODEL-02**: OarSet model for equipment tracking
- [ ] **MODEL-03**: Availability model with morning/evening slots
- [ ] **MODEL-04**: DefaultSchedule model for recurring availability
- [ ] **MODEL-05**: Whiteboard model for daily team posts
- [ ] **MODEL-06**: DashboardPreferences model for user settings
- [ ] **MODEL-07**: Activity model with source deduplication
- [ ] **MODEL-08**: Athlete model extended with biometrics fields

### Backend: APIs

- [ ] **API-01**: Fleet shells CRUD endpoints
- [ ] **API-02**: Fleet oars CRUD endpoints
- [ ] **API-03**: Athlete biometrics update endpoint
- [ ] **API-04**: Availability CRUD for individual athletes
- [ ] **API-05**: Team-wide availability view endpoint
- [ ] **API-06**: Default schedule endpoints
- [ ] **API-07**: Whiteboard CRUD and latest endpoints
- [ ] **API-08**: Dashboard preferences endpoints
- [ ] **API-09**: Activity feed with source filtering

### Migration & Flip

- [ ] **FLIP-01**: All V1 features accessible via V2 navigation
- [ ] **FLIP-02**: Feature parity verification checklist complete
- [ ] **FLIP-03**: V2 becomes default at `/`, V1 moves to `/legacy`
- [ ] **FLIP-04**: User preference to opt back to V1 temporarily
- [ ] **FLIP-05**: Analytics tracking for V1 vs V2 usage

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Coach Features

- **COACH-V2-01**: Lineup builder with drag-drop seat assignments
- **COACH-V2-02**: Practice plan templates and library
- **COACH-V2-03**: Athlete performance trends visualization
- **COACH-V2-04**: Multi-boat training session planning

### Mobile Experience

- **MOBILE-01**: PWA support with offline capability
- **MOBILE-02**: Push notifications for whiteboard updates
- **MOBILE-03**: Quick log entry from mobile

### Integrations

- **INT-01**: Apple Health integration
- **INT-02**: Garmin Connect integration
- **INT-03**: Custom workout import from spreadsheets

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native mobile apps | Web-first with responsive design handles mobile |
| Real-time collaborative whiteboard | Current Socket.IO is for other features; whiteboard is single-author |
| Custom analytics engine | Leverage Concept2/Strava existing analytics |
| Multi-team membership | Architectural constraint in current user model |
| Billing changes | Stripe integration working, out of redesign scope |
| V1 feature removal | V1 remains at `/legacy` indefinitely as fallback |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 2 | Pending |
| SETUP-05 | Phase 2 | Pending |
| SETUP-06 | Phase 1 | Pending |
| SHELL-01 | Phase 2 | Pending |
| SHELL-02 | Phase 2 | Pending |
| SHELL-03 | Phase 2 | Pending |
| SHELL-04 | Phase 2 | Pending |
| SHELL-05 | Phase 2 | Pending |
| SHELL-06 | Phase 2 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| DASH-05 | Phase 3 | Pending |
| DASH-06 | Phase 3 | Pending |
| DASH-07 | Phase 3 | Pending |
| DASH-08 | Phase 3 | Pending |
| COACH-01 | Phase 4 | Pending |
| COACH-02 | Phase 4 | Pending |
| COACH-03 | Phase 4 | Pending |
| COACH-04 | Phase 4 | Pending |
| COACH-05 | Phase 4 | Pending |
| COACH-06 | Phase 4 | Pending |
| COACH-07 | Phase 4 | Pending |
| MODEL-01 | Phase 1-2 | Pending |
| MODEL-02 | Phase 1-2 | Pending |
| MODEL-03 | Phase 1-2 | Pending |
| MODEL-04 | Phase 1-2 | Pending |
| MODEL-05 | Phase 1-2 | Pending |
| MODEL-06 | Phase 1-2 | Pending |
| MODEL-07 | Phase 3 | Pending |
| MODEL-08 | Phase 1-2 | Pending |
| API-01 | Phase 4 | Pending |
| API-02 | Phase 4 | Pending |
| API-03 | Phase 3 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 4 | Pending |
| API-06 | Phase 3 | Pending |
| API-07 | Phase 4 | Pending |
| API-08 | Phase 3 | Pending |
| API-09 | Phase 3 | Pending |
| FLIP-01 | Phase 5 | Pending |
| FLIP-02 | Phase 5 | Pending |
| FLIP-03 | Phase 5 | Pending |
| FLIP-04 | Phase 5 | Pending |
| FLIP-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after initial definition*
