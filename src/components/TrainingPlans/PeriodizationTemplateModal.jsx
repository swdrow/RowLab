import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Calendar, Zap, TrendingUp, Check, ChevronRight } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import useTrainingPlanStore from '../../store/trainingPlanStore';

// Template icons/colors
const TEMPLATE_STYLES = {
  'base-building': { icon: TrendingUp, color: 'spectrum-cyan', desc: 'Build aerobic foundation' },
  'peak-performance': { icon: Zap, color: 'danger-red', desc: 'Race preparation' },
  'recovery': { icon: Calendar, color: 'success', desc: 'Active recovery' },
  'build-phase': { icon: TrendingUp, color: 'blade-blue', desc: 'Progressive overload' },
};

// Static class mappings for Tailwind (prevents dynamic class issues)
const COLOR_CLASSES = {
  'spectrum-cyan': {
    container: 'bg-spectrum-cyan/10 border-spectrum-cyan/20',
    icon: 'text-spectrum-cyan',
  },
  'danger-red': {
    container: 'bg-danger-red/10 border-danger-red/20',
    icon: 'text-danger-red',
  },
  'success': {
    container: 'bg-success/10 border-success/20',
    icon: 'text-success',
  },
  'blade-blue': {
    container: 'bg-blade-blue/10 border-blade-blue/20',
    icon: 'text-blade-blue',
  },
};

/**
 * PeriodizationTemplateModal - Create plans from pre-built templates
 */
function PeriodizationTemplateModal({ onClose }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [step, setStep] = useState('select'); // select, customize
  const [form, setForm] = useState({
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);

  const { fetchTemplates, createFromTemplate } = useTrainingPlanStore();

  // Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetchTemplates();
        setTemplates(data || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, []);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setForm({
      name: template.name,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setStep('customize');
  };

  // Handle create
  const handleCreate = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      await createFromTemplate(selectedTemplate.id, {
        name: form.name,
        startDate: form.startDate,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create from template:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate end date based on template duration
  const endDate = selectedTemplate && form.startDate
    ? format(addWeeks(new Date(form.startDate), selectedTemplate.duration), 'MMM d, yyyy')
    : null;

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
        className="w-full max-w-2xl rounded-xl bg-void-elevated border border-white/[0.08] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h3 className="font-medium text-text-primary">
              {step === 'select' ? 'Choose a Template' : 'Customize Plan'}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {step === 'select'
                ? 'Select a periodization template to get started'
                : `Based on ${selectedTemplate?.name}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {step === 'select' ? (
          <div className="flex-1 overflow-y-auto p-4">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="mx-auto text-text-muted opacity-30" />
                <p className="text-text-muted mt-4">Loading templates...</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {templates.map((template) => {
                  const style = TEMPLATE_STYLES[template.id] || TEMPLATE_STYLES['base-building'];
                  const Icon = style.icon;

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="p-5 rounded-xl bg-void-surface border border-white/[0.06] hover:border-white/10 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${COLOR_CLASSES[style.color]?.container || ''}`}>
                          <Icon size={24} className={COLOR_CLASSES[style.color]?.icon || ''} />
                        </div>
                        <ChevronRight size={18} className="text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
                      </div>

                      <h4 className="font-medium text-text-primary mt-4">{template.name}</h4>
                      <p className="text-sm text-text-muted mt-1">{template.description}</p>

                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-xs text-text-muted">
                          {template.duration} weeks
                        </span>
                        <span className="text-xs text-text-muted">
                          {template.weeklyStructure?.workoutsPerWeek || 5} workouts/week
                        </span>
                      </div>

                      {/* Phases */}
                      {template.phases && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {template.phases.map((phase) => (
                            <span
                              key={phase}
                              className={`
                                px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                                ${phase === 'Base' ? 'bg-spectrum-cyan/10 text-spectrum-cyan' : ''}
                                ${phase === 'Build' ? 'bg-blade-blue/10 text-blade-blue' : ''}
                                ${phase === 'Peak' ? 'bg-danger-red/10 text-danger-red' : ''}
                                ${phase === 'Taper' ? 'bg-warning-orange/10 text-warning-orange' : ''}
                                ${phase === 'Recovery' ? 'bg-success/10 text-success' : ''}
                              `}
                            >
                              {phase}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Template Preview */}
            {selectedTemplate && (
              <div className="p-4 rounded-xl bg-void-surface border border-white/[0.06]">
                <div className="flex items-center gap-4">
                  {(() => {
                    const style = TEMPLATE_STYLES[selectedTemplate.id] || TEMPLATE_STYLES['base-building'];
                    const Icon = style.icon;
                    return (
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${COLOR_CLASSES[style.color]?.container || ''}`}>
                        <Icon size={24} className={COLOR_CLASSES[style.color]?.icon || ''} />
                      </div>
                    );
                  })()}
                  <div>
                    <h4 className="font-medium text-text-primary">{selectedTemplate.name}</h4>
                    <p className="text-sm text-text-muted">{selectedTemplate.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.04]">
                  <div>
                    <div className="text-lg font-semibold text-text-primary">{selectedTemplate.duration}</div>
                    <div className="text-xs text-text-muted">weeks</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-text-primary">{selectedTemplate.weeklyStructure?.workoutsPerWeek || 5}</div>
                    <div className="text-xs text-text-muted">workouts/week</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-text-primary">{selectedTemplate.phases?.length || 1}</div>
                    <div className="text-xs text-text-muted">phases</div>
                  </div>
                </div>
              </div>
            )}

            {/* Customization Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Spring Racing Season"
                  className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all"
                />
              </div>

              {endDate && (
                <div className="p-3 rounded-lg bg-blade-blue/5 border border-blade-blue/20">
                  <div className="flex items-center gap-2 text-sm text-blade-blue">
                    <Calendar size={14} />
                    <span>Plan will run until {endDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Intensity Progression Preview */}
            {selectedTemplate?.weeklyStructure?.intensityProgression && (
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  Intensity Progression
                </label>
                <div className="flex items-end gap-1 h-20">
                  {selectedTemplate.weeklyStructure.intensityProgression.map((intensity, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-blade-blue/20 rounded-t transition-all"
                      style={{ height: `${intensity}%` }}
                      title={`Week ${idx + 1}: ${intensity}%`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-text-muted">Week 1</span>
                  <span className="text-[10px] text-text-muted">Week {selectedTemplate.duration}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
          {step === 'customize' && (
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              Back
            </button>
          )}
          {step === 'select' && <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            {step === 'customize' && (
              <button
                onClick={handleCreate}
                disabled={loading || !form.name.trim() || !form.startDate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-void-deep border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Create Plan
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PeriodizationTemplateModal;
