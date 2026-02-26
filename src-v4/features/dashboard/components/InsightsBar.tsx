/**
 * Smart insights bar — contextual messages between profile card and feed.
 * Computes insights client-side from dashboard stats data.
 * Shows at most 2 insights to avoid clutter.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  IconAlertTriangle,
  IconTarget,
  IconTrendingUp,
  IconFlame,
  IconZap,
} from '@/components/icons';
import type { IconComponent } from '@/types/icons';
import { slideUp } from '@/lib/animations';
import { formatNumber } from '@/lib/format';
import type { StatsData, PRRecord } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Insight {
  id: string;
  icon: IconComponent;
  message: string;
  tone: 'warning' | 'info' | 'success';
}

const TONE_STYLES: Record<Insight['tone'], { bg: string; text: string; icon: string }> = {
  warning: {
    bg: 'bg-data-warning/8',
    text: 'text-data-warning',
    icon: 'text-data-warning',
  },
  info: {
    bg: 'bg-data-good/8',
    text: 'text-text-dim',
    icon: 'text-data-good',
  },
  success: {
    bg: 'bg-data-excellent/8',
    text: 'text-data-excellent',
    icon: 'text-data-excellent',
  },
};

/* ------------------------------------------------------------------ */
/* Insight computation                                                 */
/* ------------------------------------------------------------------ */

function computeInsights(stats: StatsData, prs: PRRecord[]): Insight[] {
  const insights: Insight[] = [];
  const { streak, range } = stats;

  // 1. Streak at risk
  if (streak.current > 0 && streak.current >= 3) {
    // If they have a good streak going, encourage them
    insights.push({
      id: 'streak-going',
      icon: IconFlame,
      message: `${streak.current}-day streak going strong! Keep it up.`,
      tone: 'success',
    });
  } else if (streak.current === 0 && streak.longest > 3) {
    insights.push({
      id: 'streak-lost',
      icon: IconAlertTriangle,
      message: `Streak ended. Your best was ${streak.longest} days — time to start a new one.`,
      tone: 'warning',
    });
  }

  // 2. Weekly distance goal insight
  const weeklyGoal = 40000; // 40km default target
  if (range.period === '7d' && range.meters > 0) {
    const pct = range.meters / weeklyGoal;
    if (pct < 0.5) {
      const remaining = weeklyGoal - range.meters;
      insights.push({
        id: 'weekly-goal',
        icon: IconTarget,
        message: `${formatNumber(remaining)}m from weekly target. You've got this.`,
        tone: 'warning',
      });
    } else if (pct >= 1.0) {
      insights.push({
        id: 'weekly-goal-met',
        icon: IconTarget,
        message: `Weekly target exceeded — ${formatNumber(range.meters)}m logged.`,
        tone: 'success',
      });
    }
  }

  // 3. Recent PR celebration
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentPRs = prs.filter(
    (pr) => pr.bestDate && new Date(pr.bestDate).getTime() > sevenDaysAgo
  );
  const topPR = recentPRs[0];
  if (topPR) {
    insights.push({
      id: 'recent-pr',
      icon: IconZap,
      message: `New ${topPR.testType} PR! ${topPR.improvement ? `${(topPR.improvement / 10).toFixed(1)}s improvement.` : 'Congratulations!'}`,
      tone: 'success',
    });
  }

  // 4. Volume trend
  if (range.workouts >= 3 && insights.length < 2) {
    insights.push({
      id: 'volume',
      icon: IconTrendingUp,
      message: `${range.workouts} workouts this period — ${formatNumber(range.meters)}m total.`,
      tone: 'info',
    });
  }

  return insights.slice(0, 2);
}

/* ------------------------------------------------------------------ */
/* InsightsBar                                                         */
/* ------------------------------------------------------------------ */

interface InsightsBarProps {
  stats: StatsData;
  prs: PRRecord[];
}

export function InsightsBar({ stats, prs }: InsightsBarProps) {
  const insights = useMemo(() => computeInsights(stats, prs), [stats, prs]);

  if (insights.length === 0) return null;

  return (
    <motion.div {...slideUp} className="flex flex-col gap-2">
      {insights.map((insight) => {
        const style = TONE_STYLES[insight.tone];
        const Icon = insight.icon;
        return (
          <div
            key={insight.id}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg ${style.bg}`}
          >
            <Icon width={16} height={16} className={style.icon} />
            <span className={`text-sm ${style.text}`}>{insight.message}</span>
          </div>
        );
      })}
    </motion.div>
  );
}
