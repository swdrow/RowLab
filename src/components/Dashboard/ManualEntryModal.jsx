import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap, Activity } from 'lucide-react';

/**
 * ManualEntryModal - Modal for manual erg data entry
 *
 * Used when coaches need to enter piece data manually (no C2 integration)
 */
function ManualEntryModal({
  isOpen,
  onClose,
  onSave,
  athleteName,
  pieceNumber,
}) {
  const [formData, setFormData] = useState({
    time: '',        // M:SS.T format
    split: '',       // M:SS.T format
    strokeRate: '',
    watts: '',
    distance: '',
  });
  const [errors, setErrors] = useState({});

  // Parse M:SS.T format to seconds
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\.?(\d)?$/);
    if (!match) return null;
    const [, mins, secs, tenth] = match;
    return parseInt(mins, 10) * 60 + parseInt(secs, 10) + (tenth ? parseInt(tenth, 10) / 10 : 0);
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.time) {
      newErrors.time = 'Time is required';
    } else if (!parseTimeToSeconds(formData.time)) {
      newErrors.time = 'Invalid format (use M:SS.T)';
    }

    if (formData.split && !parseTimeToSeconds(formData.split)) {
      newErrors.split = 'Invalid format (use M:SS.T)';
    }

    if (formData.strokeRate && (isNaN(formData.strokeRate) || formData.strokeRate < 10 || formData.strokeRate > 60)) {
      newErrors.strokeRate = 'Must be between 10-60';
    }

    if (formData.watts && (isNaN(formData.watts) || formData.watts < 50 || formData.watts > 1000)) {
      newErrors.watts = 'Must be between 50-1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) return;

    const timeSeconds = parseTimeToSeconds(formData.time);
    const splitSeconds = formData.split ? parseTimeToSeconds(formData.split) : null;

    const distance = formData.distance ? parseInt(formData.distance, 10) : 0;
    const computedSplit = splitSeconds || (distance > 0 ? timeSeconds / (distance / 500) : null);

    onSave?.({
      time: timeSeconds,
      split: computedSplit,
      strokeRate: formData.strokeRate ? parseInt(formData.strokeRate, 10) : null,
      watts: formData.watts ? parseInt(formData.watts, 10) : null,
      distance: distance > 0 ? distance : null,
    });

    // Reset form
    setFormData({ time: '', split: '', strokeRate: '', watts: '', distance: '' });
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    setFormData({ time: '', split: '', strokeRate: '', watts: '', distance: '' });
    setErrors({});
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-void-deep/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-void-elevated border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div>
                <h3 className="font-medium text-text-primary">Manual Entry</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {athleteName} • Piece {pieceNumber}
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close modal"
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Time - Required */}
              <div>
                <label htmlFor="manual-entry-time" className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  <Clock size={12} aria-hidden="true" />
                  Time *
                </label>
                <input
                  id="manual-entry-time"
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="M:SS.T (e.g., 6:30.0)"
                  aria-describedby={errors.time ? 'manual-entry-time-error' : undefined}
                  aria-invalid={errors.time ? 'true' : 'false'}
                  className={`w-full px-3 py-2.5 rounded-lg bg-void-surface border text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all ${
                    errors.time ? 'border-danger-red/50' : 'border-white/[0.06]'
                  }`}
                />
                {errors.time && <p id="manual-entry-time-error" className="text-[10px] text-danger-red mt-1">{errors.time}</p>}
              </div>

              {/* Split */}
              <div>
                <label htmlFor="manual-entry-split" className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  <Activity size={12} aria-hidden="true" />
                  Split (optional)
                </label>
                <input
                  id="manual-entry-split"
                  type="text"
                  value={formData.split}
                  onChange={(e) => setFormData({ ...formData, split: e.target.value })}
                  placeholder="M:SS.T (e.g., 1:45.0)"
                  aria-describedby={errors.split ? 'manual-entry-split-error' : undefined}
                  aria-invalid={errors.split ? 'true' : 'false'}
                  className={`w-full px-3 py-2.5 rounded-lg bg-void-surface border text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all ${
                    errors.split ? 'border-danger-red/50' : 'border-white/[0.06]'
                  }`}
                />
                {errors.split && <p id="manual-entry-split-error" className="text-[10px] text-danger-red mt-1">{errors.split}</p>}
              </div>

              {/* Row for Stroke Rate and Watts */}
              <div className="grid grid-cols-2 gap-3">
                {/* Stroke Rate */}
                <div>
                  <label htmlFor="manual-entry-stroke-rate" className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                    S/M
                  </label>
                  <input
                    id="manual-entry-stroke-rate"
                    type="number"
                    value={formData.strokeRate}
                    onChange={(e) => setFormData({ ...formData, strokeRate: e.target.value })}
                    placeholder="28"
                    min="10"
                    max="60"
                    aria-describedby={errors.strokeRate ? 'manual-entry-stroke-rate-error' : undefined}
                    aria-invalid={errors.strokeRate ? 'true' : 'false'}
                    className={`w-full px-3 py-2.5 rounded-lg bg-void-surface border text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all ${
                      errors.strokeRate ? 'border-danger-red/50' : 'border-white/[0.06]'
                    }`}
                  />
                  {errors.strokeRate && <p id="manual-entry-stroke-rate-error" className="text-[10px] text-danger-red mt-1">{errors.strokeRate}</p>}
                </div>

                {/* Watts */}
                <div>
                  <label htmlFor="manual-entry-watts" className="flex items-center gap-1 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    <Zap size={10} aria-hidden="true" />
                    Watts
                  </label>
                  <input
                    id="manual-entry-watts"
                    type="number"
                    value={formData.watts}
                    onChange={(e) => setFormData({ ...formData, watts: e.target.value })}
                    placeholder="280"
                    min="50"
                    max="1000"
                    aria-describedby={errors.watts ? 'manual-entry-watts-error' : undefined}
                    aria-invalid={errors.watts ? 'true' : 'false'}
                    className={`w-full px-3 py-2.5 rounded-lg bg-void-surface border text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all ${
                      errors.watts ? 'border-danger-red/50' : 'border-white/[0.06]'
                    }`}
                  />
                  {errors.watts && <p id="manual-entry-watts-error" className="text-[10px] text-danger-red mt-1">{errors.watts}</p>}
                </div>
              </div>

              {/* Distance */}
              <div>
                <label htmlFor="manual-entry-distance" className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                  Distance (m)
                </label>
                <input
                  id="manual-entry-distance"
                  type="number"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  placeholder="2000"
                  min="100"
                  max="100000"
                  className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-white/[0.06]">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-all"
              >
                Save Entry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ManualEntryModal;
