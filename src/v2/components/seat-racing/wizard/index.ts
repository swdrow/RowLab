/**
 * Multi-step wizard components for seat race session creation (3-step flow)
 */

export { SessionWizard } from './SessionWizard';
export type { SessionWizardProps } from './SessionWizard';

export { StepIndicator } from './StepIndicator';
export type { StepIndicatorProps } from './StepIndicator';

export { SessionMetadataStep } from './SessionMetadataStep';
export { PiecesAndAthletesStep } from './PiecesAndAthletesStep';
export { SegmentedTimeInput, toSeconds, fromSeconds } from './SegmentedTimeInput';
export type { TimeSegments } from './SegmentedTimeInput';
export { BoatTimeEntry } from './BoatTimeEntry';
export { SeatSlotSelector } from './SeatSlotSelector';
export { ReviewStep } from './ReviewStep';
export { RankingsImpactPreview } from './RankingsImpactPreview';

// Legacy components (kept for backward compatibility, not used in 3-step wizard)
export { PieceManagerStep } from './PieceManagerStep';
export { AthleteAssignmentStep } from './AthleteAssignmentStep';

// Re-export wizard hooks and constants
export { useSessionWizard, WIZARD_STEPS } from '@/v2/hooks/useSessionWizard';
