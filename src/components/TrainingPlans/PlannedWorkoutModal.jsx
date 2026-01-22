import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Target, Activity, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import useTrainingPlanStore from '../../store/trainingPlanStore';

const WORKOUT_TYPES = [
  { id: 'erg', name: 'Erg', color: 'blade-blue' },
  { id: 'row', name: 'On Water', color: 'spectrum-cyan' },
  { id: 'cross_train', name: 'Cross Train', color: 'warning-orange' },
  { id: 'strength', name: 'Strength', color: 'spectrum-violet' },
  { id: 'rest', name: 'Rest', color: 'success' },
];

const INTENSITIES = [
  { id: 'easy', name: 'Easy', color: 'success' },
  { id: 'moderate', name: 'Moderate', color: 'blade-blue' },
  { id: 'hard', name: 'Hard', color: 'warning-orange' },
  { id: 'max', name: 'Max', color: 'danger-red' },
];

// Static class mappings for Tailwind (prevents dynamic class issues)
const WORKOUT_TYPE_CLASSES = {
  'blade-blue': {
    active: 'bg-blade-blue/20 text-blade-blue border-blade-blue/40',
  },
  'spectrum-cyan': {
    active: 'bg-spectrum-cyan/20 text-spectrum-cyan border-spectrum-cyan/40',
  },
  'warning-orange': {
    active: 'bg-warning-orange/20 text-warning-orange border-warning-orange/40',
  },
  'spectrum-violet': {
    active: 'bg-spectrum-violet/20 text-spectrum-violet border-spectrum-violet/40',
  },
  'success': {
    active: 'bg-success/20 text-success border-success/40',
  },
  'danger-red': {
    active: 'bg-danger-red/20 text-danger-red border-danger-red/40',
  },
};

/**
 * PlannedWorkoutModal - Create/edit planned workouts
 */
function PlannedWorkoutModal({ planId, workout, defaultDate, onClose }) {
  const isEditing = !!workout;
  const { addWorkout, updateWorkout, deleteWorkout, loading } = useTrainingPlanStore();
  const formRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    type: 'erg',
    description: '',
    scheduledDate: '',
    duration: '',
    distance: '',
    targetPace: '',
    targetHeartRate: '',
    intensity: 'moderate',
  });

  // Format pace (seconds per 500m) to MM:SS - defined before useEffect that uses it
  function formatPace(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Parse pace (MM:SS) to seconds
  function parsePace(paceStr) {
    if (!paceStr) return null;
    const [mins, secs] = paceStr.split(':').map(Number);
    if (isNaN(mins)) return null;
    return mins * 60 + (secs || 0);
  }

  // Initialize form with workout data or defaults
  useEffect(() => {
    if (workout) {
      setForm({
        name: workout.name || '',
        type: workout.type || 'erg',
        description: workout.description || '',
        scheduledDate: workout.scheduledDate ? format(new Date(workout.scheduledDate), 'yyyy-MM-dd') : '',
        duration: workout.duration ? Math.floor(workout.duration / 60).toString() : '',
        distance: workout.distance?.toString() || '',
        targetPace: workout.targetPace ? formatPace(workout.targetPace) : '',
        targetHeartRate: workout.targetHeartRate?.toString() || '',
        intensity: workout.intensity || 'moderate',
      });
    } else if (defaultDate) {
      setForm((prev) => ({
        ...prev,
        scheduledDate: format(defaultDate, 'yyyy-MM-dd'),
      }));
    }
  }, [workout, defaultDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const workoutData = {
      name: form.name,
      type: form.type,
      description: form.description || null,
      scheduledDate: form.scheduledDate || null,
      duration: form.duration ? parseInt(form.duration) * 60 : null,
      distance: form.distance ? parseInt(form.distance) : null,
      targetPace: parsePace(form.targetPace),
      targetHeartRate: form.targetHeartRate ? parseInt(form.targetHeartRate) : null,
      intensity: form.intensity,
    };

    try {
      if (isEditing) {
        await updateWorkout(planId, workout.id, workoutData);
      } else {
        await addWorkout(planId, workoutData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save workout:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await deleteWorkout(planId, workout.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  const handleSaveClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-void-deep/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-void-elevated border border-white/[0.08] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h3 className="font-medium text-text-primary">
              {isEditing ? 'Edit Workout' : 'Add Workout'}
            </h3>
            {form.scheduledDate && !isNaN(new Date(form.scheduledDate).getTime()) && (
              <p className="text-xs text-text-muted mt-0.5">
                {format(new Date(form.scheduledDate), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Workout Name */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Workout Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Morning Steady State"
              className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {WORKOUT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.id })}
                  className={`
                    px-2 py-2 rounded-lg text-xs font-medium text-center transition-all border
                    ${form.type === type.id
                      ? WORKOUT_TYPE_CLASSES[type.color]?.active || ''
                      : 'bg-void-surface border-white/[0.06] text-text-secondary hover:border-white/10'
                    }
                  `}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Intensity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {INTENSITIES.map((intensity) => (
                <button
                  key={intensity.id}
                  type="button"
                  onClick={() => setForm({ ...form, intensity: intensity.id })}
                  className={`
                    px-2 py-2 rounded-lg text-xs font-medium text-center transition-all border
                    ${form.intensity === intensity.id
                      ? WORKOUT_TYPE_CLASSES[intensity.color]?.active || ''
                      : 'bg-void-surface border-white/[0.06] text-text-secondary hover:border-white/10'
                    }
                  `}
                >
                  {intensity.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Scheduled Date
            </label>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all"
            />
          </div>

          {/* Duration & Distance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Duration (minutes)
              </label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="45"
                  min="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Distance (meters)
              </label>
              <div className="relative">
                <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: e.target.value })}
                  placeholder="10000"
                  min="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Target Pace & HR */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Target Pace (/500m)
              </label>
              <input
                type="text"
                value={form.targetPace}
                onChange={(e) => setForm({ ...form, targetPace: e.target.value })}
                placeholder="2:00"
                className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Target Heart Rate
              </label>
              <div className="relative">
                <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  value={form.targetHeartRate}
                  onChange={(e) => setForm({ ...form, targetHeartRate: e.target.value })}
                  placeholder="140"
                  min="0"
                  max="250"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Workout details, intervals, notes..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all resize-none"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-danger-red text-sm hover:bg-danger-red/10 transition-all"
            >
              <Trash2 size={14} />
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={loading || !form.name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              {isEditing ? 'Save' : 'Add Workout'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PlannedWorkoutModal;
