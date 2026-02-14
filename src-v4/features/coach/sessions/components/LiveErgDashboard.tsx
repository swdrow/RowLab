/**
 * LiveErgDashboard - Real-time grid of athlete erg cards during a live session.
 *
 * Displays live data from Socket.IO: pace, watts, distance, stroke rate, heart rate.
 * Color-codes pace against target. Connection indicator. Responsive grid.
 * Athletes with data sort first, then alphabetical.
 */
import { useMemo } from 'react';
import { Activity, Heart, Gauge, Waves, Ruler } from 'lucide-react';
import type { ErgData } from '../hooks/useSocket';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format pace in seconds to mm:ss.t/500m display.
 */
function formatPace(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Determine pace color relative to target.
 * Lower pace = faster = better.
 */
function paceColor(pace: number, target?: number | null): string {
  if (!target || !pace) return 'text-ink-primary';
  const diff = pace - target;
  const threshold = target * 0.02; // 2% tolerance

  if (diff < -threshold) return 'text-sky-400'; // faster than target
  if (diff <= threshold) return 'text-emerald-400'; // on target
  if (diff <= threshold * 3) return 'text-amber-400'; // slightly slow
  return 'text-rose-400'; // very slow
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ErgCardProps {
  data: ErgData;
  targetPace?: number | null;
}

function ErgCard({ data, targetPace }: ErgCardProps) {
  const paceClass = paceColor(data.currentPace, targetPace);

  return (
    <div className="bg-ink-raised border border-ink-border rounded-lg p-4 space-y-3">
      {/* Athlete name + timestamp */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-primary truncate">{data.athleteName}</span>
        <span className="text-[10px] text-ink-muted font-mono">
          {new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      {/* Primary metric: pace */}
      <div className="text-center">
        <span className={`text-2xl font-mono font-bold ${paceClass}`}>
          {formatPace(data.currentPace)}
        </span>
        <span className="text-xs text-ink-muted ml-1">/500m</span>
      </div>

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-ink-secondary">
          <Gauge size={12} className="text-ink-muted flex-shrink-0" />
          <span className="font-mono">{data.currentWatts}w</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-secondary">
          <Waves size={12} className="text-ink-muted flex-shrink-0" />
          <span className="font-mono">{data.strokeRate}spm</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-secondary">
          <Ruler size={12} className="text-ink-muted flex-shrink-0" />
          <span className="font-mono">{data.distance.toLocaleString()}m</span>
        </div>
        {data.heartRate != null && (
          <div className="flex items-center gap-1.5 text-ink-secondary">
            <Heart size={12} className="text-rose-400 flex-shrink-0" />
            <span className="font-mono">{data.heartRate}bpm</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LiveErgDashboardProps {
  ergData: ErgData[];
  isConnected: boolean;
  targetPace?: number | null;
  sessionCode?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LiveErgDashboard({
  ergData,
  isConnected,
  targetPace,
  sessionCode,
}: LiveErgDashboardProps) {
  // Sort: athletes with data first (by pace ascending), then alphabetical
  const sorted = useMemo(() => {
    return [...ergData].sort((a, b) => {
      // Both have pace data: sort by pace ascending (faster first)
      if (a.currentPace && b.currentPace) return a.currentPace - b.currentPace;
      // One has data, other doesn't: data first
      if (a.currentPace && !b.currentPace) return -1;
      if (!a.currentPace && b.currentPace) return 1;
      // Neither has pace: alphabetical
      return a.athleteName.localeCompare(b.athleteName);
    });
  }, [ergData]);

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-xs text-ink-muted">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Athlete count */}
          <span className="text-xs text-ink-secondary">
            <Activity size={12} className="inline mr-1" />
            {sorted.length} {sorted.length === 1 ? 'athlete' : 'athletes'}
          </span>
        </div>

        {/* Session code */}
        {sessionCode && (
          <span className="text-xs text-ink-muted">
            Code: <span className="font-mono font-bold text-ink-primary">{sessionCode}</span>
          </span>
        )}
      </div>

      {/* Target pace indicator */}
      {targetPace != null && targetPace > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-ink-well/50 rounded-lg text-xs text-ink-secondary">
          <span>
            Target:{' '}
            <span className="font-mono font-bold text-ink-primary">
              {formatPace(targetPace)}/500m
            </span>
          </span>
          <span className="text-ink-border">|</span>
          <span className="text-sky-400">Fast</span>
          <span className="text-emerald-400">On target</span>
          <span className="text-amber-400">Slow</span>
          <span className="text-rose-400">Very slow</span>
        </div>
      )}

      {/* Erg cards grid or empty state */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
          <Activity size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Waiting for athletes to connect...</p>
          {sessionCode && (
            <p className="text-xs mt-1">
              Share code <span className="font-mono font-bold text-ink-primary">{sessionCode}</span>{' '}
              with athletes
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((data) => (
            <ErgCard key={data.athleteId} data={data} targetPace={targetPace} />
          ))}
        </div>
      )}
    </div>
  );
}
