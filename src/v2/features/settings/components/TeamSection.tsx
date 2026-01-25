import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useTeamSettings, useUpdateTeamVisibility } from '../../../hooks/useTeamSettings';
import { useToast } from '../../../contexts/ToastContext';
import { SPRING_CONFIG } from '../../../utils/animations';
import { LoadingSkeleton, SkeletonLine } from '../../../components/common/LoadingSkeleton';
import type { TeamVisibility } from '../../../types/settings';

/**
 * TeamSection - Athlete visibility settings for team owners
 *
 * Allows OWNER role to control what information athletes can see:
 * - Rankings visibility
 * - Other athletes' erg data
 * - Lineup assignments
 *
 * Uses useTeamSettings from 12-02 for data fetching with optimistic updates.
 */

interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * Toggle - Animated switch component
 */
const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, disabled }) => (
  <motion.button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`
      relative w-12 h-7 rounded-full transition-colors
      ${enabled
        ? 'bg-[var(--color-interactive-primary)] shadow-[0_0_12px_var(--color-interactive-primary-glow)]'
        : 'bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]
    `}
    aria-pressed={enabled}
    whileTap={disabled ? {} : { scale: 0.95 }}
  >
    <motion.span
      layout
      transition={SPRING_CONFIG}
      className={`
        absolute top-1 left-1 w-5 h-5 rounded-full shadow
        ${enabled ? 'bg-[var(--color-bg-primary)]' : 'bg-[var(--color-text-tertiary)]'}
      `}
      style={{ x: enabled ? 20 : 0 }}
    />
  </motion.button>
);

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

/**
 * SettingRow - Individual setting with label, description, and control
 */
const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-[var(--color-border-subtle)] last:border-0">
    <div className="flex-1">
      <div className="font-medium text-[var(--color-text-primary)]">{label}</div>
      <div className="text-sm text-[var(--color-text-tertiary)] mt-0.5">{description}</div>
    </div>
    <div className="sm:flex-shrink-0">
      {children}
    </div>
  </div>
);

/**
 * TeamSection component props
 */
interface TeamSectionProps {
  /** Whether the user is a team owner */
  isOwner?: boolean;
}

export const TeamSection: React.FC<TeamSectionProps> = ({ isOwner = true }) => {
  const { visibility, isLoading, error } = useTeamSettings(isOwner);
  const { updateVisibilityAsync, isUpdating } = useUpdateTeamVisibility();
  const { showToast } = useToast();

  /**
   * Handle toggle change with optimistic update
   */
  const handleToggle = async (key: keyof TeamVisibility, value: boolean) => {
    if (!visibility) return;

    try {
      await updateVisibilityAsync({
        ...visibility,
        [key]: value,
      });
      showToast('success', 'Settings saved');
    } catch (err) {
      showToast('error', 'Failed to save settings');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-[var(--color-border-subtle)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-violet)]/10 border border-[var(--color-accent-violet)]/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-[var(--color-accent-violet)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
            Athlete Visibility
          </h3>
        </div>
        {/* Loading skeleton */}
        <div className="p-5 space-y-4">
          <LoadingSkeleton>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-[var(--color-border-subtle)]">
                <div className="flex-1">
                  <SkeletonLine width="60%" height={20} />
                  <SkeletonLine width="80%" height={16} className="mt-2" />
                </div>
                <SkeletonLine width={48} height={28} />
              </div>
              <div className="flex justify-between items-center py-4 border-b border-[var(--color-border-subtle)]">
                <div className="flex-1">
                  <SkeletonLine width="70%" height={20} />
                  <SkeletonLine width="90%" height={16} className="mt-2" />
                </div>
                <SkeletonLine width={48} height={28} />
              </div>
              <div className="flex justify-between items-center py-4">
                <div className="flex-1">
                  <SkeletonLine width="55%" height={20} />
                  <SkeletonLine width="85%" height={16} className="mt-2" />
                </div>
                <SkeletonLine width={48} height={28} />
              </div>
            </div>
          </LoadingSkeleton>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-status-error)]/20 p-6">
        <div className="flex items-center gap-3 text-[var(--color-status-error)]">
          <Users className="w-5 h-5" />
          <span>Failed to load team settings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-[var(--color-border-subtle)]">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-violet)]/10 border border-[var(--color-accent-violet)]/20 flex items-center justify-center shadow-[0_0_15px_var(--color-accent-violet-glow)]">
          <Users className="w-5 h-5 text-[var(--color-accent-violet)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
          Athlete Visibility
        </h3>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-[var(--color-text-secondary)] mb-4">
          Control what information athletes can see about the team and other athletes.
        </p>

        <div className="space-y-1">
          <SettingRow
            label="Athletes Can See Rankings"
            description="Allow athletes to see their ranking position among team members"
          >
            <Toggle
              enabled={visibility?.athletesCanSeeRankings ?? false}
              onChange={(v) => handleToggle('athletesCanSeeRankings', v)}
              disabled={isUpdating}
            />
          </SettingRow>

          <SettingRow
            label="Athletes Can See Others' Erg Data"
            description="Allow athletes to view erg test results of other team members"
          >
            <Toggle
              enabled={visibility?.athletesCanSeeOthersErgData ?? false}
              onChange={(v) => handleToggle('athletesCanSeeOthersErgData', v)}
              disabled={isUpdating}
            />
          </SettingRow>

          <SettingRow
            label="Athletes Can See Lineups"
            description="Allow athletes to view full lineup assignments and boat configurations"
          >
            <Toggle
              enabled={visibility?.athletesCanSeeOthersLineups ?? false}
              onChange={(v) => handleToggle('athletesCanSeeOthersLineups', v)}
              disabled={isUpdating}
            />
          </SettingRow>
        </div>
      </div>
    </div>
  );
};

export default TeamSection;
