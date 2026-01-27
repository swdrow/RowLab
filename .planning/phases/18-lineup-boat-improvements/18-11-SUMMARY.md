---
phase: 18
plan: 11
subsystem: lineup-export
tags: [excel, pdf, qr-code, export, lazy-loading]

dependency-graph:
  requires: [18-02]
  provides:
    - Excel export with lazy-loaded xlsx library
    - Enhanced PDF export with QR code support
  affects: [18-UI-integration]

tech-stack:
  added:
    - xlsx (lazy-loaded): Excel file generation
    - qrcode.react: QR code generation for PDFs
  patterns:
    - Dynamic imports for bundle optimization
    - Offscreen rendering for QR code conversion

key-files:
  created:
    - src/v2/utils/lineupExcelExport.ts: Excel export utility
  modified:
    - src/v2/utils/lineupPdfExport.ts: Enhanced with QR code support

decisions:
  - id: lazy-load-xlsx
    choice: Dynamic import for xlsx library
    rationale: Prevents ~400kb library from bloating main bundle
    impact: Excel export only loads library when used

  - id: qr-offscreen-render
    choice: Temporary offscreen DOM rendering for QR codes
    rationale: QRCodeCanvas needs DOM to render before conversion to data URL
    impact: 100ms delay per QR code generation, negligible UX impact

  - id: relative-import-path
    choice: Use relative import for RiggingDefaults type
    rationale: Avoid tsconfig path resolution issues during compilation
    impact: More explicit imports in utils directory

metrics:
  duration: 2m 35s
  completed: 2026-01-27
  tasks: 2
  commits: 2
---

# Phase 18 Plan 11: Enhanced Export Utilities Summary

Excel export with lazy-loaded xlsx library and enhanced PDF export with QR codes for digital access.

## What Was Built

### Excel Export Utility (`lineupExcelExport.ts`)

**Multi-sheet Excel export with optional sections:**
- **Lineup sheet**: Boats, seats (stroke to bow), athletes, side assignments
- **Rigging sheet** (optional): Spread/span, angles, oar measurements per shell
- **Equipment sheet** (optional): Shell-to-oar set mappings

**Key features:**
- Dynamic import of xlsx library (~400kb) - not loaded until export triggered
- Seats sorted stroke to bow per rowing convention
- Optional athlete details (weight, side preference)
- Column width optimization for readability
- Empty rows between boats for visual separation
- Filename includes lineup name + timestamp

**Preview function:**
- `generateExportPreview()` estimates row count, sheet count, and file size
- Enables UI to show export preview without triggering download

### Enhanced PDF Export (`lineupPdfExport.ts`)

**Added QR code support to existing PDF export:**
- Optional QR code overlay linking to digital lineup version
- QR code positioned in bottom right with "Scan for digital version" label
- High error correction level (H) for reliable scanning even if partially obscured
- Dynamic import of qrcode.react to avoid bundle bloat

**Implementation approach:**
1. Create temporary offscreen div
2. Render QRCodeCanvas using React createRoot
3. Extract canvas and convert to data URL
4. Clean up temporary DOM elements
5. Add QR image to PDF with positioning

**Three export functions:**
- `exportLineupToPdf()`: Single boat with optional QR code
- `exportMultiBoatPdf()`: Multiple boats per page, QR on last page
- `exportSimplePdf()`: Backward compatible, no QR code

**Error handling:**
- QR generation wrapped in try-catch
- Export continues without QR if generation fails
- Console warning logged for debugging

## Technical Implementation

### Bundle Optimization Strategy

Both utilities use **lazy loading** to avoid main bundle bloat:

```typescript
// Excel: ~400kb library
const XLSX = await import('xlsx');

// PDF QR: React rendering stack
const { QRCodeCanvas } = await import('qrcode.react');
const { createRoot } = await import('react-dom/client');
const React = await import('react');
```

**Impact:**
- Main bundle size unchanged
- Libraries only loaded when export triggered
- One-time load per session (browser caches dynamic imports)

### QR Code Generation Process

**Challenge:** QRCodeCanvas requires DOM to render before extraction

**Solution:** Offscreen rendering with cleanup
1. Create temporary container at `left: -9999px` (offscreen)
2. Mount QRCodeCanvas via React createRoot
3. Wait 100ms for render completion
4. Extract canvas using `toDataURL()`
5. Unmount React root and remove container

**Trade-offs:**
- 100ms delay per QR generation: Acceptable for export operation
- Memory safe: Explicit cleanup prevents leaks
- DOM pollution: Temporary, cleaned up immediately

### Excel Sheet Structure

**Lineup Sheet:**
| Boat Class | Shell | Seat | Side | Athlete | Weight (kg)* | Side Pref* |
|------------|-------|------|------|---------|-------------|-----------|
| 1V8+       | Empacher | 8 | Starboard | Smith, John | 85.5 | Port |

*Optional columns if `includeAthleteDetails: true`

**Rigging Sheet:**
| Shell | Spread/Span | Catch | Finish | Oar Length | Inboard | Pitch | Gate Height |
|-------|-------------|-------|--------|------------|---------|-------|-------------|
| Empacher | 85 cm | -58° | 33° | 372 cm | 114 cm | 4° | 170 mm |

**Equipment Sheet:**
| Shell | Oar Set |
|-------|---------|
| Empacher | Concept2 Smoothie2 |

## Decisions Made

### 1. Lazy Load xlsx Library
**Decision:** Use dynamic import for xlsx library
**Rationale:** 400kb library should not burden main bundle; only needed for export feature
**Alternative considered:** Static import - rejected due to bundle size impact
**Impact:** Excel export loads library on first use (cached thereafter)

### 2. QR Code Offscreen Rendering
**Decision:** Render QRCodeCanvas in temporary offscreen div
**Rationale:** QRCodeCanvas needs DOM to render before conversion to data URL
**Alternative considered:** Server-side QR generation - rejected due to client-side export requirement
**Impact:** 100ms delay per QR generation, negligible for export operation

### 3. Relative Import for Types
**Decision:** Use relative import path for RiggingDefaults (`../types/rigging`)
**Rationale:** Avoid potential tsconfig path resolution issues during isolated file compilation
**Alternative considered:** Path alias `@v2/types/rigging` - works but adds complexity
**Impact:** More explicit imports in utils directory, clearer dependencies

### 4. Multi-Function PDF API
**Decision:** Provide three PDF export functions (single, multi-boat, simple)
**Rationale:** Flexibility for different use cases while maintaining backward compatibility
**Alternative considered:** Single function with complex options - rejected for API clarity
**Impact:** Clear function names indicate use case, easier to maintain

## Testing & Verification

**TypeScript compilation:**
- ✓ `lineupExcelExport.ts` compiles without errors
- ✓ `lineupPdfExport.ts` compiles without errors

**Feature verification:**
- ✓ Excel export uses dynamic import (`await import('xlsx')`)
- ✓ PDF export includes QR code option (`includeQRCode` flag)
- ✓ QR code links to correct URL pattern (`/lineups/{id}/view`)
- ✓ Both utilities handle multiple boats

**Bundle verification:**
- ✓ xlsx not in main bundle (lazy loaded)
- ✓ qrcode.react not in main bundle (dynamic import)

## Next Phase Readiness

**Blockers:** None

**Ready for:**
- UI integration in lineup builder
- Export button implementations
- User testing of export features

**Considerations for next plans:**
- UI needs "Export to Excel" and "Export to PDF" buttons
- Consider export options modal (rigging, equipment, QR code toggles)
- May want export preview showing sheet count / page count
- Consider batch export for multiple lineups

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

### Created
- `src/v2/utils/lineupExcelExport.ts` (217 lines)
  - `exportLineupToExcel()`: Main export function
  - `generateExportPreview()`: Preview without download
  - Interfaces: Athlete, Seat, Boat, LineupExportData, ExportOptions

### Modified
- `src/v2/utils/lineupPdfExport.ts` (198 lines, +56 net)
  - Enhanced `exportLineupToPdf()` with QR support
  - Added `exportMultiBoatPdf()` for multiple boats
  - Added `exportSimplePdf()` for backward compatibility
  - Added `qrCodeToDataUrl()` helper for QR generation

## Git Commits

1. **5863cc3** - `feat(18-11): create Excel export utility with lazy-loaded xlsx`
   - Created lineupExcelExport.ts
   - Dynamic import of xlsx library
   - Multi-sheet export (Lineup, Rigging, Equipment)
   - Preview function for size estimation

2. **753b687** - `feat(18-11): enhance PDF export with QR code support`
   - Enhanced lineupPdfExport.ts with QR codes
   - Offscreen rendering for QR code conversion
   - Multi-boat PDF support
   - Backward compatible simple export

## Summary

Created two export utilities enabling Excel and enhanced PDF exports with bundle optimization. Excel export uses lazy-loaded xlsx library (~400kb) with multi-sheet support for lineup, rigging, and equipment data. PDF export enhanced with optional QR codes linking to digital version, using offscreen rendering for conversion. Both utilities handle multiple boats and include proper error handling. No bundle bloat - all heavy libraries dynamically imported only when export triggered.
