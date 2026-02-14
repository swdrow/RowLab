/**
 * Route: /training/sessions
 *
 * Coach training sessions list. Shows all sessions with create form.
 * Guarded by _coach layout (requires COACH+ role).
 */
import { createFileRoute } from '@tanstack/react-router';
import { SessionsPage } from '@/features/coach/sessions/components/SessionsPage';

export const Route = createFileRoute('/_authenticated/_coach/training_/sessions')({
  component: SessionsPage,
});
