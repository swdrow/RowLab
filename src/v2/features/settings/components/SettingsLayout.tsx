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
    <div className="px-6 space-y-6">
      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_CONFIG}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Tab Navigation */}
          <SettingsTabs activeTab={activeTab} onTabChange={onTabChange} isOwner={isOwner} />

          {/* Save Button */}
          {showSaveButton && onSave && (
            <button
              onClick={onSave}
              disabled={!hasChanges || saving}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink-base
                ${
                  hasChanges
                    ? 'bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white shadow-glow-copper hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0'
                    : saved
                      ? 'bg-accent-copper/10 text-accent-copper border border-accent-copper/20'
                      : 'bg-ink-raised text-ink-tertiary border border-ink-border cursor-not-allowed'
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
            <div className="rounded-xl bg-ink-raised border border-ink-border p-6">
              <SkeletonLine width="30%" height={24} />
              <div className="mt-4">
                <SkeletonCard lines={3} />
              </div>
            </div>
            <div className="rounded-xl bg-ink-raised border border-ink-border p-6">
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
