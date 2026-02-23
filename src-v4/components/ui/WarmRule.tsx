/**
 * Warm rule -- oarbit signature design element.
 *
 * An animated gradient line that draws in from left when `animate` is true.
 * Uses the existing `.warm-rule` CSS class for gradient appearance and
 * `.warm-rule-animated` / `.warm-rule-visible` for the scaleX draw-in.
 *
 * Respects prefers-reduced-motion (animation disabled via CSS).
 * Full-bleed on mobile (negative margin extends to screen edges).
 */

interface WarmRuleProps {
  animate?: boolean;
  className?: string;
}

export function WarmRule({ animate = true, className = '' }: WarmRuleProps) {
  return (
    <div
      className={`warm-rule warm-rule-animated sm:mx-0 mx-[-1rem] ${animate ? 'warm-rule-visible' : ''} ${className}`}
    />
  );
}
