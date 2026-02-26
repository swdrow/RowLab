/**
 * Stat card for dashboard quick stats.
 * Renders values statically (no count-up animation per design spec).
 * Wraps Card with icon, label, value, footnote, and sparkline.
 */

import type { IconComponent } from '@/types/icons';
import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatNumber } from '@/lib/format';

interface StatCardProps {
  icon: IconComponent;
  label: string;
  value: number;
  formattedValue?: string;
  footnote?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  formattedValue,
  footnote,
  sparklineData,
  sparklineColor,
  className = '',
}: StatCardProps) {
  const displayValue = formattedValue ?? formatNumber(value);

  return (
    <Card padding="md" className={className} as="article" variant="interactive">
      <div className="flex flex-col gap-3" aria-label={`${label}: ${displayValue}`} role="group">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg bg-void-deep flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon width={20} height={20} className="text-accent-teal" />
        </div>

        {/* Label */}
        <span className="text-xs uppercase tracking-wider text-accent-sand font-medium">
          {label}
        </span>

        {/* Value (static display) */}
        <span className="text-2xl lg:text-3xl font-mono font-bold text-text-bright tabular-nums">
          {displayValue}
        </span>

        {/* Sparkline trend */}
        {sparklineData && sparklineData.length >= 2 ? (
          <Sparkline
            data={sparklineData}
            height={32}
            width={100}
            color={sparklineColor}
            className="mt-1"
          />
        ) : (
          <div className="h-8" />
        )}

        {/* Footnote */}
        {footnote && <span className="text-xs text-accent-ivory">{footnote}</span>}
      </div>
    </Card>
  );
}
