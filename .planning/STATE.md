# Project State: RowLab UX Redesign

## Current Status

**Milestone:** v2.1 — Feature Expansion
**Phase:** 18 (Lineup & Boat Improvements) — In Progress
**Status:** 8 of 11 plans complete
**Last activity:** 2026-01-27 — Completed 18-08-PLAN.md

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
| 12 | Settings & Polish | Complete | 17/17 |
| 13 | Cross-Feature Integrations | Complete | 12/12 |
| 14 | Advanced Seat Racing Analytics | Complete | 14/14 |

v2.0 Progress: ██████████████ (9 phases complete) ✅

### v2.1 Milestone (Active)

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 15 | Feature Toggles & Recruiting | Complete | 10/10 |
| 16 | Gamification & Engagement | Complete | 12/12 |
| 17 | Complete Design Overhaul 🎨 | Planned | TBD |
| 18 | Lineup & Boat Improvements | In Progress | 8/11 |

v2.1 Progress: ██████░░░░░░░░ (2 phases complete)

### v2.2 Milestone (Planned)

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 19 | Telemetry & Combined Scoring | Planned | TBD |
| 20 | AI Lineup Optimizer (v2) | Planned | TBD |
| 21 | Predictive Analytics | Planned | TBD |
| 22 | Coxswain Mobile View | Planned | TBD |

v2.2 Progress: ░░░░░░░░░░░░░░ (0 phases complete)

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

| 12-15 | txt-tertiary instead of txt-muted for better contrast | txt-muted (#525252) only achieves 2.6:1 contrast failing WCAG AA, txt-tertiary (#737373) achieves 4.6:1 |
| 12-15 | Tailwind 700-level colors for periodization phases | Original 500-level colors fail 4.5:1 contrast with white text, 700-level meet WCAG AA (blue-700 6.3:1, amber-700 4.8:1, red-700 5.6:1, green-700 4.6:1) |
| 12-15 | CSS overrides for react-big-calendar accessibility | Forking library not needed, scoped .v2 CSS overrides apply design tokens while maintaining library updates |
| 12-15 | Document but don't fix V1 login accessibility in tests | V1 is legacy, V2 components meet WCAG AA, test auth setup is separate concern |

### Phase 13 Decisions

| Plan | Decision | Rationale |
|------|----------|-----------|
| 13-07 | Participation thresholds: 75%=Present, 25-75%=Partial, <25%=Absent | Configurable defaults that match coaching expectations for session participation |
| 13-07 | Override tracking with user and timestamp metadata | Provides audit trail for attendance corrections, accountability for manual changes |
| 13-07 | Auto-recorded flag distinguishes system vs manual | Frontend can show which records were automatic vs coach-entered for transparency |
| 13-07 | 24-hour override lock tracked but not enforced | Utility function available for UI warning, backend doesn't block for coaching flexibility |
| 13-07 | Upsert pattern for attendance recording | Allows re-recording same athlete if participation updates during session |
| 13-09 | Radix UI HoverCard for entity previews | Provides accessible, animated hover cards with configurable delays for athlete/session previews |
| 13-09 | Auto-generate breadcrumbs from route path | Component automatically generates breadcrumb trail with label mapping, detects ID segments |
| 13-09 | SearchTriggerButton pattern for search integration | Leverages existing Zustand store instead of duplicating state, provides ⌘K shortcut display |
| 13-09 | CommandPalette rendered at ShellLayout root | Enables global keyboard shortcut support across both mobile and desktop layouts |
| 13-10 | useWatch instead of watch for FormProvider context | Provides proper TypeScript inference with reactive form field updates in nested components |
| 13-10 | Duration input in minutes, converted to seconds for API | Friendlier UX (coaches think in minutes) while maintaining backend consistency (seconds) |
| 13-10 | Collapsible segment sections for piece organization | Sessions with many pieces would create excessive scroll, collapse provides better UX scalability |
| 13-10 | Type-specific targets shown conditionally | ERG sessions show split/rate/watts, avoids cluttering form with irrelevant fields |
| 13-10 | RRULE preview uses formatRRule utility | Human-readable schedule confirmation ("Every Mon, Wed, Fri") prevents user confusion |
| 13-12 | react-grid-layout over dnd-kit for dashboard | More robust grid-based widget system with built-in resize handles vs freeform dnd-kit approach |
| 13-12 | localStorage for dashboard layout persistence | Retains user widget arrangement preferences between sessions without server state |
| 13-12 | Cross-feature widgets pull from multiple domains | Dashboard widgets aggregate data from sessions, activity feed, and attendance for unified overview |
| 13-12 | Edit mode toggle for dashboard customization | Separates view mode from edit mode, prevents accidental widget rearrangement during normal use |

### Phase 14 Decisions

| Plan | Decision | Rationale |
|------|----------|-----------|
| 14-04 | Three weight profiles for composite rankings | Performance-First (85/10/5), Balanced (75/15/10), Reliability-Focus (65/15/20) accommodate different coaching philosophies |
| 14-04 | Z-score normalization with sigmoid transformation | Enables fair comparison across different scales (ELO ~1000, attendance 0-1, erg times ~seconds), sigmoid maps to [0,1] for weighted combination |
| 14-04 | Erg test type weighting hierarchy | 2k=1.0, 6k=0.8, 500m=0.6, steady_state=0.3 prioritizes gold-standard tests over practice observations |
| 14-04 | Side-specific rating suffix pattern | seat_race_elo_port/starboard/cox preserves backward compatibility with existing seat_race_elo combined rating |
| 14-04 | 90-day erg window, 30-day attendance window | Balances recency with sufficient data points - erg captures training block, attendance shows recent reliability |
| 14-04 | Confidence threshold at 5 data points | Conservative approach: 5+ data points = 100% confidence, provides reasonable certainty for ranking decisions |
| 14-06 | Query key factory pattern for cache management | Namespaced keys (advancedRankingKeys, compositeRankingKeys) enable efficient cache invalidation across related queries |
| 14-06 | 5-minute stale time for rankings | Stable data that changes only after seat race processing, prevents excessive refetches while ensuring freshness |
| 14-06 | Split matrix planner into generate/validate hooks | Clear separation of concerns with combined useMatrixPlanner convenience hook for components needing both |
| 14-06 | Auth-aware query enabling | All hooks check isAuthenticated, isInitialized, activeTeamId before enabling queries, prevents unnecessary API calls during initialization |
| 14-05 | authenticateToken + requireTeam for all routes | Consistent with existing API patterns in ratings.js and seatRaces.js, ensures proper security and team isolation |
| 14-05 | Structured error codes for API responses | NO_TEAM, INVALID_INPUT, SERVER_ERROR etc. enable frontend to handle errors programmatically |
| 14-05 | teamId query param with activeTeamId fallback | Flexibility for admin views while defaulting to current team context |
| 14-05 | Enrich API responses with athlete details | Reduces frontend API calls by including names/side in ranking responses |
| 14-10 | Visual error bars for confidence intervals | CI bar + strength bar + whiskers makes statistical uncertainty visible without cluttering interface |
| 14-10 | Methodology toggle for Bradley-Terry | Power users want details, beginners don't need complexity upfront - toggle balances both needs |
| 14-10 | Side filter as button group | Button group faster than dropdown - all options visible simultaneously, clearer current state |

### Phase 15 Decisions

| Plan | Decision | Rationale |
|------|----------|-----------|
| 15-06 | Lexical for rich text editing | Modern, accessible, framework-agnostic, actively maintained by Meta - better architecture than Draft.js/Slate |
| 15-06 | DOMPurify for HTML sanitization | Industry-standard XSS prevention, defense-in-depth (sanitize on input AND display) |
| 15-06 | Separate toolbar component | Better separation of concerns, easier to customize, cleaner component hierarchy |
| 15-09 | Sonner for toast notifications | Battle-tested library with accessibility built-in, rich features (richColors, closeButton), clean API |
| 15-09 | Three-tier notification control | Channel master switches → feature toggles → quiet hours provides granular control from broad to specific |
| 15-09 | Quiet hours exclude in-app toasts by default | Email/push suppressed for sleep/focus, but in-app toasts still shown for urgent notifications when actively using app |
| 15-09 | shouldNotify() as central gating function | Single source of truth for notification permission, checks channel → feature → quiet hours |
| 15-09 | localStorage persistence via Zustand | Consistent with feature preference pattern, survives page refresh, syncs across tabs |
| 15-09 | 8 notification features defined | Recruit visits, seat racing, training plans, erg tests, regattas, sessions, achievements cover major notification needs |
| 15-09 | ToastProvider at V2Layout root | Single provider for entire V2 app, bottom-right positioning, V2 design tokens |
| 15-05 | Violet/purple theme for recruiting | bg-violet-500/10 background, border-violet-500 accent distinguishes recruit visits from workouts on calendar |
| 15-05 | Compact/full display modes for RecruitVisitCard | Compact mode for calendar cells, full mode for expanded view - matches WorkoutEventCard pattern |
| 15-05 | Query keys factory for recruit visits | Hierarchical query keys (all, lists, list, details, detail, upcoming, byHost) enable efficient cache invalidation |
| 15-08 | HostVisitsWidget returns null when no visits | Self-hiding widgets prevent empty dashboard clutter - only appears when athlete has upcoming hosting duties |
| 15-08 | URL param state for visit deep linking | ?visit=id enables direct links from dashboard widget to specific visits, cleaned up when panel closes |
| 15-08 | Slide-out panel pattern for details | AnimatePresence with spring animation from right, backdrop click to close, consistent with V2 UX patterns |

### Phase 16 Decisions

| Plan | Decision | Rationale |
|------|----------|-----------|
| 16-08 | Professional rarity styling (not childish) | Subtle colors (zinc/blue/purple/amber) with dark mode support creates sophisticated gamification that fits V2 aesthetic |
| 16-08 | Created Skeleton component | Missing UI primitive needed for loading states across gamification features |
| 16-08 | PinnedBadges max 5 default | Prevents profile clutter while showcasing top achievements, configurable for flexibility |
| 16-08 | Smart achievement sorting | Unlocked first, then by rarity (Legendary > Epic > Rare > Common) provides optimal UX prioritization |
| 16-10 | LeaderboardLive 5s polling with staleTime: 0 | Ensures real-time updates during active challenges per RESEARCH.md specifications |
| 16-10 | Rank change animation for 3 seconds | Provides visual feedback when positions change without cluttering the UI permanently |
| 16-10 | Template-based challenge creation | Simplifies challenge creation while allowing custom configurations for flexibility |
| 16-11 | Status-based coloring: active (green), at-risk (amber), broken (gray) for streaks | Clear visual feedback for streak health at a glance |
| 16-11 | Timeline visualization with staggered animation for season milestones | Familiar chronological pattern with polished appearance |
| 16-11 | Toggle-based opt-out UI pattern for gamification settings | Modern pattern that's self-explanatory and mobile-friendly |

### Phase 18 Decisions

| Plan | Decision | Rationale |
|------|----------|-----------|
| 18-01 | Used cuid() for new model IDs | Follows Phase 13 Session model pattern, consistent with recent schema additions |
| 18-01 | RiggingProfile stores defaults + per-seat overrides in Json | Rigging measurements vary by seat position, Json provides flexibility without per-seat tables |
| 18-01 | LineupTemplate stores assignments as Json array | Templates are boat-agnostic patterns, Json array simpler than normalized assignment table |
| 18-01 | EquipmentAssignment tracks equipment with optional sessionId | Links equipment usage to training sessions when available for automatic conflict detection |
| 18-01 | SetNull cascade on equipment deletions | Preserves historical assignment records even when equipment is removed from inventory |
| 18-06 | Two-step filtering for complex lineup searches | Prisma query handles basic filters, post-processing checks "at least N athletes" requirement that Prisma can't express efficiently |
| 18-06 | Metadata enrichment in search results | Include athleteCount, boatClasses, shellNames in results to avoid additional API calls during result browsing |
| 18-06 | Search route before :id route | Express matches routes in order, /search must be registered before /:id to avoid treating "search" as ID parameter |
| 18-04 | express-validator for template routes | Matches existing V1 route patterns instead of Zod for consistency across codebase |
| 18-04 | Inline validateRequest in route file | Following v1/lineups.js pattern where validateRequest defined per-file instead of shared middleware |
| 18-04 | Default template auto-clears other defaults | When setting template as default, automatically clears other defaults for same boat class to prevent conflicts |
| 18-04 | Apply template returns assignment + unfilled seats | Structured response lets frontend decide how to handle unfilled seats instead of throwing errors |
| 18-03 | World Rowing/Concept2 rigging standards as defaults | Provides immediate value for all shells without requiring manual entry, based on published standards |
| 18-03 | Service returns defaults when no custom profile exists | Transparent fallback - API always returns valid rigging data, custom profiles optional enhancement |
| 18-03 | Deletion reverts to defaults | Deleting custom profile doesn't remove rigging capability, just returns shell to standard values |
| 18-03 | Per-seat overrides stored as JSON | Flexibility for advanced rigging adjustments without separate table per seat |
| 18-08 | Optional chaining for rigging defaults | Rigging defaults could be undefined during loading, prevents TypeScript errors with safe access |
| 18-08 | Equipment conflict inline display | Show conflicts directly on equipment cards with amber borders for immediate visibility |
| 18-08 | Automatic oar set filtering by boat class | Filter to SWEEP/SCULL based on boat class pattern prevents incompatible selections |
| 18-10 | Animated filter panel using framer-motion | Better UX with smooth expand/collapse transition for filter options |
| 18-10 | Support up to 2 lineups for comparison selection | Limit prevents UI confusion, matches typical comparison use case of A vs B |
| 18-10 | Show 'at least N athletes' filter only when 2+ athletes selected | Contextual UI - filter appears only when relevant, reduces visual clutter |
| 18-10 | FilterPill component for removable filter tags | Clear affordance for active filters with one-click removal |
| 18-10 | Amber highlighting for comparison-selected lineups | Distinct from primary blue selection, visually separates "active" from "compare" states |
| 18-11 | Dynamic import for xlsx library | Prevents ~400kb library from bloating main bundle, loads only when export triggered |
| 18-11 | QR code offscreen rendering | QRCodeCanvas needs DOM to render before conversion to data URL, temporary container cleaned up after extraction |
| 18-11 | Relative import for types in utils | Avoids potential tsconfig path resolution issues during isolated file compilation |
| 18-11 | Multi-function PDF API | Three functions (single, multi-boat, simple) for clear use cases and backward compatibility |

## Session Continuity

**Last session:** 2026-01-27T13:24:09Z
**Stopped at:** Completed 18-08-PLAN.md
**Resume file:** None

## Known Limitations

None - all v2.0 foundation issues resolved.

## Next Action

**v2.1 Milestone: Feature Expansion** (Ready to Start)

Phase 14 (Advanced Seat Racing Analytics) is complete. The roadmap now extends through Phase 22:

**v2.1 — Feature Expansion:**
- Phase 15: Feature Toggles & Recruiting
- Phase 16: Gamification & Engagement
- Phase 17: Complete Design Overhaul 🎨
- Phase 18: Lineup & Boat Improvements

**v2.2 — Advanced Analytics:**
- Phase 19: Telemetry & Combined Scoring
- Phase 20: AI Lineup Optimizer (v2)
- Phase 21: Predictive Analytics
- Phase 22: Coxswain Mobile View

To begin v2.1, run `/gsd:plan-phase` for Phase 15.

Phase 13 delivered the cross-feature integration layer:

**Wave 1 (Foundation):**
- 13-01: Session/Piece Prisma models, dependencies
- 13-02: TypeScript types, TanStack Query hooks, RRULE utilities

**Wave 2 (APIs & Core Components):**
- 13-03: Sessions CRUD API with pieces
- 13-04: Command palette with cmdk (⌘K global search)
- 13-05: Live erg dashboard (grid/list views, polling)
- 13-08: Unified activity feed with infinite scroll

**Wave 3 (Integration Layer):**
- 13-06: Live erg data API aggregating C2 Logbook
- 13-07: Session attendance recording with override
- 13-09: HoverCard, Breadcrumbs, Header search integration
- 13-10: SessionForm, PieceEditor, RecurrenceEditor

**Wave 4 (Pages & Dashboard):**
- 13-11: SessionsPage, SessionDetailPage, LiveSessionPage
- 13-12: DashboardGrid with react-grid-layout widgets

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
| 12-10 | Feature-based skeleton organization | Skeletons in src/v2/features/{feature}/components/ for co-location with actual components |
| 12-10 | Granular skeleton exports per feature | Multiple skeletons per feature (table, card, form, chart) enable flexible loading states |
| 12-10 | CSS custom properties for theme colors | Using var(--color-bg-surface) and var(--color-bg-hover) ensures skeletons adapt to themes |

---
*Last updated: 2026-01-25 — Phase 12 Plan 10 Complete*
| 12-11 | SecondaryAction prop added to EmptyState | Enables dual CTAs (Add + Import) for empty states |
| 12-11 | Separate no-data vs no-results components | Different messaging helps users understand context and take appropriate action |
| 12-11 | Success empty state for AthleteBank | Positive feedback "All athletes assigned" when lineup is complete |

---
*Last updated: 2026-01-25 — Phase 12 Plan 11 Complete*
| 12-12 | :focus-visible over :focus for keyboard focus | Shows focus rings only for keyboard navigation, not mouse clicks |
| 12-12 | Field theme 3px focus rings | Outdoor visibility requires thicker focus indicators than standard 2px |
| 12-12 | Animation duration 0.01ms for reduced motion | Using 0.01ms instead of 0 ensures browser compatibility |
| 12-12 | Forced-colors media query support | High contrast mode support in focus-rings.css for Windows users |
| 12-13 | 768px tablet, 1024px desktop breakpoints | Matches Tailwind md: and lg: breakpoints, standard for tablet/desktop detection |
| 12-13 | 44px minimum tap targets per WCAG 2.1 | AAA requirement for touch accessibility |
| 12-13 | Context-aware MobileNav | Uses contextStore to show relevant nav items for Me/Coach/Admin contexts |
| 12-13 | Bottom tabs show first 4 items + More | Balances quick access with screen real estate |
| 12-13 | Safe area insets via env() | Required for notched phones (iPhone X+) |
| 12-13 | .v2 prefix on all CSS utilities | Scopes responsive utilities to V2 layout, prevents conflicts with legacy V1 |

### v2.0 Decisions (Phase 13)

| Plan | Decision | Rationale |
|------|----------|-----------|
| 13-01 | Session model uses cuid() for IDs | Consistent with newer patterns, cleaner than uuid |
| 13-01 | Session replaces Practice/Workout concept | Cleaner Session → Pieces hierarchy for training data |
| 13-01 | Piece segments: WARMUP, MAIN, COOLDOWN | Structured workout classification for UI organization |
| 13-01 | db push instead of migrate | Phase 6 decision - database drift from migration history |
| 13-02 | Used existing api utility pattern | Followed useSeatRaceSessions.ts pattern using api wrapper for consistent error handling |
| 13-02 | Added extra lifecycle hooks | useStartSession, useEndSession for complete session lifecycle management |
| 13-02 | rrulePresets for rowing schedules | Common presets (MWF, TuTh, weekdays, daily) for quick session setup |
| 13-02 | Live session types in session.ts | LiveSessionState, LiveParticipant, LiveErgData anticipate Phase 13-04 |
| 13-03 | Session code uses 6-char alphanumeric excluding I/O/0/1 | Prevents confusion between similar characters when coaches read/enter codes |
| 13-03 | Session code auto-generated on ACTIVE transition | Code only needed during live sessions, generated on demand |
| 13-03 | Session code cleared on COMPLETED/CANCELLED | Frees up codes for reuse, signals session is no longer joinable |
| 13-03 | Pieces cascade delete via Prisma onDelete | Ensures data integrity when sessions are deleted |
| 13-03 | Join endpoint not restricted by team | Allows cross-team session joining for special events/camps |
| 13-08 | Extended existing activities.js | Maintains API consistency with existing /api/v1/activities endpoint |
| 13-08 | Cursor-based pagination with ISO date | Natural ordering for time-series data, human-readable cursor values |
| 13-08 | Date grouping: Today/Yesterday/This Week/Earlier | Common UX pattern for activity timelines, easy to scan |
| 13-05 | 5-second default polling interval with 2.5s staleTime | Balances responsiveness with API load per RESEARCH.md recommendation |
| 13-05 | Lightning icon for active status | Phosphor doesn't export Activity icon, Lightning provides similar visual |
| 13-05 | Separated active vs pending athletes in UI | Active athletes ranked and shown in leaderboard/grid, pending shown in separate waiting section |
| 13-05 | Sort metric selector for leaderboard | Added dropdown to sort by pace/distance/watts for flexibility |

---
*Last updated: 2026-01-26 — Phase 13 Plan 05 Complete*

### v2.0 Decisions (Phase 14)

| Plan | Decision | Rationale |
|------|----------|-----------|
| 14-01 | simple-statistics for statistical functions | Pure JavaScript with no native dependencies, provides descriptive statistics for Bradley-Terry analysis |
| 14-01 | jstat for probability distributions | Required for confidence interval calculations and statistical significance testing |
| 14-02 | Custom Nelder-Mead implementation | fmin library had broken ES module exports, custom implementation provides full control with zero dependencies |
| 14-02 | Log-scale parameter optimization | Ensures positivity constraints (strengths > 0) naturally without bounds, improves numerical stability |
| 14-02 | Identifiability via normalization | Sum of log-strengths = 0 for athletes, product of gammas = 1 for shells prevents parameter redundancy |
| 14-02 | Numerical Hessian via finite differences | Provides standard errors from Fisher information without analytical derivatives, simpler for model extensions |
| 14-01 | fmin for Nelder-Mead optimization | Maximum likelihood estimation for Bradley-Terry model parameter fitting |
| 14-01 | Composite ranking weights sum to 1.0 | Zod schema enforces weight constraint (onWater + erg + attendance = 1.0) for proper normalization |
| 14-01 | Default weight profiles (85/10/5, 75/15/10, 65/15/20) | Performance-First, Balanced, Reliability profiles cover common coaching priorities |
| 14-01 | Side-specific ratings in separate Port/Starboard/Cox fields | Enables dual-side athlete tracking without conflating different side performances |
| 14-01 | Practice observation weight 0.5 vs 1.0 formal | Reduces noise from informal practice while still incorporating passive data into ratings |
| 14-03 | Latin Square rotation for assignment pattern | Formula `(boatIdx * boatSize + seatIdx + pieceNum) % n` ensures systematic rotation through athlete pool for even distribution |
| 14-03 | Comparison tracking via sorted athlete ID pairs | Key format "a-b" enables efficient duplicate detection and count tracking for variance calculation |
| 14-03 | Balance score formula: 1 / (1 + variance) | Normalizes variance to 0-1 range for consistent scoring, lower variance = higher balance |
| 14-03 | Named export for BOAT_SIZES constant | Enables direct import in test files while maintaining backward compatibility with default export |
| 14-13 | Passive observation weight 0.5x default | Practice data less controlled than formal seat races - reduces impact while enabling continuous ranking improvement |
| 14-13 | Minimum split threshold 0.5 seconds | Sub-second differences likely measurement noise or conditions, ignoring improves signal-to-noise ratio |
| 14-13 | Clean 1:1 swaps only for observations | Multiple simultaneous swaps create ambiguous attribution - can't determine individual athlete impact |
| 14-13 | Deferred ELO application pattern | Separating observation recording from rating updates enables batch processing, dry-run testing, and audit trail |
| 14-09 | Proportional weight redistribution | When adjusting one slider, remaining weight distributed proportionally to other factors maintaining intuitive behavior |
| 14-09 | Two-tier breakdown visualization | Compact stacked bar for scanning, expanded view with progress bars for deep inspection |
| 14-09 | Abbreviated confidence indicators | Single letter (H/M/L) in table for space efficiency, full labels in expanded view for clarity |
| 14-07 | vis-network over Cytoscape.js | Simpler API, sufficient for < 50 node graphs, built-in physics simulation adequate for team roster sizes |
| 14-07 | Diverging color scale for probability matrix | Blue-orange scale (blue=unlikely to win, orange=likely to win, white=50/50) more intuitive than single gradient |
| 14-07 | Matrix size limit of 15 athletes | Larger matrices unreadable on typical screens, balances information density with UX |
| 14-11 | Tabbed interface for rankings | Chose tabs over separate pages to provide unified view where coaches can quickly switch between ranking methods |
| 14-11 | Educational content in MatrixPlanner | Added "How it works" section and benefit cards to explain statistical approach, helping coaches understand Latin Square designs |
| 14-11 | Header navigation pattern | Placed new feature links alongside "New Session" button for discoverability while maintaining primary action prominence |

---
*Last updated: 2026-01-26 — Phase 14 Plan 11 Complete*

### v2.0 Decisions (Phase 15)

| Plan | Decision | Rationale |
|------|----------|-----------|
| 15-01 | Core features (6) always enabled, advanced features (7) toggleable | Keeps UI clean for basic teams while providing power features when needed |
| 15-01 | Zustand persist middleware with localStorage | Team-level feature preferences persist across sessions without server state |
| 15-01 | Store actions no-op for core features | Safety mechanism prevents accidental disabling of essential features |
| 15-01 | Multiple hook abstractions (full/simple/group) | useFeaturePreference (full), useFeature (boolean), useFeatureGroup (bulk) cover different use cases |
| 15-02 | Permission-based feature editing (OWNER/ADMIN only) | Feature toggles affect entire team, so only team owners and admins should control them |
| 15-02 | "Always on" badge for core features instead of disabled toggle | Core features cannot be toggled off, showing badge is clearer than disabled toggle |
| 15-02 | Info banners for feature groups | Helps users understand why core features are always enabled and how to use advanced features |
| 15-02 | Animated toggle switch matching V2 patterns | Consistent with PreferencesSection toggle implementation, maintains design system cohesion |
| 15-03 | FeatureGuard with default and Hidden variants | Default shows discovery hint when disabled (page content), Hidden returns null (navigation items) |
| 15-03 | Route-to-feature mapping for navigation filtering | Declarative NAV_ITEM_FEATURES mapping (null for core, FeatureId for advanced) cleaner than inline conditionals |
| 15-03 | Discovery hint links to settings?tab=features | Direct link to feature enablement provides clear call-to-action for users |
| 15-03 | Zustand store selector for reactive navigation | useFeaturePreferenceStore(state => state.isFeatureEnabled) enables automatic navigation updates on toggle |
| 15-04 | Share tokens use URL-safe base64 encoding | crypto.randomBytes(24) with base64url prevents URL encoding issues in share links |
| 15-04 | Public shared endpoint returns limited fields | Protects privacy by excluding internal notes and team details from public view |
| 15-04 | Host athlete SetNull cascade | Preserves recruit visits when host athlete deleted, prevents data loss |
| 15-04 | Status as string enum (not Prisma enum) | Follows Phase 6 attendance pattern, flexible for future status additions without migration |

### v2.1 Decisions (Phase 16)

| Plan | Decision | Rationale |
|------|----------|-----------|
| 16-01 | Explicit AthleteAchievement join table | Required to store progress metadata (progress count, unlockedAt timestamp, isPinned) not possible with implicit m-n |
| 16-01 | Per-athlete gamificationEnabled field | Athletes can disable gamification individually even if team has it enabled per CONTEXT.md |
| 16-01 | html-to-image over html2canvas | 3x faster per RESEARCH.md for shareable achievement card generation |
| 16-01 | Challenge type as string (individual/collective) | Supports both competitive individual leaderboards and collaborative team goals |
| 16-01 | PersonalRecord scope + scopeContext pattern | Enables all-time, season, training-block PRs with clear context filtering |
| 16-04 | Automatic PR detection on test creation | Integrate processNewErgTest() in ergTestService to detect and record PRs immediately when tests are created |
| 16-04 | Fall/Spring season boundaries | Use Aug-Dec for Fall, Jan-May for Spring, aligned with NCAA rowing seasons |
| 16-04 | Team rank via athlete grouping | Use Prisma groupBy with _min aggregation to count athletes with better all-time bests, avoiding N+1 queries |
| 16-05 | Auto-enroll with gamificationEnabled flag | Only enroll athletes with gamificationEnabled:true for challenges, giving opt-in control |
| 16-05 | Multi-metric challenge scoring | Support meters, workouts, attendance, and weighted composite metrics with optional handicapping |
| 16-05 | Zod validation for challenges | Use Zod schemas instead of express-validator for consistency with project-wide validation patterns |
| 16-05 | Rank calculation on update | Calculate and store ranks in database during leaderboard updates for fast retrieval |
| 16-06 | Real-time leaderboard polling with 5s interval | Use refetchInterval: 5000 and staleTime: 0 per RESEARCH.md for real-time updates without WebSocket complexity |
| 16-06 | Two-level gamification preference check | Hooks check both team-level feature toggle and athlete-level opt-out before enabling queries |
| 16-06 | Query key factories for structured caching | achievementKeys, prKeys, challengeKeys patterns enable proper cache invalidation and management |
| 16-06 | Conditional polling based on challenge status | Leaderboard polling stops when challenge inactive to conserve API resources |
| 16-06 | Variable staleTime per data mutability | Immutable data (PR detection, templates) uses Infinity, real-time (leaderboards) uses 0, dynamic uses 2min |
| 16-09 | Inline PR celebration over popup modal | Non-disruptive UX with gold border/amber styling - visible but not blocking per CONTEXT.md |
| 16-09 | html-to-image for PNG generation | 3x faster than html2canvas (already installed in 16-01), uses forwardRef pattern for DOM capture |
| 16-09 | Fixed 480x320px card dimensions | Consistent PNG output for social sharing with 16:9-ish aspect ratio |

---
*Last updated: 2026-01-26 — Phase 16 Plan 10 Complete*

### v2.1 Decisions (Phase 18)

| Plan | Decision | Rationale |
|------|----------|-----------|
| 18-07 | Query key factories for all hooks | Hierarchical structure (riggingKeys.all, riggingKeys.profile(id)) enables targeted cache invalidation and type safety |
| 18-07 | Variable staleTime per data mutability | Equipment 30s (frequently changing), rigging 5min (stable), defaults Infinity (never change) balances freshness with cache efficiency |
| 18-07 | keepPreviousData for lineup search | Maintains previous results visible during filter changes, prevents loading flash for smoother UX |
| 18-07 | Multi-key invalidation for equipment mutations | Equipment assignment mutations invalidate availability, assignments, and lineup-specific queries to maintain cache consistency |
| 18-07 | URL param helpers for lineup search | Bidirectional conversion functions enable deep linking, bookmarking, and URL-based search sharing |
| 18-07 | Relative imports over path aliases | Follow useAthletes.ts pattern with `../../store/authStore` for consistency across v2 hooks |

---
*Last updated: 2026-01-27 — Phase 18 Plan 07 Complete*
