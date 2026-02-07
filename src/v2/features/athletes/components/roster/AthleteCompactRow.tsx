import { memo } from 'react';
import type { Row } from '@tanstack/react-table';
import { Pencil, ExternalLink } from 'lucide-react';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import type { Athlete } from '@v2/types/athletes';

export interface AthleteCompactRowProps {
  row: Row<Athlete>;
  onClick: (athlete: Athlete) => void;
  isKeyboardFocused: boolean;
}

const SIDE_COLORS: Record<string, string> = {
  Port: 'bg-red-500',
  Starboard: 'bg-green-500',
  Both: 'bg-blue-500',
  Cox: 'bg-purple-500',
};

const SIDE_ABBREV: Record<string, string> = {
  Port: 'P',
  Starboard: 'S',
  Both: 'B',
  Cox: 'C',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 dark:text-green-400',
  inactive: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
  injured: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  graduated: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

/**
 * Dense compact row at 48px height, inspired by Linear's dense list mode.
 * Shows maximum information density: checkbox, avatar, name, side, status, class year, erg time.
 * Hover reveals quick action buttons (edit, view profile).
 */
export const AthleteCompactRow = memo(function AthleteCompactRow({
  row,
  onClick,
  isKeyboardFocused,
}: AthleteCompactRowProps) {
  const athlete = row.original;
  const isSelected = row.getIsSelected();
  const side = athlete.side;
  const status = athlete.status || 'active';

  return (
    <div
      className={`
        group flex items-center gap-3 px-3 h-12 border-b border-bdr-subtle
        transition-colors cursor-pointer select-none
        ${isSelected ? 'bg-interactive-primary/10' : 'hover:bg-bg-hover'}
        ${isKeyboardFocused ? 'ring-2 ring-interactive-primary ring-inset' : ''}
      `}
      onClick={() => onClick(athlete)}
      role="row"
      aria-selected={isSelected}
    >
      {/* Selection Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 rounded border-bdr-default text-interactive-primary focus:ring-interactive-primary/50 flex-shrink-0 cursor-pointer"
        aria-label={`Select ${athlete.firstName} ${athlete.lastName}`}
      />

      {/* Avatar (24px) */}
      <AthleteAvatar
        firstName={athlete.firstName}
        lastName={athlete.lastName}
        size="sm"
        className="!w-6 !h-6 !text-[10px] flex-shrink-0"
      />

      {/* Name */}
      <span className="font-medium text-sm text-txt-primary truncate min-w-[120px] max-w-[200px]">
        {athlete.firstName} {athlete.lastName}
      </span>

      {/* Side Badge */}
      {side && (
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${SIDE_COLORS[side] || ''}`} />
          <span className="text-xs text-txt-secondary font-medium">
            {SIDE_ABBREV[side] || side}
          </span>
        </span>
      )}
      {!side && <span className="text-xs text-txt-tertiary flex-shrink-0">--</span>}

      {/* Status Badge */}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 capitalize ${
          STATUS_STYLES[status] || STATUS_STYLES.active
        }`}
      >
        {status}
      </span>

      {/* Class Year */}
      <span className="text-xs text-txt-secondary tabular-nums flex-shrink-0 w-10 text-center">
        {athlete.classYear ?? '--'}
      </span>

      {/* Latest Erg Time (from AthleteWithStats if available) */}
      <span className="text-xs text-txt-secondary tabular-nums flex-shrink-0 w-16 text-right hidden md:block">
        {(athlete as any).latestErgTest?.time ?? '--'}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Actions (visible on hover) */}
      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(athlete);
          }}
          className="p-1 rounded text-txt-tertiary hover:text-txt-primary hover:bg-bg-active transition-colors"
          aria-label={`Edit ${athlete.firstName} ${athlete.lastName}`}
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(athlete);
          }}
          className="p-1 rounded text-txt-tertiary hover:text-txt-primary hover:bg-bg-active transition-colors"
          aria-label={`View profile of ${athlete.firstName} ${athlete.lastName}`}
          title="View Profile"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});

export default AthleteCompactRow;
