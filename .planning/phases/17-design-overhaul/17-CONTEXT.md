# Phase 17: Complete Design Overhaul 🎨

## Phase Goal

Rebuild the design system foundation with "Rowing Instrument" aesthetic, modernize all components, implement satisfying micro-interactions, and redesign the landing page.

## Background

From the approved design document (2026-01-26-phase14-improvements-design.md):

**Philosophy: "Rowing Instrument"**
- Precision timing aesthetic (like SpeedCoach display)
- Data-forward design (coaches scan lots of info)
- Unique rowing identity (not generic SaaS)
- Satisfying + Beautiful (not boring dashboards)

## Requirements

### DESIGN-01: Color System Overhaul
**Dark Mode (Warm, Premium):**
- Base: #0F0F0F (warm near-black)
- Surface: #171717 (cards)
- Elevated: #1F1F1F (modals)
- Text Primary: #F5F5F4 (warm off-white)
- Text Secondary: #A8A29E (warm gray)
- Borders: #292524 (warm dark)

**Light Mode (Clean, Professional):**
- Base: #FAFAF9 (warm white)
- Surface: #FFFFFF (cards)
- Same warmth, inverted

**Accent Colors (Meaning-Based):**
- Blue: Water/Erg related
- Green: Starboard / Positive / Success
- Red: Port / Attention needed
- Gold: Achievements, PRs
- Purple: Premium features indicator

### DESIGN-02: Typography System
- Headings: Inter Bold (or Geist)
- Body: Inter Regular
- Data: Geist Mono / JetBrains Mono (tabular nums)
- Large Metrics: Inter Black, 48-72px
- Numbers should feel like looking at a stroke coach

### DESIGN-03: Component Library Rebuild
- Buttons: Tactile press states (scale 0.96 on tap)
- Cards: Consistent elevation, warm borders
- Tables: Data-dense but readable
- Charts: Rowing-specific visualization patterns
- Forms: Clear hierarchy, validation states
- Modals: Smooth enter/exit animations

### DESIGN-04: Animation System
**High-Impact Moments:**
- Success confirmations: Button transforms, color pulse
- PRs: Number pop + gold wash + badge animation
- Drag-drop: Physical feel with lift, shadows, spring physics
- Live data: Rolling digits, color flashes for changes

**Always Restrained:**
- Loading states: Clean skeletons, single shimmer
- Scrolling: No parallax effects
- Backgrounds: No auto-playing animations

**Spring Config Standard:**
```typescript
const SPRING_CONFIG = { stiffness: 400, damping: 17 }
const SPRING_FAST = { stiffness: 500, damping: 25 }
const SPRING_GENTLE = { stiffness: 300, damping: 20 }
```

### DESIGN-05: Theme Polish
- Dark mode: Final polish, consistent warm tones
- Light mode: Full implementation with same warmth
- Field mode: High-contrast for outdoor use

### DESIGN-06: Mobile Responsive Overhaul
**Mobile (< 640px):**
- Bottom tab navigation
- Tables → Stacked cards
- Swipe gestures for actions
- 44px minimum tap targets

**Tablet (640-1024px):**
- Collapsible sidebar
- Hybrid layouts

**Desktop (> 1024px):**
- Full sidebar
- Data tables
- Drag-drop interfaces

### DESIGN-07: Landing Page Redesign
- Match app aesthetic
- Showcase key features
- Dark mode by default
- Satisfying scroll interactions
- Clear CTA hierarchy
- Mobile-optimized

## Dependencies

- Phase 12: Existing design system foundation
- All previous phases: Components to be updated

## Success Criteria

1. Color system updated with warm tones across all themes
2. Typography feels like "precision instrument" for data
3. All components have tactile, satisfying interactions
4. Animations are consistent with spring physics
5. Landing page matches app aesthetic and converts
6. Mobile experience is fully polished

## Design Considerations

- Balance Test: "Would you show this to a friend to say 'look how nice this feels'?"
- Avoid generic SaaS patterns
- Data should be the hero
- Every interaction should feel intentional
- Support reduced motion preferences
