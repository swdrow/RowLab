/**
 * Whiteboard route -- /whiteboard
 *
 * Coach-only structured notes board. Protected by _coach layout guard.
 */
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { WhiteboardPage } from '@/features/coach/whiteboard/components/WhiteboardPage';

export const Route = createFileRoute('/_authenticated/_coach/whiteboard')({
  errorComponent: RouteErrorFallback,
  component: WhiteboardPage,
});
