import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GeometricAnimation } from './GeometricAnimation';
import { EMPTY_STATE_ANIMATIONS, type EmptyStateAnimationType } from './animations';

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface EmptyStateAnimatedProps {
  animationType?: EmptyStateAnimationType;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

/**
 * EmptyStateAnimated - Enhanced empty state with geometric animations
 *
 * Features:
 * - Geometric animation as illustration (Linear/Vercel minimal aesthetic)
 * - Every instance has: animation + explanation + at least one CTA
 * - Glass card styling per design standard
 * - Support for navigation via 'to' prop or onClick handler
 *
 * Per CONTEXT.md: Every empty state has illustration + explanation + CTA
 */
export const EmptyStateAnimated: React.FC<EmptyStateAnimatedProps> = ({
  animationType,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleActionClick = (actionConfig?: EmptyStateAction) => {
    if (!actionConfig) return;

    if (actionConfig.to) {
      navigate(actionConfig.to);
    } else if (actionConfig.onClick) {
      actionConfig.onClick();
    }
  };

  const animationConfig = animationType ? EMPTY_STATE_ANIMATIONS[animationType] : null;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center glass-card ${className}`}
    >
      {/* Geometric Animation */}
      {animationConfig && (
        <div className="mb-6" style={{ maxWidth: '192px' }}>
          <GeometricAnimation config={animationConfig} size={160} />
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm">{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              type="button"
              onClick={() => handleActionClick(action)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded-lg hover:bg-[var(--color-interactive-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={() => handleActionClick(secondaryAction)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-surface-elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
