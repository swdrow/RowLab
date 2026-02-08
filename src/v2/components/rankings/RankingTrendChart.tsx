import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export type RankingTrendChartProps = {
  data: Array<{ date: string; speed: number }>;
  width?: number;
  height?: number;
};

/**
 * Inline sparkline chart showing speed trend over time
 * Similar to Phase 31 ELO sparkline pattern
 */
export function RankingTrendChart({ data, width = 80, height = 32 }: RankingTrendChartProps) {
  // Return nothing if no data
  if (!data || data.length === 0) {
    return <span className="text-xs text-txt-tertiary">—</span>;
  }

  // Calculate min/max for Y-axis domain
  const speeds = data.map((d) => d.speed);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const padding = (maxSpeed - minSpeed) * 0.1; // 10% padding

  return (
    <div style={{ width, height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[minSpeed - padding, maxSpeed + padding]} hide />
          <Area
            type="monotone"
            dataKey="speed"
            stroke="rgb(34, 197, 94)"
            strokeWidth={1.5}
            fill="url(#speedGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
