# Phase 8: Lineup Builder - Research

**Researched:** 2026-01-24
**Domain:** React drag-and-drop UI, state management with undo/redo, PDF export
**Confidence:** HIGH

## Summary

Phase 8 implements a comprehensive lineup builder with drag-and-drop seat assignments, version history, and export capabilities. The research confirms that the existing codebase already has the foundation in place (dnd-kit, Zustand with custom undo middleware, Framer Motion), and these choices align with 2026 best practices.

**Key findings:**
- dnd-kit is the current standard for React drag-and-drop (HIGH confidence - Context7, ecosystem consensus)
- Custom undo middleware already implemented and working in lineupStore.js
- Framer Motion supports spring physics animations as required
- jsPDF + html2canvas is the established pattern for PDF export
- Touch device support requires specific sensor configuration (already in ecosystem)

The codebase is well-positioned for this phase. The primary implementation work will be:
1. Building the UI components with proper drag-and-drop configuration
2. Implementing auto-swap logic in onDragEnd handler
3. Adding version history persistence layer
4. Creating biometrics display and margin visualizer
5. Building PDF export with proper layout

**Primary recommendation:** Leverage existing stack (dnd-kit, Zustand, Framer Motion). Focus implementation effort on UI/UX details and auto-swap behavior. Do not replace or add alternative libraries.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.1.0 | Drag-and-drop foundation | Industry standard for React DnD in 2026, lightweight, accessible, extensible. Supports mouse, touch, keyboard, pointer events natively. |
| @dnd-kit/sortable | 8.0.0 | Sortable preset | Provides collision detection algorithms, sensor presets, and utilities for common drag-drop patterns |
| @dnd-kit/utilities | 3.2.2 | Transform utilities | CSS transform helpers for smooth drag animations |
| framer-motion | 11.18.2 | Spring physics animations | De facto standard for React animations, supports spring physics (stiffness, damping) as required by DESIGN-05 |
| zustand | 4.4.7 | State management | Already in use, custom undo middleware already implemented in codebase |
| jspdf | 3.0.4 | PDF generation | Latest stable (v3.0.2, Aug 2025), v4.0.0 announced Jan 2026. Standard for client-side PDF generation |
| html2canvas | 1.4.1 | HTML to canvas rendering | Pairs with jsPDF to honor CSS styles and create high-fidelity PDFs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.71.1 | Form validation | Already in use - for lineup save/duplicate dialogs |
| @tanstack/react-virtual | 3.13.18 | Virtualization | If athlete bank has 100+ athletes, virtualize for performance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dnd-kit | react-beautiful-dnd | react-beautiful-dnd is deprecated/unmaintained. hello-pangea/dnd is the fork but dnd-kit has better performance and smaller bundle |
| jsPDF + html2canvas | Puppeteer/Playwright | Server-side only, requires backend. Client-side PDF generation keeps feature self-contained |
| Custom undo middleware | zustand-middleware-undo | Custom middleware already implemented and working. No need to replace |

**Installation:**
```bash
# Already installed in package.json
# No additional dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── LineupBuilder/
│   │   ├── LineupWorkspace.jsx        # Main workspace component
│   │   ├── BoatView.jsx               # Single boat with seats
│   │   ├── SeatSlot.jsx               # Droppable seat slot with warnings
│   │   ├── AthleteBank.jsx            # Left sidebar with available athletes
│   │   ├── AthleteCard.jsx            # Draggable athlete card
│   │   ├── BiometricsPanel.jsx        # Live biometrics display (LINE-12)
│   │   ├── MarginVisualizer.jsx       # Boat margin visualization (MARG-01-05)
│   │   ├── VersionHistory.jsx         # Version dropdown (LINE-08)
│   │   ├── LineupToolbar.jsx          # Undo/redo/save/export controls
│   │   └── ExportPDFButton.jsx        # PDF export handler (LINE-11)
├── store/
│   ├── lineupStore.js                 # Already exists with undo middleware
│   └── undoMiddleware.js              # Already exists
├── utils/
│   ├── boatConfig.js                  # Already exists
│   └── lineupPdfExport.js             # New: PDF generation logic
```

### Pattern 1: dnd-kit with Auto-Swap

**What:** Configure DndContext with sensors, implement auto-swap in onDragEnd handler

**When to use:** For drag-drop seat assignment with occupied position handling

**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

function LineupBuilder() {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 }, // Prevent accidental drags
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,      // 250ms press for touch activation
        tolerance: 5     // Allow 5px movement during press
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const draggedAthlete = active.data.current.athlete;
    const targetSeat = over.data.current.seat;
    const targetBoat = over.data.current.boatId;

    // Check if seat is occupied
    const occupiedAthlete = targetSeat.athlete;

    if (occupiedAthlete) {
      // Auto-swap: Athletes exchange positions
      // This is custom logic, not built into dnd-kit
      swapAthletes(draggedAthlete, occupiedAthlete, targetBoat, targetSeat);
    } else {
      // Simple assignment
      assignToSeat(targetBoat, targetSeat.seatNumber, draggedAthlete);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* Draggable athletes */}
      {/* Droppable seats */}
      <DragOverlay>
        {/* Full athlete card preview */}
      </DragOverlay>
    </DndContext>
  );
}
```

### Pattern 2: Spring Physics Animations with Framer Motion

**What:** Use spring transitions for drag interactions and UI feedback

**When to use:** For smooth, natural-feeling animations (DESIGN-05)

**Example:**
```jsx
// Source: https://context7.com/grx7/framer-motion/llms.txt
import { motion } from "framer-motion";

const spring = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  restDelta: 0.00001,
  restSpeed: 0.00001,
};

function SeatSlot({ seat, isValidDrop, isOccupied }) {
  return (
    <motion.div
      layout
      transition={spring}
      animate={{
        scale: isValidDrop ? 1.05 : 1,
        borderColor: isValidDrop ? (seat.hasWarning ? "#ef4444" : "#10b981") : "#d1d5db",
      }}
      whileHover={{ scale: 1.02 }}
      className="seat-slot"
    >
      {/* Seat content */}
    </motion.div>
  );
}

function AthleteCard({ athlete, isDragging }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={spring}
      whileDrag={{ scale: 1.05, cursor: "grabbing" }}
    >
      {/* Athlete info */}
    </motion.div>
  );
}
```

### Pattern 3: Undo/Redo with Zustand Middleware

**What:** Use existing undoMiddleware for history tracking

**When to use:** Already implemented in lineupStore.js, just wire to UI

**Example:**
```javascript
// Source: /home/swd/RowLab/src/store/undoMiddleware.js (already exists)
// Already implemented in lineupStore.js

// In component:
const undo = useLineupStore(state => state.undo);
const redo = useLineupStore(state => state.redo);
const canUndo = useLineupStore(state => state._history.canUndo);
const canRedo = useLineupStore(state => state._history.canRedo);

// Keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      e.preventDefault();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [undo, redo]);
```

### Pattern 4: Version History with Zustand Persist

**What:** Save lineup versions to database on explicit save, allow loading previous versions

**When to use:** For LINE-08 (view lineup history)

**Example:**
```javascript
// Source: https://zustand.docs.pmnd.rs/middlewares/persist
// Versions stored in database via API (already exists in lineupStore.js)

// Save new version
const saveLineupVersion = async (name) => {
  const lineup = await saveLineupToAPI(name, notes);
  // API automatically creates version with timestamp
  return lineup;
};

// Load version
const loadVersion = async (lineupId) => {
  const lineup = await fetchLineupById(lineupId);
  loadLineupFromData(lineup, athletes, boatConfigs, shells);
};

// Compare versions side-by-side
function VersionComparison({ versionA, versionB }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <BoatView lineup={versionA} readOnly />
      <BoatView lineup={versionB} readOnly />
    </div>
  );
}
```

### Pattern 5: PDF Export with jsPDF + html2canvas

**What:** Render lineup to canvas, embed in PDF with custom layout

**When to use:** For LINE-11 (export as print-ready PDF)

**Example:**
```javascript
// Source: https://medium.com/@saidularefin8/generating-pdfs-from-html-in-a-react-application-with-html2canvas-and-jspdf-d46c5785eff2
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function exportLineupToPDF(lineupElement, lineupName) {
  // Render HTML to canvas with high quality
  const canvas = await html2canvas(lineupElement, {
    scale: 2,           // Higher quality
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate dimensions to fit page
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Add title
  pdf.setFontSize(20);
  pdf.text(lineupName, 15, 15);

  // Add lineup image
  pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth - 20, pdfHeight);

  // Add metadata
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, pdfHeight + 35);

  pdf.save(`${lineupName}.pdf`);
}
```

### Anti-Patterns to Avoid

- **Don't mutate DOM during drag**: dnd-kit uses lazy calculation of positions. Mutating DOM breaks collision detection.
- **Don't use HTML5 Drag and Drop API**: Not well supported on touch devices. Use dnd-kit which abstracts across input methods.
- **Don't skip sensor activation constraints**: Without constraints, every click/touch triggers drag. Breaks scrolling on mobile.
- **Don't inline styles in PDF export**: jsPDF ignores external stylesheets. Use computed styles or inline critical CSS.
- **Don't use global undo/redo**: Only track lineup changes (activeBoats). Already configured in undoMiddleware with trackedKeys.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag and drop | Custom mouse/touch handlers | dnd-kit | Handles collision detection, multi-input, accessibility, edge cases (simultaneous touches, pointer capture, scroll containers) |
| Undo/redo | Array-based history stack | Existing undoMiddleware | Already handles deep cloning, batching, history limits, checkpoint creation |
| Spring animations | CSS transitions with cubic-bezier | Framer Motion spring config | Spring physics are non-linear, velocity-based. Hand-rolling requires physics engine |
| PDF text layout | Manual line breaking | jsPDF text methods | Handles word wrapping, multiline, alignment, font metrics automatically |
| Touch vs scroll detection | setTimeout heuristics | dnd-kit TouchSensor with activationConstraint | Handles press delay, tolerance, gesture disambiguation built-in |
| Collision detection | getBoundingClientRect loops | dnd-kit collision algorithms | Optimized with lazy calculation, spatial indexing, multiple strategies (pointer, rect, closest) |

**Key insight:** Drag-drop has many hidden complexities (pointer capture, scroll containers, nested draggables, screen readers, RTL layouts). dnd-kit is battle-tested across these edge cases. Custom solutions miss edge cases and require months of refinement.

## Common Pitfalls

### Pitfall 1: Touch Drag Conflicts with Scroll

**What goes wrong:** User tries to drag on mobile, but page scrolls instead. Or drag activates on every scroll gesture.

**Why it happens:** Touch events are ambiguous - could be tap, scroll, or drag. Without activation delay/tolerance, every touch triggers drag.

**How to avoid:** Configure TouchSensor with activation constraints
```javascript
useSensor(TouchSensor, {
  activationConstraint: {
    delay: 250,      // Wait 250ms before activating drag
    tolerance: 5     // Allow 5px movement during press (for unsteady fingers)
  },
})
```

**Warning signs:** Users report "can't scroll on mobile" or "accidentally drags when scrolling"

### Pitfall 2: Auto-Swap Doesn't Preserve Source Position

**What goes wrong:** Dragging athlete A to occupied seat (athlete B) moves A to new seat, but B disappears or goes to bank instead of swapping to A's original position.

**Why it happens:** onDragEnd only knows destination, not source. Need to track source position and perform true swap.

**How to avoid:** In onDragEnd, find source position BEFORE making any changes
```javascript
const handleDragEnd = (event) => {
  const { active, over } = event;

  // Find source position FIRST (before any state changes)
  const sourcePosition = findAthletePosition(activeBoats, active.id);
  const targetPosition = { boatId: over.data.current.boatId, seatNumber: over.data.current.seatNumber };

  // Now swap
  if (sourcePosition && targetPosition) {
    swapAthletes(sourcePosition, targetPosition);
  }
};
```

**Warning signs:** Athletes disappear after drag, swaps don't work correctly, source seat becomes empty unexpectedly

### Pitfall 3: Undo/Redo Doesn't Work After Swap

**What goes wrong:** Swap completes successfully, but undo button is disabled or undo doesn't reverse the swap.

**Why it happens:** Undo middleware only tracks if `trackedKeys` changed. If swap updates state without triggering middleware, history isn't recorded.

**How to avoid:** Ensure all lineup changes go through Zustand set() function, not direct mutation
```javascript
// WRONG - mutates state directly
const boat = activeBoats.find(b => b.id === boatId);
boat.seats[0].athlete = newAthlete;

// CORRECT - uses set() which triggers middleware
set(state => ({
  activeBoats: state.activeBoats.map(boat =>
    boat.id === boatId
      ? { ...boat, seats: boat.seats.map(s => /* ... */) }
      : boat
  )
}));
```

**Warning signs:** Undo button never enables, some actions can't be undone, history._history.canUndo always false

### Pitfall 4: PDF Export Has Wrong Dimensions/Cutoff Content

**What goes wrong:** PDF shows only part of lineup, or everything is tiny, or multi-page PDFs have content overlap.

**Why it happens:** html2canvas captures at actual pixel dimensions, jsPDF expects specific units (mm, pt). Mismatch causes scaling issues.

**How to avoid:** Calculate dimensions explicitly and constrain content width
```javascript
const canvas = await html2canvas(element, { scale: 2 });
const pdf = new jsPDF('portrait', 'mm', 'a4');

const pdfWidth = pdf.internal.pageSize.getWidth();
const pdfHeight = pdf.internal.pageSize.getHeight();

// Calculate image dimensions to fit page with margins
const imgWidth = pdfWidth - 20; // 10mm margin each side
const imgHeight = (canvas.height * imgWidth) / canvas.width;

// Check if needs pagination
if (imgHeight > pdfHeight - 30) {
  // Handle multi-page or scale down
}

pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
```

**Warning signs:** PDF cuts off content, blank pages, text overlaps, "page X of Y" is wrong

### Pitfall 5: Validation Warnings Block Legitimate Workflows

**What goes wrong:** Coxswain validation prevents assigning rowers to cox seat even temporarily. Port/starboard warnings prevent experimental lineups.

**Why it happens:** Over-strict validation treats warnings as errors, blocks saves or shows intrusive modals.

**How to avoid:** Per CONTEXT.md decisions - warnings are soft, visible as badges, never block
```javascript
// WRONG - blocks action
if (athlete.isCoxswain === false && seat.isCoxswain) {
  alert("Cannot assign non-coxswain to coxswain seat!");
  return; // Blocks
}

// CORRECT - allows action, shows warning
function SeatSlot({ seat, athlete }) {
  const warnings = [];

  if (athlete && !athlete.isCoxswain && seat.isCoxswain) {
    warnings.push({ type: 'cox', message: 'Non-coxswain in cox seat' });
  }

  if (athlete && seat.side === 'Port' && !athlete.port) {
    warnings.push({ type: 'side', message: 'Prefers starboard' });
  }

  return (
    <div className="seat">
      {warnings.map(w => <Badge key={w.type} warning={w} />)}
      {/* Always allow drop, just show warnings */}
    </div>
  );
}
```

**Warning signs:** Users complain "can't make experimental lineups", "validation too strict", "can't save valid lineup"

## Code Examples

Verified patterns from official sources:

### Draggable Athlete Card
```jsx
// Source: https://docs.dndkit.com/api-documentation/draggable
import { useDraggable } from '@dnd-kit/core';

function AthleteCard({ athlete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: athlete.id,
    data: { athlete }, // Pass athlete data to onDragEnd
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <img src={athlete.headshot} alt={athlete.name} />
      <span>{athlete.lastName}, {athlete.firstName}</span>
      <span>{athlete.port ? 'P' : ''}{athlete.starboard ? 'S' : ''}</span>
    </div>
  );
}
```

### Droppable Seat Slot
```jsx
// Source: https://docs.dndkit.com/api-documentation/droppable
import { useDroppable } from '@dnd-kit/core';

function SeatSlot({ boatId, seat }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${boatId}-seat-${seat.seatNumber}`,
    data: { boatId, seat }, // Pass context to onDragEnd
  });

  return (
    <div
      ref={setNodeRef}
      className={`seat ${isOver ? 'highlight' : ''}`}
    >
      <span className="seat-number">{seat.seatNumber}</span>
      <span className="side">{seat.side}</span>
      {seat.athlete && <AthleteInSeat athlete={seat.athlete} />}
    </div>
  );
}
```

### DragOverlay with Full Athlete Card Preview
```jsx
// Source: https://docs.dndkit.com/api-documentation/draggable/drag-overlay
import { DragOverlay } from '@dnd-kit/core';

function LineupBuilder() {
  const [activeId, setActiveId] = useState(null);
  const activeAthlete = activeId ? athletes.find(a => a.id === activeId) : null;

  return (
    <DndContext onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
      {/* ... draggables and droppables ... */}

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)', // Spring-like easing
      }}>
        {activeAthlete ? (
          <AthleteCard
            athlete={activeAthlete}
            isDragging
            showFullCard // Name, photo, side preference
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Side-by-Side Version Comparison
```jsx
// Based on: https://github.com/pmndrs/zustand/blob/main/docs/guides/tutorial-tic-tac-toe.md
function VersionHistory({ currentLineup, versions }) {
  const [compareVersion, setCompareVersion] = useState(null);

  return (
    <div>
      <select onChange={(e) => setCompareVersion(versions[e.target.value])}>
        <option>Select version to compare</option>
        {versions.map((v, i) => (
          <option key={v.id} value={i}>{v.name} - {v.timestamp}</option>
        ))}
      </select>

      {compareVersion && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3>Current</h3>
            <BoatView boats={currentLineup.boats} readOnly />
          </div>
          <div>
            <h3>{compareVersion.name}</h3>
            <BoatView boats={compareVersion.boats} readOnly />
          </div>
        </div>
      )}
    </div>
  );
}
```

### Biometrics Live Display
```jsx
// Pattern: Calculate averages from current lineup
function BiometricsPanel({ boats }) {
  const stats = useMemo(() => {
    const assignedAthletes = [];
    boats.forEach(boat => {
      boat.seats.forEach(seat => {
        if (seat.athlete) assignedAthletes.push(seat.athlete);
      });
      if (boat.coxswain) assignedAthletes.push(boat.coxswain);
    });

    if (assignedAthletes.length === 0) return null;

    const avgWeight = assignedAthletes.reduce((sum, a) => sum + (a.weight || 0), 0) / assignedAthletes.length;
    const avgHeight = assignedAthletes.reduce((sum, a) => sum + (a.height || 0), 0) / assignedAthletes.length;
    const avg2k = assignedAthletes
      .filter(a => a.erg2k)
      .reduce((sum, a, _, arr) => sum + a.erg2k / arr.length, 0);

    return { avgWeight, avgHeight, avg2k, count: assignedAthletes.length };
  }, [boats]);

  if (!stats) return <div>No athletes assigned</div>;

  return (
    <div className="biometrics">
      <div>Athletes: {stats.count}</div>
      <div>Avg Weight: {stats.avgWeight.toFixed(1)} kg</div>
      <div>Avg Height: {stats.avgHeight.toFixed(1)} cm</div>
      <div>Avg 2k: {formatSplit(stats.avg2k)}</div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | dnd-kit | 2021-2023 | react-beautiful-dnd deprecated, community moved to dnd-kit or hello-pangea/dnd fork. dnd-kit has better performance, smaller bundle, more flexible |
| HTML5 Drag and Drop API | Pointer Events API via dnd-kit | 2020+ | HTML5 DnD has poor touch support. Pointer Events unify mouse/touch/pen into single API |
| CSS transitions for drag | Spring physics (Framer Motion) | 2022+ | Spring physics feel more natural, velocity-aware, don't require precise timing curves |
| Puppeteer for PDF | jsPDF + html2canvas | Ongoing | Client-side generation avoids server dependency, works offline, faster for simple layouts |
| Global undo stack | Scoped undo (trackedKeys) | Best practice | Global undo is confusing in multi-feature apps. Scoped undo (e.g., just lineup changes) is clearer UX |

**Deprecated/outdated:**
- react-beautiful-dnd: Officially unmaintained as of 2021. Use dnd-kit or hello-pangea/dnd fork.
- react-dnd: Still maintained but more complex API, larger bundle. dnd-kit preferred for new projects in 2026.
- pako for compression: jsPDF v3+ uses fflate (20-30% smaller files).

## Open Questions

Things that couldn't be fully resolved:

1. **Margin Visualizer Shell Silhouettes (MARG-01)**
   - What we know: Requirement says "top-down shell silhouette PNG for each boat type"
   - What's unclear: Do these PNGs already exist in `/public/images/`? Or need to be created/sourced?
   - Recommendation: During planning, verify if shell silhouette assets exist. If not, task includes sourcing/creating 8+, 4+, 2x PNGs.

2. **Mobile UI "Full Redesign"**
   - What we know: CONTEXT.md says "Full redesign for mobile — different UI entirely for small screens"
   - What's unclear: How different? Separate page? Modal? Different drag mechanics (tap-to-select vs drag)?
   - Recommendation: Plan mobile UI as separate component variant, not just responsive CSS. Per decisions: tap-to-select, tap-to-place workflow (no drag on mobile).

3. **Version History Storage Strategy**
   - What we know: API has duplicate/fetch endpoints, versions auto-saved on save
   - What's unclear: Are versions full snapshots or deltas? Max versions per lineup? Auto-prune old versions?
   - Recommendation: Implement as full snapshots (simpler, safer). Backend should handle pruning if needed. Frontend just displays list.

4. **Biometrics Display Density**
   - What we know: LINE-12 requires "average biometrics as lineup is built"
   - What's unclear: Show per-boat or across all boats? Update on every drag or debounced? Show on seats or separate panel?
   - Recommendation: Separate panel (less cluttered). Update on drag end (not during drag). Show per-boat and total.

## Sources

### Primary (HIGH confidence)
- **/websites/dndkit** (Context7) - Drag-drop patterns, sensors, collision detection, DragOverlay
- **/grx7/framer-motion** (Context7) - Spring physics, drag gestures, animation API
- **/pmndrs/zustand** (Context7) - Undo/redo middleware patterns, history management
- Codebase: `/src/store/lineupStore.js`, `/src/store/undoMiddleware.js` - Existing working implementation

### Secondary (MEDIUM confidence)
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Library comparison, dnd-kit recommended
- [dnd-kit Documentation](https://docs.dndkit.com) - Official patterns and API
- [Generating PDFs from HTML in React with html2canvas and jsPDF](https://medium.com/@saidularefin8/generating-pdfs-from-html-in-a-react-application-with-html2canvas-and-jspdf-d46c5785eff2) - PDF export pattern
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - Version persistence patterns
- [React Form Validation Solutions](https://blog.logrocket.com/react-form-validation-sollutions-ultimate-roundup/) - Validation patterns (warnings vs errors)

### Tertiary (LOW confidence)
- [React Form Validation - Support warnings](https://github.com/react-hook-form/react-hook-form/issues/1761) - Community discussion on non-blocking warnings (feature request, not implemented)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via Context7, package.json, and 2026 ecosystem consensus
- Architecture: HIGH - Patterns sourced from official docs and existing codebase
- Pitfalls: HIGH - Based on known dnd-kit edge cases and codebase audit

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable ecosystem, minor updates expected)
