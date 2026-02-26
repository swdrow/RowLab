/**
 * Integrations settings section.
 *
 * Per research: Concept2 has no team-level API, so we show a
 * "coming soon" state with a subtle illustration and explanation.
 * Future: could show per-athlete C2 connection status if the roster
 * endpoint is extended with that data.
 */
import { IconCable } from '@/components/icons';

export function IntegrationsSection() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-void-deep">
        <IconCable width={24} height={24} className="text-text-faint" />
      </div>
      <h3 className="text-sm font-display font-semibold text-text-bright mb-1">
        Team Integrations
      </h3>
      <p className="text-sm text-text-dim max-w-sm">
        Team-level integrations with Concept2 and other services are coming in a future update.
        Individual athletes can connect their Concept2 accounts from their personal settings.
      </p>
    </div>
  );
}
