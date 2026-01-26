// src/v2/components/recruiting/RecruitVisitCard.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import type { RecruitVisit } from '../../types/recruiting';

interface RecruitVisitCardProps {
  visit: RecruitVisit;
  onClick?: () => void;
  compact?: boolean;
}

/**
 * Calendar event card for recruit visits.
 * Displays visit details with distinct violet/purple theme.
 */
export function RecruitVisitCard({ visit, onClick, compact = false }: RecruitVisitCardProps) {
  const statusColors = {
    scheduled: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  const dotColor = statusColors[visit.status] || 'bg-gray-500';

  // Compact mode for calendar cell display
  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/10 border-l-4 border-violet-500 rounded cursor-pointer"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <Users className="w-3 h-3 text-violet-500 flex-shrink-0" />
        <span className="truncate text-xs font-medium text-txt-primary">
          {visit.recruitName}
        </span>
      </motion.div>
    );
  }

  // Full mode for expanded view
  return (
    <motion.div
      className="px-3 py-2 bg-violet-500/10 border-l-4 border-violet-500 rounded cursor-pointer hover:bg-violet-500/15 transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-txt-primary truncate">
              {visit.recruitName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-txt-secondary">
                {visit.startTime} - {visit.endTime}
              </span>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${dotColor}`} />
      </div>

      {/* Host badge */}
      {visit.hostAthlete && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-txt-secondary">Host:</span>
          <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
            {visit.hostAthlete.firstName} {visit.hostAthlete.lastName}
          </span>
        </div>
      )}

      {/* Additional info on hover */}
      {visit.recruitSchool && (
        <div className="mt-1.5 text-xs text-txt-tertiary">
          {visit.recruitSchool}
          {visit.recruitGradYear && ` '${visit.recruitGradYear.toString().slice(-2)}`}
        </div>
      )}
    </motion.div>
  );
}
