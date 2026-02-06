import React from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFeaturePreferenceStore } from '@v2/stores/featurePreferenceStore';
import { FEATURE_GROUPS, ALL_FEATURES } from '@v2/types/feature-toggles';
import { FeatureGroupCard } from './FeatureGroupCard';

/**
 * FeaturesSection - Main features management section
 *
 * Features:
 * - Displays all feature groups (core and advanced)
 * - Manages feature toggle state via store
 * - Permission check: only OWNER/ADMIN can edit
 * - Info banner for non-admin users
 */
export const FeaturesSection: React.FC = () => {
  const { activeTeamRole } = useAuth();
  const { enabledFeatures, toggleFeature, isFeatureEnabled } = useFeaturePreferenceStore();

  // Determine if user can edit features
  const canEdit = activeTeamRole === 'OWNER' || activeTeamRole === 'ADMIN';

  // Map features with their enabled state
  const getFeaturesForGroup = (groupId: 'core' | 'advanced') => {
    return ALL_FEATURES
      .filter((feature) => feature.group === groupId)
      .map((feature) => ({
        ...feature,
        enabled: isFeatureEnabled(feature.id),
      }));
  };

  return (
    <div className="space-y-6">
      {/* Non-admin info banner */}
      {!canEdit && (
        <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-txt-primary">
              View Only
            </p>
            <p className="text-sm text-txt-secondary mt-0.5">
              Only team owners and admins can change feature settings.
            </p>
          </div>
        </div>
      )}

      {/* Core Features */}
      <FeatureGroupCard
        group={FEATURE_GROUPS[0]}
        features={getFeaturesForGroup('core')}
        onToggle={toggleFeature}
        canEdit={canEdit}
      />

      {/* Advanced Features */}
      <FeatureGroupCard
        group={FEATURE_GROUPS[1]}
        features={getFeaturesForGroup('advanced')}
        onToggle={toggleFeature}
        canEdit={canEdit}
      />
    </div>
  );
};

export default FeaturesSection;
