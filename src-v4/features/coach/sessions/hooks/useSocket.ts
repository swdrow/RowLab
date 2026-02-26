/**
 * useSocket - Lazy Socket.IO connection for live training sessions.
 *
 * Connects only when `enabled` is true (session is ACTIVE).
 * Listens for 'erg:update' and 'session:ended' events.
 * Disconnects cleanly on unmount to prevent Socket.IO leaks.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErgData {
  athleteId: string;
  athleteName: string;
  currentPace: number; // seconds per 500m
  currentWatts: number;
  distance: number; // meters
  strokeRate: number; // strokes per minute
  heartRate?: number | null;
  timestamp: number; // epoch ms
}

interface UseSocketReturn {
  isConnected: boolean;
  ergData: ErgData[];
  sessionEnded: boolean;
  endSession: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Merge incoming erg data into state.
 * Updates existing athlete entry or appends new one.
 */
function mergeErgData(prev: ErgData[], update: ErgData): ErgData[] {
  const idx = prev.findIndex((e) => e.athleteId === update.athleteId);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = update;
    return next;
  }
  return [...prev, update];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSocket(sessionId: string, enabled = true): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ergData, setErgData] = useState<ErgData[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const token = getAccessToken();

    const socket = io('/live-session', {
      query: { sessionId },
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('erg:update', (data: ErgData) => {
      setErgData((prev) => mergeErgData(prev, data));
    });

    socket.on('session:ended', () => {
      setSessionEnded(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, enabled]);

  const endSession = useCallback(() => {
    socketRef.current?.emit('session:end', { sessionId });
  }, [sessionId]);

  return { isConnected, ergData, sessionEnded, endSession };
}
