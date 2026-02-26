/**
 * Training route: /training (coach-only).
 *
 * Renders the TrainingPage with active team context.
 * Uses permission system for readOnly detection.
 */
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/permissions';
import { TrainingPage } from '@/features/coach/training/components/TrainingPage';

export const Route = createFileRoute('/_authenticated/_coach/training')({
  errorComponent: RouteErrorFallback,
  staticData: { breadcrumb: 'Training' },
  component: TrainingRoute,
});

function TrainingRoute() {
  const { activeTeamId } = useAuth();
  const { isReadOnly } = usePermissions();

  if (!activeTeamId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-text-faint">Select a team to manage training plans</p>
      </div>
    );
  }

  return <TrainingPage teamId={activeTeamId} readOnly={isReadOnly('training')} />;
}
