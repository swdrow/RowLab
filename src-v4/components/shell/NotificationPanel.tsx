/**
 * NotificationPanel: dropdown notification list below the bell.
 *
 * - Right-aligned, 320px wide (w-80)
 * - Header: "Notifications" + "Mark all read" action
 * - Scrollable list of NotificationItems (max-h-96)
 * - Loading: 3 skeleton notification items
 * - Empty: bell icon + "No notifications yet" message
 * - Animation: fade + slide down + scale via motion/react
 */
import { motion, AnimatePresence } from 'motion/react';
import { IconBell } from '@/components/icons';
import { useNavigate } from '@tanstack/react-router';
import {
  useNotificationList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDismissNotification,
} from '@/features/notifications/useNotifications';
import { NotificationItem } from '@/features/notifications/NotificationItem';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { SPRING_SNAPPY } from '@/lib/animations';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotificationList(isOpen);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const dismiss = useDismissNotification();

  function handleMarkRead(id: string) {
    markRead.mutate(id);
  }

  function handleDismiss(id: string) {
    dismiss.mutate(id);
  }

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  function handleNavigate(url: string) {
    navigate({ to: url });
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={SPRING_SNAPPY}
          className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-edge-default bg-void-overlay shadow-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-edge-default/50 px-4 py-3">
            <h3 className="text-sm font-display font-semibold text-text-bright">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-accent-teal transition-colors hover:text-accent-teal-hover"
                disabled={markAllRead.isPending}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto overscroll-contain">
            {isLoading ? (
              /* Loading skeletons */
              <SkeletonGroup className="p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
                    <Skeleton width="30px" height="30px" rounded="lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton width="70%" height="14px" rounded="sm" />
                      <Skeleton width="90%" height="12px" rounded="sm" />
                      <Skeleton width="40%" height="10px" rounded="sm" />
                    </div>
                  </div>
                ))}
              </SkeletonGroup>
            ) : !notifications || notifications.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <div className="rounded-xl bg-void-raised p-3">
                  <IconBell width={24} height={24} className="text-text-faint" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dim">No notifications yet</p>
                  <p className="mt-0.5 text-xs text-text-faint">
                    We&apos;ll let you know when something happens
                  </p>
                </div>
              </div>
            ) : (
              /* Notification list */
              <div className="py-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDismiss={handleDismiss}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
