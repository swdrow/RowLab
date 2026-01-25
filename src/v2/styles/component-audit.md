# V2 Component Inventory & Audit

**Date:** 2026-01-25
**Phase:** 12-settings-photos-polish
**Standard:** "Precision Instrument" design (Raycast/Linear/Vercel quality)

## Audit Checklist

Each component is evaluated against these criteria:

1. **Visual Polish**
   - [ ] Uses design tokens (no hardcoded colors)
   - [ ] Consistent border radius
   - [ ] Consistent spacing
   - [ ] Proper shadows

2. **States**
   - [ ] Default state
   - [ ] Hover state
   - [ ] Focus state (:focus-visible)
   - [ ] Active/pressed state
   - [ ] Disabled state
   - [ ] Loading state (if applicable)

3. **Accessibility**
   - [ ] Keyboard navigable
   - [ ] ARIA attributes
   - [ ] Focus visible
   - [ ] Color contrast passes

4. **Animation**
   - [ ] Uses SPRING_CONFIG
   - [ ] Respects prefers-reduced-motion

5. **Themes**
   - [ ] Works in dark theme
   - [ ] Works in light theme
   - [ ] Works in field theme

---

## Component Inventory

### Primitives (src/v2/components/ui/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| Button | Y | Y | Y | Y | Y | Audited |
| IconButton | Y | Y | Y | Y | Y | Audited |
| Icon | Y | - | Y | - | Y | Audited |
| Card | Y | Y | Y | N | Y | Audited |
| Modal | Y | Y | Y | Y | Y | Audited |
| Toggle | Y | Y | Y | Y | Y | Audited |

### Common (src/v2/components/common/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| CrudModal | Y | Y | Y | Y | Y | Audited |
| EmptyState | Y | - | Y | Y | Y | Audited |
| ErrorState | Y | - | Y | Y | Y | Audited |
| LoadingSkeleton | Y | - | Y | Y | Y | Audited |
| Toast | Y | Y | Y | Y | Y | Audited |
| VirtualTable | Y | Y | Y | N | Y | Audited |

### Shell (src/v2/components/shell/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| ContextRail | Y | Y | Y | Y | Y | Audited |
| MobileNav | Y | Y | Y | Y | Y | Audited |
| SkipLink | Y | Y | Y | N | Y | Audited |
| ThemeToggle | Y | Y | Y | Y | Y | Audited |
| VersionRedirectGuard | - | - | - | - | - | Utility |
| VersionToggle | Y | Y | Y | Y | Y | Audited |
| WorkspaceSidebar | Y | Y | Y | Y | Y | Audited |

### Dashboard (src/v2/components/dashboard/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| ActivityCard | Y | Y | Y | Y | Y | Audited |
| DashboardGrid | Y | - | Y | Y | Y | Audited |
| HeadlineWidget | Y | - | Y | Y | Y | Audited |
| UnifiedActivityFeed | Y | Y | Y | Y | Y | Audited |
| WidgetWrapper | Y | - | Y | Y | Y | Audited |

### Athletes (src/v2/components/athletes/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| AthleteAvatar | Y | - | Y | N | Y | Audited |
| AthleteCard | Y | Y | Y | Y | Y | Audited |
| AthleteEditPanel | Y | Y | Y | Y | Y | Audited |
| AthleteFilters | Y | Y | Y | N | Y | Pending |
| AthletesEmptyState | Y | - | Y | Y | Y | Audited |
| AthletesTable | Y | Y | Y | N | Y | Pending |
| AttendanceHistory | Y | Y | Y | N | Y | Pending |
| AttendanceSummary | Y | - | Y | N | Y | Pending |
| AttendanceTracker | Y | Y | Y | N | Y | Pending |
| ColumnMapper | Y | Y | Y | N | Y | Pending |
| CSVImportModal | Y | Y | Y | Y | Y | Audited |
| ImportPreview | Y | - | Y | N | Y | Pending |
| ViewToggle | Y | Y | Y | Y | Y | Audited |

### Availability (src/v2/components/availability/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| AvailabilityCell | Y | Y | Y | Y | Y | Audited |
| AvailabilityEditor | Y | Y | Y | Y | Y | Audited |
| AvailabilityGrid | Y | Y | Y | Y | Y | Audited |

### Erg (src/v2/components/erg/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| AthleteErgHistory | Y | Y | Y | Y | Y | Audited |
| C2StatusBadge | Y | - | Y | N | Y | Audited |
| C2SyncButton | Y | Y | Y | Y | Y | Audited |
| ErgColumnMapper | Y | Y | Y | N | Y | Pending |
| ErgCSVImportModal | Y | Y | Y | Y | Y | Audited |
| ErgEmptyState | Y | - | Y | Y | Y | Audited |
| ErgImportPreview | Y | - | Y | N | Y | Pending |
| ErgProgressChart | Y | Y | Y | Y | Y | Audited |
| ErgTestFilters | Y | Y | Y | N | Y | Pending |
| ErgTestForm | Y | Y | Y | Y | Y | Audited |
| ErgTestsTable | Y | Y | Y | N | Y | Pending |
| PersonalBestsCard | Y | - | Y | Y | Y | Audited |
| TeamC2StatusList | Y | Y | Y | N | Y | Pending |

### Fleet (src/v2/components/fleet/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| OarSetForm | Y | Y | Y | Y | Y | Audited |
| OarsTable | Y | Y | Y | N | Y | Pending |
| ShellForm | Y | Y | Y | Y | Y | Audited |
| ShellsTable | Y | Y | Y | N | Y | Pending |

### Lineup (src/v2/components/lineup/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| AddBoatButton | Y | Y | Y | Y | Y | Audited |
| AthleteBank | Y | Y | Y | Y | Y | Audited |
| BiometricsPanel | Y | - | Y | Y | Y | Audited |
| BoatView | Y | Y | Y | Y | Y | Audited |
| DraggableAthleteCard | Y | Y | Y | Y | Y | Audited |
| ExportPDFButton | Y | Y | Y | Y | Y | Audited |
| LineupEmptyState | Y | - | Y | Y | Y | Audited |
| LineupToolbar | Y | Y | Y | N | Y | Pending |
| LineupWorkspace | Y | Y | Y | Y | Y | Audited |
| MarginVisualizer | Y | Y | Y | Y | Y | Audited |
| MobileAthleteSelector | Y | Y | Y | Y | Y | Audited |
| MobileLineupBuilder | Y | Y | Y | Y | Y | Audited |
| MobileSeatSlot | Y | Y | Y | Y | Y | Audited |
| PrintableLineup | Y | - | N | N | N | Pending |
| SaveLineupDialog | Y | Y | Y | Y | Y | Audited |
| SeatSlot | Y | Y | Y | Y | Y | Audited |
| SeatWarningBadge | Y | - | Y | Y | Y | Audited |
| VersionHistory | Y | Y | Y | Y | Y | Audited |

### Race Day (src/v2/components/race-day/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| ChecklistTemplateForm | Y | Y | Y | Y | Y | Audited |
| DayTimeline | Y | Y | Y | Y | Y | Audited |
| NextRaceCard | Y | Y | Y | Y | Y | Audited |
| PreRaceChecklist | Y | Y | Y | Y | Y | Audited |
| WarmupSchedule | Y | Y | Y | Y | Y | Audited |

### Rankings (src/v2/components/rankings/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| HeadToHeadTable | Y | Y | Y | N | Y | Pending |
| RankingImportForm | Y | Y | Y | Y | Y | Audited |
| RankingsView | Y | Y | Y | Y | Y | Audited |

### Regatta (src/v2/components/regatta/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| EventForm | Y | Y | Y | Y | Y | Audited |
| MarginDisplay | Y | - | Y | Y | Y | Audited |
| RaceForm | Y | Y | Y | Y | Y | Audited |
| RegattaCalendar | Y | Y | Y | Y | Y | Audited |
| RegattaDetail | Y | Y | Y | Y | Y | Audited |
| RegattaEmptyState | Y | - | Y | Y | Y | Audited |
| RegattaForm | Y | Y | Y | Y | Y | Audited |
| RegattaList | Y | Y | Y | Y | Y | Audited |
| ResultsCSVImport | Y | Y | Y | Y | Y | Audited |
| ResultsForm | Y | Y | Y | Y | Y | Audited |

### Seat Racing (src/v2/components/seat-racing/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| ConfidenceBadge | Y | - | Y | N | Y | Audited |
| ParametersPanel | Y | Y | Y | Y | Y | Audited |
| RankingsChart | Y | Y | Y | Y | Y | Audited |
| RankingsTable | Y | Y | Y | N | Y | Pending |
| SeatRacingEmptyState | Y | - | Y | Y | Y | Audited |
| SessionDetail | Y | Y | Y | Y | Y | Audited |
| SessionList | Y | Y | Y | Y | Y | Audited |

### Seat Racing Wizard (src/v2/components/seat-racing/wizard/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| AthleteAssignmentStep | Y | Y | Y | Y | Y | Audited |
| BoatTimeEntry | Y | Y | Y | Y | Y | Audited |
| PieceManagerStep | Y | Y | Y | Y | Y | Audited |
| ReviewStep | Y | - | Y | Y | Y | Audited |
| SeatSlotSelector | Y | Y | Y | Y | Y | Audited |
| SessionMetadataStep | Y | Y | Y | Y | Y | Audited |
| SessionWizard | Y | Y | Y | Y | Y | Audited |
| StepIndicator | Y | Y | Y | Y | Y | Audited |

### Settings (src/v2/components/settings/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| PhotoCropper | Y | Y | Y | Y | Y | Audited |
| PhotoUpload | Y | Y | Y | Y | Y | Audited |

### Training Calendar (src/v2/components/training/calendar/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| CalendarToolbar | Y | Y | Y | Y | Y | Audited |
| DragDropCalendar | Y | Y | Y | Y | Y | Audited |
| TrainingCalendar | Y | Y | Y | Y | Y | Audited |
| WorkoutEventCard | Y | Y | Y | Y | Y | Audited |

### Training Compliance (src/v2/components/training/compliance/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| AttendanceTrainingLinkPanel | Y | Y | Y | Y | Y | Audited |
| ComplianceDashboard | Y | Y | Y | Y | Y | Audited |
| NCAA20HourWarning | Y | - | Y | Y | Y | Audited |
| NCAAAuditReport | Y | Y | Y | Y | Y | Audited |
| TrainingLoadChart | Y | Y | Y | Y | Y | Audited |
| WeeklyHoursTable | Y | Y | Y | N | Y | Pending |

### Training Periodization (src/v2/components/training/periodization/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| BlockForm | Y | Y | Y | Y | Y | Audited |
| PeriodizationTimeline | Y | Y | Y | Y | Y | Audited |
| TemplateApplicator | Y | Y | Y | Y | Y | Audited |

### Training Assignments (src/v2/components/training/assignments/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| AssignmentManager | Y | Y | Y | Y | Y | Audited |
| AthleteWorkoutView | Y | Y | Y | Y | Y | Audited |

### Training Workouts (src/v2/components/training/workouts/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| ExerciseFieldArray | Y | Y | Y | Y | Y | Audited |
| WorkoutForm | Y | Y | Y | Y | Y | Audited |

### Training Empty State

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| CalendarEmptyState | Y | - | Y | Y | Y | Audited |

### Whiteboard (src/v2/components/whiteboard/)

| Component | Visual | States | A11y | Animation | Themes | Status |
|-----------|--------|--------|------|-----------|--------|--------|
| WhiteboardEditor | Y | Y | Y | Y | Y | Audited |
| WhiteboardView | Y | Y | Y | Y | Y | Audited |

---

## Audit Results Summary

| Category | Total | Audited | Pass | Pending |
|----------|-------|---------|------|---------|
| Primitives | 6 | 6 | 6 | 0 |
| Common | 6 | 6 | 6 | 0 |
| Shell | 7 | 6 | 6 | 0 |
| Dashboard | 5 | 5 | 5 | 0 |
| Athletes | 13 | 6 | 6 | 7 |
| Availability | 3 | 3 | 3 | 0 |
| Erg | 13 | 7 | 7 | 6 |
| Fleet | 4 | 2 | 2 | 2 |
| Lineup | 18 | 16 | 16 | 2 |
| Race Day | 5 | 5 | 5 | 0 |
| Rankings | 3 | 2 | 2 | 1 |
| Regatta | 10 | 10 | 10 | 0 |
| Seat Racing | 7 | 6 | 6 | 1 |
| Seat Racing Wizard | 8 | 8 | 8 | 0 |
| Settings | 2 | 2 | 2 | 0 |
| Training Calendar | 4 | 4 | 4 | 0 |
| Training Compliance | 6 | 5 | 5 | 1 |
| Training Periodization | 3 | 3 | 3 | 0 |
| Training Assignments | 2 | 2 | 2 | 0 |
| Training Workouts | 2 | 2 | 2 | 0 |
| Training Empty State | 1 | 1 | 1 | 0 |
| Whiteboard | 2 | 2 | 2 | 0 |
| **TOTAL** | **124** | **103** | **103** | **20** |

**Audit Coverage:** 83%

---

## Issues Found

| Component | Issue | Priority | Fix |
|-----------|-------|----------|-----|
| PrintableLineup | No theme support (print-specific) | Low | Intentional - print stylesheet |

---

## Pending Items

Components marked as "Pending" have been built but need formal audit review for:
- Animation integration (SPRING_CONFIG)
- Focus ring consistency
- Reduced motion support

These are primarily data table and filter components that use TanStack Table.

---

## Deferred Improvements

| Component | Improvement | Reason Deferred |
|-----------|-------------|-----------------|
| VirtualTable | Add row-level focus management | Complex - needs TanStack Table focus API research |
| Tables | Keyboard navigation between cells | Phase 14 scope (Advanced A11y) |
| PrintableLineup | Theme support | Print-specific styling, not user-facing |

---

## Typography Audit

### Heading Hierarchy

The following typography classes enforce semantic hierarchy:

| Level | Class | Size | Weight | Use Case |
|-------|-------|------|--------|----------|
| Display | `.text-display` | 36px | 700 | Hero sections |
| H1 | `.text-heading-1` | 30px | 700 | Page titles |
| H2 | `.text-heading-2` | 24px | 600 | Section headings |
| H3 | `.text-heading-3` | 20px | 600 | Card/panel titles |
| H4 | `.text-heading-4` | 18px | 500 | Subsection titles |
| Body | `.text-body` | 16px | 400 | Main content |
| Body SM | `.text-body-sm` | 14px | 400 | Secondary content |
| Label | `.text-label` | 12px | 500 | Form labels, metadata |
| Caption | `.text-caption` | 12px | 400 | Hints, timestamps |
| Mono | `.text-mono` | 14px | 400 | Code, identifiers |
| Data | `.text-data` | 16px | 600 | Erg times, rankings |

---

## Icon Sizing Audit

### Standard Icon Sizes

| Size | Class | Pixels | Use Case |
|------|-------|--------|----------|
| sm | `w-4 h-4` | 16px | Inline text, small buttons |
| md | `w-5 h-5` | 20px | Default, nav items, form inputs |
| lg | `w-6 h-6` | 24px | Section headers, large buttons |
| xl | `w-8 h-8` | 32px | Empty states, hero sections |

### Icon Component Usage

```tsx
import { Icon } from '@v2/components/ui/Icon';
import { Home, Settings, Bell } from 'lucide-react';

// Basic usage
<Icon icon={Home} size="md" />

// With accessibility label (for standalone icons)
<Icon icon={Settings} size="lg" label="Settings" />

// With badge
<IconWithBadge icon={Bell} size="md" badge={3} badgeColor="error" />
```

---

## Next Steps

1. **Phase 12-15:** Complete pending component audits
2. **Phase 13:** Cross-feature integration testing
3. **Phase 14:** Advanced accessibility (keyboard nav, screen reader testing)
