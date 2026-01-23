import { useMemo } from 'react';
import { useActivityFeed } from './useActivityFeed';
import type { DeduplicatedActivity } from '../types/dashboard';

/**
 * Headline types ordered roughly by priority
 */
export type HeadlineType =
  | 'pb-achieved'
  | 'streak-celebration'
  | 'workout-due'
  | 'goal-progress'
  | 'rest-day-reminder'
  | 'welcome-back';

export interface Headline {
  type: HeadlineType;
  title: string;
  subtitle?: string;
  cta?: {
    label: string;
    href: string;
  };
  priority: number;
}

/**
 * Check if date is within N days ago
 */
function isWithinDays(date: string | Date, days: number): boolean {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Count consecutive days with activities (streak)
 */
function calculateStreak(activities: DeduplicatedActivity[]): number {
  if (activities.length === 0) return 0;

  // Sort by date descending
  const sorted = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get unique dates (ignore time)
  const dates = new Set(
    sorted.map(a => new Date(a.date).toISOString().split('T')[0])
  );
  const sortedDates = Array.from(dates).sort().reverse();

  if (sortedDates.length === 0) return 0;

  // Check if most recent date is today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const curr = new Date(sortedDates[i]);
    const prev = new Date(sortedDates[i - 1]);
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Days since last workout
 */
function daysSinceLastWorkout(activities: DeduplicatedActivity[]): number {
  if (activities.length === 0) return Infinity;

  const sorted = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lastDate = new Date(sorted[0].date);
  const now = new Date();
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get time of day greeting
 */
function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Check for recent personal best (simplified - checks for any notable recent distance)
 * In production, this would compare against actual PB records
 */
function checkRecentPB(activities: DeduplicatedActivity[]): { achieved: boolean; metric?: string; value?: string } {
  const recentRowing = activities.filter(
    a => isWithinDays(a.date, 7) &&
         (a.activityType?.toLowerCase().includes('row') ||
          a.activityType?.toLowerCase().includes('erg'))
  );

  // Look for 2k or longer pieces
  for (const activity of recentRowing) {
    const distance = activity.data?.distanceM || activity.data?.distance;
    if (distance && distance >= 2000) {
      // For now, just acknowledge long pieces as potential PBs
      // Real implementation would compare against historical PBs
      const duration = activity.data?.durationSeconds;
      if (duration) {
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        return {
          achieved: false, // Would be true if actually beat a PB
          metric: '2k',
          value: `${mins}:${secs.toString().padStart(2, '0')}`,
        };
      }
    }
  }

  return { achieved: false };
}

/**
 * Generate headline candidates based on heuristics
 */
function generateCandidates(activities: DeduplicatedActivity[]): Headline[] {
  const candidates: Headline[] = [];

  // Heuristic 1: Celebrate recent PB (highest priority)
  const pbCheck = checkRecentPB(activities);
  if (pbCheck.achieved) {
    candidates.push({
      type: 'pb-achieved',
      title: `New PR: ${pbCheck.metric} - ${pbCheck.value}!`,
      subtitle: 'Your hard work is paying off.',
      cta: { label: 'View details', href: '/beta/progress' },
      priority: 100,
    });
  }

  // Heuristic 2: Workout streak (5+ days)
  const streak = calculateStreak(activities);
  if (streak >= 5) {
    candidates.push({
      type: 'streak-celebration',
      title: `${streak} day streak!`,
      subtitle: 'Keep the momentum going.',
      priority: 80,
    });
  } else if (streak >= 3) {
    candidates.push({
      type: 'streak-celebration',
      title: `${streak} days strong`,
      subtitle: "You're building consistency.",
      priority: 60,
    });
  }

  // Heuristic 3: Rest day reminder (3+ days without workout)
  const daysSince = daysSinceLastWorkout(activities);
  if (daysSince >= 3 && daysSince < 7) {
    candidates.push({
      type: 'rest-day-reminder',
      title: 'Taking a rest?',
      subtitle: 'Recovery is part of the process. Ready when you are.',
      priority: 40,
    });
  } else if (daysSince >= 7) {
    candidates.push({
      type: 'welcome-back',
      title: 'Welcome back!',
      subtitle: "It's been a while. Let's get back on the water.",
      cta: { label: 'Plan a workout', href: '/beta/workouts' },
      priority: 50,
    });
  }

  // Heuristic 4: Goal progress (placeholder - would need goals data)
  // candidates.push({ type: 'goal-progress', ... })

  // Default: Time-based greeting
  candidates.push({
    type: 'welcome-back',
    title: getTimeOfDayGreeting(),
    subtitle: 'Ready to make some waves?',
    priority: 10,
  });

  return candidates;
}

/**
 * Hook for adaptive headline based on user activity data
 *
 * Returns highest priority headline from heuristic candidates.
 * Recalculates when activity data changes.
 */
export function useAdaptiveHeadline() {
  const { data: activityData, isLoading, error } = useActivityFeed({ limit: 30 });

  const headline = useMemo(() => {
    if (!activityData?.activities) {
      return {
        type: 'welcome-back' as HeadlineType,
        title: getTimeOfDayGreeting(),
        subtitle: 'Ready to make some waves?',
        priority: 10,
      };
    }

    const candidates = generateCandidates(activityData.activities);
    return candidates.sort((a, b) => b.priority - a.priority)[0];
  }, [activityData?.activities]);

  return {
    headline,
    isLoading,
    error,
  };
}
