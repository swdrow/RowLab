# RowLab Generative Art Implementation Design

## Overview
Add generative art elements to RowLab to create a more professional, technical aesthetic that feels "alive" and "wired to data" while maintaining the Precision Instrument design philosophy.

## Technology Decision

### Use Three.js/R3F (Already Installed)
- **Rationale**: R3F (`@react-three/fiber`, `@react-three/drei`) is already in the bundle for Boat3DPage
- **Benefits**: No bundle bloat, performant WebGL rendering, shader support
- **Avoid**: p5.js would add ~800kb and a different rendering paradigm

### Hybrid Approach
| Effect Type | Technology | Reason |
|-------------|------------|--------|
| Hero mesh gradient | R3F + GLSL shader | Most performant, smooth animations |
| Dashboard field lines | SVG + CSS animation | Lightweight, GPU-accelerated |
| Organic blobs | Framer Motion + CSS | Zero deps, border-radius morph |
| Loading spinner | R3F 3D wireframe | Reinforces tech aesthetic |
| Card effects | Keep current CSS | WebGL per-card is expensive |

## Implementation Locations (Priority Order)

### 1. Landing Hero Background (HIGH IMPACT)
**Current**: Static radial gradients (`LandingPage.jsx` lines 69-82)
**Upgrade**: Interactive Aurora shader with mouse reactivity

**Approach**:
- Full-screen R3F `<Canvas>` behind hero content
- Custom `ShaderMaterial` with simplex noise
- Colors from design tokens (blade-blue, violet, cyan)
- Subtle mouse position influence via `uMouse` uniform
- Performance: Single draw call, ~2ms GPU time

### 2. Dashboard Ambient Background (MEDIUM IMPACT)
**Current**: Fixed glow div (`Dashboard.jsx` line 113)
**Upgrade**: Data flow field lines

**Approach**:
- SVG `<path>` elements with sine wave curves
- CSS `stroke-dashoffset` animation for flow effect
- Horizontal orientation (boat/water metaphor)
- 4-6 paths at low opacity (0.05-0.08)
- Performance: Pure CSS, no JS loop needed

### 3. Empty States (MEDIUM IMPACT)
**Locations**: AthletesPage, RegattaList, LineupBoard empty state
**Upgrade**: Morphing organic blob backgrounds

**Approach**:
- Framer Motion animating `borderRadius` property
- No SVG path generation needed (pure CSS)
- Color matches context (blue for main, cyan for analytics)
- Blur filter for glow effect
- Performance: CSS transforms only, <1ms

### 4. Loading Spinner Enhancement (LOW IMPACT)
**Current**: Dual ring spinner (`LoadingFallback.tsx`)
**Upgrade**: 3D Data Orb wireframe

**Approach**:
- R3F `<Icosahedron>` with wireframe material
- Gentle breathing (scale) + rotation animation
- Emissive blade-blue color
- Only shows after 1s delay (avoid flash)
- Performance: Single geometry, minimal overhead

## Component Architecture

```
/src/components/Generative/
├── AuroraBackground.tsx    # R3F hero shader
├── FieldLines.tsx          # SVG dashboard flow
├── OrganicBlob.tsx         # CSS border-radius blob
├── DataOrb.tsx             # R3F loading wireframe
├── SceneContainer.tsx      # Shared R3F Canvas wrapper
└── shaders/
    └── aurora.glsl         # Simplex noise shader
```

## Design Token Integration

Add to `/src/styles/design-tokens.css`:
```css
:root {
  /* Generative Art */
  --generative-speed-slow: 15s;
  --generative-speed-medium: 10s;
  --generative-speed-fast: 5s;
  --generative-intensity: 0.12;
  --generative-noise-opacity: 0.03;
}
```

## Performance Constraints

1. **60fps minimum**: All effects must maintain smooth animation
2. **Mobile fallback**: Disable R3F on `(hover: none)` devices
3. **Reduced motion**: Respect `prefers-reduced-motion` preference
4. **Bundle size**: Target <5KB added (using existing deps)

## Accessibility Requirements

- All generative elements: `aria-hidden="true"`
- Reduced motion: Static fallback (no animation)
- Touch devices: Simplified/disabled effects
- No flashing content (photosensitive safety)

## Implementation Phases

### Phase 1: Foundation + Hero (Day 1)
- Create `/src/components/Generative/` structure
- Build `AuroraBackground.tsx` with R3F shader
- Integrate into `LandingPage.jsx`
- Add reduced motion + mobile fallbacks
- Performance audit

### Phase 2: Dashboard + Empty States (Day 2)
- Build `FieldLines.tsx` (SVG + CSS)
- Build `OrganicBlob.tsx` (Framer Motion)
- Integrate into Dashboard
- Add to all empty state locations
- Test performance across pages

### Phase 3: Loading + Polish (Day 3)
- Build `DataOrb.tsx` (R3F wireframe)
- Replace `LoadingFallback.tsx` spinner
- Add noise texture overlay to key pages
- Final performance audit
- Cross-browser testing

## Success Criteria

- [ ] Hero feels "alive" without being distracting
- [ ] Dashboard has subtle data flow ambiance
- [ ] Empty states feel inviting, not dead
- [ ] Loading communicates "working hard"
- [ ] No Lighthouse regression (>90 score)
- [ ] 60fps on mid-tier devices
- [ ] Reduced motion fully supported

## Code Examples

### Aurora Shader (Simplex Noise)
```glsl
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uColor1; // blade-blue
uniform vec3 uColor2; // violet
uniform vec3 uColor3; // cyan

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float noise = snoise(vec3(uv * 3.0, uTime * 0.1));
  vec3 color = mix(uColor1, uColor2, noise);
  color = mix(color, uColor3, snoise(vec3(uv * 2.0 + 10.0, uTime * 0.15)));
  gl_FragColor = vec4(color, 0.12);
}
```

### Organic Blob (CSS + Framer Motion)
```tsx
<motion.div
  className="absolute w-80 h-80 opacity-50 blur-[60px]"
  style={{ backgroundColor: color }}
  animate={{
    borderRadius: [
      "60% 40% 30% 70% / 60% 30% 70% 40%",
      "30% 60% 70% 40% / 50% 60% 30% 60%",
      "60% 40% 30% 70% / 60% 30% 70% 40%",
    ],
  }}
  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
/>
```

### Field Lines (SVG + CSS)
```tsx
<svg className="absolute inset-0">
  {[...Array(5)].map((_, i) => (
    <path
      key={i}
      d={`M 0 ${50 + i * 100} Q 500 ${30 + i * 100} 1000 ${50 + i * 100}`}
      stroke="rgba(0, 112, 243, 0.05)"
      strokeWidth="1"
      fill="none"
      className="animate-flow"
    />
  ))}
</svg>

<style>
@keyframes flow {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}
.animate-flow {
  stroke-dasharray: 20 10;
  animation: flow 12s linear infinite;
}
</style>
```

## Questions Resolved

1. **Three.js vs p5.js?** → Use Three.js (already installed)
2. **Mesh gradient approach?** → R3F shader for hero, CSS for simpler effects
3. **Blob generation?** → CSS border-radius morph (no SVG path math needed)
4. **Card hover effects?** → Keep current CSS (avoid WebGL per-card)
5. **Loading enhancement?** → 3D wireframe orb with R3F
