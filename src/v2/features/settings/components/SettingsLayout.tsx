import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, Loader2 } from 'lucide-react';
import { SettingsTabs } from './SettingsTabs';
import { LoadingSkeleton, SkeletonLine, SkeletonCard } from '../../../components/common';
import { SPRING_CONFIG } from '../../../utils/animations';
import type { SettingsTab } from '../../../types/settings';

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  isOwner?: boolean;
  hasChanges?: boolean;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  isOwner = false,
  hasChanges = false,
  onSave,
  saving = false,
  saved = false,
  isLoading = false,
  error = null,
}) => {
  // Determine if save button should be shown (not on billing or integrations tabs)
  const showSaveButton = activeTab !== 'billing' && activeTab !== 'integrations';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_CONFIG}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-txt-primary mb-1 tracking-[-0.02em]">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-txt-secondary">
              Manage your profile, integrations, and team settings
            </p>
          </div>

          {/* Save Button */}
          {showSaveButton && onSave && (
            <button
              onClick={onSave}
              disabled={!hasChanges || saving}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
                transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                ${hasChanges
                  ? 'bg-interactive-primary text-surface border border-interactive-primary hover:shadow-[0_0_20px_rgba(var(--color-interactive-primary-rgb),0.4)] active:scale-[0.98]'
                  : saved
                  ? 'bg-interactive-primary/10 text-interactive-primary border border-interactive-primary/20'
                  : 'bg-surface-elevated/50 text-txt-tertiary border border-bdr-subtle cursor-not-allowed'
                }
              `}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <SettingsTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          isOwner={isOwner}
        />
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SPRING_CONFIG}
            className="p-4 rounded-xl bg-status-error/10 border border-status-error/20"
          >
            <p className="text-sm text-status-error">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton>
          <div className="space-y-6">
            <div className="rounded-xl bg-surface-elevated border border-bdr-subtle p-6">
              <SkeletonLine width="30%" height={24} />
              <div className="mt-4">
                <SkeletonCard lines={3} />
              </div>
            </div>
            <div className="rounded-xl bg-surface-elevated border border-bdr-subtle p-6">
              <SkeletonLine width="40%" height={24} />
              <div className="mt-4">
                <SkeletonLine count={3} />
              </div>
            </div>
          </div>
        </LoadingSkeleton>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="space-y-6"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default SettingsLayout;
