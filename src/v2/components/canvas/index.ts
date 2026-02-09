/**
 * Canvas Design System Primitives
 *
 * Barrel export for all Canvas components. These are NOT generic UI components.
 * Every primitive here is specific to the Canvas design language:
 * - Chamfered corners (NOT rounded)
 * - Ruled headers (NOT card titles)
 * - Monospace readouts (NOT stats bars)
 * - Strip charts (NOT sparklines)
 * - Log tape entries (NOT card lists)
 *
 * Design Philosophy: Precision instrument panels, NOT SaaS cards
 */

export { ScrambleNumber } from './ScrambleNumber';
export type { ScrambleNumberProps } from './ScrambleNumber';

export { StripChart } from './StripChart';
export type { StripChartProps } from './StripChart';

export { RuledHeader } from './RuledHeader';
export type { RuledHeaderProps } from './RuledHeader';

export { CanvasChamferPanel } from './CanvasChamferPanel';
export type { CanvasChamferPanelProps } from './CanvasChamferPanel';

export { CanvasTicket } from './CanvasTicket';
export type { CanvasTicketProps } from './CanvasTicket';

export { CanvasLogEntry } from './CanvasLogEntry';
export type { CanvasLogEntryProps } from './CanvasLogEntry';

export { CanvasConsoleReadout } from './CanvasConsoleReadout';
export type { CanvasConsoleReadoutProps } from './CanvasConsoleReadout';

export { CanvasDataTable } from './CanvasDataTable';
export type { CanvasDataTableProps } from './CanvasDataTable';

export { CanvasModal } from './CanvasModal';
export type { CanvasModalProps } from './CanvasModal';

export { CanvasTabs } from './CanvasTabs';
export type { CanvasTabsProps } from './CanvasTabs';

export { CanvasFormField } from './CanvasFormField';
export type { CanvasFormFieldProps } from './CanvasFormField';

export { CanvasButton } from './CanvasButton';
export type { CanvasButtonProps } from './CanvasButton';

export { CanvasSelect } from './CanvasSelect';
export type { CanvasSelectProps } from './CanvasSelect';
