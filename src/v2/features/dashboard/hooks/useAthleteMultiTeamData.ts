/**
 * useAthleteMultiTeamData Hook
 * Phase 27-04: Batched multi-team data hook for athlete dashboard
 *
 * Per CONTEXT.md: "Multi-team: unified view with team labels — all data merged with team badges."
 */

import { useQueries } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { usePersonalRecords } from '../../../hooks/usePersonalRecords';
import { useStreaks } from '../../../hooks/useStreaks';
import { useErgTests } from '../../../hooks/useErgTests';
import api from '../../../utils/api';
import { queryKeys } from '../../../lib/queryKeys';

interface TeamData {
  nextWorkout?: {
    id: string;
    name: string;
    date: string;
    type: string;
  };
  ranking?: number;
  recentActivity: any[];
  attendanceRate?: number;
}

interface PersonalStats {
  latestErgTime?: string;
  latestErgTestType?: string;
  attendanceStreak: number;
  overallRanking?: number;
  totalPRs: number;
}

interface UseAthleteMultiTeamDataReturn {
  teams: Array<{ teamId: string; teamName: string; role: string }>;
  teamData: Record<string, TeamData>;
  personalStats: PersonalStats;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Batched multi-team data hook for athlete dashboard
 *
 * Fetches:
 * - Personal stats (latest erg, streak, PR count)
 * - Team data for each team athlete belongs to
 *   - Next workout
 *   - Ranking
 *   - Recent activity
 *   - Attendance rate
 *
 * Returns empty teams array if athlete has no teams (personal-only mode)
 */
export function useAthleteMultiTeamData(athleteId: string): UseAthleteMultiTeamDataReturn {
  const { teams: authTeams } = useAuth();

  // Fetch personal stats
  const { data: prs = [] } = usePersonalRecords();
  const { data: streakData } = useStreaks();
  const { tests: ergTests, isLoading: isLoadingErg } = useErgTests({
    athleteId,
  });

  // Get latest erg test
  const latestErg = ergTests.length > 0 ? ergTests[0] : null;

  // Get attendance streak (default to 0)
  const attendanceStreak =
    streakData?.streaks?.find((s) => s.category === 'attendance')?.currentLength || 0;

  // Personal stats aggregation
  const personalStats: PersonalStats = {
    latestErgTime: latestErg?.result ? formatErgTime(latestErg.result) : undefined,
    latestErgTestType: latestErg?.testType || undefined,
    attendanceStreak,
    overallRanking: undefined, // TODO: Calculate from team rankings
    totalPRs: prs.length,
  };

  // Fetch team-specific data for each team
  const teamQueries = useQueries({
    queries: authTeams.map((team) => ({
      queryKey: queryKeys.dashboard.teamData(team.id, athleteId),
      queryFn: async () => {
        try {
          // Fetch all team data in parallel
          const [workoutResponse, rankingResponse, activityResponse, attendanceResponse] =
            await Promise.all([
              api.get(`/api/v1/sessions?teamId=${team.id}&status=PLANNED&limit=1`),
              api.get(`/api/v1/teams/${team.id}/rankings?athleteId=${athleteId}`),
              api.get(`/api/v1/activity?teamId=${team.id}&athleteId=${athleteId}&limit=5`),
              api.get(`/api/v1/attendance/rate?teamId=${team.id}&athleteId=${athleteId}&days=30`),
            ]);

          const nextWorkout = workoutResponse.data?.data?.sessions?.[0];
          const ranking = rankingResponse.data?.data?.ranking;
          const recentActivity = activityResponse.data?.data?.activities || [];
          const attendanceRate = attendanceResponse.data?.data?.rate;

          return {
            nextWorkout: nextWorkout
              ? {
                  id: nextWorkout.id,
                  name: nextWorkout.name,
                  date: nextWorkout.date,
                  type: nextWorkout.type,
                }
              : undefined,
            ranking,
            recentActivity,
            attendanceRate,
          } as TeamData;
        } catch (error) {
          console.error(`Failed to fetch data for team ${team.id}:`, error);
          return {
            recentActivity: [],
          } as TeamData;
        }
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: !!athleteId && !!team.id,
    })),
  });

  // Aggregate team data into record
  const teamData: Record<string, TeamData> = {};
  authTeams.forEach((team, index) => {
    const queryResult = teamQueries[index];
    if (queryResult.data) {
      teamData[team.id] = queryResult.data;
    }
  });

  // Check loading state
  const isLoading = isLoadingErg || teamQueries.some((q) => q.isLoading);
  const isError = teamQueries.some((q) => q.isError);

  return {
    teams: authTeams.map((t) => ({
      teamId: t.id,
      teamName: t.name,
      role: t.role || 'athlete',
    })),
    teamData,
    personalStats,
    isLoading,
    isError,
  };
}

/**
 * Format erg result (seconds) to MM:SS.S format
 */
function formatErgTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`;
}
