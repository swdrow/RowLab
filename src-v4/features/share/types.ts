/**
 * Share card types for the share feature.
 */

export type CardType =
  | 'erg_summary'
  | 'erg_summary_alt'
  | 'erg_charts'
  | 'pr_celebration'
  | 'regatta_result'
  | 'regatta_summary'
  | 'season_recap'
  | 'team_leaderboard';

export type CardFormat = '1:1' | '9:16';

export interface ShareCardOptions {
  showAttribution?: boolean;
  teamColors?: boolean;
}

export interface GenerateRequest {
  workoutId: string;
  cardType: CardType;
  format: CardFormat;
  options?: ShareCardOptions;
  teamId?: string | null;
}

export interface ShareCard {
  id: string;
  url: string;
  cardType: CardType;
  format: CardFormat;
  metadata?: {
    athleteName?: string;
    workoutTitle?: string;
    description?: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface CardTemplate {
  type: CardType;
  label: string;
  description: string;
  requiresWorkout: boolean;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    type: 'erg_summary',
    label: 'Erg Summary',
    description: 'Clean summary with distance, time, pace, and watts',
    requiresWorkout: true,
  },
  {
    type: 'erg_summary_alt',
    label: 'Erg Summary Alt',
    description: 'Alternative layout with splits visualization',
    requiresWorkout: true,
  },
  {
    type: 'erg_charts',
    label: 'Erg Charts',
    description: 'Split-by-split charts and performance data',
    requiresWorkout: true,
  },
  {
    type: 'pr_celebration',
    label: 'PR Celebration',
    description: 'Celebrate a new personal record',
    requiresWorkout: true,
  },
];
