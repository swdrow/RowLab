import React from 'react';

/**
 * GlassNavbar - Precision Instrument Navigation Bar
 *
 * Design Standard:
 * - Void-deep backdrop with blur
 * - Subtle white border (6% opacity)
 * - Blue glow accents (not green)
 *
 * Usage:
 *   <GlassNavbar
 *     title="RowLab"
 *     leftContent={<Logo />}
 *     rightContent={<DarkModeToggle />}
 *   />
 *
 *   // With nav links and CTA
 *   <GlassNavbar>
 *     <GlassNavbar.Brand>RowLab</GlassNavbar.Brand>
 *     <GlassNavbar.Links>
 *       <GlassNavbar.Link href="#features">Features</GlassNavbar.Link>
 *       <GlassNavbar.Link href="#pricing">Pricing</GlassNavbar.Link>
 *     </GlassNavbar.Links>
 *     <GlassNavbar.CTA href="/signup">Get Started</GlassNavbar.CTA>
 *   </GlassNavbar>
 *
 * Props:
 *   - title: string - app title
 *   - leftContent: React element - left side content
 *   - rightContent: React element - right side content
 *   - sticky: boolean - sticky positioning (default: true)
 *   - blur: 'subtle' | 'base' | 'strong' (default: 'strong')
 *   - className: additional CSS classes
 *   - children: navbar content (overrides all if provided)
 */

const GlassNavbar = ({
  title,
  leftContent,
  rightContent,
  sticky = true,
  blur = 'strong',
  className = '',
  children,
  ...props
}) => {
  const blurLevels = {
    subtle: 'backdrop-blur-sm',
    base: 'backdrop-blur-md',
    strong: 'backdrop-blur-xl',
  };

  return (
    <nav
      className={`
        ${sticky ? 'sticky top-0 z-50' : 'relative'}
        w-full
        ${blurLevels[blur]}
        bg-void-deep/80
        border-b border-white/[0.06]
        transition-all duration-150
        ${className}
      `}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {children ? (
            children
          ) : (
            <>
              {/* Left side */}
              <div className="flex items-center gap-4">
                {leftContent}
                {title && (
                  <h1 className="text-xl font-semibold text-text-primary">
                    {title}
                  </h1>
                )}
              </div>

              {/* Right side */}
              {rightContent && (
                <div className="flex items-center gap-4">
                  {rightContent}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

/**
 * Brand component for navbar logo/title
 */
GlassNavbar.Brand = ({ children, className = '', ...props }) => (
  <div className={`flex items-center gap-3 ${className}`} {...props}>
    {typeof children === 'string' ? (
      <span className="text-xl font-semibold text-text-primary">{children}</span>
    ) : (
      children
    )}
  </div>
);

/**
 * Container for navigation links
 */
GlassNavbar.Links = ({ children, className = '', ...props }) => (
  <div className={`flex items-center gap-8 ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Individual navigation link
 * Subtle hover with color change, no underlines
 */
GlassNavbar.Link = ({
  children,
  href,
  active = false,
  className = '',
  ...props
}) => (
  <a
    href={href}
    className={`
      text-sm font-medium
      transition-colors duration-200
      ${active
        ? 'text-text-primary'
        : 'text-text-secondary hover:text-text-primary'
      }
      ${className}
    `}
    {...props}
  >
    {children}
  </a>
);

/**
 * CTA Button for navbar
 * Uses blue glow, rounded-xl corners
 */
GlassNavbar.CTA = ({
  children,
  href,
  onClick,
  className = '',
  ...props
}) => {
  const buttonClasses = `
    inline-flex items-center justify-center
    px-5 py-2.5
    text-sm font-semibold
    text-white
    bg-accent-blue
    rounded-xl
    shadow-[0_0_20px_-5px_rgba(0,112,243,0.4)]
    hover:shadow-[0_0_30px_-5px_rgba(0,112,243,0.5)]
    hover:bg-accent-blue/90
    transition-all duration-200
    ${className}
  `;

  if (href) {
    return (
      <a href={href} className={buttonClasses} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

/**
 * Actions container for right-side items
 */
GlassNavbar.Actions = ({ children, className = '', ...props }) => (
  <div className={`flex items-center gap-4 ${className}`} {...props}>
    {children}
  </div>
);

export default GlassNavbar;
