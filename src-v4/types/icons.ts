import type { SVGProps, FC } from 'react';

/**
 * Standard icon component type. Replaces LucideIcon throughout the app.
 * All custom SVG icon components implement this interface.
 */
export type IconComponent = FC<SVGProps<SVGSVGElement>>;
