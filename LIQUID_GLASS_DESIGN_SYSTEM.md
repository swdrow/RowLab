# Liquid Glass Design System

**Inspired by Apple iOS 26 Design Language**

A comprehensive design system combining translucency, vibrant gradients, soft lighting, and subtle depth to achieve an elegant, fluid, and futuristic aesthetic for the RowLab application.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Quick Start](#quick-start)
3. [Theme Architecture](#theme-architecture)
4. [Components](#components)
5. [Usage Examples](#usage-examples)
6. [Design Tokens](#design-tokens)
7. [Accessibility](#accessibility)
8. [Browser Support](#browser-support)

---

## Philosophy

The Liquid Glass design system is built on these core principles:

### Visual Hierarchy
- **Translucent backgrounds** with frosted-glass layering
- **Multi-layer depth** using backdrop blur and shadows
- **Subtle gradients** that mimic glass surfaces interacting with ambient light

### Motion & Animation
- **Fluid transitions** using Apple-style cubic-bezier easing
- **Organic movement** that feels natural, never jarring
- **Minimal but purposeful** animations

### Accessibility First
- **High contrast ratios** maintained across all glass surfaces
- **WCAG AA compliant** text legibility over translucent backgrounds
- **Focus indicators** with clear visual feedback

### Color Philosophy
- **Luminous accents** inspired by iOS Control Center gradients
- **Adaptive theming** with seamless light/dark mode transitions
- **Iridescent touches** with subtle color shifts

---

## Quick Start

### 1. Import the Design System

```jsx
// Import theme tokens (optional, for programmatic access)
import { liquidGlassTheme } from './theme';

// Import reusable components
import {
  GlassCard,
  GlassButton,
  GlassModal,
  GlassInput,
  GlassBadge,
  GlassContainer,
  GlassNavbar
} from './components/Design';
```

### 2. Use Glass Components

```jsx
function MyComponent() {
  return (
    <GlassContainer variant="mesh">
      <GlassCard variant="base" interactive>
        <h2>Welcome to Liquid Glass</h2>
        <p>A beautiful, translucent design system</p>

        <GlassButton variant="primary" size="md">
          Get Started
        </GlassButton>
      </GlassCard>
    </GlassContainer>
  );
}
```

### 3. Apply Glass Utility Classes

```jsx
<div className="glass-card p-6">
  <p className="text-gray-900 dark:text-white">
    This card uses the base glass effect
  </p>
</div>
```

---

## Theme Architecture

### File Structure

```
src/
├── theme/
│   ├── colors.js           # Color palette & gradients
│   ├── shadows.js          # Shadow & blur system
│   ├── typography.js       # Font scales & weights
│   ├── animations.js       # Motion & transitions
│   ├── spacing.js          # Spacing scale & radius
│   └── index.js            # Main export
│
├── components/Design/
│   ├── GlassCard.jsx       # Card component
│   ├── GlassButton.jsx     # Button component
│   ├── GlassModal.jsx      # Modal/dialog component
│   ├── GlassInput.jsx      # Input field component
│   ├── GlassBadge.jsx      # Badge/tag component
│   ├── GlassContainer.jsx  # App container
│   ├── GlassNavbar.jsx     # Navigation bar
│   └── index.js            # Component exports
│
├── App.css                 # Global glass styles
└── tailwind.config.js      # Tailwind customization
```

---

## Components

### GlassCard

Multi-variant card component with translucent glass effect.

**Props:**
- `variant`: `'subtle' | 'base' | 'elevated' | 'strong'` (default: `'base'`)
- `blur`: `'subtle' | 'base' | 'strong' | 'intense'` (default: `'base'`)
- `interactive`: `boolean` - adds hover/focus effects
- `glow`: `boolean` - adds subtle glow on hover
- `className`: additional CSS classes

**Example:**
```jsx
<GlassCard variant="elevated" interactive glow>
  <h3>Athlete Profile</h3>
  <p>7:04.2 2k PR</p>
</GlassCard>
```

**CSS Classes:**
- `.glass-subtle` - Minimal depth
- `.glass-card` - Standard cards
- `.glass-elevated` - Interactive elements
- `.glass-strong` - Modals, dropdowns
- `.glass-floating` - Top-level overlays

---

### GlassButton

Translucent button with gradient backgrounds and glass shimmer effect.

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'danger'` (default: `'primary'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `fullWidth`: `boolean`
- `disabled`: `boolean`
- `loading`: `boolean` - shows spinner
- `icon`: React element

**Example:**
```jsx
<GlassButton
  variant="primary"
  size="lg"
  loading={isLoading}
  onClick={handleSubmit}
>
  Create Lineup
</GlassButton>
```

**Variants:**
- **Primary**: Blue-to-purple gradient (iOS Control Center style)
- **Secondary**: Subtle translucent with border
- **Ghost**: Transparent with hover effect
- **Danger**: Red-to-pink gradient

---

### GlassModal

Full-featured modal with ultra-blurred backdrop and floating glass panel.

**Props:**
- `isOpen`: `boolean` - controls visibility
- `onClose`: `function` - close callback
- `title`: `string`
- `size`: `'sm' | 'md' | 'lg' | 'xl' | 'full'` (default: `'md'`)
- `showCloseButton`: `boolean` (default: `true`)
- `closeOnBackdrop`: `boolean` (default: `true`)
- `closeOnEscape`: `boolean` (default: `true`)

**Example:**
```jsx
<GlassModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Select Boat Class"
  size="lg"
>
  <BoatSelector onSelect={handleSelect} />
</GlassModal>
```

**Features:**
- Prevent body scroll when open
- ESC key to close
- Click backdrop to dismiss
- Portal rendering
- Fade + scale animations

---

### GlassInput

Translucent input field with glass depth and focus states.

**Props:**
- `label`: `string`
- `placeholder`: `string`
- `type`: `string` (default: `'text'`)
- `value`: `string`
- `onChange`: `function`
- `error`: `string` - error message
- `helperText`: `string`
- `icon`: React element
- `disabled`: `boolean`
- `required`: `boolean`

**Example:**
```jsx
<GlassInput
  label="Lineup Name"
  placeholder="Enter lineup name"
  value={lineupName}
  onChange={(e) => setLineupName(e.target.value)}
  required
  icon={<EditIcon />}
/>
```

---

### GlassBadge

Small, translucent badge/tag with variant colors.

**Props:**
- `variant`: `'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'port' | 'starboard'`
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `glow`: `boolean` - adds glow effect
- `dot`: `boolean` - shows animated dot indicator

**Example:**
```jsx
<GlassBadge variant="success" dot>
  Lineup Complete
</GlassBadge>

<GlassBadge variant="port" size="sm">
  Port
</GlassBadge>
```

---

### GlassContainer

App-level background container with mesh gradient.

**Props:**
- `variant`: `'mesh' | 'solid' | 'gradient'` (default: `'mesh'`)
- `className`: additional CSS classes

**Example:**
```jsx
<GlassContainer variant="mesh">
  <App />
</GlassContainer>
```

**Variants:**
- **Mesh**: Multi-layer radial gradients (iOS ambient lighting)
- **Solid**: Simple gradient background
- **Gradient**: Directional gradient

---

### GlassNavbar

Translucent sticky navigation bar with blur backdrop.

**Props:**
- `title`: `string`
- `leftContent`: React element
- `rightContent`: React element
- `sticky`: `boolean` (default: `true`)
- `blur`: `'subtle' | 'base' | 'strong'` (default: `'strong'`)
- `children`: custom content (overrides all if provided)

**Example:**
```jsx
<GlassNavbar
  title="RowLab"
  leftContent={<Logo />}
  rightContent={<DarkModeToggle />}
/>
```

---

## Usage Examples

### Example 1: Glass Card with Interactive Content

```jsx
import { GlassCard, GlassButton, GlassBadge } from './components/Design';

function AthleteCard({ athlete }) {
  return (
    <GlassCard variant="base" interactive className="p-6">
      <div className="flex items-center gap-4">
        <img
          src={athlete.photo}
          alt={athlete.name}
          className="w-16 h-16 rounded-full border-2 border-white/30"
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {athlete.name}
          </h3>
          <GlassBadge variant="port" size="sm">
            {athlete.side}
          </GlassBadge>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          2k PR: {athlete.pr2k}
        </p>
      </div>

      <GlassButton
        variant="secondary"
        size="sm"
        fullWidth
        className="mt-4"
      >
        View Details
      </GlassButton>
    </GlassCard>
  );
}
```

---

### Example 2: Modal with Form Inputs

```jsx
import { GlassModal, GlassInput, GlassButton } from './components/Design';

function CreateLineupModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [boatClass, setBoatClass] = useState('');

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Lineup"
      size="md"
    >
      <div className="space-y-4">
        <GlassInput
          label="Lineup Name"
          placeholder="e.g., Varsity 8+ Practice"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <GlassInput
          label="Boat Class"
          placeholder="e.g., 8+, 4-, 2x"
          value={boatClass}
          onChange={(e) => setBoatClass(e.target.value)}
          required
        />

        <div className="flex gap-3 mt-6">
          <GlassButton
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSubmit}
            fullWidth
          >
            Create
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
```

---

### Example 3: Navigation Bar

```jsx
import { GlassNavbar, GlassBadge } from './components/Design';
import DarkModeToggle from './components/DarkModeToggle';

function AppHeader({ totalAthletes, completedLineups }) {
  return (
    <GlassNavbar
      title="RowLab"
      leftContent={
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <GlassBadge variant="info" size="sm">
            {totalAthletes} Athletes
          </GlassBadge>
        </div>
      }
      rightContent={
        <div className="flex items-center gap-4">
          <GlassBadge variant="success" dot>
            {completedLineups} Complete
          </GlassBadge>
          <DarkModeToggle />
        </div>
      }
    />
  );
}
```

---

### Example 4: App Container with Mesh Background

```jsx
import { GlassContainer } from './components/Design';

function App() {
  return (
    <GlassContainer variant="mesh">
      <div className="min-h-screen">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <YourContent />
        </main>
      </div>
    </GlassContainer>
  );
}
```

---

## Design Tokens

### Colors

#### Accent Colors (iOS-inspired)
```js
'accent-blue': '#0a84ff'      // Primary blue
'accent-purple': '#bf5af2'    // Vibrant purple
'accent-teal': '#00C7BE'      // Teal highlight
'accent-pink': '#FF2D55'      // Pink accent
'accent-amber': '#FFAB00'     // Warm amber
```

#### Rowing-specific Colors
```js
'port': '#ef4444'             // Red (port side)
'starboard': '#22c55e'        // Green (starboard side)
'rowing-blue': '#1e3a8a'      // Traditional rowing blue
'rowing-gold': '#fbbf24'      // Gold accent
```

#### Dark Mode Colors
```js
'dark-bg': '#0a0a0a'          // Background
'dark-card': '#1c1c1e'        // Card surfaces
'dark-elevated': '#2c2c2e'    // Elevated surfaces
```

---

### Gradients

```css
/* iOS Control Center style */
bg-gradient-blue-violet      /* Blue to purple */
bg-gradient-teal-blue        /* Teal to blue */
bg-gradient-pink-orange      /* Pink to orange */
bg-gradient-purple-pink      /* Purple to pink */

/* Glass surface gradients */
bg-glass                     /* Light glass gradient */
bg-glass-subtle              /* Subtle glass */
bg-glass-dark                /* Dark mode glass */
bg-glass-dark-subtle         /* Subtle dark glass */

/* Ambient backgrounds */
bg-gradient-mesh             /* Multi-layer radial mesh */
bg-gradient-mesh-dark        /* Dark mode mesh */
```

---

### Shadows

#### Glass Depth Shadows
```css
shadow-glass-subtle          /* Minimal elevation */
shadow-glass-base            /* Standard cards */
shadow-glass-elevated        /* Interactive elements */
shadow-glass-strong          /* Modals, dropdowns */
shadow-glass-floating        /* Top-level overlays */
```

#### Glow Effects
```css
shadow-glow-blue             /* Blue glow */
shadow-glow-purple           /* Purple glow */
shadow-glow-teal             /* Teal glow */
shadow-glow-pink             /* Pink glow */
shadow-glow-white            /* White glow */
```

---

### Blur Levels

```css
backdrop-blur-xs: 2px
backdrop-blur-sm: 8px
backdrop-blur-md: 16px        /* Default */
backdrop-blur-lg: 24px
backdrop-blur-xl: 40px
```

---

### Border Radius

```css
rounded-lg: 0.75rem (12px)    /* Cards */
rounded-xl: 1rem (16px)       /* Standard */
rounded-2xl: 1.25rem (20px)   /* Modals */
rounded-3xl: 1.5rem (24px)    /* Special cases */
rounded-full: 9999px          /* Pills */
```

---

### Animations

```css
animate-fade-in              /* 200ms fade in */
animate-fade-out             /* 200ms fade out */
animate-slide-up             /* 400ms slide up + fade */
animate-slide-down           /* 400ms slide down + fade */
animate-scale-in             /* 300ms scale + fade */
animate-scale-out            /* 200ms scale + fade */
animate-glass-blur           /* 400ms blur transition */
animate-shimmer              /* 2s infinite shimmer */
animate-glow-pulse           /* 2s infinite pulse */
animate-float                /* 3s infinite float */
```

---

## Accessibility

### Contrast Ratios

All text maintains **WCAG AA compliance** (4.5:1 minimum contrast ratio) across glass surfaces:

- **Light mode**: Dark text on translucent white backgrounds
- **Dark mode**: Light text on translucent dark backgrounds
- **Adaptive opacity**: Text opacity adjusted for legibility

### Focus States

All interactive elements include visible focus indicators:

```css
*:focus-visible {
  outline: none;
  ring: 2px solid blue-500;
  ring-offset: 2px;
}
```

### Keyboard Navigation

- All components support keyboard navigation
- ESC key closes modals and dropdowns
- Tab order follows logical flow
- Focus trapping in modals

### Screen Readers

- Semantic HTML elements
- ARIA labels where appropriate
- Descriptive button text
- Alternative text for images

---

## Browser Support

### Modern Browsers (Full Support)
- Chrome 76+ (backdrop-filter support)
- Safari 9+ (webkit-backdrop-filter)
- Firefox 103+
- Edge 79+

### Fallback Strategy

For browsers without `backdrop-filter` support:

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-card {
    background-color: rgba(255, 255, 255, 0.95);
  }

  .dark .glass-card {
    background-color: rgba(28, 28, 40, 0.95);
  }
}
```

Fallback provides solid translucent backgrounds instead of blurred glass.

---

## Design Rationales

### Why Blur Levels?

**Subtle (8px)**: Minimal blur for subtle depth without obscuring background content. Used for non-critical overlays.

**Base (16px)**: Standard blur for most cards. Balances translucency with content clarity.

**Strong (24px)**: High blur for important overlays like modals. Creates strong visual separation.

**Intense (40px)**: Maximum blur for backdrops behind modals. Nearly opaque effect.

### Why Gradients?

Glass surfaces in real life reflect and refract light unevenly. Our gradients simulate this:

- **135deg angle**: Creates natural light-source illusion (top-left)
- **Dual opacity stops**: Mimics light passing through thicker/thinner glass
- **Subtle contrast**: Avoids overwhelming the content

### Why Multiple Shadow Layers?

Real glass has complex shadow behavior:

- **Outer shadow**: Object casts shadow on background
- **Inner shadow**: Light passes through, creating depth
- **Edge highlight**: Top edge catches light (inset highlight)

Combining these creates realistic glass depth.

### Why Cubic-Bezier Easing?

Apple's easing curves create organic, natural motion:

- `cubic-bezier(0.4, 0, 0.2, 1)`: Standard iOS timing
- `cubic-bezier(0.25, 0.1, 0.25, 1)`: Glass morphing (slower, smoother)
- `cubic-bezier(0, 0, 0.2, 1)`: Deceleration (for entrances)

These feel more like physics than linear transitions.

---

## Best Practices

### 1. Layer Hierarchy

Use glass variants to create clear visual hierarchy:

```jsx
<GlassContainer variant="mesh">          {/* Ambient background */}
  <GlassNavbar />                        {/* Strong blur - top layer */}
  <GlassCard variant="base">             {/* Standard depth */}
    <GlassCard variant="subtle">         {/* Nested, subtle */}
      <p>Content</p>
    </GlassCard>
  </GlassCard>
</GlassContainer>
```

### 2. Performance Optimization

Backdrop blur is GPU-intensive. Optimize by:

- Using `will-change: backdrop-filter` for animated elements
- Avoiding excessive nesting of blurred elements
- Using `transform` for animations (GPU-accelerated)

```css
.animating-glass {
  will-change: transform, backdrop-filter;
}
```

### 3. Contrast Checking

Always verify text legibility:

```jsx
<GlassCard variant="base" className="p-6">
  {/* Good: High contrast */}
  <h2 className="text-gray-900 dark:text-white font-semibold">
    Title
  </h2>

  {/* Good: Reduced but readable */}
  <p className="text-gray-600 dark:text-gray-300">
    Body text
  </p>

  {/* Avoid: Too low contrast */}
  <span className="text-gray-400 dark:text-gray-600">
    Don't use for important text
  </span>
</GlassCard>
```

### 4. Motion Sensitivity

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Troubleshooting

### Issue: Glass effect not visible

**Solution**: Ensure backdrop-filter is supported and content is behind the glass element.

```jsx
{/* Incorrect - nothing behind */}
<GlassCard>Content</GlassCard>

{/* Correct - content behind card */}
<div className="bg-gradient-mesh">
  <GlassCard>Content</GlassCard>
</div>
```

### Issue: Text is hard to read

**Solution**: Increase background opacity or add text shadow.

```jsx
<GlassCard variant="strong" className="bg-white/90 dark:bg-dark-card/90">
  <p className="drop-shadow-sm">Readable text</p>
</GlassCard>
```

### Issue: Animations feel slow

**Solution**: Adjust animation duration in tailwind.config.js.

```js
animation: {
  'fade-in': 'fadeIn 0.15s cubic-bezier(0, 0, 0.2, 1)', // Faster
}
```

---

## Migration Guide

### From Existing Styles to Liquid Glass

**Step 1**: Replace standard cards
```jsx
// Before
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">

// After
<GlassCard variant="base">
```

**Step 2**: Update buttons
```jsx
// Before
<button className="bg-blue-600 text-white px-6 py-3 rounded-lg">

// After
<GlassButton variant="primary">
```

**Step 3**: Modernize modals
```jsx
// Before
<Modal isOpen={isOpen} onClose={onClose}>

// After
<GlassModal isOpen={isOpen} onClose={onClose} title="Modal Title">
```

---

## Resources

### Inspiration
- [Apple iOS 26 Design Guidelines](https://developer.apple.com/design/)
- [iOS Control Center](https://support.apple.com/guide/iphone/control-center)
- [Glassmorphism UI Trend](https://uxdesign.cc/glassmorphism-in-user-interfaces)

### Tools
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Can I Use - Backdrop Filter](https://caniuse.com/css-backdrop-filter)

---

**Made with care for RowLab**
Design System v1.0 - 2025
