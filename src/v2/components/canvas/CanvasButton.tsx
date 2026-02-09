/**
 * CanvasButton - Chamfered button component
 *
 * Button with Canvas design language:
 * - Primary: chamfered corner (NOT rounded)
 * - Secondary: flat border, no chamfer
 * - Ghost: transparent, text only
 * - Uppercase tracking for labels
 * - Tap scale animation
 *
 * Design: Canvas button primitive
 */

import { motion } from 'framer-motion';
import React from 'react';

export interface CanvasButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

const sizeClasses = {
  sm: 'text-[10px] px-3 py-1.5',
  md: 'text-xs px-4 py-2',
  lg: 'text-sm px-5 py-2.5',
} as const;

export function CanvasButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
}: CanvasButtonProps) {
  const baseClasses = 'uppercase tracking-[0.15em] font-semibold transition-colors';

  const variantClasses = {
    primary: 'bg-ink-raised border border-white/[0.08] text-ink-bright hover:bg-white/[0.06]',
    secondary:
      'bg-transparent border border-white/[0.06] text-ink-secondary hover:text-ink-bright hover:border-white/[0.1]',
    ghost: 'bg-transparent text-ink-muted hover:text-ink-secondary',
  };

  // Primary variant gets chamfer clip-path
  const style =
    variant === 'primary'
      ? { clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }
      : undefined;

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={style}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}
