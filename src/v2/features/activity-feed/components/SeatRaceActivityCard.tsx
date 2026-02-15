// src/v2/features/activity-feed/components/SeatRaceActivityCard.tsx
// Typed activity card for seat race results

import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';
import { ArrowsLeftRight, TrendUp, TrendDown } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { SeatRaceActivity } from '../../../types/activity';

// ============================================
// COMPONENT
// ============================================

interface SeatRaceActivityCardProps {
  activity: SeatRaceActivity;
}

export function SeatRaceActivityCard({ activity }: SeatRaceActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/app/seat-racing');
  };

  const { ratingChange, newRating } = activity.metadata;

  const hasRatingChange = ratingChange !== undefined && ratingChange !== null;
  const isPositive = hasRatingChange && ratingChange > 0;
  const isNegative = hasRatingChange && ratingChange < 0;

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -1 }}
      className="bg-surface-elevated/80 backdrop-blur-sm rounded-lg border border-bdr-default p-4 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer group group-hover:scale-[1.01]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
          <ArrowsLeftRight className="w-5 h-5 text-chart-2" weight="duotone" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-txt-primary truncate">Seat Race</h3>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Metadata: Rating Change */}
          <div className="flex items-center gap-3 mt-1 text-sm">
            {hasRatingChange ? (
              <>
                <span
                  className={`font-medium ${
                    isPositive ? 'text-data-excellent' : isNegative ? 'text-data-poor' : 'text-txt-muted'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {ratingChange} rating
                </span>
                {newRating !== undefined && (
                  <span className="text-txt-muted">New: {newRating}</span>
                )}
              </>
            ) : (
              <span className="text-txt-muted">Rating updated</span>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-txt-subtle mt-1">
            {formatDistance(new Date(activity.date), new Date(), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Rating Change Badge */}
        {hasRatingChange && (
          <div
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md ${
              isPositive
                ? 'bg-data-excellent/10 text-data-excellent border border-data-excellent/20'
                : isNegative
                  ? 'bg-data-poor/10 text-data-poor border border-data-poor/20'
                  : 'bg-gray-400/10 text-gray-400 border border-gray-400/20'
            }`}
          >
            {isPositive ? (
              <TrendUp className="w-4 h-4" weight="bold" />
            ) : isNegative ? (
              <TrendDown className="w-4 h-4" weight="bold" />
            ) : null}
            <span className="text-xs font-semibold">
              {isPositive ? '+' : ''}
              {ratingChange}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
