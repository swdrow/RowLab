/**
 * Card component — oarbit Deep Voyager design system.
 *
 * Opaque void-surface background with border and floating shadow.
 * Cards FLOAT above the starfield — shadow depth is mandatory.
 *
 * Variants:
 *   default     — void-surface bg, edge border, shadow-card (floating)
 *   interactive — hover lift + deeper shadow on hover
 *   elevated    — bg-void-overlay, shadow-md (for modals/popovers)
 *   inset       — bg-void-deep, border-edge-default (recessed wells)
 *
 * Padding: none | sm (12px) | md (16px) | lg (24px)
 * Radius: radius-lg (6px)
 *
 * Accepts all standard HTML div attributes (onClick, role, aria-*, etc.).
 */

interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
  variant?: 'default' | 'interactive' | 'elevated' | 'inset';
  /** @deprecated No-op in new design system. Kept for backward compat. */
  hover?: boolean;
  /** @deprecated No-op in new design system. Kept for backward compat. */
  glow?: boolean;
  /** @deprecated Use variant="interactive" instead. Kept for backward compat. */
  interactive?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const variantClasses = {
  default: 'bg-void-surface border border-edge-default rounded-[var(--radius-lg)] shadow-card',
  interactive: [
    'bg-void-surface border border-edge-default rounded-[var(--radius-lg)] shadow-card',
    'card-interactive hover-lift',
  ].join(' '),
  elevated: 'bg-void-overlay border border-edge-default rounded-[var(--radius-lg)] shadow-md',
  inset: 'bg-void-deep border border-edge-default rounded-[var(--radius-md)]',
} as const;

export function Card({
  children,
  className = '',
  style,
  padding = 'md',
  as: Component = 'div',
  variant = 'default',
  interactive = false,
  hover: _hover,
  glow: _glow,
  ...rest
}: CardProps) {
  // Support legacy interactive prop
  const resolvedVariant = interactive && variant === 'default' ? 'interactive' : variant;
  const base = variantClasses[resolvedVariant];

  return (
    <Component
      className={`${base} ${paddingMap[padding]} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}
