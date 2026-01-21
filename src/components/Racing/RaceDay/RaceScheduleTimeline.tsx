import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Ship,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertCircle,
  Timer,
} from 'lucide-react';

// Race status types
type RaceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface Race {
  id: number;
  eventName: string;
  boatClass: string;
  distanceMeters: number;
  isHeadRace?: boolean;
  scheduledTime?: string | null;
  results?: Array<{ id: number }>;
  status?: RaceStatus;
}

interface RaceScheduleTimelineProps {
  /** Array of races to display */
  races: Race[];
  /** Currently selected race ID */
  selectedRaceId?: number | null;
  /** Callback when a race is selected */
  onSelectRace?: (race: Race) => void;
  /** Callback to start a race (mark as in progress) */
  onStartRace?: (race: Race) => void;
  /** Show full timeline or compact */
  variant?: 'full' | 'compact';
}

/**
 * RaceScheduleTimeline - Visual timeline of race schedule
 *
 * Precision Instrument design:
 * - Vertical timeline with race cards
 * - Status indicators (scheduled, in progress, completed)
 * - Time-based ordering
 * - Interactive race selection
 */
export function RaceScheduleTimeline({
  races,
  selectedRaceId,
  onSelectRace,
  onStartRace,
  variant = 'full',
}: RaceScheduleTimelineProps) {
  // Sort races by scheduled time, then by ID
  const sortedRaces = useMemo(() => {
    return [...races].sort((a, b) => {
      // Races with scheduled times first
      if (a.scheduledTime && !b.scheduledTime) return -1;
      if (!a.scheduledTime && b.scheduledTime) return 1;
      if (a.scheduledTime && b.scheduledTime) {
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      }
      return a.id - b.id;
    });
  }, [races]);

  // Determine race status (mock - would come from backend)
  const getRaceStatus = (race: Race): RaceStatus => {
    if (race.status) return race.status;
    if (race.results && race.results.length > 0) return 'completed';
    return 'scheduled';
  };

  // Format time for display
  const formatTime = (timeStr: string | null | undefined): string => {
    if (!timeStr) return 'TBD';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get status icon and color
  const getStatusConfig = (status: RaceStatus) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'success-green',
          bgColor: 'bg-success-green/10',
          borderColor: 'border-success-green/30',
          label: 'Completed',
        };
      case 'in_progress':
        return {
          icon: PlayCircle,
          color: 'blade-blue',
          bgColor: 'bg-blade-blue/10',
          borderColor: 'border-blade-blue/30',
          label: 'In Progress',
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          color: 'danger-red',
          bgColor: 'bg-danger-red/10',
          borderColor: 'border-danger-red/30',
          label: 'Cancelled',
        };
      default:
        return {
          icon: Circle,
          color: 'text-muted',
          bgColor: 'bg-white/[0.02]',
          borderColor: 'border-white/[0.06]',
          label: 'Scheduled',
        };
    }
  };

  // Find next upcoming race
  const nextRaceIndex = useMemo(() => {
    const now = Date.now();
    return sortedRaces.findIndex((race) => {
      const status = getRaceStatus(race);
      if (status === 'completed' || status === 'cancelled') return false;
      if (status === 'in_progress') return true;
      if (race.scheduledTime) {
        return new Date(race.scheduledTime).getTime() > now;
      }
      return true;
    });
  }, [sortedRaces]);

  if (races.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
          <Clock className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-primary font-medium mb-1">No races scheduled</p>
        <p className="text-text-muted text-sm">Add races to see the schedule timeline.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {/* Races */}
      <div className="space-y-3">
        {sortedRaces.map((race, index) => {
          const status = getRaceStatus(race);
          const config = getStatusConfig(status);
          const Icon = config.icon;
          const isSelected = selectedRaceId === race.id;
          const isNext = index === nextRaceIndex;
          const isCompact = variant === 'compact';

          return (
            <motion.div
              key={race.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              className={`relative ${isCompact ? 'pl-10' : 'pl-14'}`}
            >
              {/* Timeline dot */}
              <div
                className={`
                  absolute left-0 flex items-center justify-center
                  ${isCompact ? 'w-8 h-8' : 'w-12 h-12'}
                  rounded-xl border transition-all
                  ${config.bgColor} ${config.borderColor}
                  ${isNext ? 'ring-2 ring-blade-blue/30' : ''}
                  ${isSelected ? 'ring-2 ring-blade-blue' : ''}
                `}
              >
                <Icon className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-${config.color}`} />
              </div>

              {/* Race card */}
              <button
                onClick={() => onSelectRace?.(race)}
                className={`
                  w-full text-left rounded-xl border transition-all
                  ${isCompact ? 'p-3' : 'p-4'}
                  ${isSelected
                    ? 'bg-blade-blue/10 border-blade-blue/30'
                    : 'bg-void-surface/60 border-white/[0.06] hover:bg-white/[0.02] hover:border-white/[0.1]'
                  }
                  ${isNext && !isSelected ? 'ring-1 ring-blade-blue/20' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Time */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-mono text-${config.color}`}>
                        {formatTime(race.scheduledTime)}
                      </span>
                      {isNext && status !== 'completed' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blade-blue/20 text-blade-blue rounded">
                          Next
                        </span>
                      )}
                    </div>

                    {/* Event name */}
                    <h4 className="font-medium text-text-primary truncate">
                      {race.eventName}
                    </h4>

                    {/* Details */}
                    {!isCompact && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Ship className="w-3 h-3" />
                          {race.boatClass}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Timer className="w-3 h-3" />
                          {race.distanceMeters}m
                        </span>
                        {race.results && race.results.length > 0 && (
                          <span className="text-xs text-success-green">
                            {race.results.length} results
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Start button for scheduled races */}
                  {status === 'scheduled' && onStartRace && !isCompact && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartRace(race);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blade-blue bg-blade-blue/10 border border-blade-blue/30 rounded-lg hover:bg-blade-blue/20 transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Start
                    </button>
                  )}

                  {/* Status badge for compact view */}
                  {isCompact && (
                    <span className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded ${config.bgColor} text-${config.color}`}>
                      {config.label}
                    </span>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default RaceScheduleTimeline;
