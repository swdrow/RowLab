/**
 * DataSufficiencyBanner -- inline warning when training history is too sparse.
 *
 * Shows when daysWithData < daysNeeded (default 42 = 6 weeks).
 * Glass card with amber tint and progress indicator.
 */

import { IconInfo } from '@/components/icons';

interface DataSufficiencyBannerProps {
  message?: string;
  daysWithData: number;
  daysNeeded?: number;
}

export function DataSufficiencyBanner({
  message,
  daysWithData,
  daysNeeded = 42,
}: DataSufficiencyBannerProps) {
  if (daysWithData >= daysNeeded) return null;

  const pct = Math.min(100, Math.round((daysWithData / daysNeeded) * 100));

  return (
    <div className="rounded-xl border border-data-warning/20 bg-data-warning/5 px-4 py-3 flex items-start gap-3">
      <IconInfo className="w-4 h-4 text-data-warning mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-dim">
          {message ??
            'More training data will improve the accuracy of your fitness and fatigue curves.'}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-edge-default overflow-hidden">
            <div
              className="h-full rounded-full bg-data-warning transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-text-faint shrink-0">
            {daysWithData}/{daysNeeded} days
          </span>
        </div>
      </div>
    </div>
  );
}
