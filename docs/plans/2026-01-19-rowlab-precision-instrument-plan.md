# RowLab Precision Instrument Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual redesign of RowLab following the "Precision Instrument" design system (Raycast/Linear aesthetic).

**Architecture:** Full CSS rewrite using CSS variables for design tokens, Tailwind for utilities, and Framer Motion for animations. Components rebuilt from scratch with glass morphism, neon glows, and gradient stroke borders.

**Tech Stack:** React, Tailwind CSS, Framer Motion, CSS Variables

**Design Doc:** `docs/plans/2026-01-19-rowlab-precision-instrument-redesign.md`

---

## Phase 1: Foundation

Establish design tokens. Everything else builds on this.

---

### Task 1.1: Update Tailwind Config - Colors

**Files:**
- Modify: `tailwind.config.js`

**Step 1: Verify current config loads**

Run: `npm run build`
Expected: Build succeeds (baseline)

**Step 2: Add void color scale**

In `tailwind.config.js`, find the `colors` object inside `theme.extend` and add:

```js
void: {
  deep: '#08080A',
  surface: '#0c0c0e',
  elevated: '#121214',
},
```

**Step 3: Add blade accent colors**

Add to same `colors` object:

```js
blade: {
  green: '#00E599',
},
coxswain: {
  violet: '#7C3AED',
},
```

**Step 4: Add text color scale**

Add to same `colors` object:

```js
text: {
  primary: '#F4F4F5',
  secondary: '#A1A1AA',
  muted: '#52525B',
  disabled: '#3F3F46',
},
```

**Step 5: Verify build still succeeds**

Run: `npm run build`
Expected: Build succeeds with new colors available

**Step 6: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(design): add void, blade, and text color tokens"
```

---

### Task 1.2: Update Tailwind Config - Fonts & Shadows

**Files:**
- Modify: `tailwind.config.js`

**Step 1: Add font families**

In `tailwind.config.js`, find `theme.extend` and add/update `fontFamily`:

```js
fontFamily: {
  display: ['Fraunces', 'Georgia', 'serif'],
  body: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

**Step 2: Add glow shadows**

Add to `theme.extend`:

```js
boxShadow: {
  'glow-green': '0 0 20px rgba(0, 229, 153, 0.4)',
  'glow-green-lg': '0 0 40px rgba(0, 229, 153, 0.3)',
  'glow-violet': '0 0 20px rgba(124, 58, 237, 0.4)',
  'inner-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
  'inset-depth': 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
},
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(design): add font families and glow shadows"
```

---

### Task 1.3: Update Font Loading

**Files:**
- Modify: `index.html`

**Step 1: Find current font links**

Open `index.html` and locate any existing `<link>` tags for fonts in the `<head>`.

**Step 2: Replace/add Google Fonts**

Add these lines in the `<head>` section (before closing `</head>`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

**Step 3: Start dev server and verify fonts load**

Run: `npm run dev`
Expected: Dev server starts. Open browser DevTools → Network tab → filter "font". Should see Fraunces, Inter, JetBrains Mono loading.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat(design): add Fraunces, Inter, JetBrains Mono fonts"
```

---

### Task 1.4: Create CSS Variables Foundation

**Files:**
- Modify: `src/App.css`

**Step 1: Add CSS variables block at top of file**

Add this as the FIRST content in `src/App.css` (before any existing styles):

```css
/* ============================================
   PRECISION INSTRUMENT DESIGN SYSTEM
   ============================================ */

:root {
  /* Void Scale */
  --void-deep: #08080A;
  --void-surface: #0c0c0e;
  --void-elevated: #121214;

  /* Text Hierarchy */
  --text-primary: #F4F4F5;
  --text-secondary: #A1A1AA;
  --text-muted: #52525B;
  --text-disabled: #3F3F46;

  /* Neon Accents */
  --blade-green: #00E599;
  --coxswain-violet: #7C3AED;
  --warning-orange: #F59E0B;
  --danger-red: #EF4444;

  /* Fonts */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;

  /* Easing Functions */
  --ease-snappy: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  /* Glow Values */
  --glow-green: 0 0 20px rgba(0, 229, 153, 0.4);
  --glow-green-intense: 0 0 10px rgba(0, 229, 153, 0.5), 0 0 30px rgba(0, 229, 153, 0.3);
  --glow-violet: 0 0 20px rgba(124, 58, 237, 0.4);
}
```

**Step 2: Verify variables accessible**

Run: `npm run dev`
Open browser DevTools → Elements → select `<html>` → Computed styles. Search for `--void`. Should see variables listed.

**Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(design): add CSS variables for design tokens"
```

---

### Task 1.5: Set Base Styles

**Files:**
- Modify: `src/App.css`

**Step 1: Add base styles after the :root block**

Add after the `:root` block:

```css
/* ============================================
   BASE STYLES
   ============================================ */

html {
  background: var(--void-deep);
}

body {
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--void-deep);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Remove any light mode artifacts */
* {
  border-color: rgba(255, 255, 255, 0.1);
}
```

**Step 2: Verify background color**

Run: `npm run dev`
Open browser. Page background should be warm void (#08080A), not pure black (#000000) or white.

Use DevTools color picker on body to verify: should show #08080A or very close.

**Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(design): set void background and base typography"
```

---

### Task 1.6: Add Glass Utility Classes

**Files:**
- Modify: `src/App.css`

**Step 1: Add glass surface utilities**

Add after base styles:

```css
/* ============================================
   GLASS UTILITIES
   ============================================ */

.glass-surface {
  background: rgba(18, 18, 20, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
}

.glass-card {
  background:
    linear-gradient(#121214, #121214) padding-box,
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.04) 50%,
      rgba(255, 255, 255, 0) 100%
    ) border-box;
  border: 1px solid transparent;
  border-radius: 16px;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
}

.gradient-stroke {
  background:
    linear-gradient(var(--void-elevated), var(--void-elevated)) padding-box,
    linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0)) border-box;
  border: 1px solid transparent;
}

.inner-highlight {
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
}
```

**Step 2: Verify classes work**

In browser DevTools, add class `glass-card` to any div. Should see gradient border and blur.

**Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(design): add glass morphism utility classes"
```

---

### Task 1.7: Add Glow Utility Classes

**Files:**
- Modify: `src/App.css`

**Step 1: Add glow utilities**

Add after glass utilities:

```css
/* ============================================
   GLOW UTILITIES
   ============================================ */

/* Text Glows */
.text-glow-green {
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.5), 0 0 30px rgba(0, 229, 153, 0.3);
}

.text-glow-violet {
  text-shadow: 0 0 10px rgba(124, 58, 237, 0.5), 0 0 30px rgba(124, 58, 237, 0.3);
}

.text-glow-orange {
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.5), 0 0 30px rgba(245, 158, 11, 0.3);
}

/* Box Glows */
.box-glow-green {
  box-shadow: 0 0 20px rgba(0, 229, 153, 0.4);
}

.box-glow-green-lg {
  box-shadow: 0 0 40px rgba(0, 229, 153, 0.3);
}

.box-glow-violet {
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
}

/* Focus Glow Ring */
.focus-glow-green:focus {
  outline: none;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 3px rgba(0, 229, 153, 0.15);
  border-color: var(--blade-green);
}
```

**Step 2: Verify glow works**

In browser DevTools, add class `text-glow-green` to any text element. Should see neon glow effect.

**Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(design): add neon glow utility classes"
```

---

### Task 1.8: Add Reduced Motion Support

**Files:**
- Modify: `src/App.css`

**Step 1: Add reduced motion media query**

Add at the END of `src/App.css`:

```css
/* ============================================
   ACCESSIBILITY
   ============================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(a11y): add reduced motion support"
```

---

## Phase 1 Complete Checkpoint

**Verify Phase 1:**

Run: `npm run dev`

Check:
- [ ] Background is warm void (#08080A)
- [ ] Text is light (#F4F4F5)
- [ ] Fonts load (Fraunces, Inter, JetBrains Mono visible in Network tab)
- [ ] CSS variables accessible in DevTools
- [ ] `.glass-card` class creates gradient border when applied
- [ ] `.text-glow-green` creates neon glow when applied
- [ ] Build succeeds: `npm run build`

---

## Phase 2: Base Components

Build the reusable component library.

---

### Task 2.1: Create Button Component - Glow Variant

**Files:**
- Modify: `src/components/ui/Button.jsx`

**Step 1: Read current Button component**

Run: `cat src/components/ui/Button.jsx | head -50`
Understand current structure.

**Step 2: Create new Button with glow variant**

Replace entire contents of `src/components/ui/Button.jsx` with:

```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Button = forwardRef(function Button(
  {
    variant = 'glow',
    size = 'md',
    color = 'green',
    loading = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref
) {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium transition-all duration-200
    disabled:opacity-40 disabled:pointer-events-none
  `;

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const colorMap = {
    green: {
      text: 'text-blade-green',
      glow: 'after:bg-blade-green after:shadow-[0_0_8px_var(--blade-green)]',
      hoverGlow: 'hover:after:shadow-[0_0_12px_var(--blade-green),0_0_24px_rgba(0,229,153,0.4)]',
    },
    violet: {
      text: 'text-coxswain-violet',
      glow: 'after:bg-coxswain-violet after:shadow-[0_0_8px_var(--coxswain-violet)]',
      hoverGlow: 'hover:after:shadow-[0_0_12px_var(--coxswain-violet),0_0_24px_rgba(124,58,237,0.4)]',
    },
  };

  const variantStyles = {
    glow: `
      bg-transparent border-none cursor-pointer
      ${colorMap[color]?.text || colorMap.green.text}
      after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0
      after:h-[2px] after:rounded-[1px]
      ${colorMap[color]?.glow || colorMap.green.glow}
      after:transition-all after:duration-200
      ${colorMap[color]?.hoverGlow || colorMap.green.hoverGlow}
      hover:after:scale-x-105
      active:scale-[0.98]
    `,
    pill: `
      bg-white/[0.06] backdrop-blur-[10px]
      border border-transparent rounded-full
      text-text-primary
      hover:bg-white/[0.1]
      [background-image:linear-gradient(rgba(255,255,255,0.06),rgba(255,255,255,0.06)),linear-gradient(to_bottom,rgba(255,255,255,0.15),rgba(255,255,255,0))]
      [background-origin:padding-box,border-box]
      [background-clip:padding-box,border-box]
    `,
    ghost: `
      bg-transparent border-none cursor-pointer
      text-text-secondary
      hover:text-text-primary
      after:content-[''] after:absolute after:bottom-1 after:left-3 after:right-3
      after:h-[1px] after:bg-blade-green
      after:scale-x-0 after:opacity-0
      after:transition-all after:duration-200
      hover:after:scale-x-100 hover:after:opacity-100
    `,
    icon: `
      w-10 h-10 p-0
      bg-white/[0.04] border border-white/[0.08] rounded-[10px]
      text-text-secondary
      hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-text-primary
      active:scale-95
    `,
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/20 border-t-blade-green rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
});

export { Button };
export default Button;
```

**Step 3: Verify component renders**

Run: `npm run dev`
Navigate to any page with buttons. Buttons should render (may look different from before - that's expected).

**Step 4: Commit**

```bash
git add src/components/ui/Button.jsx
git commit -m "feat(ui): rewrite Button with glow/pill/ghost/icon variants"
```

---

### Task 2.2: Create Card Component

**Files:**
- Modify: `src/components/ui/Card.jsx`

**Step 1: Read current Card component**

Run: `cat src/components/ui/Card.jsx | head -50`

**Step 2: Replace with new Card component**

Replace entire contents of `src/components/ui/Card.jsx` with:

```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Card = forwardRef(function Card(
  {
    variant = 'glass',
    padding = 'md',
    className,
    children,
    ...props
  },
  ref
) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantStyles = {
    glass: `
      bg-void-elevated
      border border-transparent rounded-2xl
      backdrop-blur-[20px] saturate-[180%]
      shadow-inner-highlight
      [background-image:linear-gradient(#121214,#121214),linear-gradient(to_bottom,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0)_100%)]
      [background-origin:padding-box,border-box]
      [background-clip:padding-box,border-box]
      transition-all duration-200
      hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_30px_-10px_rgba(0,229,153,0.3)]
      hover:-translate-y-0.5
    `,
    solid: `
      bg-void-elevated
      border border-white/[0.08] rounded-xl
      shadow-inner-highlight
    `,
    inset: `
      bg-void-surface
      border border-white/[0.04] rounded-lg
      shadow-inset-depth
    `,
    interactive: `
      bg-void-elevated
      border border-transparent rounded-2xl
      backdrop-blur-[20px]
      [background-image:linear-gradient(#121214,#121214),linear-gradient(to_bottom,rgba(255,255,255,0.12),rgba(255,255,255,0))]
      [background-origin:padding-box,border-box]
      [background-clip:padding-box,border-box]
      cursor-pointer
      transition-all duration-200
      hover:shadow-[0_0_40px_-10px_rgba(0,229,153,0.4)]
      hover:-translate-y-1
    `,
  };

  return (
    <div
      ref={ref}
      className={clsx(
        paddingStyles[padding],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  );
});

const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={clsx(
        'font-display text-xl font-semibold text-text-primary tracking-tight',
        className
      )}
      {...props}
    />
  );
});

const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('text-sm text-text-secondary', className)}
      {...props}
    />
  );
});

const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={clsx('', className)} {...props} />;
});

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx('flex items-center pt-4', className)}
      {...props}
    />
  );
});

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/ui/Card.jsx
git commit -m "feat(ui): rewrite Card with glass/solid/inset/interactive variants"
```

---

### Task 2.3: Create Input Component

**Files:**
- Modify: `src/components/ui/Input.jsx`

**Step 1: Replace with new Input component**

Replace entire contents of `src/components/ui/Input.jsx` with:

```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(function Input(
  { className, type = 'text', error, ...props },
  ref
) {
  return (
    <input
      type={type}
      ref={ref}
      className={clsx(
        `w-full px-4 py-3
        bg-void-surface
        border border-white/[0.08] rounded-[10px]
        shadow-inset-depth
        font-body text-sm text-text-primary
        placeholder:text-text-muted
        transition-all duration-150
        hover:border-white/[0.12]
        focus:outline-none focus:border-blade-green
        focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(0,229,153,0.15)]
        disabled:opacity-50 disabled:cursor-not-allowed`,
        error && 'border-danger-red focus:border-danger-red focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(239,68,68,0.15)]',
        className
      )}
      {...props}
    />
  );
});

const Label = forwardRef(function Label({ className, required, children, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={clsx(
        'block mb-2 font-body text-sm font-medium text-text-secondary',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-danger-red">*</span>}
    </label>
  );
});

const InputError = forwardRef(function InputError({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('mt-1.5 text-xs text-danger-red', className)}
      {...props}
    >
      {children}
    </p>
  );
});

export { Input, Label, InputError };
export default Input;
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/ui/Input.jsx
git commit -m "feat(ui): rewrite Input with inset styling and focus glow"
```

---

### Task 2.4: Create Typography Components

**Files:**
- Create: `src/components/ui/Typography.jsx`

**Step 1: Create new Typography component file**

Create `src/components/ui/Typography.jsx` with:

```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

// Editorial Display (Fraunces)
const DisplayXL = forwardRef(function DisplayXL({ className, children, ...props }, ref) {
  return (
    <h1
      ref={ref}
      className={clsx(
        'font-display text-[72px] font-semibold leading-[1.1] tracking-[-0.03em] text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
});

const DisplayLG = forwardRef(function DisplayLG({ className, children, ...props }, ref) {
  return (
    <h2
      ref={ref}
      className={clsx(
        'font-display text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
});

const DisplayMD = forwardRef(function DisplayMD({ className, children, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={clsx(
        'font-display text-[32px] font-medium leading-[1.2] tracking-[-0.02em] text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

// Body Text (Inter)
const BodyLG = forwardRef(function BodyLG({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('font-body text-lg leading-relaxed text-text-secondary', className)}
      {...props}
    >
      {children}
    </p>
  );
});

const BodyMD = forwardRef(function BodyMD({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('font-body text-[15px] leading-relaxed text-text-secondary', className)}
      {...props}
    >
      {children}
    </p>
  );
});

const BodySM = forwardRef(function BodySM({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('font-body text-[13px] leading-relaxed text-text-secondary', className)}
      {...props}
    >
      {children}
    </p>
  );
});

// Mono Text (JetBrains Mono)
const MonoStat = forwardRef(function MonoStat({ className, glow, children, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={clsx(
        'font-mono text-2xl font-semibold tracking-[-0.02em] tabular-nums text-text-primary',
        glow && 'text-blade-green text-glow-green',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

const MonoLabel = forwardRef(function MonoLabel({ className, color = 'muted', children, ...props }, ref) {
  const colorStyles = {
    muted: 'text-text-muted',
    green: 'text-blade-green',
    violet: 'text-coxswain-violet',
  };

  return (
    <span
      ref={ref}
      className={clsx(
        'font-mono text-[11px] font-medium tracking-[0.08em] uppercase',
        colorStyles[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

export {
  DisplayXL,
  DisplayLG,
  DisplayMD,
  BodyLG,
  BodyMD,
  BodySM,
  MonoStat,
  MonoLabel,
};
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/ui/Typography.jsx
git commit -m "feat(ui): add Typography components for display/body/mono"
```

---

## Phase 2 Complete Checkpoint

**Verify Phase 2:**

Run: `npm run dev`

Check:
- [ ] Button renders with glow underline (variant="glow")
- [ ] Card renders with gradient border (variant="glass")
- [ ] Input has inset shadow and green focus glow
- [ ] Typography components render with correct fonts
- [ ] Build succeeds: `npm run build`

---

## Phases 3-6: Summary

The remaining phases follow the same pattern. Each task has:
- Specific file path
- Step-by-step instructions
- Exact code to write
- Verification step
- Commit command

**Phase 3: Landing Page** (9 tasks)
- Hero section with 3D tilting card
- Navigation bar with scroll detection
- Social proof bar
- Bento grid with spotlight effect
- Data stream ticker
- Pricing section
- Final CTA
- Footer
- Assemble page

**Phase 4: Application Layout** (5 tasks)
- Sidebar (64px, icon-only)
- Topbar
- App layout structure
- Mobile responsive layout
- Page backgrounds

**Phase 5: Domain Components** (5 tasks)
- Athlete card with score ring
- Seat slot
- Boat shell view
- Athlete bank
- Lineup builder

**Phase 6: Polish** (4 tasks)
- Framer Motion variants
- Page transitions
- Reduced motion (already done)
- Performance audit

---

## Execution Ready

Plan saved to: `docs/plans/2026-01-19-rowlab-precision-instrument-plan.md`
