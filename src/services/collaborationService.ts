/**
 * Collaboration Service
 *
 * Manages WebSocket connection for real-time collaboration features.
 * Provides a clean API for joining sessions, tracking presence, and syncing changes.
 */

import { io, Socket } from 'socket.io-client';
import type { PresenceUser } from '@/types';

export interface CollaborationCallbacks {
  onUsersUpdate?: (
    users: PresenceUser[],
    event: { joined?: PresenceUser; left?: PresenceUser }
  ) => void;
  onCursorUpdate?: (cursor: {
    socketId: string;
    userId: string;
    name: string;
    color: string;
    cursor: { x: number; y: number };
    activeBoatId?: string;
  }) => void;
  onLineupUpdate?: (update: {
    operation: string;
    data: unknown;
    version: number;
    userId: string;
    userName: string;
    color: string;
    timestamp: number;
  }) => void;
  onSelectionUpdate?: (selection: {
    socketId: string;
    userId: string;
    name: string;
    color: string;
    selectedSeats: unknown[];
    selectedAthlete: unknown;
  }) => void;
  onChatMessage?: (message: {
    id: string;
    userId: string;
    name: string;
    color: string;
    message: string;
    timestamp: number;
  }) => void;
  onSyncRequired?: (info: { version: number; needsRefresh: boolean }) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

class CollaborationService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private callbacks: CollaborationCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentVersion = 0;

  /**
   * Connect to the collaboration server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;

      this.socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.callbacks.onConnect?.();
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.callbacks.onDisconnect?.(reason);
      });

      this.socket.on('connect_error', (error) => {
        this.reconnectAttempts++;
        this.callbacks.onError?.(error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.sessionId) {
      this.socket?.emit('session:leave');
    }
    this.socket?.disconnect();
    this.socket = null;
    this.sessionId = null;
  }

  /**
   * Join a collaboration session
   */
  joinSession(sessionId: string, lineupId?: number): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join session: not connected');
      return;
    }

    this.sessionId = sessionId;
    this.socket.emit('session:join', { sessionId, lineupId });
  }

  /**
   * Leave the current session
   */
  leaveSession(): void {
    if (this.socket?.connected && this.sessionId) {
      this.socket.emit('session:leave');
      this.sessionId = null;
    }
  }

  /**
   * Update cursor position
   */
  updateCursor(x: number, y: number, activeBoatId?: string): void {
    if (!this.socket?.connected || !this.sessionId) return;

    this.socket.emit('cursor:move', { x, y, activeBoatId });
  }

  /**
   * Broadcast a lineup change
   */
  broadcastChange(operation: string, data: unknown): void {
    if (!this.socket?.connected || !this.sessionId) return;

    this.socket.emit('lineup:change', {
      operation,
      data,
      clientVersion: this.currentVersion,
    });
  }

  /**
   * Update selection state
   */
  updateSelection(selectedSeats: unknown[], selectedAthlete: unknown): void {
    if (!this.socket?.connected || !this.sessionId) return;

    this.socket.emit('selection:change', { selectedSeats, selectedAthlete });
  }

  /**
   * Send a chat message
   */
  sendChatMessage(message: string): void {
    if (!this.socket?.connected || !this.sessionId) return;

    this.socket.emit('chat:message', { message });
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('session:users', (data) => {
      this.callbacks.onUsersUpdate?.(data.users, { joined: data.joined, left: data.left });
    });

    this.socket.on('session:state', (data) => {
      this.currentVersion = data.version;
      this.callbacks.onUsersUpdate?.(data.users, {});
    });

    this.socket.on('cursor:update', (data) => {
      this.callbacks.onCursorUpdate?.(data);
    });

    this.socket.on('lineup:updated', (data) => {
      this.currentVersion = data.version;
      this.callbacks.onLineupUpdate?.(data);
    });

    this.socket.on('lineup:sync', (data) => {
      this.callbacks.onSyncRequired?.(data);
    });

    this.socket.on('selection:update', (data) => {
      this.callbacks.onSelectionUpdate?.(data);
    });

    this.socket.on('chat:message', (data) => {
      this.callbacks.onChatMessage?.(data);
    });
  }

  /**
   * Set callbacks for events
   */
  setCallbacks(callbacks: CollaborationCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.currentVersion;
  }

  /**
   * Get the underlying Socket.IO instance
   * Used by other services (e.g., race day) to access the same connection
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();

export default collaborationService;
