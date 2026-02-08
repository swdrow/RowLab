/**
 * AthleteDashboard Component
 * Phase 27-04: Complete athlete dashboard with multi-team unified view
 *
 * Per CONTEXT.md:
 * - "Athletes without a team see personal dashboard only (no team sections)"
 * - "Athletes on multiple teams see all team data merged with team labels"
 * - "Athlete dashboard should feel motivating, not clinical"
 */

import { motion } from 'framer-motion';
import { ArrowsOut, Gear } from '@phosphor-icons/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { useAthleteMultiTeamData } from '../hooks/useAthleteMultiTeamData';
import { useTour } from '../hooks/useTour';
import { PersonalStatsWidget } from './widgets/PersonalStatsWidget';
import { TeamContextCard } from './widgets/TeamContextCard';
import { TourLauncher } from './TourLauncher';
import { EmptyDashboardState } from '../empty-states';
import { SPRING_CONFIG } from '../../../utils/animations';

/**
 * Athlete dashboard page component
 * Adapts layout based on team count (0, 1, or N teams)
 */
export function AthleteDashboard() {
  const { user } = useAuth();
  const athleteId = user?.id || '';

  const { isEditing, setIsEditing } = useDashboardLayout('athlete');
  const { teams, teamData, personalStats, isLoading } = useAthleteMultiTeamData(athleteId);

  // Auto-launch tour on first visit
  useTour('athlete-dashboard', { autoStart: true, delay: 800 });

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-surface-base p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-48 bg-surface-default rounded animate-pulse mb-6" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 h-64 bg-surface-default rounded-lg animate-pulse" />
            <div className="col-span-6 h-64 bg-surface-default rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Check if athlete has any data at all
  const hasAnyData =
    personalStats.latestErgTime ||
    personalStats.attendanceStreak > 0 ||
    personalStats.totalPRs > 0 ||
    teams.length > 0;

  // Empty state for brand new athletes
  if (!hasAnyData) {
    return (
      <div className="h-screen bg-surface-base flex items-center justify-center p-6">
        <EmptyDashboardState />
      </div>
    );
  }

  /**
   * Layout modes based on team count:
   * - 0 teams: Full-width personal stats only
   * - 1 team: Personal stats (left 6 cols) + team context (right 6 cols)
   * - N teams: Personal stats hero + team cards side-by-side
   */
  const teamCount = teams.length;

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-txt-primary">My Dashboard</h1>

          {/* Header actions */}
          <div className="flex items-center gap-3">
            <TourLauncher tourId="athlete-dashboard" variant="button" />

            {/* Edit mode toggle */}
            <button
              data-tour="edit-layout"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                isEditing
                  ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary'
                  : 'border-ink-border text-txt-secondary hover:text-txt-primary hover:border-bdr-focus'
              }`}
            >
              {isEditing ? (
                <>
                  <Gear className="w-5 h-5" />
                  Done Editing
                </>
              ) : (
                <>
                  <ArrowsOut className="w-5 h-5" />
                  Edit Layout
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dashboard content */}
        {teamCount === 0 ? (
          // No teams: Personal stats only
          <div className="space-y-6">
            <div className="bg-surface-elevated border border-ink-border rounded-xl p-6">
              <PersonalStatsWidget
                widgetId="personal-stats"
                size="expanded"
                isEditing={isEditing}
              />
            </div>

            {/* Join team message */}
            <div className="bg-surface-default border border-ink-border rounded-lg p-6 text-center">
              <p className="text-txt-muted">
                Join a team to see team-specific data and compete with your teammates
              </p>
            </div>
          </div>
        ) : teamCount === 1 ? (
          // Single team: Side-by-side layout
          <div className="grid grid-cols-12 gap-6">
            {/* Personal stats (left 6 cols) */}
            <div className="col-span-6" data-tour="personal-stats">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_CONFIG}
                className={`bg-surface-elevated border border-ink-border rounded-xl p-6 ${
                  isEditing ? 'ring-2 ring-accent-primary/20 animate-pulse-slow' : ''
                }`}
              >
                <PersonalStatsWidget
                  widgetId="personal-stats"
                  size="normal"
                  isEditing={isEditing}
                />
              </motion.div>
            </div>

            {/* Team context (right 6 cols) */}
            <div className="col-span-6" data-tour="team-context">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING_CONFIG, delay: 0.1 }}
                className={`${isEditing ? 'ring-2 ring-accent-primary/20 animate-pulse-slow' : ''}`}
              >
                <TeamContextCard
                  teamName={teams[0].teamName}
                  teamId={teams[0].teamId}
                  nextWorkout={teamData[teams[0].teamId]?.nextWorkout}
                  ranking={teamData[teams[0].teamId]?.ranking}
                  attendanceRate={teamData[teams[0].teamId]?.attendanceRate}
                  recentActivity={teamData[teams[0].teamId]?.recentActivity}
                />
              </motion.div>
            </div>
          </div>
        ) : (
          // Multiple teams: Unified view with all teams visible
          <div className="space-y-6">
            {/* Personal stats hero (full width) */}
            <motion.div
              data-tour="personal-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_CONFIG}
              className={`bg-surface-elevated border border-ink-border rounded-xl p-6 ${
                isEditing ? 'ring-2 ring-accent-primary/20 animate-pulse-slow' : ''
              }`}
            >
              <PersonalStatsWidget widgetId="personal-stats" size="normal" isEditing={isEditing} />
            </motion.div>

            {/* Team context cards side-by-side */}
            <div className="grid grid-cols-2 gap-6" data-tour="team-context">
              {teams.map((team, index) => (
                <motion.div
                  key={team.teamId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_CONFIG, delay: 0.1 + index * 0.05 }}
                  className={`${
                    isEditing ? 'ring-2 ring-accent-primary/20 animate-pulse-slow' : ''
                  }`}
                >
                  <TeamContextCard
                    teamName={team.teamName}
                    teamId={team.teamId}
                    nextWorkout={teamData[team.teamId]?.nextWorkout}
                    ranking={teamData[team.teamId]?.ranking}
                    attendanceRate={teamData[team.teamId]?.attendanceRate}
                    recentActivity={teamData[team.teamId]?.recentActivity}
                    compact={teams.length > 2}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Edit mode instruction */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg
              bg-surface-elevated border border-ink-border shadow-xl"
          >
            <p className="text-sm text-txt-secondary">
              Customize your dashboard. Click "Done Editing" to save.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
