import React from 'react';

/**
 * MetricPreview - Shows sample performance metrics
 *
 * Demonstrates the "chromatic data" principle - metrics
 * have color while the surrounding UI is monochrome.
 */
export const MetricPreview: React.FC = () => {
  return (
    <div className="flex items-end justify-between gap-4 h-24 px-2">
      {/* Metric 1 - Erg split */}
      <div className="flex flex-col items-center">
        <span className="font-mono text-2xl font-semibold text-data-good tabular-nums">
          1:42.3
        </span>
        <span className="text-xs text-ink-secondary uppercase tracking-wide">
          Split
        </span>
      </div>

      {/* Metric 2 - Distance */}
      <div className="flex flex-col items-center">
        <span className="font-mono text-2xl font-semibold text-data-excellent tabular-nums">
          6,247
        </span>
        <span className="text-xs text-ink-secondary uppercase tracking-wide">
          Meters
        </span>
      </div>

      {/* Metric 3 - Stroke rate */}
      <div className="flex flex-col items-center">
        <span className="font-mono text-2xl font-semibold text-ink-primary tabular-nums">
          28
        </span>
        <span className="text-xs text-ink-secondary uppercase tracking-wide">
          S/M
        </span>
      </div>
    </div>
  );
};

export default MetricPreview;
