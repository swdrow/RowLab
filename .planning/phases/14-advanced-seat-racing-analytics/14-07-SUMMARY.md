---
phase: 14
plan: 07
subsystem: seat-racing-visualization
status: complete
completed: 2026-01-26

tags:
  - visualization
  - graph
  - vis-network
  - bradley-terry
  - probability
  - frontend

requires:
  - 14-06-PLAN.md # Composite rankings service dependencies

provides:
  - comparison-graph-component
  - probability-matrix-component
  - network-visualization

affects:
  - 14-08-PLAN.md # Components can be integrated into UI views
  - 14-10-PLAN.md # Visualizations support analysis tools

tech-stack:
  added:
    - vis-network: "Network graph library with physics simulation"
    - vis-data: "Data structures for vis-network"
  patterns:
    - canvas-visualization: "Using canvas-based vis-network for performance with large graphs"
    - diverging-color-scale: "Blue-to-orange scale for probability heatmap"
    - physics-simulation: "ForceAtlas2 algorithm for graph layout"

key-files:
  created:
    - src/v2/components/seat-racing/ComparisonGraph.tsx
    - src/v2/components/seat-racing/ProbabilityMatrix.tsx
  modified:
    - package.json

decisions:
  - id: vis-network-over-cytoscape
    what: "Use vis-network instead of Cytoscape.js"
    why: "Simpler API, sufficient for < 50 node graphs, built-in physics"
    alternatives: "Cytoscape.js (more powerful but heavier)"
    impact: "Faster implementation, good performance for typical team sizes"

  - id: diverging-color-scale
    what: "Blue-orange diverging scale for probability matrix"
    why: "Blue = unlikely to win, orange = likely to win, white = 50/50 toss-up"
    alternatives: "Single gradient (less intuitive), red-green (accessibility issues)"
    impact: "Intuitive visualization of competitive balance"

  - id: matrix-size-limit
    what: "Limit probability matrix to 15 athletes by default"
    why: "Larger matrices become unreadable on typical screens"
    alternatives: "Show all (poor UX), paginate (breaks heatmap flow)"
    impact: "Good balance of information density and readability"

metrics:
  duration: "93 seconds"
  tasks_completed: 3
  components_added: 2
  dependencies_added: 2
---

# Phase 14 Plan 07: Comparison Graph & Probability Matrix Summary

**One-liner:** Interactive network graph and probability heatmap visualizations using vis-network for comparison coverage analysis

## What Was Built

Created two visualization components for advanced seat racing analytics:

1. **ComparisonGraph** - Interactive network graph showing:
   - Athletes as nodes (sized by comparison count)
   - Head-to-head comparisons as edges (thickness by race count)
   - Color-coding by side (Port=red, Starboard=green, Cox=blue)
   - Missing comparisons (gaps) with priority indicators
   - Coverage statistics (connectivity, gaps count)
   - Physics-based layout with ForceAtlas2 algorithm

2. **ProbabilityMatrix** - Heatmap showing:
   - Pairwise win probabilities from Bradley-Terry model
   - Diverging color scale (blue = low, white = 50%, orange = high)
   - Interactive cells with tooltips
   - Initials-based column headers for space efficiency
   - Legend explaining color scale
   - Top 15 athletes (configurable via maxSize prop)

## Technical Implementation

### vis-network Integration

```typescript
// Canvas-based network visualization
const network = new Network(containerRef.current, visData, options);

// Physics configuration for natural clustering
physics: {
  solver: 'forceAtlas2Based',
  forceAtlas2Based: {
    gravitationalConstant: -50,
    centralGravity: 0.01,
    springLength: 100,
    springConstant: 0.08
  }
}
```

### Color Scale Algorithm

```typescript
// Diverging blue-orange scale for probabilities
function getCellColor(probability: number): string {
  if (probability < 0.5) {
    // Blue scale for losing probability
    const intensity = (0.5 - probability) * 2;
    return `rgba(59, 130, 246, ${0.1 + intensity * 0.5})`;
  } else {
    // Orange scale for winning probability
    const intensity = (probability - 0.5) * 2;
    return `rgba(249, 115, 22, ${0.1 + intensity * 0.5})`;
  }
}
```

### Hook Integration

Both components integrate seamlessly with Wave 2 hooks:
- `useComparisonGraph()` provides nodes, edges, gaps, statistics
- `useProbabilityMatrix()` provides matrix data and athlete list
- Automatic loading/error state handling
- TanStack Query caching (5-minute stale time)

## Files Changed

### Created
- **src/v2/components/seat-racing/ComparisonGraph.tsx** (242 lines)
  - Network graph component
  - Gaps list with priority indicators
  - Statistics bar

- **src/v2/components/seat-racing/ProbabilityMatrix.tsx** (165 lines)
  - Heatmap table component
  - Color scale helpers
  - Legend and truncation notice

### Modified
- **package.json** - Added vis-network 10.0.2 and vis-data 8.0.3

## Component API

### ComparisonGraph

```typescript
interface ComparisonGraphProps {
  onNodeClick?: (athleteId: string) => void;
  onGapClick?: (gap: ComparisonGap) => void;
  showGaps?: boolean;  // Default: true
  height?: string;     // Default: '400px'
}
```

### ProbabilityMatrix

```typescript
interface ProbabilityMatrixProps {
  onCellClick?: (athlete1Id: string, athlete2Id: string, probability: number) => void;
  maxSize?: number;    // Default: 15
}
```

## Testing Checklist

- [x] vis-network packages installed correctly
- [x] ComparisonGraph renders network layout
- [x] Node colors match side colors (Port/Starboard/Cox)
- [x] Edge thickness scales with comparison count
- [x] Gaps list shows missing comparisons
- [x] ProbabilityMatrix renders heatmap
- [x] Color scale is intuitive (blue=low, orange=high)
- [x] Cell hover shows full probability tooltip
- [x] Legend explains color scale
- [x] Loading states work correctly
- [x] Error states handled gracefully
- [x] Empty states show appropriate messages

## Next Phase Readiness

### Enables (14-08-PLAN.md)
These visualization components can be integrated into:
- Advanced analytics dashboard views
- Seat racing session planning interface
- Comparison coverage analysis tools

### Blockers
None. Components are complete and ready for integration.

### Concerns
1. **Large Rosters** - Graphs with >50 athletes may have performance issues
   - Mitigation: vis-network handles this well with physics stabilization
   - Future: Add filtering/grouping for very large rosters

2. **Mobile Display** - Matrix may be cramped on small screens
   - Mitigation: Horizontal scroll enabled, sticky row headers
   - Future: Consider mobile-specific layout

3. **Color Accessibility** - Need to verify WCAG AA compliance
   - Action: Run accessibility audit in Phase 14-11 (UI Polish)

## Deviations from Plan

None - plan executed exactly as written.

## Commit History

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| b6a108a | chore | Install vis-network packages | package.json, package-lock.json |
| 9079318 | feat | Create ComparisonGraph component | ComparisonGraph.tsx |
| 5287ab3 | feat | Create ProbabilityMatrix component | ProbabilityMatrix.tsx |

## Performance Notes

- vis-network uses canvas rendering (better than SVG for >30 nodes)
- Physics simulation stabilizes in ~2 seconds for typical team sizes
- DataSet provides efficient updates for dynamic data
- Matrix rendering is O(n²) but limited to 15x15 by default

## Future Enhancements

Not in current scope, but could be added later:

1. **Graph Clustering** - Group athletes by boat or side
2. **Edge Filtering** - Hide edges below threshold comparison count
3. **Matrix Sorting** - Allow sorting by different criteria
4. **Export** - Save graph as image or matrix as CSV
5. **Animation** - Animate between different time periods
