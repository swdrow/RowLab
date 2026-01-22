import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Layout,
  Users,
  LineChart,
  FileText,
  Search,
  Trash2,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import useTrainingPlanStore from '../store/trainingPlanStore';
import PlanBuilderCalendar from '../components/TrainingPlans/PlanBuilderCalendar';
import PlannedWorkoutModal from '../components/TrainingPlans/PlannedWorkoutModal';
import AthleteAssignmentPanel from '../components/TrainingPlans/AthleteAssignmentPanel';
import TrainingLoadChart from '../components/TrainingPlans/TrainingLoadChart';
import PeriodizationTemplateModal from '../components/TrainingPlans/PeriodizationTemplateModal';

/**
 * TrainingPlanPage - Main page for managing training plans
 *
 * Features:
 * - Plan list sidebar
 * - Calendar view for workout scheduling
 * - Athlete assignment panel
 * - Training load visualization
 * - Template-based plan creation
 */
function TrainingPlanPage() {
  const [activeTab, setActiveTab] = useState('calendar'); // calendar, assignments, analytics
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    plans,
    selectedPlan,
    loading,
    error,
    fetchPlans,
    fetchPlan,
    createPlan,
    deletePlan,
    selectPlan,
    clearError,
  } = useTrainingPlanStore();

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = !searchQuery ||
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = !filterPhase || plan.phase === filterPhase;
    return matchesSearch && matchesPhase && !plan.isTemplate;
  });

  // Handle plan selection
  const handleSelectPlan = async (plan) => {
    if (selectedPlan?.id === plan.id) return;
    await fetchPlan(plan.id);
  };

  // Handle create new plan
  const handleCreatePlan = async (planData) => {
    try {
      await createPlan(planData);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create plan:', err);
    }
  };

  // Handle delete plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this training plan?')) return;
    try {
      await deletePlan(planId);
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  const PHASES = ['Base', 'Build', 'Peak', 'Taper', 'Recovery'];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-muted hover:text-text-primary transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-spectrum-violet/10 border border-spectrum-violet/20 flex items-center justify-center">
              <Calendar size={20} className="md:hidden text-spectrum-violet" />
              <Calendar size={24} className="hidden md:block text-spectrum-violet" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-text-primary">Training Plans</h1>
              <p className="text-xs md:text-sm text-text-muted hidden sm:block">Create and manage periodized training programs</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-void-surface border border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-white/10 transition-all"
            >
              <FileText size={16} className="md:hidden" />
              <FileText size={18} className="hidden md:block" />
              <span className="text-sm font-medium hidden md:inline">From Template</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
            >
              <Plus size={16} className="md:hidden" />
              <Plus size={18} className="hidden md:block" />
              <span className="hidden sm:inline">New Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-void-deep/80 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar - Plan List */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-80 flex-shrink-0 border-r border-white/[0.06] flex flex-col
          bg-void-elevated lg:bg-transparent
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.06]">
            <span className="text-sm font-medium text-text-primary">Training Plans</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plans..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all text-sm"
              />
            </div>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all text-sm"
            >
              <option value="">All Phases</option>
              {PHASES.map((phase) => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>

          {/* Plan List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading && !plans.length ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blade-blue border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-text-muted text-sm mt-3">Loading plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={40} className="mx-auto text-text-muted opacity-50" />
                <p className="text-text-muted text-sm mt-3">No training plans yet</p>
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setSidebarOpen(false);
                  }}
                  className="mt-3 text-blade-blue text-sm hover:underline"
                >
                  Create your first plan
                </button>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    handleSelectPlan(plan);
                    setSidebarOpen(false);
                  }}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all group
                    ${selectedPlan?.id === plan.id
                      ? 'bg-blade-blue/10 border border-blade-blue/30'
                      : 'bg-void-surface border border-white/[0.06] hover:border-white/10'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary truncate">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{plan.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(plan.id);
                      }}
                      className="p-1.5 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger-red hover:bg-danger-red/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    {plan.phase && (
                      <span className={`
                        px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                        ${plan.phase === 'Base' ? 'bg-spectrum-cyan/10 text-spectrum-cyan' : ''}
                        ${plan.phase === 'Build' ? 'bg-blade-blue/10 text-blade-blue' : ''}
                        ${plan.phase === 'Peak' ? 'bg-danger-red/10 text-danger-red' : ''}
                        ${plan.phase === 'Taper' ? 'bg-warning-orange/10 text-warning-orange' : ''}
                        ${plan.phase === 'Recovery' ? 'bg-success/10 text-success' : ''}
                      `}>
                        {plan.phase}
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">
                      {plan.workoutCount || 0} workouts
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {plan.activeAssignments || 0} athletes
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedPlan ? (
            <>
              {/* Plan Header & Tabs */}
              <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-white/[0.06]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Back button on mobile */}
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="lg:hidden p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-text-primary">{selectedPlan.name}</h2>
                      {selectedPlan.description && (
                        <p className="text-xs md:text-sm text-text-muted mt-1 line-clamp-1">{selectedPlan.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    {selectedPlan.startDate && (
                      <span className="text-[10px] md:text-xs text-text-muted">
                        {new Date(selectedPlan.startDate).toLocaleDateString()} - {selectedPlan.endDate ? new Date(selectedPlan.endDate).toLocaleDateString() : 'Ongoing'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
                  {[
                    { id: 'calendar', label: 'Calendar', icon: Layout },
                    { id: 'assignments', label: 'Athletes', icon: Users },
                    { id: 'analytics', label: 'Analytics', icon: LineChart },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap
                          ${activeTab === tab.id
                            ? 'bg-blade-blue/10 text-blade-blue'
                            : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                          }
                        `}
                      >
                        <Icon size={14} className="md:hidden" />
                        <Icon size={16} className="hidden md:block" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'calendar' && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <PlanBuilderCalendar
                        plan={selectedPlan}
                        onAddWorkout={() => setShowWorkoutModal(true)}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'assignments' && (
                    <motion.div
                      key="assignments"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AthleteAssignmentPanel plan={selectedPlan} />
                    </motion.div>
                  )}
                  {activeTab === 'analytics' && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <TrainingLoadChart plan={selectedPlan} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <Calendar size={48} className="mx-auto text-text-muted opacity-30" />
                <p className="text-text-muted mt-4">Select a plan to view details</p>
                <p className="text-text-muted/60 text-sm mt-1">or create a new one to get started</p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-4 px-4 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary text-sm hover:text-text-primary hover:border-white/10 transition-all"
                >
                  Browse Plans
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreatePlan}
          />
        )}
      </AnimatePresence>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <PeriodizationTemplateModal
            onClose={() => setShowTemplateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Workout Modal */}
      <AnimatePresence>
        {showWorkoutModal && selectedPlan && (
          <PlannedWorkoutModal
            planId={selectedPlan.id}
            onClose={() => setShowWorkoutModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm"
          >
            {error}
            <button onClick={clearError} className="ml-3 hover:underline">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Create Plan Modal Component
function CreatePlanModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    phase: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
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
        className="w-full max-w-md rounded-xl bg-void-elevated border border-white/[0.08] shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-medium text-text-primary">Create Training Plan</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Plan Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Spring Racing Season"
              className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add a description..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Training Phase
            </label>
            <select
              value={form.phase}
              onChange={(e) => setForm({ ...form, phase: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all"
            >
              <option value="">Select phase...</option>
              <option value="Base">Base</option>
              <option value="Build">Build</option>
              <option value="Peak">Peak</option>
              <option value="Taper">Taper</option>
              <option value="Recovery">Recovery</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
            >
              Create Plan
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default TrainingPlanPage;
