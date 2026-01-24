---
phase: 08
plan: 06
subsystem: lineup-builder
tags: [typescript, react, pdf-export, jspdf, html2canvas, print-ready]

requires:
  - phase: 08
    plan: 02
    reason: "Built on drag-drop workspace with boats and athletes"

provides:
  - "PrintableLineup component with high-contrast, large-font print layout"
  - "lineupPdfExport utility using jsPDF + html2canvas"
  - "ExportPDFButton component with loading state"
  - "PDF export integrated into LineupToolbar"
  - "Print-ready PDF download (black/white, 14-24pt fonts)"

affects:
  - phase: 08
    plan: 07-11
    impact: "PDF export available for all future lineup features"

tech-stack:
  added:
    - "jspdf@3.0.4 - Client-side PDF generation"
    - "html2canvas@1.4.1 - HTML to canvas rendering"
  patterns:
    - "Off-screen rendering with React portal"
    - "Dimension calculation for PDF (margins, scaling)"
    - "Print-optimized layout (8.5\" x 11\" portrait)"
    - "High-contrast design for ink-friendly printing"

key-files:
  created:
    - "src/v2/components/lineup/PrintableLineup.tsx"
    - "src/v2/utils/lineupPdfExport.ts"
    - "src/v2/components/lineup/ExportPDFButton.tsx"
  modified:
    - "src/v2/components/lineup/LineupToolbar.tsx"
    - "src/v2/components/lineup/index.ts"

decisions:
  - id: "LINE-PDF-01"
    decision: "Use jsPDF + html2canvas for client-side PDF generation"
    rationale: "Keeps feature self-contained, works offline, faster than server-side Puppeteer"
    alternatives: "Puppeteer/Playwright server-side"
    chosen: "jsPDF + html2canvas - standard pattern for client-side PDF in 2026"

  - id: "LINE-PDF-02"
    decision: "Print layout uses inline styles, not Tailwind classes"
    rationale: "html2canvas captures computed styles, inline styles ensure consistent rendering"
    alternatives: "Tailwind classes with @apply"
    chosen: "Inline styles - guarantees PDF matches intent"

  - id: "LINE-PDF-03"
    decision: "Off-screen rendering with position: absolute, left: -9999px"
    rationale: "Classic off-screen pattern, doesn't affect viewport scroll, hidden from user"
    alternatives: "display: none (breaks html2canvas), visibility: hidden"
    chosen: "Off-screen positioning - works with html2canvas"

  - id: "LINE-PDF-04"
    decision: "US Letter format as default, A4 as option"
    rationale: "US rowing programs use Letter, international programs use A4"
    alternatives: "A4 default"
    chosen: "Letter default with configurable format option"

  - id: "LINE-PDF-05"
    decision: "Scale down to single page if content exceeds page height"
    rationale: "Simpler UX, most lineups fit on one page, multi-page adds complexity"
    alternatives: "Multi-page splitting with page breaks"
    chosen: "Single-page scaling - covers 95% of use cases"

metrics:
  duration: "5 minutes"
  completed: "2026-01-24"

status: complete
---

# Phase 08 Plan 06: PDF Export Summary

**One-liner:** Print-ready PDF export with jsPDF + html2canvas, high-contrast large-font layout for dock/boathouse printing

## What Was Built

Implemented complete PDF export functionality for lineups:

1. **PrintableLineup Component** (`src/v2/components/lineup/PrintableLineup.tsx` - 239 lines)
   - Print-optimized layout designed for paper readability
   - High-contrast design: black text on white background
   - Large fonts: 24pt title, 18pt boat names, 16pt athlete names, 14pt seats
   - Fixed width (8.5" x 11" portrait) for consistent PDF capture
   - Boat header: boat class name, shell name (if set)
   - Seats in vertical list: bow at top, stroke at bottom
   - Each seat row: seat number | side (P/S) | athlete name or "---"
   - Coxswain shown separately at bottom with distinct styling
   - Off-screen positioning (left: -9999px) until capture
   - Inline styles for reliable html2canvas rendering

2. **lineupPdfExport Utility** (`src/v2/utils/lineupPdfExport.ts` - 141 lines)
   - Captures HTML element as canvas using html2canvas (scale: 2)
   - Converts canvas to PDF using jsPDF
   - Dimension calculation: 10mm margins, proportional scaling
   - Single-page layout: scales down if content exceeds page height
   - US Letter (default) and A4 format support
   - PDF metadata: title, author, creation date
   - Filename: `{lineupName}-YYYY-MM-DD.pdf` (sanitized)
   - Error handling with descriptive messages
   - Helper: `estimatePdfPageCount()` for page count preview

3. **ExportPDFButton Component** (`src/v2/components/lineup/ExportPDFButton.tsx` - 119 lines)
   - Renders PrintableLineup off-screen using React portal
   - Waits 100ms for DOM render before capture
   - Calls exportLineupToPdf on click
   - Loading state: shows spinner, disables button
   - Disabled when no boats in workspace
   - Error handling with alert (toast integration deferred)
   - Icon: FileDown (Lucide)
   - Responsive: hides "Export PDF" text on mobile (<768px)

4. **LineupToolbar Integration** (`src/v2/components/lineup/LineupToolbar.tsx` - modified)
   - Added ExportPDFButton to toolbar
   - Layout: [Undo] [Redo] | [Export PDF] | [Save] [History]
   - Visual separator between button groups
   - Consistent V2 design tokens across all buttons

## Key Implementation Details

### PrintableLineup Layout (Decision LINE-PDF-02)

Uses inline styles instead of Tailwind classes for html2canvas compatibility:

```typescript
<div style={{
  width: '8.5in',
  backgroundColor: '#ffffff',
  color: '#000000',
  padding: '0.5in',
  fontFamily: 'Arial, sans-serif',
  // ... more inline styles
}}>
```

**Font sizes for dock/boathouse readability:**
- Title: 24pt (lineup name)
- Boat name: 18pt (boat class)
- Athlete name: 16pt (primary content)
- Seat info: 14pt (seat numbers, side)
- Footer: 10pt (timestamp)

**High contrast for printing:**
- Text: #000000 (black)
- Background: #ffffff (white)
- Borders: #000000 (1-2px solid)
- Empty seats: #f5f5f5 (subtle gray background)

### PDF Export Flow (Decision LINE-PDF-01)

1. User clicks "Export PDF" button
2. ExportPDFButton renders PrintableLineup to hidden container (React portal)
3. Wait 100ms for React render + DOM update
4. html2canvas captures element as canvas (scale: 2 for quality)
5. jsPDF converts canvas to PDF image
6. Calculate dimensions: 10mm margins, scale to fit if needed
7. Add PDF metadata (title, author, date)
8. Trigger browser download with filename
9. Clean up hidden container

### Dimension Calculation (per RESEARCH.md Pitfall 4)

```typescript
const pdfWidth = pdf.internal.pageSize.getWidth();
const pdfHeight = pdf.internal.pageSize.getHeight();

const availableWidth = pdfWidth - 20; // 10mm margins each side
const availableHeight = pdfHeight - 20;

const imgWidth = availableWidth;
const imgHeight = (canvas.height * imgWidth) / canvas.width;

if (imgHeight > availableHeight) {
  // Scale down proportionally to fit page
  const scaleFactor = availableHeight / imgHeight;
  // ...
}
```

**Why explicit calculation:** html2canvas captures at pixel dimensions, jsPDF expects mm units. Without explicit conversion, PDFs have wrong dimensions or cut-off content.

### Off-Screen Rendering (Decision LINE-PDF-03)

```typescript
{showPrintable && createPortal(
  <div ref={printRef}>
    <PrintableLineup boats={activeBoats} lineupName={lineupName} />
  </div>,
  document.body
)}
```

**Why portal:** Renders to document.body (not in workspace), avoids layout conflicts
**Why off-screen:** PrintableLineup has `left: -9999px` inline style, hidden from user
**Why not display:none:** html2canvas can't capture elements with display:none

## Component Stats

| Component | Lines | Key Features |
|-----------|-------|--------------|
| PrintableLineup.tsx | 239 | High-contrast layout, large fonts, inline styles |
| lineupPdfExport.ts | 141 | html2canvas + jsPDF, dimension calculation, metadata |
| ExportPDFButton.tsx | 119 | Portal rendering, loading state, error handling |
| LineupToolbar.tsx (modified) | +23 | Import + integrate ExportPDFButton |
| index.ts (modified) | +2 | Export new components |

**Total new code:** 499 lines
**Net change:** +524 lines

## What's NOT In This Plan

Intentionally deferred to future plans or out of scope:

- **Multi-page PDF splitting** (Decision LINE-PDF-05) - Scale to single page covers 95% of use cases
- **Custom print templates** - Single high-contrast layout sufficient
- **PDF preview before export** - Direct export is faster, preview adds complexity
- **Toast notifications** - Alert used, toast integration when toast system added
- **Print dialog** - Direct download, browser print dialog if needed
- **PDF annotations** - Export is read-only, annotations out of scope
- **Page break control** - Single-page scaling handles all lineup sizes

## Verification Results

✅ TypeScript compiles without errors (`npm run build`)
✅ PrintableLineup created (239 lines) ✓ min 100
✅ lineupPdfExport created (141 lines) ✓ min 80
✅ ExportPDFButton created (119 lines) ✓ min 40
✅ PrintableLineup uses high-contrast black/white design
✅ Fonts are large (14-24pt) for dock readability
✅ PDF includes lineup name, date, all boats and assignments
✅ Seats shown vertically (bow at top, stroke at bottom)
✅ Empty seats show "---"
✅ Coxswain shown separately at bottom
✅ lineupPdfExport uses `new jsPDF()`
✅ lineupPdfExport uses `html2canvas()`
✅ ExportPDFButton integrated into LineupToolbar
✅ Export button disabled when no boats
✅ Loading state shows spinner during generation
✅ Component exports updated

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for Plan 08-07+ (remaining lineup features):**
- ✅ PDF export available for all lineup states
- ✅ PrintableLineup component reusable for version history exports
- ✅ lineupPdfExport utility can be used for other print features
- ✅ ExportPDFButton pattern can be replicated for other exports

**Blockers:** None

**Concerns:** None

## Authentication Gates

None - all functionality client-side using existing store and browser APIs.

## Git History

```
86bd565 feat(08-06): integrate PDF export into toolbar
c97a14e feat(08-06): create lineupPdfExport utility
4f85fdc feat(08-06): create PrintableLineup component
```

**Commits:** 3 task commits
**Files changed:** 5 (3 created, 2 modified)
**Lines added:** 524 net

---

*Phase 08, Plan 06 complete - LINE-11: Coach can export lineup as print-ready PDF*
