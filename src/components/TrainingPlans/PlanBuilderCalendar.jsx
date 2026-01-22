import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Activity,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
} from 'date-fns';
import useTrainingPlanStore from '../../store/trainingPlanStore';
import PlannedWorkoutModal from './PlannedWorkoutModal';

// Workout type colors
const WORKOUT_TYPE_STYLES = {
  erg: { bg: 'bg-blade-blue/10', text: 'text-blade-blue', border: 'border-blade-blue/30' },
  row: { bg: 'bg-spectrum-cyan/10', text: 'text-spectrum-cyan', border: 'border-spectrum-cyan/30' },
  cross_train: { bg: 'bg-warning-orange/10', text: 'text-warning-orange', border: 'border-warning-orange/30' },
  strength: { bg: 'bg-spectrum-violet/10', text: 'text-spectrum-violet', border: 'border-spectrum-violet/30' },
  rest: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
};

// Intensity colors
const INTENSITY_STYLES = {
  easy: { dot: 'bg-success' },
  moderate: { dot: 'bg-blade-blue' },
  hard: { dot: 'bg-warning-orange' },
  max: { dot: 'bg-danger-red' },
};

/**
 * PlanBuilderCalendar - Calendar view for building training plans
 */
function PlanBuilderCalendar({ plan, onAddWorkout }) {
  const [currentDate, setCurrentDate] = useState(plan?.startDate ? new Date(plan.startDate) : new Date());
  const [currentView, setCurrentView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  const { deleteWorkout, updateWorkout } = useTrainingPlanStore();

  // Get days to display based on view
  const displayDays = useMemo(() => {
    if (currentView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, currentView]);

  // Map workouts to days
  const workoutsByDay = useMemo(() => {
    const map = new Map();
    (plan?.workouts || []).forEach((workout) => {
      if (!workout.scheduledDate) return;
      const dayKey = format(new Date(workout.scheduledDate), 'yyyy-MM-dd');
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey).push(workout);
    });
    return map;
  }, [plan?.workouts]);

  // Navigate
  const navigate = (direction) => {
    if (currentView === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  // Handle day click
  const handleDayClick = (day) => {
    setSelectedDate(day);
    setSelectedWorkout(null);
    setShowWorkoutModal(true);
  };

  // Handle workout click
  const handleWorkoutClick = (workout, e) => {
    e.stopPropagation();
    setSelectedWorkout(workout);
    setSelectedDate(new Date(workout.scheduledDate));
    setShowWorkoutModal(true);
  };

  // Handle delete workout
  const handleDeleteWorkout = async (workoutId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this workout?')) return;
    try {
      await deleteWorkout(plan.id, workoutId);
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  // Get workout type style
  const getTypeStyle = (type) => {
    return WORKOUT_TYPE_STYLES[type] || WORKOUT_TYPE_STYLES.erg;
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  };

  return (
    <div className="rounded-xl bg-void-elevated border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">
            {format(currentDate, currentView === 'week' ? "'Week of' MMM d" : 'MMMM yyyy')}
          </h3>
          <span className="text-xs text-text-muted">
            {plan?.workouts?.length || 0} workouts scheduled
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg bg-void-surface border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => setCurrentView('week')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                currentView === 'week'
                  ? 'bg-blade-blue/10 text-blade-blue'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCurrentView('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                currentView === 'month'
                  ? 'bg-blade-blue/10 text-blade-blue'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('prev')}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              Today
            </button>
            <button
              onClick={() => navigate('next')}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-[10px] font-medium uppercase tracking-wider text-text-muted py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className={`grid grid-cols-7 gap-1 ${currentView === 'month' ? 'auto-rows-[90px]' : 'auto-rows-[120px]'}`}>
          {displayDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayWorkouts = workoutsByDay.get(dayKey) || [];
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={dayKey}
                onClick={() => handleDayClick(day)}
                className={`
                  relative flex flex-col p-2 rounded-lg border text-left transition-all cursor-pointer group
                  ${today
                    ? 'bg-blade-blue/5 border-blade-blue/30 ring-1 ring-blade-blue/20'
                    : 'bg-void-surface border-white/[0.04] hover:border-white/10 hover:bg-white/[0.02]'
                  }
                  ${!inMonth && currentView === 'month' ? 'opacity-40' : ''}
                `}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-medium ${today ? 'text-blade-blue' : 'text-text-secondary'}`}>
                    {format(day, 'd')}
                  </span>
                  <Plus size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Workouts */}
                <div className="flex-1 mt-1 overflow-hidden space-y-1">
                  {dayWorkouts.slice(0, currentView === 'month' ? 2 : 3).map((workout) => {
                    const style = getTypeStyle(workout.type);
                    return (
                      <div
                        key={workout.id}
                        onClick={(e) => handleWorkoutClick(workout, e)}
                        className={`
                          flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium truncate
                          ${style.bg} ${style.text} border ${style.border}
                          hover:brightness-110 transition-all cursor-pointer
                        `}
                      >
                        {workout.intensity && (
                          <span className={`w-1.5 h-1.5 rounded-full ${INTENSITY_STYLES[workout.intensity]?.dot || ''}`} />
                        )}
                        <span className="truncate">{workout.name}</span>
                        {workout.duration && (
                          <span className="text-[8px] opacity-70">{formatDuration(workout.duration)}</span>
                        )}
                      </div>
                    );
                  })}
                  {dayWorkouts.length > (currentView === 'month' ? 2 : 3) && (
                    <span className="text-[9px] text-text-muted">
                      +{dayWorkouts.length - (currentView === 'month' ? 2 : 3)} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Types:</span>
          {Object.entries(WORKOUT_TYPE_STYLES).map(([type, style]) => (
            <span key={type} className={`text-[10px] font-medium ${style.text} capitalize`}>
              {type.replace('_', ' ')}
            </span>
          ))}
          <span className="text-[10px] text-text-muted uppercase tracking-wider ml-4">Intensity:</span>
          {Object.entries(INTENSITY_STYLES).map(([intensity, style]) => (
            <span key={intensity} className="flex items-center gap-1 text-[10px] text-text-muted capitalize">
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              {intensity}
            </span>
          ))}
        </div>
      </div>

      {/* Workout Modal */}
      <AnimatePresence>
        {showWorkoutModal && plan && (
          <PlannedWorkoutModal
            planId={plan.id}
            workout={selectedWorkout}
            defaultDate={selectedDate}
            onClose={() => {
              setShowWorkoutModal(false);
              setSelectedWorkout(null);
              setSelectedDate(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlanBuilderCalendar;
