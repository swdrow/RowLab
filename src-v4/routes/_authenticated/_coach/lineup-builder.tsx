/**
 * Lineup Builder route: full-featured lineup workspace.
 *
 * Supports lineupId search param for deep-linking to a saved lineup.
 * Derives teamId and readOnly from auth context + permission hook.
 */
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/permissions';
import { LineupWorkspace } from '@/features/coach/lineup/components/LineupWorkspace';

const searchSchema = z.object({
  lineupId: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/_coach/lineup-builder')({
  errorComponent: RouteErrorFallback,
  component: LineupBuilderRoute,
  staticData: { breadcrumb: 'Lineup Builder' },
  validateSearch: (search) => searchSchema.parse(search),
});

function LineupBuilderRoute() {
  const { activeTeamId } = useAuth();
  const { isReadOnly } = usePermissions();
  const { lineupId } = Route.useSearch();

  if (!activeTeamId) {
    return (
      <div className="p-8 text-text-dim text-sm">Select a team to access the lineup builder.</div>
    );
  }

  return (
    <LineupWorkspace teamId={activeTeamId} lineupId={lineupId} readOnly={isReadOnly('lineup')} />
  );
}
