/**
 * /team index route: redirects to the active team's dashboard.
 *
 * Resolution order:
 * 1. Active team from auth context -> /team/$identifier/dashboard
 * 2. No active team -> / (personal dashboard)
 *
 * Identifier preference: slug > generatedId > id (UUID)
 */
import { createFileRoute, redirect } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';

export const Route = createFileRoute('/_authenticated/team/')({
  errorComponent: RouteErrorFallback,
  beforeLoad: ({ context }) => {
    const auth = context.auth;
    if (!auth?.isAuthenticated) {
      throw redirect({ to: '/login' });
    }

    // Find the active team to resolve its identifier
    const activeTeam = auth.teams?.find((t) => t.id === auth.activeTeamId);
    if (activeTeam) {
      const identifier = activeTeam.slug || activeTeam.generatedId || activeTeam.id;
      throw redirect({
        to: '/team/$identifier/dashboard' as string,
        params: { identifier },
      });
    }

    // No active team -- go to personal dashboard
    throw redirect({ to: '/' });
  },
  component: () => null, // Never renders -- always redirects
});
