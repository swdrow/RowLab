import { useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

interface FieldLinesProps {
  /** Number of flow lines */
  count?: number;
  /** Line color (CSS color value) */
  color?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Direction of flow */
  direction?: 'horizontal' | 'vertical';
  /** Additional CSS classes */
  className?: string;
}

/**
 * FieldLines - Data flow visualization lines
 * Uses SVG paths with CSS stroke-dashoffset animation
 * Horizontal orientation evokes water/boat metaphor
 */
export function FieldLines({
  count = 5,
  color = 'rgba(0, 112, 243, 0.05)',
  duration = 12,
  direction = 'horizontal',
  className = '',
}: FieldLinesProps) {
  const shouldReduceMotion = useReducedMotion();

  // Generate sine-wave-like paths
  const paths = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const offset = (i / count) * 100;
      const amplitude = 15 + Math.random() * 10;
      const frequency = 2 + Math.random();

      if (direction === 'horizontal') {
        // Horizontal flowing lines (like water currents)
        const y = 20 + (i * 60) / count + '%';
        return {
          d: `M -100 ${offset} Q 25% ${offset - amplitude} 50% ${offset} T 100% ${offset}`,
          style: { top: y },
        };
      } else {
        // Vertical flowing lines
        const x = 20 + (i * 60) / count + '%';
        return {
          d: `M ${offset} -100 Q ${offset - amplitude} 25% ${offset} 50% T ${offset} 100%`,
          style: { left: x },
        };
      }
    });
  }, [count, direction]);

  // Generate CSS keyframes for the animation
  const animationCSS = `
    @keyframes flowLine {
      from { stroke-dashoffset: 200; }
      to { stroke-dashoffset: 0; }
    }
  `;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <style>{animationCSS}</style>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {paths.map((path, i) => (
          <path
            key={i}
            d={path.d}
            stroke={color}
            strokeWidth="0.2"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: '10 8',
              animation: shouldReduceMotion
                ? 'none'
                : `flowLine ${duration + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default FieldLines;
