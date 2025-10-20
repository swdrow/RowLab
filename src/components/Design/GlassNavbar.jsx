import React from 'react';

/**
 * GlassNavbar - Liquid Glass Navigation Bar
 *
 * Usage:
 *   <GlassNavbar
 *     title="RowLab"
 *     leftContent={<Logo />}
 *     rightContent={<DarkModeToggle />}
 *   />
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
        ${sticky ? 'sticky top-0 z-40' : 'relative'}
        w-full
        ${blurLevels[blur]}
        bg-white/70 dark:bg-dark-card/70
        border-b border-white/20 dark:border-white/10
        shadow-md
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

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
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
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

      {/* Bottom edge subtle glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
    </nav>
  );
};

export default GlassNavbar;
