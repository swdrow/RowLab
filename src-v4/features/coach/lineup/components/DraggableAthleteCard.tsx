/**
 * Draggable athlete card using Pragmatic DnD (Atlassian).
 *
 * Uses the imperative useEffect+ref pattern (NOT hooks like dnd-kit).
 * The `draggable()` call returns a cleanup function that runs on unmount.
 *
 * Visual states:
 * - idle: Card styling with grab cursor and interactive hover lift
 * - dragging: reduced opacity + scale on source card
 * - selected: copper accent border highlight (mobile tap-select mode)
 *
 * When `readOnly` is true, drag is disabled (draggable() is never called).
 */
import { useRef, useState, useEffect } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { Side } from '../types';

// ---------------------------------------------------------------------------
// Athlete info shape (minimal -- what the card needs to render)
// ---------------------------------------------------------------------------

export interface AthleteInfo {
  id: string;
  firstName: string;
  lastName: string;
  side?: Side | 'Both' | 'Cox';
  weight?: number | null;
  height?: number | null;
  erg2k?: string | null;
}

// Drag data attached to the draggable element
export interface AthleteDragData {
  type: 'athlete';
  athleteId: string;
  source: 'bank' | 'seat' | 'coxswain';
  boatIndex?: number;
  seatNumber?: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DraggableAthleteCardProps {
  athlete: AthleteInfo;
  source: 'bank' | 'seat' | 'coxswain';
  boatIndex?: number;
  seatNumber?: number;
  isSelected?: boolean;
  readOnly?: boolean;
  onTap?: () => void;
  compact?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Side badge helper
// ---------------------------------------------------------------------------

function getSideBadge(side?: string): { text: string; classes: string } | null {
  switch (side) {
    case 'Cox':
      return { text: 'Cox', classes: 'bg-accent-teal-primary/10 text-accent-teal-primary' };
    case 'Both':
      return { text: 'Both', classes: 'bg-data-good/10 text-data-good' };
    case 'Port':
      return { text: 'P', classes: 'bg-data-poor/10 text-data-poor' };
    case 'Starboard':
      return { text: 'S', classes: 'bg-data-excellent/10 text-data-excellent' };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DraggableAthleteCard({
  athlete,
  source,
  boatIndex,
  seatNumber,
  isSelected = false,
  readOnly = false,
  onTap,
  compact = false,
  className = '',
}: DraggableAthleteCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Register draggable via Pragmatic DnD imperative API
  useEffect(() => {
    const el = ref.current;
    if (!el || readOnly) return;

    return draggable({
      element: el,
      getInitialData: () => ({
        type: 'athlete',
        athleteId: athlete.id,
        source,
        boatIndex,
        seatNumber,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [athlete.id, source, boatIndex, seatNumber, readOnly]);

  const sideBadge = getSideBadge(athlete.side);
  const initials = `${athlete.firstName[0] || ''}${athlete.lastName[0] || ''}`.toUpperCase();

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap?.();
        }
      }}
      aria-label={`${athlete.firstName} ${athlete.lastName}${athlete.side ? `, ${athlete.side}` : ''}. ${readOnly ? '' : 'Drag to assign.'}`}
      aria-roledescription={readOnly ? undefined : 'draggable'}
      className={`
        group relative flex items-center gap-2.5 rounded-xl
        transition-all duration-200 ease-out
        ${compact ? 'px-2 py-1.5' : 'px-3 py-2.5'}
        ${readOnly ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${
          isSelected
            ? 'bg-accent-teal/10 border border-accent-teal ring-1 ring-accent-teal/30 shadow-focus'
            : compact
              ? 'bg-transparent border-0'
              : 'panel border border-edge-default/50 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:border-edge-hover'
        }
        ${className}
      `.trim()}
    >
      {/* Avatar circle */}
      <div
        className={`
          flex-shrink-0 flex items-center justify-center rounded-lg
          bg-void-deep text-text-dim font-semibold
          ${compact ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'}
        `}
      >
        {initials}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-text-bright truncate ${compact ? 'text-xs' : 'text-sm'}`}>
          {athlete.firstName} {athlete.lastName}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 mt-0.5">
            {athlete.weight && (
              <span className="text-[11px] text-text-faint px-1.5 py-0.5 rounded bg-void-deep/60">
                {athlete.weight}kg
              </span>
            )}
            {athlete.erg2k && (
              <span className="text-[11px] text-text-faint px-1.5 py-0.5 rounded bg-void-deep/60">
                {athlete.erg2k}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Side badge */}
      {sideBadge && (
        <span
          className={`
            flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded
            ${sideBadge.classes}
          `}
        >
          {sideBadge.text}
        </span>
      )}
    </div>
  );
}
