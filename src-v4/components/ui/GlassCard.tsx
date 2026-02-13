/**
 * Glass morphism card component.
 * Uses backdrop-blur with semi-transparent background and subtle border.
 * Consistent with the Canvas design system.
 */

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
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
}: GlassCardProps) {
  return (
    <Component
      className={`
        glass rounded-xl shadow-card
        ${paddingMap[padding]}
        ${hover ? 'glass-hover transition-shadow duration-200 hover:shadow-card-hover' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </Component>
  );
}
