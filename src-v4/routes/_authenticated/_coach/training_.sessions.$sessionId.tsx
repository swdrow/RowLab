/**
 * Route: /training/sessions/$sessionId
 *
 * Coach training session detail page with Start/End/Edit/Delete actions.
 * Guarded by _coach layout (requires COACH+ role).
 */
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { SessionDetailPage } from '@/features/coach/sessions/components/SessionDetailPage';

export const Route = createFileRoute('/_authenticated/_coach/training_/sessions/$sessionId')({
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Session',
  },
  component: SessionDetail,
});

function SessionDetail() {
  const { sessionId } = Route.useParams();
  return <SessionDetailPage sessionId={sessionId} />;
}
