# RowLab Dashboard Redesign - Comprehensive Design Document

**Date:** January 20, 2026
**Status:** Validated Design - Ready for Implementation
**Scope:** Athlete Dashboard, Coach Dashboard, Coxswain View, Design System Overhaul

---

## Executive Summary

This document outlines a complete redesign of RowLab's three primary views (Athlete, Coach, Coxswain) along with a new design system. The goal is to transform RowLab from a "vibe-coded" appearance into a precision instrument that feels as professional as Linear, Vercel, and Raycast while serving the specific needs of rowing coaches and athletes.

### Design Inspirations
- **Linear** - Command palette, keyboard-first, clean hierarchy
- **Vercel** - Minimal color, high contrast, technical precision
- **Whoop** - Athlete data presentation, training load metrics
- **TrainingPeaks** - PMC charts, training stress concepts
- **Strava** - Activity feeds, social features, personal bests
- **Bevel/Origin** - Premium fitness aesthetics

---

## Part 1: Athlete Dashboard

### Layout Structure
**Hybrid Sidebar + Tiles** approach combining navigation efficiency with information density.

#### Desktop Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  [Athlete Name]              [Sync C2] [Settings] [🔔] │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│  SIDEBAR │                    MAIN CONTENT                      │
│          │                                                      │
│ Overview │  ┌─────────────────────────────────────────────────┐ │
│ Workouts │  │           RECENT WORKOUT HERO                   │ │
│ Stats    │  │  Per-piece breakdown with stroke rate + watts   │ │
│ Rankings │  │  Heart rate integration (when available)        │ │
│ Schedule │  └─────────────────────────────────────────────────┘ │
│          │                                                      │
│          │  ┌───────────────┐  ┌───────────────┐               │
│          │  │ Training Vol. │  │ PMC Chart     │               │
│          │  │ (Weekly)      │  │ (CTL/ATL/TSB) │               │
│          │  └───────────────┘  └───────────────┘               │
│          │                                                      │
│          │  ┌───────────────┐  ┌───────────────┐               │
│          │  │ Personal Bests│  │ Schedule      │               │
│          │  │ 2k/6k/30min   │  │ Calendar Week │               │
│          │  └───────────────┘  └───────────────┘               │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

#### Mobile Layout
- Sidebar becomes collapsible drawer (hamburger menu)
- Tiles stack vertically
- Recent workout hero spans full width
- Bottom navigation for primary actions

### Tile Specifications

#### 1. Recent Workout Hero
**Purpose:** Immediate visibility into last training session

| Data Point | Display |
|------------|---------|
| Workout type | Badge (e.g., "2k Test", "3x1500m") |
| Total distance/time | Large monospace numerals |
| Per-piece breakdown | Table with columns: Piece, Time, Split, Stroke Rate, Watts |
| Heart rate | When connected (avg/max with zone color) |
| Date/time | Relative format ("2 hours ago") |

**Per-Piece Breakdown Example:**
```
Piece   Time      Avg Split   Avg S/R   Avg Watts
1       5:30.2    1:50.0      32        245
2       5:28.9    1:49.6      33        252
3       5:35.1    1:51.7      31        238
```

#### 2. Training Volume Chart
**Purpose:** Weekly/monthly training load visualization

- Bar chart showing weekly distance/hours
- Trend line overlay
- Comparison to previous period
- Color coding: On track (blue), Below (muted), Above (green)

#### 3. Performance Management Chart (PMC)
**Purpose:** Long-term fitness and fatigue tracking

| Metric | Color | Description |
|--------|-------|-------------|
| CTL (Fitness) | Blue | 42-day weighted average of training load |
| ATL (Fatigue) | Rose | 7-day weighted average |
| TSB (Form) | Green/Red | CTL - ATL, indicates readiness |

**Note:** Requires sufficient data history. Show placeholder with explanation if < 6 weeks of data.

#### 4. Personal Bests
**Standard Test Types Only:**
- 2000m
- 6000m
- 30 minutes

**Display Format:**
```
2000m       6:18.4    ▲ PR     2024-11-15
6000m      19:42.1    ▲ PR     2024-09-22
30min     8,456m             2024-08-10
```

**Features:**
- Link to global rankings (separate page)
- Integration with Concept2 Online Logbook rankings
- Privacy toggle per athlete

#### 5. Schedule Widget
**Format:** Calendar week view (Mon-Sun)

| Day | Display |
|-----|---------|
| Past | Completed indicator (checkmark) or missed (muted) |
| Today | Highlighted, shows time if scheduled |
| Future | Scheduled workout type |

---

## Part 2: Coach Dashboard

### Philosophy
Customizable tiles with **dashboard presets** for different coaching scenarios.

### Dashboard Presets

| Preset | Use Case | Primary Tiles |
|--------|----------|---------------|
| Daily Overview | Morning check-in | Team Summary, Live Workout, Schedule |
| Erg Test Day | Test administration | Live Workout, Rankings, Athlete Quick-View |
| Race Week | Competition prep | Lineup Cards, Rankings, Team Training |
| Training Review | Post-practice analysis | Team Training Volume, Rankings, Athlete Quick-View |

### Tile Catalog

#### Must-Have Tiles (Priority M)

##### 1. Team Summary
Quick health check of team status.

```
┌─────────────────────────────────────────┐
│  TEAM SUMMARY                           │
├─────────────────────────────────────────┤
│  Athletes Active    24/28               │
│  Boats Configured   6                   │
│  Workouts Today     2                   │
│  Pending Erg Data   3 athletes          │
└─────────────────────────────────────────┘
```

##### 2. Live Workout Dashboard
**Critical Feature:** Real-time erg data during practice.

**Data Source:** Hybrid approach
- Primary: Concept2 API polling (15-30 second intervals)
- Fallback: Manual entry interface
- Future: PM5 Bluetooth LE via native companion app (see ROADMAP.md)

**Display Format:** Spreadsheet-style table (based on real coach erg sheets)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LIVE WORKOUT: 3x1500m @ 24 s/m                    [Configure] [Export] │
├─────────────────────────────────────────────────────────────────────────┤
│  Athlete      Piece 1    Piece 2    Piece 3    Avg Split   Total Time  │
├─────────────────────────────────────────────────────────────────────────┤
│  A. Smith     5:30.2     5:28.9     5:35.1     1:50.4      16:34.2     │
│  B. Jones     5:42.1     5:40.3     5:45.8     1:53.6      17:08.2     │
│  C. Davis     5:35.5     5:33.2     5:38.7     1:51.9      16:47.4     │
│  [+ Add]      [Live]     [Live]     —          —           —           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Workout Configurator:**
- Quick-start templates (2k Test, 6k Test, 3x1500m, etc.)
- C2-style workout builder interface
- Custom piece/interval configuration

##### 3. Rankings Table
Comprehensive athlete comparison.

| Column | Description |
|--------|-------------|
| Seat Race Elo | Calculated from head-to-head seat race results |
| 2k Time | Best 2000m time |
| 6k Time | Best 6000m time |
| Recent Trend | Performance trajectory (↑ improving, → stable, ↓ declining) |
| Combined Score | Weighted composite for quick sorting |

**Features:**
- Column sorting
- Filter by side (Port/Starboard/Both)
- Export to CSV
- Integration with Concept2 global rankings

##### 4. Lineup Cards
Active boat configurations with version history.

**Version Control Approach:**
- Each lineup change creates a new version (like git commits)
- View diff between versions ("Jones ↔ Smith in seat 4")
- Revert to previous versions
- Notes attached to each version

**Visual Swap Tool:**
- Click-to-select athlete, click destination to swap
- Drag-and-drop between seats
- Dropdown selector as fallback
- Keyboard shortcuts (power users)

**Notes System:**
- Per-lineup notes visible on cards
- Switch history with timestamps
- Rationale field for changes

##### 5. Athlete Quick-View
Click any athlete name to see summary panel.

```
┌─────────────────────────────────────────┐
│  [Photo]  ALEX SMITH                    │
│           Port | Seat 4                 │
├─────────────────────────────────────────┤
│  2k:  6:18.4   6k:  19:42.1            │
│  Elo: 1847     Trend: ↑                 │
├─────────────────────────────────────────┤
│  Recent Workouts                        │
│  • 3x1500m - Yesterday                  │
│  • 2k Test - 3 days ago                 │
│  [View Full Profile →]                  │
└─────────────────────────────────────────┘
```

##### 6. Team Training Volume
Aggregate training metrics.

- Weekly hours/meters by athlete
- Team totals and averages
- Comparison to training plan targets
- Breakdown by workout type

##### 7. Upcoming Schedule
Calendar view of planned workouts.

- Color coding by workout type
- Conflict detection (facility, equipment)
- Quick edit capability

#### Nice-to-Have Tiles (Priority N)

- Weather widget (for on-water planning)
- Announcements board
- Recent achievements feed

---

## Part 3: Coxswain View

### Philosophy
**Mobile-first design** optimized for use during practice from the water.

### Core Features

#### 1. Boat Roster
Quick view of assigned athletes.

```
┌─────────────────────────────────────────┐
│  VARSITY 8+                    [Switch] │
├─────────────────────────────────────────┤
│  Cox: Williams                          │
│  8: Smith (P)     4: Davis (P)          │
│  7: Jones (S)     3: Lee (S)            │
│  6: Brown (P)     2: Kim (P)            │
│  5: Wilson (S)    1: Chen (S)           │
└─────────────────────────────────────────┘
```

**Boat Switching:**
- Dropdown to switch between assigned boats
- Only shows boats where user is coxswain

#### 2. Workout Entry Interface
Capture piece data from the water.

**Input Fields (per piece):**
- Time (mm:ss.t format)
- Stroke Rate (average)

**Entry Flow:**
```
[Select Piece: 1 | 2 | 3 | ...]
[Time Input: ___:___._ ]  [S/R: __ ]
[Save Piece]

Saved:
Piece 1: 5:30.2 @ 32 s/m  ✓
Piece 2: [Current]
```

**Future Enhancement:** Voice entry using Whisper AI (see ROADMAP.md)

#### 3. Communication System
Structured notes tied to workout sessions.

**Pre-Workout (from coach):**
- Workout instructions
- Focus points
- Technical cues

**Post-Workout (from coxswain):**
- Session report
- Athlete observations
- Equipment notes

**Format:** Timestamped, session-linked, searchable

#### 4. Athlete Details
Access to athlete information during practice.

**Available Data:**
- Recent erg times
- Side preference
- Technical notes
- Personal bests

**Future:** Real-time telemetry data history (dependent on Integration Hub)

### Access Control
Coach-configurable permissions per coxswain.

| Level | Access |
|-------|--------|
| View Only | Roster, schedule |
| Standard | + Workout entry, communication |
| Full | + All athlete data, rankings |

---

## Part 4: Design System - "Precision Instrument"

### Anti-Vibecode Guidelines

**The Problem:** AI-generated interfaces often share recognizable patterns that feel generic, over-decorated, and hollow. This section explicitly defines what to avoid.

#### What Creates "Vibecode" Appearance

| Pattern | Why It Feels AI-Generated | Our Approach |
|---------|--------------------------|--------------|
| Excessive gradients | Over-reliance on default gradient presets | Solid colors, gradients only for specific purpose |
| Unnecessary blur/glow | Easy "polish" that adds no information | Earn effects - glow only for live/active states |
| Generic rounded corners | Maximum border-radius on everything | Consistent 6-8px, never "pill" shapes except buttons |
| Floating cards with heavy shadows | Dramatic depth that fights content | Subtle borders + minimal shadow layers |
| Decorative animations | Motion that doesn't serve function | Max 200ms, ease-out only, purposeful |
| Dark mode with neon | Easy contrast without design thought | Monochrome + controlled accent usage |
| Stock icon overuse | Generic visual language | Custom iconography where possible |
| Asymmetric layouts | "Dynamic" compositions that feel random | Grid-based, predictable patterns |
| Over-consistent spacing | AI loves equal spacing everywhere | Intentional variation based on content groups |

#### The "Earn Your Effect" Principle

Every visual effect must have functional justification:

| Effect | Allowed When | Never |
|--------|--------------|-------|
| Glow | Live data, active connection, primary CTA | Decorative, static elements |
| Shadow | Floating elements (modals, dropdowns) | Cards at rest |
| Animation | State change, user feedback | Loading spinners that loop forever, entrance animations |
| Gradient | Hero areas, specific branding | Every card background |
| Border | Content separation, input fields | Decorative frames |
| Color accent | Semantic meaning (port/starboard, status) | Visual interest |

#### Red Flags During Implementation

Stop and reconsider if you find yourself:
- Adding a gradient "to make it look better"
- Using glow on more than 1-2 elements per view
- Creating animations longer than 200ms
- Adding shadows to non-floating elements
- Using more than 3 colors in a single component
- Making border-radius exceed 12px
- Adding motion to elements that aren't transitioning state

### Typography

#### Font Stack
```css
--font-display: 'Satoshi', system-ui, sans-serif;
--font-body: 'Satoshi', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

**Why Satoshi:** Geometric sans-serif with personality. Professional yet approachable. Available as variable font.

#### Type Scale

| Token | Size | Line Height | Use Case |
|-------|------|-------------|----------|
| `text-xs` | 11px | 1.2 | Labels, captions |
| `text-sm` | 13px | 1.4 | Secondary text, table cells |
| `text-base` | 15px | 1.5 | Body text |
| `text-lg` | 18px | 1.4 | Section headers |
| `text-xl` | 22px | 1.3 | Card headers |
| `text-2xl` | 28px | 1.2 | Page titles |
| `text-3xl` | 36px | 1.15 | Hero headlines |

#### Numeric Data
**Always use JetBrains Mono for:**
- Times (6:18.4)
- Distances (2000m)
- Statistics (24/28)
- Percentages (78%)
- Dates (2026-01-20)

```css
.numeric, .time, .stat {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

### Color System

#### Base Palette

```css
/* Void (backgrounds) */
--void-deep: #0a0a0a;       /* Main background */
--void-surface: #0f0f0f;    /* Input backgrounds */
--void-elevated: #141414;   /* Card surfaces */
--void-hover: #1a1a1a;      /* Hover states */

/* Text hierarchy */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.70);
--text-tertiary: rgba(255, 255, 255, 0.50);
--text-muted: rgba(255, 255, 255, 0.35);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.10);
--border-strong: rgba(255, 255, 255, 0.15);
```

#### Accent Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Blade Blue | `#0070F3` | Primary actions, links, active states |
| Port Red | `#D96570` | Port side athletes, left positions |
| Starboard Green | `#10B981` | Starboard side, success states |
| Coxswain Violet | `#9B72CB` | Coxswain designation, leadership |
| Live Cyan | `#06B6D4` | Real-time data, active connections |
| Attention Amber | `#F59E0B` | Warnings, important notices |
| Error Red | `#EF4444` | Errors, destructive actions |

#### Controlled Vibrancy

Vibrancy is earned, not default:

```css
/* Default state - muted */
.stat-card {
  background: var(--void-elevated);
  border: 1px solid var(--border-subtle);
}

/* Active/live state - earned vibrancy */
.stat-card[data-live="true"] {
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.1);
}

/* Only primary CTA gets glow */
.button-primary {
  background: var(--blade-blue);
  box-shadow: 0 0 20px rgba(0, 112, 243, 0.25);
}
```

### Component Specifications

#### Cards

```css
.card {
  background: var(--void-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;

  /* No shadow at rest */
  box-shadow: none;
}

.card:hover {
  border-color: var(--border-default);
  /* Still no shadow */
}

/* Only modals/dropdowns get shadows */
.modal, .dropdown {
  box-shadow:
    0 0 0 1px var(--border-default),
    0 16px 32px rgba(0, 0, 0, 0.4);
}
```

#### Buttons

```css
/* Primary - blue with subtle glow */
.btn-primary {
  background: var(--blade-blue);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  box-shadow: 0 0 20px rgba(0, 112, 243, 0.2);
  transition: all 100ms ease-out;
}

.btn-primary:hover {
  background: #2186EB;
  box-shadow: 0 0 30px rgba(0, 112, 243, 0.3);
}

/* Secondary - ghost style */
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.btn-secondary:hover {
  background: var(--void-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
}
```

#### Inputs

```css
.input {
  background: var(--void-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--text-primary);
  transition: border-color 100ms ease-out;
}

.input:focus {
  outline: none;
  border-color: var(--blade-blue);
  box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.15);
}

.input::placeholder {
  color: var(--text-muted);
}
```

#### Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.table td {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.table tr:hover td {
  background: var(--void-hover);
}
```

### Spacing Scale

Based on 4px base unit, 8px primary rhythm:

| Token | Value | Use Case |
|-------|-------|----------|
| `space-1` | 4px | Tight groupings, icon margins |
| `space-2` | 8px | Related elements, button padding |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Card padding, section spacing |
| `space-6` | 24px | Between related sections |
| `space-8` | 32px | Major section breaks |
| `space-12` | 48px | Page-level spacing |

### Animation Guidelines

#### Duration Limits

| Type | Max Duration | Easing |
|------|--------------|--------|
| Hover state | 100ms | ease-out |
| Focus ring | 100ms | ease-out |
| Panel expand | 150ms | ease-out |
| Modal open | 150ms | ease-out |
| Page transition | 200ms | ease-out |

**Never exceed 200ms.** If an animation needs longer, question whether it should animate at all.

#### Allowed Animations

```css
/* Hover transitions */
.interactive {
  transition:
    background-color 100ms ease-out,
    border-color 100ms ease-out,
    color 100ms ease-out;
}

/* Panel/modal entrance */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-enter {
  animation: slideUp 150ms ease-out;
}
```

#### Forbidden Animations

- Infinite loops (except loading indicators during fetch)
- Bounce/spring physics
- Staggered entrance animations
- Parallax scrolling
- Hover animations that change size/position
- Auto-playing carousels or slideshows

---

## Part 5: Technical Implementation Notes

### Data Architecture

#### Workout Data Model
```typescript
interface Workout {
  id: string;
  athleteId: string;
  type: 'erg' | 'water';
  date: Date;
  pieces: Piece[];
  source: 'concept2' | 'manual' | 'coxswain';
  metadata?: {
    weatherConditions?: string;
    boatId?: string;
    notes?: string;
  };
}

interface Piece {
  number: number;
  distance?: number;      // meters
  time: number;           // milliseconds
  strokeRate?: number;    // avg s/m
  watts?: number;         // avg
  heartRate?: {
    avg: number;
    max: number;
  };
  splits?: Split[];       // For detailed breakdown
}
```

#### Concept2 Integration
- OAuth 2.0 flow for user authorization
- Polling interval: 15-30 seconds during active workouts
- Rate limiting: Respect C2 API limits
- Fallback: Manual entry when API unavailable

### Intelligent Grouping

Auto-populate workout dashboard history by detecting common workouts:
- Same workout type within 10-minute window
- Same group of athletes
- Creates implicit "workout session" entity

### Real-time Updates

For Live Workout Dashboard:
- WebSocket connection for instant updates
- Fallback to polling (15s interval)
- Optimistic UI updates for manual entry

---

## Part 6: Future Roadmap Integration

These features are documented in ROADMAP.md for future implementation:

| Feature | Status | Description |
|---------|--------|-------------|
| PM5 Native Companion App | Concept | Bluetooth LE connection for real-time erg data |
| Shell Margin Visualization | Concept | Convert time margins to distance at shell speed |
| Voice-Powered Time Entry | Concept | Whisper AI for hands-free coxswain entry |
| Strava Integration | Planned | Post workouts to Strava, sync activities |
| Concept2 Leaderboard Integration | Planned | Display C2 global rankings alongside team data |

---

## Part 7: Implementation Phases

### Phase 1: Design System Foundation
1. Install Satoshi font (Google Fonts or self-hosted)
2. Update Tailwind config with new tokens
3. Create base component library (Card, Button, Input, Table)
4. Implement anti-vibecode CSS reset

### Phase 2: Athlete Dashboard
1. Layout scaffold (sidebar + main content)
2. Recent Workout Hero tile
3. Training Volume chart
4. Personal Bests display
5. Schedule widget
6. Mobile responsive adaptation

### Phase 3: Coach Dashboard
1. Customizable tile grid system
2. Dashboard preset system
3. Team Summary tile
4. Live Workout Dashboard (manual entry first)
5. Rankings Table
6. Lineup Cards with version history
7. Athlete Quick-View panel

### Phase 4: Coxswain View
1. Mobile-first layout
2. Boat roster display
3. Workout entry interface
4. Communication system (pre/post workout notes)
5. Athlete detail access

### Phase 5: Concept2 Integration
1. OAuth flow implementation
2. Data sync service
3. Live polling for active workouts
4. Hybrid auto/manual workflow

---

## Appendix A: Component Checklist

Use this checklist when building any component:

- [ ] Uses only approved colors from palette
- [ ] Typography follows type scale exactly
- [ ] Spacing uses defined tokens only
- [ ] Animations under 200ms with ease-out
- [ ] No decorative shadows on non-floating elements
- [ ] No gradients unless specifically approved
- [ ] Glow only on live/active states or primary CTA
- [ ] Border-radius is 6-8px (never pill except pill buttons)
- [ ] Hover states are subtle (background/border change only)
- [ ] Monospace font for all numeric data
- [ ] Passes the "squint test" (clear hierarchy when blurred)
- [ ] Would a rowing coach find this useful or just "pretty"?

---

## Appendix B: Review Checklist

Before marking any dashboard implementation complete:

### Functional Review
- [ ] All data displays correctly
- [ ] Real-time updates work (where applicable)
- [ ] Mobile responsive
- [ ] Keyboard navigable
- [ ] Error states handled

### Design Review
- [ ] Matches specifications in this document
- [ ] No vibecode patterns present
- [ ] Typography consistent
- [ ] Colors from approved palette only
- [ ] Spacing follows grid
- [ ] Animations are fast and purposeful

### Anti-Vibecode Audit
- [ ] Count total glowing elements (should be 1-2 max)
- [ ] Count total animations (should serve function)
- [ ] Verify no decorative gradients
- [ ] Check shadow usage (only on floating elements)
- [ ] Ensure no border-radius > 12px

---

*Document generated from brainstorming session on January 20, 2026*
*Design validated through iterative Q&A process*
