/**
 * ThisWeekStats — sidebar card showing this week's stats.
 */
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatDistance } from '@/lib/format';
import type { StatsData } from '../types';

interface ThisWeekStatsProps {
  stats: StatsData;
}

export function ThisWeekStats({ stats }: ThisWeekStatsProps) {
  const { range } = stats;

  return (
    <Card padding="md">
      <SectionHeader title="This Week" />
      <div className="space-y-3">
        <MetricRow label="Distance" value={formatDistance(range.meters)} />
        <MetricRow label="Sessions" value={String(range.workouts)} />
        <MetricRow label="Active Days" value={String(range.activeDays)} />
      </div>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-dim">{label}</span>
      <span className="font-mono text-sm font-bold text-text-bright">{value}</span>
    </div>
  );
}
