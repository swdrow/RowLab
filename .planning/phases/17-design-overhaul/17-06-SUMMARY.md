---
phase: 17-design-overhaul
plan: 06
subsystem: ui-components
tags: [modal, input, table, animations, warm-palette, form-components]
dependency-graph:
  requires: ["17-01", "17-03", "17-04"]
  provides: ["Modal with spring animations", "Input with validation states", "Table with data-dense styling"]
  affects: ["17-07", "all feature components using forms and tables"]
tech-stack:
  added: []
  patterns: ["MODAL_VARIANTS from animations.ts", "Form component with validation states", "Data-dense table primitives"]
key-files:
  created:
    - src/v2/components/ui/Input.tsx
    - src/v2/components/common/Table.tsx
  modified:
    - src/v2/components/ui/Modal.tsx
decisions:
  - id: "17-06-01"
    title: "Use MODAL_VARIANTS from animations.ts"
    choice: "Import centralized animation variants instead of defining inline"
    rationale: "Consistent animation behavior across all modals, single source of truth"
  - id: "17-06-02"
    title: "Input uses color-interactive-primary for focus"
    choice: "focus:ring-[var(--color-interactive-primary)]/20 with focus:border"
    rationale: "Clear visual focus indicator with warm palette consistency"
  - id: "17-06-03"
    title: "DataCell uses tabular-nums and right-alignment"
    choice: "font-mono tabular-nums text-right for numeric columns"
    rationale: "Numbers align properly like SpeedCoach display, data-forward aesthetic"
metrics:
  duration: "2 minutes"
  completed: "2026-01-27"
---

# Phase 17 Plan 06: Form & Table Components Summary

Updated Modal, Input, and Table components with warm palette and spring animations for the "Rowing Instrument" aesthetic.

## One-liner

Modal spring enter/exit, Input with focus/error states using warm tokens, Table with tabular-nums DataCell.

## What Was Done

### Task 1: Modal with Spring Animations (18e2725)

Updated Modal.tsx to use centralized MODAL_VARIANTS from animations.ts:

- Imported MODAL_VARIANTS for consistent enter/exit animations
- Added ModalHeader component with title and close button support
- Added ModalBody component for scrollable content area
- Uses SPRING_CONFIG (stiffness: 400, damping: 17) for physics
- Backdrop already had blur-sm and warm palette tokens

Key code:
```typescript
import { SPRING_CONFIG, MODAL_VARIANTS, usePrefersReducedMotion } from '../../utils/animations';

// Use centralized MODAL_VARIANTS from animations.ts for consistent enter/exit
const panelVariants = prefersReducedMotion
  ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
  : MODAL_VARIANTS;
```

### Task 2: Input with Validation States (d488781)

Created Input.tsx with clear focus and error states:

- Input component with label, error, hint, leftIcon, rightIcon props
- Focus states: `focus:ring-2 focus:ring-[var(--color-interactive-primary)]/20`
- Error states: `border-[var(--color-status-error)]` with error message
- Textarea variant for multi-line input
- Select component with custom caret
- All use warm stone palette tokens (--color-input-bg, --color-input-border)

Key code:
```typescript
const baseInputStyles = `
  bg-[var(--color-input-bg)]
  border border-[var(--color-input-border)]
  focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive-primary)]/20
  focus:border-[var(--color-interactive-primary)]
`;

const errorInputStyles = error
  ? 'border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20'
  : '';
```

### Task 3: Table with Data-Dense Styling (33b3664)

Created Table.tsx with data-dense but readable display:

- Table wrapper with rounded corners and subtle border
- TableHeader, TableBody, TableRow, TableHead, TableCell primitives
- DataCell for right-aligned numeric values with `font-mono tabular-nums`
- StatusCell with color-coded indicators (success/warning/error/info/neutral)
- SortableHead for sortable columns with direction arrow
- EmptyRow for empty state placeholder
- Hover states via `hover:bg-[var(--color-bg-hover)]`
- Divide borders via `divide-y divide-[var(--color-border-subtle)]`

Key code:
```typescript
// DataCell for numeric/metric data like a SpeedCoach display
export const DataCell = ({ className, ...props }) => (
  <td
    className={cn(
      'px-4 py-3 text-right',
      'font-mono tabular-nums',
      'text-[var(--color-text-primary)]',
      className
    )}
    {...props}
  />
);
```

## Verification Results

All verification criteria passed:

1. Modal uses MODAL_VARIANTS and SPRING_CONFIG for animations
2. Modal has backdrop-blur-sm on overlay
3. Input has focus ring with interactive-primary color
4. Input has error state with status-error color
5. Table has compact row spacing with divide borders
6. DataCell uses tabular-nums for aligned numbers
7. All components use var(--color-*) tokens

## Files Changed

| File | Change |
|------|--------|
| src/v2/components/ui/Modal.tsx | Updated imports, MODAL_VARIANTS, added ModalHeader/ModalBody |
| src/v2/components/ui/Input.tsx | Created - Input, Textarea, Select with validation |
| src/v2/components/common/Table.tsx | Created - Table primitives with DataCell, StatusCell |

## Commits

| Hash | Message |
|------|---------|
| 18e2725 | feat(17-06): update Modal with MODAL_VARIANTS and spring animations |
| d488781 | feat(17-06): create Input component with warm palette and validation |
| 33b3664 | feat(17-06): create Table component with data-dense styling |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Plan 17-07 can proceed. The foundational form and table components are now ready with:
- Modal with spring physics for satisfying enter/exit
- Input with clear focus/error states for form building
- Table with data-dense styling and tabular-nums for numeric displays
