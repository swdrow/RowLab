// src/v2/features/activity-feed/components/AttendanceActivityCard.tsx
// Typed activity card for practice attendance

import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';
import { Check, X, Clock, WarningCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { AttendanceActivity } from '../../../types/activity';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get icon and color scheme for attendance status
 */
function getStatusConfig(status: string): {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  label: string;
} {
  const statusLower = status.toLowerCase();

  if (statusLower === 'present') {
    return {
      icon: Check,
      colorClass: 'text-green-400',
      bgClass: 'bg-green-400/10',
      label: 'Present',
    };
  }

  if (statusLower === 'late') {
    return {
      icon: Clock,
      colorClass: 'text-yellow-400',
      bgClass: 'bg-yellow-400/10',
      label: 'Late',
    };
  }

  if (statusLower === 'excused') {
    return {
      icon: WarningCircle,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-400/10',
      label: 'Excused',
    };
  }

  // unexcused or absent
  return {
    icon: X,
    colorClass: 'text-red-400',
    bgClass: 'bg-red-400/10',
    label: 'Unexcused',
  };
}

// ============================================
// COMPONENT
// ============================================

interface AttendanceActivityCardProps {
  activity: AttendanceActivity;
}

export function AttendanceActivityCard({ activity }: AttendanceActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/app/attendance');
  };

  const { status, practiceType } = activity.metadata;
  const statusConfig = getStatusConfig(status);
  const Icon = statusConfig.icon;

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -1 }}
      className="bg-surface-elevated/80 backdrop-blur-sm rounded-lg border border-bdr-default p-4 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer group group-hover:scale-[1.01]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full ${statusConfig.bgClass} flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-5 h-5 ${statusConfig.colorClass}`} weight="bold" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-txt-primary truncate">Practice Attendance</h3>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Metadata: Status + Practice Type */}
          <div className="flex items-center gap-3 mt-1 text-sm">
            <span className={`font-medium ${statusConfig.colorClass}`}>{statusConfig.label}</span>
            {practiceType && <span className="text-txt-muted">{practiceType}</span>}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-txt-subtle mt-1">
            {formatDistance(new Date(activity.date), new Date(), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
