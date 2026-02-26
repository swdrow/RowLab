/**
 * Notification API functions.
 * All endpoints require authentication (handled by axios interceptor).
 *
 * Backend: /api/v1/notifications/* (built in plan 44-06)
 */
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
}

interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

/** GET /api/v1/notifications - list notifications for current user */
export async function getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
  const res = await api.get<NotificationsResponse>('/api/v1/notifications', {
    params: { limit, offset },
  });
  return res.data.data;
}

/** GET /api/v1/notifications/unread-count */
export async function getUnreadCount(): Promise<number> {
  const res = await api.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
  return res.data.data.count;
}

/** PATCH /api/v1/notifications/:id/read */
export async function markAsRead(id: string): Promise<void> {
  await api.patch(`/api/v1/notifications/${id}/read`);
}

/** PATCH /api/v1/notifications/read-all */
export async function markAllAsRead(): Promise<void> {
  await api.patch('/api/v1/notifications/read-all');
}

/** DELETE /api/v1/notifications/:id */
export async function dismissNotification(id: string): Promise<void> {
  await api.delete(`/api/v1/notifications/${id}`);
}
