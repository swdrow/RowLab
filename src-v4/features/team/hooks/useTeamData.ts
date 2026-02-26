/**
 * Combined team dashboard data hook.
 *
 * Fetches overview stats and announcements in parallel via useSuspenseQueries.
 * Suspense boundary must wrap any component using this hook.
 * Route loader should call ensureQueryData to start fetching before render.
 */
import { useSuspenseQueries } from '@tanstack/react-query';
import { teamOverviewOptions, teamAnnouncementsOptions } from '../api';
import type { TeamOverview, Announcement } from '../types';

export interface TeamDashboardData {
  overview: TeamOverview;
  announcements: Announcement[];
}

export function useTeamData(teamId: string): TeamDashboardData {
  const [overviewQuery, announcementsQuery] = useSuspenseQueries({
    queries: [teamOverviewOptions(teamId), teamAnnouncementsOptions(teamId)],
  });

  return {
    overview: overviewQuery.data,
    announcements: announcementsQuery.data,
  };
}
