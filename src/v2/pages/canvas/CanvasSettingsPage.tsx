/**
 * CanvasSettingsPage - Settings with Canvas design language
 *
 * Canvas redesign of SettingsPage with:
 * - CanvasTabs for settings sections
 * - CanvasFormField for all form inputs
 * - CanvasSelect for dropdown selections
 * - CanvasButton for save/cancel actions
 * - CanvasConsoleReadout for status feedback
 * - NO rounded corners, NO card wrappers
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings, useUpdateSettings } from '@v2/hooks/useSettings';
import {
  RuledHeader,
  CanvasTabs,
  CanvasFormField,
  CanvasSelect,
  CanvasButton,
  CanvasConsoleReadout,
} from '@v2/components/canvas';
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

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const CanvasSettingsPage: React.FC = () => {
  // ALL HOOKS MUST BE CALLED FIRST
  const { user, activeTeamRole, isAuthenticated, isInitialized, logout } = useAuth();
  const isOwner = activeTeamRole === 'OWNER';

  // URL-synced tab state
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile'
  );

  // Fetch settings
  const { settings, isLoading, error } = useSettings();
  const { updateSettingsAsync, isUpdating } = useUpdateSettings();

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
  if (!isInitialized || isLoading) {
    return (
      <div className="p-6">
        <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'LOADING SETTINGS' }]} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return (
      <div className="p-6">
        <CanvasConsoleReadout items={[{ label: 'ERROR', value: 'FAILED TO LOAD SETTINGS' }]} />
      </div>
    );
  }

  const handleTabChange = (id: string) => {
    const tab = id as SettingsTab;
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* ============================================ */}
      {/* HEADER — text against void */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between pt-2 pb-6">
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
            Configuration
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Settings
          </h1>
        </div>

        {/* Save button - shown for profile, preferences, security */}
        {(activeTab === 'profile' || activeTab === 'preferences' || activeTab === 'security') && (
          <div className="flex gap-3">
            <CanvasButton
              variant="primary"
              onClick={handleSave}
              disabled={!hasChanges || isUpdating}
            >
              {isUpdating ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
            </CanvasButton>
          </div>
        )}
      </motion.div>

      {/* ============================================ */}
      {/* TABS */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <CanvasTabs
          tabs={[
            { id: 'profile', label: 'Profile' },
            { id: 'preferences', label: 'Preferences' },
            { id: 'security', label: 'Security' },
            { id: 'integrations', label: 'Integrations' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'features', label: 'Features' },
            ...(isOwner ? [{ id: 'team' as const, label: 'Team' }] : []),
            ...(isOwner ? [{ id: 'billing' as const, label: 'Billing' }] : []),
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 space-y-8"
        >
          {/* ============================================ */}
          {/* PROFILE TAB */}
          {/* ============================================ */}
          {activeTab === 'profile' && profile && (
            <>
              <div>
                <RuledHeader>Personal Information</RuledHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <CanvasFormField
                    label="First Name"
                    value={profile.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  />
                  <CanvasFormField
                    label="Last Name"
                    value={profile.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  />
                  <CanvasFormField
                    label="Email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="md:col-span-2"
                  />
                </div>
              </div>

              <div>
                <RuledHeader>Role</RuledHeader>
                <CanvasSelect
                  value={profile.role}
                  onChange={(value) => handleProfileChange('role', value)}
                  options={[
                    { value: 'ATHLETE', label: 'Athlete' },
                    { value: 'COACH', label: 'Coach' },
                    { value: 'COXSWAIN', label: 'Coxswain' },
                  ]}
                />
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* PREFERENCES TAB */}
          {/* ============================================ */}
          {activeTab === 'preferences' && preferences && (
            <>
              <div>
                <RuledHeader>Notifications</RuledHeader>
                <div className="space-y-4 mt-4">
                  <label className="flex items-center gap-3 text-sm text-ink-primary">
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) =>
                        handlePreferencesChange('emailNotifications', e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    Email Notifications
                  </label>
                  <label className="flex items-center gap-3 text-sm text-ink-primary">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) =>
                        handlePreferencesChange('pushNotifications', e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    Push Notifications
                  </label>
                </div>
              </div>

              <div>
                <RuledHeader>Display</RuledHeader>
                <div className="space-y-4 mt-4">
                  <label className="flex items-center gap-3 text-sm text-ink-primary">
                    <input
                      type="checkbox"
                      checked={preferences.darkMode}
                      onChange={(e) => handlePreferencesChange('darkMode', e.target.checked)}
                      className="w-4 h-4"
                    />
                    Dark Mode
                  </label>
                  <label className="flex items-center gap-3 text-sm text-ink-primary">
                    <input
                      type="checkbox"
                      checked={preferences.compactView}
                      onChange={(e) => handlePreferencesChange('compactView', e.target.checked)}
                      className="w-4 h-4"
                    />
                    Compact View
                  </label>
                  <label className="flex items-center gap-3 text-sm text-ink-primary">
                    <input
                      type="checkbox"
                      checked={preferences.autoSave}
                      onChange={(e) => handlePreferencesChange('autoSave', e.target.checked)}
                      className="w-4 h-4"
                    />
                    Auto Save
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* SECURITY TAB */}
          {/* ============================================ */}
          {activeTab === 'security' && profile && (
            <>
              <div>
                <RuledHeader>Password</RuledHeader>
                <div className="space-y-4 mt-4">
                  <CanvasFormField
                    label="Current Password"
                    type="password"
                    value=""
                    onChange={() => {}}
                  />
                  <CanvasFormField
                    label="New Password"
                    type="password"
                    value=""
                    onChange={() => {}}
                  />
                  <CanvasFormField
                    label="Confirm New Password"
                    type="password"
                    value=""
                    onChange={() => {}}
                  />
                </div>
              </div>

              <div>
                <RuledHeader>Account Actions</RuledHeader>
                <div className="space-y-3 mt-4">
                  <CanvasButton variant="ghost" onClick={logout}>
                    Sign Out
                  </CanvasButton>
                </div>
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* OTHER TABS - placeholder */}
          {/* ============================================ */}
          {activeTab === 'integrations' && (
            <CanvasConsoleReadout
              items={[{ label: 'STATUS', value: 'NO INTEGRATIONS CONFIGURED' }]}
            />
          )}
          {activeTab === 'notifications' && (
            <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'NOTIFICATION SETTINGS' }]} />
          )}
          {activeTab === 'features' && (
            <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'FEATURE FLAGS' }]} />
          )}
          {activeTab === 'team' && isOwner && (
            <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'TEAM SETTINGS' }]} />
          )}
          {activeTab === 'team' && !isOwner && (
            <CanvasConsoleReadout
              items={[{ label: 'ACCESS', value: 'TEAM SETTINGS - OWNER ONLY' }]}
            />
          )}
          {activeTab === 'billing' && (
            <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'BILLING SETTINGS' }]} />
          )}
        </motion.div>
      </motion.div>

      {/* ============================================ */}
      {/* STATUS CONSOLE */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <CanvasConsoleReadout
          items={[
            { label: 'TAB', value: activeTab.toUpperCase() },
            {
              label: 'STATUS',
              value: hasChanges ? 'UNSAVED CHANGES' : saved ? 'SAVED' : 'NO CHANGES',
            },
          ]}
        />
      </motion.div>
    </motion.div>
  );
};

export default CanvasSettingsPage;
