/**
 * Athletes list page stub. Full implementation in Phase 46.
 * Requires active team context (guarded by _team layout).
 */
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/_team/athletes')({
  component: AthletesPage,
  staticData: {
    breadcrumb: 'Athletes',
  },
});

function AthletesPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-deep p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-ink-primary">Athletes</h1>
        <p className="mt-2 text-ink-secondary">Team athletes list will be available in Phase 46.</p>
      </div>
    </div>
  );
}
