/**
 * Create Team route: /_authenticated/create-team
 *
 * Full-page 3-step wizard for creating a new team.
 * Accessible from the team switcher or teamless fallback.
 */
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { CreateTeamWizard } from '@/features/team/components/CreateTeamWizard';

export const Route = createFileRoute('/_authenticated/create-team')({
  component: CreateTeamPage,
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Create Team',
  },
});

function CreateTeamPage() {
  return <CreateTeamWizard />;
}
