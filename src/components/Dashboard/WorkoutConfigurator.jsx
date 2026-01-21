import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Ruler,
  Zap,
  Play,
  Calendar,
  Copy,
  ChevronDown,
} from 'lucide-react';

/**
 * WorkoutConfigurator - C2-style workout builder
 *
 * Allows coaches to:
 * - Select from quick-start templates
 * - Build custom workouts with intervals, rest, and targets
 * - Preview workout summary
 * - Start immediately or schedule for later
 */

// Preset workout templates
const WORKOUT_TEMPLATES = [
  { id: '2k-test', name: '2k Test', type: 'single', distance: 2000 },
  { id: '6k-test', name: '6k Test', type: 'single', distance: 6000 },
  { id: '30min', name: '30 Minute', type: 'single', time: 1800 },
  { id: '3x1500', name: '3×1500m', type: 'intervals', pieces: 3, distance: 1500, rest: 180 },
  { id: '4x1000', name: '4×1000m', type: 'intervals', pieces: 4, distance: 1000, rest: 120 },
  { id: '5x500', name: '5×500m', type: 'intervals', pieces: 5, distance: 500, rest: 90 },
  { id: '8x500', name: '8×500m', type: 'intervals', pieces: 8, distance: 500, rest: 60 },
  { id: '6x250', name: '6×250m', type: 'intervals', pieces: 6, distance: 250, rest: 60 },
];

// Common rest intervals
const REST_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1:00' },
  { value: 90, label: '1:30' },
  { value: 120, label: '2:00' },
  { value: 180, label: '3:00' },
  { value: 300, label: '5:00' },
];

// Common stroke rate targets
const STROKE_RATE_OPTIONS = [18, 20, 22, 24, 26, 28, 30, 32, 34, 36];

function WorkoutConfigurator({
  isOpen,
  onClose,
  onStartWorkout,
  onScheduleWorkout,
}) {
  // Configuration state
  const [mode, setMode] = useState('template'); // 'template' | 'custom'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Custom workout state
  const [workoutType, setWorkoutType] = useState('intervals'); // 'single' | 'intervals' | 'variable'
  const [pieces, setPieces] = useState([
    { id: 1, distance: 1000, time: null, rest: 120, targetSR: null }
  ]);
  const [targetStrokeRate, setTargetStrokeRate] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [notes, setNotes] = useState('');

  // Helper: format time in seconds to MM:SS
  const formatRestTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}:00`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add a new piece
  const addPiece = () => {
    const lastPiece = pieces[pieces.length - 1];
    setPieces([
      ...pieces,
      {
        id: pieces.length + 1,
        distance: lastPiece?.distance || 1000,
        time: lastPiece?.time || null,
        rest: lastPiece?.rest || 120,
        targetSR: lastPiece?.targetSR || null,
      }
    ]);
  };

  // Remove a piece
  const removePiece = (id) => {
    if (pieces.length > 1) {
      setPieces(pieces.filter(p => p.id !== id));
    }
  };

  // Update piece
  const updatePiece = (id, field, value) => {
    setPieces(pieces.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Apply template
  const applyTemplate = (template) => {
    setSelectedTemplate(template);
    setWorkoutName(template.name);

    if (template.type === 'single') {
      setWorkoutType('single');
      setPieces([{
        id: 1,
        distance: template.distance || null,
        time: template.time || null,
        rest: 0,
        targetSR: null,
      }]);
    } else if (template.type === 'intervals') {
      setWorkoutType('intervals');
      const newPieces = Array.from({ length: template.pieces }, (_, i) => ({
        id: i + 1,
        distance: template.distance,
        time: null,
        rest: i < template.pieces - 1 ? template.rest : 0, // No rest after last piece
        targetSR: null,
      }));
      setPieces(newPieces);
    }
  };

  // Reset configuration
  const resetConfig = () => {
    setMode('template');
    setSelectedTemplate(null);
    setWorkoutType('intervals');
    setPieces([{ id: 1, distance: 1000, time: null, rest: 120, targetSR: null }]);
    setTargetStrokeRate(null);
    setWorkoutName('');
    setNotes('');
  };

  // Calculate total workout summary
  const workoutSummary = useMemo(() => {
    const totalDistance = pieces.reduce((sum, p) => sum + (p.distance || 0), 0);
    const totalTime = pieces.reduce((sum, p) => sum + (p.time || 0), 0);
    const totalRest = pieces.reduce((sum, p) => sum + (p.rest || 0), 0);
    const pieceCount = pieces.length;

    return {
      totalDistance,
      totalTime,
      totalRest,
      pieceCount,
      type: workoutType,
    };
  }, [pieces, workoutType]);

  // Build workout config for submission
  const buildWorkoutConfig = () => ({
    name: workoutName || (selectedTemplate?.name || 'Custom Workout'),
    type: workoutType,
    pieces: pieces.map(p => ({
      distance: p.distance,
      time: p.time,
      rest: p.rest,
      targetStrokeRate: p.targetSR || targetStrokeRate,
    })),
    globalTargetStrokeRate: targetStrokeRate,
    notes,
    templateId: selectedTemplate?.id,
  });

  // Handle start workout
  const handleStartWorkout = () => {
    const config = buildWorkoutConfig();
    onStartWorkout?.(config);
    onClose?.();
    resetConfig();
  };

  // Handle schedule workout
  const handleScheduleWorkout = (date) => {
    const config = buildWorkoutConfig();
    onScheduleWorkout?.({ ...config, scheduledDate: date });
    onClose?.();
    resetConfig();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-void-elevated border border-white/[0.08] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-display font-semibold text-text-primary">
                Configure Workout
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Build a workout using templates or create custom intervals
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-white/[0.06]">
            <button
              onClick={() => setMode('template')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                mode === 'template'
                  ? 'text-blade-blue border-b-2 border-blade-blue bg-blade-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                mode === 'custom'
                  ? 'text-blade-blue border-b-2 border-blade-blue bg-blade-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Custom Builder
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[50vh]">
            {mode === 'template' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {WORKOUT_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl border transition-all
                      ${selectedTemplate?.id === template.id
                        ? 'bg-blade-blue/10 border-blade-blue/40 text-blade-blue shadow-[0_0_15px_rgba(0,112,243,0.15)]'
                        : 'bg-void-surface border-white/[0.06] text-text-secondary hover:border-white/10 hover:bg-white/[0.02]'
                      }
                    `}
                  >
                    <span className="font-mono text-lg font-semibold">
                      {template.name}
                    </span>
                    <span className="text-xs mt-1 opacity-60">
                      {template.distance
                        ? `${(template.distance * (template.pieces || 1)).toLocaleString()}m`
                        : `${Math.floor((template.time || 0) / 60)}min`
                      }
                    </span>
                  </button>
                ))}
              </div>
            )}

            {mode === 'custom' && (
              <div className="space-y-5">
                {/* Workout name */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    placeholder="e.g., Morning 3×2000m"
                    className="w-full px-4 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
                  />
                </div>

                {/* Workout type */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Workout Type
                  </label>
                  <div className="flex gap-2">
                    {['single', 'intervals', 'variable'].map(type => (
                      <button
                        key={type}
                        onClick={() => setWorkoutType(type)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${workoutType === type
                            ? 'bg-blade-blue/10 text-blade-blue border border-blade-blue/30'
                            : 'bg-void-surface text-text-secondary border border-white/[0.06] hover:border-white/10'
                          }
                        `}
                      >
                        {type === 'single' && 'Single Piece'}
                        {type === 'intervals' && 'Intervals'}
                        {type === 'variable' && 'Variable'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pieces builder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Pieces
                    </label>
                    <button
                      onClick={addPiece}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-blade-blue hover:bg-blade-blue/10 transition-all"
                    >
                      <Plus size={12} />
                      Add Piece
                    </button>
                  </div>

                  <div className="space-y-2">
                    {pieces.map((piece, index) => (
                      <div
                        key={piece.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-void-surface border border-white/[0.06]"
                      >
                        <span className="w-6 h-6 rounded bg-void-elevated flex items-center justify-center text-xs font-mono text-text-muted">
                          {index + 1}
                        </span>

                        {/* Distance */}
                        <div className="flex items-center gap-1.5 flex-1">
                          <Ruler size={14} className="text-text-muted" />
                          <input
                            type="number"
                            value={piece.distance || ''}
                            onChange={(e) => updatePiece(piece.id, 'distance', parseInt(e.target.value) || null)}
                            placeholder="Distance"
                            className="w-20 px-2 py-1.5 rounded bg-void-elevated border border-white/[0.06] text-sm font-mono text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all"
                          />
                          <span className="text-xs text-text-muted">m</span>
                        </div>

                        {/* Rest (not on last piece) */}
                        {index < pieces.length - 1 && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-text-muted" />
                            <select
                              value={piece.rest || 0}
                              onChange={(e) => updatePiece(piece.id, 'rest', parseInt(e.target.value))}
                              className="px-2 py-1.5 rounded bg-void-elevated border border-white/[0.06] text-sm font-mono text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all"
                            >
                              <option value={0}>No rest</option>
                              {REST_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Target stroke rate */}
                        <div className="flex items-center gap-1.5">
                          <Zap size={14} className="text-text-muted" />
                          <select
                            value={piece.targetSR || ''}
                            onChange={(e) => updatePiece(piece.id, 'targetSR', parseInt(e.target.value) || null)}
                            className="px-2 py-1.5 rounded bg-void-elevated border border-white/[0.06] text-sm font-mono text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all"
                          >
                            <option value="">SR</option>
                            {STROKE_RATE_OPTIONS.map(sr => (
                              <option key={sr} value={sr}>{sr}</option>
                            ))}
                          </select>
                        </div>

                        {/* Remove */}
                        {pieces.length > 1 && (
                          <button
                            onClick={() => removePiece(piece.id)}
                            className="p-1.5 rounded text-text-muted hover:text-danger-red hover:bg-danger-red/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Global stroke rate target */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Global Stroke Rate Target (optional)
                  </label>
                  <select
                    value={targetStrokeRate || ''}
                    onChange={(e) => setTargetStrokeRate(parseInt(e.target.value) || null)}
                    className="px-4 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
                  >
                    <option value="">No target</option>
                    {STROKE_RATE_OPTIONS.map(sr => (
                      <option key={sr} value={sr}>{sr} s/m</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any instructions or notes..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="px-5 py-4 bg-void-surface border-t border-white/[0.06]">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-text-muted">Pieces: </span>
                <span className="font-mono text-text-primary">{workoutSummary.pieceCount}</span>
              </div>
              {workoutSummary.totalDistance > 0 && (
                <div>
                  <span className="text-text-muted">Total: </span>
                  <span className="font-mono text-text-primary">{workoutSummary.totalDistance.toLocaleString()}m</span>
                </div>
              )}
              {workoutSummary.totalRest > 0 && (
                <div>
                  <span className="text-text-muted">Rest: </span>
                  <span className="font-mono text-text-primary">{formatRestTime(workoutSummary.totalRest)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-5 border-t border-white/[0.06]">
            <button
              onClick={resetConfig}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              Reset
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {/* TODO: Schedule modal */}}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
              >
                <Calendar size={16} />
                Schedule
              </button>
              <button
                onClick={handleStartWorkout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
              >
                <Play size={16} />
                Start Now
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default WorkoutConfigurator;
