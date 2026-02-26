/**
 * Fleet route: renders FleetPage under the coach layout guard.
 *
 * Derives teamId and readOnly from auth context + permission hook.
 * Athletes with fleet read-only access see data but no CRUD controls.
 */
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/permissions';
import { FleetPage } from '@/features/coach/fleet/components/FleetPage';

export const Route = createFileRoute('/_authenticated/_coach/fleet')({
  errorComponent: RouteErrorFallback,
  component: FleetRoute,
});

function FleetRoute() {
  const { activeTeamId } = useAuth();
  const { isReadOnly } = usePermissions();

  if (!activeTeamId) {
    return (
      <div className="p-8 text-text-dim text-sm">Select a team to manage fleet equipment.</div>
    );
  }

  return <FleetPage teamId={activeTeamId} readOnly={isReadOnly('fleet')} />;
}
