/**
 * Glass morphism card component -- full Canvas design system implementation.
 * Features: backdrop-blur, noise texture overlay, gradient hover line,
 * optional glow shadow, optional interactive lift.
 */

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
  /** Adds copper glow shadow on hover */
  glow?: boolean;
  /** Adds subtle lift on hover with transition */
  interactive?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
} as const;

export function GlassCard({
  children,
  className = '',
  hover = false,
  padding = 'md',
  as: Component = 'div',
  glow = false,
  interactive = false,
}: GlassCardProps) {
  return (
    <Component
      className={`
        group relative overflow-hidden glass rounded-xl shadow-card
        ${hover ? 'glass-hover transition-shadow duration-200 hover:shadow-card-hover' : ''}
        ${glow ? 'hover:shadow-glow-copper' : ''}
        ${interactive ? 'hover:-translate-y-0.5 transition-transform duration-150' : ''}
        ${className}
      `.trim()}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Gradient hover border line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-copper/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content sits above overlays */}
      <div className={`relative z-10 ${paddingMap[padding]}`}>{children}</div>
    </Component>
  );
}
