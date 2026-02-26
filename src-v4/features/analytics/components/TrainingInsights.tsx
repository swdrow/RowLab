/**
 * TrainingInsights -- inline insight banners rendered below volume trends.
 *
 * Data-gated: requires 42+ days of training data to show real insights.
 * Shows a placeholder message when insufficient data is available.
 * Each insight renders as a colored banner (positive/caution/warning)
 * with uniform entrance animation.
 */

import { motion } from 'motion/react';
import { IconTrendingUp, IconAlertTriangle, IconAlertOctagon, IconInfo } from '@/components/icons';
import { SPRING_SMOOTH } from '@/lib/animations';
import type { InsightItem } from '../types';

interface TrainingInsightsProps {
  insights: InsightItem[];
  daysWithData: number;
  isReliable: boolean; // daysWithData >= 42
}

/* ------------------------------------------------------------------ */
/* Insight icon mapping                                                */
/* ------------------------------------------------------------------ */

const INSIGHT_ICONS: Record<InsightItem['type'], React.ComponentType<{ className?: string }>> = {
  positive: IconTrendingUp,
  caution: IconAlertTriangle,
  warning: IconAlertOctagon,
};

const INSIGHT_STYLES: Record<InsightItem['type'], { border: string; icon: string; bg: string }> = {
  positive: {
    border: 'border-l-data-good',
    icon: 'text-data-good',
    bg: 'bg-data-good/5',
  },
  caution: {
    border: 'border-l-data-warning',
    icon: 'text-data-warning',
    bg: 'bg-data-warning/5',
  },
  warning: {
    border: 'border-l-data-poor',
    icon: 'text-data-poor',
    bg: 'bg-data-poor/5',
  },
};

/* ------------------------------------------------------------------ */
/* InsightBanner                                                       */
/* ------------------------------------------------------------------ */

function InsightBanner({ insight }: { insight: InsightItem }) {
  const style = INSIGHT_STYLES[insight.type];
  const Icon = INSIGHT_ICONS[insight.type];

  return (
    <div
      className={`
        flex items-start gap-3 rounded-xl border border-edge-default ${style.border} border-l-2
        ${style.bg} px-4 py-3
      `}
    >
      <Icon className={`w-4 h-4 ${style.icon} mt-0.5 shrink-0`} />
      <p className="text-sm text-text-dim leading-relaxed">{insight.message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Placeholder (insufficient data)                                     */
/* ------------------------------------------------------------------ */

function InsightsPlaceholder({ daysWithData }: { daysWithData: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SMOOTH}
      className="rounded-xl border border-edge-default bg-void-raised px-4 py-4 flex items-start gap-3"
    >
      <IconInfo className="w-4 h-4 text-text-faint mt-0.5 shrink-0" />
      <div>
        <p className="text-sm text-text-dim">
          Analytics insights need ~6 weeks of training data to provide meaningful recommendations.
          You have {daysWithData} day{daysWithData !== 1 ? 's' : ''} so far -- keep logging
          workouts!
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* TrainingInsights                                                     */
/* ------------------------------------------------------------------ */

export function TrainingInsights({ insights, daysWithData, isReliable }: TrainingInsightsProps) {
  if (!isReliable) {
    return (
      <div>
        <h3 className="text-sm font-display font-semibold text-text-bright mb-3">
          Training Insights
        </h3>
        <InsightsPlaceholder daysWithData={daysWithData} />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-display font-semibold text-text-bright mb-3">
        Training Insights
      </h3>

      {insights.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SMOOTH}
          className="rounded-xl border border-edge-default bg-void-raised px-4 py-3 flex items-start gap-3"
        >
          <IconInfo className="w-4 h-4 text-text-faint mt-0.5 shrink-0" />
          <p className="text-sm text-text-dim">
            No notable training patterns detected. Keep training consistently!
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-2"
        >
          {insights.map((insight, i) => (
            <InsightBanner key={`${insight.type}-${i}`} insight={insight} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
