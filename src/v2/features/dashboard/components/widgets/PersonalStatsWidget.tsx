/**
 * PersonalStatsWidget Component
 * Phase 27-04: Hero widget for athlete dashboard with personal stats
 *
 * Per CONTEXT.md: "Athlete sees personal stats as dominant dashboard element
 * (latest erg, streak, ranking). Gold PR badges appear inline next to metrics that are PRs."
 */

import { Flame, TrendUp, Trophy, Target } from '@phosphor-icons/react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useAthleteMultiTeamData } from '../../hooks/useAthleteMultiTeamData';
import { usePersonalRecords } from '../../../../hooks/usePersonalRecords';
import { EmptyDashboardState } from '../../empty-states';
import { PRBadge } from './PRBadge';
import type { WidgetProps } from '../../types';

/**
 * Hero widget for athlete dashboard
 * Shows dominant personal stats at a glance with inline PR badges
 */
export function PersonalStatsWidget({ widgetId, size, isEditing }: WidgetProps) {
  const { user } = useAuth();
  const athleteId = user?.id || '';

  const { personalStats, isLoading } = useAthleteMultiTeamData(athleteId);
  const { data: prs = [] } = usePersonalRecords();

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <div className="h-8 w-48 bg-surface-default rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-surface-default rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-default rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Check if latest erg is a PR (after loading guard so personalStats is populated)
  const latestErgIsPR = prs.some((pr) => pr.testType === personalStats.latestErgTestType);

  // Empty state
  if (
    !personalStats.latestErgTime &&
    personalStats.attendanceStreak === 0 &&
    personalStats.totalPRs === 0 &&
    !personalStats.overallRanking
  ) {
    return <EmptyDashboardState />;
  }

  // Compact size: single row
  if (size === 'compact') {
    return (
      <div className="h-full flex items-center gap-4">
        {/* Latest erg */}
        {personalStats.latestErgTime && (
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-txt-muted uppercase tracking-wide">
                {personalStats.latestErgTestType}
              </span>
              <PRBadge isPR={latestErgIsPR} />
            </div>
            <div className="text-2xl font-mono font-bold text-txt-primary">
              {personalStats.latestErgTime}
            </div>
          </div>
        )}

        {/* Streak */}
        {personalStats.attendanceStreak > 0 && (
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" weight="fill" />
              <span className="text-xs text-txt-muted uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-2xl font-mono font-bold text-txt-primary">
              {personalStats.attendanceStreak}
            </div>
          </div>
        )}

        {/* PRs */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-400" weight="fill" />
            <span className="text-xs text-txt-muted uppercase tracking-wide">PRs</span>
          </div>
          <div className="text-2xl font-mono font-bold text-txt-primary">
            {personalStats.totalPRs}
          </div>
        </div>
      </div>
    );
  }

  // Normal size: grid layout with greeting
  return (
    <div className="h-full flex flex-col">
      {/* Greeting header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-txt-primary mb-1">
          {greeting}, {user?.name?.split(' ')[0] || 'Athlete'}
        </h2>
        <p className="text-sm text-txt-muted">Here's your progress at a glance</p>
      </div>

      {/* Stats grid */}
      <div className={`grid gap-4 flex-1 ${size === 'expanded' ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {/* Latest erg */}
        {personalStats.latestErgTime && (
          <div className="bg-surface-default border border-bdr-default rounded-lg p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-accent-primary" />
              <span className="text-xs text-txt-muted uppercase tracking-wide">
                {personalStats.latestErgTestType}
              </span>
              <PRBadge isPR={latestErgIsPR} />
            </div>
            <div
              className={`text-3xl font-mono font-bold flex-1 flex items-center ${
                latestErgIsPR ? 'text-amber-400' : 'text-txt-primary'
              }`}
            >
              {personalStats.latestErgTime}
            </div>
            <p className="text-xs text-txt-muted mt-2">Latest test</p>
          </div>
        )}

        {/* Attendance streak */}
        {personalStats.attendanceStreak > 0 && (
          <div className="bg-surface-default border border-bdr-default rounded-lg p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" weight="fill" />
              <span className="text-xs text-txt-muted uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-3xl font-mono font-bold text-txt-primary flex-1 flex items-center">
              {personalStats.attendanceStreak}
            </div>
            <p className="text-xs text-txt-muted mt-2">
              {personalStats.attendanceStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        )}

        {/* Overall ranking */}
        {personalStats.overallRanking && (
          <div className="bg-surface-default border border-bdr-default rounded-lg p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendUp className="w-5 h-5 text-green-400" />
              <span className="text-xs text-txt-muted uppercase tracking-wide">Ranking</span>
            </div>
            <div className="text-3xl font-mono font-bold text-txt-primary flex-1 flex items-center">
              #{personalStats.overallRanking}
            </div>
            <p className="text-xs text-txt-muted mt-2">Overall</p>
          </div>
        )}

        {/* Total PRs */}
        <div className="bg-surface-default border border-bdr-default rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-400" weight="fill" />
            <span className="text-xs text-txt-muted uppercase tracking-wide">PRs</span>
          </div>
          <div className="text-3xl font-mono font-bold text-amber-400 flex-1 flex items-center">
            {personalStats.totalPRs}
          </div>
          <p className="text-xs text-txt-muted mt-2">
            {personalStats.totalPRs === 1 ? 'record' : 'records'}
          </p>
        </div>
      </div>

      {/* Expanded size: add sparkline/graphs (future enhancement) */}
      {size === 'expanded' && (
        <div className="mt-4 p-4 bg-surface-default border border-bdr-default rounded-lg">
          <p className="text-xs text-txt-muted">Erg history sparkline coming soon</p>
        </div>
      )}
    </div>
  );
}
