import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  Filter,
  Search,
  Calendar,
  Zap,
  Target,
  ChevronDown,
  X,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import { useErgDataStore } from '../store/ergDataStore';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

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

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl p-3 border border-white/20 shadow-lg">
        <p className="font-medium text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatTime(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Test type badge
const TestTypeBadge = ({ type }) => {
  const config = {
    '2k': { label: '2K', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    '6k': { label: '6K', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    '30min': { label: '30min', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    '60min': { label: '60min', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    '500m': { label: '500m', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  };

  const { label, color } = config[type] || { label: type, color: 'bg-gray-500/20 text-gray-400' };

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
};

// Stat card
const StatCard = ({ icon: Icon, label, value, subValue, trend, color }) => (
  <motion.div
    variants={fadeInUp}
    className="glass-card rounded-2xl p-5 border border-white/10"
  >
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
    </div>
  </motion.div>
);

// Add test modal
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

  // Reset form when modal opens
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

    // Parse time to seconds
    const timeSeconds = parseTime(formData.time);
    if (!timeSeconds) {
      setError('Invalid time format. Please use mm:ss.t (e.g., 6:30.0)');
      return;
    }

    // Calculate split (per 500m) - for 2k, split = time / 4
    let splitSeconds = null;
    if (formData.testType === '2k') {
      splitSeconds = timeSeconds / 4;
    } else if (formData.testType === '6k') {
      splitSeconds = timeSeconds / 12;
    } else if (formData.testType === '500m') {
      splitSeconds = timeSeconds;
    }

    // Calculate distance based on test type
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative glass-elevated rounded-3xl p-8 max-w-md w-full border border-white/20"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">
          Add Erg Test
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Athlete select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Athlete
            </label>
            <select
              value={formData.athleteId}
              onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-accent-blue outline-none text-white"
              required
              disabled={isSubmitting}
            >
              <option value="">Select athlete...</option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.lastName}, {a.firstName}
                </option>
              ))}
            </select>
          </div>

          {/* Test type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Test Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['2k', '6k', '30min', '500m'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, testType: type })}
                  disabled={isSubmitting}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    formData.testType === type
                      ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Time input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time (mm:ss.t)
            </label>
            <input
              type="text"
              placeholder="6:30.0"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-accent-blue outline-none text-white font-mono"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-accent-blue outline-none text-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Watts and Stroke Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Watts (optional)
              </label>
              <input
                type="number"
                placeholder="285"
                value={formData.watts}
                onChange={(e) => setFormData({ ...formData, watts: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-accent-blue outline-none text-white font-mono"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SPM (optional)
              </label>
              <input
                type="number"
                placeholder="32"
                value={formData.strokeRate}
                onChange={(e) => setFormData({ ...formData, strokeRate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-accent-blue outline-none text-white font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Test conditions, observations..."
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-accent-blue outline-none text-white resize-none"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium hover:shadow-glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      </motion.div>
    </motion.div>
  );
};

// Error banner component
const ErrorBanner = ({ message, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span>{message}</span>
    </div>
    {onDismiss && (
      <button onClick={onDismiss} className="p-1 hover:bg-red-500/20 rounded-lg">
        <X className="w-4 h-4" />
      </button>
    )}
  </motion.div>
);

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
          <div className="h-3 bg-white/10 rounded w-1/4" />
        </div>
        <div className="text-right">
          <div className="h-5 bg-white/10 rounded w-16 mb-1" />
          <div className="h-3 bg-white/10 rounded w-20" />
        </div>
      </div>
    ))}
  </div>
);

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

  // Fetch erg tests on mount
  useEffect(() => {
    fetchErgTests().catch((err) => {
      console.error('Failed to fetch erg tests:', err);
    });
  }, [fetchErgTests]);

  // Handle creating a new test
  const handleCreateTest = async (testData) => {
    setIsSubmitting(true);
    try {
      await createErgTest(testData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format tests for display (combine with athlete info)
  const formattedTests = useMemo(() => {
    return ergTests.map((test) => {
      // Try to get athlete name from the test data or look it up
      let athleteName = 'Unknown Athlete';
      if (test.athlete?.name) {
        athleteName = test.athlete.name;
      } else if (test.athlete?.lastName && test.athlete?.firstName) {
        athleteName = `${test.athlete.lastName}, ${test.athlete.firstName}`;
      } else {
        // Look up from athletes list
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

  // Chart data - calculate from actual tests grouped by month
  const chartData = useMemo(() => {
    const twoKTests = formattedTests.filter((t) => t.testType === '2k' && t.time);

    if (twoKTests.length === 0) {
      // Return placeholder data
      const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      return months.map((month) => ({
        month,
        teamAvg: null,
        teamBest: null
      }));
    }

    // Group by month
    const byMonth = {};
    for (const test of twoKTests) {
      const date = new Date(test.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }
      byMonth[monthKey].push(test.time);
    }

    // Get last 6 months
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Erg Data Center
          </h1>
          <p className="text-gray-400">
            Track and analyze erg test results
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card border border-white/10 text-gray-300 hover:bg-white/10 transition-all">
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium hover:shadow-glow-blue transition-all"
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

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          icon={Clock}
          label="Team Avg 2K"
          value={teamStats?.avg ? formatTime(teamStats.avg) : '--:--.-'}
          color="from-blue-500 to-blue-600"
          trend={teamStats?.avg ? -2 : null}
        />
        <StatCard
          icon={Award}
          label="Team Best 2K"
          value={teamStats?.best ? formatTime(teamStats.best) : '--:--.-'}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={Zap}
          label="Avg Watts"
          value={teamStats?.avgWatts ? `${teamStats.avgWatts}W` : '--'}
          color="from-amber-500 to-orange-500"
          trend={teamStats?.avgWatts ? 5 : null}
        />
        <StatCard
          icon={Target}
          label="Total Tests"
          value={teamStats?.testCount ?? 0}
          color="from-teal-500 to-teal-600"
        />
      </motion.div>

      {/* Chart */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="glass-card rounded-2xl p-6 border border-white/10 mb-8"
      >
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-blue" />
          2K Performance Trend
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#888" fontSize={12} />
              <YAxis
                stroke="#888"
                fontSize={12}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(v) => formatTime(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="teamAvg"
                name="Team Avg"
                stroke="#0a84ff"
                strokeWidth={2}
                dot={{ fill: '#0a84ff', r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="teamBest"
                name="Team Best"
                stroke="#bf5af2"
                strokeWidth={2}
                dot={{ fill: '#bf5af2', r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Test History */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="glass-card rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Filters */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 focus:border-accent-blue outline-none text-white placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', '2k', '6k', '30min', '500m'].map((type) => (
              <button
                key={type}
                onClick={() => setTestTypeFilter(type)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  testTypeFilter === type
                    ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {type === 'all' ? 'All' : type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Test list */}
        <div className="divide-y divide-white/5">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredTests.length > 0 ? (
            filteredTests.map((test, i) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">
                    {test.athleteName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <TestTypeBadge type={test.testType} />
                    <span className="text-xs text-gray-500">{test.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-white">
                    {formatTime(test.time)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {test.watts ? `${test.watts}W` : '--'}
                    {test.split ? ` | 1:${formatTime(test.split).slice(2)}` : ''}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No Tests Found
              </h3>
              <p className="text-gray-500">
                {searchQuery || testTypeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first erg test to get started'}
              </p>
            </div>
          )}
        </div>
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
    </div>
  );
}

export default ErgDataPage;
