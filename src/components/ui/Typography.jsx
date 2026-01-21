import { forwardRef } from 'react';
import { clsx } from 'clsx';

// Editorial Display (Fraunces)
const DisplayXL = forwardRef(function DisplayXL({ className, children, ...props }, ref) {
  return (
    <h1
      ref={ref}
      className={clsx(
        'font-display text-[72px] font-semibold leading-[1.1] tracking-[-0.02em] text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
});

const DisplayLG = forwardRef(function DisplayLG({ className, children, ...props }, ref) {
  return (
    <h2
      ref={ref}
      className={clsx(
        'font-display text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
});

const DisplayMD = forwardRef(function DisplayMD({ className, children, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={clsx(
        'font-display text-[32px] font-medium leading-[1.2] tracking-[-0.02em] text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

// Body Text (Inter)
const BodyLG = forwardRef(function BodyLG({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('font-body text-lg leading-relaxed text-text-secondary', className)}
      {...props}
    >
      {children}
    </p>
  );
});

const BodyMD = forwardRef(function BodyMD({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('font-body text-[15px] leading-relaxed text-text-secondary', className)}
      {...props}
    >
      {children}
    </p>
  );
});

const BodySM = forwardRef(function BodySM({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('font-body text-[13px] leading-relaxed text-text-secondary', className)}
      {...props}
    >
      {children}
    </p>
  );
});

// Mono Text (JetBrains Mono)
const MonoStat = forwardRef(function MonoStat({ className, glow, children, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={clsx(
        'font-mono text-2xl font-semibold tracking-[-0.02em] tabular-nums text-text-primary',
        glow && 'text-blade-blue',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

const MonoLabel = forwardRef(function MonoLabel({ className, color = 'muted', children, ...props }, ref) {
  const colorStyles = {
    muted: 'text-text-muted',
    green: 'text-blade-blue',
    violet: 'text-coxswain-violet',
  };

  return (
    <span
      ref={ref}
      className={clsx(
        'font-mono text-[11px] font-medium tracking-widest uppercase',
        colorStyles[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

export {
  DisplayXL,
  DisplayLG,
  DisplayMD,
  BodyLG,
  BodyMD,
  BodySM,
  MonoStat,
  MonoLabel,
};
