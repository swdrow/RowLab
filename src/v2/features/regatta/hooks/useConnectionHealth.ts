/**
 * Connection Health Hook
 *
 * Monitors Socket.IO connection status and retry count for race day features.
 * Provides connection status indicator data (green/yellow/red).
 *
 * Connection states:
 * - connected: Socket.IO connected, healthy (green)
 * - degraded: Connection errors, reconnecting (yellow)
 * - offline: Disconnected, no retry in progress (red)
 */

import { useState, useEffect } from 'react';
import { collaborationService } from '@/services/collaborationService';

export type ConnectionStatus = 'connected' | 'degraded' | 'offline';

export interface ConnectionHealth {
  status: ConnectionStatus;
  retryCount: number;
  lastConnected: Date | null;
  isHealthy: boolean;
}

export function useConnectionHealth(): ConnectionHealth {
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [retryCount, setRetryCount] = useState(0);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);

  useEffect(() => {
    const socket = collaborationService.getSocket();
    if (!socket) {
      setStatus('offline');
      return;
    }

    // Set initial status
    if (socket.connected) {
      setStatus('connected');
      setLastConnected(new Date());
    } else {
      setStatus('offline');
    }

    // Connection events
    const handleConnect = () => {
      setStatus('connected');
      setRetryCount(0);
      setLastConnected(new Date());
    };

    const handleDisconnect = (reason: string) => {
      if (reason === 'io server disconnect') {
        // Server kicked us - likely auth issue or server shutdown
        setStatus('offline');
      } else {
        // Client-side disconnect - Socket.IO will auto-reconnect
        setStatus('degraded');
      }
    };

    const handleConnectError = (error: Error) => {
      setStatus('degraded');
      setRetryCount((prev) => prev + 1);
      console.error('Socket.IO connection error:', error);
    };

    // Ping/pong health check for latency monitoring
    const handlePing = () => {
      // Socket.IO's internal ping mechanism
      // We could check latency here if needed:
      // const latency = Date.now() - socket.io.engine.pingTimeout;
      // if (latency > 1000) setStatus('degraded');
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('ping', handlePing);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('ping', handlePing);
    };
  }, []);

  return {
    status,
    retryCount,
    lastConnected,
    isHealthy: status === 'connected',
  };
}
