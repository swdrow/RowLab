/**
 * SVG sparkline — oarbit design system.
 *
 * Area chart with smooth line and gradient fill.
 * Default color: accent (Regatta Gold).
 * Decorative only — marked aria-hidden.
 */

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** oklch color string. Defaults to Regatta Gold accent. */
  color?: string;
  id?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = 'oklch(0.71 0.16 65)',
  id = 'sparkline',
  className = '',
}: SparklineProps) {
  if (data.length < 2) return null;

  const padding = 2;
  const chartWidth = width;
  const chartHeight = height;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => ({
    x: padding + (i / (data.length - 1)) * innerWidth,
    y: padding + innerHeight - ((value - min) / range) * innerHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const lastPoint = points[points.length - 1]!;
  const firstPoint = points[0]!;
  const areaPath = `${linePath} L ${lastPoint.x} ${chartHeight} L ${firstPoint.x} ${chartHeight} Z`;

  const gradientId = `${id}-gradient`;

  return (
    <svg
      width={chartWidth}
      height={chartHeight}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
