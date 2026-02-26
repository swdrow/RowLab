/**
 * Profile feature types.
 * Interfaces for profile data, trends, PRs, and achievements.
 */

// Re-export StatsData from dashboard for profile hero headline stats
export type { StatsData } from '@/features/dashboard/types';

export interface ProfileData {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  teams: Array<{ teamId: string; teamName: string; role: string }>;
  integrations: {
    concept2: {
      connected: boolean;
      username: string | null;
      lastSyncedAt: string | null;
      syncEnabled: boolean;
    } | null;
  };
  createdAt: string;
}

export interface TrendBucket {
  week: string; // 'YYYY-Www'
  meters: number;
  workouts: number;
  durationSeconds: number;
  byType: Record<string, number>;
}

export interface TrendData {
  buckets: TrendBucket[];
}

export interface PRRecord {
  testType: string;
  bestTime: number | null; // tenths of seconds
  bestDate: string | null;
  avgWatts: number | null;
  previousBest: number | null;
  improvement: number | null;
  recentAttempts: Array<{ time: number; date: string }>;
}

export interface PRsByMachine {
  byMachine: {
    rower: PRRecord[];
    skierg: PRRecord[];
    bikerg: PRRecord[];
  };
  records: PRRecord[]; // backward-compat flat array
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'distance' | 'consistency' | 'count' | 'variety';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementData {
  achievements: Achievement[];
  summary: { total: number; unlocked: number };
}

/** Valid profile tab identifiers */
export type ProfileTab = 'overview' | 'training-log' | 'prs' | 'achievements' | 'analytics';
