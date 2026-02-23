/**
 * Section divider — oarbit design system.
 *
 * Variants:
 *   rule    — simple 1px border-subtle, full width
 *   section — 1px border-default with space-8 (32px) vertical margin
 *   accent  — 1px with a short accent-colored segment (24px centered)
 *
 * No copper dot, no "Wake" concept. Simple and clean.
 */

interface SectionDividerProps {
  variant?: 'rule' | 'section' | 'accent';
  className?: string;
}

export function SectionDivider({ variant = 'rule', className = '' }: SectionDividerProps) {
  if (variant === 'accent') {
    return (
      <div role="separator" aria-hidden="true" className={`relative h-px my-8 ${className}`}>
        <div className="absolute inset-x-0 top-0 h-px bg-edge-default" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-6 h-px bg-accent-teal" />
      </div>
    );
  }

  if (variant === 'section') {
    return <hr aria-hidden="true" className={`border-0 h-px bg-edge-default my-8 ${className}`} />;
  }

  // rule (default)
  return <hr aria-hidden="true" className={`border-0 h-px bg-edge-default ${className}`} />;
}
