/**
 * Diamond marker -- oarbit signature design element.
 *
 * A small rotated square used as a decorative accent marker.
 * Supports contextual accent colors (sand, teal, coral, ivory)
 * and two sizes (default 6px, sm 4px).
 *
 * Purely decorative -- always rendered with aria-hidden="true".
 */

const COLOR_MAP: Record<string, string> = {
  sand: 'oklch(0.68 0.1 75 / 0.6)',
  teal: 'oklch(0.72 0.11 195)',
  coral: 'oklch(0.65 0.15 25)',
  ivory: 'oklch(0.92 0.02 80)',
};

interface DiamondMarkerProps {
  size?: 'default' | 'sm';
  color?: 'sand' | 'teal' | 'coral' | 'ivory';
  className?: string;
}

export function DiamondMarker({
  size = 'default',
  color = 'sand',
  className = '',
}: DiamondMarkerProps) {
  const cssClass = size === 'sm' ? 'diamond-marker-sm' : 'diamond-marker';

  // Only override inline style when a non-sand color is requested,
  // since sand is the default CSS value.
  const style =
    color !== 'sand' ? ({ '--diamond-color': COLOR_MAP[color] } as React.CSSProperties) : undefined;

  return <span className={`${cssClass} ${className}`} style={style} aria-hidden="true" />;
}
