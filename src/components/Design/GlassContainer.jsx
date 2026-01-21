import React from 'react';

/**
 * GlassContainer - App-level background container with mesh gradient
 *
 * Usage:
 *   <GlassContainer>
 *     <App />
 *   </GlassContainer>
 *
 * Props:
 *   - variant: 'mesh' | 'solid' | 'gradient' (default: 'mesh')
 *   - className: additional CSS classes
 *   - children: app content
 */

const GlassContainer = ({
  children,
  variant = 'mesh',
  className = '',
  ...props
}) => {
  const variants = {
    // Multi-layer radial gradient mesh (iOS-style)
    mesh: `
      bg-gradient-mesh
      bg-fixed
      bg-cover
    `,

    // Solid color with subtle gradient
    solid: `
      bg-gradient-to-br from-void-surface to-void-elevated
    `,

    // Directional gradient
    gradient: `
      bg-gradient-to-br from-void-deep via-coxswain-violet/10 to-void-elevated
    `,
  };

  return (
    <div
      className={`
        min-h-screen
        ${variants[variant]}
        transition-colors duration-150
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassContainer;
