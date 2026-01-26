import { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { useSettings, useUpdateSettings } from '@v2/hooks/useSettings';
import { SettingsLayout } from '../components/SettingsLayout';
import { ProfileSection } from '../components/ProfileSection';
import { PreferencesSection } from '../components/PreferencesSection';
import { SecuritySection } from '../components/SecuritySection';
import { IntegrationsSection } from '../components/IntegrationsSection';
import { TeamSection } from '../components/TeamSection';
import { BillingSection } from '../components/BillingSection';
import { LoadingSkeleton, SkeletonLine } from '@v2/components/common';
import { ErrorState } from '@v2/components/common/ErrorState';
import type { SettingsTab, UserProfile, UserPreferences } from '@v2/types/settings';

const validTabs: SettingsTab[] = ['profile', 'preferences', 'security', 'integrations', 'team', 'billing'];

/**
 * SettingsPage - Main settings page with URL-synced tabs
 *
 * Features:
 * - Six tabs: Profile, Preferences, Security, Integrations, Team, Billing
 * - URL-synced tab state via query param (?tab=profile)
 * - Local form state for profile and preferences
 * - Save button with optimistic updates (disabled when no changes)
 * - Loading skeleton and error states
 * - Framer Motion tab transitions
 */
export const SettingsPage: React.FC = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user, activeTeamRole, isAuthenticated, isInitialized } = useAuthStore();
  const isOwner = activeTeamRole === 'OWNER';

  // URL-synced tab state
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile'
  );

  // Fetch settings
  const { settings, isLoading, error, refetch } = useSettings();
  const { updateSettingsAsync, isUpdating, updateError } = useUpdateSettings();

  // Local form state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize form state from fetched data
  useEffect(() => {
    if (settings) {
      setProfile({
        firstName: settings.firstName,
        lastName: settings.lastName,
        email: user?.email || '',
        role: settings.role,
        avatar: settings.avatar,
      });
      setPreferences({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        darkMode: settings.darkMode,
        compactView: settings.compactView,
        autoSave: settings.autoSave,
      });
      // Reset change tracking when settings load
      setHasChanges(false);
      setSaved(false);
    }
  }, [settings, user]);

  // Sync tab with URL
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  // CONDITIONAL RETURNS - after all hooks
  // Show loading while auth initializes
  if (!isInitialized) {
    return (
      <div className="p-6">
        <LoadingSkeleton>
          <div className="space-y-4">
            <SkeletonLine height={40} />
            <SkeletonLine height={200} />
          </div>
        </LoadingSkeleton>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleProfileChange = (field: keyof UserProfile, value: string | null) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
      setHasChanges(true);
      setSaved(false);
    }
  };

  const handlePreferencesChange = (field: keyof UserPreferences, value: boolean) => {
    if (preferences) {
      setPreferences({ ...preferences, [field]: value });
      setHasChanges(true);
      setSaved(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !preferences) return;
    try {
      await updateSettingsAsync({
        ...profile,
        ...preferences,
      });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleSignOut = () => {
    // Use the auth store's logout method
    const { logout } = useAuthStore.getState();
    logout();
  };

  const handleDeleteAccount = () => {
    // Show confirmation dialog (to be implemented)
    console.log('Delete account requested');
  };

  if (isLoading) {
    return (
      <SettingsLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOwner={isOwner}
        hasChanges={false}
        onSave={() => {}}
        saving={false}
        saved={false}
      >
        <LoadingSkeleton>
          <div className="space-y-4">
            <SkeletonLine height={40} />
            <SkeletonLine height={200} />
            <SkeletonLine height={150} />
          </div>
        </LoadingSkeleton>
      </SettingsLayout>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load settings. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <SettingsLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isOwner={isOwner}
      hasChanges={hasChanges}
      onSave={handleSave}
      saving={isUpdating}
      saved={saved}
      error={updateError?.message}
    >
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'profile' && profile && (
          <ProfileSection profile={profile} onChange={handleProfileChange} />
        )}
        {activeTab === 'preferences' && preferences && (
          <PreferencesSection preferences={preferences} onChange={handlePreferencesChange} />
        )}
        {activeTab === 'security' && profile && (
          <SecuritySection
            email={profile.email}
            onEmailChange={(v) => handleProfileChange('email', v)}
            onSignOut={handleSignOut}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
        {activeTab === 'integrations' && (
          <IntegrationsSection />
        )}
        {activeTab === 'team' && isOwner && (
          <TeamSection isOwner={isOwner} />
        )}
        {activeTab === 'team' && !isOwner && (
          <div className="rounded-xl bg-surface-elevated border border-status-warning/20 p-8 text-center">
            <p className="text-txt-secondary">
              Team settings are only available to team owners.
            </p>
          </div>
        )}
        {activeTab === 'billing' && (
          <BillingSection isOwner={isOwner} />
        )}
      </motion.div>
    </SettingsLayout>
  );
};

export default SettingsPage;
