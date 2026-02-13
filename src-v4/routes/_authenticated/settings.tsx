/**
 * Settings page stub. Full implementation in Phase 50.
 */
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
  staticData: {
    breadcrumb: 'Settings',
  },
});

function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-deep p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-ink-primary">Settings</h1>
        <p className="mt-2 text-ink-secondary">Account settings will be available in Phase 50.</p>
      </div>
    </div>
  );
}
