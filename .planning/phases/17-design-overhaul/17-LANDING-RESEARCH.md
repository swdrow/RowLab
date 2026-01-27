# Landing Page Redesign Research

**Created:** 2026-01-27
**Purpose:** Research findings for landing page redesign (Phase 17.2)

---

## Reference Design Analysis

### Linear App (Dark Mode Hero)

**What Works:**
- Single-column centered layout with massive headline
- Bold, concise value prop (not feature list)
- Subtle product preview below fold
- Dark backdrop (#0F0F10) with ample whitespace
- F-pattern scanning - headline to CTA efficiently
- Sans-serif scale with 2-3x body size for headlines
- Entrance fades, smooth scroll reveals
- No flashy effects - motion reinforces flow

**Techniques:**
- Centered hero with "purpose-built tool" language
- Gradient purple sphere logo (distinctive)
- Optimistic UI hints at realtime updates
- CTA buttons with subtle glow effects

### Vercel / Raycast / Stripe

**Hero Sections:**
- Centered layouts with large headlines
- Concise CTAs: "Deploy", "Download"
- Subtle animations or product demos
- Text left / visual right asymmetric splits

**Bento Grids:**
- Asymmetric tile-based layouts
- Varying box sizes for hierarchy
- Large hero tiles for core value
- Smaller tiles for secondary features
- Rounded, shadowed tiles

**Simplifying Complexity:**
- Short value props, code snippets, stats
- One-click deploy demonstrations
- Bento grids chunk info into digestible units

### Sports Analytics Platforms (Catapult, Whoop, TrainHeroic)

**What Works:**
- Hero promises outcomes ("unleash potential"), not features
- Athletes in action imagery
- Card-based feature layouts with icons + benefit copy
- Video/data integration previews
- Credibility via pro team logos
- Mobile-first, fast-loading data previews

**Catapult:**
- Sport-specific solutions sections
- Feature cards with AI-driven metrics
- Video integration previews

**Whoop:**
- Personalized coaching via AI emphasis
- Clean dashboards for strain/recovery/sleep
- Conversational preview style

**TrainHeroic:**
- "Powerful programming tools" language
- Compliance and leaderboard dashboards
- Customizable library showcase

---

## RowLab Feature Set (Real Capabilities)

### Core Features (Always Available)

| Feature | What it Does | Value Prop |
|---------|--------------|------------|
| **Lineup Builder** | Drag-drop boat assignment with validation | Build lineups in minutes, not hours |
| **Roster Management** | Athlete database with biometrics | Complete visibility into your roster |
| **Attendance Tracking** | Daily marking, compliance | Know who showed up |
| **Erg Data** | Centralized performance tracking | All erg tests in one place |
| **Training Calendar** | Periodization, scheduling | Plan your season |
| **Basic Seat Racing** | Race results, margin tracking | Data-driven crew selection |
| **Fleet Management** | Shells, oars inventory | Equipment organized |
| **Availability** | Weekly athlete calendars | Know who can row, when |

### Advanced Features (Feature-Gated)

| Feature | What it Does | Value Prop |
|---------|--------------|------------|
| **Bradley-Terry Rankings** | Statistical ranking with confidence | Replace guesswork with data |
| **Matrix Seat Racing** | Latin Square optimal scheduling | Mathematically optimal comparisons |
| **NCAA Compliance** | 20-hour tracking, audit reports | Automatic regulatory tracking |
| **Race Day Command Center** | Timeline, warmup schedule, checklists | Coordinate regattas in real-time |
| **Regattas** | Event management, results | All race planning in one hub |
| **Gamification** | Achievements, challenges, streaks | Athlete engagement |
| **Recruiting** | Visit tracking, prospect management | Manage recruiting pipeline |

---

## Landing Page Structure (Proposed)

### Section 1: Hero
- Massive serif headline: "Build Faster Boats"
- Outcome-focused subline (not feature list)
- Visual: Animated lineup builder or key metric
- CTAs: "Start Free Trial" / "See Features"

### Section 2: Feature Bento Grid
- **Large tile:** Lineup Builder (hero feature)
- **Medium tiles:** Seat Racing, Training Calendar, Race Day
- **Small tiles:** Erg Data, Fleet, Availability, Roster
- Asymmetric layout, not uniform cards

### Section 3: For Coaches / For Athletes
- Two-column split showing different value props
- Coach: team management, decisions, compliance
- Athlete: progress tracking, achievements, assignments

### Section 4: Core Capabilities
Three pillars:
1. Team Management (Roster, Attendance, Availability, Fleet)
2. Performance Analytics (Erg data, Rankings, Seat Racing, TSS)
3. Competition (Regattas, Race Day, Results)

### Section 5: Final CTA
- "Ready to build faster boats?"
- Single prominent CTA

### Footer
- Links, contact, no fake logos

---

## Design Constraints

1. **No fake content:** No fake testimonials, made-up stats, or placeholder logos
2. **Real features:** Showcase actual RowLab capabilities
3. **Dark Editorial aesthetic:** Serif headlines, monochrome UI, chromatic data only
4. **Mobile-first:** Works on all devices
5. **Performance:** Fast load times, no heavy animations

---

## Implementation Notes

### Bento Grid Approach
- Use CSS Grid with `grid-template-areas` for asymmetric layouts
- Tiles have `bg-ink-raised`, `border-ink-border`
- Hover: border lightens, no lift
- Feature icons in `ink-primary`, not colored

### Typography
- Hero: `font-display` (Fraunces) at `clamp(2.5rem, 8vw, 5rem)`
- Body: `font-body` (Inter)
- Data: `font-mono` (Geist Mono) for any metrics shown

### Color
- UI: Entirely monochrome (ink-* tokens)
- Data (if shown): chromatic (data-* tokens)
- No colored buttons, cards, or decorative elements
