/**
 * Corner brackets wrapper -- oarbit signature design element.
 *
 * Wraps children with the `panel-bracketed` CSS class that adds
 * decorative L-shaped brackets at the top-left and bottom-right corners.
 * Includes hover glow effect (sand accent brightens on hover).
 *
 * Use sparingly on featured/hero content panels per design spec.
 */

import type { ReactNode } from 'react';

interface CornerBracketsProps {
  children: ReactNode;
  className?: string;
}

export function CornerBrackets({ children, className = '' }: CornerBracketsProps) {
  return <div className={`panel-bracketed relative overflow-visible ${className}`}>{children}</div>;
}
