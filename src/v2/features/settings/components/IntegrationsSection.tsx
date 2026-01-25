import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, Plug } from 'lucide-react';
import { IntegrationCard } from './IntegrationCard';
import { C2StravaSync } from './C2StravaSync';
import { FitImportSection } from './FitImportSection';
import {
  useC2Status,
  useConnectC2,
  useDisconnectC2,
  useSyncC2,
  useStravaStatus,
  useConnectStrava,
  useDisconnectStrava,
  useSyncStrava,
  integrationKeys,
} from '@v2/hooks/useIntegrations';

/**
 * IntegrationsSection - Main integrations tab content for Settings page
 *
 * Features:
 * - Concept2 Logbook connection with OAuth popup flow
 * - Strava Activities connection with OAuth popup flow
 * - C2 to Strava sync (shown when both connected)
 * - FIT file import
 * - Coming Soon placeholder for TrainingPeaks
 *
 * Uses hooks from useIntegrations.ts for all API interactions.
 */
export function IntegrationsSection() {
  const queryClient = useQueryClient();

  // C2 hooks
  const { status: c2Status, isConnected: c2Connected } = useC2Status();
  const { connectAsync: connectC2, isConnecting: c2Connecting } = useConnectC2();
  const { disconnect: disconnectC2, isDisconnecting: c2Disconnecting } = useDisconnectC2();
  const { sync: syncC2, isSyncing: c2Syncing } = useSyncC2();

  // Strava hooks
  const { status: stravaStatus, isConnected: stravaConnected } = useStravaStatus();
  const { connectAsync: connectStrava, isConnecting: stravaConnecting } = useConnectStrava();
  const { disconnect: disconnectStrava, isDisconnecting: stravaDisconnecting } =
    useDisconnectStrava();
  const { sync: syncStrava, isSyncing: stravaSyncing } = useSyncStrava();

  /**
   * Open OAuth popup window centered on screen
   */
  const openOAuthPopup = useCallback((url: string, name: string) => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(url, name, `width=${width},height=${height},left=${left},top=${top}`);
  }, []);

  /**
   * Handle C2 connect - get OAuth URL and open popup
   */
  const handleConnectC2 = useCallback(async () => {
    try {
      const response = await connectC2();
      if (response.url) {
        openOAuthPopup(response.url, 'c2_oauth_popup');
      }
    } catch (error) {
      console.error('Failed to get C2 OAuth URL:', error);
    }
  }, [connectC2, openOAuthPopup]);

  /**
   * Handle Strava connect - get OAuth URL and open popup
   */
  const handleConnectStrava = useCallback(async () => {
    try {
      const response = await connectStrava();
      if (response.authUrl) {
        openOAuthPopup(response.authUrl, 'strava_oauth_popup');
      }
    } catch (error) {
      console.error('Failed to get Strava OAuth URL:', error);
    }
  }, [connectStrava, openOAuthPopup]);

  /**
   * Listen for OAuth completion messages from popup windows
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) return;

      // Handle C2 OAuth success
      if (event.data?.type === 'c2_oauth_success') {
        queryClient.invalidateQueries({ queryKey: integrationKeys.c2.status() });
      }

      // Handle Strava OAuth success
      if (event.data?.type === 'strava_oauth_success') {
        queryClient.invalidateQueries({ queryKey: integrationKeys.strava.status() });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  return (
    <div className="space-y-8">
      {/* Concept2 Logbook Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-interactive-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-interactive-primary" />
          </div>
          <h3 className="text-lg font-semibold text-txt-primary">Concept2 Logbook</h3>
        </div>
        <IntegrationCard
          icon={<BarChart3 className="w-6 h-6 text-interactive-primary" />}
          iconBg="bg-interactive-primary/20 border border-interactive-primary/30"
          title="Concept2 Logbook"
          description="Import erg data automatically"
          connected={c2Connected}
          username={c2Status?.username}
          lastSynced={c2Status?.lastSyncedAt}
          onConnect={handleConnectC2}
          onDisconnect={() => disconnectC2()}
          onSync={() => syncC2()}
          connectLoading={c2Connecting}
          disconnectLoading={c2Disconnecting}
          syncLoading={c2Syncing}
          accentColor="text-interactive-primary"
        />
        <p className="text-sm text-txt-secondary mt-3">
          Connect your Concept2 Logbook to automatically import erg test results into RowLab.
        </p>
      </section>

      {/* Strava Activities Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FC4C02]/10 flex items-center justify-center">
            <span className="text-lg">🏃</span>
          </div>
          <h3 className="text-lg font-semibold text-txt-primary">Strava Activities</h3>
        </div>
        <IntegrationCard
          icon={<span className="text-xl">🏃</span>}
          iconBg="bg-[#FC4C02]/20 border border-[#FC4C02]/30"
          title="Strava Activities"
          description="Sync rowing and training activities"
          connected={stravaConnected}
          username={stravaStatus?.username}
          lastSynced={stravaStatus?.lastSyncedAt}
          onConnect={handleConnectStrava}
          onDisconnect={() => disconnectStrava()}
          onSync={() => syncStrava()}
          connectLoading={stravaConnecting}
          disconnectLoading={stravaDisconnecting}
          syncLoading={stravaSyncing}
          accentColor="text-[#FC4C02]"
        />
        <p className="text-sm text-txt-secondary mt-3">
          Connect Strava to automatically import rowing activities, cross-training, and other
          workouts.
        </p>
      </section>

      {/* C2 to Strava Sync Section - Only show when both connected */}
      {c2Connected && stravaConnected && <C2StravaSync />}

      {/* Coming Soon Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
            <Plug className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <h3 className="text-lg font-semibold text-txt-primary">Coming Soon</h3>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-bg-surface-elevated/30 border border-bdr-subtle opacity-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h4 className="font-medium text-txt-primary">TrainingPeaks</h4>
              <p className="text-sm text-txt-secondary mt-1">Import training plans</p>
            </div>
          </div>
          <span className="text-xs font-medium text-txt-tertiary px-3 py-1 rounded-full bg-bg-surface-elevated border border-bdr-default">
            Coming Soon
          </span>
        </div>
      </section>

      {/* FIT Import Section */}
      <FitImportSection />
    </div>
  );
}

export default IntegrationsSection;
