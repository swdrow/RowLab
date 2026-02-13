/**
 * Profile page stub. Full implementation in Phase 48.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/useAuth';

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
  staticData: {
    breadcrumb: 'Profile',
  },
});

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-deep p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-ink-primary">{user?.name ?? 'Your Profile'}</h1>
        <p className="mt-2 text-ink-secondary">
          Profile and personal stats will be available in Phase 48.
        </p>
      </div>
    </div>
  );
}
