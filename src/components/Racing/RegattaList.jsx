import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ChevronRight, Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import useRegattaStore from '../../store/regattaStore';
import SpotlightCard from '../ui/SpotlightCard';

// Course type color config
const courseTypeConfig = {
  '2000m': 'bg-blade-blue/10 text-blade-blue border-blade-blue/20',
  '1500m': 'bg-coxswain-violet/10 text-coxswain-violet border-coxswain-violet/20',
  'head': 'bg-warning-orange/10 text-warning-orange border-warning-orange/20',
  'default': 'bg-text-muted/10 text-text-muted border-text-muted/20',
};

const getCourseTypeColor = (courseType) => {
  if (!courseType) return courseTypeConfig.default;
  const lower = courseType.toLowerCase();
  if (lower.includes('2000')) return courseTypeConfig['2000m'];
  if (lower.includes('1500')) return courseTypeConfig['1500m'];
  if (lower.includes('head')) return courseTypeConfig['head'];
  return courseTypeConfig.default;
};

/**
 * RegattaList - Displays a list of regattas
 * Redesigned with Precision Instrument design system
 */
function RegattaList({ onSelectRegatta = () => {}, onCreateNew = () => {} }) {
  const { regattas, loading, error, fetchRegattas } = useRegattaStore();

  useEffect(() => {
    fetchRegattas();
  }, [fetchRegattas]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading && regattas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <Loader2 className="w-10 h-10 text-blade-blue animate-spin" />
        <p className="mt-4 text-text-secondary">Loading regattas...</p>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="w-16 h-16 mb-4 rounded-2xl bg-danger-red/10 border border-danger-red/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-danger-red" />
        </div>
        <p className="text-text-primary font-medium mb-2">Error loading regattas</p>
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fetchRegattas()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-void-elevated/50 text-text-secondary hover:text-text-primary border border-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  // Empty state
  if (regattas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="w-20 h-20 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
          <Calendar className="w-10 h-10 text-text-muted" />
        </div>
        <p className="text-text-primary font-medium mb-2">No regattas yet</p>
        <p className="text-text-secondary text-sm mb-6 text-center max-w-sm">
          Add your first regatta to start tracking race results and comparing
          performance against other teams.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Add Regatta
        </motion.button>
      </motion.div>
    );
  }

  // Regatta list
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Regattas</h2>
          <p className="text-sm text-text-secondary mt-1">
            {regattas.length} regatta{regattas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Add Regatta
        </motion.button>
      </div>

      {/* Regattas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regattas.map((regatta, index) => (
          <motion.div
            key={regatta.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <SpotlightCard
              className="p-4 group"
              onClick={() => onSelectRegatta(regatta)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-medium text-text-primary truncate pr-2 group-hover:text-blade-blue transition-colors">
                  {regatta.name}
                </span>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-blade-blue group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary">
                  {formatDate(regatta.date)}
                </span>
              </div>

              {/* Location */}
              {regatta.location && (
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary truncate">
                    {regatta.location}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {regatta.courseType && (
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getCourseTypeColor(regatta.courseType)}`}>
                      {regatta.courseType}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted">
                  {regatta._count?.races || 0} race{(regatta._count?.races || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default RegattaList;
