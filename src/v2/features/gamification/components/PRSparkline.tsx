import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useResultTrend } from '../../../hooks/usePersonalRecords';

interface PRSparklineProps {
  athleteId: string;
  testType: string;
  width?: number;
  height?: number;
}

/**
 * Sparkline showing last 5 results trend using recharts
 * Per RESEARCH.md: Simple sparkline with color-coded improvement
 */
export function PRSparkline({ athleteId, testType, width = 80, height = 24 }: PRSparklineProps) {
  const { data: trend, isLoading } = useResultTrend(athleteId, testType, 5);

  if (isLoading || !trend || trend.length < 2) {
    return <div style={{ width, height }} className="bg-surface-elevated rounded animate-pulse" />;
  }

  // Transform data for recharts
  const data = trend.map((t, i) => ({
    index: i,
    result: t.result,
  }));

  // Determine trend direction (lower is better for time)
  const first = data[0]?.result || 0;
  const last = data[data.length - 1]?.result || 0;
  const isImproving = last < first;
  const strokeColor = isImproving ? '#10b981' : '#ef4444'; // green for improvement, red for regression

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="result"
          stroke={strokeColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PRSparkline;
