import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import { SPRING_CONFIG } from '@v2/utils/animations';
import type { Athlete } from '@v2/types/lineup';

/**
 * Source position for athlete being dragged
 */
export interface AthleteSource {
  type: 'bank' | 'seat' | 'coxswain';
  boatId?: string;
  seatNumber?: number;
}

/**
 * Props for DraggableAthleteCard
 */
interface DraggableAthleteCardProps {
  athlete: Athlete;
  source: AthleteSource;
  className?: string;
}

/**
 * Get side preference badge configuration
 */
function getSideBadge(athlete: Athlete): { text: string; color: string } {
  if (athlete.side === 'Cox') {
    return { text: 'Cox', color: 'bg-purple-500/10 text-purple-600' };
  } else if (athlete.side === 'Both') {
    return { text: 'Both', color: 'bg-blue-500/10 text-blue-600' };
  } else if (athlete.side === 'Port') {
    return { text: 'Port', color: 'bg-red-500/10 text-red-600' };
  } else if (athlete.side === 'Starboard') {
    return { text: 'Starboard', color: 'bg-green-500/10 text-green-600' };
  }
  return { text: 'Unknown', color: 'bg-gray-500/10 text-gray-600' };
}

/**
 * DraggableAthleteCard - Draggable athlete card using dnd-kit
 *
 * Features:
 * - Uses useDraggable hook from @dnd-kit/core
 * - Tracks source position (bank or seat) for auto-swap logic
 * - Shows athlete avatar, name, side preference badge
 * - Opacity 0.5 during drag (original card fades)
 * - Cursor changes to 'grab' (idle) and 'grabbing' (active)
 * - Full athlete card shown at cursor via DragOverlay (in LineupWorkspace)
 *
 * Per CONTEXT.md: "Full athlete card shown at cursor during drag (name, photo/avatar, side preference)"
 *
 * Source tracking is CRITICAL for auto-swap - must know where athlete came from.
 */
export function DraggableAthleteCard({
  athlete,
  source,
  className = '',
}: DraggableAthleteCardProps) {
  const sideBadge = getSideBadge(athlete);

  // Setup draggable with source data
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `athlete-${athlete.id}-${source.type}-${source.boatId || 'bank'}-${source.seatNumber || 0}`,
    data: {
      athlete,
      source,
    },
  });

  // Apply transform during drag
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={`${athlete.firstName} ${athlete.lastName}, ${athlete.side || 'no side preference'}. Press space to pick up.`}
      aria-roledescription="draggable"
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileDrag={{ scale: 1.05 }}
      transition={SPRING_CONFIG}
      className={`
        p-3 rounded-lg
        border border-transparent
        hover:border-bdr-default hover:bg-bg-hover
        focus-visible:ring-2 focus-visible:ring-interactive-primary focus-visible:ring-offset-2
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${className}
      `}
    >
      {/* Athlete Info */}
      <div className="flex items-center gap-3">
        <AthleteAvatar firstName={athlete.firstName} lastName={athlete.lastName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-txt-primary truncate">
            {athlete.firstName} {athlete.lastName}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`
                text-xs font-medium px-2 py-0.5 rounded-full
                ${sideBadge.color}
              `}
            >
              {sideBadge.text}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DraggableAthleteCard;
