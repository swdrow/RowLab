import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Flag,
  Ship,
  ChevronLeft,
  LayoutGrid,
  List,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { RaceScheduleTimeline } from './RaceScheduleTimeline';
import { LiveResultsBoard } from './LiveResultsBoard';

interface Race {
  id: number;
  eventName: string;
  boatClass: string;
  distanceMeters: number;
  isHeadRace?: boolean;
  scheduledTime?: string | null;
  results?: Array<{
    id: number;
    teamName: string;
    isOwnTeam?: boolean;
    finishTimeSeconds: number | null;
    place: number | null;
    marginBackSeconds?: number | null;
    rawSpeed?: number | null;
  }>;
}

interface Regatta {
  id: number;
  name: string;
  location?: string;
  date: string;
  races?: Race[];
}

interface RaceDayViewProps {
  /** Current regatta */
  regatta: Regatta | null;
  /** Callback to go back to regatta list */
  onBack?: () => void;
  /** Callback when race is selected */
  onSelectRace?: (race: Race) => void;
  /** Callback to refresh data */
  onRefresh?: () => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * RaceDayView - Main race day interface
 *
 * Features:
 * - Race schedule timeline
 * - Countdown to next race
 * - Live results display
 * - Full-screen mode (future)
 *
 * Precision Instrument design:
 * - Clean, glanceable layout
 * - Emphasis on upcoming races
 * - Real-time updates ready
 */
export function RaceDayView({
  regatta,
  onBack,
  onSelectRace,
  onRefresh,
  loading = false,
}: RaceDayViewProps) {
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'timeline' | 'results'>('split');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Find next upcoming race
  const nextRace = useMemo(() => {
    if (!regatta?.races) return null;
    const now = Date.now();

    // Find race in progress or next scheduled
    return regatta.races.find((race) => {
      // If race has no results, it could be next
      if (!race.results || race.results.length === 0) {
        // If has scheduled time in future, it's upcoming
        if (race.scheduledTime) {
          return new Date(race.scheduledTime).getTime() > now - 1800000; // Within 30 min past
        }
        return true;
      }
      return false;
    }) || null;
  }, [regatta?.races]);

  // Get selected race details
  const selectedRace = useMemo(() => {
    if (!selectedRaceId || !regatta?.races) return null;
    return regatta.races.find((r) => r.id === selectedRaceId) || null;
  }, [selectedRaceId, regatta?.races]);

  // Auto-select next race if none selected
  useEffect(() => {
    if (!selectedRaceId && nextRace) {
      setSelectedRaceId(nextRace.id);
    }
  }, [nextRace, selectedRaceId]);

  // Handle race selection
  const handleSelectRace = (race: Race) => {
    setSelectedRaceId(race.id);
    onSelectRace?.(race);
  };

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Format date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!regatta) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
          <Flag className="w-8 h-8 text-text-muted" />
        </div>
        <p className="text-text-primary font-medium mb-2">No regatta selected</p>
        <p className="text-text-muted text-sm">Select a regatta to enter Race Day mode.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 flex items-center gap-2 text-sm text-blade-blue hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Regattas
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-3 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Regattas
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
              <Flag className="w-6 h-6 text-blade-blue" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{regatta.name}</h2>
              <p className="text-sm text-text-muted">
                {formatDate(regatta.date)}
                {regatta.location && ` • ${regatta.location}`}
              </p>
            </div>
          </div>
        </div>

        {/* View controls */}
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
              autoRefresh
                ? 'bg-blade-blue/10 border-blade-blue/30 text-blade-blue'
                : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:text-text-secondary'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh && !loading ? 'animate-spin-slow' : ''}`} />
            Auto
          </button>

          {/* Manual refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* View mode toggles */}
          <div className="flex rounded-lg overflow-hidden border border-white/[0.06]">
            <button
              onClick={() => setViewMode('split')}
              className={`p-2 transition-colors ${
                viewMode === 'split'
                  ? 'bg-blade-blue/10 text-blade-blue'
                  : 'bg-white/[0.02] text-text-muted hover:text-text-secondary'
              }`}
              title="Split view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-blade-blue/10 text-blade-blue'
                  : 'bg-white/[0.02] text-text-muted hover:text-text-secondary'
              }`}
              title="Timeline view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('results')}
              className={`p-2 transition-colors ${
                viewMode === 'results'
                  ? 'bg-blade-blue/10 text-blade-blue'
                  : 'bg-white/[0.02] text-text-muted hover:text-text-secondary'
              }`}
              title="Results view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'split' && (
          <motion.div
            key="split"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Left column: Schedule + Timer */}
            <div className="space-y-6">
              {/* Countdown to next race */}
              {nextRace?.scheduledTime && (
                <CountdownTimer
                  targetTime={nextRace.scheduledTime}
                  label={`Until ${nextRace.eventName}`}
                  size="md"
                  showControls={true}
                />
              )}

              {/* Race schedule */}
              <div className="rounded-xl bg-void-surface/60 border border-white/[0.06] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                    Race Schedule
                  </h3>
                </div>
                <RaceScheduleTimeline
                  races={regatta.races || []}
                  selectedRaceId={selectedRaceId}
                  onSelectRace={handleSelectRace}
                  variant="compact"
                />
              </div>
            </div>

            {/* Right column: Results */}
            <div>
              <LiveResultsBoard
                race={selectedRace}
                variant="full"
                highlightOwnTeam={true}
              />
            </div>
          </motion.div>
        )}

        {viewMode === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
          >
            {/* Full timeline view */}
            <div className="max-w-2xl mx-auto">
              {nextRace?.scheduledTime && (
                <div className="mb-6">
                  <CountdownTimer
                    targetTime={nextRace.scheduledTime}
                    label={`Until ${nextRace.eventName}`}
                    size="lg"
                    showControls={true}
                  />
                </div>
              )}
              <RaceScheduleTimeline
                races={regatta.races || []}
                selectedRaceId={selectedRaceId}
                onSelectRace={handleSelectRace}
                variant="full"
              />
            </div>
          </motion.div>
        )}

        {viewMode === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
          >
            {/* Full results view */}
            <div className="max-w-3xl mx-auto">
              <LiveResultsBoard
                race={selectedRace}
                variant="full"
                highlightOwnTeam={true}
              />

              {/* Quick race selector */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {regatta.races?.map((race) => (
                  <button
                    key={race.id}
                    onClick={() => handleSelectRace(race)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedRaceId === race.id
                        ? 'bg-blade-blue/10 border border-blade-blue/30 text-blade-blue'
                        : 'bg-white/[0.02] border border-white/[0.06] text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
                    }`}
                  >
                    {race.eventName}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RaceDayView;
