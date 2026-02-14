/**
 * Compact workout row for the feed.
 * Shows machine icon, sport label, distance/time/pace/watts, source badge,
 * and a three-dot menu (Edit / Delete) that appears on hover.
 */

import { useState, useRef, useEffect, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import {
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  Activity,
  Zap,
  Pencil,
  Watch,
  MoreHorizontal,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

import { SPORT_CONFIG, SOURCE_CONFIG, type SportType, type SourceType } from '../constants';
import { getSportFromWorkout } from '../utils';
import { formatDistance, formatDuration, formatPace } from '@/lib/format';
import { listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import type { Workout } from '../types';

/* ------------------------------------------------------------------ */
/* Icon lookups                                                        */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  Activity,
  Zap,
  Pencil,
  Watch,
};

function resolveSportIcon(sport: SportType): LucideIcon {
  return ICON_MAP[SPORT_CONFIG[sport].icon] ?? Activity;
}

function resolveSourceIcon(source: SourceType): LucideIcon {
  return ICON_MAP[SOURCE_CONFIG[source].icon] ?? Activity;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface WorkoutRowProps {
  workout: Workout;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
}

/* ------------------------------------------------------------------ */
/* Three-dot menu                                                      */
/* ------------------------------------------------------------------ */

function RowMenu({
  workout,
  onEdit,
  onDelete,
}: {
  workout: Workout;
  onEdit: (w: Workout) => void;
  onDelete: (w: Workout) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: Event) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onEdit(workout);
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onDelete(workout);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="p-1.5 rounded-md hover:bg-ink-hover transition-colors"
        aria-label="Workout actions"
      >
        <MoreHorizontal size={16} className="text-ink-tertiary" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-ink-raised border border-ink-border rounded-lg shadow-card py-1">
          <button
            type="button"
            onClick={handleEdit}
            className="w-full text-left px-3 py-2 text-sm text-ink-primary hover:bg-ink-hover transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-sm text-data-poor hover:bg-ink-hover transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Metric cell helper                                                  */
/* ------------------------------------------------------------------ */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-ink-muted leading-none mb-0.5 hidden sm:block">
        {label}
      </span>
      <span className="font-mono text-sm text-ink-primary tabular-nums">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* WorkoutRow                                                          */
/* ------------------------------------------------------------------ */

const DASH = '\u2014';

export function WorkoutRow({ workout, isExpanded, onToggle, onEdit, onDelete }: WorkoutRowProps) {
  const sport = getSportFromWorkout(workout);
  const config = SPORT_CONFIG[sport];
  const SportIcon = resolveSportIcon(sport);
  const sourceKey = (workout.source ?? 'manual') as SourceType;
  const SourceIcon = resolveSourceIcon(sourceKey);
  const sourceColor = SOURCE_CONFIG[sourceKey].color;

  return (
    <motion.div variants={listItemVariants} transition={SPRING_SMOOTH} className="group">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-ink-hover transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        {/* Sport icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `var(--color-${config.color}, oklch(0.62 0.12 55)) / 0.12)` }}
        >
          <SportIcon size={18} className={`text-${config.color}`} />
        </div>

        {/* Sport label */}
        <span className="text-sm font-medium text-ink-primary w-16 shrink-0 truncate">
          {config.label}
        </span>

        {/* Metrics */}
        <div className="flex-1 flex items-center justify-end gap-4 sm:gap-6 min-w-0">
          <Metric label="Dist" value={formatDistance(workout.distanceM)} />
          <Metric label="Time" value={formatDuration(workout.durationSeconds)} />
          <Metric label="Pace" value={formatPace(workout.avgPace)} />
          <Metric
            label="Watts"
            value={workout.avgWatts != null ? String(workout.avgWatts) : DASH}
          />
        </div>

        {/* Source badge + menu + chevron */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <SourceIcon size={14} className={`text-${sourceColor}`} />

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <RowMenu workout={workout} onEdit={onEdit} onDelete={onDelete} />
          </div>

          <ChevronRight
            size={14}
            className={`text-ink-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>
    </motion.div>
  );
}
