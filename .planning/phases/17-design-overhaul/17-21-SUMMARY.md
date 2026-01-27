# 17-21 Summary: Feature Preview Components

**Status:** COMPLETE
**Executed:** 2026-01-27

## What Was Built

### Preview Components Created

1. **LineupPreview.tsx** (`src/v2/components/landing/LineupPreview.tsx`)
   - SVG-based boat diagram showing a 4+ shell
   - Seat slots labeled B, 2, 3, S, C
   - Animated "dragged" athlete indicator with dashed border
   - Floating "J. Smith" card with rotation

2. **MetricPreview.tsx** (`src/v2/components/landing/MetricPreview.tsx`)
   - Demonstrates "chromatic data" principle
   - Shows split (1:42.3), meters (6,247), stroke rate (28)
   - Uses data-good and data-excellent semantic colors
   - Monospace tabular-nums for aligned digits

3. **CalendarPreview.tsx** (`src/v2/components/landing/CalendarPreview.tsx`)
   - Mini week view calendar
   - Shows M T W T F S S day labels
   - Training sessions indicated with highlighted cells
   - Subtle border differentiation

4. **RankingPreview.tsx** (`src/v2/components/landing/RankingPreview.tsx`)
   - Condensed Bradley-Terry rankings display
   - Shows top 3 athletes with ratings
   - Uses data-good color for rating values
   - Monospace typography for numbers

### Integration
- All previews exported from `src/v2/components/landing/index.ts`
- Integrated into LandingPage.tsx bento tiles:
  - Lineup Builder tile → LineupPreview
  - Smart Seat Racing tile → RankingPreview
  - Training Calendar tile → CalendarPreview
  - Erg Data tile → MetricPreview

## Verification Results
- [x] LineupPreview contains "boat|seat" (boat diagram with seat slots)
- [x] MetricPreview contains "data-good|data-excellent" (chromatic colors)
- [x] LineupPreview exported from index.ts
- [x] MetricPreview exported from index.ts
- [x] LineupPreview used in LandingPage.tsx
- [x] MetricPreview used in LandingPage.tsx

## Design Principles Applied
- **Chromatic Data**: Only metrics have color (data-good, data-excellent)
- **Monochrome UI**: All chrome is grayscale (ink-* tokens)
- **Lightweight**: SVG and CSS-based, no heavy images
- **Subtle Animation**: Only the LineupPreview has pulse animation
