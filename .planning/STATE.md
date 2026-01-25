# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v2.0 — Core Migration
**Phase:** 10 (Training Plans & NCAA Compliance) — In Progress
**Status:** Completed 10-09-PLAN.md (NCAA Warning & Audit Components)
**Last activity:** 2026-01-25 — Completed 10-09-PLAN.md

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Context-aware dashboard experience that adapts to athlete/coach role
**v2.0 focus:** Complete V1 to V2 migration with "Precision Instrument" design philosophy

## Progress

### v1.0 Milestone (Complete)

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Clean Room Setup | Complete | 4/4 |
| 2 | Foundation | Complete | 4/4 |
| 3 | Vertical Slice | Complete | 7/7 |
| 4 | Migration Loop | Complete | 12/12 |
| 5 | The Flip | Complete | 5/5 |

v1.0 Progress: 100% Complete

### v2.0 Milestone (Active)

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 6 | Athletes & Roster | Complete | 8/8 |
| 7 | Erg Data & Performance | Complete | 6/6 |
| 8 | Lineup Builder | In Progress | 9/10 |
| 9 | Seat Racing | In Progress | 8/9 |
| 10 | Training Plans & NCAA | In Progress | 10/11 |
| 11 | Racing & Regattas | Pending | —/— |
| 12 | Settings & Polish | Pending | —/— |

v2.0 Progress: ██████████░░ 91% (41/45)

## Quick Context

**Architecture:** In-Place Strangler pattern (v1.0)
- V2 at `/app` (default)
- V1 at `/legacy` (fallback)
- Shares existing Zustand stores with V1

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS 3.4, Framer Motion, TanStack Query v5, TanStack Table, TanStack Virtual

**v2.0 Design Philosophy:** "Precision Instrument" (Raycast/Linear/Vercel inspired)

**Codebase Map:** .planning/codebase/ (7 documents, 1,978 lines)

## Accumulated Decisions

See STATE.md.backup for full v1.0 decision history (211 decisions across 5 phases)

Key architectural decisions carrying forward:
- TanStack Query for server state, Zustand for complex client state only
- Feature-based organization in src/v2/features/
- react-hook-form + Zod for all form validation
- @dnd-kit for drag-drop interactions
- recharts for data visualization

### v2.0 Decisions (Phases 6-7)

| Plan | Decision | Rationale |
|------|----------|-----------|
| 06-02 | VirtualTable uses TanStack Virtual + Table | Combines virtualization for performance with full table features (sorting, filtering) |
| 06-02 | 20-item overscan for virtualization | Balances performance with smooth scrolling, prevents blank areas during fast scroll |
| 06-02 | Generic TypeScript VirtualTable component | Enables reuse across athletes, erg data, and all future large tables |
| 06-01 | Used db push instead of migration | Database had drift from migration history, db push syncs schema directly for development |
| 06-01 | Status as string instead of Prisma enum | Provides flexibility for future status additions without schema migration |
| 06-01 | Unique constraint on athleteId + date | Ensures one attendance record per athlete per day, upsert prevents duplicates |
| 06-01 | Bulk operations with Prisma transactions | Ensures atomicity when recording attendance for multiple athletes |
| 06-03 | Client-side filtering for athletes | Reduces API calls, improves UX responsiveness for small datasets (<200 athletes) |
| 06-03 | Attendance map conversion for O(1) lookup | Eliminates O(n) find() calls when rendering roster with attendance status |
| 06-03 | Separate hooks by access pattern | useAttendance (date), useAthleteAttendance (athlete), useAttendanceSummary (stats) |
| 06-07 | Always apply data-theme attribute for all themes | CSS cascade requires attribute presence for selectors like .v2[data-theme="X"] to match |
| 06-07 | Explicit CSS selectors for each theme | Each theme needs .v2[data-theme="X"] selector for proper cascade behavior |
| 06-07 | Field theme uses high-contrast amber/yellow | Outdoor rowing requires high visibility in bright sunlight conditions |
| 06-04 | Deterministic HSL colors for avatars | Provides consistent visual identity without photo uploads, better distribution than RGB hash |
| 06-04 | LocalStorage for view preference | Maintains user preference between sessions without requiring server state |
| 06-04 | Slide-out panel for editing | Better spatial context than modal - user can see roster while editing |
| 06-04 | Responsive grid layout (1-4 columns) | Optimizes space usage across all screen sizes while maintaining readability |
| 06-05 | PapaParse for CSV parsing | Industry standard with worker thread support for large files, automatic type inference |
| 06-05 | Fuzzy column matching | Normalize case/punctuation for auto-mapping common variations (first/fname/First Name all match) |
| 06-05 | Partial import strategy | Allow importing valid rows while showing errors for invalid ones - doesn't block bulk import |
| 06-05 | Worker threads at 500KB threshold | Prevents UI blocking during large CSV parsing (~5,000 rows with 10 columns) |
| 06-06 | Single-letter status labels (P/L/E/U) | Compact display for mobile, full words shown on hover/title |
| 06-06 | Attendance rate = (present + late) / total | Late arrivals count toward attendance for coaching purposes |
| 06-06 | Summary sorted by rate descending | Coaches quickly identify low-attendance athletes needing intervention |
| 06-06 | Date presets (7d/30d/90d) | Common reporting periods for coaching analysis |
| 07-01 | Query keys include filters for erg tests | Enables proper cache isolation when filtering by athlete/testType/date |
| 07-01 | Separate hooks by access pattern for erg data | useErgTests, useAthleteErgHistory, useErgLeaderboard provide clarity and prevent over-fetching |
| 07-01 | C2 status staleTime 5 minutes | Connection status changes infrequently, reduces unnecessary API calls |
| 07-01 | useTeamC2Statuses for bulk queries | Provided but UI should use individual queries to avoid N+1 at load time |
| 07-02 | Time input supports MM:SS.s format | Converts to seconds for storage, user-friendly input reduces data entry errors |
| 07-02 | Auto-calculate watts from split (and vice versa) | Using standard erg formula (watts = 2.80 / pace^3) reduces manual calculation work |
| 07-02 | Mobile card view below 768px | Responsive design essential for coaches using tablets on deck |
| 07-02 | Test type color coding (2k=red, 6k=blue, etc) | Visual distinction helps coaches quickly identify test types in table |
| 07-04 | parseTimeToSeconds() supports multiple formats | Handles MM:SS.s, MM:SS, HH:MM:SS, and numeric seconds for CSV import flexibility |
| 07-04 | parseTestType() normalizes test type variations | Maps 2k/2K/2000m/2000 → canonical types, reduces data entry errors |
| 07-04 | Athlete matching uses fuzzy search | Handles "First Last" or "Last, First" formats with partial matching for CSV import |
| 07-04 | Worker threads at 500KB CSV threshold | Same as Phase 6 pattern - prevents UI blocking for ~5,000 rows |
| 07-05 | 60-minute stale threshold for C2 sync | Balances alerting coaches to outdated data without excessive yellow badges during normal usage |
| 07-05 | Custom relative time formatting | More readable than absolute timestamps, matches modern UI patterns (2m ago, 3h ago, etc) |
| 07-05 | Team C2 status uses bulk query | useTeamC2Statuses prevents N+1 query problem when loading team overview |
| 07-05 | Slide-out panel for C2 status | Non-modal allows viewing tests while checking status, matches Linear/GitHub patterns |
| 08-01 | Use existing lineupStore instead of new V2 store | lineupStore has undo/redo middleware, boat management, API integration - V1/V2 can share state during migration |
| 08-01 | Display seats bow-at-top by reversing store order | boatConfig generates seats high-to-low, but traditional notation shows bow at top - reverse in display layer |
| 08-01 | Defer shell selector to future enhancement | Plan scope is foundational components - shell assignment can be added post-creation via boat header edit |
| 08-02 | Track source position in drag data for auto-swap | Source tracking (bank/seat/coxswain) enables proper athlete exchange when dropping on occupied seats |
| 08-02 | Use DragOverlay for cursor preview | Shows full athlete card at cursor during drag, better visibility than transform-only approach |
| 08-02 | Green border for all drop zones, defer red for validation | Plan scope is core drag-drop, validation warnings come in 08-03 |
| 08-02 | 10px mouse activation, 250ms touch delay | Prevents accidental drags, balances responsiveness with intentionality |
| 08-03 | Validation warnings never block assignment | Trust the coach - warnings are informational only, coach knows best for experimental lineups |
| 08-03 | Warning badges always visible (not hover-only) | Per CONTEXT.md: constant awareness required, no hover interaction needed |
| 08-03 | Spring physics for all drag-drop animations | Spring physics feel more natural, velocity-aware, don't require precise timing curves |
| 08-03 | Shared spring config (stiffness: 300, damping: 28) | Consistent animation feel across all drag-drop interactions throughout lineup builder |
| 08-04 | Support both Ctrl+Shift+Z and Ctrl+Y for redo | Cross-platform compatibility - Mac/Linux use Shift+Z, Windows users expect Ctrl+Y |
| 08-04 | Show change count in undo/redo tooltips | Gives coach immediate awareness of how far back they can undo |
| 08-04 | Responsive button text (hidden on mobile) | Mobile screens need compact toolbar, icons are self-explanatory with tooltips |
| 08-05 | Use TanStack Query for all lineup API operations | Consistent with existing V2 patterns (useErgTests, useAthletes), automatic caching/invalidation |
| 08-05 | Duplicate creates server-side copy via API | Ensures duplicate is persisted immediately and gets unique ID from database |
| 08-05 | VersionHistory uses Headless UI Menu component | Consistent with other V2 dropdowns, accessibility built-in, keyboard navigation |
| 08-05 | Delete requires confirmation dialog | Destructive action needs clear UI feedback, separate dialog more visible than inline |
| 08-06 | jsPDF + html2canvas for client-side PDF | Keeps feature self-contained, works offline, faster than server-side Puppeteer |
| 08-06 | Print layout uses inline styles, not Tailwind | html2canvas captures computed styles, inline styles ensure consistent rendering |
| 08-06 | Off-screen rendering with position absolute | Classic off-screen pattern, doesn't affect viewport scroll, hidden from user |
| 08-06 | US Letter format as default, A4 as option | US rowing programs use Letter, international programs use A4 |
| 08-06 | Scale down to single page if content exceeds height | Simpler UX, most lineups fit on one page, multi-page adds complexity |
| 08-07 | Exclude coxswains from erg averages | Coxswains don't row, so their erg times shouldn't affect boat performance metrics |
| 08-07 | Parse 2k times from latestErgTest.time | Athletes have latestErgTest with testType and time in MM:SS.s format requiring parsing |
| 08-07 | useMemo for biometrics calculation | Prevents recalculation during drag operations, only updates when activeBoats changes |
| 08-07 | Position panel below toolbar, above boats | Horizontal strip layout - always visible, compact, doesn't require sidebar space |
| 08-08 | SVG instead of PNG for shell silhouettes | Better scaling, smaller file size, easier to customize colors via CSS |
| 08-08 | 10 units = 1 meter viewBox scaling | Consistent proportions across boat classes (8+ is 180 units, 1x is 82 units) |
| 08-08 | Cap visual gap at 50% of container width | Prevents extreme margins from breaking layout while maintaining readability |
| 08-08 | Use rowing-specific margin terminology | Dead heat, canvas, 1/4 length terms are standard rowing language coaches expect |
| 08-09 | 768px breakpoint for mobile detection | Standard tablet/mobile breakpoint, matches Tailwind md:, allows iPad portrait to use mobile UI |
| 08-09 | Separate mobile components instead of CSS-only responsive | Per CONTEXT.md: full redesign for mobile, tap-to-select requires different interaction model |
| 08-09 | Bottom sheet slides to 80% viewport height | Leaves space for user to see boat context while selecting, full-screen would hide what they're building |
| 08-09 | No DndContext on mobile layout | Drag-drop conflicts with scroll on touch, tap-to-select is cleaner mobile UX |
| 09-02 | Confidence opacity visualization: 0.3 base + confidence * 0.7 | Formula maps confidence score to bar opacity, providing visual indication of rating reliability without cluttering with badges |
| 09-02 | Side badges use same colors as AthletesTable | Port=red, Starboard=green for visual consistency across V2 components |
| 09-01 | Client-side filtering for ratings by side | API returns all ratings, client filters for Port/Starboard-specific rankings to reduce API surface area |
| 09-01 | Rating history hook returns empty array for MVP | /api/v1/ratings/history endpoint doesn't exist yet, returns empty until Plan 09-08 if needed |
| 09-01 | Confidence score maps to tier labels | getConfidenceLevel maps 0-1 score to UNRATED/PROVISIONAL/LOW/MEDIUM/HIGH for badge display |
| 09-02 | Confidence opacity visualization: 0.3 base + confidence * 0.7 | Formula maps confidence score to bar opacity, providing visual indication of rating reliability without cluttering with badges |
| 09-02 | Side badges use same colors as AthletesTable | Port=red, Starboard=green for visual consistency across V2 components |
| 09-02 | Rating color scale from V1: blue >=1200, orange >=800 | Preserved V1 RankingsDisplay color scale for familiarity |
| 09-02 | Top 3 rank highlighting with orange/bold | Emphasizes top performers in rankings table |
| 09-02 | Relative date formatting for sessions | Shows "Today", "Yesterday", "N days ago" for dates within 7 days for better UX |
| 09-02 | Delete confirmation dialog for sessions | Prevents accidental deletion of seat race sessions using Framer Motion modal |
| 09-03 | Wizard state hook independent of react-hook-form | useSessionWizard manages step navigation state separately from form state for reusability and separation of concerns |
| 09-03 | Step-by-step validation using methods.trigger() | Validates only current step's required fields before advancing, provides immediate feedback without validating future steps |
| 09-03 | FormProvider context shares form state across wizard steps | All step components use useFormContext() to access shared form state, enabling navigation without losing data |
| 09-03 | Responsive step indicator: full layout desktop, dots mobile | Desktop shows full horizontal layout with circles and labels, mobile (<640px) shows dots for space efficiency |
| 09-03 | Navigation restricted to previously visited steps | canGoToStep() only allows clicking to steps <= maxStepReached, preventing skipping ahead without validation |
| 09-04 | BoatTimeEntry accepts multiple time formats | Coaches can enter "1:32.5" (MM:SS.s), "1:32" (MM:SS), or "92.5" (seconds) - reduces data entry friction |
| 09-04 | Nested useFieldArray for pieces.boats | react-hook-form useFieldArray supports nested arrays, provides proper form state management for complex structures |
| 09-04 | Collapsible piece cards for UX scalability | Sessions with many pieces would create excessive scroll, collapse provides better management for 4+ pieces |
| 09-04 | Default boat naming (A, B, C, D) for quick setup | Speeds up initial configuration, coaches typically use letter-based boat names during seat racing |
| 09-04 | Monospace font for time inputs | Fixed-width font makes time values align visually, easier to compare finish times at a glance |
| 09-05 | Athletes sorted by side preference match for each seat | Places matching athletes at top of dropdown for quick selection, reduces scrolling |
| 09-05 | Switches auto-detected rather than manual entry | Reduces data entry burden - coaches just assign athletes and system figures out who swapped |
| 09-05 | Partial lineups allowed - seats can remain empty | Seat races often test partial lineups, strict validation would block valid use cases |
| 09-05 | Global athlete assignment tracking across all boats | Prevents double-assignment errors, provides real-time feedback in dropdowns |
| 09-07 | Headless UI Tab.Group for Rankings/Sessions tabs | Consistent with V2 patterns, accessible, keyboard navigable |
| 09-07 | Side filter buttons inline in Rankings tab header | Keeps filters visible and accessible, All/Port/Starboard with color coding |
| 09-07 | SessionWizard in modal, SessionDetail in slide-out panel | Wizard requires focus, detail allows browsing context, matches Linear/GitHub patterns |
| 09-07 | Rankings tab combines chart and table vertically | Chart provides visual distribution, table provides sortable detail, better for mobile |
| 09-08 | Dedicated ratings API with 4 routes | Separates rating concerns from seat race sessions, provides clean API surface for rating operations |
| 09-08 | Server-side side filtering in ratings API | More flexible than client-only, reduces payload size for port/starboard-specific requests |
| 09-08 | Parameters route before :athleteId route | Prevents "parameters" from being treated as athleteId, avoids route conflicts |
| 09-08 | ParametersPanel read-only for Phase 9 MVP | Editing adds complexity, viewing ratings is sufficient for MVP scope |
| 09-08 | 1-hour stale time for parameters query | Rating parameters are system-level constants that rarely change |
| 09-06 | Hierarchical POST pattern for session creation | API uses separate endpoints (session → pieces → boats → assignments) instead of nested POST |
| 09-06 | Validation warnings don't block submission | Coach can submit with missing times/assignments - shown as orange warnings, not blocking errors |
| 09-06 | onComplete receives created session object | Changed from form data to API response with session.id, enables navigation to detail view |
| 10-01 | Power-based TSS with HR and duration fallbacks | Rowing teams have varying equipment - power meters (most accurate) → HR monitors → duration estimate ensures TSS available for all workouts |
| 10-01 | NCAA competitions count as 3 hours | NCAA Bylaw 17.1.7.2 specifies competitions count as 3 CARA hours regardless of actual duration |
| 10-01 | CalendarEvent.resource.planId for filtering | Multiple concurrent plans (team, individual, archived) require plan-specific filtering to prevent calendar clutter |
| 10-01 | NCAA week runs Monday-Sunday | NCAA defines compliance week as Monday-Sunday, not calendar week - critical for accurate compliance reporting |
| 10-01 | Simple RRULE parsing instead of full library | Most training plans use weekly recurrence (MWF practice) - simple parser avoids dependency weight, can expand later if needed |
| 10-04 | FormProvider for nested form context | ExerciseFieldArray needs parent form control - FormProvider enables clean separation without prop drilling |
| 10-04 | Duration conversion in form layer | Coaches think in minutes, API expects seconds - form handles conversion keeping UX friendly |
| 10-04 | TSS auto-calculation with useEffect | Reduces coach effort - TSS updates immediately when duration/intensity change using estimateTSSFromPlan |
| 10-04 | Exercise intensity as optional string | Exercises need flexibility for targets like "70% FTP" or "Rate 22", not just easy/moderate/hard/max enum |
| 10-05 | withDragAndDrop HOC for calendar rescheduling | react-big-calendar provides official drag-drop addon, eliminates need for custom drag implementation |
| 10-05 | Extract planId from event.resource.planId | rescheduleWorkout API requires planId, event.resource already carries workout metadata for drag operations |
| 10-05 | Prevent dragging recurring event instances | Dragging instance creates ambiguity (edit series vs. create exception), require editing parent workout for MVP |
| 10-05 | Optimistic updates via useRescheduleWorkout hook | Hook implements optimistic update pattern with automatic rollback on error, DragDropCalendar just triggers mutation |
| 10-06 | Visual radio button grid for phase selection | Color-coded phase selection (blue base, amber build, red peak, green taper) provides immediate visual feedback matching timeline colors |
| 10-06 | Duration guidelines as warnings, not blockers | Coaches may have valid reasons for non-standard block durations, yellow warning informs without preventing creation |
| 10-06 | Conflict detection shows first 5 workouts with expand/collapse | Large date ranges could have dozens of conflicts, preview prevents UI clutter while showing enough info for decision |
| 10-06 | Replace existing as opt-in checkbox | Default behavior preserves existing workouts (safer), coach explicitly chooses to replace when needed |
| 10-06 | Focus areas as multi-select toggle buttons | More engaging than checkboxes, shows selected state clearly, easier to tap on mobile than small checkboxes |
| 10-09 | Warning component returns null when no warning | Cleaner than passing showWarning prop, enables conditional rendering in parent without extra logic |
| 10-09 | Separate NCAAWarningBadge for inline display | Reusable badge for tables/forms without full warning panel, different UX context requires different component |
| 10-09 | Print via window.open with inline styles | No external dependencies, works in all browsers, styles guaranteed to render, simpler than jsPDF |
| 10-09 | Report uses off-screen render ref for printing | Maintains separation between screen UI and print layout, full control over print formatting |
| 10-09 | Activity type labels via Record<ActivityType, string> | Type-safe mapping ensures all activity types covered, prevents runtime errors from missing cases |

## Session Continuity

**Last session:** 2026-01-25
**Stopped at:** Completed 10-09-PLAN.md (NCAA Warning & Audit Components)
**Resume file:** None — continuing Phase 10

## Known Limitations

None - all v2.0 foundation issues resolved.

## Next Action

Continue Phase 10 (Training Plans & NCAA Compliance) - execute remaining plans.

**Phase 10 Progress:**
- ✓ Plan 01: Foundation Types & Utilities (TSS calculation, NCAA compliance, calendar helpers)
- ✓ Plan 02: TanStack Query hooks for training data
- ✓ Plan 03: Training Calendar UI (month/week views, custom toolbar, event rendering)
- ✓ Plan 04: Workout Form Components (WorkoutForm, ExerciseFieldArray with dynamic lists)
- ✓ Plan 05: Drag-Drop Calendar Rescheduling (withDragAndDrop HOC, optimistic updates)
- ✓ Plan 06: Periodization Management Components (PeriodizationTimeline, BlockForm, TemplateApplicator)
- ✓ Plan 07: Assignment Management Components (AssignmentManager, AthleteWorkoutView)
- ✓ Plan 08: Compliance Dashboard Components (ComplianceDashboard, WeeklyHoursTable, TrainingLoadChart, AttendanceTrainingLinkPanel)
- ✓ Plan 09: NCAA Warning & Audit Components (NCAA20HourWarning, NCAAAuditReport)
- Next: Plan 10 (Workout creation modal with recurring patterns)

**Phase 10 Remaining Scope:**
- TanStack Query hooks for training data
- Calendar component with drag-drop and plan filtering
- Training plan creation wizard with periodization
- Workout creation modal with recurring patterns
- NCAA compliance dashboard with weekly reports
- Plan assignment UI for coaches

| 10-02 | Inline types in hooks instead of shared training.ts | training.ts wasn't created yet, inline types make hooks self-contained and executable now |
| 10-02 | 5-minute staleTime for training queries | Follows useSeatRaceSessions pattern, balances data freshness with API efficiency |
| 10-02 | Optimistic updates for useRescheduleWorkout | Enables smooth drag-drop calendar rescheduling without loading states |
| 10-02 | useCalendarEvents expands recurring workouts | Converts recurrenceRule into individual calendar events for calendar view |
| 10-02 | Cross-plan workout aggregation for calendar | Fetches all plans when no planId specified, enables team-wide calendar view |
| 10-03 | Monday week start for calendar (weekStartsOn: 1) | Standard for rowing programs, matches coach expectations for weekly training cycles |
| 10-03 | Custom toolbar and event components for V2 design | React-big-calendar defaults don't match V2 design system, custom components provide full control |
| 10-03 | CSS-in-JS for calendar styling with V2 tokens | styled-jsx global styles override react-big-calendar CSS to integrate design tokens (--surface-*, --txt-*, --bdr-*) |
| 10-03 | Loading spinner overlay for async event fetching | Preserves calendar layout during loading, overlay doesn't shift content |

---
*Last updated: 2026-01-25 — Phase 10 Plan 07 Complete*
| 10-07 | Aggregated assignments fetch | Fetch all plans and aggregate assignments when no planId specified, enables cross-plan queries for coaches |
| 10-07 | Athlete load endpoint for workouts | Use /api/v1/training-plans/athlete/:athleteId/load which returns assignments, workouts, completions in single response |
| 10-07 | Select All filters out assigned athletes | Select All only selects available (non-assigned) athletes to prevent re-assignment errors |
| 10-07 | Week navigation with offset state | Week navigation uses offset (0 = current week) for simple state management and easy reset |
| 10-07 | Workout status in useMemo | Calculate isPastDue, isCompleted, isUpcoming in useMemo to prevent expensive date recalculations on every render |
| 10-07 | Default compliance score 1.0 | Mark complete defaults to 100% compliance for athlete self-reporting, coaches can adjust later |
| 10-08 | Chart data transformation in component | API returns weekStart/weekEnd/totalMinutes/totalTSS, chart needs week/tss/volume - transform in component keeps API stable |
| 10-08 | DailyHours array to map conversion | WeeklyHoursTable renders 7 days × N athletes, array.find() would be O(n) per cell, map is O(1) |
| 10-08 | Sort WeeklyHoursTable by hours descending | Coaches want to see compliance concerns first, highest hours = highest risk |
| 10-08 | Tabbed dashboard layout (Hours/Load/Attendance) | Reduces vertical scroll, focuses coach attention on one view at a time, matches Linear/GitHub patterns |
| 10-08 | Week navigation at dashboard level | All views (hours, load, attendance) sync to same week, single control prevents confusion |
| 10-08 | Summary stats calculated from entries in useMemo | Backend doesn't provide summary counts, client calculation prevents extra API call |
| 10-08 | Conditional NCAA alert banner | Show red alert banner only when athletesOver > 0, reduces noise when no violations |

---
*Last updated: 2026-01-25 — Phase 10 Plan 08 Complete*
