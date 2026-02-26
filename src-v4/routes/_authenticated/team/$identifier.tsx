/**
 * Team layout route: resolves $identifier (slug or generatedId) to team data.
 *
 * All child routes under /team/$identifier/ share this layout.
 * The loader resolves the identifier via the by-identifier API endpoint
 * and caches the result. Child routes can access the team from cache.
 */
import { createFileRoute, Outlet, redirect, Link } from '@tanstack/react-router';
import { queryClient } from '@/lib/queryClient';
import { teamByIdentifierOptions } from '@/features/team/api';

export const Route = createFileRoute('/_authenticated/team/$identifier')({
  beforeLoad: ({ context }) => {
    // Defense-in-depth: parent _authenticated route blocks when !isInitialized,
    // but guard here too to prevent team API calls without auth tokens.
    if (!context.auth?.isInitialized) {
      throw new Promise<void>(() => {});
    }
    if (!context.auth?.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  loader: async ({ params, context }) => {
    // Only fetch team data if auth is confirmed (prevents 401 on deep links)
    if (!context.auth?.isAuthenticated) {
      return { team: null };
    }
    const team = await queryClient.ensureQueryData(teamByIdentifierOptions(params.identifier));
    return { team };
  },
  component: TeamIdentifierLayout,
  errorComponent: TeamNotFound,
  staticData: {
    breadcrumb: 'Team',
  },
});

function TeamIdentifierLayout() {
  return <Outlet />;
}

function TeamNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="panel max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-void-deep">
          <svg
            className="h-7 w-7 text-text-faint"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-display font-semibold text-text-bright">Team not found</h2>
        <p className="mt-2 text-sm text-text-dim">
          This team doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-accent-teal px-4 py-2 text-sm font-medium text-void-deep transition-colors hover:bg-accent-teal/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
