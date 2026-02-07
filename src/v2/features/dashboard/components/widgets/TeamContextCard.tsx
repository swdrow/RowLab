/**
 * TeamContextCard Component
 * Phase 27-04: Team-specific data card for multi-team athletes
 *
 * Per CONTEXT.md: "Multi-team: unified view with team labels — all data merged with team badges."
 */

import { Link } from 'react-router-dom';
import { Calendar, TrendUp, UserCheck, CaretRight } from '@phosphor-icons/react';

interface TeamContextCardProps {
  teamName: string;
  teamId: string;
  nextWorkout?: {
    name: string;
    date: string;
    type: string;
  };
  ranking?: number;
  attendanceRate?: number;
  recentActivity?: any[];
  compact?: boolean;
}

/**
 * Team-specific data card with clear team label
 * Shows next workout, ranking, and attendance for a single team
 */
export function TeamContextCard({
  teamName,
  teamId,
  nextWorkout,
  ranking,
  attendanceRate,
  compact = false,
}: TeamContextCardProps) {
  // Team badge color (cycle through colors based on team name hash)
  const colorIndex = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
  const colors = [
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'bg-green-500/10 text-green-400 border-green-500/20',
    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ];
  const badgeColor = colors[colorIndex];

  // Empty state
  const hasData = nextWorkout || ranking || attendanceRate;

  return (
    <div className="h-full bg-surface-default border border-bdr-default rounded-lg p-4 flex flex-col">
      {/* Team badge header */}
      <div className="mb-4">
        <Link
          to={`/app/teams/${teamId}`}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:scale-105 group ${badgeColor}`}
        >
          <span className="text-sm font-semibold">{teamName}</span>
          <CaretRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-sm text-txt-muted">No data yet for {teamName}</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {/* Next workout */}
          {nextWorkout && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wide mb-1">Next workout</p>
                <p className="font-medium text-txt-primary">{nextWorkout.name}</p>
                <p className="text-sm text-txt-muted">
                  {new Date(nextWorkout.date).toLocaleDateString()} · {nextWorkout.type}
                </p>
              </div>
            </div>
          )}

          {/* Ranking */}
          {ranking && !compact && (
            <div className="flex items-start gap-3">
              <TrendUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wide mb-1">Ranking</p>
                <p className="font-mono font-bold text-txt-primary">#{ranking} on team</p>
              </div>
            </div>
          )}

          {/* Attendance rate */}
          {attendanceRate !== undefined && !compact && (
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wide mb-1">Attendance</p>
                <p className="font-mono font-bold text-txt-primary">
                  {Math.round(attendanceRate * 100)}%
                </p>
                <p className="text-xs text-txt-muted">Last 30 days</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
