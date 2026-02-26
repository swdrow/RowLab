/**
 * NotificationBell: bell icon button with unread count badge and dropdown panel.
 * Clicking the bell toggles the NotificationPanel dropdown.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { IconBell } from '@/components/icons';
import { useUnreadCount, useNotificationSocket } from '@/features/notifications/useNotifications';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadCount();

  // Initialize Socket.IO listener for real-time badge updates (graceful degradation to polling)
  useNotificationSocket();

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg p-2 text-text-faint transition-colors hover:bg-void-overlay hover:text-text-bright"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <IconBell width={18} height={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-accent-teal px-1 text-[11px] font-semibold leading-[18px] text-void-deep">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
