/**
 * /team/$identifier/dashboard route -- team dashboard with 3-tab layout.
 *
 * Tabs: Overview, Roster, Activity (URL-persisted via ?tab=)
 * Prefetches overview, announcements, and roster in parallel.
 * Suspense boundary shows TeamDashboardSkeleton while data resolves.
 */
import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import {
  teamByIdentifierOptions,
  teamOverviewOptions,
  teamAnnouncementsOptions,
  teamRosterOptions,
} from '@/features/team/api';
import { TeamDashboardContent } from '@/features/team/components/TeamDashboardContent';
import { TeamDashboardSkeleton } from '@/features/team/components/TeamDashboardSkeleton';

/* ------------------------------------------------------------------ */
/* Search schema                                                       */
/* ------------------------------------------------------------------ */

const dashboardSearchSchema = z.object({
  tab: z.enum(['overview', 'roster', 'activity']).catch('overview'),
});

export type TeamDashboardSearch = z.infer<typeof dashboardSearchSchema>;

/* ------------------------------------------------------------------ */
/* Route definition                                                    */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/_authenticated/team/$identifier/dashboard')({
  validateSearch: zodValidator(dashboardSearchSchema),
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Dashboard',
  },
  loader: async ({ params }) => {
    // Get team from parent layout cache
    const teamDetail = queryClient.getQueryData(
      teamByIdentifierOptions(params.identifier).queryKey
    );
    if (teamDetail) {
      // Prefetch dashboard data in parallel
      await Promise.allSettled([
        queryClient.ensureQueryData(teamOverviewOptions(teamDetail.id)),
        queryClient.ensureQueryData(teamAnnouncementsOptions(teamDetail.id)),
        queryClient.ensureQueryData(teamRosterOptions(teamDetail.id)),
      ]);
    }
    return {};
  },
  component: TeamDashboardRoute,
});

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function TeamDashboardRoute() {
  return (
    <Suspense fallback={<TeamDashboardSkeleton />}>
      <TeamDashboardContent />
    </Suspense>
  );
}
