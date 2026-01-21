/**
 * AILineupOptimizer - Main component for genetic algorithm lineup optimization
 * Uses the Precision Instrument design system
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Search,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { useAILineupStore } from '../../store/aiLineupStore';
import useLineupStore from '../../store/lineupStore';
import useBoatConfigStore from '../../store/boatConfigStore';
import SpotlightCard from '../ui/SpotlightCard';

// Import extracted components and config
import { BOAT_CLASSES } from './optimizer-config';
import {
  Badge,
  AthleteConstraintRow,
  CoxswainSelector,
  SuggestionCard,
  OptimizationProgress,
  EmptyState,
} from './OptimizerComponents';

/**
 * AILineupOptimizer - Main component
 */
function AILineupOptimizer() {
  const { athletes } = useLineupStore();
  const { suggestions, loading, error, optimizeLineup, clearSuggestions, clearError } =
    useAILineupStore();
  const { fetchStandardConfigs } = useBoatConfigStore();

  const [boatClass, setBoatClass] = useState('8+');
  const [constraints, setConstraints] = useState({});
  const [coxswainId, setCoxswainId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState(0);

  const selectedBoat = useMemo(
    () => BOAT_CLASSES.find((b) => b.id === boatClass),
    [boatClass]
  );

  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletes;
    const query = searchQuery.toLowerCase();
    return athletes.filter(
      (a) =>
        a.lastName?.toLowerCase().includes(query) ||
        a.firstName?.toLowerCase().includes(query)
    );
  }, [athletes, searchQuery]);

  // Initialize constraints for new athletes
  useEffect(() => {
    const initialConstraints = {};
    athletes.forEach((athlete) => {
      if (!constraints[athlete.id]) {
        initialConstraints[athlete.id] = {
          isRequired: false,
          isExcluded: false,
          sidePreference: athlete.side || 'Both',
        };
      }
    });
    if (Object.keys(initialConstraints).length > 0) {
      setConstraints((prev) => ({ ...prev, ...initialConstraints }));
    }
  }, [athletes]);

  // Fetch boat configs on mount
  useEffect(() => {
    fetchStandardConfigs().catch(() => {});
  }, [fetchStandardConfigs]);

  // Clear suggestions when boat class changes
  useEffect(() => {
    clearSuggestions();
    setCoxswainId(null);
  }, [boatClass, clearSuggestions]);

  const updateConstraint = useCallback((athleteId, field, value) => {
    setConstraints((prev) => ({
      ...prev,
      [athleteId]: {
        ...prev[athleteId],
        [field]: value,
        ...(field === 'isRequired' && value ? { isExcluded: false } : {}),
        ...(field === 'isExcluded' && value ? { isRequired: false } : {}),
      },
    }));
  }, []);

  const handleGenerate = async () => {
    clearError();
    setProgress(0);

    const requiredAthletes = Object.entries(constraints)
      .filter(([_, c]) => c.isRequired)
      .map(([id]) => id);

    const excludedAthletes = Object.entries(constraints)
      .filter(([_, c]) => c.isExcluded)
      .map(([id]) => id);

    const sidePreferences = Object.entries(constraints).reduce((acc, [id, c]) => {
      acc[id] = c.sidePreference;
      return acc;
    }, {});

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 500);

    try {
      await optimizeLineup({
        boatClass,
        numSeats: selectedBoat?.seats,
        hasCoxswain: selectedBoat?.hasCoxswain,
        requiredAthletes,
        excludedAthletes,
        sidePreferences,
        coxswainId: selectedBoat?.hasCoxswain ? coxswainId : null,
        numSuggestions: 5,
      });
      setProgress(100);
    } catch (err) {
      // Error handled by store
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleUseLineup = useCallback((suggestion) => {
    // TODO: Integrate with lineup store to apply selected lineup
    alert('Lineup applied! (Integration with lineup store pending)');
  }, []);

  const requiredCount = Object.values(constraints).filter((c) => c.isRequired).length;
  const excludedCount = Object.values(constraints).filter((c) => c.isExcluded).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SpotlightCard className="p-6" spotlightColor="rgba(124, 58, 237, 0.08)">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Brain className="w-6 h-6 text-coxswain-violet" />
              AI Lineup Optimizer
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Use genetic algorithm optimization to find the best lineup configurations
            </p>
          </div>
          <Badge variant="purple" dot>
            Experimental
          </Badge>
        </div>
      </SpotlightCard>

      {/* Configuration section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boat class selector */}
        <SpotlightCard className="p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">Boat Class</h3>
          <div className="space-y-2">
            {BOAT_CLASSES.map((boat) => (
              <label
                key={boat.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-all duration-200 ${
                  boatClass === boat.id
                    ? 'bg-blade-blue/10 border-blade-blue/30 shadow-[0_0_15px_rgba(0,112,243,0.15)]'
                    : 'bg-void-deep/30 border-white/[0.06] hover:border-white/[0.1]'
                }`}
              >
                <input
                  type="radio"
                  name="boatClass"
                  value={boat.id}
                  checked={boatClass === boat.id}
                  onChange={(e) => setBoatClass(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    boatClass === boat.id ? 'border-blade-blue' : 'border-white/[0.2]'
                  }`}
                >
                  {boatClass === boat.id && (
                    <div className="w-2 h-2 rounded-full bg-blade-blue" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{boat.name}</p>
                  <p className="text-xs text-text-muted">
                    {boat.seats} seat{boat.seats > 1 ? 's' : ''}
                    {boat.hasCoxswain && ' + cox'}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Coxswain selector */}
          {selectedBoat?.hasCoxswain && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <CoxswainSelector
                athletes={athletes}
                selectedCoxswainId={coxswainId}
                onSelect={setCoxswainId}
              />
            </div>
          )}
        </SpotlightCard>

        {/* Constraints builder */}
        <SpotlightCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Athlete Constraints</h3>
              <p className="text-sm text-text-secondary mt-1">
                Configure which athletes must be included or excluded
              </p>
            </div>
            <div className="flex items-center gap-2">
              {requiredCount > 0 && (
                <Badge variant="success">{requiredCount} Required</Badge>
              )}
              {excludedCount > 0 && (
                <Badge variant="error">{excludedCount} Excluded</Badge>
              )}
            </div>
          </div>

          {/* Search input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athletes..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-void-deep/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20 transition-all duration-200"
            />
          </div>

          {/* Athletes list */}
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {filteredAthletes.length === 0 ? (
              <p className="text-center text-text-muted py-8">
                {athletes.length === 0
                  ? 'No athletes available. Add athletes to your roster first.'
                  : 'No athletes match your search.'}
              </p>
            ) : (
              filteredAthletes.map((athlete) => (
                <AthleteConstraintRow
                  key={athlete.id}
                  athlete={athlete}
                  isRequired={constraints[athlete.id]?.isRequired || false}
                  isExcluded={constraints[athlete.id]?.isExcluded || false}
                  sidePreference={constraints[athlete.id]?.sidePreference || 'Both'}
                  onToggleRequired={(checked) =>
                    updateConstraint(athlete.id, 'isRequired', checked)
                  }
                  onToggleExcluded={(checked) =>
                    updateConstraint(athlete.id, 'isExcluded', checked)
                  }
                  onSideChange={(side) =>
                    updateConstraint(athlete.id, 'sidePreference', side)
                  }
                />
              ))
            )}
          </div>
        </SpotlightCard>
      </div>

      {/* Generate button */}
      <SpotlightCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary">Ready to Optimize</p>
            <p className="text-sm text-text-secondary">
              {athletes.length} athletes available, {requiredCount} required,{' '}
              {excludedCount} excluded
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={loading || athletes.length < (selectedBoat?.seats || 0)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            Generate Optimal Lineups
          </motion.button>
        </div>
      </SpotlightCard>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SpotlightCard className="p-4" spotlightColor="rgba(239, 68, 68, 0.08)">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-danger-red">Optimization Failed</p>
                  <p className="text-sm text-text-secondary mt-1">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  aria-label="Dismiss error"
                  className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </SpotlightCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results section */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Optimization Results
        </h3>

        {loading ? (
          <SpotlightCard>
            <OptimizationProgress progress={progress} />
          </SpotlightCard>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                index={index}
                boatClass={boatClass}
                onUseLineup={handleUseLineup}
              />
            ))}
          </div>
        ) : (
          <SpotlightCard>
            <EmptyState hasAthletes={athletes.length > 0} />
          </SpotlightCard>
        )}
      </div>
    </div>
  );
}

export default AILineupOptimizer;
