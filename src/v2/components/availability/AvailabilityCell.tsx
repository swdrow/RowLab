import type { AvailabilitySlot } from '../../types/coach';

interface AvailabilityCellProps {
  morningSlot: AvailabilitySlot;
  eveningSlot: AvailabilitySlot;
  onClick?: () => void;
}

const slotColors: Record<AvailabilitySlot, { bg: string; text: string }> = {
  AVAILABLE: { bg: 'bg-status-success/20', text: 'text-status-success' },
  UNAVAILABLE: { bg: 'bg-status-error/20', text: 'text-status-error' },
  MAYBE: { bg: 'bg-status-warning/20', text: 'text-status-warning' },
  NOT_SET: { bg: 'bg-bg-surface', text: 'text-text-muted' },
};

const slotLabels: Record<AvailabilitySlot, string> = {
  AVAILABLE: '✓',
  UNAVAILABLE: '✗',
  MAYBE: '?',
  NOT_SET: '—',
};

/**
 * AvailabilityCell - Display AM/PM availability slots with color coding
 *
 * Color scheme:
 * - AVAILABLE: green
 * - UNAVAILABLE: red
 * - MAYBE: yellow
 * - NOT_SET: gray
 */
export function AvailabilityCell({ morningSlot, eveningSlot, onClick }: AvailabilityCellProps) {
  const morning = slotColors[morningSlot];
  const evening = slotColors[eveningSlot];

  return (
    <div
      className="flex flex-col gap-0.5 p-1 rounded cursor-pointer hover:ring-2 hover:ring-interactive-primary transition-all"
      onClick={onClick}
    >
      {/* Morning slot */}
      <div className={`${morning.bg} ${morning.text} rounded px-2 py-1 text-xs font-medium text-center`}>
        AM {slotLabels[morningSlot]}
      </div>

      {/* Evening slot */}
      <div className={`${evening.bg} ${evening.text} rounded px-2 py-1 text-xs font-medium text-center`}>
        PM {slotLabels[eveningSlot]}
      </div>
    </div>
  );
}
