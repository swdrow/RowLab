# RowLab Design System: "Precision Instrument"

**Date:** 2025-01-19
**Status:** Design Specification
**Philosophy:** You don't design websites. You design systems of precision.

---

## I. The "Blade" Color System (Dark Mode Only)

### Core Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--void-base` | `#08080A` | `8, 8, 10` | Primary background (warm void, not pure black) |
| `--void-deep` | `#050507` | `5, 5, 7` | Hero sections, maximum depth |
| `--glass-surface` | `#121214` | `18, 18, 20` | Cards, panels, elevated surfaces |
| `--glass-elevated` | `#1A1A1D` | `26, 26, 29` | Modals, dropdowns, tooltips |
| `--glass-hover` | `#1F1F23` | `31, 31, 35` | Hover states on surfaces |

**Dev Note:** Never use `#000000`. The warm void (`#08080A`) has a subtle blue undertone that creates depth without feeling dead. This matches Raycast's `#070921` approach.

### Neon Accents

| Token | Hex | Usage | Glow Shadow |
|-------|-----|-------|-------------|
| `--blade-green` | `#00E599` | Primary actions, safe zones, success | `0 0 20px rgba(0, 229, 153, 0.4)` |
| `--blade-green-dim` | `#00E59933` | Subtle backgrounds (20% opacity) | — |
| `--coxswain-violet` | `#7C3AED` | Leadership, authority, navigation | `0 0 20px rgba(124, 58, 237, 0.4)` |
| `--coxswain-violet-dim` | `#7C3AED26` | Subtle violet backgrounds (15%) | — |
| `--warning-orange` | `#F59E0B` | High drag, attention required | `0 0 20px rgba(245, 158, 11, 0.4)` |
| `--danger-red` | `#EF4444` | Errors, port side | `0 0 20px rgba(239, 68, 68, 0.4)` |

**Dev Note:** Neon accents use `mix-blend-mode: plus-lighter` for text that appears to emit light. Apply the glow shadow on `:hover` and `:active` states.

### Typography Colors

| Token | Hex | Opacity | Usage |
|-------|-----|---------|-------|
| `--text-primary` | `#FAFAFA` | 100% | Headlines, primary content |
| `--text-secondary` | `#A1A1AA` | — | Body text, descriptions |
| `--text-tertiary` | `#71717A` | — | Labels, metadata |
| `--text-quaternary` | `#52525B` | — | Placeholders, disabled |

### Border System

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Default card borders |
| `--border-active` | `rgba(255, 255, 255, 0.12)` | Hover, focus states |
| `--border-glow` | `1px solid rgba(0, 229, 153, 0.3)` | Active/selected with accent |

---

## II. The Glass System (Raycast Physics)

### Glass Surface Recipe

```css
.glass-surface {
  background: rgba(18, 18, 20, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),  /* Top rim light */
    0 4px 24px rgba(0, 0, 0, 0.4);               /* Depth shadow */
}
```

**Dev Note:** The `inset` shadow creates the "top-lit" effect Linear uses. The `saturate(180%)` on the blur makes colors behind the glass pop slightly—this is subtle but critical for the "real glass" effect.

### Glass Card with Gradient Stroke

```css
.glass-card {
  background:
    linear-gradient(var(--glass-surface), var(--glass-surface)) padding-box,
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0) 100%
    ) border-box;
  border: 1px solid transparent;
  border-radius: 16px;
  backdrop-filter: blur(20px);
}
```

**Dev Note:** This creates the signature "gradient stroke" where the top edge is bright and fades to invisible. The `padding-box` / `border-box` trick lets us layer gradients for the border effect.

### Noise Texture Overlay

```css
.glass-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

**Dev Note:** This adds the 1px noise texture Raycast uses. The `0.03` opacity is critical—more and it looks dirty, less and it's invisible. Apply to hero sections and glass surfaces.

---

## III. Typography System

### Font Stack

```css
:root {
  --font-display: 'Fraunces', Georgia, serif;      /* Headlines, editorial */
  --font-body: 'Inter', -apple-system, sans-serif; /* UI, body text */
  --font-mono: 'JetBrains Mono', monospace;        /* Data, metrics */
}
```

### Type Scale

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| Hero H1 | Fraunces | `clamp(56px, 8vw, 96px)` | 700 | 1.0 | `-0.02em` |
| Section H2 | Fraunces | `clamp(36px, 5vw, 56px)` | 600 | 1.1 | `-0.01em` |
| Card Title | Inter | `20px` | 600 | 1.3 | `0` |
| Body | Inter | `16px` | 400 | 1.6 | `0` |
| Label | Inter | `13px` | 500 | 1.4 | `0.01em` |
| Metric | JetBrains Mono | `14px` | 400 | 1.2 | `0` |
| Metric Large | JetBrains Mono | `48px` | 700 | 1.0 | `-0.02em` |

**Dev Note:** Fraunces creates the "Language Explorer" editorial drama. The negative letter-spacing on headlines tightens the text for a premium feel. Use `text-wrap: balance` on all headlines.

### Metadata Labels (Raycast Style)

```css
.label-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}
```

---

## IV. Component Physics

### Buttons

#### Primary Button (Glow Button)

```css
.btn-primary {
  position: relative;
  padding: 12px 24px;
  background: var(--blade-green);
  color: var(--void-base);
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: inherit;
  filter: blur(12px);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 24px rgba(0, 229, 153, 0.5);
}

.btn-primary:hover::before {
  opacity: 0.5;
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Dev Note:** The `::before` pseudo-element creates a "bloom" glow behind the button on hover. The `cubic-bezier(0.2, 0.8, 0.2, 1)` is Rauno's "snappy" easing—responsive, momentum-based.

#### Ghost Button (Underline Glow)

```css
.btn-ghost {
  position: relative;
  padding: 8px 0;
  background: transparent;
  color: var(--text-primary);
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-ghost::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--blade-green);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.btn-ghost:hover::after {
  transform: scaleX(1);
  transform-origin: left;
  box-shadow: 0 0 8px var(--blade-green);
}
```

#### Glass Pill Button

```css
.btn-pill {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.2s;
}

.btn-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}
```

### Cards

#### Feature Card (Bento Item)

```css
.card-feature {
  position: relative;
  padding: 24px;
  background:
    linear-gradient(var(--glass-surface), var(--glass-surface)) padding-box,
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 50%
    ) border-box;
  border: 1px solid transparent;
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.card-feature:hover {
  transform: translateY(-4px) scale(1.01);
}

/* Inner glow on hover */
.card-feature::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(0, 229, 153, 0.1) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.card-feature:hover::before {
  opacity: 1;
}
```

#### Athlete Card (Trading Card Style)

```css
.card-athlete {
  position: relative;
  width: 200px;
  padding: 20px;
  background: var(--glass-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  text-align: center;
}

/* Whoop-style circular score */
.card-athlete .score-ring {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: conic-gradient(
    var(--blade-green) var(--score-percent),
    rgba(255, 255, 255, 0.1) var(--score-percent)
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-athlete .score-ring::before {
  content: '';
  width: 64px;
  height: 64px;
  background: var(--glass-surface);
  border-radius: 50%;
}

.card-athlete .score-value {
  position: absolute;
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}
```

**Dev Note:** Use CSS custom property `--score-percent` (e.g., `75%`) to control the conic-gradient fill. The inner circle masks the gradient to create the ring effect.

---

## V. Landing Page Sections

### Section 1: Hero ("Cockpit View")

**Structure:**
- Full viewport height
- Deep void background with top-down spotlight
- 3D-tilted glass card showing live lineup demo
- Massive editorial headline (Fraunces)

**Background Physics:**

```css
.hero {
  position: relative;
  min-height: 100vh;
  background: var(--void-deep);
  overflow: hidden;
}

/* App Store spotlight */
.hero::before {
  content: '';
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 80%;
  background: radial-gradient(
    ellipse 80% 50% at 50% 0%,
    rgba(124, 58, 237, 0.15) 0%,
    rgba(0, 229, 153, 0.08) 30%,
    transparent 70%
  );
  pointer-events: none;
}

/* Subtle grid */
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}
```

**3D Card Physics:**

```css
.hero-card {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.hero-card-inner {
  transform: rotateX(8deg) rotateY(-5deg);
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow:
    0 50px 100px -20px rgba(0, 0, 0, 0.6),
    0 30px 60px -30px rgba(0, 0, 0, 0.4);
}

.hero-card:hover .hero-card-inner {
  transform: rotateX(2deg) rotateY(-2deg);
}
```

**Dev Note:** The card should show an actual RowLab lineup interface. On page load, animate it tilting in with a spring effect using `@keyframes` with overshoot.

### Section 2: Social Proof Bar

```css
.social-proof {
  padding: 24px 0;
  text-align: center;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.social-proof p {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
}
```

### Section 3: Features ("Engine Room" Bento Grid)

**Grid Structure:**

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 16px;
  padding: 80px 0;
}

/* Large feature card spans 2 cols */
.bento-grid .card-lg {
  grid-column: span 2;
  min-height: 400px;
}

/* Atmospheric photo card */
.bento-grid .card-atmosphere {
  position: relative;
  overflow: hidden;
}

.bento-grid .card-atmosphere img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.15;
  filter: grayscale(100%);
  mix-blend-mode: luminosity;
}
```

**Dev Note:** Use boathouse photos as textures at 15% opacity with `grayscale` and `luminosity` blend. They should feel like subtle backgrounds, not hero images.

### Section 4: Data Stream (Horizontal Ticker)

```css
.data-stream {
  position: relative;
  padding: 40px 0;
  overflow: hidden;
  background: var(--void-base);
}

.data-stream-track {
  display: flex;
  gap: 48px;
  animation: scroll-left 30s linear infinite;
}

@keyframes scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* Edge fade masks */
.data-stream::before,
.data-stream::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 120px;
  z-index: 2;
  pointer-events: none;
}

.data-stream::before {
  left: 0;
  background: linear-gradient(90deg, var(--void-base), transparent);
}

.data-stream::after {
  right: 0;
  background: linear-gradient(270deg, var(--void-base), transparent);
}

/* Metric items */
.metric-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  white-space: nowrap;
}

.metric-item .label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-quaternary);
}

.metric-item .value {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--blade-green);
  text-shadow: 0 0 20px rgba(0, 229, 153, 0.5);
}
```

**Dev Note:** Duplicate the track content to enable seamless infinite scroll. The `text-shadow` on values creates the "neon glow" effect for metrics.

### Section 5: Pricing

**Glass Pricing Cards:**

```css
.pricing-card {
  position: relative;
  padding: 32px;
  background: var(--glass-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
}

.pricing-card.featured {
  background:
    linear-gradient(var(--glass-elevated), var(--glass-elevated)) padding-box,
    linear-gradient(
      180deg,
      var(--blade-green) 0%,
      transparent 50%
    ) border-box;
  border: 1px solid transparent;
}

.pricing-card.featured::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: var(--blade-green);
  box-shadow: 0 0 20px var(--blade-green);
}
```

### Section 6: Final CTA

```css
.cta-section {
  position: relative;
  padding: 160px 0;
  text-align: center;
  overflow: hidden;
}

/* Boathouse silhouette background */
.cta-section .bg-image {
  position: absolute;
  inset: 0;
  background-image: url('/images/boathouse.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.08;
  filter: grayscale(100%);
}

/* Top gradient fade */
.cta-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(var(--void-base), transparent);
}
```

---

## VI. Application UI (Dashboard)

### Sidebar (Linear Style)

```css
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 56px;
  background: rgba(8, 8, 10, 0.9);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  z-index: 100;
}

.sidebar-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--text-tertiary);
  transition: all 0.15s;
}

.sidebar-icon:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-icon.active {
  color: var(--blade-green);
  background: var(--blade-green-dim);
}
```

### Boat Canvas (Shell View)

```css
.boat-canvas {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
}

/* Shell outline */
.boat-shell {
  position: relative;
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 100px;
}

/* Seat slot */
.seat-slot {
  width: 64px;
  height: 64px;
  background: var(--glass-surface);
  border: 2px dashed var(--border-subtle);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.seat-slot:hover {
  border-color: var(--border-active);
  background: var(--glass-hover);
}

.seat-slot.filled {
  border-style: solid;
  border-color: var(--blade-green);
  background: var(--blade-green-dim);
}

/* Predicted speed display */
.predicted-speed {
  position: absolute;
  top: -60px;
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 700;
  color: var(--blade-green);
  text-shadow: 0 0 40px rgba(0, 229, 153, 0.6);
  transition: all 0.3s;
}
```

**Dev Note:** When an athlete is dropped into a seat, animate the `predicted-speed` with a pulse effect and update the glow intensity.

### Athlete Drop Card (In Canvas)

```css
.athlete-drop-card {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  cursor: grab;
  transition: transform 0.15s;
}

.athlete-drop-card:active {
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.athlete-drop-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Mini score indicator */
.athlete-drop-card .score-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--blade-green);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--void-base);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## VII. Animation & Motion

### Easing Functions

```css
:root {
  --ease-snappy: cubic-bezier(0.2, 0.8, 0.2, 1);   /* Quick, responsive */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);     /* Gentle, material */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring overshoot */
}
```

### Hero Entrance Animation

```css
@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-card-tilt {
  from {
    opacity: 0;
    transform: perspective(1000px) rotateX(20deg) rotateY(-15deg) translateY(50px);
  }
  to {
    opacity: 1;
    transform: perspective(1000px) rotateX(8deg) rotateY(-5deg) translateY(0);
  }
}

.hero h1 {
  animation: hero-fade-up 0.8s var(--ease-snappy) forwards;
}

.hero p {
  animation: hero-fade-up 0.8s var(--ease-snappy) 0.1s forwards;
  opacity: 0;
}

.hero-card {
  animation: hero-card-tilt 1s var(--ease-bounce) 0.3s forwards;
  opacity: 0;
}
```

### Hover Lift

```css
.hover-lift {
  transition: transform 0.2s var(--ease-snappy);
}

.hover-lift:hover {
  transform: translateY(-4px);
}
```

### Glow Pulse (For Updated Data)

```css
@keyframes glow-pulse {
  0%, 100% {
    text-shadow: 0 0 20px rgba(0, 229, 153, 0.5);
  }
  50% {
    text-shadow: 0 0 40px rgba(0, 229, 153, 0.8);
  }
}

.metric-updated {
  animation: glow-pulse 0.6s var(--ease-smooth);
}
```

---

## VIII. Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        void: {
          base: '#08080A',
          deep: '#050507',
        },
        glass: {
          surface: '#121214',
          elevated: '#1A1A1D',
          hover: '#1F1F23',
        },
        blade: {
          green: '#00E599',
          'green-dim': 'rgba(0, 229, 153, 0.2)',
        },
        coxswain: {
          violet: '#7C3AED',
          'violet-dim': 'rgba(124, 58, 237, 0.15)',
        },
        warning: {
          orange: '#F59E0B',
        },
        danger: {
          red: '#EF4444',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
          quaternary: '#52525B',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          active: 'rgba(255, 255, 255, 0.12)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      transitionTimingFunction: {
        snappy: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 229, 153, 0.4)',
        'glow-violet': '0 0 20px rgba(124, 58, 237, 0.4)',
        'glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 24px rgba(0, 0, 0, 0.4)',
        'card': '0 50px 100px -20px rgba(0, 0, 0, 0.6), 0 30px 60px -30px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-stroke': 'linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0))',
      },
    },
  },
}
```

---

## IX. Google Fonts Link

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## X. Summary: The "Visual Physics" Checklist

### Raycast Physics
- [x] Void backgrounds with warm undertone (`#08080A`)
- [x] Glass surfaces with noise texture overlay
- [x] Gradient stroke borders (white-to-transparent)
- [x] Top-down radial spotlight
- [x] Neon accents with glow shadows

### Linear/Vercel Physics
- [x] Inner border rim light (`inset 0 1px...`)
- [x] Gradient masks fading into void
- [x] Active states emit "bloom" glow
- [x] Micro-typography (mono, uppercase, small)

### Whoop Physics
- [x] Circular progress rings for scores
- [x] Data as hero (large mono numbers)
- [x] Zone gradients (green → red)

### Rauno Physics
- [x] Snappy easing (`cubic-bezier(0.2, 0.8, 0.2, 1)`)
- [x] Spring overshoot on entrance animations
- [x] Elements react to interaction, not just hover

### Editorial (Language Explorer)
- [x] Massive serif headlines (Fraunces)
- [x] Broken/asymmetric grid (bento)
- [x] Photos as textures, not banners
