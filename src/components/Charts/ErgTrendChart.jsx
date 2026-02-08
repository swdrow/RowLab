/**
 * @deprecated V1 Legacy — replaced by V2/V3 erg data components.
 * See: src/v2/pages/ErgTestsPage.tsx, src/v2/components/erg/ErgProgressChart.tsx
 * Removal planned: Phase 36 (V1/V2 Cleanup)
 */
import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/**
 * ErgTrendChart - Line chart showing split times over time
 * Allows filtering by test type (2k, 6k, 500m, etc.)
 */
function ErgTrendChart({ ergTests = [], className = '' }) {
  const [selectedType, setSelectedType] = useState('all');

  // Get unique test types
  const testTypes = useMemo(() => {
    const types = new Set(ergTests.map((t) => t.testType));
    return ['all', ...Array.from(types).sort()];
  }, [ergTests]);

  // Filter and sort data
  const chartData = useMemo(() => {
    let filtered = [...ergTests];

    if (selectedType !== 'all') {
      filtered = filtered.filter((t) => t.testType === selectedType);
    }

    // Sort by date ascending
    filtered.sort((a, b) => new Date(a.testDate) - new Date(b.testDate));

    // Transform for chart
    return filtered.map((test) => {
      const split = test.splitSeconds || test.timeSeconds / (test.distanceM / 500);
      return {
        date: new Date(test.testDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: new Date(test.testDate).toLocaleDateString(),
        split: parseFloat(split.toFixed(1)),
        splitFormatted: formatSplit(split),
        testType: test.testType,
        watts: test.watts,
        strokeRate: test.strokeRate,
      };
    });
  }, [ergTests, selectedType]);

  // Format split time in M:SS.T format
  function formatSplit(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-void-elevated border border-white/10 rounded-lg p-3 shadow-lg">
        <p className="text-text-primary font-medium">{data.fullDate}</p>
        <p className="text-blade-blue font-mono text-lg">{data.splitFormatted}</p>
        <div className="text-xs text-text-muted mt-1 space-y-0.5">
          <p>Type: {data.testType}</p>
          {data.watts && <p>Power: {data.watts}W</p>}
          {data.strokeRate && <p>Rate: {data.strokeRate} SPM</p>}
        </div>
      </div>
    );
  };

  if (ergTests.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-text-muted ${className}`}>
        No erg test data to display
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {testTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all
              ${
                selectedType === type
                  ? 'bg-blade-blue/20 text-blade-blue border border-blade-blue/30'
                  : 'bg-void-elevated/50 text-text-muted border border-white/5 hover:border-white/10'
              }
            `}
          >
            {type === 'all' ? 'All Tests' : type}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickLine={false}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickLine={false}
              tickFormatter={formatSplit}
              reversed // Lower split = better, so reverse the axis
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="split"
              stroke="#0070f3"
              strokeWidth={2}
              dot={{
                fill: '#0070f3',
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                fill: '#0070f3',
                strokeWidth: 2,
                stroke: '#fff',
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted">
        <span>Lower is faster</span>
        <span className="w-1 h-1 bg-text-muted rounded-full" />
        <span>{chartData.length} tests</span>
      </div>
    </div>
  );
}

export default ErgTrendChart;
