# RowLab UI Redesign - Design Document

**Date:** 2025-01-18
**Status:** Approved for Implementation

## Design Philosophy: "Precision in Motion"

RowLab should feel like a high-performance instrument - precise, fast, purposeful. Every element serves the goal of helping coaches build faster boats.

### Inspirations
- **Linear**: Dark, minimal, product-focused, subtle gradients
- **Framer**: Bold typography, bento grids, sophisticated restraint
- **Midlife Engineering**: 2-color boldness, experimental
- **Language Explorer by Hook**: Dramatic serif headlines
- **Raycast**: Glass effects, interactive demos
- **Whoop**: Data visualization as credibility

---

## Color Palette: "Blade Green"

### Backgrounds (The "Void")
| Role | Hex | Usage |
|------|-----|-------|
| Base | `#050508` | App background |
| Surface | `#0E0E12` | Cards, panels |
| Elevated | `#18181F` | Modals, dropdowns |
| Glass | `#050508CC` | Overlays (80% opacity + blur) |

### Typography
| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#EDEDF2` | Headings, body text |
| Secondary | `#A1A1AA` | Labels, descriptions |
| Muted | `#52525B` | Placeholders, disabled |

### Borders
| Role | Hex | Usage |
|------|-----|-------|
| Subtle | `#27272A` | Default borders |
| Active | `#3F3F46` | Hover, focus states |

### Primary Accent (Blade Green)
| State | Hex | Usage |
|-------|-----|-------|
| Default | `#00E692` | Primary buttons, highlights |
| Hover | `#33EBA8` | Button hover |
| Active | `#00B372` | Button pressed |
| Subtle | `#00E6921A` | Badges, active backgrounds |

### Depth Gradients (Violet Twilight)
| Role | Hex | Usage |
|------|-----|-------|
| Glow Start | `#2E1065` | Gradient backgrounds |
| Glow End | `#5B21B6` | Gradient fade |

**Gradient example:**
```css
background: linear-gradient(180deg, rgba(46,16,101,0.2) 0%, rgba(5,5,8,0) 100%);
```

### Functional Colors
| Role | Hex | Usage |
|------|-----|-------|
| Port (Red) | `#FF453A` | Port side indicator |
| Starboard (Green) | `#00E692` | Starboard side (matches primary) |
| Coxswain (Purple) | `#A78BFA` | Coxswain indicator |
| Success | `#00E692` | Success states |
| Warning | `#FBBF24` | Warning states |
| Error | `#EF4444` | Error states |

---

## Typography

### Font Stack
- **Headlines:** Fraunces (variable, bold weights) - Google Fonts
- **UI/Body:** Inter - Google Fonts
- **Data/Numbers:** JetBrains Mono - Google Fonts

### Scale
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Hero Headline | Fraunces | 84px | Bold |
| Section Headline | Fraunces | 48px | SemiBold |
| Card Title | Inter | 20px | SemiBold |
| Body | Inter | 16px | Regular |
| Label | Inter | 14px | Medium |
| Data | JetBrains Mono | 14px | Regular |

---

## Landing Page Structure

### Section 1: Hero
- **Background:** Dark void (#050508) + violet radial glow + faint 5% grid
- **Headline:** "Build Faster Boats." (Fraunces Bold, 84px, white)
- **Subhead:** "The first drag-and-drop lineup builder powered by real-time erg data. Stop guessing. Start engineering." (Inter, 20px, #A1A1AA)
- **CTA Primary:** "Start Building Lineups" (Blade Green solid)
- **CTA Secondary:** "View Demo →" (Outline)
- **Hero Visual:** Interactive lineup builder demo (glass panel, drag-drop animation loop)

### Section 2: Social Proof Bar
- **Text:** "Built by rowers, for rowers" or "Designed for competitive programs"
- **Style:** Subtle, centered, muted text

### Section 3: Features Bento Grid
- **Headline:** "Everything you need to engineer speed." (Fraunces, 48px)
- **Layout:** 2-column grid with varied card sizes
- **Cards:**
  1. Visual Lineup Builder (large, with UI screenshot)
  2. Erg Data Tracking (with mini chart)
  3. Seat Racing Calculator
  4. Athlete Analytics
  5. Multi-Boat Management
  6. Atmospheric card with boathouse image (DSC05480.JPG)

### Section 4: Product Showcase
- **Visual:** Full app screenshot, tilted 3D perspective with glow
- **Text:** "See your entire roster at a glance. Build lineups in seconds."

### Section 5: Pricing
- **Headline:** "Simple pricing for every program." (Fraunces, 36px)
- **Tiers:**
  - Novice (Free): 1 boat, 20 athletes, basic roster
  - Varsity ($15/mo per squad): Lineup builder, erg tracking, seat racing
  - Gold Cup ($80/mo): Unlimited squads, equipment manager, analytics

### Section 6: Final CTA
- **Background:** Subtle boathouse silhouette (DSC05478.JPG) at 20% opacity
- **Headline:** "Ready to build faster boats?" (Fraunces, 56px)
- **CTA:** "Start Building Lineups — It's Free"

### Section 7: Footer
- **Logo + tagline:** "The operating system for competitive rowing."
- **Links:** Product, Resources, Company columns
- **Social:** GitHub, Twitter/X

---

## Image Assets

### From Nextcloud (`/mnt/ncdata/data/swd/files/Rowing/`)
| File | Description | Usage |
|------|-------------|-------|
| `10-02-25/DSC05480.JPG` | Boathouse sunset, shells | Features bento card |
| `10-02-25/DSC05478.JPG` | Boathouse dramatic sky | CTA background |
| `10-02-25/DSC05527.JPG` | Team carrying shell | Optional divider |

### Principles
- Equipment > Environment > Groups (from behind) > Never individuals
- Heavy dark overlays on all photos
- Photos as texture/atmosphere, not focus

---

## Animation & Motion

### Hero
1. **0ms:** Headline fades up (translateY)
2. **200ms:** Subhead + CTAs fade up
3. **500ms:** Hero visual tilts in 3D, lands with spring animation
4. **Loop:** Drag-drop demo cycles every 6 seconds

### General
- Smooth ease-in-out transitions (200-300ms)
- Subtle hover lifts on cards
- No aggressive bouncing or distraction

---

## Implementation Notes

### Tailwind CSS Variables
Add to `tailwind.config.js`:
```js
colors: {
  bg: {
    base: '#050508',
    surface: '#0E0E12',
    elevated: '#18181F',
  },
  text: {
    primary: '#EDEDF2',
    secondary: '#A1A1AA',
    muted: '#52525B',
  },
  border: {
    default: '#27272A',
    active: '#3F3F46',
  },
  accent: {
    green: '#00E692',
    'green-hover': '#33EBA8',
    'green-active': '#00B372',
    'green-subtle': 'rgba(0, 230, 146, 0.1)',
  },
  violet: {
    glow: '#2E1065',
    haze: '#5B21B6',
  },
  port: '#FF453A',
  starboard: '#00E692',
  coxswain: '#A78BFA',
}
```

### Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```
