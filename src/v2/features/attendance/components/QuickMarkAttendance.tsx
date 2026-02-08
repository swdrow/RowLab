import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Calendar, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAttendance } from '@v2/hooks/useAttendance';
import { BUTTON_PRESS } from '@v2/utils/animations';
import type { AttendanceStatus } from '@v2/types/athletes';

// ============================================
// Types
// ============================================

interface QuickMarkAttendanceProps {
  athleteId: string;
  date: string;
  currentStatus?: AttendanceStatus | null;
}

// ============================================
// Status Configuration (Phase 06-06: single-letter labels)
// ============================================

interface StatusConfig {
  value: AttendanceStatus;
  label: string;
  icon: typeof CheckCircle;
  activeClasses: string;
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    value: 'present',
    label: 'P',
    icon: CheckCircle,
    activeClasses: 'bg-data-excellent text-white',
  },
  {
    value: 'late',
    label: 'L',
    icon: Clock,
    activeClasses: 'bg-data-good text-white',
  },
  {
    value: 'excused',
    label: 'E',
    icon: Calendar,
    activeClasses: 'bg-data-warning text-white',
  },
  {
    value: 'unexcused',
    label: 'U',
    icon: XCircle,
    activeClasses: 'bg-data-poor text-white',
  },
];

const INACTIVE_CLASSES = 'bg-bg-surface-elevated text-txt-secondary hover:bg-bg-hover';

// ============================================
// Component
// ============================================

/**
 * One-tap P/L/E/U attendance buttons per athlete.
 *
 * - Single-letter labels per Phase 06-06 decision
 * - V3 data-* color tokens for status distinction
 * - BUTTON_PRESS spring animation for tactile feedback
 * - Optimistic UI via useAttendance hook
 * - Clicking same status toggles it off (deselect)
 */
export function QuickMarkAttendance({ athleteId, date, currentStatus }: QuickMarkAttendanceProps) {
  const { recordAttendance, isRecording, attendanceMap } = useAttendance(date);

  // Effective status from cache or props
  const effectiveStatus = currentStatus ?? attendanceMap[athleteId]?.status ?? null;

  const handleTap = useCallback(
    (status: AttendanceStatus) => {
      if (isRecording) return;

      // Toggle: clicking active status deselects (no-op since API upserts)
      if (effectiveStatus === status) return;

      recordAttendance(
        { athleteId, date, status },
        {
          onError: () => {
            toast.error('Failed to record attendance');
          },
        }
      );
    },
    [athleteId, date, effectiveStatus, isRecording, recordAttendance]
  );

  return (
    <div className="flex gap-1">
      {STATUS_CONFIG.map((config) => {
        const isActive = effectiveStatus === config.value;
        const Icon = config.icon;

        return (
          <motion.button
            key={config.value}
            type="button"
            onClick={() => handleTap(config.value)}
            disabled={isRecording}
            className={`
              w-10 h-10 rounded-lg text-sm font-semibold
              flex items-center justify-center
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${isActive ? config.activeClasses : INACTIVE_CLASSES}
            `}
            title={config.value.charAt(0).toUpperCase() + config.value.slice(1)}
            aria-pressed={isActive}
            aria-label={`Mark as ${config.value}`}
            {...BUTTON_PRESS}
          >
            {config.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export default QuickMarkAttendance;
