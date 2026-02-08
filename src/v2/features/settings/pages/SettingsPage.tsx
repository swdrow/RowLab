import { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings, useUpdateSettings } from '@v2/hooks/useSettings';
import { SettingsLayout } from '../components/SettingsLayout';
import { ProfileSection } from '../components/ProfileSection';
import { PreferencesSection } from '../components/PreferencesSection';
import { SecuritySection } from '../components/SecuritySection';
import { IntegrationsSection } from '../components/IntegrationsSection';
import { NotificationsSection } from '../components/NotificationsSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { TeamSection } from '../components/TeamSection';
import { BillingSection } from '../components/BillingSection';
import { SetupChecklist } from '../components/SetupChecklist';
import { LoadingSkeleton, SkeletonLine } from '@v2/components/common';
import { ErrorState } from '@v2/components/common/ErrorState';
import type { SettingsTab, UserProfile, UserPreferences } from '@v2/types/settings';

const validTabs: SettingsTab[] = [
  'profile',
  'preferences',
  'security',
  'integrations',
  'notifications',
  'features',
  'team',
  'billing',
];

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
  const { user, activeTeamRole, isAuthenticated, isInitialized, logout } = useAuth();
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
    return <ErrorState message="Failed to load settings. Please try again." onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              CONFIGURATION
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-ink-secondary mt-2">Manage your team and account settings</p>
          </div>
        </div>
      </div>

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
            <>
              <SetupChecklist />
              <ProfileSection profile={profile} onChange={handleProfileChange} />
            </>
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
          {activeTab === 'integrations' && <IntegrationsSection />}
          {activeTab === 'notifications' && <NotificationsSection />}
          {activeTab === 'features' && <FeaturesSection />}
          {activeTab === 'team' && isOwner && <TeamSection isOwner={isOwner} />}
          {activeTab === 'team' && !isOwner && (
            <div className="rounded-xl bg-ink-raised border border-ink-border p-8 text-center">
              <p className="text-ink-secondary">Team settings are only available to team owners.</p>
            </div>
          )}
          {activeTab === 'billing' && <BillingSection isOwner={isOwner} />}
        </motion.div>
      </SettingsLayout>
    </div>
  );
};

export default SettingsPage;
