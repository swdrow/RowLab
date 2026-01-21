/**
 * AI Lineup Optimizer Sub-Components
 * Reusable UI components for the lineup optimizer
 */
import { motion } from 'framer-motion';
import { Brain, Check, Target } from 'lucide-react';
import SpotlightCard from '../ui/SpotlightCard';
import { BOAT_CLASSES, SIDE_OPTIONS } from './optimizer-config';

/**
 * Badge component for status indicators
 */
export function Badge({ children, variant = 'default', dot = false, className = '' }) {
  const variants = {
    default: 'bg-text-muted/10 text-text-muted border-text-muted/20',
    primary: 'bg-blade-blue/10 text-blade-blue border-blade-blue/20',
    success: 'bg-blade-blue/10 text-blade-blue border-blade-blue/20',
    error: 'bg-danger-red/10 text-danger-red border-danger-red/20',
    warning: 'bg-warning-orange/10 text-warning-orange border-warning-orange/20',
    purple: 'bg-coxswain-violet/10 text-coxswain-violet border-coxswain-violet/20',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/**
 * Side badge for athlete rowing side (Port/Starboard/Cox)
 */
export function SideBadge({ side }) {
  if (!side || side === 'Both') return null;

  const config = {
    Port: 'bg-danger-red/10 text-danger-red border-danger-red/20',
    Starboard: 'bg-blade-blue/10 text-blade-blue border-blade-blue/20',
    Cox: 'bg-coxswain-violet/10 text-coxswain-violet border-coxswain-violet/20',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${config[side] || config.Port}`}>
      {side}
    </span>
  );
}

/**
 * Athlete constraint row - shows athlete with toggle buttons for required/excluded
 */
export function AthleteConstraintRow({
  athlete,
  isRequired,
  isExcluded,
  sidePreference,
  onToggleRequired,
  onToggleExcluded,
  onSideChange,
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-void-deep/30 hover:bg-void-deep/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-text-primary font-medium truncate">
          {athlete.lastName}, {athlete.firstName}
        </span>
        {athlete.side && <SideBadge side={athlete.side} />}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Side preference dropdown */}
        <select
          value={sidePreference}
          onChange={(e) => onSideChange(e.target.value)}
          className="px-2 py-1 text-xs rounded-md bg-void-deep/50 border border-white/[0.06] text-text-secondary focus:outline-none focus:border-blade-blue/50"
        >
          {SIDE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-void-elevated">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Required toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => onToggleRequired(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-5 rounded-full bg-void-deep border border-white/[0.06] peer-checked:bg-blade-blue/20 peer-checked:border-blade-blue/30 transition-all relative">
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${
                isRequired ? 'bg-blade-blue translate-x-3' : 'bg-text-muted'
              }`}
            />
          </div>
          <span className="text-xs text-text-muted">Required</span>
        </label>

        {/* Excluded toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isExcluded}
            onChange={(e) => onToggleExcluded(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-5 rounded-full bg-void-deep border border-white/[0.06] peer-checked:bg-danger-red/20 peer-checked:border-danger-red/30 transition-all relative">
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${
                isExcluded ? 'bg-danger-red translate-x-3' : 'bg-text-muted'
              }`}
            />
          </div>
          <span className="text-xs text-text-muted">Exclude</span>
        </label>
      </div>
    </div>
  );
}

/**
 * Coxswain selector dropdown
 */
export function CoxswainSelector({ athletes, selectedCoxswainId, onSelect }) {
  const coxswainCandidates = athletes.filter(
    (a) => a.side === 'Cox' || a.role === 'Coxswain'
  );

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-text-secondary">Coxswain:</label>
      <select
        value={selectedCoxswainId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="flex-1 px-3 py-2 rounded-lg bg-void-deep/50 border border-white/[0.06] text-text-primary text-sm focus:outline-none focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20 transition-all duration-200"
      >
        <option value="" className="bg-void-elevated">No specific coxswain</option>
        {coxswainCandidates.map((athlete) => (
          <option key={athlete.id} value={athlete.id} className="bg-void-elevated">
            {athlete.lastName}, {athlete.firstName}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Suggestion card - displays a single lineup suggestion
 */
export function SuggestionCard({ suggestion, index, boatClass, onUseLineup }) {
  const selectedBoat = BOAT_CLASSES.find((b) => b.id === boatClass);

  return (
    <SpotlightCard
      className="p-5 relative"
      spotlightColor={index === 0 ? 'rgba(0, 112, 243, 0.12)' : 'rgba(0, 112, 243, 0.06)'}
    >
      {/* Top pick indicator */}
      {index === 0 && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-blade-blue text-void-deep text-xs font-bold rounded-bl-lg">
          TOP PICK
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold text-text-primary">Option #{index + 1}</span>
        <div className="text-right">
          <span className="text-2xl font-bold text-blade-blue">
            {suggestion.fitness?.toFixed(2) || suggestion.score?.toFixed(2) || 'N/A'}
          </span>
          <p className="text-xs text-text-muted">Fitness Score</p>
        </div>
      </div>

      {/* Seat assignments grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {suggestion.seats?.map((seat, seatIndex) => (
          <div
            key={seatIndex}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-void-deep/50 border border-white/[0.06]"
          >
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                seat.side === 'Port'
                  ? 'bg-danger-red/20 text-danger-red'
                  : 'bg-blade-blue/20 text-blade-blue'
              }`}
            >
              {seat.seatNumber}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">
                {seat.athlete?.lastName || 'Empty'}
              </p>
              {seat.athlete?.firstName && (
                <p className="text-xs text-text-muted truncate">{seat.athlete.firstName}</p>
              )}
            </div>
            <SideBadge side={seat.side} />
          </div>
        ))}
      </div>

      {/* Coxswain if applicable */}
      {selectedBoat?.hasCoxswain && suggestion.coxswain && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-coxswain-violet/10 border border-coxswain-violet/20 mb-4">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-coxswain-violet/20 text-coxswain-violet text-xs font-bold">
            C
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">
              {suggestion.coxswain.lastName}, {suggestion.coxswain.firstName}
            </p>
            <p className="text-xs text-text-muted">Coxswain</p>
          </div>
        </div>
      )}

      {/* Metrics */}
      {suggestion.metrics && (
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          {suggestion.metrics.avgSplit && (
            <div className="px-2 py-1.5 rounded bg-void-deep/30">
              <span className="text-text-muted">Avg Split:</span>
              <span className="text-text-primary ml-1 font-mono">{suggestion.metrics.avgSplit}</span>
            </div>
          )}
          {suggestion.metrics.sideBalance !== undefined && (
            <div className="px-2 py-1.5 rounded bg-void-deep/30">
              <span className="text-text-muted">Balance:</span>
              <span className="text-text-primary ml-1">{(suggestion.metrics.sideBalance * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Use button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onUseLineup(suggestion)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)]"
      >
        <Check className="w-4 h-4" />
        Use This Lineup
      </motion.button>
    </SpotlightCard>
  );
}

/**
 * Loading progress component with animated spinner
 */
export function OptimizationProgress({ progress }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated spinner */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-void-elevated rounded-full" />
        <div
          className="absolute inset-0 border-4 border-transparent border-t-blade-blue rounded-full animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <div className="absolute inset-2 flex items-center justify-center">
          <Brain className="w-8 h-8 text-blade-blue animate-pulse" />
        </div>
      </div>

      <p className="text-lg font-medium text-text-primary mb-2">Optimizing Lineup</p>
      <p className="text-sm text-text-secondary mb-4">
        Running genetic algorithm to find optimal configurations...
      </p>

      {progress !== undefined && (
        <div className="w-64 h-2 bg-void-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blade-blue"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Empty state component when no suggestions exist
 */
export function EmptyState({ hasAthletes }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
        <Target className="w-8 h-8 text-text-muted" />
      </div>
      <p className="text-text-primary font-medium mb-2">No Suggestions Yet</p>
      <p className="text-sm text-text-secondary max-w-sm">
        {hasAthletes
          ? 'Configure your constraints and click "Generate Optimal Lineups" to get AI-powered suggestions.'
          : 'Add athletes to your roster first, then configure constraints to generate optimized lineups.'}
      </p>
    </div>
  );
}
