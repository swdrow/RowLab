import { useMemo } from 'react';
import { ResponsiveContainer, Tooltip, YAxis, Area, AreaChart, type TooltipProps } from 'recharts';

// ─── Time Helpers ──────────────────────────────────────────────────

/**
 * Convert an erg time string (e.g., "7:12.3" or "6:45.0") to total seconds.
 */
function timeToSeconds(time: string): number {
  // Handle MM:SS.s format
  const match = time.match(/^(\d+):(\d{2})\.?(\d*)?$/);
  if (!match || !match[1] || !match[2]) return 0;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const tenths = match[3] ? parseInt(match[3].padEnd(1, '0'), 10) / 10 : 0;
  return minutes * 60 + seconds + tenths;
}

// ─── Custom Tooltip ────────────────────────────────────────────────
interface SparklineDataPoint {
  date: string;
  seconds: number;
  displayTime: string;
  testType: string;
}

function SparklineTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0 || !payload[0]) return null;
  const data = payload[0].payload as SparklineDataPoint;

  return (
    <div className="bg-bg-elevated border border-bdr-default rounded-md px-2.5 py-1.5 shadow-lg">
      <span
        className="font-mono text-sm font-semibold text-txt-primary block"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {data.displayTime}
      </span>
      <span className="text-[10px] text-txt-tertiary">
        {data.testType} &middot;{' '}
        {new Date(data.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </div>
  );
}

// ─── ErgSparkline Component ────────────────────────────────────────
export interface ErgSparklineProps {
  ergTests: Array<{ testDate: string; time: string; testType: string }>;
}

export function ErgSparkline({ ergTests }: ErgSparklineProps) {
  const chartData = useMemo(() => {
    if (!ergTests || ergTests.length === 0) return [];

    // Filter to last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return ergTests
      .filter((test) => new Date(test.testDate) >= threeMonthsAgo)
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
      .map((test) => ({
        date: test.testDate,
        seconds: timeToSeconds(test.time),
        displayTime: test.time,
        testType: test.testType,
      }));
  }, [ergTests]);

  // Empty state: fewer than 2 data points
  if (chartData.length < 2) {
    return (
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-txt-secondary uppercase tracking-wider">
          Erg History
        </h4>
        <div className="h-[80px] flex items-center justify-center border border-dashed border-bdr-subtle rounded-lg">
          <span className="text-xs text-txt-tertiary">No erg data</span>
        </div>
      </div>
    );
  }

  // Compute Y-axis domain with padding (inverted: lower is better = top)
  const times = chartData.map((d) => d.seconds);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const padding = (maxTime - minTime) * 0.15 || 5;

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium text-txt-secondary uppercase tracking-wider">
        Erg History
      </h4>
      <div className="h-[80px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="ergSparklineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-interactive-primary, #6366f1)"
                  stopOpacity={0.15}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-interactive-primary, #6366f1)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            {/* Inverted Y-axis: lower times (faster) at top */}
            <YAxis domain={[minTime - padding, maxTime + padding]} reversed hide />
            <Tooltip content={<SparklineTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="seconds"
              stroke="var(--color-interactive-primary, #6366f1)"
              strokeWidth={2}
              fill="url(#ergSparklineGradient)"
              dot={false}
              activeDot={{
                r: 3,
                fill: 'var(--color-interactive-primary, #6366f1)',
                stroke: 'var(--color-bg-surface, #1a1a2e)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ErgSparkline;
