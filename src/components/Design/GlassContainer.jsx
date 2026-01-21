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
      bg-gradient-to-br from-gray-50 to-gray-100
      dark:from-gray-900 dark:to-gray-800
    `,

    // Directional gradient
    gradient: `
      bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50
      dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800
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
