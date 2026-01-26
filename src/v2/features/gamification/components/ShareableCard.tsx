import { forwardRef } from 'react';
import { Trophy, TrendingUp, Calendar, Users } from 'lucide-react';
import type { ShareableCardData, PRContext } from '../../../types/gamification';

interface ShareableCardProps {
  data: ShareableCardData;
}

/**
 * Format time in seconds to display format
 */
function formatTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = (seconds % 60).toFixed(1);
    return `${h}:${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`;
  }
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Shareable workout card
 * Per CONTEXT.md: "Full context (time, delta, rank, athlete name, test type, date, RowLab branding)"
 * Uses ref forwarding for html-to-image capture
 */
export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  function ShareableCard({ data }, ref) {
    const {
      athleteName,
      workoutType,
      testType,
      result,
      date,
      isPR,
      prContext,
      improvement,
      teamRank,
      totalAthletes,
      teamName,
    } = data;

    return (
      <div
        ref={ref}
        className="w-[480px] h-[320px] p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl overflow-hidden relative"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{athleteName}</h2>
              {teamName && (
                <p className="text-slate-400 text-sm">{teamName}</p>
              )}
            </div>

            {isPR && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/50">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-semibold text-sm">
                  {prContext?.scope === 'all-time' ? 'PR' : 'Season PR'}
                </span>
              </div>
            )}
          </div>

          {/* Main result */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-sm uppercase tracking-wide mb-2">
                {testType?.toUpperCase() || workoutType}
              </p>
              <p className="text-6xl font-mono font-bold tracking-tight">
                {formatTime(result)}
              </p>
              {improvement && improvement > 0 && (
                <p className="flex items-center justify-center gap-1 mt-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">-{improvement.toFixed(1)}s improvement</span>
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(date)}
              </span>
              {teamRank && totalAthletes && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  #{teamRank} of {totalAthletes}
                </span>
              )}
            </div>

            {/* RowLab branding */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Shared via</span>
              <span className="font-bold text-white">RowLab</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ShareableCard;
