import React, { useMemo } from 'react';
import { Calendar, Check, Clock, X } from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isPast,
  isSameDay,
} from 'date-fns';

/**
 * ScheduleWidget - Calendar week view of scheduled workouts
 *
 * Format: Mon-Sun week view
 * - Past: Completed indicator (checkmark) or missed (muted)
 * - Today: Highlighted, shows time if scheduled
 * - Future: Scheduled workout type
 */
function ScheduleWidget({
  workouts = [], // Array of { date, type, time?, completed?, missed? }
  className = '',
}) {
  // Get current week days
  const weekDays = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, []);

  // Map workouts to days
  const workoutsByDay = useMemo(() => {
    const map = new Map();
    workouts.forEach(workout => {
      const dayKey = format(new Date(workout.date), 'yyyy-MM-dd');
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey).push(workout);
    });
    return map;
  }, [workouts]);

  // Get day status
  const getDayStatus = (day, dayWorkouts) => {
    const today = isToday(day);
    const past = isPast(day) && !today;

    if (!dayWorkouts || dayWorkouts.length === 0) {
      return {
        status: past ? 'empty-past' : today ? 'today-empty' : 'empty-future',
        color: 'text-text-muted/40',
        bg: 'bg-transparent',
        border: 'border-white/[0.04]',
      };
    }

    const completed = dayWorkouts.some(w => w.completed);
    const missed = dayWorkouts.some(w => w.missed);

    if (today) {
      return {
        status: 'today-scheduled',
        color: 'text-blade-blue',
        bg: 'bg-blade-blue/10',
        border: 'border-blade-blue/30',
      };
    }

    if (past) {
      if (completed) {
        return {
          status: 'completed',
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/20',
        };
      }
      if (missed) {
        return {
          status: 'missed',
          color: 'text-danger-red/60',
          bg: 'bg-danger-red/5',
          border: 'border-danger-red/10',
        };
      }
      return {
        status: 'past',
        color: 'text-text-muted',
        bg: 'bg-void-surface',
        border: 'border-white/[0.06]',
      };
    }

    return {
      status: 'scheduled',
      color: 'text-text-secondary',
      bg: 'bg-void-surface',
      border: 'border-white/[0.06]',
    };
  };

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-spectrum-cyan/10 border border-spectrum-cyan/20 flex items-center justify-center">
          <Calendar size={20} className="text-spectrum-cyan" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-primary">This Week</h3>
          <p className="text-xs text-text-muted">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
          </p>
        </div>
      </div>

      {/* Week grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayWorkouts = workoutsByDay.get(dayKey);
            const { status, color, bg, border } = getDayStatus(day, dayWorkouts);
            const today = isToday(day);

            return (
              <div
                key={dayKey}
                className={`
                  relative flex flex-col items-center p-2 rounded-lg border
                  ${bg} ${border}
                  ${today ? 'ring-1 ring-blade-blue/50' : ''}
                  transition-all duration-100
                `}
              >
                {/* Day name */}
                <div className={`text-[10px] uppercase tracking-wider mb-1 ${today ? 'text-blade-blue font-medium' : 'text-text-muted'}`}>
                  {format(day, 'EEE')}
                </div>

                {/* Day number */}
                <div className={`text-sm font-mono font-medium ${today ? 'text-blade-blue' : 'text-text-primary'}`}>
                  {format(day, 'd')}
                </div>

                {/* Workout indicator */}
                <div className="mt-2 h-5 flex items-center justify-center">
                  {status === 'completed' && (
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Check size={12} className="text-success" />
                    </div>
                  )}
                  {status === 'missed' && (
                    <div className="w-5 h-5 rounded-full bg-danger-red/10 flex items-center justify-center">
                      <X size={12} className="text-danger-red/60" />
                    </div>
                  )}
                  {(status === 'today-scheduled' || status === 'scheduled' || status === 'past') && dayWorkouts?.length > 0 && (
                    <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${color} bg-current/10`}>
                      {dayWorkouts[0].type?.slice(0, 4) || 'WKT'}
                    </div>
                  )}
                  {status === 'today-scheduled' && dayWorkouts?.[0]?.time && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[9px] text-blade-blue">
                      <Clock size={8} />
                      {dayWorkouts[0].time}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 pb-4 text-[10px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success/20 flex items-center justify-center">
            <Check size={8} className="text-success" />
          </div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blade-blue/20" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-danger-red/10 flex items-center justify-center">
            <X size={8} className="text-danger-red/60" />
          </div>
          <span>Missed</span>
        </div>
      </div>
    </div>
  );
}

export default ScheduleWidget;
