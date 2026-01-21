import { clsx } from 'clsx';

/**
 * DataStreamTicker - Infinite horizontal scroll of rowing metrics
 * Vercel-style edge fading
 */
export function DataStreamTicker({ className }) {
  const metrics = [
    { label: 'Split', value: '1:42.5', highlight: true },
    { label: 'Stroke Rate', value: '34', unit: 'spm' },
    { label: '2K Erg', value: '6:02.4' },
    { label: 'Watts', value: '428', highlight: true },
    { label: 'Drive Ratio', value: '2.1:1' },
    { label: 'Distance', value: '6,420', unit: 'm' },
    { label: 'Heart Rate', value: '172', unit: 'bpm' },
    { label: 'Calories', value: '892', unit: 'kcal' },
  ];

  // Duplicate for seamless loop
  const items = [...metrics, ...metrics];

  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden py-8',
        // Vercel-style edge masks
        '[mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]',
        className
      )}
    >
      <div className="flex w-max animate-scroll-left hover:[animation-play-state:paused]">
        {items.map((metric, i) => (
          <div
            key={`${metric.label}-${i}`}
            className="flex items-center gap-8 px-8 border-r border-white/[0.06] last:border-r-0"
          >
            {/* Label */}
            <span className="font-mono text-[11px] font-medium tracking-widest uppercase text-text-muted">
              {metric.label}
            </span>

            {/* Value */}
            <div className="flex items-baseline gap-1">
              <span
                className={clsx(
                  'font-mono text-3xl font-semibold tabular-nums',
                  metric.highlight
                    ? 'text-blade-blue'
                    : 'text-text-primary'
                )}
              >
                {metric.value}
              </span>
              {metric.unit && (
                <span className="font-mono text-sm text-text-muted">
                  {metric.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add keyframes via style tag (or put in App.css) */}
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-left {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default DataStreamTicker;
