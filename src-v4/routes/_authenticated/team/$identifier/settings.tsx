/**
 * /team/$identifier/settings route -- team settings with 5 sections.
 *
 * Prefetches roster and invite codes for the Members and Invites sections.
 * Suspense boundary shows skeleton while data resolves.
 */
import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { queryClient } from '@/lib/queryClient';
import {
  teamByIdentifierOptions,
  teamRosterOptions,
  inviteCodesOptions,
} from '@/features/team/api';
import { TeamSettingsPage } from '@/features/team/components/TeamSettingsPage';

export const Route = createFileRoute('/_authenticated/team/$identifier/settings')({
  errorComponent: RouteErrorFallback,
  loader: async ({ params }) => {
    const team = queryClient.getQueryData(teamByIdentifierOptions(params.identifier).queryKey);
    if (team) {
      await Promise.allSettled([
        queryClient.ensureQueryData(teamRosterOptions(team.id)),
        queryClient.ensureQueryData(inviteCodesOptions(team.id)),
      ]);
    }
    return {};
  },
  component: TeamSettingsRoute,
  staticData: { breadcrumb: 'Settings' },
});

function TeamSettingsRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl p-4 md:p-6 pb-20 md:pb-6">
          <div className="mb-6">
            <div className="h-8 w-48 bg-void-deep/50 animate-shimmer rounded-lg" />
            <div className="mt-2 h-4 w-64 bg-void-deep/30 animate-shimmer rounded" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-6 panel rounded-xl p-5">
              <div className="h-5 w-32 bg-void-deep/50 animate-shimmer rounded mb-4" />
              <div className="h-4 w-full bg-void-deep/30 animate-shimmer rounded mb-2" />
              <div className="h-4 w-3/4 bg-void-deep/30 animate-shimmer rounded" />
            </div>
          ))}
        </div>
      }
    >
      <TeamSettingsPage />
    </Suspense>
  );
}
