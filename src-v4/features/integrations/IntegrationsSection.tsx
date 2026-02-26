/**
 * IntegrationsSection -- settings page integration management UI.
 *
 * Renders cards for Concept2, Strava, and Garmin connections.
 * C2 and Strava use OAuth popup flow; Garmin uses FIT file import.
 *
 * Ported from v2 IntegrationsSection with v4 Canvas design tokens.
 */
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { IconBarChart, IconActivity, IconWatch } from '@/components/icons';
import { queryKeys } from '@/lib/queryKeys';
import { IntegrationCard } from './IntegrationCard';
import {
  useC2Status,
  useConnectC2,
  useDisconnectC2,
  useSyncC2,
  useStravaStatus,
  useConnectStrava,
  useDisconnectStrava,
  useSyncStrava,
} from './hooks';

// ---------------------------------------------------------------------------
// OAuth popup utility
// ---------------------------------------------------------------------------

/**
 * Open an OAuth popup centered on the screen.
 * Same pattern as v2 -- 600x700 popup with calculated offset.
 */
function openOAuthPopup(url: string, name: string): void {
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(url, name, `width=${width},height=${height},left=${left},top=${top}`);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntegrationsSection() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // -- C2 hooks --
  const { status: c2Status, isConnected: c2Connected } = useC2Status();
  const { connectAsync: connectC2Async, isConnecting: c2Connecting } = useConnectC2();
  const { disconnect: disconnectC2, isDisconnecting: c2Disconnecting } = useDisconnectC2();
  const { sync: syncC2, isSyncing: c2Syncing } = useSyncC2();

  // -- Strava hooks --
  const { status: stravaStatus, isConnected: stravaConnected } = useStravaStatus();
  const { connectAsync: connectStravaAsync, isConnecting: stravaConnecting } = useConnectStrava();
  const { disconnect: disconnectStrava, isDisconnecting: stravaDisconnecting } =
    useDisconnectStrava();
  const { sync: syncStrava, isSyncing: stravaSyncing } = useSyncStrava();

  // ---------------------------------------------------------------------------
  // OAuth popup message listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'c2_oauth_success') {
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations.c2.status() });
      }

      if (event.data?.type === 'strava_oauth_success') {
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations.strava.status() });
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  // ---------------------------------------------------------------------------
  // Connect handlers
  // ---------------------------------------------------------------------------

  const handleConnectC2 = useCallback(async () => {
    try {
      const response = await connectC2Async();
      if (response.url) {
        openOAuthPopup(response.url, 'c2_oauth_popup');
      }
    } catch (error) {
      console.error('Failed to initiate C2 OAuth:', error);
    }
  }, [connectC2Async]);

  const handleConnectStrava = useCallback(async () => {
    try {
      const response = await connectStravaAsync();
      if (response.authUrl) {
        openOAuthPopup(response.authUrl, 'strava_oauth_popup');
      }
    } catch (error) {
      console.error('Failed to initiate Strava OAuth:', error);
    }
  }, [connectStravaAsync]);

  // ---------------------------------------------------------------------------
  // Garmin FIT import handler
  // ---------------------------------------------------------------------------

  const handleGarminImport = useCallback(() => {
    navigate({ to: '/workouts', search: { view: 'feed', calendarMode: 'monthly' } });
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-semibold text-text-bright mb-1">Integrations</h2>
        <p className="text-sm text-text-dim">
          Connect your accounts to automatically sync workouts and training data.
        </p>
      </div>

      <div className="space-y-4">
        {/* Concept2 Logbook */}
        <IntegrationCard
          icon={<IconBarChart className="w-6 h-6 text-accent-teal" />}
          iconBg="bg-accent-teal/20"
          title="Concept2 Logbook"
          description="Import erg workouts automatically from your C2 logbook"
          connected={c2Connected}
          username={c2Status?.username ?? undefined}
          lastSynced={c2Status?.lastSyncedAt}
          statsLine={
            c2Status?.workoutCount != null ? `${c2Status.workoutCount} workouts synced` : undefined
          }
          onConnect={handleConnectC2}
          onDisconnect={() => disconnectC2()}
          onSync={() => syncC2()}
          connectLoading={c2Connecting}
          disconnectLoading={c2Disconnecting}
          syncLoading={c2Syncing}
          accentColor="text-accent-teal"
        />

        {/* Strava Activities -- Brand color exception: #FC4C02 per Strava brand guidelines */}
        <IntegrationCard
          icon={<IconActivity className="w-6 h-6 text-[#FC4C02]" />}
          iconBg="bg-[#FC4C02]/20"
          title="Strava"
          description="Sync rowing and cross-training activities from Strava"
          connected={stravaConnected}
          username={stravaStatus?.username ?? undefined}
          lastSynced={stravaStatus?.lastSyncedAt}
          onConnect={handleConnectStrava}
          onDisconnect={() => disconnectStrava()}
          onSync={() => syncStrava()}
          connectLoading={stravaConnecting}
          disconnectLoading={stravaDisconnecting}
          syncLoading={stravaSyncing}
          accentColor="text-[#FC4C02]"
        />

        {/* Garmin -- FIT import only (no API approval yet) */}
        <IntegrationCard
          icon={<IconWatch className="w-6 h-6 text-data-good" />}
          iconBg="bg-data-good/20"
          title="Garmin"
          description="Import workouts from .FIT files exported from Garmin Connect"
          connected={false}
          onConnect={handleGarminImport}
          onDisconnect={() => {}}
          connectLabel="Import .FIT File"
          accentColor="text-data-good"
        />
        <p className="text-xs text-text-faint -mt-2 ml-16">
          Direct Garmin API sync is not yet available. Export .FIT files from Garmin Connect and
          import them from the workouts page.
        </p>
      </div>
    </div>
  );
}

export default IntegrationsSection;
