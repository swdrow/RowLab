import React from 'react';
import { FeatureId } from '@v2/types/feature-toggles';
import { useFeature } from '@v2/hooks/useFeaturePreference';
import { FeatureDiscoveryHint } from './FeatureDiscoveryHint';

/**
 * Props for FeatureGuard component
 */
interface FeatureGuardProps {
  /** Feature ID to check */
  featureId: FeatureId;
  /** Content to render when feature is enabled */
  children: React.ReactNode;
  /** Optional custom fallback when feature is disabled. If not provided, shows FeatureDiscoveryHint */
  fallback?: React.ReactNode;
}

/**
 * FeatureGuard Component
 *
 * Conditionally renders content based on feature toggle state.
 * When disabled, shows FeatureDiscoveryHint by default (or custom fallback).
 *
 * @example
 * ```tsx
 * <FeatureGuard featureId="recruiting">
 *   <RecruitingDashboard />
 * </FeatureGuard>
 * ```
 *
 * @example Custom fallback
 * ```tsx
 * <FeatureGuard
 *   featureId="matrix-seat-racing"
 *   fallback={<p>Enable Matrix Seat Racing in Settings</p>}
 * >
 *   <MatrixView />
 * </FeatureGuard>
 * ```
 */
export function FeatureGuard({ featureId, children, fallback }: FeatureGuardProps) {
  const isEnabled = useFeature(featureId);

  if (isEnabled) {
    return <>{children}</>;
  }

  // Show custom fallback or default FeatureDiscoveryHint
  return <>{fallback ?? <FeatureDiscoveryHint featureId={featureId} />}</>;
}

/**
 * Hidden variant - renders null when disabled (for navigation items)
 *
 * @example
 * ```tsx
 * <FeatureGuard.Hidden featureId="recruiting">
 *   <NavLink to="/recruiting">Recruiting</NavLink>
 * </FeatureGuard.Hidden>
 * ```
 */
FeatureGuard.Hidden = function FeatureGuardHidden({
  featureId,
  children,
}: Omit<FeatureGuardProps, 'fallback'>) {
  const isEnabled = useFeature(featureId);

  if (!isEnabled) {
    return null;
  }

  return <>{children}</>;
};
