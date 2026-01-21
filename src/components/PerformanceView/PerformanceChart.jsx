import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * SKELETON COMPONENT - Performance trend chart
 * Status: Ready for data integration
 *
 * Displays performance trends over time using Recharts
 * Currently shows placeholder when no data
 */
const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Group by test type for separate lines
  const testTypes = [...new Set(data.map(d => d.testType))];

  // Format data for charting
  const chartData = data.map(test => ({
    date: test.date,
    testType: test.testType,
    // Convert result time to seconds for plotting
    seconds: parseTimeToSeconds(test.result),
    watts: test.watts
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Performance Trends</h3>

      {/* Watts over time */}
      <div className="bg-void-elevated p-4 rounded-lg mb-4">
        <h4 className="text-sm font-medium text-text-secondary mb-2">Power Output (Watts)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="watts"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Note about future enhancements */}
      <div className="text-xs text-text-muted italic">
        Chart displays power output trends. Additional visualizations available once full dataset is loaded.
      </div>
    </div>
  );
};

/**
 * Helper: Convert time string (MM:SS.s) to total seconds
 */
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;

  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  return parseFloat(timeStr);
};

export default PerformanceChart;
