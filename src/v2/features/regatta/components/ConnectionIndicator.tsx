/**
 * Connection Indicator Component
 *
 * Visual badge showing WebSocket connection status during race day.
 * Uses V3 design tokens and Framer Motion animations.
 *
 * Status colors (V3 data tokens):
 * - Green (data-excellent): Connected, live updates flowing
 * - Yellow (data-warning): Degraded, reconnecting
 * - Red (data-poor): Offline, no connection
 *
 * Features:
 * - Pulsing animation on green dot (live indicator)
 * - Retry count display when degraded
 * - Auto-updates based on Socket.IO connection events
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@v2/utils/cn';
import type { ConnectionStatus } from '../hooks/useConnectionHealth';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  retryCount?: number;
  className?: string;
}

const STATUS_CONFIG = {
  connected: {
    icon: Wifi,
    color: 'text-data-excellent',
    bgColor: 'bg-data-excellent/10',
    borderColor: 'border-data-excellent/20',
    label: 'Live',
    pulse: true,
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-data-warning',
    bgColor: 'bg-data-warning/10',
    borderColor: 'border-data-warning/20',
    label: 'Reconnecting...',
    pulse: false,
  },
  offline: {
    icon: WifiOff,
    color: 'text-data-poor',
    bgColor: 'bg-data-poor/10',
    borderColor: 'border-data-poor/20',
    label: 'Offline',
    pulse: false,
  },
} as const;

export function ConnectionIndicator({
  status,
  retryCount = 0,
  className,
}: ConnectionIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
        'backdrop-blur-sm',
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      <div className="relative">
        <Icon size={14} />
        {config.pulse && (
          <motion.div
            className="absolute inset-0 rounded-full bg-current"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </div>

      <span className="whitespace-nowrap">{config.label}</span>

      {retryCount > 0 && status === 'degraded' && (
        <AnimatePresence>
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 0.7, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="text-xs"
          >
            (attempt {retryCount})
          </motion.span>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
