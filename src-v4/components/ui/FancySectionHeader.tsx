/**
 * Fancy section header -- oarbit signature design element.
 *
 * Composes the signature primitives: diamond marker + optional icon +
 * label + warm rule (viewport-triggered animation) + optional annotation.
 *
 * The warm rule draw-in triggers once when the header scrolls into view
 * via framer-motion's useInView hook. Diamond and label render instantly.
 */

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { DiamondMarker } from './DiamondMarker';
import { WarmRule } from './WarmRule';

interface FancySectionHeaderProps {
  label: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  annotation?: string;
  accentColor?: 'sand' | 'teal' | 'coral' | 'ivory';
  className?: string;
}

const ACCENT_TEXT_CLASS: Record<string, string> = {
  sand: 'text-accent-sand',
  teal: 'text-accent-teal',
  coral: 'text-accent-coral',
  ivory: 'text-accent-ivory',
};

export function FancySectionHeader({
  label,
  icon: Icon,
  annotation,
  accentColor = 'sand',
  className = '',
}: FancySectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div ref={ref} className={`section-header-fancy ${className}`}>
      <DiamondMarker color={accentColor} />
      {Icon && <Icon width={14} height={14} className={ACCENT_TEXT_CLASS[accentColor]} />}
      <span className="section-label-fancy">{label}</span>
      <WarmRule animate={isInView} />
      {annotation && <span className="section-annotation hidden sm:inline">{annotation}</span>}
    </div>
  );
}
