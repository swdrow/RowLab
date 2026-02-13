/**
 * Personal dashboard: landing page for authenticated users.
 * Teamless-safe -- works with or without an active team.
 * Feature content comes in Phase 46.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/useAuth';

export const Route = createFileRoute('/_authenticated/')({
  component: PersonalDashboard,
  staticData: {
    breadcrumb: 'Home',
  },
});

function PersonalDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-deep p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-ink-primary">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-2 text-ink-secondary">
          Your personal training dashboard. Phase 46 will bring workouts, stats, and insights here.
        </p>
      </div>
    </div>
  );
}
