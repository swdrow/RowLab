# Phase 19-01: Penpot Design System Foundation - Implementation Specification

**Created:** 2026-01-28
**Status:** Ready for Manual Implementation
**Reason:** Penpot MCP tools not available in execution environment

## Overview

This document provides complete specifications for creating the Penpot Design System foundation manually. All color values, typography settings, and structural organization are defined to ensure exact match with Phase 17 Dark Editorial tokens.

## Project Structure

### Project Name
`RowLab Design System`

### Pages (Boards)

Create 5 pages in this exact order:

1. **01-Brand-Identity**
   - Purpose: Colors, typography, visual style foundation
   - Frames: Color-Palette, Typography-System, Visual-Style

2. **02-Component-Library**
   - Purpose: Reusable UI components
   - Frames: (to be added in future plans)

3. **03-Landing-Page**
   - Purpose: Landing page mockups
   - Frames: (to be added in future plans)

4. **04-App-UI-Dashboard**
   - Purpose: Application interface designs
   - Frames: (to be added in future plans)

5. **05-Design-Specs**
   - Purpose: Developer handoff documentation
   - Frames: (to be added in future plans)

### 01-Brand-Identity Frame Layout

Create three frames on the Brand-Identity page:

```
Frame: Color-Palette
Position: x=0, y=0
Size: 1920x1080
Purpose: Visual swatches of all color tokens

Frame: Typography-System
Position: x=2000, y=0
Size: 1920x1080
Purpose: Font style specimens

Frame: Visual-Style
Position: x=4000, y=0
Size: 1920x1080
Purpose: Imagery and design direction
```

## Color Palette - Library Assets

Create these colors as library assets using Penpot's Asset Libraries panel. Use slash notation for hierarchical organization (Penpot automatically creates groups).

### Inkwell Scale (Monochrome UI)

| Asset Name | Hex Value | Usage |
|------------|-----------|-------|
| Ink/Deep | #0A0A0A | Void/base background |
| Ink/Base | #121212 | Primary surface |
| Ink/Raised | #1A1A1A | Elevated surfaces |
| Ink/Float | #1F1F1F | Floating elements |
| Ink/Border | #262626 | Subtle borders |
| Ink/Border-Strong | #333333 | Emphasized borders |
| Ink/Muted | #404040 | Muted/disabled |
| Ink/Tertiary | #525252 | Tertiary text |
| Ink/Secondary | #737373 | Secondary text |
| Ink/Body | #A3A3A3 | Body text |
| Ink/Primary | #E5E5E5 | Primary text |
| Ink/Bright | #FAFAFA | Headlines, emphasis |

### Data Colors (Chromatic Elements)

| Asset Name | Hex Value | Usage |
|------------|-----------|-------|
| Data/Excellent | #22C55E | Above target |
| Data/Good | #3B82F6 | On target |
| Data/Warning | #F59E0B | Below target |
| Data/Poor | #EF4444 | Needs attention |

### Chart Palette (Multi-series Visualization)

| Asset Name | Hex Value | Usage |
|------------|-----------|-------|
| Chart/1 | #3B82F6 | Series 1 - Blue |
| Chart/2 | #8B5CF6 | Series 2 - Purple |
| Chart/3 | #06B6D4 | Series 3 - Cyan |
| Chart/4 | #F59E0B | Series 4 - Amber |
| Chart/5 | #EC4899 | Series 5 - Pink |
| Chart/6 | #10B981 | Series 6 - Emerald |

### Rowing Semantic Colors

| Asset Name | Hex Value | Usage |
|------------|-----------|-------|
| Rowing/Port | #DC2626 | Port side (red - maritime convention) |
| Rowing/Starboard | #16A34A | Starboard side (green - maritime convention) |
| Rowing/Water | #0EA5E9 | Water/erg contexts |
| Rowing/Gold | #CA8A04 | Achievement/PR highlights |

**Total Colors: 28**

## Typography System - Library Assets

Create these typography styles as library assets using Penpot's Asset Libraries panel.

### Display (Fraunces - Editorial Serif)

| Asset Name | Font Family | Size | Weight | Line Height | Usage |
|------------|-------------|------|--------|-------------|-------|
| Display/Hero | Fraunces | 72px | 600 | 1.1 | Landing page hero |
| Display/H1 | Fraunces | 48px | 600 | 1.15 | Page titles |
| Display/H2 | Fraunces | 36px | 600 | 1.2 | Section titles |
| Display/H3 | Fraunces | 24px | 600 | 1.25 | Subsection titles |

### Body (Inter - Clean Sans)

| Asset Name | Font Family | Size | Weight | Line Height | Usage |
|------------|-------------|------|--------|-------------|-------|
| Body/Large | Inter | 18px | 400 | 1.75 | Large body text |
| Body/Base | Inter | 15px | 400 | 1.5 | Standard body text |
| Body/Small | Inter | 13px | 400 | 1.5 | Small body text |
| Body/XS | Inter | 12px | 400 | 1.33 | Captions, metadata |

### Metric (Geist Mono - Data/Numbers)

**Note:** If Geist Mono is unavailable in Penpot, use **JetBrains Mono** as fallback.

| Asset Name | Font Family | Size | Weight | Line Height | Usage |
|------------|-------------|------|--------|-------------|-------|
| Metric/Hero | Geist Mono (or JetBrains Mono) | 72px | 600 | 1.1 | Large data displays |
| Metric/Large | Geist Mono (or JetBrains Mono) | 48px | 600 | 1.15 | Dashboard metrics |
| Metric/Medium | Geist Mono (or JetBrains Mono) | 24px | 500 | 1.25 | Inline data |
| Metric/Small | Geist Mono (or JetBrains Mono) | 13px | 500 | 1.25 | Table cells, small numbers |

### Label (Inter - UI Labels)

| Asset Name | Font Family | Size | Weight | Line Height | Usage |
|------------|-------------|------|--------|-------------|-------|
| Label/Large | Inter | 14px | 500 | 1.5 | Large labels |
| Label/Default | Inter | 13px | 500 | 1.5 | Standard labels |
| Label/Small | Inter | 11px | 500 | 1.33 | Small labels, tags |

**Total Typography Styles: 16**

## Visual Swatches (Color-Palette Frame)

Create visual representations of the color palette on the Color-Palette frame. Layout suggestion:

### Inkwell Scale Swatches
- Create 12 rectangles (200x100px each)
- Fill with corresponding Inkwell colors
- Add text label with color name and hex value
- Arrange in 3 rows of 4 columns
- Gap: 24px between swatches

### Data Colors Swatches
- Create 4 rectangles (200x100px each)
- Fill with Data colors
- Add labels with usage notes
- Arrange horizontally below Inkwell section

### Chart Palette Swatches
- Create 6 rectangles (150x100px each)
- Fill with Chart colors
- Add labels with series numbers
- Arrange horizontally below Data section

### Rowing Semantic Colors Swatches
- Create 4 rectangles (200x100px each)
- Fill with Rowing colors
- Add labels with maritime/rowing context
- Arrange horizontally at bottom

## Typography Specimens (Typography-System Frame)

Create text samples demonstrating each typography style on the Typography-System frame.

### Display Specimens
For each Display style, create text element with:
- Style name as label above
- Sample text: "The Crew"
- Technical specs below (font, size, weight, line-height)

### Body Specimens
For each Body style, create text element with:
- Style name as label
- Sample paragraph: "RowLab provides coaches with precision tools for data-driven lineup optimization. Track athlete performance, analyze seat racing results, and build winning combinations with confidence."
- Technical specs below

### Metric Specimens
For each Metric style, create text element with:
- Style name as label
- Sample data: "1:45.3" (split time) or "2147" (erg score)
- Technical specs below

### Label Specimens
For each Label style, create text element with:
- Style name as label
- Sample text: "STROKE RATE" or "ATHLETE NAME"
- Technical specs below

## Verification Checklist

After manual implementation in Penpot, verify:

- [ ] Project named "RowLab Design System" exists
- [ ] 5 pages created in correct order (01-Brand-Identity through 05-Design-Specs)
- [ ] 3 frames exist on Brand-Identity page with correct positioning
- [ ] 28 color assets exist in library with exact hex values
- [ ] 16 typography assets exist in library with correct specifications
- [ ] Color swatches visible on Color-Palette frame
- [ ] Typography specimens visible on Typography-System frame
- [ ] All colors match tailwind.config.js exactly (no drift)
- [ ] All fonts match Phase 17 design tokens

## Design System Principles (Reference)

When creating visual elements, follow these principles from Phase 17:

1. **Monochrome UI**: All UI chrome uses Inkwell grayscale palette
2. **Chromatic Data Only**: Color appears only in data visualization (Data, Chart, Rowing colors)
3. **Dark Editorial**: "A rowing publication printed on obsidian paper" aesthetic
4. **Precision Instrument**: Clean, technical, precise - inspired by SpeedCoach displays
5. **Warm Base**: Stone palette (#0F0F0F) provides warm near-black vs cool blacks
6. **Tabular Numbers**: All metric displays must use monospace fonts for alignment

## Next Steps

After this foundation is complete:
1. Phase 19-02 will add component library elements
2. Phase 19-03+ will create landing page and app UI mockups
3. All future work will reference these foundational color and typography assets

## Developer Handoff Notes

For implementation reference:
- Colors map to CSS variables in `tailwind.config.js` lines 24-257
- Typography maps to font configuration in `tailwind.config.js` lines 384-408
- All color hex values must match exactly - no approximation
- Geist Mono fallback to JetBrains Mono is acceptable (already in use for code blocks)
