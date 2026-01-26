import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FeatureId, ALL_FEATURES } from '@v2/types/feature-toggles';

/**
 * Props for FeatureDiscoveryHint component
 */
interface FeatureDiscoveryHintProps {
  /** Feature ID to display information about */
  featureId: FeatureId;
  /** Optional custom className for styling */
  className?: string;
}

/**
 * FeatureDiscoveryHint Component
 *
 * Displays a hint about a disabled feature with information on how to enable it.
 * Shows feature name, description, and a link to settings.
 *
 * @example
 * ```tsx
 * <FeatureDiscoveryHint featureId="recruiting" />
 * ```
 */
export function FeatureDiscoveryHint({
  featureId,
  className = '',
}: FeatureDiscoveryHintProps) {
  // Look up feature config
  const featureConfig = ALL_FEATURES.find((f) => f.id === featureId);

  // Fallback if feature not found
  if (!featureConfig) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        flex flex-col items-center justify-center
        p-8 rounded-lg
        border-2 border-dashed border-bdr-muted
        bg-bg-muted
        text-center
        ${className}
      `}
    >
      {/* Lock Icon */}
      <div className="mb-4 p-3 rounded-full bg-bg-surface border border-bdr-default">
        <Lock className="w-6 h-6 text-txt-muted" />
      </div>

      {/* Feature Name */}
      <h3 className="text-lg font-semibold text-txt-primary mb-2">
        {featureConfig.name}
      </h3>

      {/* Feature Description */}
      <p className="text-sm text-txt-secondary mb-4 max-w-md">
        {featureConfig.description}
      </p>

      {/* Enable Link */}
      <Link
        to="/app/settings?tab=features"
        className="
          inline-flex items-center gap-2
          px-4 py-2 rounded-lg
          bg-interactive-primary text-button-primary-text
          hover:bg-interactive-primary-hover
          transition-colors duration-150
          font-medium text-sm
        "
      >
        Enable in Settings
      </Link>
    </motion.div>
  );
}
