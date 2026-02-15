/**
 * Section divider component ("The Wake").
 * A gradient horizontal line with a centered copper dot and glow.
 * Used between major content sections for visual rhythm.
 */

interface SectionDividerProps {
  /** Vertical spacing class (default 'my-12') */
  spacing?: string;
  className?: string;
}

export function SectionDivider({ spacing = 'my-12', className = '' }: SectionDividerProps) {
  return (
    <div role="separator" aria-hidden="true" className={`relative h-px ${spacing} ${className}`}>
      {/* Gradient line */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-ink-border to-transparent" />

      {/* Centered copper dot with glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-copper/50 shadow-[0_0_8px_oklch(0.62_0.12_55/0.4)]" />
      </div>
    </div>
  );
}
