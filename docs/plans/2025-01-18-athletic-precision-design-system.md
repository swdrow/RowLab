# RowLab Athletic Precision Design System

**Date:** 2025-01-18
**Status:** Implementation Phase
**Goal:** Complete design overhaul from "NOIR SPECTRUM" to "Athletic Precision"

---

## Executive Summary

Transform RowLab from a flashy, effect-heavy design (rainbow shimmer, aurora backgrounds, glass effects) to a clean, professional athletic platform inspired by Linear, Whoop, and TrainingPeaks.

### Design Philosophy: "Athletic Precision Meets Data Clarity"

**Core Principles:**
1. **Competitive Edge** - Design that feels like a race leaderboard, not a lifestyle app
2. **Data-First** - Numbers and metrics are the hero, not decoration
3. **Precision** - Sharp edges, clear hierarchy, no wasted space
4. **Performance** - Fast, responsive, instant feedback

---

## Color System

### Dark Mode (Default)

```
BACKGROUNDS (Deep Navy Scale - NOT pure black)
├── bg-base        #0A0E17    Main app background
├── bg-surface     #141B2D    Card surfaces
├── bg-elevated    #1E293B    Hover states, modals, dropdowns
├── bg-input       #0F172A    Form inputs, text areas
└── bg-highlight   #1E3A5F    Selected/active states (blue tint)

TEXT HIERARCHY
├── text-primary   #F8FAFC    Headlines, important text
├── text-secondary #94A3B8    Body text, descriptions
├── text-muted     #64748B    Captions, timestamps, metadata
└── text-disabled  #475569    Disabled states

DUAL ACCENT SYSTEM (Key Differentiator)
├── Blue (Primary Actions)
│   ├── accent-blue        #2563EB    CTAs, links, selected states
│   ├── accent-blue-hover  #3B82F6    Hover state
│   └── accent-blue-subtle rgba(37, 99, 235, 0.15)    Backgrounds
│
└── Orange (Performance Metrics)
    ├── accent-orange        #F97316    Metrics, PRs, speed
    ├── accent-orange-hover  #FB923C    Hover state
    └── accent-orange-subtle rgba(249, 115, 22, 0.15)    Backgrounds

SEMANTIC COLORS
├── success        #10B981    PRs, improvements, positive
├── warning        #F59E0B    Alerts, attention needed
├── error          #EF4444    Errors, missing data
└── info           #06B6D4    Tips, informational

ROWING-SPECIFIC
├── port           #EF4444    Port side (red, left facing bow)
├── starboard      #22C55E    Starboard (green, right facing bow)
└── coxswain       #A855F7    Coxswain (purple)
```

### Light Mode

```
BACKGROUNDS
├── bg-base        #FFFFFF    Main app background
├── bg-surface     #F8FAFC    Card surfaces
├── bg-elevated    #F1F5F9    Hover states, modals
├── bg-input       #FFFFFF    Form inputs
└── bg-highlight   #EFF6FF    Selected states (blue tint)

TEXT HIERARCHY
├── text-primary   #0F172A    Headlines
├── text-secondary #475569    Body text
├── text-muted     #94A3B8    Captions
└── text-disabled  #CBD5E1    Disabled

BORDERS
├── border-subtle  rgba(0, 0, 0, 0.04)
├── border-default rgba(0, 0, 0, 0.08)
└── border-strong  rgba(0, 0, 0, 0.12)
```

---

## Typography System

### Font Stack
```css
--font-display: 'Space Grotesk', system-ui, sans-serif;  /* Headings */
--font-body: 'Inter', system-ui, sans-serif;              /* Body text */
--font-mono: 'JetBrains Mono', monospace;                 /* Stats, times */
```

### Type Scale
```
Hero       4.5rem (72px)  / 1.1   Space Grotesk 700  Landing hero only
Display    3rem (48px)    / 1.15  Space Grotesk 700  Section headers
H1         2.25rem (36px) / 1.2   Space Grotesk 600  Page titles
H2         1.5rem (24px)  / 1.25  Space Grotesk 600  Card headers
H3         1.125rem (18px)/ 1.3   Space Grotesk 500  Subsections
Body       0.9375rem (15px)/ 1.6  Inter 400          Main text
Small      0.8125rem (13px)/ 1.5  Inter 400          Secondary text
Caption    0.75rem (12px) / 1.4   Inter 500 CAPS     Labels, metadata
Mono       0.875rem (14px)/ 1.4   JetBrains Mono     Times, stats
```

---

## Component Design Language

### Cards
- Background: bg-surface (#141B2D dark / #F8FAFC light)
- Border: 1px solid border-default
- Border-radius: 8px
- Shadow: None at rest, subtle on hover
- **NOTE:** Glass effects with backdrop-blur are acceptable for modals, overlays, and floating panels to create depth hierarchy. Avoid for primary content cards to maintain data clarity.

### Buttons

**Primary (Blue)**
```css
background: #2563EB;
color: white;
border-radius: 6px;
font-weight: 500;
/* Hover: #3B82F6, subtle lift */
/* NO gradients, NO shimmer */
```

**Secondary (Outline)**
```css
background: transparent;
border: 1px solid border-default;
/* Hover: bg-elevated fill */
```

**Performance/Stats (Orange)**
```css
background: #F97316;
/* Used for: PRs, speed improvements, best performances */
```

### Inputs
- Background: bg-input (#0F172A dark / #FFFFFF light)
- Border: 1px solid border-default
- Focus: 2px ring accent-blue
- **NO fancy effects**

### Data Display
- Large metrics: Space Grotesk 700, orange for PRs
- Tables: Clean rows, subtle zebra striping
- Charts: Blue primary, Orange for highlights

---

## Layout Architecture

### Sidebar
- Width: 240px (15rem)
- Background: bg-surface solid, NO gradient
- Active item: bg-elevated with accent-blue left border (3px)
- Icons: text-secondary, active in accent-blue
- **NO glowing edges, NO aurora effects**

### Main Content
- Background: bg-base (#0A0E17 dark / #FFFFFF light)
- **NO aurora/morphing gradients**
- Clean, data-focused

### Header/Topbar
- Background: bg-surface with bottom border
- Clean title on left, actions on right
- **NO gradient underline**

---

## Landing Page Design

### Hero Section
- Deep navy background (#0A0E17) - subtle gradient allowed (not animated)
- Headline: Space Grotesk 700
  - "Build Faster Lineups."
  - "Win More Races." (orange accent on "Win")
- CTAs: "Get Started" (blue solid), "Watch Demo" (outline)
- Boat preview: Static, clean design

### Stats Section
- 4 stat cards on bg-surface
- Large numbers in Space Grotesk
- Labels in Inter uppercase

### Features Section
- 6 cards in 2x3 grid
- Icon + heading + description
- Icons in accent-blue or accent-orange
- **Subtle hover only (background change, slight translate)**

### Footer
- Minimal, bg-base
- Simple links, copyright

---

## Files to Modify

1. **tailwind.config.js** - ✅ DONE
2. **src/App.css** - Remove all glass/shimmer/aurora
3. **index.html** - Update fonts to Space Grotesk + Inter
4. **src/pages/LandingPage.jsx** - Complete rewrite
5. **src/components/compound/Sidebar/Sidebar.tsx** - Clean solid design
6. **src/layouts/AppLayout.jsx** - Remove aurora background

---

## Implementation Order

### Phase 1: Foundation ✅
- [x] Rewrite tailwind.config.js

### Phase 2: Core Styles
- [ ] Rewrite App.css
- [ ] Update index.html fonts

### Phase 3: Landing Page
- [ ] Complete LandingPage.jsx rewrite

### Phase 4: App Shell
- [ ] Sidebar overhaul
- [ ] AppLayout cleanup
- [ ] Theme toggle (dark/light)

### Phase 5: Components
- [ ] Update all components to new tokens

---

## Success Criteria

- [ ] No rainbow/shimmer effects anywhere
- [ ] Deep navy backgrounds (NOT pure black)
- [ ] Blue + Orange dual accent system visible
- [ ] Space Grotesk headlines, Inter body text
- [ ] Clean, athletic aesthetic (Linear/Whoop feel)
- [ ] Port/Starboard colors correct (red/green)
- [ ] Performance metrics in orange
- [ ] All glass-* classes removed
- [ ] All aurora animations removed
- [ ] Working dark/light mode toggle

---

## Inspiration Reference

### Linear.app
- Near-black background (#08090a)
- Inter Variable font
- Semantic color hierarchy
- Minimal decorative elements

### Whoop.com
- High-contrast, clinical aesthetic
- Ring dials for metrics
- Performance-focused language
- Modular card systems

### TrainingPeaks
- Primary blue #3177FF
- Layered information architecture
- Hero data first pattern
- Professional sports aesthetic
