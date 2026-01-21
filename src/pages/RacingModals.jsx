/**
 * Racing Modals
 * Modal components for creating regattas and adding races
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Ship, X } from 'lucide-react';
import { InputField, SelectField, Checkbox, Button } from './RacingFormComponents';
import { courseTypeOptions, boatClassOptions } from './racing-config';

/**
 * CreateRegattaModal - Modal for creating a new regatta
 */
export function CreateRegattaModal({
  show,
  onClose,
  formData,
  onInputChange,
  onSubmit,
  error,
  loading,
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
            className="relative max-w-md w-full mx-4 rounded-xl border border-white/5 bg-void-elevated shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blade-blue" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  New Regatta
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-danger-red/10 border border-danger-red/20 rounded-lg"
                >
                  <p className="text-danger-red text-sm">{error}</p>
                </motion.div>
              )}

              <InputField
                label="Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                placeholder="e.g., Dad Vail Regatta"
                required
              />

              <InputField
                label="Location"
                type="text"
                name="location"
                value={formData.location}
                onChange={onInputChange}
                placeholder="e.g., Schuylkill River, Philadelphia"
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onInputChange}
                  required
                />
                <SelectField
                  label="Course Type"
                  name="courseType"
                  value={formData.courseType}
                  onChange={onInputChange}
                  options={courseTypeOptions}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={loading}
                >
                  Create Regatta
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * AddRaceModal - Modal for adding a race to a regatta
 */
export function AddRaceModal({
  show,
  onClose,
  formData,
  onInputChange,
  onSubmit,
  error,
  loading,
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
            className="relative max-w-md w-full mx-4 rounded-xl border border-white/5 bg-void-elevated shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning-orange/10 border border-warning-orange/20 flex items-center justify-center">
                  <Ship className="w-4 h-4 text-warning-orange" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Add Race
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-danger-red/10 border border-danger-red/20 rounded-lg"
                >
                  <p className="text-danger-red text-sm">{error}</p>
                </motion.div>
              )}

              <InputField
                label="Event Name"
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={onInputChange}
                placeholder="e.g., Men's Varsity 8+ Final"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Boat Class"
                  name="boatClass"
                  value={formData.boatClass}
                  onChange={onInputChange}
                  options={boatClassOptions}
                />
                <InputField
                  label="Distance (m)"
                  type="number"
                  name="distanceMeters"
                  value={formData.distanceMeters}
                  onChange={onInputChange}
                  min="100"
                  max="10000"
                  required
                />
              </div>

              <Checkbox
                label="Head Race (time trial)"
                name="isHeadRace"
                checked={formData.isHeadRace}
                onChange={onInputChange}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={loading}
                >
                  Add Race
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
