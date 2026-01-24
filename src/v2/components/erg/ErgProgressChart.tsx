import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from 'recharts';
import type { ErgTest, TestType } from '@v2/types/ergTests';

interface ErgProgressChartProps {
  tests: ErgTest[];
  testType?: TestType;
  height?: number;
  showTrendLine?: boolean;
  className?: string;
}

/**
 * Format time in seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(0);
  return `${mins}:${secs.padStart(2, '0')}`;
}

/**
 * Format date for X-axis based on date range
 */
function formatDate(dateString: string, isLongRange: boolean): string {
  const date = new Date(dateString);
  if (isLongRange) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Determine if date range is more than 90 days
 */
function isLongDateRange(tests: ErgTest[]): boolean {
  if (tests.length < 2) return false;
  const dates = tests.map(t => new Date(t.testDate).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  return diffDays > 90;
}

/**
 * Test type colors for chart lines
 */
const testTypeColors: Record<TestType, string> = {
  '2k': '#f43f5e',    // rose-500
  '6k': '#3b82f6',    // blue-500
  '30min': '#22c55e', // green-500
  '500m': '#f59e0b',  // amber-500
};

/**
 * Custom tooltip showing test details
 */
function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload as ErgTest;

  return (
    <div className="bg-bg-surface-elevated border border-bdr-default rounded-lg shadow-elevated p-3">
      <div className="text-xs text-txt-tertiary mb-2">
        {new Date(data.testDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-txt-secondary">Time</span>
          <span className="text-sm font-mono font-semibold text-txt-primary">
            {formatTime(data.timeSeconds)}
          </span>
        </div>
        {data.splitSeconds && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-txt-secondary">Split</span>
            <span className="text-sm font-mono text-txt-primary">
              {formatTime(data.splitSeconds)}
            </span>
          </div>
        )}
        {data.watts && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-txt-secondary">Watts</span>
            <span className="text-sm font-mono text-txt-primary">
              {Math.round(data.watts)}W
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Line chart showing erg test progress over time
 */
export function ErgProgressChart({
  tests,
  testType,
  height = 300,
  showTrendLine = false,
  className = ''
}: ErgProgressChartProps) {
  // Filter by test type if specified
  const filteredTests = testType
    ? tests.filter(t => t.testType === testType)
    : tests;

  // Sort by date ascending
  const sortedTests = [...filteredTests].sort(
    (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
  );

  if (sortedTests.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-bg-surface rounded-lg border border-bdr-subtle ${className}`}
        style={{ height }}
      >
        <p className="text-txt-tertiary text-sm">No tests to display</p>
      </div>
    );
  }

  const isLongRange = isLongDateRange(sortedTests);

  // Group tests by type if showing multiple types
  const testsByType = sortedTests.reduce((acc, test) => {
    if (!acc[test.testType]) {
      acc[test.testType] = [];
    }
    acc[test.testType].push(test);
    return acc;
  }, {} as Record<string, ErgTest[]>);

  return (
    <div className={`bg-bg-surface rounded-lg border border-bdr-subtle p-4 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="testDate"
            type="category"
            allowDuplicatedCategory={false}
            tickFormatter={(date) => formatDate(date, isLongRange)}
            stroke="#71717A"
            tick={{ fill: '#71717A', fontSize: 12 }}
            tickLine={{ stroke: '#71717A' }}
          />
          <YAxis
            tickFormatter={formatTime}
            stroke="#71717A"
            tick={{ fill: '#71717A', fontSize: 12 }}
            tickLine={{ stroke: '#71717A' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          {Object.keys(testsByType).length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => (
                <span className="text-sm text-txt-secondary">{value}</span>
              )}
            />
          )}

          {/* Render a line for each test type */}
          {Object.entries(testsByType).map(([type, typeTests]) => (
            <Line
              key={type}
              data={typeTests}
              type="monotone"
              dataKey="timeSeconds"
              name={type}
              stroke={testTypeColors[type as TestType]}
              strokeWidth={2}
              dot={{
                fill: testTypeColors[type as TestType],
                r: 4,
                strokeWidth: 0
              }}
              activeDot={{
                r: 6,
                fill: testTypeColors[type as TestType],
                strokeWidth: 2,
                stroke: '#fff'
              }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ErgProgressChart;
