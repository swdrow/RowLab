# Requirements: RowLab v2.0 — Core Migration

**Defined:** 2026-01-24
**Core Value:** Complete V1→V2 migration with world-class UI following "Precision Instrument" design philosophy

## v2.0 Requirements

Requirements for v2.0 milestone. Each maps to roadmap phases.

### Athletes Page

- [ ] **ATH-01**: Coach can view athlete roster in grid or list view
- [ ] **ATH-02**: Coach can search athletes by name
- [ ] **ATH-03**: Coach can filter athletes by side preference (port/starboard/both)
- [ ] **ATH-04**: Coach can filter athletes by capabilities (can scull, can cox)
- [ ] **ATH-05**: Coach can view athlete profile with biometrics (height, weight, side, scull, cox)
- [ ] **ATH-06**: Coach can edit athlete biometrics
- [ ] **ATH-07**: Coach can bulk import athletes from CSV file
- [ ] **ATH-08**: System validates CSV format and shows preview before import

### Attendance Tracking

- [ ] **ATT-01**: Coach can record daily attendance (present, late, excused, unexcused)
- [ ] **ATT-02**: Coach can view attendance history by athlete
- [ ] **ATT-03**: Coach can view team attendance summary for date range
- [ ] **ATT-04**: Attendance links to training plan sessions (which practice they attended)

### Erg Data Tracking

- [ ] **ERG-01**: Coach can view all erg tests for team in sortable table
- [ ] **ERG-02**: Coach can add new erg test result manually
- [ ] **ERG-03**: Coach can edit existing erg test result
- [ ] **ERG-04**: Coach can delete erg test result
- [ ] **ERG-05**: Athlete can view their own erg history with trend chart
- [ ] **ERG-06**: Coach can view athlete's erg progress over time (line chart)
- [ ] **ERG-07**: Coach can bulk import erg tests from CSV file
- [ ] **ERG-08**: Coach can view Concept2 sync status per athlete (connected, last sync)
- [ ] **ERG-09**: Coach can trigger manual C2 sync for connected athletes

### Lineup Builder

- [ ] **LINE-01**: Coach can create new lineup for a boat class (8+, 4+, 2x, etc.)
- [ ] **LINE-02**: Coach can drag athletes from bank to seats in boat
- [ ] **LINE-03**: Coach can drag athletes between seats to rearrange
- [ ] **LINE-04**: Coach can remove athlete from seat (return to bank)
- [ ] **LINE-05**: System validates seat assignments (port/starboard preference, coxswain seat)
- [ ] **LINE-06**: Coach can undo last action (Ctrl+Z)
- [ ] **LINE-07**: Coach can redo undone action (Ctrl+Shift+Z)
- [ ] **LINE-08**: Coach can view lineup history (previous versions)
- [ ] **LINE-09**: Coach can save lineup with name and date
- [ ] **LINE-10**: Coach can duplicate existing lineup as starting point
- [ ] **LINE-11**: Coach can export lineup as print-ready PDF (high-contrast, large font)
- [ ] **LINE-12**: System displays average biometrics (weight, height, 2k split) as lineup is built

### Boat Margin Visualizer

- [ ] **MARG-01**: System displays top-down shell silhouette PNG for each boat type
- [ ] **MARG-02**: User can view margin between two boats based on piece times
- [ ] **MARG-03**: System calculates distance gap from time delta and winner speed
- [ ] **MARG-04**: System displays margin in boat lengths (scaled to shell type)
- [ ] **MARG-05**: Visualization shows bow ball positions with gap indicator

### Seat Racing

- [ ] **SEAT-01**: Coach can create seat race session with metadata (date, conditions)
- [ ] **SEAT-02**: Coach can add pieces to session (multiple boats per piece)
- [ ] **SEAT-03**: Coach can enter piece times for each boat
- [ ] **SEAT-04**: Coach can assign athletes to seats within piece boats
- [ ] **SEAT-05**: Coach can record switch (which athletes swapped between pieces)
- [ ] **SEAT-06**: System calculates ELO-style ratings from piece results
- [ ] **SEAT-07**: System displays confidence intervals for rankings
- [ ] **SEAT-08**: Coach can view athlete rankings sorted by ELO rating
- [ ] **SEAT-09**: System generates optimal switch sequence (minimize pieces for confidence)
- [ ] **SEAT-10**: Coach can adjust seat race parameters (K-factor, piece weight)

### Training Plans

- [ ] **TRAIN-01**: Coach can view training calendar (month/week views)
- [ ] **TRAIN-02**: Coach can create workout and place on calendar
- [ ] **TRAIN-03**: Coach can drag workouts to reschedule
- [ ] **TRAIN-04**: Coach can create periodization block (base, build, peak, taper)
- [ ] **TRAIN-05**: Coach can apply template to date range
- [ ] **TRAIN-06**: Coach can assign training plan to individual athletes or groups
- [ ] **TRAIN-07**: Athlete can view their assigned training plan
- [ ] **TRAIN-08**: Athlete can mark workout as completed
- [ ] **TRAIN-09**: Coach can view compliance dashboard (who completed what)
- [ ] **TRAIN-10**: System calculates training load (TSS/volume per week)

### NCAA Compliance (20-Hour Rule)

- [ ] **NCAA-01**: System tracks daily practice hours per athlete
- [ ] **NCAA-02**: System calculates weekly total against 20-hour limit
- [ ] **NCAA-03**: Coach receives warning when approaching limit
- [ ] **NCAA-04**: Coach can view compliance report for audit purposes

### Racing & Regattas

- [ ] **RACE-01**: Coach can create regatta with metadata (name, location, dates)
- [ ] **RACE-02**: Coach can add races to regatta (event name, distance, boat class)
- [ ] **RACE-03**: Coach can create race entry (link lineup to race)
- [ ] **RACE-04**: Coach can enter race results (finish time, place, margin)
- [ ] **RACE-05**: System auto-calculates margins between finishers
- [ ] **RACE-06**: Coach can view regatta results summary
- [ ] **RACE-07**: System maintains team rankings based on race results
- [ ] **RACE-08**: Race Day Command Center shows countdown to next race
- [ ] **RACE-09**: Race Day shows heat sheet with progression rules
- [ ] **RACE-10**: Race Day shows warm-up launch schedule

### Team Rankings (CMAX-style)

- [ ] **RANK-01**: System can import external rankings (Row2k, USRowing, RegattaCentral)
- [ ] **RANK-02**: System calculates internal speed estimates from entered race results
- [ ] **RANK-03**: Coach can view team's estimated ranking relative to competitors
- [ ] **RANK-04**: System shows ranking confidence and contributing races
- [ ] **RANK-05**: Coach can compare team speed to specific competitors

### Design System & Polish

- [ ] **DESIGN-01**: All v2.0 components follow "Precision Instrument" design language
- [ ] **DESIGN-02**: Light theme renders correctly (fix CSS cascade issue)
- [ ] **DESIGN-03**: Field theme (high-contrast outdoor) renders correctly
- [ ] **DESIGN-04**: All tables support virtualization for 100+ rows
- [ ] **DESIGN-05**: All drag-drop interactions have spring-physics animations
- [ ] **DESIGN-06**: All forms follow react-hook-form + Zod validation pattern

### Settings & Configuration

- [ ] **SET-01**: User can access full settings page (migrated from V1)
- [ ] **SET-02**: User can manage integrations (C2, Strava connections)
- [ ] **SET-03**: Team owner can manage billing (Stripe integration)
- [ ] **SET-04**: Coach can manage team members and roles

## v2.1+ Requirements (Deferred)

Tracked but not in v2.0 scope.

### Advanced Analytics

- **ADV-01**: AI Video Technique Overlay (pose estimation)
- **ADV-02**: Coxswain Voice Analysis
- **ADV-03**: Predictive 2k Calculator
- **ADV-04**: Rigging Recommendation Engine
- **ADV-05**: Conditions-Normalized Leaderboards

### Integrations

- **INT-01**: Garmin Connect integration
- **INT-02**: Apple Health integration
- **INT-03**: Whoop recovery dashboard
- **INT-04**: RowCast weather integration

### Team Operations

- **OPS-01**: Equipment check-in/out with QR codes
- **OPS-02**: Gear & uniform management
- **OPS-03**: Travel planning for regattas
- **OPS-04**: Coxswain load balancing scheduler

### Mobile

- **MOB-01**: Coxswain View (mobile-first, offline)
- **MOB-02**: PWA support with offline capability
- **MOB-03**: Push notifications

## Out of Scope

Explicitly excluded from v2.0.

| Feature | Reason |
|---------|--------|
| Native mobile apps | Web-first; PWA deferred to v2.1 |
| Real-time collaborative editing | Socket.IO exists but adds complexity; single-author for v2.0 |
| AI lineup optimization | Exists in V1; migration deferred until core features complete |
| Video analysis | Very high complexity; v3.0 feature |
| Multi-team support | Architectural constraint; future consideration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ATH-01 | Phase 6 | Pending |
| ATH-02 | Phase 6 | Pending |
| ATH-03 | Phase 6 | Pending |
| ATH-04 | Phase 6 | Pending |
| ATH-05 | Phase 6 | Pending |
| ATH-06 | Phase 6 | Pending |
| ATH-07 | Phase 6 | Pending |
| ATH-08 | Phase 6 | Pending |
| ATT-01 | Phase 6 | Pending |
| ATT-02 | Phase 6 | Pending |
| ATT-03 | Phase 6 | Pending |
| ATT-04 | Phase 10 | Pending |
| ERG-01 | Phase 7 | Pending |
| ERG-02 | Phase 7 | Pending |
| ERG-03 | Phase 7 | Pending |
| ERG-04 | Phase 7 | Pending |
| ERG-05 | Phase 7 | Pending |
| ERG-06 | Phase 7 | Pending |
| ERG-07 | Phase 7 | Pending |
| ERG-08 | Phase 7 | Pending |
| ERG-09 | Phase 7 | Pending |
| LINE-01 | Phase 8 | Pending |
| LINE-02 | Phase 8 | Pending |
| LINE-03 | Phase 8 | Pending |
| LINE-04 | Phase 8 | Pending |
| LINE-05 | Phase 8 | Pending |
| LINE-06 | Phase 8 | Pending |
| LINE-07 | Phase 8 | Pending |
| LINE-08 | Phase 8 | Pending |
| LINE-09 | Phase 8 | Pending |
| LINE-10 | Phase 8 | Pending |
| LINE-11 | Phase 8 | Pending |
| LINE-12 | Phase 8 | Pending |
| MARG-01 | Phase 8 | Pending |
| MARG-02 | Phase 8 | Pending |
| MARG-03 | Phase 8 | Pending |
| MARG-04 | Phase 8 | Pending |
| MARG-05 | Phase 8 | Pending |
| SEAT-01 | Phase 9 | Pending |
| SEAT-02 | Phase 9 | Pending |
| SEAT-03 | Phase 9 | Pending |
| SEAT-04 | Phase 9 | Pending |
| SEAT-05 | Phase 9 | Pending |
| SEAT-06 | Phase 9 | Pending |
| SEAT-07 | Phase 9 | Pending |
| SEAT-08 | Phase 9 | Pending |
| SEAT-09 | Phase 9 | Pending |
| SEAT-10 | Phase 9 | Pending |
| TRAIN-01 | Phase 10 | Pending |
| TRAIN-02 | Phase 10 | Pending |
| TRAIN-03 | Phase 10 | Pending |
| TRAIN-04 | Phase 10 | Pending |
| TRAIN-05 | Phase 10 | Pending |
| TRAIN-06 | Phase 10 | Pending |
| TRAIN-07 | Phase 10 | Pending |
| TRAIN-08 | Phase 10 | Pending |
| TRAIN-09 | Phase 10 | Pending |
| TRAIN-10 | Phase 10 | Pending |
| NCAA-01 | Phase 10 | Pending |
| NCAA-02 | Phase 10 | Pending |
| NCAA-03 | Phase 10 | Pending |
| NCAA-04 | Phase 10 | Pending |
| RACE-01 | Phase 11 | Pending |
| RACE-02 | Phase 11 | Pending |
| RACE-03 | Phase 11 | Pending |
| RACE-04 | Phase 11 | Pending |
| RACE-05 | Phase 11 | Pending |
| RACE-06 | Phase 11 | Pending |
| RACE-07 | Phase 11 | Pending |
| RACE-08 | Phase 11 | Pending |
| RACE-09 | Phase 11 | Pending |
| RACE-10 | Phase 11 | Pending |
| RANK-01 | Phase 11 | Pending |
| RANK-02 | Phase 11 | Pending |
| RANK-03 | Phase 11 | Pending |
| RANK-04 | Phase 11 | Pending |
| RANK-05 | Phase 11 | Pending |
| DESIGN-01 | All Phases | Pending |
| DESIGN-02 | Phase 6 | Pending |
| DESIGN-03 | Phase 6 | Pending |
| DESIGN-04 | Phase 6 | Pending |
| DESIGN-05 | Phase 8 | Pending |
| DESIGN-06 | All Phases | Pending |
| SET-01 | Phase 12 | Pending |
| SET-02 | Phase 12 | Pending |
| SET-03 | Phase 12 | Pending |
| SET-04 | Phase 12 | Pending |

**Coverage:**
- v2.0 requirements: 84 total
- Mapped to phases: 84
- Unmapped: 0

**Phase Distribution:**
| Phase | Requirements | Count |
|-------|--------------|-------|
| 6 | ATH-01-08, ATT-01-03, DESIGN-02-04 | 14 |
| 7 | ERG-01-09 | 9 |
| 8 | LINE-01-12, MARG-01-05, DESIGN-05 | 18 |
| 9 | SEAT-01-10 | 10 |
| 10 | TRAIN-01-10, ATT-04, NCAA-01-04 | 15 |
| 11 | RACE-01-10, RANK-01-05 | 15 |
| 12 | SET-01-04 | 4 |
| All | DESIGN-01, DESIGN-06 | 2 (cross-cutting) |

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 — Phase mappings finalized*
