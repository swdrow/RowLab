import { Timer, Plus, TrendingUp } from 'lucide-react';
import { EmptyState } from '@v2/components/common/EmptyState';

/**
 * SeatRacingEmptyState - Display when no seat racing sessions exist
 *
 * Shows helpful CTA to start first seat race.
 */
export interface SeatRacingEmptyStateProps {
  /** Handler for Start Seat Race button */
  onStartSeatRace?: () => void;
}

export const SeatRacingEmptyState: React.FC<SeatRacingEmptyStateProps> = ({
  onStartSeatRace,
}) => (
  <EmptyState
    icon={Timer}
    title="No seat racing sessions"
    description="Start your first seat race to compare athletes head-to-head and build accurate ELO rankings."
    action={
      onStartSeatRace
        ? { label: 'Start Seat Race', onClick: onStartSeatRace, icon: Plus }
        : undefined
    }
  />
);

/**
 * RankingsEmptyState - Display when no rankings data is available
 *
 * Guides user to run seat races to generate rankings.
 */
export interface RankingsEmptyStateProps {
  /** Handler to navigate to sessions or start a race */
  onStartSeatRace?: () => void;
}

export const RankingsEmptyState: React.FC<RankingsEmptyStateProps> = ({
  onStartSeatRace,
}) => (
  <EmptyState
    icon={TrendingUp}
    title="No rankings yet"
    description="Run seat races to generate ELO rankings. Rankings update automatically after each session."
    action={
      onStartSeatRace
        ? { label: 'Run Seat Race', onClick: onStartSeatRace, icon: Timer }
        : undefined
    }
  />
);
