/**
 * Team layout route: guards team-scoped child routes.
 *
 * If user has no active team, shows a "Join a team" CTA.
 * Otherwise renders the child route via Outlet.
 */
import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/useAuth';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';

export const Route = createFileRoute('/_authenticated/_team')({
  errorComponent: RouteErrorFallback,
  component: TeamLayout,
});

function TeamLayout() {
  const { activeTeamId } = useAuth();

  if (!activeTeamId) {
    return <TeamlessFallback />;
  }

  return <Outlet />;
}

/**
 * Shown when the user has no active team.
 * Provides a CTA to join a team. Never blocks access to personal routes.
 */
function TeamlessFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="panel max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-void-raised">
          <svg
            className="h-7 w-7 text-accent-teal"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-display font-semibold text-text-bright">Join a Team</h2>
        <p className="mt-2 text-sm text-text-dim">
          Team features require an active team. Ask your coach for an invite link, or create your
          own team to get started.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-accent-teal px-4 py-2.5 text-sm font-medium text-void-deep transition-colors hover:bg-accent-teal-hover"
          >
            Go to Personal Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
