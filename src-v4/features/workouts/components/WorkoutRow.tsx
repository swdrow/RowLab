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

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col items-end min-w-0 ${className ?? ''}`}>
      <span className="text-[10px] uppercase tracking-wider text-ink-muted leading-none mb-0.5 hidden sm:block">
        {label}
      </span>
      <span className="font-mono text-sm text-ink-primary tabular-nums">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Intensity classification                                            */
/* ------------------------------------------------------------------ */

type IntensityLevel = 'none' | 'medium' | 'high' | 'max';

/**
 * Determine workout intensity for the heat indicator bar.
 * Uses watts first; falls back to duration for non-watt workouts.
 */
function getIntensity(workout: Workout): IntensityLevel {
  const watts = workout.avgWatts;
  if (watts != null) {
    if (watts > 250) return 'max';
    if (watts > 200) return 'high';
    if (watts >= 150) return 'medium';
    return 'none';
  }

  // Duration fallback for non-watt workouts (strength, yoga, etc.)
  const dur = workout.durationSeconds;
  if (dur != null) {
    if (dur > 5400) return 'max'; // >90 min
    if (dur > 3600) return 'high'; // >60 min
  }

  return 'none';
}

/** CSS color for the intensity heat bar. Uses design token CSS variables. */
const INTENSITY_COLOR: Record<Exclude<IntensityLevel, 'none'>, string> = {
  medium: 'var(--color-data-ok, var(--color-data-excellent))',
  high: 'var(--color-data-warning)',
  max: 'var(--color-data-poor)',
};

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
  const intensity = getIntensity(workout);

  return (
    <motion.div variants={listItemVariants} transition={SPRING_SMOOTH} className="group">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="relative flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-ink-hover hover:-translate-y-px transition-all duration-150 cursor-pointer"
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
          <Metric label="Pace" value={formatPace(workout.avgPace, workout.machineType)} />
          <Metric
            label="Watts"
            value={workout.avgWatts != null ? String(workout.avgWatts) : DASH}
            className="hidden sm:flex"
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

        {/* Intensity heat indicator bar (right edge) */}
        {intensity !== 'none' && (
          <div
            className="absolute right-0 top-0 bottom-0 w-0.5 rounded-full pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, ${INTENSITY_COLOR[intensity]}${intensity === 'medium' ? '4d' : intensity === 'high' ? '66' : '80'}, transparent)`,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
