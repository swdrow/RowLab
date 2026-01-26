# Phase 13: Cross-Feature Integrations - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Tie existing features together to create seamless workflows across calendar, live erg monitoring, performance tracking, and attendance. This includes restructuring the data model (Practice → Session with Pieces), calendar-to-live-erg session launching, automatic attendance from session participation, and cross-feature navigation with global search. Does NOT include new standalone features or the advanced Bradley-Terry seat racing analytics (Phase 14).

</domain>

<decisions>
## Implementation Decisions

### Data Model Restructure

- **Top-level calendar entity:** Session (replaces "Practice" and "Workout")
- **Session types:** Erg, Row, Lift, Run, Cross-train, Recovery/Stretch
- **Piece structure:** Grouped by segments (Warmup / Main / Cooldown by default), with option for coach-defined custom blocks
- **Migration strategy:** Fresh start — V2 training features start clean, V1 data stays in legacy view
- **Piece metadata:** Type-specific extensions (erg: rate, split target; row: boat class; lift: sets/reps)
- **Recurrence:** Full RRULE support (every MWF, bi-weekly, until date, exceptions)
- **Athlete visibility:** Full visibility — athletes see exact pieces planned before session
- **Session creation:** Both equally prominent — "Start from template" or "Build from scratch"
- **Template sharing:** Public library — coaches can publish templates to shared library
- **Erg piece targets:** Flexible — coach specifies any combination of split, rate, watts, HR zone, RPE
- **Notes:** Both session-level and per-piece notes supported

### Live Erg Session Flow

- **Launch options:** Both — coach can start whole session or jump to specific piece
- **Athlete joining:** C2 Logbook sync (primary), with session code fallback and push notifications
- **Coach view:** Both views with toggle — ranked leaderboard and grid of athlete cards
- **Polling frequency:** Claude's discretion based on C2 API limits and UX needs
- **Session end:** Auto-save with edit option — saves immediately, coach can edit afterward
- **Target display:** Optional toggle — coach can show/hide target vs actual comparison
- **Metrics displayed:** Full dashboard — split, watts, rate, distance, time, HR (if available), stroke count
- **Pending athletes:** Separate "Waiting" section — athletes without data shown below active athletes
- **Athlete visibility:** Coach controls — coach can toggle whether athletes see each other's live data

### Automatic Attendance

- **Trigger:** After minimum participation — athlete must meet threshold to count
- **Threshold:** Coach-configurable — coach sets minimum % or piece count per session type
- **Attendance statuses:** Present, Late, Partial, Absent, Injured, Class
- **Override:** Coach can edit auto-recorded attendance, locked after 24 hours

### Cross-Feature Navigation

- **Global search scope:** Everything — athletes, sessions, erg tests, lineups, regattas, races, seat racing sessions
- **Search access:** Both Cmd/Ctrl+K keyboard shortcut and visible icon in header
- **Search results:** Sections — show recent items section, and filtered matches section below
- **Activity timeline:** Feed-style with cards — activity cards like social feed, most recent first

### Feature Integrations

- **Lineup ↔ Training:** Bidirectional — create session from lineup, or assign lineup to existing session
- **Erg → Athlete Profile:** Both tracked — show "latest" and "best" erg scores with auto-update for latest
- **Racing → Rankings:** Separate from seat racing — race results tracked but don't affect seat race ELO
- **Dashboard:** Both — feature widgets + cross-feature insight panel
- **Notifications:** Unified notification center — all notifications in one place, categorized by feature
- **Quick links:** Both — hover cards for preview + breadcrumbs for deep navigation
- **Coach suggestions:** Manual-only — no automated suggestions, coach initiates all actions
- **Athlete view:** Dashboard widgets — athlete dashboard has widgets pulling from all features
- **Ranking → Lineup:** Both — ranking badges next to athletes in bank + sorting by ELO option
- **Training load → Lineup:** Toggle option — coach can show/hide training load overlay
- **Attendance → NCAA:** Coach confirms link — attendance suggests hours, coach confirms before NCAA log
- **Lineup → Racing:** Both — suggestions from lineups + one-click copy
- **Erg → Racing:** Historical correlation — show actual correlation between athlete's erg and race performance
- **Periodization → Sessions:** Both — template suggestions by phase + validation warnings
- **Biometrics → Lineup:** No integration — keep lineup focused on speed/ranking
- **Fleet → Sessions/Lineups:** Both — lineups can specify shell, sessions can log equipment used
- **Warmup → Sessions:** Suggest but don't auto-create — show suggested warmup session with one-click create

### Claude's Discretion

- C2 Logbook polling frequency (balance API limits with UX)
- Segment structure defaults beyond Warmup/Main/Cooldown
- Search result ranking algorithm
- Notification grouping and batching logic
- Historical correlation formula for erg→race prediction

</decisions>

<specifics>
## Specific Ideas

- "I want live erg to work via C2 Logbook sync first, then explore direct PM5 connection later"
- Search should feel like Raycast/Linear command palette (Cmd+K)
- Activity timeline should feel like a social feed
- Hover cards for quick preview without leaving current page

</specifics>

<deferred>
## Deferred Ideas

### Direct Erg Connection (Deep Research)
- **Web Bluetooth API** — Research if webapp can connect directly to PM5 for real-time data without going through C2 Logbook
- **USB-C data streaming** — Newer ergs have USB-C ports; research if data cable could live stream to phone/webapp
- May require native iOS/Android app if Web Bluetooth insufficient

### Phase 14 (Advanced Seat Racing)
- Bradley-Terry statistical model
- Matrix seat racing session planner
- Boat speed bias correction
- Passive ELO from practice data
- Composite ranking with erg and attendance factors

### Other Deferred
- AI-powered coach suggestions ("move X to 1V based on performance")
- Biometrics/weight balance in lineup builder

</deferred>

---

*Phase: 13-cross-feature-integrations*
*Context gathered: 2026-01-26*
