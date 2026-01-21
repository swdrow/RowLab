import React from 'react';
import { Trophy, TrendingUp, ExternalLink } from 'lucide-react';

/**
 * PersonalBests - Display 2k/6k/30min personal best times
 *
 * Standard test types only:
 * - 2000m
 * - 6000m
 * - 30 minutes
 *
 * Features:
 * - PR indicator
 * - Link to global rankings (Concept2)
 * - Date of achievement
 */
function PersonalBests({
  bests = {}, // { '2000m': { time, date, isRecent }, '6000m': {...}, '30min': {...} }
  showRankingsLink = true,
  className = '',
}) {
  // Standard test types in order
  const testTypes = [
    { key: '2000m', label: '2000m', unit: 'time' },
    { key: '6000m', label: '6000m', unit: 'time' },
    { key: '30min', label: '30min', unit: 'distance' },
  ];

  // Format time in M:SS.T format
  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Format distance
  const formatDistance = (meters) => {
    if (!meters) return '-';
    return `${meters.toLocaleString()}m`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if we have any data
  const hasData = testTypes.some(t => bests[t.key]);

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-orange/10 border border-warning-orange/20 flex items-center justify-center">
            <Trophy size={20} className="text-warning-orange" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">Personal Bests</h3>
            <p className="text-xs text-text-muted">Standard test results</p>
          </div>
        </div>

        {showRankingsLink && (
          <a
            href="https://log.concept2.com/rankings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:text-blade-blue hover:bg-blade-blue/5 transition-all"
          >
            <span>View Rankings</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Records list */}
      <div className="divide-y divide-white/[0.04]">
        {testTypes.map(({ key, label, unit }) => {
          const record = bests[key];
          const hasRecord = record && (record.time || record.distance);

          return (
            <div
              key={key}
              className={`flex items-center justify-between px-5 py-4 ${hasRecord ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center gap-3">
                {/* Test type label */}
                <div className="w-16">
                  <span className="text-sm font-mono text-text-secondary">{label}</span>
                </div>

                {/* Time/Distance */}
                <div className="text-xl font-mono font-bold text-text-primary tabular-nums">
                  {unit === 'time' ? formatTime(record?.time) : formatDistance(record?.distance)}
                </div>

                {/* PR indicator */}
                {record?.isRecent && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-success/10 border border-success/20">
                    <TrendingUp size={12} className="text-success" />
                    <span className="text-[10px] font-medium text-success uppercase">PR</span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="text-xs text-text-muted font-mono">
                {formatDate(record?.date)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-text-muted">No personal bests recorded</p>
          <p className="text-xs text-text-muted/60 mt-1">Complete standard tests to see your PRs</p>
        </div>
      )}
    </div>
  );
}

export default PersonalBests;
