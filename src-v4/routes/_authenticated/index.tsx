/**
 * Personal dashboard: landing page for authenticated users.
 * Teamless-safe -- works with or without an active team.
 *
 * Route loader prefetches dashboard data via ensureQueryData.
 * Suspense boundary shows skeleton while queries resolve.
 * State detection: empty state for zero-data users, full content otherwise.
 */
import { Suspense, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { useAuth } from '@/features/auth/useAuth';
import { queryClient } from '@/lib/queryClient';
import {
  statsQueryOptions,
  recentWorkoutsQueryOptions,
  prsQueryOptions,
} from '@/features/dashboard/api';
import { socialFeedOptions, followStatsOptions } from '@/features/feed/api';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';
import { DashboardEmptyState } from '@/features/dashboard/components/DashboardEmptyState';
import { DashboardContent } from '@/features/dashboard/components/DashboardContent';
import type { TeamContextData } from '@/features/dashboard/types';

export const Route = createFileRoute('/_authenticated/')({
  component: PersonalDashboard,
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Home',
  },
  loader: async () => {
    // Prefetch all dashboard queries in parallel — allSettled so one failure
    // doesn't block the rest. Mock fallbacks in queryFns handle 404s gracefully.
    await Promise.allSettled([
      queryClient.ensureQueryData(statsQueryOptions('7d')),
      queryClient.ensureQueryData(recentWorkoutsQueryOptions()),
      queryClient.ensureQueryData(prsQueryOptions()),
      queryClient.prefetchInfiniteQuery(socialFeedOptions({ filter: 'all' })),
      queryClient.ensureQueryData(followStatsOptions()),
    ]);
    return {};
  },
});

function PersonalDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const { user, activeTeamId, teams } = useAuth();
  const data = useDashboardData();

  // Memoize team context BEFORE any conditional returns (React hooks rule)
  // TODO(phase-45): Replace with real team context API when /me/team-context ships
  const teamContext = useMemo(() => deriveTeamContext(activeTeamId, teams), [activeTeamId, teams]);

  // Zero-data users see the empty state with onboarding CTAs
  if (!data.hasData) {
    return <DashboardEmptyState />;
  }

  return (
    <DashboardContent
      data={data}
      userName={user?.name ?? 'Athlete'}
      username={user?.username ?? undefined}
      avatar={user?.avatarUrl}
      teamContext={teamContext}
    />
  );
}

/**
 * Derive team context data from auth state.
 * Returns null for standalone athletes (no active team).
 * TODO(phase-45): Replace with real API call to /me/team-context
 */
function deriveTeamContext(
  activeTeamId: string | null,
  teams: Array<{ id: string; name: string; slug: string; role: string }>
): TeamContextData | null {
  if (!activeTeamId) return null;

  const activeTeam = teams.find((t) => t.id === activeTeamId);
  if (!activeTeam) return null;

  // TODO(phase-45): Fetch real upcoming events and notices from API
  return {
    teamId: activeTeam.id,
    teamName: activeTeam.name,
    upcomingEvents: [],
    notices: [],
  };
}
