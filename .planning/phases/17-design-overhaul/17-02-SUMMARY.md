---
phase: 17
plan: 02
subsystem: design-system
tags: [typography, fonts, css, design-tokens]

dependency_graph:
  requires: []
  provides:
    - "Inter font loaded via Google Fonts"
    - "Geist Mono font loaded via jsDelivr CDN"
    - "--font-display, --font-body, --font-mono, --font-metric CSS tokens"
    - "text-metric-xl, text-metric-lg, text-metric-md, text-metric-sm classes"
    - "tabular-nums utility class"
  affects:
    - "17-03: Component library rebuild"
    - "17-07: Landing page redesign"
    - "All components using typography tokens"

tech_stack:
  added:
    - "Inter font (Google Fonts)"
    - "Geist Mono font (jsDelivr CDN)"
  patterns:
    - "Rowing Instrument typography system"
    - "Precision metric display with tabular nums"

key_files:
  created: []
  modified:
    - "index.html"
    - "src/v2/styles/tokens.css"
    - "src/v2/styles/typography.css"

decisions:
  - id: "17-02-01"
    choice: "Inter for headings and body, Geist Mono for data"
    rationale: "Inter provides clean modern titles, Geist Mono gives stroke coach precision feel for numbers"
  - id: "17-02-02"
    choice: "Geist Mono from jsDelivr CDN instead of Google Fonts"
    rationale: "Geist Mono is Vercel's font not on Google Fonts, jsDelivr CDN provides official package"
  - id: "17-02-03"
    choice: "Legacy font fallbacks preserved"
    rationale: "Backward compatibility for any components still referencing Space Grotesk or DM Sans"
  - id: "17-02-04"
    choice: "All metric classes use tabular-nums"
    rationale: "Ensures number alignment in tables and metrics like a SpeedCoach display"

metrics:
  duration: "~5 minutes"
  completed: "2026-01-27"
---

# Phase 17 Plan 02: Typography System Summary

**One-liner:** Rowing Instrument typography with Inter for display/body and Geist Mono for precision data numbers

## What Was Done

### Task 1: Font Loading in index.html
Added Google Fonts preconnect and stylesheet links for the new typography system:
- Inter font with weights 400, 500, 600, 700, 900 (including Black for large metrics)
- Geist Mono from jsDelivr CDN for stroke coach precision numbers
- Preserved legacy fonts (Space Grotesk, DM Sans, JetBrains Mono) for backward compatibility

### Task 2: Font Tokens in tokens.css
Updated the font tokens to use the new Rowing Instrument typography:
- `--font-display`: Inter for clean, modern titles
- `--font-body`: Inter for readable content
- `--font-mono`: Geist Mono for stroke coach precision numbers
- `--font-metric`: New token for large hero numbers
- Legacy fallback tokens for backwards compatibility

### Task 3: Metric Typography Classes in typography.css
Added new typography classes for the "stroke coach" data display aesthetic:

| Class | Size | Use Case |
|-------|------|----------|
| `.text-metric-xl` | 72px | Hero numbers (boat speed, 2k time) |
| `.text-metric-lg` | 48px | Secondary metrics (split, rate) |
| `.text-metric-md` | 32px | Dashboard widgets |
| `.text-metric-sm` | 24px | Inline stats |
| `.text-data-lg` | 18px | Data table numbers |
| `.tabular-nums` | - | Utility for number alignment |

All metric classes include:
- `font-variant-numeric: tabular-nums` for proper number alignment
- Tight letter-spacing for precision feel
- Responsive scaling for mobile screens

## Commits

| Hash | Message |
|------|---------|
| f1b14b0 | feat(17-02): add Inter and Geist Mono font imports |
| 7d11cee | feat(17-02): update font tokens for Rowing Instrument typography |
| 08c88d6 | feat(17-02): add metric typography classes for stroke coach display |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Font Loading Strategy
- Preconnect hints for faster font loading
- `display=swap` ensures text remains visible during font load
- Legacy fonts kept as fallbacks to prevent any visual regressions

### Typography Hierarchy
```
Large Metrics (Inter Black/Bold):
  72px → 48px → 32px → 24px

Data Numbers (Geist Mono):
  18px (text-data-lg) → 16px (text-data)

All numeric classes use tabular-nums for alignment
```

### Responsive Behavior
Mobile breakpoint (< 768px) scales metrics proportionally:
- 72px → 48px
- 48px → 36px
- 32px → 24px
- 24px → 20px

## Next Phase Readiness

Typography system is ready for:
- Component library rebuild (17-03)
- Dashboard widgets with metric displays
- Data tables with aligned numbers
- Landing page redesign (17-07)

No blockers or concerns identified.
