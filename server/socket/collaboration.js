/**
 * Real-time Collaboration Server
 *
 * Implements WebSocket-based collaboration features:
 * - User presence (who's online, where they are)
 * - Real-time lineup updates (see changes as they happen)
 * - Cursor positions (see where others are looking)
 * - Conflict resolution (optimistic updates with rollback)
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Store active sessions and their state
const sessions = new Map(); // sessionId -> { users, lineupState }
const userSockets = new Map(); // socketId -> { userId, sessionId, color }

// Generate a random color for user cursor
const generateUserColor = () => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F8B500',
    '#00CED1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer
 */
export function initializeWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? ['https://rowlab.net']
          : ['http://localhost:3001', 'http://localhost:3002', 'http://10.0.0.17:3001'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      // Allow anonymous connections for demo purposes
      socket.user = { id: `anon-${socket.id}`, name: 'Anonymous', role: 'viewer' };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn('Invalid socket auth token', { socketId: socket.id });
      socket.user = { id: `anon-${socket.id}`, name: 'Anonymous', role: 'viewer' };
      next();
    }
  });

  io.on('connection', (socket) => {
    const color = generateUserColor();
    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.user?.id,
      userName: socket.user?.name,
    });

    // Join a collaboration session (lineup editing)
    socket.on('session:join', ({ sessionId, lineupId }) => {
      // Leave any existing session
      const existing = userSockets.get(socket.id);
      if (existing?.sessionId) {
        socket.leave(existing.sessionId);
        removeUserFromSession(existing.sessionId, socket.id);
      }

      // Join the new session
      socket.join(sessionId);

      // Initialize session if needed
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          users: new Map(),
          lineupId,
          version: 0,
          lastActivity: Date.now(),
        });
      }

      const session = sessions.get(sessionId);
      const userInfo = {
        id: socket.user.id,
        name: socket.user.name || 'Anonymous',
        color,
        socketId: socket.id,
        cursor: null,
        activeBoatId: null,
        joinedAt: Date.now(),
      };

      session.users.set(socket.id, userInfo);
      userSockets.set(socket.id, { userId: socket.user.id, sessionId, color });

      // Notify everyone in the session
      io.to(sessionId).emit('session:users', {
        users: Array.from(session.users.values()),
        joined: userInfo,
      });

      // Send current state to the new user
      socket.emit('session:state', {
        sessionId,
        users: Array.from(session.users.values()),
        version: session.version,
      });

      logger.info('User joined session', { sessionId, userId: socket.user.id });
    });

    // Leave a session
    socket.on('session:leave', () => {
      const userData = userSockets.get(socket.id);
      if (userData?.sessionId) {
        socket.leave(userData.sessionId);
        removeUserFromSession(userData.sessionId, socket.id);
        userSockets.delete(socket.id);
      }
    });

    // Cursor movement
    socket.on('cursor:move', ({ x, y, activeBoatId }) => {
      const userData = userSockets.get(socket.id);
      if (!userData?.sessionId) return;

      const session = sessions.get(userData.sessionId);
      if (!session) return;

      const userInfo = session.users.get(socket.id);
      if (userInfo) {
        userInfo.cursor = { x, y };
        userInfo.activeBoatId = activeBoatId;
      }

      // Broadcast to others in the session
      socket.to(userData.sessionId).emit('cursor:update', {
        socketId: socket.id,
        userId: userInfo?.id,
        name: userInfo?.name,
        color: userData.color,
        cursor: { x, y },
        activeBoatId,
      });
    });

    // Lineup change (optimistic update with version check)
    socket.on('lineup:change', ({ operation, data, clientVersion }) => {
      const userData = userSockets.get(socket.id);
      if (!userData?.sessionId) return;

      const session = sessions.get(userData.sessionId);
      if (!session) return;

      // Version check for conflict detection
      if (clientVersion < session.version) {
        // Client is behind - send current state
        socket.emit('lineup:sync', {
          version: session.version,
          needsRefresh: true,
        });
        return;
      }

      // Increment version and broadcast change
      session.version++;
      session.lastActivity = Date.now();

      const userInfo = session.users.get(socket.id);

      io.to(userData.sessionId).emit('lineup:updated', {
        operation,
        data,
        version: session.version,
        userId: userInfo?.id,
        userName: userInfo?.name,
        color: userData.color,
        timestamp: Date.now(),
      });

      logger.debug('Lineup change', {
        sessionId: userData.sessionId,
        operation,
        version: session.version,
      });
    });

    // Selection change (which seats are selected)
    socket.on('selection:change', ({ selectedSeats, selectedAthlete }) => {
      const userData = userSockets.get(socket.id);
      if (!userData?.sessionId) return;

      const userInfo = sessions.get(userData.sessionId)?.users.get(socket.id);

      socket.to(userData.sessionId).emit('selection:update', {
        socketId: socket.id,
        userId: userInfo?.id,
        name: userInfo?.name,
        color: userData.color,
        selectedSeats,
        selectedAthlete,
      });
    });

    // Chat message
    socket.on('chat:message', ({ message }) => {
      const userData = userSockets.get(socket.id);
      if (!userData?.sessionId) return;

      const userInfo = sessions.get(userData.sessionId)?.users.get(socket.id);

      io.to(userData.sessionId).emit('chat:message', {
        id: `${socket.id}-${Date.now()}`,
        userId: userInfo?.id,
        name: userInfo?.name,
        color: userData.color,
        message,
        timestamp: Date.now(),
      });
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason });

      const userData = userSockets.get(socket.id);
      if (userData?.sessionId) {
        removeUserFromSession(userData.sessionId, socket.id);
      }
      userSockets.delete(socket.id);
    });
  });

  // Helper function to remove user from session
  function removeUserFromSession(sessionId, socketId) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const userInfo = session.users.get(socketId);
    session.users.delete(socketId);

    // Notify others
    io.to(sessionId).emit('session:users', {
      users: Array.from(session.users.values()),
      left: userInfo,
    });

    // Clean up empty sessions after a delay
    if (session.users.size === 0) {
      setTimeout(() => {
        const currentSession = sessions.get(sessionId);
        if (currentSession && currentSession.users.size === 0) {
          sessions.delete(sessionId);
          logger.info('Session cleaned up', { sessionId });
        }
      }, 60000); // 1 minute delay
    }
  }

  // Periodic cleanup of stale sessions
  setInterval(
    () => {
      const now = Date.now();
      const staleThreshold = 30 * 60 * 1000; // 30 minutes

      for (const [sessionId, session] of sessions.entries()) {
        if (session.users.size === 0 && now - session.lastActivity > staleThreshold) {
          sessions.delete(sessionId);
          logger.info('Stale session removed', { sessionId });
        }
      }
    },
    5 * 60 * 1000
  ); // Check every 5 minutes

  logger.info('WebSocket server initialized');

  return io;
}

export default { initializeWebSocket };
