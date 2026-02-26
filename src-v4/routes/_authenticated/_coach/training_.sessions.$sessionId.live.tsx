/**
 * Route: /training/sessions/$sessionId/live
 *
 * Live training session page with real-time erg dashboard.
 * Guarded by _coach layout (requires COACH+ role).
 */
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { LiveSessionPage } from '@/features/coach/sessions/components/LiveSessionPage';

export const Route = createFileRoute('/_authenticated/_coach/training_/sessions/$sessionId/live')({
  errorComponent: RouteErrorFallback,
  component: LiveSession,
  staticData: {
    breadcrumb: 'Live Session',
  },
});

function LiveSession() {
  const { sessionId } = Route.useParams();
  return <LiveSessionPage sessionId={sessionId} />;
}
