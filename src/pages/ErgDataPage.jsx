import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Activity,
  Upload,
  Plus,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Search,
  Zap,
  Target,
  X,
  FileText,
  AlertCircle,
  Loader2,
  Dumbbell,
  Link2
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import { useErgDataStore } from '../store/ergDataStore';
import { PageContainer } from '../components/Layout';
import SpotlightCard from '../components/ui/SpotlightCard';
import { FieldLines } from '../components/Generative';
import { Concept2Connection } from '../components/Concept2';

// Time formatting helpers
const formatTime = (seconds) => {
  if (!seconds) return '--:--.-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins}:${String(secs).padStart(2, '0')}.${tenths}`;
};

const parseTime = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\.?(\d)?/);
  if (!match) return null;
  const [, mins, secs, tenths = 0] = match;
  return parseInt(mins) * 60 + parseInt(secs) + parseInt(tenths) / 10;
};

// Custom tooltip for charts - Precision Instrument style
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-void-elevated/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <p className="font-medium text-text-primary text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-mono">
            {entry.name}: {formatTime(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================
// TEST TYPE BADGE - Semantic color coding
// ============================================
const TestTypeBadge = ({ type }) => {
  const config = {
    '2k': {
      label: '2K',
      bg: 'bg-warning-orange/15',
      text: 'text-warning-orange',
      border: 'border-warning-orange/30'
    },
    '6k': {
      label: '6K',
      bg: 'bg-coxswain-violet/15',
      text: 'text-coxswain-violet',
      border: 'border-coxswain-violet/30'
    },
    '30min': {
      label: '30min',
      bg: 'bg-white/5',
      text: 'text-text-secondary',
      border: 'border-white/10'
    },
    '60min': {
      label: '60min',
      bg: 'bg-white/5',
      text: 'text-text-secondary',
      border: 'border-white/10'
    },
    '500m': {
      label: '500m',
      bg: 'bg-blade-blue/15',
      text: 'text-blade-blue',
      border: 'border-blade-blue/30'
    }
  };

  const { label, bg, text, border } = config[type] || {
    label: type,
    bg: 'bg-white/5',
    text: 'text-text-muted',
    border: 'border-white/10'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${bg} ${text} ${border}`}>
      {label}
    </span>
  );
};

// ============================================
// STAT CARD - Precision Instrument style
// ============================================
const StatCard = ({ icon: Icon, label, value, subValue, trend, accentColor = 'green' }) => {
  const colorConfig = {
    green: {
      iconBg: 'bg-blade-blue/10',
      iconBorder: 'border-blade-blue/20',
      iconText: 'text-blade-blue',
      glow: 'shadow-[0_0_15px_rgba(0,112,243,0.15)]'
    },
    orange: {
      iconBg: 'bg-warning-orange/10',
      iconBorder: 'border-warning-orange/20',
      iconText: 'text-warning-orange',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
    },
    violet: {
      iconBg: 'bg-coxswain-violet/10',
      iconBorder: 'border-coxswain-violet/20',
      iconText: 'text-coxswain-violet',
      glow: 'shadow-[0_0_15px_rgba(124,58,237,0.15)]'
    },
    red: {
      iconBg: 'bg-danger-red/10',
      iconBorder: 'border-danger-red/20',
      iconText: 'text-danger-red',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]'
    }
  };

  const colors = colorConfig[accentColor] || colorConfig.green;

  return (
    <SpotlightCard
      spotlightColor={accentColor === 'orange' ? 'rgba(245,158,11,0.08)' : accentColor === 'violet' ? 'rgba(124,58,237,0.08)' : 'rgba(0,112,243,0.08)'}
      className={`
        rounded-xl
        bg-void-elevated border border-white/5
        hover:translate-y-[-2px]
        hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)]
        transition-all duration-150 ease-out
      `}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center ${colors.glow}`}>
            <Icon className={`w-5 h-5 ${colors.iconText}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-mono font-medium px-2 py-1 rounded-lg ${
              trend > 0
                ? 'text-blade-blue bg-blade-blue/10 border border-blade-blue/20'
                : 'text-danger-red bg-danger-red/10 border border-danger-red/20'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-3xl font-mono font-bold text-text-primary tabular-nums">{value}</div>
        <div className="text-[10px] uppercase tracking-widest text-text-muted mt-1 font-mono">{label}</div>
        {subValue && <div className="text-xs text-text-muted/70 mt-1">{subValue}</div>}
      </div>
    </SpotlightCard>
  );
};

// ============================================
// ADD TEST MODAL - Glass morphism style
// ============================================
const AddTestModal = ({ isOpen, onClose, athletes, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    athleteId: '',
    testType: '2k',
    time: '',
    date: new Date().toISOString().split('T')[0],
    watts: '',
    strokeRate: '',
    notes: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        athleteId: '',
        testType: '2k',
        time: '',
        date: new Date().toISOString().split('T')[0],
        watts: '',
        strokeRate: '',
        notes: ''
      });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const timeSeconds = parseTime(formData.time);
    if (!timeSeconds) {
      setError('Invalid time format. Please use mm:ss.t (e.g., 6:30.0)');
      return;
    }

    let splitSeconds = null;
    if (formData.testType === '2k') {
      splitSeconds = timeSeconds / 4;
    } else if (formData.testType === '6k') {
      splitSeconds = timeSeconds / 12;
    } else if (formData.testType === '500m') {
      splitSeconds = timeSeconds;
    }

    let distanceM = null;
    if (formData.testType === '2k') distanceM = 2000;
    else if (formData.testType === '6k') distanceM = 6000;
    else if (formData.testType === '500m') distanceM = 500;

    const testData = {
      athleteId: formData.athleteId,
      testType: formData.testType,
      testDate: formData.date,
      timeSeconds,
      splitSeconds,
      distanceM,
      watts: formData.watts ? parseInt(formData.watts) : null,
      strokeRate: formData.strokeRate ? parseInt(formData.strokeRate) : null,
      notes: formData.notes || null
    };

    try {
      await onSubmit(testData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save test');
    }
  };

  const testTypeColors = {
    '2k': 'bg-warning-orange text-void-deep border-warning-orange shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    '6k': 'bg-coxswain-violet text-white border-coxswain-violet shadow-[0_0_20px_rgba(124,58,237,0.4)]',
    '30min': 'bg-white/10 text-text-primary border-white/20',
    '500m': 'bg-blade-blue text-void-deep border-blade-blue shadow-[0_0_20px_rgba(0,112,243,0.4)]'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-void-deep/80 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={`
          relative max-w-md w-full rounded-2xl
          bg-void-elevated border border-white/5
          shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]
        `}
      >
        {/* Inner glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-void-elevated/50 border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-void-elevated transition-all"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,112,243,0.2)]">
              <Dumbbell className="w-5 h-5 text-blade-blue" />
            </div>
            <h2 className="text-lg font-display font-semibold text-text-primary tracking-[-0.02em]">
              Add Erg Test
            </h2>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Athlete select */}
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                Athlete
              </label>
              <select
                value={formData.athleteId}
                onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
                required
                disabled={isSubmitting}
              >
                <option value="" className="bg-void-elevated">Select athlete...</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id} className="bg-void-elevated">
                    {a.lastName}, {a.firstName}
                  </option>
                ))}
              </select>
            </div>

            {/* Test type */}
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                Test Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['2k', '6k', '30min', '500m'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, testType: type })}
                    disabled={isSubmitting}
                    className={`
                      px-3 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase border
                      transition-all duration-200
                      ${formData.testType === type
                        ? testTypeColors[type]
                        : 'bg-void-elevated/50 text-text-secondary border-white/[0.06] hover:border-white/10 hover:bg-void-elevated'
                      }
                    `}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Time input */}
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                Time (mm:ss.t)
              </label>
              <input
                type="text"
                placeholder="6:30.0"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all [color-scheme:dark]"
                disabled={isSubmitting}
              />
            </div>

            {/* Watts and Stroke Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                  Watts
                </label>
                <input
                  type="number"
                  placeholder="285"
                  value={formData.watts}
                  onChange={(e) => setFormData({ ...formData, watts: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                  SPM
                </label>
                <input
                  type="number"
                  placeholder="32"
                  value={formData.strokeRate}
                  onChange={(e) => setFormData({ ...formData, strokeRate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Test conditions, observations..."
                className="w-full px-4 py-3 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all resize-none"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full px-4 py-3 rounded-xl font-medium
                bg-blade-blue text-void-deep border border-blade-blue
                hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                flex items-center justify-center gap-2
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Test'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// ERROR BANNER - Precision style
// ============================================
const ErrorBanner = ({ message, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mb-4 p-4 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-danger-red/20 flex items-center justify-center">
        <AlertCircle className="w-4 h-4" />
      </div>
      <span className="text-sm">{message}</span>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="w-8 h-8 rounded-lg bg-danger-red/20 flex items-center justify-center hover:bg-danger-red/30 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </motion.div>
);

// ============================================
// LOADING SKELETON - Void colors
// ============================================
const LoadingSkeleton = () => (
  <div className="space-y-1 p-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-void-elevated animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-void-elevated rounded-lg w-1/3 mb-2 animate-pulse" />
          <div className="h-3 bg-void-elevated rounded-lg w-1/4 animate-pulse" />
        </div>
        <div className="text-right">
          <div className="h-5 bg-void-elevated rounded-lg w-16 mb-1 animate-pulse" />
          <div className="h-3 bg-void-elevated rounded-lg w-20 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

// ============================================
// MAIN PAGE COMPONENT
// ============================================
function ErgDataPage() {
  const { athletes } = useLineupStore();
  const {
    ergTests,
    loading,
    error,
    fetchErgTests,
    createErgTest,
    clearError
  } = useErgDataStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [testTypeFilter, setTestTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAthleteForC2, setSelectedAthleteForC2] = useState(null);
  const [showC2Integration, setShowC2Integration] = useState(false);

  useEffect(() => {
    fetchErgTests().catch((err) => {
      console.error('Failed to fetch erg tests:', err);
    });
  }, [fetchErgTests]);

  const handleC2SyncComplete = (result) => {
    // Refresh erg tests after sync
    fetchErgTests().catch((err) => {
      console.error('Failed to refresh erg tests:', err);
    });
  };

  const handleCreateTest = async (testData) => {
    setIsSubmitting(true);
    try {
      await createErgTest(testData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format tests for display
  const formattedTests = useMemo(() => {
    return ergTests.map((test) => {
      let athleteName = 'Unknown Athlete';
      if (test.athlete?.name) {
        athleteName = test.athlete.name;
      } else if (test.athlete?.lastName && test.athlete?.firstName) {
        athleteName = `${test.athlete.lastName}, ${test.athlete.firstName}`;
      } else {
        const athlete = athletes.find((a) => a.id === test.athleteId);
        if (athlete) {
          athleteName = `${athlete.lastName}, ${athlete.firstName}`;
        }
      }

      return {
        id: test.id,
        athleteId: test.athleteId,
        athleteName,
        testType: test.testType,
        time: test.timeSeconds,
        date: test.testDate ? new Date(test.testDate).toISOString().split('T')[0] : '',
        watts: test.watts,
        split: test.splitSeconds
      };
    });
  }, [ergTests, athletes]);

  // Team stats
  const teamStats = useMemo(() => {
    if (formattedTests.length === 0) return null;

    const twoKTests = formattedTests.filter((t) => t.testType === '2k');
    if (twoKTests.length === 0) {
      return {
        avg: null,
        best: null,
        avgWatts: null,
        testCount: formattedTests.length
      };
    }

    const times = twoKTests.map((t) => t.time).filter(Boolean);
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const best = times.length > 0 ? Math.min(...times) : null;
    const watts = twoKTests.map((t) => t.watts).filter(Boolean);
    const avgWatts = watts.length > 0 ? Math.round(watts.reduce((a, b) => a + b, 0) / watts.length) : null;

    return { avg, best, avgWatts, testCount: formattedTests.length };
  }, [formattedTests]);

  // Chart data
  const chartData = useMemo(() => {
    const twoKTests = formattedTests.filter((t) => t.testType === '2k' && t.time);

    if (twoKTests.length === 0) {
      const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      return months.map((month) => ({
        month,
        teamAvg: null,
        teamBest: null
      }));
    }

    const byMonth = {};
    for (const test of twoKTests) {
      const date = new Date(test.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }
      byMonth[monthKey].push(test.time);
    }

    const months = Object.keys(byMonth).slice(-6);
    return months.map((month) => {
      const times = byMonth[month] || [];
      return {
        month,
        teamAvg: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null,
        teamBest: times.length > 0 ? Math.min(...times) : null
      };
    });
  }, [formattedTests]);

  // Filtered tests
  const filteredTests = useMemo(() => {
    let result = [...formattedTests];

    if (testTypeFilter !== 'all') {
      result = result.filter((t) => t.testType === testTypeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.athleteName.toLowerCase().includes(query));
    }

    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [formattedTests, testTypeFilter, searchQuery]);

  // Filter button colors
  const filterColors = {
    all: { active: 'bg-white/10 text-text-primary border-white/20', inactive: '' },
    '2k': { active: 'bg-warning-orange text-void-deep border-warning-orange shadow-[0_0_15px_rgba(245,158,11,0.3)]', inactive: 'hover:border-warning-orange/30 hover:text-warning-orange' },
    '6k': { active: 'bg-coxswain-violet text-white border-coxswain-violet shadow-[0_0_15px_rgba(124,58,237,0.3)]', inactive: 'hover:border-coxswain-violet/30 hover:text-coxswain-violet' },
    '30min': { active: 'bg-white/10 text-text-primary border-white/20', inactive: '' },
    '500m': { active: 'bg-blade-blue text-void-deep border-blade-blue shadow-[0_0_15px_rgba(0,112,243,0.3)]', inactive: 'hover:border-blade-blue/30 hover:text-blade-blue' }
  };

  return (
    <PageContainer maxWidth="2xl" className="relative py-4 sm:py-6">
      {/* Generative field lines - data flow aesthetic */}
      <FieldLines
        count={6}
        color="rgba(0, 112, 243, 0.025)"
        duration={20}
        direction="horizontal"
        className="fixed inset-0 z-0"
      />

      {/* Background atmosphere - void glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blade-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-warning-orange/3 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.2)]">
            <Dumbbell size={22} className="text-blade-blue" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-[-0.02em]">
              Erg Data
            </h1>
            <p className="text-sm text-text-secondary">
              Track and analyze erg test results
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="group px-4 py-2.5 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-white/10 transition-all duration-200 flex items-center gap-2 text-sm font-medium">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="group px-4 py-2.5 rounded-xl bg-blade-blue text-void-deep border border-blade-blue hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Test
          </button>
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <ErrorBanner message={error} onDismiss={clearError} />
        )}
      </AnimatePresence>

      {/* Concept2 Integration Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => setShowC2Integration(!showC2Integration)}
          className="w-full sm:w-auto mb-3 px-4 py-2 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-white/10 transition-all text-sm font-medium flex items-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          {showC2Integration ? 'Hide' : 'Show'} Concept2 Integration
        </button>

        <AnimatePresence>
          {showC2Integration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-4">
                <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                  Select Athlete
                </label>
                <select
                  value={selectedAthleteForC2 || ''}
                  onChange={(e) => setSelectedAthleteForC2(e.target.value)}
                  className="w-full sm:max-w-md px-4 py-3 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
                >
                  <option value="" className="bg-void-elevated">Select athlete...</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id} className="bg-void-elevated">
                      {a.lastName}, {a.firstName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAthleteForC2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Concept2Connection
                    athleteId={selectedAthleteForC2}
                    onSyncComplete={handleC2SyncComplete}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard
            icon={Clock}
            label="Team Avg 2K"
            value={teamStats?.avg ? formatTime(teamStats.avg) : '--:--.-'}
            accentColor="violet"
            trend={teamStats?.avg ? -2 : null}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard
            icon={Award}
            label="Team Best 2K"
            value={teamStats?.best ? formatTime(teamStats.best) : '--:--.-'}
            accentColor="orange"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            icon={Zap}
            label="Avg Watts"
            value={teamStats?.avgWatts ? `${teamStats.avgWatts}W` : '--'}
            accentColor="orange"
            trend={teamStats?.avgWatts ? 5 : null}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            icon={Target}
            label="Total Tests"
            value={teamStats?.testCount ?? 0}
            accentColor="green"
          />
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SpotlightCard
          className={`
            rounded-xl mb-6
            bg-void-elevated border border-white/5
          `}
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,112,243,0.15)]">
                <TrendingUp className="w-5 h-5 text-blade-blue" />
              </div>
              <h3 className="text-base font-display font-semibold text-text-primary tracking-[-0.02em]">
                2K Performance Trend
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(v) => formatTime(v)}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '16px' }}
                    formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="teamAvg"
                    name="Team Avg"
                    stroke="#0070F3"
                    strokeWidth={2}
                    dot={{ fill: '#0070F3', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#0070F3', strokeWidth: 2, fill: '#0c0c0e' }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="teamBest"
                    name="Team Best"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, fill: '#0c0c0e' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Test History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <SpotlightCard
          className={`
            rounded-xl overflow-hidden
            bg-void-elevated border border-white/5
          `}
        >
          {/* Filters */}
          <div className="p-4 border-b border-white/[0.04] flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', '2k', '6k', '30min', '500m'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTestTypeFilter(type)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-mono font-semibold uppercase border
                    transition-all duration-200
                    ${testTypeFilter === type
                      ? filterColors[type].active
                      : `bg-void-elevated/50 text-text-secondary border-white/[0.06] hover:bg-void-elevated ${filterColors[type].inactive}`
                    }
                  `}
                >
                  {type === 'all' ? 'All' : type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Test list */}
          <div className="divide-y divide-white/[0.04]">
            {loading ? (
              <LoadingSkeleton />
            ) : filteredTests.length > 0 ? (
              filteredTests.map((test, i) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 hover:bg-void-elevated/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center group-hover:bg-blade-blue/15 group-hover:shadow-[0_0_15px_rgba(0,112,243,0.1)] transition-all">
                    <Activity className="w-5 h-5 text-blade-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary">
                      {test.athleteName}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <TestTypeBadge type={test.testType} />
                      <span className="text-xs text-text-muted font-mono">{test.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-semibold text-text-primary tabular-nums">
                      {formatTime(test.time)}
                    </div>
                    <div className="text-xs text-text-muted font-mono tabular-nums">
                      {test.watts ? `${test.watts}W` : '--'}
                      {test.split ? ` | 1:${formatTime(test.split).slice(2)}` : ''}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
                  <FileText className="w-10 h-10 text-text-muted" />
                </div>
                <h3 className="text-lg font-display font-semibold text-text-primary mb-2 tracking-[-0.02em]">No Tests Found</h3>
                <p className="text-text-secondary max-w-sm mx-auto mb-6 text-sm">
                  {searchQuery || testTypeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first erg test to get started'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blade-blue text-void-deep border border-blade-blue hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all duration-200 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Test
                </button>
              </motion.div>
            )}
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Add test modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddTestModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            athletes={athletes}
            onSubmit={handleCreateTest}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

export default ErgDataPage;
