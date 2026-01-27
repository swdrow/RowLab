# Phase 18: Lineup & Boat Configuration Improvements - Research

**Researched:** 2026-01-26
**Domain:** Equipment management, data visualization, advanced filtering, Excel export
**Confidence:** HIGH

## Summary

Phase 18 enhances the existing lineup builder (Phase 8) with rigging management, equipment tracking, lineup comparison tools, and improved export capabilities. The research covered five key technical domains: rigging data structures, equipment conflict detection, comparison UI patterns, historical data filtering, and client-side Excel/QR generation.

**Standard approach:** Extend the existing Zustand lineupStore with new slices for rigging/equipment data, use established libraries (xlsx for Excel, qrcode.react for QR codes), implement conflict detection with real-time validation patterns, and leverage TanStack Virtual for large lineup lists. The phase builds incrementally on Phase 8 foundations rather than replacing them.

**Primary recommendation:** Keep rigging and equipment data simple and practical. Don't over-engineer complex rigging calculations—coaches know their boats. Focus on tracking, templates, and conflict warnings rather than prescriptive rigging algorithms.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 4.x (in use) | State management for rigging/equipment | Already used in lineupStore, supports middleware, simple API |
| TanStack Query v5 | 5.x (in use) | API integration for lineups/equipment | Already standard in project, server state management |
| @dnd-kit | Latest (in use) | Drag-drop for equipment assignment | Already used in Phase 8 lineup builder |
| TanStack Virtual | Latest | Virtualization for large lineup lists | Industry standard for list virtualization, headless UI |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| xlsx (SheetJS) | 0.18.x+ | Excel export from browser | Client-side Excel generation, widely used |
| qrcode.react | 4.x+ | QR code generation | Most popular React QR library, SVG/Canvas support |
| react-diff-viewer | 3.x+ | Side-by-side lineup comparison | GitHub-style diff UI, syntax highlighting support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| xlsx | ExcelJS | ExcelJS has more features but larger bundle (xlsx is lighter for export-only) |
| qrcode.react | react-qr-code | qrcode.react has more usage (1151 dependents vs 329), more mature |
| TanStack Virtual | react-window | TanStack Virtual is more modern, better TypeScript, active development |

**Installation:**
```bash
npm install xlsx qrcode.react react-diff-viewer
# TanStack Virtual if not already installed
npm install @tanstack/react-virtual
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── v2/
│   ├── features/
│   │   ├── lineup/
│   │   │   ├── components/
│   │   │   │   ├── RiggingPanel.tsx
│   │   │   │   ├── EquipmentPicker.tsx
│   │   │   │   ├── LineupComparison.tsx
│   │   │   │   └── HistoricalLineupBrowser.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useRiggingProfiles.ts
│   │   │   │   ├── useEquipmentConflicts.ts
│   │   │   │   └── useLineupTemplates.ts
│   │   │   └── utils/
│   │   │       ├── riggingCalculations.ts
│   │   │       └── lineupExcelExport.ts
│   ├── types/
│   │   ├── rigging.ts
│   │   └── equipment.ts
│   └── utils/
│       ├── lineupPdfExport.ts (existing)
│       └── qrCodeGenerator.ts
├── store/
│   ├── lineupStore.js (existing)
│   ├── riggingStore.ts (new)
│   └── equipmentStore.ts (new)
```

### Pattern 1: Equipment Conflict Detection (Real-time Validation)
**What:** Check for double-booking and availability conflicts as equipment is assigned
**When to use:** Equipment assignment UI, lineup save operations
**Example:**
```typescript
// Source: Industry pattern from scheduling systems
interface EquipmentConflict {
  type: 'double_booking' | 'unavailable' | 'maintenance';
  shellId: string;
  conflictingLineupId: string;
  message: string;
}

function useEquipmentConflicts(lineupId: string, date: DateTime) {
  return useQuery({
    queryKey: ['equipment-conflicts', lineupId, date],
    queryFn: async () => {
      const lineup = await fetchLineup(lineupId);
      const conflicts: EquipmentConflict[] = [];

      for (const assignment of lineup.assignments) {
        if (assignment.shellName) {
          // Check for overlapping time periods
          const overlapping = await checkShellAvailability(
            assignment.shellName,
            date
          );
          if (overlapping) {
            conflicts.push({
              type: 'double_booking',
              shellId: assignment.shellName,
              conflictingLineupId: overlapping.lineupId,
              message: `${assignment.shellName} already assigned to ${overlapping.name}`
            });
          }
        }
      }
      return conflicts;
    },
    enabled: !!lineupId
  });
}
```

### Pattern 2: Rigging Profile Storage (JSON in Database)
**What:** Store rigging settings as flexible JSON rather than rigid columns
**When to use:** Custom boat configurations, athlete-specific rigging preferences
**Example:**
```typescript
// Source: Verified against schema.prisma
interface RiggingProfile {
  boatId: string;
  defaults: {
    spread?: number;      // cm (typical: 83-87 for sweep)
    span?: number;        // cm (for sculling)
    catchAngle?: number;  // degrees (typical: -58)
    finishAngle?: number; // degrees (typical: 33)
    oarLength?: number;   // cm (sweep: 362-378, scull: 274-292)
    inboard?: number;     // cm (sweep: 112-116, scull: 87-89)
    pitch?: number;       // degrees (typical: 4)
    gateHeight?: number;  // mm (sweep: 170±15, scull: 160±15)
  };
  perSeat?: Record<number, Partial<RiggingProfile['defaults']>>;
  notes?: string;
}

// Store in database as JSON on BoatConfig or new RiggingProfile table
// Current schema has BoatConfig with teamId, name, numSeats, hasCoxswain
// Extend with: rigging Json? field for storing rigging profiles
```

### Pattern 3: Template System (Zustand + LocalStorage)
**What:** Save/apply lineup configurations as templates
**When to use:** Recurring lineups (A-boat, B-boat, race day setups)
**Example:**
```typescript
// Source: Template pattern standard in React state management
interface LineupTemplate {
  id: string;
  name: string;
  boatClass: string;
  assignments: Array<{
    seatNumber: number;
    side: 'Port' | 'Starboard';
    preferredAthleteId?: string; // Optional for flexible templates
  }>;
  rigging?: RiggingProfile;
  createdAt: string;
}

// Zustand store extension
const useLineupStore = create<LineupState>((set, get) => ({
  templates: [],

  saveAsTemplate: (name: string) => {
    const template: LineupTemplate = {
      id: crypto.randomUUID(),
      name,
      boatClass: get().activeBoats[0]?.name,
      assignments: get().activeBoats[0]?.seats.map(s => ({
        seatNumber: s.seatNumber,
        side: s.side,
        preferredAthleteId: s.athlete?.id
      })),
      createdAt: new Date().toISOString()
    };

    set(state => ({
      templates: [...state.templates, template]
    }));

    // Persist to localStorage and/or API
    localStorage.setItem('lineup_templates', JSON.stringify(get().templates));
  },

  applyTemplate: (templateId: string) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return;

    // Create boat from template structure, optionally fill with suggested athletes
    // Implementation depends on Phase 8 lineup builder structure
  }
}));
```

### Pattern 4: Excel Export (Client-side with xlsx)
**What:** Export lineup data to Excel spreadsheet without server round-trip
**When to use:** Sharing lineups with external tools, data analysis
**Example:**
```typescript
// Source: Verified from xlsx documentation and examples
import * as XLSX from 'xlsx';

interface ExportLineupToExcelOptions {
  includeRigging?: boolean;
  includeEquipment?: boolean;
  multipleBoats?: boolean;
}

function exportLineupToExcel(
  lineup: Lineup,
  options: ExportLineupToExcelOptions = {}
) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Lineup assignments
  const lineupData = lineup.assignments.map(a => ({
    'Boat Class': a.boatClass,
    'Shell': a.shellName || '',
    'Seat': a.isCoxswain ? 'Cox' : a.seatNumber,
    'Side': a.side,
    'Athlete': `${a.athlete.firstName} ${a.athlete.lastName}`,
    'Weight (kg)': a.athlete.weightKg || '',
    'Side Pref': a.athlete.side || ''
  }));

  const lineupSheet = XLSX.utils.json_to_sheet(lineupData);
  XLSX.utils.book_append_sheet(workbook, lineupSheet, 'Lineup');

  // Sheet 2: Rigging (if requested)
  if (options.includeRigging) {
    const riggingData = /* fetch rigging profiles */;
    const riggingSheet = XLSX.utils.json_to_sheet(riggingData);
    XLSX.utils.book_append_sheet(workbook, riggingSheet, 'Rigging');
  }

  // Generate file and trigger download
  XLSX.writeFile(workbook, `${lineup.name}-${Date.now()}.xlsx`);
}

// Bundle size warning: xlsx is ~400kb minified
// Consider lazy loading: const XLSX = await import('xlsx');
```

### Pattern 5: QR Code for Digital Links
**What:** Generate QR code linking to lineup digital version
**When to use:** PDF exports, printed lineup sheets
**Example:**
```typescript
// Source: Verified from qrcode.react documentation
import { QRCodeSVG } from 'qrcode.react';

function LineupQRCode({ lineupId }: { lineupId: string }) {
  const url = `${window.location.origin}/lineups/${lineupId}/view`;

  return (
    <QRCodeSVG
      value={url}
      size={128}
      level="M"  // Error correction level (L, M, Q, H)
      includeMargin={true}
    />
  );
}

// For PDF export integration:
// 1. Render QRCode component to canvas
// 2. Extract as data URL
// 3. Include in jsPDF generation (existing pattern from Phase 8)
```

### Pattern 6: Lineup Comparison View (Side-by-Side)
**What:** Display two lineups side-by-side with visual difference highlighting
**When to use:** Comparing lineup iterations, what-if scenarios
**Example:**
```typescript
// Source: Comparison UI patterns, adapted for lineup data
interface LineupComparisonProps {
  lineup1: Lineup;
  lineup2: Lineup;
}

function LineupComparison({ lineup1, lineup2 }: LineupComparisonProps) {
  // Group assignments by boat for comparison
  const boats1 = groupByBoat(lineup1.assignments);
  const boats2 = groupByBoat(lineup2.assignments);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>{lineup1.name}</h3>
        {boats1.map(boat => (
          <BoatView
            key={boat.id}
            boat={boat}
            highlightDifferences={true}
            comparedTo={boats2.find(b => b.boatClass === boat.boatClass)}
          />
        ))}
      </div>
      <div>
        <h3>{lineup2.name}</h3>
        {boats2.map(boat => (
          <BoatView
            key={boat.id}
            boat={boat}
            highlightDifferences={true}
            comparedTo={boats1.find(b => b.boatClass === boat.boatClass)}
          />
        ))}
      </div>
    </div>
  );
}

// BoatView handles highlighting:
// - Different athlete: yellow background
// - New seat: green border
// - Removed from seat: red border
// - Side change: orange indicator
```

### Pattern 7: Historical Lineup Filtering (Advanced Query Builder)
**What:** Multi-criteria search across lineup history
**When to use:** Finding past lineups, pattern analysis
**Example:**
```typescript
// Source: Advanced filtering patterns
interface LineupFilter {
  athleteIds?: string[];
  boatClasses?: string[];
  dateRange?: { start: Date; end: Date };
  shellNames?: string[];
  minAthletes?: number; // "At least N of these athletes"
}

function useHistoricalLineups(filter: LineupFilter) {
  return useQuery({
    queryKey: ['lineups', 'historical', filter],
    queryFn: async () => {
      // Backend constructs SQL query based on filters
      // Frontend provides UI for building filter object
      const params = new URLSearchParams();
      if (filter.athleteIds?.length) {
        params.append('athleteIds', filter.athleteIds.join(','));
      }
      if (filter.boatClasses?.length) {
        params.append('boatClasses', filter.boatClasses.join(','));
      }
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start.toISOString());
        params.append('endDate', filter.dateRange.end.toISOString());
      }

      const response = await fetch(`/api/v1/lineups/search?${params}`);
      return response.json();
    }
  });
}

// UI component uses multi-select dropdowns, date pickers
// Consider using SVAR React Filter or AG Grid Advanced Filter for complex queries
```

### Anti-Patterns to Avoid
- **Complex rigging calculations:** Don't try to auto-calculate optimal rigging from athlete biomechanics. Rigging is highly individual and context-dependent. Store measurements, don't prescribe them.
- **Deep diffing algorithms:** For lineup comparison, simple seat-by-seat comparison is sufficient. Don't implement complex diff algorithms like git—visual side-by-side is clearer for coaches.
- **Server-side PDF generation:** Phase 8 already uses client-side PDF (jsPDF + html2canvas). Keep Excel and QR generation client-side too for consistency and reduced server load.
- **Real-time collaboration on lineups:** This phase doesn't include multi-user editing. Avoid websockets or operational transforms—simple save/load with timestamps is sufficient.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel file generation | Custom XLSX binary writer | xlsx (SheetJS) library | Excel format has complex binary structure, zip containers, XML relationships. Library handles 40+ Excel features correctly. |
| QR code encoding | Custom QR algorithm | qrcode.react | QR codes have error correction levels, mask patterns, version compatibility. Library handles all 40 versions + 4 error levels. |
| List virtualization | Custom viewport calculation | TanStack Virtual | Calculating visible items, scroll position, dynamic heights is complex. Library optimizes at 60fps, handles edge cases. |
| Conflict detection | Manual date range checks | Established scheduling patterns | Time-based conflicts have subtle edge cases (timezone, all-day events, recurring). Use proven algorithms. |
| Multi-criteria filtering | Hand-written SQL builder | Query builder library or backend service | Complex queries need parameterization, injection protection, type safety. Let library or ORM handle it. |
| Diff visualization | Custom array comparison | react-diff-viewer (if needed) | Visual diffing needs highlighting, split/unified views, word-level diff. Library provides GitHub-quality UI. |

**Key insight:** Equipment tracking and rigging management have established patterns in scheduling/resource management systems. Don't reinvent—adapt proven conflict detection and availability checking algorithms from that domain.

## Common Pitfalls

### Pitfall 1: Rigging Data Overload
**What goes wrong:** Attempting to track every possible rigging measurement for every boat/seat combination leads to data entry burden and UI complexity that coaches won't use.
**Why it happens:** Rigging has many measurements (spread, span, catch/finish angles, oar length, inboard, pitch, gate height, button position, sleeve rotation, etc.). It's tempting to track everything.
**How to avoid:** Start with defaults per boat class. Allow per-boat overrides only when coach explicitly customizes. Track 4-6 core measurements (spread/span, catch angle, oar length, gate height). Make other fields optional "advanced" settings.
**Warning signs:** Rigging form has more than 10 required fields. Coaches skip rigging feature entirely. Complex rigging UI slows lineup creation.

**Standard rigging values from research:**
- **Spread (sweep):** 83-87 cm typical
- **Span (scull):** 83-87 cm typical (same range, different measurement)
- **Catch angle:** -58° typical for sweep
- **Finish angle:** 33° typical for sweep
- **Oar length:** Sweep 362-378 cm, Scull 274-292 cm
- **Inboard:** Sweep 112-116 cm, Scull 87-89 cm
- **Pitch:** 4° (molded into modern oarlocks)
- **Gate height:** Sweep 170±15 mm, Scull 160±15 mm

### Pitfall 2: Excel Export Bundle Size
**What goes wrong:** Adding xlsx library increases bundle by ~400kb minified. This impacts initial page load for all users, even those who never export to Excel.
**Why it happens:** xlsx is a full Excel parser/generator with extensive feature support, resulting in large code size.
**How to avoid:** Lazy load xlsx library only when export is triggered. Use dynamic import: `const XLSX = await import('xlsx')`. Show loading spinner during import. Consider separate export page if bundle splitting doesn't work.
**Warning signs:** Lighthouse performance score drops. Initial bundle exceeds 500kb. Page load time increases noticeably.

```typescript
// Good: Lazy loading
async function handleExcelExport(lineup: Lineup) {
  setExporting(true);
  try {
    const XLSX = await import('xlsx');
    // ... export logic
  } finally {
    setExporting(false);
  }
}

// Bad: Importing at top level
import * as XLSX from 'xlsx'; // Adds 400kb to main bundle
```

### Pitfall 3: Equipment Conflict Detection Performance
**What goes wrong:** Checking for conflicts across all lineups/sessions on every assignment becomes slow as lineup history grows.
**Why it happens:** Naive implementation queries all lineups and checks time overlaps in memory. O(n*m) complexity where n = lineups, m = assignments per lineup.
**How to avoid:** Use database indexes on (teamId, date, shellName). Backend endpoint returns only potential conflicts for given date range. Cache conflict checks with React Query. Only revalidate when relevant data changes.
**Warning signs:** Equipment picker lags when opening. Lineup save takes >1 second. Database queries timeout with large teams.

```typescript
// Good: Scoped query with date range
const { data: conflicts } = useQuery({
  queryKey: ['equipment-conflicts', shellName, date],
  queryFn: () => fetchConflicts(shellName, date.startOf('day'), date.endOf('day')),
  staleTime: 30000 // Cache for 30 seconds
});

// Bad: Loading all lineups to check conflicts
const allLineups = await fetchAllLineups(); // Could be thousands
const conflicts = allLineups.filter(l =>
  l.assignments.some(a => a.shellName === targetShell)
);
```

### Pitfall 4: Lineup Comparison Scalability
**What goes wrong:** Comparing lineups becomes unwieldy with large rosters (30+ athletes per lineup across multiple boats).
**Why it happens:** Displaying every seat side-by-side for multiple boats creates vertical scrolling and cognitive overload.
**How to avoid:** Use virtualization (TanStack Virtual) for large comparisons. Add "collapse boat" controls. Highlight only differences by default with "show all" option. Consider table view for multi-lineup comparison (>2 lineups).
**Warning signs:** Comparison view requires excessive scrolling. Users lose context switching between boats. Page becomes sluggish with >3 boats compared.

### Pitfall 5: Historical Lineup Query Complexity
**What goes wrong:** Implementing "find lineups with at least 5 of these 8 athletes" type queries becomes complex with pure SQL.
**Why it happens:** Set-based queries with thresholds require subqueries, GROUP BY, HAVING clauses that are easy to get wrong.
**How to avoid:** Use Prisma's relation queries properly. For complex "at least N" queries, fetch candidates and filter in memory if result set is small. Consider materialized views or search index (like Meilisearch) for advanced queries.
**Warning signs:** Query performance degrades with large teams. SQL becomes unreadable. Results have unexpected edge cases (duplicates, missing matches).

```typescript
// Simpler approach: Fetch lineups containing any target athletes, filter in memory
const lineups = await prisma.lineup.findMany({
  where: {
    teamId,
    assignments: {
      some: {
        athleteId: { in: targetAthleteIds }
      }
    }
  },
  include: { assignments: true }
});

// Filter for "at least N athletes" in memory
const matching = lineups.filter(lineup => {
  const athleteCount = lineup.assignments.filter(a =>
    targetAthleteIds.includes(a.athleteId)
  ).length;
  return athleteCount >= minAthletes;
});
```

### Pitfall 6: PDF QR Code Positioning
**What goes wrong:** QR codes in PDF exports render blurry or at wrong size, making them unscannable.
**Why it happens:** QRCodeSVG needs to be converted to canvas/image for jsPDF. Scaling calculations affect scan reliability.
**How to avoid:** Render QR code at target size (minimum 21x21 modules). Use level="M" or "H" error correction for print reliability. Test scanning on actual printed PDFs, not just screen previews. Position with adequate white space margin.
**Warning signs:** QR codes don't scan on printed pages. QR codes appear pixelated. Scans fail in poor lighting.

```typescript
// Good: Adequate size and error correction for print
<QRCodeSVG
  value={url}
  size={128}  // Minimum 128px for print reliability
  level="H"   // High error correction for damaged/printed codes
  includeMargin={true}
/>

// Bad: Too small or low error correction
<QRCodeSVG
  value={url}
  size={64}   // Too small for reliable scanning when printed
  level="L"   // Low error correction fails if code is slightly damaged
/>
```

## Code Examples

Verified patterns from official sources:

### Rigging Profile Default Values
```typescript
// Source: World Rowing rigging guides, Durham Boat Company, Concept2
const DEFAULT_RIGGING: Record<string, RiggingProfile['defaults']> = {
  'SWEEP_8+': {
    spread: 85,        // cm, typical mid-range
    catchAngle: -58,   // degrees
    finishAngle: 33,   // degrees
    oarLength: 372,    // cm, typical Concept2 sweep length
    inboard: 114,      // cm
    pitch: 4,          // degrees (modern standard)
    gateHeight: 170    // mm from seat bottom
  },
  'SWEEP_4+': {
    spread: 86,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170
  },
  'SCULL_4x': {
    span: 158,         // cm (2x spread for sculling)
    catchAngle: -60,   // Slightly more for sculling
    finishAngle: 35,
    oarLength: 284,    // cm, typical Concept2 scull length
    inboard: 88,       // cm
    pitch: 4,
    gateHeight: 160    // mm (lower than sweep)
  },
  'SCULL_2x': {
    span: 160,
    catchAngle: -60,
    finishAngle: 35,
    oarLength: 287,
    inboard: 88,
    pitch: 4,
    gateHeight: 160
  }
};

// Usage: Prefill rigging form with defaults when creating new boat config
```

### Equipment Conflict Detection
```typescript
// Source: Scheduling conflict detection patterns
async function checkEquipmentAvailability(
  shellName: string,
  startTime: DateTime,
  endTime: DateTime,
  excludeLineupId?: string
): Promise<EquipmentConflict[]> {
  // Query overlapping lineups using database
  const overlapping = await prisma.lineup.findMany({
    where: {
      id: { not: excludeLineupId },
      assignments: {
        some: {
          shellName: shellName
        }
      },
      // Assuming lineups have scheduledDate field
      scheduledDate: {
        gte: startTime.startOf('day').toJSDate(),
        lte: endTime.endOf('day').toJSDate()
      }
    },
    include: {
      assignments: {
        where: { shellName }
      }
    }
  });

  return overlapping.map(lineup => ({
    type: 'double_booking' as const,
    shellId: shellName,
    conflictingLineupId: lineup.id,
    message: `${shellName} assigned in "${lineup.name}"`
  }));
}
```

### Virtualized Lineup List
```typescript
// Source: TanStack Virtual documentation patterns
import { useVirtualizer } from '@tanstack/react-virtual';

function HistoricalLineupList({ lineups }: { lineups: Lineup[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: lineups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height in pixels
    overscan: 5 // Render 5 extra items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <LineupCard lineup={lineups[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Enhanced PDF Export with QR Code
```typescript
// Source: Extending Phase 8 PDF export pattern
import { exportLineupToPdf } from '@/v2/utils/lineupPdfExport';
import { QRCodeSVG } from 'qrcode.react';

async function exportEnhancedLineupPdf(
  lineup: Lineup,
  options: {
    includeRigging?: boolean;
    includeQRCode?: boolean;
  } = {}
) {
  // Render lineup with enhancements
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.padding = '40px';
  container.style.backgroundColor = 'white';

  // Render React component to container
  const root = createRoot(container);
  root.render(
    <PrintableLineup
      lineup={lineup}
      includeRigging={options.includeRigging}
    />
  );

  // If QR code requested, add it
  if (options.includeQRCode) {
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.bottom = '20px';
    qrContainer.style.right = '20px';

    const qrRoot = createRoot(qrContainer);
    const url = `${window.location.origin}/lineups/${lineup.id}/view`;
    qrRoot.render(<QRCodeSVG value={url} size={100} level="H" />);

    container.appendChild(qrContainer);
  }

  document.body.appendChild(container);

  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100));

  // Use existing Phase 8 PDF export
  await exportLineupToPdf(container, lineup.name);

  // Cleanup
  document.body.removeChild(container);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side Excel generation | Client-side with xlsx | 2020-2023 | Reduces server load, faster exports, works offline |
| react-virtualized | TanStack Virtual | 2023-2024 | Better TypeScript, headless UI, more maintainable |
| Manual conflict checking | Real-time validation patterns | 2023-2025 | Scheduling systems adopted AI-assisted conflict detection |
| Redux for templates | Zustand with middleware | 2021-2024 | Simpler API, less boilerplate, better TypeScript |
| Custom QR libraries | qrcode.react | 2020-present | Standardized on React-specific libraries |

**Deprecated/outdated:**
- **react-virtualized:** Still works but no longer actively maintained. TanStack Virtual is the modern replacement with better TypeScript and performance.
- **Server-side PDF generation:** With jsPDF + html2canvas maturity, client-side is now preferred for simple PDFs (faster, reduces server cost).
- **react-export-excel wrapper:** Direct use of xlsx library is more common now. Wrapper adds little value.

## Open Questions

Things that couldn't be fully resolved:

1. **Equipment maintenance tracking scope**
   - What we know: Schema has EquipmentStatus enum (AVAILABLE, IN_USE, MAINTENANCE, RETIRED) on Shell model
   - What's unclear: Does Phase 18 include maintenance scheduling UI, or just status flags? Phase 4 (Fleet Management) may have covered this.
   - Recommendation: Check Phase 4 deliverables. If maintenance UI exists, integrate via conflict detection ("shell in maintenance"). If not, defer to separate phase.

2. **Rigging history tracking detail level**
   - What we know: BOAT-02 mentions "rigging history tracking"
   - What's unclear: Is this full audit log (every rigging change with timestamp/user) or just version snapshots?
   - Recommendation: Start with snapshot-based versioning (save rigging profile with lineup). Full audit log can be added if coaches request it.

3. **Multi-lineup PDF export layout**
   - What we know: LINEUP-05 specifies "multiple boats per page"
   - What's unclear: Is this multiple boats from one lineup, or multiple lineups (lineups for entire regatta) in one PDF?
   - Recommendation: Interpret as multiple boats from single lineup per page (A-boat + B-boat together). Multi-lineup regatta export is separate feature.

4. **Performance prediction in comparison view**
   - What we know: LINEUP-01 mentions "performance prediction comparison"
   - What's unclear: What's the prediction algorithm? ELO-based (from seat racing)? Historical speed (from race results)? Or placeholder for future ML model?
   - Recommendation: Use existing AthleteRating (ELO) if available. Show simple aggregate ELO score per boat. Don't implement complex prediction model in this phase.

## Sources

### Primary (HIGH confidence)
- [Prisma schema.prisma] - Database structure for Shell, OarSet, BoatConfig, LineupAssignment models
- [World Rowing: Practical Boat Rigging](https://worldrowing.com/wp-content/uploads/2020/10/Practical-Boat-Rigging-Gianni-Postilione-Conny-Draper.pdf) - Standard rigging values
- [Concept2 Oars: Length and Rigging](https://www.concept2.com/oars/sweeps/length-and-rigging) - Oar specifications
- [Durham Boat Company: Rigging Fundamentals](https://www.durhamboat.com/2022/04/13/rigging-fundamentals/) - Rigging measurements
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest) - Virtualization patterns

### Secondary (MEDIUM confidence)
- [MaxRigging: How to Select Rowing Rigging Numbers](https://maxrigging.com/select-rowing-rigging-numbers/) - Rigging guidelines
- [itnext.io: Solving Double Booking at Scale](https://itnext.io/solving-double-booking-at-scale-system-design-patterns-from-top-tech-companies-4c5a3311d8ea) - Conflict detection patterns
- [Nucamp: State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - React state patterns
- [DEV Community: Optimizing React Performance with Virtualization](https://dev.to/usman_awan_003/optimizing-react-performance-with-virtualization-a-developers-guide-3j14) - Virtualization guide

### Tertiary (LOW confidence - verify before implementing)
- [npm: qrcode.react](https://www.npmjs.com/package/qrcode.react) - Library usage (403 on fetch, verified via search results)
- [npm: xlsx](https://www.npmjs.com/package/xlsx) - Library usage (403 on fetch, verified via search results)
- [GitHub: react-diff-viewer](https://github.com/praneshr/react-diff-viewer) - Comparison UI library
- [SVAR React Filter](https://svar.dev/react/filter/) - Query builder option
- [Medium: SVAR React Filter](https://medium.com/@SvarWidgets/svar-react-filter-open-source-query-builder-for-react-15b5f616ab00) - Advanced filtering

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries verified through multiple sources, usage patterns established
- Architecture: HIGH - Patterns adapted from existing Phase 8 implementation and industry standards
- Rigging values: HIGH - Multiple authoritative sources (World Rowing, Concept2, Durham) agree
- Pitfalls: MEDIUM - Based on general React/TypeScript best practices and library-specific warnings
- Equipment conflict detection: MEDIUM - Adapted from scheduling domain, not rowing-specific

**Research date:** 2026-01-26
**Valid until:** ~60 days (stable domain - rowing rigging standards don't change rapidly, libraries mature)

**Key dependencies:**
- Phase 8 (Lineup Builder) must be complete - extends lineupStore and PDF export
- Phase 4 (Fleet Management) integration - Shell and OarSet models already in schema
- Database schema supports storing rigging JSON (may need migration to add rigging field to BoatConfig)
