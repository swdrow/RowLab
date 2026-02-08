/**
 * Race Day WebSocket Hook
 *
 * Manages race day WebSocket subscription for live result updates and ranking broadcasts.
 * Integrates with TanStack Query for cache invalidation on live events.
 *
 * Features:
 * - Auto-join/leave regatta rooms
 * - Live race result broadcasting
 * - Real-time ranking updates
 * - Viewer count tracking
 * - Debounced cache invalidation (prevents broadcast storms)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { collaborationService } from '@/services/collaborationService';
import { queryKeys } from '@v2/lib/queryKeys';
import debounce from 'lodash/debounce';

interface RaceResult {
  raceId: string;
  result: unknown;
  submittedBy: string;
  submittedById?: string;
  timestamp: number;
}

interface RankingUpdate {
  rankings: unknown[];
  timestamp: number;
}

interface UseRaceDaySocketOptions {
  regattaId: string;
  enabled?: boolean;
}

export function useRaceDaySocket({ regattaId, enabled = true }: UseRaceDaySocketOptions) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [liveResults, setLiveResults] = useState<RaceResult[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  // Debounced invalidation to prevent broadcast storms (Pitfall 3 from RESEARCH.md)
  const debouncedInvalidateRankings = useRef(
    debounce(
      () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teamRankings.rankings(),
        });
      },
      2000, // 2 second debounce
      { leading: false, trailing: true }
    )
  ).current;

  const debouncedInvalidateRace = useRef(
    debounce(
      (raceId: string) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.races.detail(raceId),
        });
      },
      2000,
      { leading: false, trailing: true }
    )
  ).current;

  useEffect(() => {
    if (!enabled || !regattaId) return;

    const socket = collaborationService.getSocket();
    if (!socket) {
      console.warn('Race day socket: collaboration service not connected');
      return;
    }

    setIsConnected(socket.connected);

    // Join race day room
    socket.emit('raceday:join', { regattaId });

    // Listen for new race results
    const handleNewResult = (data: RaceResult) => {
      setLiveResults((prev) => [data, ...prev].slice(0, 20)); // Keep last 20

      // Invalidate race query to refetch with new result (debounced)
      debouncedInvalidateRace(data.raceId);

      // Also invalidate the regatta detail to update race list
      queryClient.invalidateQueries({
        queryKey: queryKeys.regattas.detail(regattaId),
      });
    };

    // Listen for ranking updates
    const handleRankingUpdate = (data: RankingUpdate) => {
      // Optimistically update rankings cache
      queryClient.setQueryData(queryKeys.teamRankings.rankings(), data.rankings);

      // Debounced invalidation for safety
      debouncedInvalidateRankings();
    };

    // Listen for viewer count updates
    const handleViewersUpdate = (data: { count: number; timestamp: number }) => {
      setViewerCount(data.count);
    };

    // Connection health monitoring
    const handleConnect = () => {
      setIsConnected(true);
      // Re-join room on reconnect
      socket.emit('raceday:join', { regattaId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Register event listeners
    socket.on('raceday:result:new', handleNewResult);
    socket.on('raceday:rankings:update', handleRankingUpdate);
    socket.on('raceday:viewers', handleViewersUpdate);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      socket.emit('raceday:leave', { regattaId });
      socket.off('raceday:result:new', handleNewResult);
      socket.off('raceday:rankings:update', handleRankingUpdate);
      socket.off('raceday:viewers', handleViewersUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);

      // Cancel pending debounced calls
      debouncedInvalidateRankings.cancel();
      debouncedInvalidateRace.cancel();
    };
  }, [enabled, regattaId, queryClient, debouncedInvalidateRankings, debouncedInvalidateRace]);

  // Helper to submit a race result
  const submitResult = useCallback(
    (raceId: string, result: unknown) => {
      const socket = collaborationService.getSocket();
      if (!socket?.connected) {
        console.warn('Cannot submit result: socket not connected');
        return;
      }

      socket.emit('raceday:result:submit', {
        regattaId,
        raceId,
        result,
      });
    },
    [regattaId]
  );

  // Helper to broadcast ranking updates
  const broadcastRankings = useCallback(
    (rankings: unknown[]) => {
      const socket = collaborationService.getSocket();
      if (!socket?.connected) {
        console.warn('Cannot broadcast rankings: socket not connected');
        return;
      }

      socket.emit('raceday:rankings:updated', {
        regattaId,
        rankings,
      });
    },
    [regattaId]
  );

  return {
    isConnected,
    liveResults,
    viewerCount,
    submitResult,
    broadcastRankings,
  };
}
