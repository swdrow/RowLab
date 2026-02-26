/**
 * TanStack Query hooks for notification data and mutations.
 *
 * - useUnreadCount: polls every 60s for badge updates
 * - useNotifications: fetches list when panel is open
 * - useMarkAsRead / useMarkAllAsRead / useDismissNotification: mutations with optimistic updates
 * - useNotificationSocket: optional Socket.IO listener for real-time badge updates
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  type Notification,
} from './api';

/* === QUERIES === */

/** Poll unread count every 60s for badge updates */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/** Fetch notification list -- only when panel is open */
export function useNotificationList(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => getNotifications(),
    enabled,
    staleTime: 15_000,
  });
}

/* === MUTATIONS === */

/** Mark a single notification as read */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}

/** Mark all notifications as read with optimistic update */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      // Snapshot for rollback
      const previousCount = queryClient.getQueryData(queryKeys.notifications.unreadCount());
      const previousList = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);

      // Optimistic: set count to 0
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), 0);

      // Optimistic: mark all as read in list
      if (previousList) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          previousList.map((n) => ({
            ...n,
            readAt: n.readAt ?? new Date().toISOString(),
          }))
        );
      }

      return { previousCount, previousList };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousCount);
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previousList);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}

/** Dismiss a notification with optimistic removal */
export function useDismissNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissNotification,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousList = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);

      // Optimistic: remove from list
      if (previousList) {
        const removed = previousList.find((n) => n.id === id);
        queryClient.setQueryData(
          queryKeys.notifications.all,
          previousList.filter((n) => n.id !== id)
        );

        // If the removed notification was unread, decrement count
        if (removed && !removed.readAt) {
          const currentCount = queryClient.getQueryData<number>(
            queryKeys.notifications.unreadCount()
          );
          if (currentCount !== undefined && currentCount > 0) {
            queryClient.setQueryData(queryKeys.notifications.unreadCount(), currentCount - 1);
          }
        }
      }

      return { previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previousList);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}

/* === OPTIONAL SOCKET.IO LISTENER === */

/**
 * Connects to Socket.IO for real-time notification count updates.
 * Falls back silently to polling if connection fails.
 */
export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<ReturnType<typeof import('socket.io-client').io> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function connectSocket() {
      try {
        // Dynamic import to avoid bundling socket.io-client if not needed
        const { io } = await import('socket.io-client');

        if (!mounted) return;

        const socket = io(window.location.origin, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 3,
          timeout: 5000,
        });

        socketRef.current = socket;

        socket.on('notification:count', (data: { count: number }) => {
          queryClient.setQueryData(queryKeys.notifications.unreadCount(), data.count);
        });

        socket.on('connect_error', () => {
          // Silently degrade to polling -- useUnreadCount already polls every 60s
          socket.disconnect();
        });
      } catch {
        // Socket.IO not available -- fall back to polling (already active via useUnreadCount)
      }
    }

    connectSocket();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);
}
