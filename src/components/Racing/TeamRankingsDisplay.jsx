import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, BarChart3, Trophy, X } from 'lucide-react';
import useTeamRankingsStore from '../../store/teamRankingsStore';
import SpotlightCard from '../ui/SpotlightCard';

/**
 * TeamRankingsDisplay - Displays team rankings by boat class
 * Redesigned with Precision Instrument design system
 */
function TeamRankingsDisplay() {
  const {
    rankings,
    boatClasses,
    headToHead,
    loading,
    error,
    fetchBoatClasses,
    fetchRankings,
    fetchHeadToHead,
  } = useTeamRankingsStore();

  const [selectedBoatClass, setSelectedBoatClass] = useState(null);
  const [selectedOpponent, setSelectedOpponent] = useState(null);

  useEffect(() => {
    fetchBoatClasses();
  }, [fetchBoatClasses]);

  useEffect(() => {
    if (selectedBoatClass) {
      fetchRankings(selectedBoatClass);
    }
  }, [selectedBoatClass, fetchRankings]);

  useEffect(() => {
    if (selectedOpponent && selectedBoatClass) {
      fetchHeadToHead(selectedOpponent, selectedBoatClass);
    }
  }, [selectedOpponent, selectedBoatClass, fetchHeadToHead]);

  const formatSplit = (splitSeconds) => {
    if (!splitSeconds || !isFinite(splitSeconds)) return '-';
    const mins = Math.floor(splitSeconds / 60);
    const secs = (splitSeconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const closeHeadToHead = () => {
    setSelectedOpponent(null);
  };

  if (loading && boatClasses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <Loader2 className="w-10 h-10 text-warning-orange animate-spin" />
        <p className="mt-4 text-text-secondary">Loading rankings...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Team Rankings</h2>
        <p className="text-sm text-text-secondary mt-1">
          Compare performance against other teams by boat class
        </p>
      </div>

      {/* Boat Class Selector */}
      {boatClasses.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {boatClasses.map((bc) => (
            <motion.button
              key={bc}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedBoatClass(bc)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ease-out ${
                selectedBoatClass === bc
                  ? 'bg-warning-orange/10 text-warning-orange border-warning-orange/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02] border-transparent'
              }`}
            >
              {bc}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-void-elevated/50 border border-white/[0.06] text-center">
          <p className="text-text-secondary text-sm">
            No boat classes with race results yet. Add race results to see rankings.
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-danger-red/10 border border-danger-red/20 rounded-lg"
        >
          <p className="text-sm text-danger-red">{error}</p>
        </motion.div>
      )}

      {/* Content */}
      {!selectedBoatClass ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-16 h-16 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-primary font-medium mb-2">Select a boat class</p>
          <p className="text-text-secondary text-sm max-w-sm">
            Choose a boat class above to view rankings and compare your team against competitors.
          </p>
        </motion.div>
      ) : rankings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-16 h-16 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
            <Trophy className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-primary font-medium mb-2">No rankings data</p>
          <p className="text-text-secondary text-sm max-w-sm">
            Add race results for {selectedBoatClass} to generate rankings.
          </p>
        </motion.div>
      ) : (
        <SpotlightCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-void-surface/50 border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-16">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-24">
                    Split (500m)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-24">
                    2k Time
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-16">
                    Races
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-20">
                    H2H
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rankings.map((r, index) => (
                  <motion.tr
                    key={r.teamName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, ease: [0.2, 0.8, 0.2, 1] }}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      r.isOwnTeam ? 'bg-blade-blue/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${
                        r.rank <= 3 ? 'text-warning-orange' : 'text-text-secondary'
                      }`}>
                        #{r.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        r.isOwnTeam ? 'text-blade-blue' : 'text-text-primary'
                      }`}>
                        {r.teamName}
                        {r.isOwnTeam && (
                          <span className="ml-2 text-xs text-blade-blue/70">(You)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-mono text-text-primary">
                        {formatSplit(r.split)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-mono text-text-primary">
                        {formatSplit(r.standardTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-text-secondary">{r.sampleCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!r.isOwnTeam && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedOpponent(r.teamName)}
                          className="px-3 py-1 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-white/[0.04] rounded-md transition-all duration-200"
                        >
                          View
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      )}

      {/* Head-to-Head Modal */}
      <AnimatePresence>
        {selectedOpponent && headToHead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/80 backdrop-blur-xl"
            onClick={closeHeadToHead}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-void-elevated shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold text-text-primary">
                  vs {headToHead.opponent}
                </h2>
                <button
                  onClick={closeHeadToHead}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blade-blue/10 rounded-xl border border-blade-blue/20">
                    <div className="text-2xl font-bold text-blade-blue">{headToHead.wins}</div>
                    <div className="text-sm text-blade-blue/70">Wins</div>
                  </div>
                  <div className="text-center p-4 bg-void-surface rounded-xl border border-white/[0.06]">
                    <div className="text-2xl font-bold text-text-primary">{headToHead.totalRaces}</div>
                    <div className="text-sm text-text-secondary">Total</div>
                  </div>
                  <div className="text-center p-4 bg-danger-red/10 rounded-xl border border-danger-red/20">
                    <div className="text-2xl font-bold text-danger-red">{headToHead.losses}</div>
                    <div className="text-sm text-danger-red/70">Losses</div>
                  </div>
                </div>

                {/* Matchup History */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {headToHead.matchups && headToHead.matchups.length > 0 ? (
                    headToHead.matchups.map((m, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          m.won
                            ? 'bg-blade-blue/5 border-blade-blue/20'
                            : 'bg-danger-red/5 border-danger-red/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-text-primary truncate">
                              {m.regatta}
                            </div>
                            <div className="text-sm text-text-secondary truncate">
                              {m.eventName}
                            </div>
                            <div className="text-xs text-text-muted mt-1">
                              {formatDate(m.date)}
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <div className={`text-lg font-mono font-bold ${
                              m.won ? 'text-blade-blue' : 'text-danger-red'
                            }`}>
                              {Number.isFinite(m.marginSeconds) ? (
                                <>
                                  {m.marginSeconds > 0 ? '+' : ''}
                                  {m.marginSeconds.toFixed(1)}s
                                </>
                              ) : (
                                '-'
                              )}
                            </div>
                            <div className="text-xs text-text-muted">
                              Place: {m.ownPlace} vs {m.theirPlace}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-text-secondary">
                      No matchup history available
                    </div>
                  )}
                </div>

                {/* Average Margin */}
                {headToHead.totalRaces > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
                    <span className="text-sm text-text-secondary">
                      Average margin:{' '}
                      <span className={`font-mono font-bold ${
                        headToHead.avgMargin > 0 ? 'text-blade-blue' : 'text-danger-red'
                      }`}>
                        {headToHead.avgMargin > 0 ? '+' : ''}
                        {headToHead.avgMargin.toFixed(1)}s
                      </span>
                    </span>
                  </div>
                )}

                {/* Close Button */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeHeadToHead}
                    className="w-full px-5 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-200"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeamRankingsDisplay;
