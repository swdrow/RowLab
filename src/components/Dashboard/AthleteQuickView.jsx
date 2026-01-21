import React from 'react';
import {
  User,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Ship,
  Timer,
  Activity,
  ChevronRight,
  Zap,
} from 'lucide-react';

/**
 * AthleteQuickView - Click any athlete name to see summary panel
 *
 * Displays:
 * - Photo placeholder
 * - Name, Side, Seat
 * - 2k/6k times
 * - Elo score and trend
 * - Recent workouts
 * - Link to full profile
 */
function AthleteQuickView({
  athlete = null, // { id, firstName, lastName, side, currentSeat, time2k, time6k, elo, trend, recentWorkouts }
  onClose,
  onViewProfile,
  className = '',
}) {
  if (!athlete) return null;

  // Format time in M:SS.T
  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  // Get side color
  const getSideColor = (side) => {
    if (side === 'P') return 'danger-red';
    if (side === 'S') return 'starboard';
    return 'spectrum-violet';
  };

  // Trend icon
  const TrendIcon = () => {
    if (athlete.trend === 'up') return <TrendingUp size={14} className="text-success" />;
    if (athlete.trend === 'down') return <TrendingDown size={14} className="text-danger-red" />;
    return <Minus size={14} className="text-text-muted" />;
  };

  const sideColor = getSideColor(athlete.side);

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header with close button */}
      <div className="flex items-start justify-between p-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            bg-${sideColor}/10 border border-${sideColor}/20
          `}>
            <User size={24} className={`text-${sideColor}`} />
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary">
              {athlete.firstName} {athlete.lastName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className={`
                px-1.5 py-0.5 rounded text-${sideColor}
                bg-${sideColor}/10
              `}>
                {athlete.side === 'P' ? 'Port' : athlete.side === 'S' ? 'Starboard' : 'Both'}
              </span>
              {athlete.currentSeat && (
                <>
                  <span>•</span>
                  <span>Seat {athlete.currentSeat}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-text-muted hover:text-text-primary transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
        {/* 2k */}
        <div className="bg-void-elevated p-4">
          <div className="text-xs text-text-muted mb-1">2k</div>
          <div className="text-xl font-mono font-bold text-blade-blue tabular-nums">
            {formatTime(athlete.time2k)}
          </div>
        </div>

        {/* 6k */}
        <div className="bg-void-elevated p-4">
          <div className="text-xs text-text-muted mb-1">6k</div>
          <div className="text-xl font-mono font-bold text-text-secondary tabular-nums">
            {formatTime(athlete.time6k)}
          </div>
        </div>

        {/* Elo */}
        <div className="bg-void-elevated p-4">
          <div className="text-xs text-text-muted mb-1">Elo</div>
          <div className="text-xl font-mono font-bold text-warning-orange tabular-nums">
            {athlete.elo?.toFixed(0) || '-'}
          </div>
        </div>

        {/* Trend */}
        <div className="bg-void-elevated p-4">
          <div className="text-xs text-text-muted mb-1">Trend</div>
          <div className="flex items-center gap-2">
            <TrendIcon />
            <span className={`text-sm font-medium ${
              athlete.trend === 'up' ? 'text-success' :
              athlete.trend === 'down' ? 'text-danger-red' :
              'text-text-muted'
            }`}>
              {athlete.trend === 'up' ? 'Improving' :
               athlete.trend === 'down' ? 'Declining' :
               'Stable'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent workouts */}
      <div className="p-4 border-t border-white/[0.04]">
        <h4 className="text-xs font-medium text-text-muted mb-3">Recent Workouts</h4>
        {athlete.recentWorkouts && athlete.recentWorkouts.length > 0 ? (
          <div className="space-y-2">
            {athlete.recentWorkouts.slice(0, 3).map((workout, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-void-surface/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blade-blue/10 flex items-center justify-center">
                    <Zap size={12} className="text-blade-blue" />
                  </div>
                  <span className="text-sm text-text-primary">{workout.type}</span>
                </div>
                <span className="text-xs text-text-muted">{formatRelativeTime(workout.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted text-center py-3">No recent workouts</p>
        )}
      </div>

      {/* View full profile button */}
      {onViewProfile && (
        <div className="p-4 border-t border-white/[0.04]">
          <button
            onClick={() => onViewProfile(athlete.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blade-blue/10 border border-blade-blue/20 text-blade-blue text-sm hover:bg-blade-blue/20 transition-all group"
          >
            <span>View Full Profile</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}

export default AthleteQuickView;
