# RowLab UX Redesign: Multi-Persona Architecture

**Date:** January 23, 2026
**Status:** Design Complete - Ready for Implementation Planning
**Authors:** Brainstorming session with Council review

---

## Executive Summary

This document outlines a comprehensive UX redesign for RowLab, transforming it from a coach-centric team management tool into a multi-persona ecosystem that serves:

1. **Personal users** - Individual rowers tracking their own training data
2. **Athletes on teams** - Viewing lineups, receiving workouts from coaches
3. **Coaches** - Managing teams, creating lineups, analyzing performance
4. **Organizations** - Multiple coaches sharing management of a program
5. **Hybrid roles** - A coach who is also an athlete on the same or different teams

**Core Problem Solved:** The current design bleeds everything together - users are always "a coach" regardless of context, with menus that don't apply to their current task.

---

## Table of Contents

1. [Core Architecture: Workspace/Context Model](#section-1-core-architecture)
2. [Visual Design Philosophy](#section-2-visual-design-philosophy)
3. [Navigation & Layout Structure](#section-3-navigation--layout-structure)
4. [Personal Dashboard ("Me" Context)](#section-4-personal-dashboard)
5. [On-Water Session View](#section-5-on-water-session-view)
6. [Team Context - Athlete View](#section-6-team-context---athlete-view)
7. [Team Context - Coach View](#section-7-team-context---coach-view)
8. [Future Integrations & Roadmap](#section-8-future-integrations--roadmap)
9. [Design System - Theme Modes](#section-9-design-system---theme-modes)
10. [Fleet Management](#section-10-fleet-management)
11. [Athlete Profile & Biometrics](#section-11-athlete-profile--biometrics)
12. [Availability & Attendance](#section-12-availability--attendance)
13. [Daily Whiteboard](#section-13-daily-whiteboard)
14. [Data Integration Architecture](#section-14-data-integration-architecture)
15. [Dashboard Customization](#section-15-dashboard-customization)

---

## Section 1: Core Architecture

### The Workspace/Context Model

Instead of one interface with features hidden/shown by permissions, RowLab uses **distinct contexts** that completely change the information architecture.

```
┌─────────────────────────────────────────────────────────┐
│  Context Switcher (Left Rail)                           │
│  ┌──────┐                                               │
│  │  👤  │ ← "Me" (Personal Dashboard)                   │
│  │ 🚣   │ ← Team A (One icon per team)                  │
│  │ 🚣   │ ← Team B                                      │
│  │ ⚙️   │ ← Settings                                    │
│  └──────┘                                               │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

| Principle | Implementation |
|-----------|----------------|
| **One icon per team** | Even if user is both athlete AND coach on same team |
| **Role switching inside context** | Sidebar sections handle Coach vs Athlete views |
| **Clear URL structure** | `/app/me/...` and `/app/teams/[id]/...` |
| **Notification badges** | Context icons show unread items (Discord-style) |

### Why This Model?

- Users think in terms of **Entities** (The Club), not **Permissions** (My Role)
- Reduces cognitive dissonance from seeing duplicate team icons
- Industry standard: Slack, Linear, Discord, Vercel all use this pattern

---

## Section 2: Visual Design Philosophy

### Premium Athletic Minimalism

Balance between Linear's clean professionalism and the athletic energy of apps like Bevel and Sonar Health.

### Color Philosophy: "Warm Minimalism"

- **Structural UI:** Neutral foundation (clean, professional)
- **Data & Metrics:** Warm accent colors that communicate meaning
- **The Rule:** Color = meaning

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `#FAFAFA` | `#0D0D0F` |
| Cards | `#FFFFFF` | `#1A1A1D` |
| Primary text | `#111111` | `#F5F5F5` |
| **Accent: Activity/Strain** | `#FF6B35` | `#FF7A4D` |
| **Accent: Recovery/Rest** | `#4A90D9` | `#5BA3EC` |
| **Accent: Success** | `#10B981` | `#34D399` |

### Where Style Lives

- Score rings and progress indicators - vibrant, purposeful
- Charts and data visualizations - colorful, meaningful
- Status badges - semantic color
- **NOT:** backgrounds, navigation, structural elements

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page Title | Inter | 28px | 600 |
| Section Header | Inter | 20px | 600 |
| Card Title | Inter | 16px | 600 |
| Body | Inter | 14px | 400 |
| Label | Inter | 12px | 500 |
| Metric (large) | Inter | 32px | 700 |

### Spacing Scale

```
4px   - Tight (icon gaps)
8px   - Compact (related items)
12px  - Default (element padding)
16px  - Comfortable (section gaps)
24px  - Spacious (card padding)
32px  - Loose (section separation)
48px  - Extra (page sections)
```

### Glow Effects

**Reserved ONLY for primary score indicators** (e.g., weekly volume goal ring). Everything else uses solid colors with good contrast. Overusing glow creates a "vibe coded" look.

---

## Section 3: Navigation & Layout Structure

### The Shell

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌────┐ ┌─────────────┐ ┌────────────────────────────────────────┐
│ │    │ │             │ │                                        │
│ │ 👤 │ │  Context    │ │                                        │
│ │    │ │  Sidebar    │ │         MAIN CONTENT AREA              │
│ ├────┤ │             │ │                                        │
│ │    │ │ (collapsible│ │    (maximizes for data-dense views)    │
│ │ 🚣 │ │  for wide   │ │                                        │
│ │ ●  │ │  content)   │ │                                        │
│ ├────┤ │             │ │                                        │
│ │    │ │             │ │                                        │
│ │ ⚙️ │ │             │ │                                        │
│ └────┘ └─────────────┘ └────────────────────────────────────────┘
│  Rail     Sidebar                    Content
└─────────────────────────────────────────────────────────────────┘
```

### Left Rail (Context Switcher)

| Attribute | Specification |
|-----------|---------------|
| Width | 48-56px, icons only |
| Visibility | Always visible (desktop) |
| Top section | "Me" + All teams (ONE icon per team) |
| Bottom section | Settings, Help |
| Active indicator | Accent bar on left edge **+ shape morph** |
| Notifications | Small dot on contexts with unread items |
| Accessibility | `aria-label` on all icons, tooltips on hover |

### Context-Specific Sidebars

**"Me" Context:**
```
Dashboard
Training Log
Calendar (aggregated, read-only)
Progress & Goals
Connected Apps
```

**Team Context (Dual-Role: Athlete + Coach):**
```
── PARTICIPATE ──
My Dashboard
My Assignments

── MANAGE ──
Athletes
Lineup Builder
Training Plans
Seat Racing

── ADMIN ──
Team Settings
```

### URL Structure

```
/app/me/dashboard
/app/me/training-log
/app/me/calendar

/app/teams/[team-id]/dashboard
/app/teams/[team-id]/lineups
/app/teams/[team-id]/roster
/app/teams/[team-id]/schedule
/app/teams/[team-id]/coaching/seat-racing
/app/teams/[team-id]/settings
```

### Mobile Adaptation

| Desktop Element | Mobile Equivalent |
|-----------------|-------------------|
| Left Rail | Hamburger menu → Full-screen drawer |
| Secondary Sidebar | Bottom navigation (4 items max) |
| Overflow items | "More" tab → Full menu |

### Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| `Cmd+1/2/3...` | Switch contexts |
| `Cmd+K` | Command palette (context-aware) |
| `Cmd+\` | Toggle sidebar collapse |

---

## Section 4: Personal Dashboard

### Design Philosophy

**Adaptive, not prescriptive.** The dashboard intelligently surfaces what matters based on user behavior - no arbitrary fitness scores.

### The Consistency Metric

Instead of judging performance, track the **habit**:

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 12 Day Streak                                               │
│  ████████████████████░░░░  92% of 3-week avg                    │
└─────────────────────────────────────────────────────────────────┘
```

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Good morning, [Name]                      Wed, Jan 22          │
│  🔥 12 Day Streak • 92% consistency                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  THE HEADLINE (Adaptive)                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   "45,230m this week"                                   │   │
│  │    On track for 50K goal • 4,770m to go                 │   │
│  │    ▁▃▅▇█▅▃  Mon Tue Wed Thu Fri Sat Sun                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TODAY'S WORKOUT              LOAD THIS WEEK                    │
│  ┌─────────────────────┐     ┌─────────────────────────────┐   │
│  │  6x500m @ 1:48      │     │  ████████████░░  RowErg     │   │
│  │  Team Practice      │     │  ████░░░░░░░░░░  BikeErg    │   │
│  │  [Start] [Details]  │     │  ██████░░░░░░░░  On-Water   │   │
│  └─────────────────────┘     │  █░░░░░░░░░░░░░  Other      │   │
│                              └─────────────────────────────┘   │
│                                                                 │
│  RECENT ACTIVITY                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Today      Morning Practice (8+)      12.4km  [View]   │   │
│  │  Yesterday  6x500m @ 1:48.2           3.0km   🏆 SB     │   │
│  │  Mon        10K Steady State          10.0km  42:15     │   │
│  │  Sun        5K Run (Strava)           5.0km   24:32     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  UPCOMING                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Thu 6:00 AM    Erg Test - 6K           (Team A)        │   │
│  │  Sat 8:00 AM    Head of the Charles     (Race Day)      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Adaptive Headline Logic

| User Behavior (Last 10 Activities) | Headline Shows |
|------------------------------------|----------------|
| >70% steady state / volume work | Weekly Volume with goal progress |
| >30% intervals / tests | Recent Performance with split trends |
| Mixed sources (Strava runs, weights) | Total Active Time across all activities |
| On-water sessions detected | On-Water Stats with stroke rate trends |
| User set explicit goal | That goal's progress |

### Heuristics (No AI Required)

```javascript
const recentActivities = getLast10Activities(user);

if (percentSteadyState(recentActivities) > 0.7) {
  showModule('WeeklyVolume');
} else if (percentIntervals(recentActivities) > 0.3) {
  showModule('SplitTrends');
} else if (hasMultipleSources(recentActivities)) {
  showModule('TotalActiveTime');
} else {
  showModule('WeeklyVolume'); // Default
}
```

---

## Section 5: On-Water Session View

When a user clicks on an on-water activity, they see a rich detail view combining Strava data with RowLab team context.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                            │
│                                                                 │
│  Morning Practice                                     Jan 22    │
│  Riverside Boat Club • Men's Varsity 8+                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    [INTERACTIVE MAP]                    │   │
│  │         GPS track color-coded by speed:                 │   │
│  │         🔵 Warm-up  🟡 Steady  🟠 Build  🔴 Race pace   │   │
│  │         📍 Split markers at intervals                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SUMMARY                                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │   12.4km   │ │   58:32    │ │  28 SPM    │ │  142 bpm   │   │
│  │  Distance  │ │  Duration  │ │  Avg Rate  │ │  Avg HR    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                 │
│  LINEUP                                              [Edit]     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │    ┌─────┐                                              │   │
│  │    │ Cox │  Lee                                         │   │
│  │    └─────┘                                              │   │
│  │    ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐   │   │
│  │    │  8  │  7  │  6  │  5  │  4  │  3  │  2  │ Bow │   │   │
│  │    │ And │ Tay │ Mil │ Dav │ Bro │ Wil │ Jon │ Smi │   │   │
│  │    └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PIECES                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  #   Type        Time     Rate   Speed    Performance   │   │
│  │  1   2000m RP    6:42.3   32     5.0m/s   ████████░░   │   │
│  │  2   2000m RP    6:38.1   33     5.1m/s   █████████░   │   │
│  │  3   2000m RP    6:45.8   31     4.9m/s   ███████░░░   │   │
│  │  [+ Add Piece Manually]                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  COACH NOTES                                           [Edit]   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Good rhythm in piece 2. Watch timing at the catch.     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Sources

| Element | Source | Editable |
|---------|--------|----------|
| Map + GPS track | Strava API | No |
| Speed coloring | Calculated from streams | No |
| Distance, Duration | Strava activity | No |
| Stroke Rate | Strava cadence stream | No |
| **Lineup** | RowLab | Yes |
| **Pieces** | Calculated OR manual | Yes |
| **Coach Notes** | RowLab | Yes |

### Key Differentiator

**Strava gives:** Raw data (GPS, speed, stroke rate)
**RowLab adds:** Rowing context (lineup, pieces, coach feedback, team history)

---

## Section 6: Team Context - Athlete View

When you're on a team as an **athlete** (not a coach).

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Riverside Boat Club                           Men's Varsity    │
│  You're in: Men's 8+ (Stroke Seat)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UPCOMING                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TODAY  6:00 AM   Morning Practice                      │   │
│  │  THU    6:00 AM   Erg Test - 6K                        │   │
│  │  SAT    8:00 AM   Head of the Charles  (RACE DAY)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  MY CURRENT LINEUP                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Men's Varsity 8+                                       │   │
│  │  │ Cox │ 8 │ 7 │ 6 │ 5 │ 4 │ 3 │ 2 │ Bow │            │   │
│  │  │ Lee │YOU│Tay│Mil│Dav│Bro│Wil│Jon│ Smi │            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ANNOUNCEMENTS                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📌 Jan 21 - Race Day Logistics                         │   │
│  │  Jan 19 - Practice Schedule Change                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  MY ASSIGNED WORKOUTS                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ☑ Mon - 10K Steady State @ 2:05-2:08                  │   │
│  │  ☑ Tue - 6x500m @ 1:46-1:48                            │   │
│  │  ☐ Thu - 6K Test (RACE EFFORT)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What Athletes CAN'T Do

- ❌ Edit lineups
- ❌ Manage roster
- ❌ Create training plans
- ❌ Access coach-only analytics

---

## Section 7: Team Context - Coach View

When you're on a team as a **coach**.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Riverside Boat Club                           Men's Varsity    │
│  Head Coach                                    23 Athletes      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  QUICK ACTIONS                                                  │
│  [+ Create Lineup] [Edit Schedule] [Post Note] [Start Practice] │
│                                                                 │
│  TODAY'S PRACTICE                               Jan 22, 6:00 AM │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Morning Practice • Charles River                       │   │
│  │  Attendance:  19/23 confirmed  ⚠️ 4 pending            │   │
│  │  Lineup Ready: ✓ 8+    ✓ 4+    ○ 2x (need 1)          │   │
│  │  [View Attendance] [Edit Lineups]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TEAM SNAPSHOT                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │  WEEKLY COMPLIANCE  │  │  RECENT ERG RESULTS             │  │
│  │  ████████████░░░░   │  │  6K Test (Jan 20)              │  │
│  │  78% completed      │  │  1. Anderson  19:42  🏆 PB     │  │
│  │  ⚠️ 5 athletes      │  │  2. Taylor    19:58            │  │
│  │  behind this week   │  │  3. Miller    20:05            │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
│                                                                 │
│  ALERTS                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ⚠️ Wilson - Missed 3 practices this week               │   │
│  │  ⚠️ Brown - Erg compliance below 50%                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Coach Sidebar Navigation

```
── Team Overview ──
Dashboard
Athletes
Schedule

── Coaching ──
Lineups
Training Plans
Seat Racing
Analytics

── Admin ──
Fleet
Team Settings
```

---

## Section 8: Future Integrations & Roadmap

### RowCast - AI Weather Forecasting (Future)

**Status:** Separate repository, incomplete
**Current State:** Only works for Boathouse Row (Philadelphia)
**Needs:** Significant development work

**Vision:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ROWCAST FORECAST                              Boathouse Row    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Tomorrow 6:00 AM                                       │   │
│  │  🟢 EXCELLENT CONDITIONS                                │   │
│  │                                                         │   │
│  │  Wind: 3 mph NW (tailwind on return)                   │   │
│  │  Water: Flat to light chop                              │   │
│  │  Temp: 45°F                                             │   │
│  │                                                         │   │
│  │  AI Recommendation: "Ideal for speed work."            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Roadmap:**

| Phase | Work Required |
|-------|---------------|
| Phase 1 | Expand beyond Boathouse Row - configurable locations |
| Phase 2 | Improve AI model with historical rowing conditions |
| Phase 3 | API integration with RowLab |
| Phase 4 | Coach notifications for condition changes |
| Phase 5 | Practice recommendations based on forecast |

**Documentation Needed:**
- [ ] RowCast API specification
- [ ] Location configuration guide
- [ ] AI model documentation
- [ ] Integration architecture doc

### Other Future Integrations

| Integration | Status | Priority |
|-------------|--------|----------|
| Garmin Connect | Planned | High |
| Apple Health | Planned | Medium |
| NK SpeedCoach Direct | Research needed | Medium |
| Stripe Billing | Planned | High (SaaS) |

---

## Section 9: Design System - Theme Modes

### The Outdoor Visibility Problem

Rowing happens outdoors. Dark mode is unreadable in sunlight.

### Theme Modes

| Mode | Use Case | Characteristics |
|------|----------|-----------------|
| **Dark Mode** | Indoor, evening, desktop | Default "premium" feel |
| **Light Mode** | General daytime use | Standard light theme |
| **Field Mode** | Outdoor, bright sun, mobile | High contrast, larger targets |

### Color Tokens (Complete)

| Token | Dark Mode | Light Mode | Field Mode |
|-------|-----------|------------|------------|
| `--bg-primary` | `#0D0D0F` | `#FAFAFA` | `#FFFFFF` |
| `--bg-card` | `#1A1A1D` | `#FFFFFF` | `#FFFFFF` |
| `--text-primary` | `#F5F5F5` | `#111111` | `#000000` |
| `--text-secondary` | `#A0A0A0` | `#666666` | `#333333` |
| `--border` | `#2E2E33` | `#E5E5E5` | `#000000` |

### Field Mode Specifics

- Pure white background
- Black text
- Increased contrast ratios (7:1+)
- Larger touch targets (48px minimum)
- Bolder fonts (+100 weight)
- No subtle shadows/gradients

---

## Section 10: Fleet Management

Coaches need to manage equipment before creating lineups.

### Fleet Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Fleet Management                              Riverside BC     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SHELLS                                          [+ Add Shell]  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Name          Type    Weight    Rigging    Status      │   │
│  │  Endeavour     8+      Heavy     Standard   ✅ Ready    │   │
│  │  Spirit        8+      Light     Standard   ✅ Ready    │   │
│  │  Challenger    4+      Medium    Standard   ✅ Ready    │   │
│  │  Discovery     4+      Light     Standard   ⚠️ Repair   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  OARS                                            [+ Add Set]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Set Name      Type     Count    Status                 │   │
│  │  Varsity A     Sweep    8        ✅ Ready               │   │
│  │  JV Set        Sweep    8        ⚠️ 1 damaged           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lineup Builder Integration

When creating a lineup, coach selects shell first:
1. Select Shell (filtered by type, shows weight class)
2. Assign Athletes (filtered/sorted by weight compatibility)

---

## Section 11: Athlete Profile & Biometrics

Required for lineup logic and team management.

### Profile Settings

```
ROWING PROFILE
├── Side Preference: [Port] [Starboard] [Both]
├── Can Scull: ☑ Yes
├── Can Cox: ☐ No
├── Weight: 185 lbs
└── Height: 6'2"

ERG BENCHMARKS
├── 2K:    6:28.4  (Jan 10, 2026)  🏆 PB
├── 6K:    20:15.2 (Dec 15, 2025)
└── 30min: 8,245m  (Nov 20, 2025)

CONNECTED ACCOUNTS
├── ✅ Concept2 Logbook
├── ✅ Strava
└── ○  Garmin Connect
```

### Coach View: Athlete Card (Lineup Builder)

```
┌─────────────────────────────┐
│  John Anderson              │
│  185 lbs │ Starboard │ 6'2" │
│  2K: 6:28.4                 │
│  ✅ Available Thu           │
└─────────────────────────────┘
```

---

## Section 12: Availability & Attendance

### Athlete View: Set Availability

```
THIS WEEK
     Mon    Tue    Wed    Thu    Fri    Sat    Sun
AM    ✅     ✅     ✅     ❌     ✅     ✅     ○
PM    ○      ○      ○      ○      ○      ○      ○

UPCOMING CONFLICTS
├── Thu Jan 23 - "Doctor's appointment"
└── Feb 1-3 - "Family event"

DEFAULT SCHEDULE
☑ Weekday mornings (before 8 AM)
☐ Weekday evenings
☑ Saturday mornings
☐ Sunday
```

### Coach View: Attendance Dashboard

```
SUMMARY
├── 19 Confirmed
├── 3 Pending
├── 1 Out
└── 23 Total

[Send Reminder to Pending]
```

---

## Section 13: Daily Whiteboard

Free-form communication beyond structured workouts.

### Whiteboard Module

```
┌─────────────────────────────────────────────────────────────────┐
│  TODAY'S PLAN                                    [Edit]         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 Thursday Jan 23 - Morning Practice                  │   │
│  │                                                         │   │
│  │  ⏰ Timeline:                                           │   │
│  │     5:15 AM  - Meet at boathouse                       │   │
│  │     5:25 AM  - Hands on                                │   │
│  │     5:30 AM  - Launch                                  │   │
│  │     7:15 AM  - Off water                               │   │
│  │                                                         │   │
│  │  🎯 Focus: Catch timing and blade work                 │   │
│  │                                                         │   │
│  │  📝 Notes:                                              │   │
│  │     - JV launches with Coach Kim                        │   │
│  │     - Dress for 45°F                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Posted by Coach Martinez • 10:30 PM                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section 14: Data Integration Architecture

### The Deduplication Problem

Concept2 workouts can sync to both C2 Logbook AND Strava. If we pull from both, we'd count the same workout twice.

### Solution: Source Hierarchy

```
1. CONCEPT2 LOGBOOK (Primary for Erg Data)
   • Direct OAuth connection
   • Source of truth for ALL erg workouts

2. STRAVA (Secondary - Non-Erg Only)
   • On-water rowing (GPS tracks)
   • Cross-training (runs, bikes, weights)
   • SKIP any activity from Concept2
```

### Deduplication Logic

```javascript
async function importStravaActivity(stravaActivity, user) {
  // Skip Concept2 cross-posts
  if (isConceptTwoSource(stravaActivity)) {
    return { skipped: true, reason: 'c2_duplicate' };
  }

  // Check for exact duplicates by timestamp + distance
  const existing = await findExistingActivity({
    userId: user.id,
    startTime: stravaActivity.start_date,
    distance: stravaActivity.distance,
    tolerance: { time: 60, distance: 50 }
  });

  if (existing) {
    return { skipped: true, reason: 'duplicate' };
  }

  return importActivity(stravaActivity);
}

function isConceptTwoSource(activity) {
  if (activity.type === 'VirtualRow') return true;
  if (activity.device_name?.includes('Concept2')) return true;
  if (activity.device_name?.includes('ErgData')) return true;
  return false;
}
```

### Key Principles

1. **C2 Logbook is source of truth** for erg data
2. **Strava supplements** with on-water and cross-training
3. **Automatic deduplication** prevents double-counting
4. **User can always delete** if something slips through
5. **Source tags** ([C2], [S], [M]) show where data came from

---

## Section 15: Dashboard Customization

Allow users to override adaptive defaults.

### Customization Options

```
HEADLINE METRIC
○ Let RowLab Decide (Adaptive)
○ Weekly Volume
○ Recent Split Performance
● Consistency Streak
○ Custom Goal

PINNED MODULES
☑ Today's Workout
☑ Weekly Load Graph
☑ Recent Activity
☐ 2K Progress (hidden)
☑ Upcoming Schedule

ACTIVITY SOURCES (show in dashboard)
☑ Concept2 RowErg
☑ Concept2 BikeErg
☑ On-Water Sessions
☐ Strava Runs (hidden)
```

### Key Principles

- **Smart defaults:** Heuristics still run, but user can override
- **Raw data accessible:** Even if hidden, one click away in Training Log
- **Per-context settings:** "Me" dashboard separate from team preferences

---

## Implementation Notes

### Priority Order

1. **Core Architecture** - Context switcher, sidebar navigation, URL structure
2. **Personal Dashboard** - Adaptive modules, data integration
3. **Team Views** - Athlete and Coach dashboards
4. **Fleet & Profiles** - Equipment and biometric management
5. **On-Water Integration** - Strava/GPS visualization
6. **Polish** - Field mode, customization, whiteboard

### Technical Considerations

- Use Zustand for context/workspace state management
- Implement theme system with CSS custom properties
- Strava OAuth + C2 Logbook OAuth for data integration
- Leaflet or Mapbox for GPS track visualization
- Consider React Query for data fetching/caching

### Open Questions for Implementation

- [ ] Exact Strava API rate limits and caching strategy
- [ ] C2 Logbook API availability and authentication flow
- [ ] Push notification strategy for announcements/whiteboard
- [ ] Offline support requirements for field use

---

## Appendix: Council Review Summary

This design was validated through council review (Gemini). Key feedback incorporated:

1. ✅ Added Light/Field Mode for outdoor visibility
2. ✅ Added Fleet Manager for equipment tracking
3. ✅ Added Availability setting for athletes
4. ✅ Prioritized C2 Logbook as primary data source
5. ✅ Added clear sidebar section headers (PARTICIPATE vs MANAGE)
6. ✅ Added dashboard customization to override heuristics
7. ✅ Documented deduplication logic for data imports
8. ✅ Added athlete biometrics for lineup logic
9. ✅ Added Daily Whiteboard for coach communications
