import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getConfidenceLevel } from '@v2/types/seatRacing';
import type { RatingWithAthlete } from '@v2/types/seatRacing';

export interface RankingsChartProps {
  ratings: RatingWithAthlete[];
  maxAthletes?: number;
}

/**
 * Custom tooltip showing full athlete details
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-bg-surface border border-bdr-default rounded-lg p-3 shadow-lg">
      <p className="font-medium text-txt-primary mb-1">{data.name}</p>
      <div className="text-sm text-txt-secondary space-y-1">
        <p>
          Rating: <span className="font-mono text-txt-primary">{Math.round(data.rating)}</span>
        </p>
        <p>
          Confidence:{' '}
          <span className="text-txt-primary">{getConfidenceLevel(data.confidence)}</span>
        </p>
        <p>
          Pieces: <span className="text-txt-primary">{data.racesCount}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Horizontal bar chart showing athlete ELO distribution
 */
export function RankingsChart({ ratings, maxAthletes = 10 }: RankingsChartProps) {
  // Resolve CSS variable colors for recharts (needs hex strings)
  const chartColors = useMemo(
    () => ({
      bar:
        getComputedStyle(document.documentElement).getPropertyValue('--data-good').trim() ||
        '#3B82F6',
      axis:
        getComputedStyle(document.documentElement).getPropertyValue('--ink-secondary').trim() ||
        '#888',
      text:
        getComputedStyle(document.documentElement).getPropertyValue('--ink-body').trim() || '#ccc',
    }),
    []
  );

  // Sort by rating descending and limit to maxAthletes
  const chartData = useMemo(() => {
    const sorted = [...ratings].sort((a, b) => b.ratingValue - a.ratingValue).slice(0, maxAthletes);

    return sorted.map((r) => ({
      name: `${r.athlete.firstName} ${r.athlete.lastName}`,
      rating: r.ratingValue,
      confidence: r.confidenceScore || 0,
      racesCount: r.racesCount,
    }));
  }, [ratings, maxAthletes]);

  // Calculate bar opacity based on confidence (0.3 base + confidence * 0.7)
  const getBarOpacity = (confidence: number) => {
    return 0.3 + confidence * 0.7;
  };

  if (ratings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-txt-secondary bg-bg-surface rounded-lg border border-bdr-default">
        No rating data available
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-lg border border-bdr-default p-4">
      <h3 className="text-lg font-semibold text-txt-primary mb-4">
        Top {Math.min(maxAthletes, ratings.length)} Athletes
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis
            type="number"
            domain={[800, 1200]}
            stroke={chartColors.axis}
            tick={{ fill: chartColors.axis, fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={chartColors.axis}
            tick={{ fill: chartColors.text, fontSize: 12 }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
          <Bar dataKey="rating" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={chartColors.bar}
                fillOpacity={getBarOpacity(entry.confidence)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-txt-tertiary mt-2 text-center">
        Bar opacity indicates confidence level (darker = higher confidence)
      </p>
    </div>
  );
}
