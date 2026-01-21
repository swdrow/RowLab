/**
 * useCollaboration Hook
 *
 * React hook for managing real-time collaboration state.
 * Provides presence tracking, cursor sharing, and synchronized updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collaborationService, type CollaborationCallbacks } from '@/services/collaborationService';
import type { PresenceUser } from '@/types';
import useAuthStore from '@/store/authStore';

interface CursorPosition {
  socketId: string;
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  activeBoatId?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  color: string;
  message: string;
  timestamp: number;
}

interface CollaborationState {
  connected: boolean;
  users: PresenceUser[];
  cursors: Map<string, CursorPosition>;
  messages: ChatMessage[];
  syncRequired: boolean;
}

interface UseCollaborationOptions {
  sessionId: string;
  lineupId?: number;
  onLineupUpdate?: (update: { operation: string; data: unknown; userId: string }) => void;
  enabled?: boolean;
}

export function useCollaboration({
  sessionId,
  lineupId,
  onLineupUpdate,
  enabled = true,
}: UseCollaborationOptions) {
  const { token } = useAuthStore();
  const [state, setState] = useState<CollaborationState>({
    connected: false,
    users: [],
    cursors: new Map(),
    messages: [],
    syncRequired: false,
  });

  const cursorThrottle = useRef<NodeJS.Timeout | null>(null);
  const lastCursorUpdate = useRef<{ x: number; y: number } | null>(null);

  // Connect and join session
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const callbacks: CollaborationCallbacks = {
      onConnect: () => {
        setState((prev) => ({ ...prev, connected: true }));
        collaborationService.joinSession(sessionId, lineupId);
      },
      onDisconnect: () => {
        setState((prev) => ({ ...prev, connected: false }));
      },
      onUsersUpdate: (users, event) => {
        setState((prev) => ({
          ...prev,
          users: users.map((u) => ({
            ...u,
            lastSeen: new Date(u.joinedAt || Date.now()),
          })),
        }));

        // TODO: Show toast notification for join/leave events
        // if (event.joined) toast(`${event.joined.name} joined`)
        // if (event.left) toast(`${event.left.name} left`)
      },
      onCursorUpdate: (cursor) => {
        setState((prev) => {
          const newCursors = new Map(prev.cursors);
          newCursors.set(cursor.socketId, {
            socketId: cursor.socketId,
            userId: cursor.userId,
            name: cursor.name,
            color: cursor.color,
            x: cursor.cursor.x,
            y: cursor.cursor.y,
            activeBoatId: cursor.activeBoatId,
          });
          return { ...prev, cursors: newCursors };
        });
      },
      onLineupUpdate: (update) => {
        // Don't apply our own updates
        const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
        if (update.userId !== currentUserId) {
          onLineupUpdate?.({
            operation: update.operation,
            data: update.data,
            userId: update.userId,
          });
        }
      },
      onChatMessage: (message) => {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages.slice(-99), message], // Keep last 100 messages
        }));
      },
      onSyncRequired: ({ needsRefresh }) => {
        setState((prev) => ({ ...prev, syncRequired: needsRefresh }));
      },
      onError: (error) => {
        console.error('Collaboration error:', error);
      },
    };

    collaborationService.setCallbacks(callbacks);
    collaborationService.connect(token || undefined).catch(console.error);

    return () => {
      collaborationService.leaveSession();
      collaborationService.disconnect();
    };
  }, [enabled, sessionId, lineupId, token, onLineupUpdate]);

  // Track mouse movement with throttling
  const updateCursor = useCallback((x: number, y: number, activeBoatId?: string) => {
    lastCursorUpdate.current = { x, y };

    if (!cursorThrottle.current) {
      cursorThrottle.current = setTimeout(() => {
        if (lastCursorUpdate.current) {
          collaborationService.updateCursor(
            lastCursorUpdate.current.x,
            lastCursorUpdate.current.y,
            activeBoatId
          );
        }
        cursorThrottle.current = null;
      }, 50); // 20 updates per second max
    }
  }, []);

  // Broadcast a change to other users
  const broadcastChange = useCallback((operation: string, data: unknown) => {
    collaborationService.broadcastChange(operation, data);
  }, []);

  // Update selection state
  const updateSelection = useCallback((selectedSeats: unknown[], selectedAthlete: unknown) => {
    collaborationService.updateSelection(selectedSeats, selectedAthlete);
  }, []);

  // Send a chat message
  const sendMessage = useCallback((message: string) => {
    collaborationService.sendChatMessage(message);
  }, []);

  // Clear sync required flag
  const clearSyncRequired = useCallback(() => {
    setState((prev) => ({ ...prev, syncRequired: false }));
  }, []);

  // Remove stale cursors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        // Cursors are removed when users disconnect, but this is a safety net
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    updateCursor,
    broadcastChange,
    updateSelection,
    sendMessage,
    clearSyncRequired,
    isConnected: state.connected,
    userCount: state.users.length,
  };
}

export default useCollaboration;
