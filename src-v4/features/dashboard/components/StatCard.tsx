/**
 * Animated stat card for dashboard quick stats.
 * Values count-up from 0 on first route mount only.
 * Wraps GlassCard with icon, label, value, footnote, and sparkline placeholder.
 */

import { useEffect, useState } from 'react';
import { useMotionValue, useTransform, animate } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatNumber } from '@/lib/format';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  formattedValue?: string;
  footnote?: string;
  className?: string;
}

/** Module-level flag — count-up only fires once per session (first route mount). */
let hasAnimated = false;

export function StatCard({
  icon: Icon,
  label,
  value,
  formattedValue,
  footnote,
  className = '',
}: StatCardProps) {
  const displayLabel = formattedValue ?? formatNumber(value);

  // If formattedValue is provided or already animated, render directly
  if (formattedValue != null || hasAnimated) {
    return (
      <StatCardShell
        icon={Icon}
        label={label}
        displayValue={displayLabel}
        footnote={footnote}
        className={className}
      />
    );
  }

  return (
    <AnimatedStatCard
      icon={Icon}
      label={label}
      value={value}
      footnote={footnote}
      className={className}
    />
  );
}

/** Renders the count-up animation on first mount, then marks hasAnimated. */
function AnimatedStatCard({
  icon: Icon,
  label,
  value,
  footnote,
  className = '',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  footnote?: string;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => formatNumber(Math.round(latest)));
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    // Reset motion value on mount (handles React Strict Mode re-mount)
    motionValue.set(0);

    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: 'easeOut',
    });

    const unsubscribe = rounded.on('change', (v) => {
      setDisplayValue(v);
    });

    controls.then(() => {
      hasAnimated = true;
      setDisplayValue(formatNumber(value));
    });

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [motionValue, rounded, value]);

  return (
    <StatCardShell
      icon={Icon}
      label={label}
      displayValue={displayValue}
      footnote={footnote}
      className={className}
    />
  );
}

/** Shared visual shell for animated and static rendering. */
function StatCardShell({
  icon: Icon,
  label,
  displayValue,
  footnote,
  className = '',
}: {
  icon: LucideIcon;
  label: string;
  displayValue: string;
  footnote?: string;
  className?: string;
}) {
  return (
    <GlassCard padding="md" className={className} as="article">
      <div className="flex flex-col gap-3" aria-label={`${label}: ${displayValue}`} role="group">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg bg-ink-well flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon size={20} className="text-accent-copper" />
        </div>

        {/* Label */}
        <span className="text-xs uppercase tracking-wider text-ink-muted font-medium">{label}</span>

        {/* Value */}
        <span className="text-2xl lg:text-3xl font-bold text-ink-primary tabular-nums">
          {displayValue}
        </span>

        {/* Sparkline placeholder */}
        {/* TODO(phase-48): Add sparkline component here */}
        <div className="h-10" />

        {/* Footnote */}
        {footnote && <span className="text-xs text-ink-tertiary">{footnote}</span>}
      </div>
    </GlassCard>
  );
}
