import { forwardRef } from 'react';
import { clsx } from 'clsx';

const variants = {
  default: 'bg-surface-700 text-text-secondary border-border-default',
  primary: 'bg-accent/20 text-accent-400 border-accent/30',
  success: 'bg-success/20 text-success border-success/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  error: 'bg-spectrum-red/20 text-spectrum-red border-spectrum-red/30',
  info: 'bg-info/20 text-info border-info/30',

  // Spectrum colors
  blue: 'bg-spectrum-blue/20 text-spectrum-blue border-spectrum-blue/30',
  indigo: 'bg-spectrum-indigo/20 text-spectrum-indigo border-spectrum-indigo/30',
  purple: 'bg-spectrum-purple/20 text-spectrum-purple border-spectrum-purple/30',
  pink: 'bg-spectrum-pink/20 text-spectrum-pink border-spectrum-pink/30',
  cyan: 'bg-spectrum-cyan/20 text-spectrum-cyan border-spectrum-cyan/30',
  emerald: 'bg-spectrum-emerald/20 text-spectrum-emerald border-spectrum-emerald/30',
  orange: 'bg-spectrum-orange/20 text-spectrum-orange border-spectrum-orange/30',

  // Rowing specific
  port: 'bg-port/20 text-port border-port/30',
  starboard: 'bg-starboard/20 text-starboard border-starboard/30',

  // Role badges
  owner: 'bg-spectrum-purple/20 text-spectrum-purple border-spectrum-purple/30',
  coach: 'bg-spectrum-blue/20 text-spectrum-blue border-spectrum-blue/30',
  athlete: 'bg-spectrum-emerald/20 text-spectrum-emerald border-spectrum-emerald/30',
};

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

/**
 * Badge component
 *
 * @param {Object} props
 * @param {'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'blue' | 'indigo' | 'purple' | 'pink' | 'cyan' | 'emerald' | 'orange' | 'port' | 'starboard' | 'owner' | 'coach' | 'athlete'} props.variant
 * @param {'xs' | 'sm' | 'md' | 'lg'} props.size
 * @param {boolean} props.dot
 * @param {boolean} props.removable
 * @param {function} props.onRemove
 * @param {string} props.className
 * @param {React.ReactNode} props.children
 */
const Badge = forwardRef(function Badge(
  {
    variant = 'default',
    size = 'sm',
    dot = false,
    removable = false,
    onRemove,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <span
      ref={ref}
      className={clsx(
        // Base styles
        'inline-flex items-center gap-1.5',
        'font-medium rounded-full',
        'border',
        'whitespace-nowrap',

        // Variant styles
        variants[variant],

        // Size styles
        sizes[size],

        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            'bg-current opacity-70'
          )}
        />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );
});

/**
 * Status Badge with dot indicator
 */
const StatusBadge = forwardRef(function StatusBadge(
  { status, className, ...props },
  ref
) {
  const statusConfig = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    suspended: { variant: 'error', label: 'Suspended' },
    online: { variant: 'success', label: 'Online' },
    offline: { variant: 'default', label: 'Offline' },
    busy: { variant: 'warning', label: 'Busy' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <Badge ref={ref} variant={config.variant} dot className={className} {...props}>
      {config.label}
    </Badge>
  );
});

/**
 * Role Badge for team members
 */
const RoleBadge = forwardRef(function RoleBadge({ role, className, ...props }, ref) {
  const roleConfig = {
    OWNER: { variant: 'owner', label: 'Owner' },
    COACH: { variant: 'coach', label: 'Coach' },
    ATHLETE: { variant: 'athlete', label: 'Athlete' },
  };

  const config = roleConfig[role] || { variant: 'default', label: role };

  return (
    <Badge ref={ref} variant={config.variant} className={className} {...props}>
      {config.label}
    </Badge>
  );
});

/**
 * Side Badge for rowing positions
 */
const SideBadge = forwardRef(function SideBadge({ side, className, ...props }, ref) {
  const sideConfig = {
    Port: { variant: 'port', label: 'Port' },
    Starboard: { variant: 'starboard', label: 'Starboard' },
    Both: { variant: 'primary', label: 'Both' },
    Cox: { variant: 'purple', label: 'Cox' },
  };

  const config = sideConfig[side] || { variant: 'default', label: side };

  return (
    <Badge ref={ref} variant={config.variant} size="xs" className={className} {...props}>
      {config.label}
    </Badge>
  );
});

// Icon
function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export { Badge, StatusBadge, RoleBadge, SideBadge };
export default Badge;
