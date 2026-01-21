import { useRef, useState, useEffect } from 'react';

/**
 * SpotlightCard - A card with a radial gradient spotlight effect that follows the cursor
 *
 * Part of the Precision Instrument design system.
 * Provides a subtle interactive feedback for hoverable card elements.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.spotlightColor - Color of the spotlight gradient (default: blade-blue at 8% opacity)
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(0, 112, 243, 0.08)'
}) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);

  // Disable spotlight effect on touch devices for performance
  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mql.matches);

    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused || !isDesktop) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (isDesktop) setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`relative overflow-hidden rounded-xl border border-white/5 bg-void-deeper/50 ${className}`}
    >
      {/* Spotlight gradient overlay */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-150"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`
        }}
      />

      {/* Top highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
