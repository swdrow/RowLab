# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v2.0 — Core Migration
**Phase:** 12 (Settings & Polish) — In Progress
**Status:** Plans 01-06b, 08-09 complete
**Last activity:** 2026-01-25 — Completed 12-08-PLAN.md (Design System Audit)

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
| 8 | Lineup Builder | Complete | 10/10 |
| 9 | Seat Racing | Complete | 9/9 |
| 10 | Training Plans & NCAA | Complete | 11/11 |
| 11 | Racing & Regattas | Complete | 10/10 |
| 12 | Settings & Polish | In Progress | 8/16 |
| 13 | Cross-Feature Integrations | Pending | —/— |
| 14 | Advanced Seat Racing Analytics | Pending | —/— |

v2.0 Progress: ███████████░ 100% (54/54 planned phases 6-11)

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
**Stopped at:** Completed 12-08-PLAN.md (Design System Audit)
**Resume file:** None

## Known Limitations

None - all v2.0 foundation issues resolved.

## Next Action

Phase 12 in progress. Continue with remaining plans.

**Phase 12 Progress (8/16 plans):**
- ✓ Plan 01: Common UI Foundation (deps, animations, loading/empty/error/toast)
- ✓ Plan 02: Settings Types and Hooks
- ✓ Plan 05: Team & Billing Sections (visibility toggles, Stripe portal)
- ✓ Plan 06b: Athlete Photo API Backend (avatar field, PATCH endpoint validation)
- ✓ Plan 08: Design System Audit (token documentation, WCAG verification)
- ✓ Plan 09: Interactive Elements Polish (Button, Toggle, Modal, Card with animations)

**Remaining Phase 12 Plans:**
- Plan 03: Settings Page Shell
- Plan 04: Profile & Preferences sections
- Plan 06: Athlete Photo Upload with Face Detection (frontend)
- Plan 07, 10-16: Additional polish and integrations

**User Feedback for Phase 13:**
- Restructure: Practice → Workouts (instead of Workout → Exercises)
- Integration: Calendar → Live Erg session launch
- Cross-feature linking and navigation

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
| 12-01 | SPRING_CONFIG with stiffness 300, damping 28 centralized | Matches 08-03 decision, ensures consistent animation feel across all V2 components |
| 12-01 | react-loading-skeleton for skeleton loaders | Auto-sizing, built-in shimmer, theme support - avoids reinventing wheel |
| 12-01 | Toast context with useToast hook pattern | Global notification system accessible from any component without prop drilling |
| 12-01 | usePrefersReducedMotion hook for WCAG | POLISH-11 requires reduced motion support for users with vestibular disorders |
| 12-02 | Hooks in src/v2/hooks/ not feature dir | Follow existing codebase pattern where all V2 hooks are in shared hooks directory |
| 12-02 | 5-minute staleTime for settings queries | Consistent with Phase 7 C2 status pattern |
| 12-02 | useAuthStore instead of accessToken param | Existing hooks use store directly which is cleaner than passing token |
| 12-05 | V1 subscriptionStore for Stripe integration | Preserves backward compatibility with existing billing page, avoids duplicating store logic |
| 12-05 | Animated Toggle with SPRING_CONFIG | Consistent micro-interactions using centralized animation config from 12-01 |
| 12-05 | Section component pattern with accent colors | Reusable section container with violet/green/orange themes for visual hierarchy |
| 12-05 | Access restriction pattern for billing | AccessRestricted component shows clear message for non-owner billing access attempts |
| 12-06b | @db.Text for avatar storage | Base64 images can be several hundred KB, requires Text type not String |
| 12-06b | 500KB size limit for avatar | Balances image quality with storage/bandwidth, ~375KB actual image after base64 encoding |
| 12-06b | Extend PATCH endpoint for avatar | Cleaner API design vs dedicated /photo endpoint, consistent with other athlete field updates |

---
*Last updated: 2026-01-25 — Phase 12 Plan 06b Complete*
| 12-04 | IntegrationCard accentColor prop | Each integration has custom connected-state color (blue C2, orange Strava) |
| 12-04 | OAuth popup dimensions 600x700 | Standard size, centered on screen, matches V1 pattern |
| 12-04 | postMessage for OAuth callback | Listens for c2_oauth_success/strava_oauth_success events from popup |
| 12-04 | Internal Toggle in C2StravaSync | Self-contained component follows V2 design tokens |
| 12-04 | FitImportSection uses fitImportService.js | Reuses V1 service utilities (formatDuration, formatDistance, formatWorkoutType) |

---
*Last updated: 2026-01-25 — Phase 12 Plan 04 Complete*
| 12-06 | Components in src/v2/components/settings/ | Follows existing codebase pattern, not src/v2/features/ |
| 12-06 | Singleton pattern for model loading | Prevents duplicate face-api.js model loads |
| 12-06 | 30% padding on face bounding box | Standard headshot framing includes head plus shoulders |
| 12-06 | Max 400px cropped output | Balances quality with storage for profile photos |

| 12-08 | Focus ring tokens as CSS variables | Enables theme-aware focus states (Field theme uses amber-700) |
| 12-08 | Transition tokens as CSS variables | Allows JS access to timing values for Framer Motion coordination |
| 12-08 | Complete Field theme component tokens | Ensures all three themes have identical token coverage |
| 12-08 | ring-focus-ring Tailwind mapping | Enables focus:ring-focus-ring utility class usage |

---
*Last updated: 2026-01-25 — Phase 12 Plan 08 Complete*
| 12-09 | SPRING_FAST for button micro-interactions | Snappier response (stiffness 400 vs 300) for hover/tap |
| 12-09 | SPRING_CONFIG for toggle thumb movement | Natural physics for sliding motion |
| 12-09 | Headless UI Dialog for Modal | Built-in focus trapping, aria handling, escape key support |
| 12-09 | AnimatePresence for enter/exit animations | Required for exit animations in React |
| 12-09 | Glow effect on enabled toggle | Visual feedback beyond color change (box-shadow) |
| 12-09 | cn() utility per UI component file | Self-contained, no external dependency needed |
| 12-09 | UI components in src/v2/components/ui/ | Separate directory for primitive components |

---
*Last updated: 2026-01-25 — Phase 12 Plan 09 Complete*
