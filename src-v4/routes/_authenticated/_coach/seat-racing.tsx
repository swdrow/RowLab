/**
 * Seat racing route: renders SeatRacingPage under the coach layout guard.
 *
 * Derives teamId and readOnly from auth context + permission hook.
 * Athletes with seat-racing read-only access see data but no CRUD controls.
 */
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/permissions';
import { SeatRacingPage } from '@/features/coach/seat-racing/components/SeatRacingPage';

export const Route = createFileRoute('/_authenticated/_coach/seat-racing')({
  errorComponent: RouteErrorFallback,
  component: SeatRacingRoute,
  staticData: { breadcrumb: 'Seat Racing' },
});

function SeatRacingRoute() {
  const { activeTeamId } = useAuth();
  const { isReadOnly } = usePermissions();

  if (!activeTeamId) {
    return <div className="p-8 text-text-dim text-sm">Select a team to access seat racing.</div>;
  }

  return <SeatRacingPage teamId={activeTeamId} readOnly={isReadOnly('seat_racing')} />;
}
