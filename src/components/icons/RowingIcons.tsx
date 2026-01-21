import { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Custom rowing-specific icons for RowLab
 * Professional-grade SVG icons designed for the Precision Instrument design system
 * Inspired by actual racing shell silhouettes and rowing equipment
 */

// Racing shell - clean, minimal side profile
export function ShellIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull - sleek racing shell silhouette */}
      <path d="M2 12C2 12 4 9.5 12 9.5C20 9.5 22 12 22 12" />
      <path d="M2 12C2 12 4 14.5 12 14.5C20 14.5 22 12 22 12" />
      {/* Bow ball */}
      <circle cx="21.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// Eight boat (8+ or 8-) - detailed with riggers
export function EightIcon({ size = 24, hasCox = true, ...props }: IconProps & { hasCox?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull */}
      <path d="M1 12C1 11 2.5 9.5 12 9.5C21.5 9.5 23 11 23 12C23 13 21.5 14.5 12 14.5C2.5 14.5 1 13 1 12Z" strokeWidth="1.5" />
      {/* Bow ball */}
      <circle cx="22.5" cy="12" r="0.6" fill="currentColor" />
      {/* Riggers - alternating sides */}
      <g strokeWidth="1" opacity="0.7">
        <line x1="4.5" y1="10.5" x2="4.5" y2="8.5" />
        <line x1="7" y1="13.5" x2="7" y2="15.5" />
        <line x1="9.5" y1="10.5" x2="9.5" y2="8.5" />
        <line x1="12" y1="13.5" x2="12" y2="15.5" />
        <line x1="14.5" y1="10.5" x2="14.5" y2="8.5" />
        <line x1="17" y1="13.5" x2="17" y2="15.5" />
        <line x1="19.5" y1="10.5" x2="19.5" y2="8.5" />
      </g>
      {/* Cox seat indicator */}
      {hasCox && (
        <g>
          <rect x="2" y="11" width="1.5" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
        </g>
      )}
    </svg>
  );
}

// Four boat (4+ or 4-)
export function FourIcon({ size = 24, hasCox = true, ...props }: IconProps & { hasCox?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull - shorter than 8 */}
      <path d="M3 12C3 11 4.5 9.5 12 9.5C19.5 9.5 21 11 21 12C21 13 19.5 14.5 12 14.5C4.5 14.5 3 13 3 12Z" strokeWidth="1.5" />
      {/* Bow ball */}
      <circle cx="20.5" cy="12" r="0.6" fill="currentColor" />
      {/* Riggers */}
      <g strokeWidth="1" opacity="0.7">
        <line x1="7" y1="10.5" x2="7" y2="8.5" />
        <line x1="10.5" y1="13.5" x2="10.5" y2="15.5" />
        <line x1="14" y1="10.5" x2="14" y2="8.5" />
        <line x1="17.5" y1="13.5" x2="17.5" y2="15.5" />
      </g>
      {/* Cox seat */}
      {hasCox && (
        <rect x="4" y="11" width="1.5" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
      )}
    </svg>
  );
}

// Pair (2+ or 2-)
export function PairIcon({ size = 24, hasCox = true, ...props }: IconProps & { hasCox?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull */}
      <path d="M5 12C5 11.2 6.5 10 12 10C17.5 10 19 11.2 19 12C19 12.8 17.5 14 12 14C6.5 14 5 12.8 5 12Z" strokeWidth="1.5" />
      {/* Bow ball */}
      <circle cx="18.5" cy="12" r="0.6" fill="currentColor" />
      {/* Riggers */}
      <g strokeWidth="1" opacity="0.7">
        <line x1="10" y1="10.8" x2="10" y2="8.5" />
        <line x1="14" y1="13.2" x2="14" y2="15.5" />
      </g>
      {/* Cox seat */}
      {hasCox && (
        <rect x="6" y="11" width="1.5" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
      )}
    </svg>
  );
}

// Single scull (1x) - distinctive with crossed sculls
export function SingleIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Narrow hull */}
      <path d="M6 12C6 11.3 7.5 10.5 12 10.5C16.5 10.5 18 11.3 18 12C18 12.7 16.5 13.5 12 13.5C7.5 13.5 6 12.7 6 12Z" strokeWidth="1.5" />
      {/* Bow ball */}
      <circle cx="17.5" cy="12" r="0.5" fill="currentColor" />
      {/* Sculling oars (crossed X pattern) */}
      <g strokeWidth="1" opacity="0.6">
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
        {/* Oar blades */}
        <ellipse cx="8.5" cy="8.5" rx="1.2" ry="0.6" transform="rotate(-45 8.5 8.5)" />
        <ellipse cx="15.5" cy="8.5" rx="1.2" ry="0.6" transform="rotate(45 15.5 8.5)" />
      </g>
    </svg>
  );
}

// Double scull (2x)
export function DoubleIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull */}
      <path d="M5 12C5 11.2 6.5 10 12 10C17.5 10 19 11.2 19 12C19 12.8 17.5 14 12 14C6.5 14 5 12.8 5 12Z" strokeWidth="1.5" />
      {/* Bow ball */}
      <circle cx="18.5" cy="12" r="0.5" fill="currentColor" />
      {/* Sculling oars - two sets of crossed oars */}
      <g strokeWidth="0.75" opacity="0.5">
        {/* Stern rower oars */}
        <line x1="8" y1="9.5" x2="11" y2="14.5" />
        <line x1="11" y1="9.5" x2="8" y2="14.5" />
        {/* Bow rower oars */}
        <line x1="13" y1="9.5" x2="16" y2="14.5" />
        <line x1="16" y1="9.5" x2="13" y2="14.5" />
      </g>
    </svg>
  );
}

// Quad scull (4x or 4x+)
export function QuadIcon({ size = 24, hasCox = false, ...props }: IconProps & { hasCox?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull */}
      <path d="M3 12C3 11 4.5 9.5 12 9.5C19.5 9.5 21 11 21 12C21 13 19.5 14.5 12 14.5C4.5 14.5 3 13 3 12Z" strokeWidth="1.5" />
      {/* Bow ball */}
      <circle cx="20.5" cy="12" r="0.5" fill="currentColor" />
      {/* Sculling indicators - small X marks at each seat */}
      <g strokeWidth="0.75" opacity="0.5">
        <line x1="6" y1="10.5" x2="8" y2="13.5" />
        <line x1="8" y1="10.5" x2="6" y2="13.5" />
        <line x1="10" y1="10.5" x2="12" y2="13.5" />
        <line x1="12" y1="10.5" x2="10" y2="13.5" />
        <line x1="14" y1="10.5" x2="16" y2="13.5" />
        <line x1="16" y1="10.5" x2="14" y2="13.5" />
        <line x1="17.5" y1="10.5" x2="19.5" y2="13.5" />
        <line x1="19.5" y1="10.5" x2="17.5" y2="13.5" />
      </g>
      {/* Cox seat */}
      {hasCox && (
        <rect x="4" y="11" width="1.2" height="2" rx="0.4" fill="currentColor" opacity="0.5" />
      )}
    </svg>
  );
}

// Octuple scull (8x)
export function OctupleIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull */}
      <path d="M1 12C1 11 2.5 9.5 12 9.5C21.5 9.5 23 11 23 12C23 13 21.5 14.5 12 14.5C2.5 14.5 1 13 1 12Z" strokeWidth="1.5" />
      {/* Bow ball */}
      <circle cx="22.5" cy="12" r="0.5" fill="currentColor" />
      {/* Sculling indicators - X pattern across */}
      <g strokeWidth="0.5" opacity="0.4">
        <line x1="4" y1="10.5" x2="6" y2="13.5" />
        <line x1="6" y1="10.5" x2="4" y2="13.5" />
        <line x1="7" y1="10.5" x2="9" y2="13.5" />
        <line x1="9" y1="10.5" x2="7" y2="13.5" />
        <line x1="10" y1="10.5" x2="12" y2="13.5" />
        <line x1="12" y1="10.5" x2="10" y2="13.5" />
        <line x1="13" y1="10.5" x2="15" y2="13.5" />
        <line x1="15" y1="10.5" x2="13" y2="13.5" />
        <line x1="16" y1="10.5" x2="18" y2="13.5" />
        <line x1="18" y1="10.5" x2="16" y2="13.5" />
        <line x1="18.5" y1="10.5" x2="20.5" y2="13.5" />
        <line x1="20.5" y1="10.5" x2="18.5" y2="13.5" />
      </g>
    </svg>
  );
}

// Sweep oar - single oar
export function OarIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Shaft */}
      <line x1="4" y1="20" x2="20" y2="4" />
      {/* Blade - hatchet style */}
      <path d="M17 7L20 4L22 6C21 8 19 9 17 9L17 7Z" fill="currentColor" opacity="0.3" />
      <path d="M17 7L20 4L22 6C21 8 19 9 17 9" />
      {/* Handle grip */}
      <circle cx="4.5" cy="19.5" r="1.5" strokeWidth="1.25" />
    </svg>
  );
}

// Sculling oars (crossed pair)
export function ScullsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Left oar */}
      <line x1="3" y1="17" x2="17" y2="3" />
      <path d="M14 6L17 3L19 5C18 7 16 8 14 8L14 6Z" fill="currentColor" opacity="0.3" />
      <circle cx="3.5" cy="16.5" r="1" strokeWidth="1" />
      {/* Right oar */}
      <line x1="21" y1="17" x2="7" y2="3" />
      <path d="M10 6L7 3L5 5C6 7 8 8 10 8L10 6Z" fill="currentColor" opacity="0.3" />
      <circle cx="20.5" cy="16.5" r="1" strokeWidth="1" />
    </svg>
  );
}

// Coxswain - megaphone
export function CoxIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Megaphone body */}
      <path d="M4 10V14C4 15 4.5 16 6 16H7L14 20V4L7 8H6C4.5 8 4 9 4 10Z" />
      <path d="M4 10V14C4 15 4.5 16 6 16H7L14 20V4L7 8H6C4.5 8 4 9 4 10Z" fill="currentColor" opacity="0.1" />
      {/* Sound waves */}
      <path d="M17 9.5C17.8 10.3 18.2 11.2 18.2 12S17.8 13.7 17 14.5" />
      <path d="M19.5 7.5C21 9 21.8 10.5 21.8 12S21 15 19.5 16.5" />
    </svg>
  );
}

// Ergometer
export function ErgIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Rail */}
      <line x1="3" y1="18" x2="21" y2="18" />
      {/* Front leg */}
      <line x1="5" y1="18" x2="5" y2="15" />
      {/* Flywheel housing */}
      <circle cx="6" cy="12" r="3.5" />
      <circle cx="6" cy="12" r="1.5" />
      {/* Chain to handle */}
      <line x1="9.5" y1="12" x2="15" y2="12" strokeDasharray="1 1" />
      {/* Handle */}
      <rect x="14" y="10" width="5" height="4" rx="1" />
      {/* Sliding seat */}
      <rect x="10" y="15.5" width="4" height="2" rx="0.75" fill="currentColor" opacity="0.3" />
      <rect x="10" y="15.5" width="4" height="2" rx="0.75" />
      {/* Foot stretcher */}
      <path d="M18 18L20 14" />
      <path d="M19 14L21 14" />
    </svg>
  );
}

// Stopwatch
export function TimingIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Face */}
      <circle cx="12" cy="13" r="8" />
      {/* Top button */}
      <path d="M12 5V2" />
      <path d="M10 2H14" />
      {/* Side button */}
      <path d="M18.5 7.5L20 6" />
      {/* Minute hand */}
      <line x1="12" y1="13" x2="12" y2="8" strokeWidth="2" />
      {/* Second hand */}
      <line x1="12" y1="13" x2="15.5" y2="15" strokeWidth="1" />
      {/* Center */}
      <circle cx="12" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

// Lineup builder
export function LineupIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Shell outline */}
      <path d="M2 14C2 13 4 11 12 11S22 13 22 14C22 15 20 17 12 17S2 15 2 14Z" />
      {/* Athletes represented as draggable dots */}
      <circle cx="6" cy="14" r="1.2" fill="currentColor" />
      <circle cx="10" cy="14" r="1.2" fill="currentColor" />
      <circle cx="14" cy="14" r="1.2" fill="currentColor" />
      <circle cx="18" cy="14" r="1.2" fill="currentColor" />
      {/* Drag/swap arrows */}
      <g strokeWidth="1" opacity="0.6">
        <path d="M10 8L10 10" />
        <path d="M9 9L10 8L11 9" />
        <path d="M14 8L14 10" />
        <path d="M13 9L14 8L15 9" />
      </g>
      {/* Swap indicator */}
      <path d="M10 6H14" strokeWidth="1" strokeDasharray="1.5 1" opacity="0.4" />
    </svg>
  );
}

// Race/Regatta
export function RaceIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Racing lanes */}
      <g strokeDasharray="2 2" opacity="0.25" strokeWidth="0.75">
        <line x1="2" y1="6" x2="19" y2="6" />
        <line x1="2" y1="12" x2="19" y2="12" />
        <line x1="2" y1="18" x2="19" y2="18" />
      </g>
      {/* Racing shells in lanes - different positions */}
      <g strokeWidth="1.5">
        {/* Lane 1 - leading */}
        <path d="M13 6C13 5.5 13.5 5 15 5S17 5.5 17 6S16.5 7 15 7S13 6.5 13 6Z" />
        {/* Lane 2 - middle */}
        <path d="M10 12C10 11.5 10.5 11 12 11S14 11.5 14 12S13.5 13 12 13S10 12.5 10 12Z" />
        {/* Lane 3 - trailing */}
        <path d="M6 18C6 17.5 6.5 17 8 17S10 17.5 10 18S9.5 19 8 19S6 18.5 6 18Z" />
      </g>
      {/* Finish line */}
      <line x1="20" y1="3" x2="20" y2="21" strokeWidth="2.5" />
      <line x1="20" y1="3" x2="20" y2="21" strokeWidth="1" stroke="var(--bg-base, #0a0a0c)" strokeDasharray="2 2" />
    </svg>
  );
}

// Boat type helper - returns appropriate icon based on boat notation
export function BoatTypeIcon({
  boatType,
  size = 24,
  ...props
}: IconProps & { boatType: string }) {
  const type = boatType.toLowerCase().replace(/\s+/g, '');

  // Eights
  if (type === '8+' || type.includes('varsity8+') || type.includes('jv8+'))
    return <EightIcon size={size} hasCox={true} {...props} />;
  if (type === '8-')
    return <EightIcon size={size} hasCox={false} {...props} />;
  if (type === '8x')
    return <OctupleIcon size={size} {...props} />;

  // Fours
  if (type === '4+' || type.includes('varsity4+') || type.includes('jv4+'))
    return <FourIcon size={size} hasCox={true} {...props} />;
  if (type === '4-')
    return <FourIcon size={size} hasCox={false} {...props} />;
  if (type === '4x+')
    return <QuadIcon size={size} hasCox={true} {...props} />;
  if (type === '4x' || type.includes('quad'))
    return <QuadIcon size={size} hasCox={false} {...props} />;

  // Pairs and doubles
  if (type === '2+')
    return <PairIcon size={size} hasCox={true} {...props} />;
  if (type === '2-' || type.includes('pair'))
    return <PairIcon size={size} hasCox={false} {...props} />;
  if (type === '2x' || type.includes('double'))
    return <DoubleIcon size={size} {...props} />;

  // Single
  if (type === '1x' || type.includes('single'))
    return <SingleIcon size={size} {...props} />;

  // Default
  return <ShellIcon size={size} {...props} />;
}

export default {
  ShellIcon,
  EightIcon,
  FourIcon,
  PairIcon,
  SingleIcon,
  DoubleIcon,
  QuadIcon,
  OctupleIcon,
  OarIcon,
  ScullsIcon,
  CoxIcon,
  ErgIcon,
  TimingIcon,
  LineupIcon,
  RaceIcon,
  BoatTypeIcon,
};
