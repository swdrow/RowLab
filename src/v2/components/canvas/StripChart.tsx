/**
 * StripChart - Mini bar histogram with progressive opacity
 *
 * Older data fades, recent data glows. NOT a generic SVG sparkline.
 * This is a Canvas-specific data visualization primitive.
 *
 * Features:
 * - Framer Motion animated bars
 * - Progressive opacity (early bars dim, last bar prominent)
 * - Staggered animation entry
 * - Normalized height scaling
 *
 * Design: Canvas instrument strip chart
 */

import { motion } from 'framer-motion';

export interface StripChartProps {
  data: readonly number[];
  color: string;
  delay?: number;
  className?: string;
}

export function StripChart({ data, color, delay = 0, className }: StripChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div
      className={`flex items-end gap-[1.5px] lg:gap-[2px] h-8 lg:h-12 mt-2 lg:mt-3 ${className || ''}`}
    >
      {data.map((v, i) => {
        const normalized = (v - min) / range;
        const heightPct = 15 + normalized * 85;
        const isLast = i === data.length - 1;
        const opacity = isLast ? 0.85 : 0.12 + (i / (data.length - 1)) * 0.5;

        return (
          <motion.div
            key={i}
            className="flex-1 rounded-[1px]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: `${heightPct}%`, opacity }}
            transition={{
              delay: delay + i * 0.05,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}
