/**
 * OfflineQueueIndicator Component
 *
 * Small, persistent badge showing pending offline mutations (RT-04).
 * Displays when mutations are queued offline or syncing.
 *
 * Features:
 * - Shows pending count when offline
 * - Shows "Syncing..." when online and mutations retrying
 * - Auto-hides when no pending mutations and online
 * - Uses V3 data color tokens (data-warning offline, data-good syncing)
 * - Fixed position bottom-right corner
 * - Listens to online/offline window events
 * - Gets pending count from TanStack Query mutation cache
 */

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@v2/utils/cn';

export function OfflineQueueIndicator() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll pending mutations count
  useEffect(() => {
    const updatePendingCount = () => {
      const mutations = queryClient.getMutationCache().getAll();
      const pending = mutations.filter((m) => m.state.status === 'pending').length;
      setPendingCount(pending);
    };

    // Initial check
    updatePendingCount();

    // Poll every 500ms
    const interval = setInterval(updatePendingCount, 500);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Hide if no pending mutations and online
  const shouldShow = pendingCount > 0 && (!isOnline || !isOnline);

  // Determine status
  const isSyncing = isOnline && pendingCount > 0;
  const isOffline = !isOnline && pendingCount > 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-40"
        >
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg',
              'backdrop-blur-sm border',
              isOffline && 'bg-data-warning/10 text-data-warning border-data-warning/20',
              isSyncing && 'bg-data-good/10 text-data-good border-data-good/20'
            )}
          >
            {isOffline && <WifiOff size={16} />}
            {isSyncing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw size={16} />
              </motion.div>
            )}

            <span className="whitespace-nowrap">
              {isOffline && `${pendingCount} pending`}
              {isSyncing && 'Syncing...'}
            </span>

            {isSyncing && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <CheckCircle size={14} className="opacity-70" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
