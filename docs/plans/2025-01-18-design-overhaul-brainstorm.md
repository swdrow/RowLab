# RowLab Complete Design Overhaul - Brainstorm

**Date:** 2025-01-18
**Status:** Design Phase
**Goal:** Replace current "NOIR SPECTRUM" design with original "Athletic Precision" specification

---

## Problem Statement

The current RowLab frontend has deviated from the original design specification:

| Aspect | Design Doc Spec | Current Implementation |
|--------|-----------------|----------------------|
| Background | Deep Navy #0A0E17 | Pure Black #0a0a0a |
| Accent Primary | Blue #2563EB | Indigo gradient #6366F1 |
| Accent Secondary | Orange #F97316 | Rainbow shimmer |
| Display Font | Space Grotesk | Clash Display |
| Body Font | Inter | Satoshi |
| Aesthetic | Athletic/Precise | Iridescent/Prismatic |
| Inspiration | Linear, Whoop, TrainingPeaks | Gemini, Netflix |

---

## Design Philosophy: "Athletic Precision Meets Data Clarity"

### Core Principles

1. **Competitive Edge** - Design that feels like a race leaderboard, not a lifestyle app
2. **Data-First** - Numbers and metrics are the hero, not decoration
3. **Precision** - Sharp edges, clear hierarchy, no wasted space
4. **Performance** - Fast, responsive, instant feedback

### Visual Language

- **Clean over flashy** - No rainbow shimmers, no iridescent effects
- **Functional accents** - Blue for actions, Orange for performance metrics
- **Clear typography hierarchy** - Bold headlines, readable body text
- **Athletic color coding** - Red=Port, Green=Starboard, intuitive for rowers

---

## Color System Overhaul

### Backgrounds (Deep Navy Scale)
```
bg-base        #0A0E17    Main app background
bg-surface     #141B2D    Card surfaces
bg-elevated    #1E293B    Hover states, modals, dropdowns
bg-input       #0F172A    Form inputs, text areas
bg-highlight   #1E3A5F    Selected/active states (blue tint)
```

### Text Hierarchy
```
text-primary   #F8FAFC    Headlines, important text
text-secondary #94A3B8    Body text, descriptions
text-muted     #64748B    Captions, timestamps, metadata
text-disabled  #475569    Disabled states
```

### Dual Accent System (Key Differentiator)
```
accent-blue    #2563EB    PRIMARY - CTAs, links, selected states
accent-blue-hover #3B82F6 Hover state
accent-blue-subtle rgba(37, 99, 235, 0.15) Backgrounds

accent-orange  #F97316    SECONDARY - Metrics, performance, PRs
accent-orange-hover #FB923C Hover state
accent-orange-subtle rgba(249, 115, 22, 0.15) Backgrounds
```

### Semantic Colors
```
success        #10B981    PRs, improvements, positive changes
warning        #F59E0B    Alerts, attention needed
error          #EF4444    Errors, missing data, conflicts
info           #06B6D4    Tips, informational
```

### Rowing-Specific
```
port           #EF4444    Port side rowers (red, left when facing bow)
starboard      #22C55E    Starboard rowers (green, right when facing bow)
coxswain       #A855F7    Coxswain (purple - commanding presence)
```

---

## Typography System

### Font Stack
```css
--font-display: 'Space Grotesk', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

### Type Scale (Athletic & Bold)
```
Hero:      4.5rem (72px) / 1.1  - Space Grotesk 700 - Landing hero only
Display:   3rem (48px) / 1.15   - Space Grotesk 700 - Section headers
H1:        2.25rem (36px) / 1.2 - Space Grotesk 600 - Page titles
H2:        1.5rem (24px) / 1.25 - Space Grotesk 600 - Card headers
H3:        1.125rem (18px) / 1.3 - Space Grotesk 500 - Subsections
Body:      0.9375rem (15px) / 1.6 - Inter 400 - Main text
Small:     0.8125rem (13px) / 1.5 - Inter 400 - Secondary text
Caption:   0.75rem (12px) / 1.4 - Inter 500 uppercase - Labels, metadata
Mono:      0.875rem (14px) / 1.4 - JetBrains Mono - Times, stats
```

---

## Component Design Language

### Cards
- Background: bg-surface (#141B2D)
- Border: 1px solid #1E293B
- Border-radius: 8px (subtle, not rounded)
- Shadow: None at rest, subtle on hover
- No glass effects, no backdrop blur

### Buttons
**Primary (Blue)**
- Background: accent-blue solid
- Hover: accent-blue-hover, subtle lift
- No gradients, no shimmer

**Secondary (Outline)**
- Border: 1px solid border-subtle
- Hover: bg-elevated fill

**Performance/Stats (Orange)**
- Background: accent-orange
- Used for: PRs, speed improvements, best performances

### Inputs
- Background: bg-input (#0F172A)
- Border: 1px solid #1E293B
- Focus: 2px ring accent-blue
- No fancy effects

### Data Display
- Large metrics: Space Grotesk 700, can be orange for PRs
- Tables: Clean rows, subtle zebra striping
- Charts: Blue primary, Orange for highlights

---

## Landing Page Redesign

### Hero Section
- Deep navy background with subtle gradient (not animated)
- Bold headline in Space Grotesk: "Build Faster Lineups. Win More Races."
- Orange accent on "Win" or key metric words
- Clean CTA buttons: "Get Started" (blue), "Watch Demo" (outline)
- Static boat preview, no animations

### Stats Section
- Simple stat cards on bg-surface
- Large numbers in Space Grotesk
- Clean labels in Inter uppercase

### Features Section
- 6 feature cards in 2x3 grid
- Icon + heading + description format
- Icons in accent-blue or accent-orange based on category
- No hover animations beyond subtle background change

### Footer
- Minimal, dark bg-base
- Simple links, copyright

---

## App Shell Redesign

### Sidebar
- Solid bg-surface, no gradient
- Active item: bg-elevated with accent-blue left border
- Icons in text-secondary, active in accent-blue
- No glowing edges, no aurora effects

### Main Content Area
- Clean bg-base background
- No aurora/morphing gradients
- Subtle top shadow from header

### Header/Topbar
- bg-surface with bottom border
- Clean title on left, actions on right
- No gradient underline

---

## Files to Modify

### 1. tailwind.config.js
- Replace entire color system
- Update font families
- Remove all shimmer/aurora animations
- Simplify shadow system

### 2. src/App.css
- Remove all glass-* classes
- Remove aurora animations
- Replace with athletic design tokens
- Simplify to essential utilities

### 3. src/pages/LandingPage.jsx
- Complete rewrite with new aesthetic
- Remove ShimmerText, GradientText
- Use solid colors, clean typography

### 4. src/components/compound/Sidebar/Sidebar.tsx
- Remove gradient backgrounds
- Remove glowing edge
- Clean solid design

### 5. src/layouts/AppLayout.jsx
- Remove aurora background
- Clean solid design

### 6. All component files
- Update to use new color tokens
- Remove glass effects
- Apply athletic design language

---

## Implementation Order

1. **Phase 1: Foundation**
   - Rewrite tailwind.config.js with exact design spec
   - Rewrite App.css with clean utilities
   - Add Google Fonts for Space Grotesk + Inter

2. **Phase 2: Landing Page**
   - Complete LandingPage.jsx rewrite
   - Athletic, clean, no effects

3. **Phase 3: App Shell**
   - Sidebar overhaul
   - Header/topbar cleanup
   - Main content area

4. **Phase 4: Components**
   - Cards, buttons, inputs
   - Data tables, stat displays
   - Form elements

5. **Phase 5: Pages**
   - Update each app page to new system
   - Ensure consistency

---

## Success Criteria

- [ ] No rainbow/shimmer effects anywhere
- [ ] Deep navy backgrounds throughout
- [ ] Blue + Orange dual accent system visible
- [ ] Space Grotesk headlines, Inter body text
- [ ] Clean, athletic aesthetic (Linear/Whoop feel)
- [ ] Port/Starboard colors correct
- [ ] Performance metrics in orange
- [ ] All glass-* classes removed
- [ ] All aurora animations removed
