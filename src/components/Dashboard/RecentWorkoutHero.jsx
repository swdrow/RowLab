import React from 'react';
import { Timer, Zap, Activity, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * RecentWorkoutHero - Hero tile showing the most recent workout
 *
 * Displays:
 * - Workout type badge
 * - Total distance/time in large monospace
 * - Per-piece breakdown table (Piece, Time, Split, S/R, Watts)
 * - Heart rate when available
 * - Relative timestamp ("2 hours ago")
 */
function RecentWorkoutHero({ workout, onViewDetails }) {
  if (!workout) {
    return (
      <div className="p-6 rounded-xl bg-void-elevated border border-white/[0.06]">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-void-surface border border-white/[0.06] flex items-center justify-center">
            <Timer size={24} className="text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">No recent workouts</p>
          <p className="text-text-muted/60 text-xs mt-1">Complete a workout to see it here</p>
        </div>
      </div>
    );
  }

  const { type, date, totalTime, totalDistance, pieces, heartRate } = workout;

  // Format time in M:SS.T or H:MM:SS format
  const formatTime = (seconds) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Format split (500m pace)
  const formatSplit = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(date), { addSuffix: true });

  return (
    <div className="rounded-xl bg-void-elevated border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-start justify-between mb-4">
          <div>
            {/* Workout type badge */}
            <span className="inline-block px-2.5 py-1 rounded-md bg-blade-blue/10 text-blade-blue text-xs font-mono uppercase tracking-wider mb-2">
              {type}
            </span>
            <div className="text-xs text-text-muted">{relativeTime}</div>
          </div>

          {/* Heart rate if available */}
          {heartRate && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-danger-red/10 border border-danger-red/20">
              <Activity size={14} className="text-danger-red" />
              <span className="text-xs font-mono text-danger-red">
                {heartRate.avg}/{heartRate.max}
              </span>
            </div>
          )}
        </div>

        {/* Main stats */}
        <div className="flex items-baseline gap-6">
          <div>
            <div className="text-4xl font-mono font-bold text-text-primary tracking-tight tabular-nums">
              {totalTime ? formatTime(totalTime) : `${totalDistance?.toLocaleString()}m`}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-1">
              {totalTime ? 'Total Time' : 'Total Distance'}
            </div>
          </div>
          {totalDistance && totalTime && (
            <div>
              <div className="text-2xl font-mono text-text-secondary tabular-nums">
                {totalDistance.toLocaleString()}m
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-piece breakdown table */}
      {pieces && pieces.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Piece
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Time
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Avg Split
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Avg S/R
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Avg Watts
                </th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((piece, index) => (
                <tr
                  key={index}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-100"
                >
                  <td className="px-5 py-3 text-sm font-mono text-text-secondary">
                    {index + 1}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-text-primary tabular-nums">
                    {formatTime(piece.time)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-blade-blue tabular-nums">
                    {formatSplit(piece.split)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-text-secondary tabular-nums">
                    {piece.strokeRate || '-'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-text-secondary tabular-nums">
                    {piece.watts || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View details link */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full px-5 py-3 flex items-center justify-between text-sm text-text-muted hover:text-blade-blue hover:bg-white/[0.02] transition-all duration-100 group"
        >
          <span>View full workout details</span>
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

export default RecentWorkoutHero;
