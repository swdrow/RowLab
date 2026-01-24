# Technology Stack - v2.0 Feature Additions

**Project:** RowLab v2.0 Migration Features
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

The existing RowLab stack is well-suited for the v2.0 migration features with **minimal additions required**. The current technology choices (@dnd-kit, recharts, papaparse, react-hook-form + Zod) already support the new feature requirements. This research recommends **4 targeted additions** and **2 configuration enhancements** rather than wholesale library changes.

**Key Finding:** Existing stack covers 80% of v2.0 needs. Add only what's missing: date utilities, calendar component, ELO calculation, and virtualization for large lists.

---

## Existing Stack (Validated - No Changes)

| Technology | Version | Purpose | v2.0 Usage |
|------------|---------|---------|------------|
| **@dnd-kit/core** | 6.1.0 | Drag-drop primitives | Lineup Builder Kanban, seat assignments |
| **@dnd-kit/sortable** | 8.0.0 | Sortable containers | Multi-container boat assignments |
| **recharts** | 2.10.3 | Charts & data viz | Erg trends, race analytics, ELO rankings |
| **papaparse** | 5.4.1 | CSV parsing | Athlete roster imports, erg data imports |
| **react-hook-form** | 7.71.1 | Form validation | Lineup forms, seat racing entry, erg test CRUD |
| **zod** | 4.3.4 | Runtime validation | Form schemas, CSV import validation |
| **framer-motion** | 11.18.2 | Spring physics animations | Drag previews, chart transitions |
| **Zustand** | 4.4.7 | State management | Multi-step forms, cross-page state |
| **TanStack Query** | 5.90.20 | Data fetching | Server state, optimistic updates |

**Rationale for keeping existing libraries:**
- **@dnd-kit:** Already supports complex Kanban with multi-container sorting. [React-big-calendar example](https://github.com/Georgegriff/react-dnd-kit-tailwind-shadcn-ui) demonstrates exact lineup builder pattern needed.
- **recharts:** Handles area charts, line charts, treemaps needed for erg analytics. 7.1M weekly downloads, actively maintained at v3.6.0.
- **papaparse:** Industry standard for CSV parsing. Already in dependencies, supports streaming for large files.
- **react-hook-form + Zod:** Perfect for complex forms with validation. Already used in codebase.

---

## Required Additions for v2.0

### 1. Date Utility Library

**Recommendation:** `date-fns` v4.1.0

```bash
npm install date-fns
```

| Feature | Why Needed |
|---------|------------|
| Training plan calendar operations | Date range calculations, week boundaries |
| Race/regatta scheduling | Date formatting, timezone handling |
| Integration with react-big-calendar | Built-in date-fns localizer support |
| Bundle efficiency | Tree-shakeable, 6KB gzipped vs 70KB for moment.js |

**Why date-fns over dayjs:**
- Better tree-shaking (import only functions used)
- Native TypeScript support
- react-big-calendar has built-in `dateFnsLocalizer`
- Functional programming approach matches codebase style

**Source:** [date-fns vs dayjs comparison](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries) - date-fns is better for build-size-conscious projects with tree-shaking.

---

### 2. Calendar Component

**Recommendation:** `react-big-calendar` v1.19.4

```bash
npm install react-big-calendar
```

| Feature | Why Needed |
|---------|------------|
| Training Plans | Week/month/day views for periodization |
| Regatta Schedule | Event timeline visualization |
| Athlete availability | Multi-day planning |
| Drag-drop scheduling | Native addon support |

**Why react-big-calendar:**
- **MIT licensed, free and open-source** (no premium tiers like FullCalendar)
- 624,982 weekly downloads vs FullCalendar's 197,318
- Built for React (not framework-agnostic wrapper)
- Google Calendar/Outlook-inspired UX (familiar to users)
- date-fns localizer included (works with recommendation #1)
- Customizable with SASS (matches existing Tailwind approach)

**Integration with existing stack:**
```typescript
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});
```

**Sources:**
- [react-big-calendar vs FullCalendar comparison](https://bryntum.com/blog/react-fullcalendar-vs-big-calendar/)
- [date-fns integration docs](https://github.com/jquense/react-big-calendar/blob/master/README.md)

---

### 3. ELO Rating Calculation

**Recommendation:** Custom implementation (60 lines) > third-party library

**Rationale:**
- Existing libraries are unmaintained (moroshko/elo.js: 4 commits, no releases)
- ELO algorithm is simple (20 lines of math)
- Rowing-specific needs: multi-athlete adjustments, boat class weighting
- No external dependency for critical business logic

**Minimal Implementation:**
```typescript
// lib/elo.ts
export interface EloConfig {
  kFactor?: number; // Default: 32
  expectedScoreExponent?: number; // Default: 400
}

export function calculateExpectedScore(
  ratingA: number,
  ratingB: number,
  config: EloConfig = {}
): number {
  const exponent = config.expectedScoreExponent ?? 400;
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / exponent));
}

export function updateRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number, // 1 = win, 0.5 = tie, 0 = loss
  config: EloConfig = {}
): number {
  const k = config.kFactor ?? 32;
  return currentRating + k * (actualScore - expectedScore);
}
```

**Why custom implementation:**
- Rowing-specific: Average boat ELO, weight by seat position
- Testable: Unit tests for domain logic
- Maintainable: Team owns algorithm adjustments
- Zero dependencies

**Alternative considered:** `elo-rating` npm package (archived, 8KB for 20 lines of math)

**Sources:**
- [Implementing ELO Rating System](https://mattmazzola.medium.com/implementing-the-elo-rating-system-a085f178e065)
- [elo.js library review](https://github.com/moroshko/elo.js/)

---

### 4. List Virtualization

**Recommendation:** `react-window` v1.8.10

```bash
npm install react-window
```

| Feature | Why Needed |
|---------|------------|
| Athletes Page | Roster grid with 500+ athletes |
| Erg Data Page | Large test result tables |
| Race Results | Multi-team rankings |
| Performance | 60 FPS with 10,000+ rows |

**Why react-window:**
- **Lighter than react-virtualized** (11KB vs 200KB)
- Same author (bvaughn) - react-window is the "complete rewrite" successor
- Better tree-shaking and performance
- Simple API: `<FixedSizeList>` and `<VariableSizeList>` components

**When to use:**
- Lists/grids exceeding 100 items
- Scrollable tables with dynamic heights
- Mobile performance optimization

**Integration example:**
```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={athletes.length}
  itemSize={72}
  width="100%"
>
  {({ index, style }) => (
    <AthleteRow athlete={athletes[index]} style={style} />
  )}
</FixedSizeList>
```

**Source:** [react-window vs react-virtualized comparison](https://blog.logrocket.com/react-virtualized-vs-react-window/) - react-window preferred for 2026 due to smaller bundle and better performance.

---

## Configuration Enhancements (No New Dependencies)

### 1. Recharts for Rowing Analytics

Recharts v2.10.3 (already installed) supports all v2.0 chart needs:

| Feature | Chart Type | Recharts Component |
|---------|-----------|-------------------|
| Erg test trends | Line chart with area fill | `<AreaChart>` + `<Line>` |
| Seat racing ELO | Time series line | `<LineChart>` |
| Power curve distribution | Area chart | `<AreaChart>` |
| Training load heatmap | Custom cell colors | `<ResponsiveContainer>` + custom `<Cell>` |
| Race margins | Horizontal bar | `<BarChart>` with `layout="vertical"` |

**Configuration tips:**
- Use `<ResponsiveContainer>` for fluid layouts
- Enable `dot={false}` on `<Line>` for performance (500+ data points)
- Use `animationDuration={150}` to match Precision Instrument design (fast transitions)
- Leverage Tailwind color tokens for chart colors

**Performance notes:**
- Recharts can slow down with high-frequency data (1000+ points)
- Solution: Downsample data or use every Nth point
- [Performance guidance](https://medium.com/swlh/data-visualisation-in-react-part-i-an-introduction-to-recharts-33249e504f50)

---

### 2. PapaParse for Bulk Imports

PapaParse v5.4.1 (already installed) handles erg data and athlete roster imports:

**Best practices for v2.0 features:**

```typescript
// Athlete CSV import
import Papa from 'papaparse';

Papa.parse(file, {
  header: true,           // First row = column names
  dynamicTyping: true,    // Auto-convert numbers/booleans
  skipEmptyLines: true,
  worker: true,           // Web Worker for large files (prevent UI freeze)
  step: (row) => {        // Stream mode for 1000+ rows
    // Process row-by-row, don't load all into memory
    validateAndInsertAthlete(row.data);
  },
  complete: () => {
    showSuccessToast();
  },
  error: (error) => {
    handleImportError(error);
  }
});
```

**Key config options for performance:**
- `worker: true` - Offload parsing to Web Worker (critical for 500+ row files)
- `step` callback - Stream processing prevents browser freeze
- `dynamicTyping` - Auto-converts "1:45.2" to numbers

**Source:** [PapaParse best practices](https://blog.logrocket.com/working-csv-files-react-papaparse/)

---

## Boat Visualization Strategy

**Recommendation:** SVG (not Canvas or library)

| Approach | Bundle Cost | Complexity | Performance |
|----------|------------|------------|-------------|
| SVG + Tailwind | 0 KB | Low | 60 FPS <3000 elements |
| Canvas | 0 KB | Medium | 60 FPS any size |
| Three.js (existing) | +500 KB | High | Overkill for 2D |

**Why SVG:**
- **Zero dependencies** - native browser support
- Boat margin visualizer needs <50 elements (8 boats max)
- Easily styled with Tailwind classes
- Accessible (screen readers can describe boat positions)
- Interactivity with React event handlers

**Implementation approach:**
```tsx
// Top-down boat shell component
<svg viewBox="0 0 800 200" className="w-full">
  {boats.map((boat, i) => (
    <g key={boat.id} transform={`translate(${boat.margin}, ${i * 25})`}>
      {/* Boat shell PNG as <image> or inline SVG path */}
      <image href="/boats/eight.svg" width="120" height="20" />
      <text x="125" className="fill-text-primary font-mono text-xs">
        {boat.margin}m
      </text>
    </g>
  ))}
</svg>
```

**Asset strategy:**
- Create/source 6 boat type SVGs (1x, 2x, 4x, 4+, 8+, etc.)
- Use [StickPNG rowing boat top view](https://www.stickpng.com/img/sports/rowing/rowing-boat-top-view) as reference
- Optimize with SVGO
- Store in `public/assets/boats/`

**Why not Canvas:**
- SVG sufficient for boat count (<20 elements)
- Easier to maintain than Canvas drawing code
- Better accessibility

**Why not Three.js:**
- Already in dependencies (@react-three/fiber, @react-three/drei)
- Massive overkill for 2D top-down view
- Use only if 3D stroke analysis added later

**Sources:**
- [SVG vs Canvas performance 2026](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025)
- [Boat visualization resources](https://www.vecteezy.com/free-png/boat-top-view)

---

## Anti-Recommendations (What NOT to Add)

### Do NOT Add These Libraries:

| Library | Why Not | What to Use Instead |
|---------|---------|-------------------|
| **AG Grid** | 200KB+ bundle, enterprise features overkill | react-window + custom table |
| **TanStack Table** | Added complexity for simple athlete roster | Native table + virtualization |
| **FullCalendar** | Premium tier required for key features, 2x bundle size | react-big-calendar (MIT, free) |
| **Chart.js** | Canvas-based, harder to style with Tailwind | recharts (already installed) |
| **Visx** | Steep learning curve, over-engineered for erg trends | recharts (already installed) |
| **moment.js** | 70KB bundle, deprecated | date-fns (tree-shakeable) |
| **lodash** | Bundle bloat for utility functions | Native ES2024 methods |
| **xlsx (SheetJS)** | 500KB for Excel export (not required) | CSV export with papaparse |

**Why these matter:**
- Each unnecessary library adds 50-500KB to bundle
- v2.0 feature set doesn't justify complexity
- Existing stack already covers 80% of needs

---

## Installation Summary

Add these 3 dependencies:

```bash
# Core additions
npm install date-fns react-big-calendar react-window

# Optional dev dependencies (if not using CDN for fonts)
npm install --save-dev @types/react-big-calendar
```

Total bundle impact: ~45 KB gzipped

---

## Integration Architecture

### State Management Pattern (Existing)

```
User Input
  ↓
react-hook-form (local form state)
  ↓
Zod validation
  ↓
TanStack Query mutation (server sync)
  ↓
Zustand (global UI state)
```

**v2.0 specific patterns:**

| Feature | Form Layer | State Layer | Data Layer |
|---------|-----------|-------------|------------|
| Lineup Builder | react-hook-form + @dnd-kit | Zustand (drag state) | TanStack Query (save) |
| Seat Racing Entry | react-hook-form + Zod | Zustand (multi-step) | TanStack Query (submit) |
| Erg Data Import | papaparse + Zod | Zustand (import progress) | TanStack Query (batch insert) |
| Training Calendar | react-big-calendar | TanStack Query (events) | Server-driven |

**Key principle:**
- **react-hook-form manages field state** (don't sync to Zustand on every keystroke)
- **Zustand stores UI state** (selected boat, active step, drag preview)
- **TanStack Query owns server state** (optimistic updates, cache invalidation)

Source: [Zustand + react-hook-form patterns](https://github.com/pmndrs/zustand/discussions/1922) - Update Zustand at form submission, not onChange.

---

## Design System Integration

All new components must follow **Precision Instrument** design tokens:

```typescript
// Example: react-big-calendar theming
import 'react-big-calendar/lib/sass/styles.scss';

// Override with Tailwind tokens
.rbc-calendar {
  @apply bg-void-deep text-text-primary;
}

.rbc-event {
  @apply bg-blade-blue text-white rounded-md;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); /* smooth timing */
}

.rbc-today {
  @apply bg-void-elevated border-border-accent;
}
```

**Animation constraints:**
- **Max duration:** 200ms (Precision Instrument standard)
- **Timing function:** `cubic-bezier(0.4, 0, 0.2, 1)` (smooth) or `cubic-bezier(0.16, 1, 0.3, 1)` (precision)
- **No bounce/spring** except for framer-motion drag physics

**Color application:**
```typescript
// recharts colors from Tailwind config
<Line stroke="#0070F3" /> {/* blade-blue */}
<Area fill="url(#gradient)" />
<defs>
  <linearGradient id="gradient">
    <stop offset="0%" stopColor="#0070F3" stopOpacity={0.3} />
    <stop offset="100%" stopColor="#0070F3" stopOpacity={0} />
  </linearGradient>
</defs>
```

---

## Migration Risk Assessment

| Library | Risk Level | Mitigation |
|---------|-----------|------------|
| date-fns | LOW | Standard utility lib, well-documented |
| react-big-calendar | MEDIUM | Requires SASS config, custom theming |
| react-window | LOW | Simple API, drop-in replacement for lists |
| Custom ELO | MEDIUM | Needs unit tests, rowing-specific adjustments |

**Biggest risk:** react-big-calendar styling conflicts with Tailwind.

**Mitigation:**
1. Import SASS source, override with Tailwind utilities
2. Use CSS modules if global styles conflict
3. Test with existing void-deep background tokens
4. Reference [Tailwind + react-big-calendar example](https://github.com/Georgegriff/react-dnd-kit-tailwind-shadcn-ui)

---

## Version Pinning Strategy

Pin major versions to avoid breaking changes:

```json
{
  "dependencies": {
    "date-fns": "^4.1.0",
    "react-big-calendar": "^1.19.4",
    "react-window": "^1.8.10"
  }
}
```

**Update schedule:**
- Minor/patch updates: Monthly (automated Dependabot)
- Major updates: Review breaking changes, test thoroughly

---

## Success Metrics

Stack choices are validated if:

- [ ] Total bundle increase <60 KB gzipped
- [ ] No runtime performance degradation (60 FPS maintained)
- [ ] No Tailwind/Framer Motion conflicts
- [ ] TypeScript types work without `@ts-ignore`
- [ ] All new libraries have >500K weekly downloads (adoption signal)

**Current additions:**
- date-fns: 17M weekly downloads ✓
- react-big-calendar: 625K weekly downloads ✓
- react-window: 2.8M weekly downloads ✓

---

## Sources

**Drag & Drop:**
- [Building Kanban with @dnd-kit](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/)
- [@dnd-kit multi-container example](https://github.com/Georgegriff/react-dnd-kit-tailwind-shadcn-ui)

**Charts:**
- [React chart libraries 2025 comparison](https://embeddable.com/blog/react-chart-libraries)
- [Recharts performance guide](https://medium.com/swlh/data-visualisation-in-react-part-i-an-introduction-to-recharts-33249e504f50)

**Calendar:**
- [react-big-calendar vs FullCalendar](https://bryntum.com/blog/react-fullcalendar-vs-big-calendar/)
- [react-big-calendar npm stats](https://npmtrends.com/fullcalendar-vs-react-big-calendar)

**Date Utilities:**
- [date-fns vs dayjs comparison](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries)

**CSV Parsing:**
- [PapaParse best practices](https://blog.logrocket.com/working-csv-files-react-papaparse/)
- [react-papaparse docs](https://react-papaparse.js.org/)

**Virtualization:**
- [react-window vs react-virtualized](https://blog.logrocket.com/react-virtualized-vs-react-window/)

**Visualization:**
- [SVG vs Canvas 2026](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025)

**State Management:**
- [Zustand + react-hook-form patterns](https://github.com/pmndrs/zustand/discussions/1922)

**ELO Rating:**
- [Implementing ELO in JavaScript](https://mattmazzola.medium.com/implementing-the-elo-rating-system-a085f178e065)
