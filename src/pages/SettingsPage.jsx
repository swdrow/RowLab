import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { PageContainer } from '../components/Layout';
import {
  User,
  Camera,
  Mail,
  Lock,
  Bell,
  Palette,
  Shield,
  LogOut,
  Save,
  ChevronRight,
  Check,
  Upload,
  Trash2,
  Loader2,
  Plug,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Crown,
  Users,
  UserCog,
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import SpotlightCard from '../components/ui/SpotlightCard';
import { importFitFiles, formatDuration, formatDistance, formatWorkoutType } from '../services/fitImportService';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

// Settings section component
const SettingsSection = ({ title, icon: Icon, children, accentColor = 'green' }) => {
  const colorConfig = {
    green: {
      iconBg: 'bg-blade-blue/10',
      iconBorder: 'border-blade-blue/20',
      iconText: 'text-blade-blue',
      glow: 'shadow-[0_0_15px_rgba(0,112,243,0.15)]',
      spotlight: 'rgba(0, 112, 243, 0.08)'
    },
    violet: {
      iconBg: 'bg-coxswain-violet/10',
      iconBorder: 'border-coxswain-violet/20',
      iconText: 'text-coxswain-violet',
      glow: 'shadow-[0_0_15px_rgba(124,58,237,0.15)]',
      spotlight: 'rgba(124, 58, 237, 0.08)'
    },
    red: {
      iconBg: 'bg-danger-red/10',
      iconBorder: 'border-danger-red/20',
      iconText: 'text-danger-red',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      spotlight: 'rgba(239, 68, 68, 0.08)'
    },
    orange: {
      iconBg: 'bg-warning-orange/10',
      iconBorder: 'border-warning-orange/20',
      iconText: 'text-warning-orange',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      spotlight: 'rgba(245, 158, 11, 0.08)'
    }
  };

  const colors = colorConfig[accentColor] || colorConfig.green;

  return (
    <motion.div variants={fadeInUp}>
      <SpotlightCard
        spotlightColor={colors.spotlight}
        className={`
          rounded-xl
          bg-void-elevated border border-white/5
        `}
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
          <div className={`w-10 h-10 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center ${colors.glow}`}>
            <Icon className={`w-5 h-5 ${colors.iconText}`} />
          </div>
          <h3 className="text-lg font-display font-semibold text-text-primary tracking-[-0.02em]">{title}</h3>
        </div>
        <div className="p-5 space-y-4">
          {children}
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

// Setting row component
const SettingRow = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-white/[0.04] last:border-0">
    <div className="flex-1">
      <div className="font-medium text-text-primary">{label}</div>
      {description && (
        <div className="text-sm text-text-muted mt-0.5">{description}</div>
      )}
    </div>
    <div className="sm:flex-shrink-0">
      {children}
    </div>
  </div>
);

// Toggle switch component
const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative w-12 h-7 rounded-full transition-all duration-200 ${
      enabled
        ? 'bg-blade-blue shadow-[0_0_12px_rgba(0,112,243,0.4)]'
        : 'bg-void-elevated border border-white/[0.06]'
    }`}
  >
    <span
      className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        enabled ? 'translate-x-5 bg-void-deep' : 'translate-x-0 bg-text-muted'
      }`}
    />
  </button>
);

// Input field component
const InputField = ({ type = 'text', value, onChange, placeholder, className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`
      px-4 py-3 rounded-xl
      bg-void-elevated/50 border border-white/[0.06]
      text-text-primary placeholder:text-text-muted
      focus:outline-none focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)]
      transition-all
      ${className}
    `}
  />
);

const API_URL = '/api/v1';

// Tab navigation component
const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
      ${active
        ? 'bg-blade-blue/10 text-blade-blue border border-blade-blue/20 shadow-[0_0_12px_rgba(0,112,243,0.15)]'
        : 'text-text-secondary hover:text-text-primary hover:bg-void-elevated/50 border border-transparent'
      }
    `}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

// Usage progress bar component (for billing section)
const UsageBar = ({ label, used, limit, icon: Icon }) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-secondary">{label}</span>
        </div>
        <span className={`text-sm font-mono ${isAtLimit ? 'text-danger-red' : isNearLimit ? 'text-warning-orange' : 'text-text-muted'}`}>
          {used} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-void-elevated rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-danger-red' : isNearLimit ? 'bg-warning-orange' : 'bg-blade-blue'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-warning-orange flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Approaching limit - consider upgrading
        </p>
      )}
      {isAtLimit && (
        <p className="text-xs text-danger-red flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Limit reached - upgrade to add more
        </p>
      )}
    </div>
  );
};

function SettingsPage() {
  const { user, accessToken, activeTeamRole } = useAuthStore();
  const {
    subscription,
    usage,
    loading: billingLoading,
    error: billingError,
    fetchSubscription,
    openPortal,
    clearError,
  } = useSubscriptionStore();

  // Get query params for tab navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  // Active tab state
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');

  // User profile state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    role: '',
    avatar: null
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    compactView: false,
    autoSave: true
  });

  // Integrations state
  const [integrations, setIntegrations] = useState({
    concept2Connected: false,
    concept2Username: '',
    concept2LastSynced: null,
    concept2SyncEnabled: false,
    stravaConnected: false,
    stravaUsername: '',
    stravaLastSynced: null,
    stravaSyncEnabled: false,
    trainingPeaksConnected: false
  });

  // Team visibility settings (OWNER only)
  const [teamVisibility, setTeamVisibility] = useState({
    athletesCanSeeRankings: true,
    athletesCanSeeOthersErgData: true,
    athletesCanSeeOthersLineups: true,
  });
  const [teamSettingsLoading, setTeamSettingsLoading] = useState(false);
  const [teamSettingsSaved, setTeamSettingsSaved] = useState(false);

  // Form change tracker
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIT Import state
  const [fitImporting, setFitImporting] = useState(false);
  const [fitResults, setFitResults] = useState(null);

  // Check if user is team owner
  const isOwner = activeTeamRole === 'OWNER';

  // Load settings on mount (only when authenticated)
  useEffect(() => {
    if (!accessToken) return;

    loadSettings();
    fetchC2Status();
    fetchStravaStatus();
    if (isOwner) {
      fetchSubscription();
      fetchTeamSettings();
    }
  }, [accessToken, isOwner, fetchSubscription]);

  // Check for OAuth success from URL params (redirect-based flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stravaStatus = params.get('strava');
    const stravaMessage = params.get('message');

    if (stravaStatus === 'success') {
      fetchStravaStatus();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + '?tab=integrations');
    } else if (stravaStatus === 'error') {
      setError(stravaMessage || 'Failed to connect Strava');
      window.history.replaceState({}, '', window.location.pathname + '?tab=integrations');
    }
  }, []);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify origin matches our app
      if (event.origin !== window.location.origin) return;

      const { type, username, error: oauthError } = event.data || {};

      if (type === 'c2_oauth_success') {
        // Refresh C2 status after successful connection
        fetchC2Status();
      } else if (type === 'c2_oauth_error') {
        setError(oauthError || 'Failed to connect Concept2');
      } else if (type === 'strava_oauth_success') {
        fetchStravaStatus();
      } else if (type === 'strava_oauth_error') {
        setError(oauthError || 'Failed to connect Strava');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl && ['profile', 'preferences', 'security', 'integrations', 'team', 'billing'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to load settings');
      }

      const settings = data.data;

      // Update profile state
      setProfile({
        firstName: settings.firstName || '',
        lastName: settings.lastName || '',
        email: user?.email || '',
        role: settings.role || '',
        avatar: settings.avatar || null
      });

      // Update preferences state
      setPreferences({
        emailNotifications: settings.emailNotifications ?? true,
        pushNotifications: settings.pushNotifications ?? false,
        darkMode: settings.darkMode ?? true,
        compactView: settings.compactView ?? false,
        autoSave: settings.autoSave ?? true
      });

      // Update integrations state (mock data for now)
      setIntegrations({
        concept2Connected: settings.concept2Connected ?? false,
        concept2Username: settings.concept2Username ?? '',
        stravaConnected: settings.stravaConnected ?? false,
        trainingPeaksConnected: settings.trainingPeaksConnected ?? false
      });

      setLoading(false);
    } catch (err) {
      console.error('Load settings error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        avatar: profile.avatar,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        darkMode: preferences.darkMode,
        compactView: preferences.compactView,
        autoSave: preferences.autoSave
      };

      const res = await fetch(`${API_URL}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save settings');
      }

      setSaving(false);
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProfileChange('avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await openPortal();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Failed to open portal:', result.error);
      }
    } catch (err) {
      console.error('Failed to manage billing:', err);
    }
  };

  // Fetch Concept2 connection status
  const fetchC2Status = async () => {
    try {
      const res = await fetch(`${API_URL}/concept2/status/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIntegrations(prev => ({
          ...prev,
          concept2Connected: data.data.connected,
          concept2Username: data.data.username || '',
          concept2LastSynced: data.data.lastSyncedAt,
          concept2SyncEnabled: data.data.syncEnabled,
        }));
      }
    } catch (err) {
      console.error('Fetch C2 status error:', err);
    }
  };

  const handleConnectConcept2 = async () => {
    try {
      // Call backend API to get dynamically generated OAuth URL
      // Backend uses authenticated user's ID automatically
      const res = await fetch(`${API_URL}/concept2/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to get authorization URL');
      }

      // Open OAuth URL in sized popup window (not new tab)
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        data.data.url,
        'concept2_oauth',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`
      );
    } catch (err) {
      console.error('Connect Concept2 error:', err);
      setError(err.message);
    }
  };

  const handleDisconnectConcept2 = async () => {
    try {
      const res = await fetch(`${API_URL}/concept2/disconnect/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to disconnect Concept2');
      }

      setIntegrations(prev => ({
        ...prev,
        concept2Connected: false,
        concept2Username: '',
        concept2LastSynced: null,
        concept2SyncEnabled: false,
      }));
    } catch (err) {
      console.error('Disconnect Concept2 error:', err);
      setError(err.message);
    }
  };

  // Fetch Strava connection status
  const fetchStravaStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/strava/status/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIntegrations(prev => ({
          ...prev,
          stravaConnected: data.data.connected,
          stravaUsername: data.data.username || '',
          stravaLastSynced: data.data.lastSyncedAt,
          stravaSyncEnabled: data.data.syncEnabled,
        }));
      }
    } catch (err) {
      console.error('Fetch Strava status error:', err);
    }
  };

  const handleConnectStrava = async () => {
    try {
      const res = await fetch(`${API_URL}/strava/auth-url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to get authorization URL');
      }

      // Open OAuth URL in sized popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        data.data.authUrl,
        'strava_oauth',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`
      );
    } catch (err) {
      console.error('Connect Strava error:', err);
      setError(err.message);
    }
  };

  const handleDisconnectStrava = async () => {
    try {
      const res = await fetch(`${API_URL}/strava/disconnect/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to disconnect Strava');
      }

      setIntegrations(prev => ({
        ...prev,
        stravaConnected: false,
        stravaUsername: '',
        stravaLastSynced: null,
        stravaSyncEnabled: false,
      }));
    } catch (err) {
      console.error('Disconnect Strava error:', err);
      setError(err.message);
    }
  };

  const handleSyncStrava = async () => {
    try {
      const res = await fetch(`${API_URL}/strava/sync/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Sync failed');
      }

      // Refresh status after sync
      await fetchStravaStatus();

      // Show success message
      console.log('Strava sync complete:', data.data);
    } catch (err) {
      console.error('Strava sync error:', err);
      setError(err.message);
    }
  };

  // Handle FIT file import
  const handleFitImport = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setFitImporting(true);
    setFitResults(null);
    setError(null);

    try {
      const results = await importFitFiles(files);
      setFitResults(results);

      // Clear the file input
      event.target.value = '';
    } catch (err) {
      console.error('FIT import error:', err);
      setError(err.message);
    } finally {
      setFitImporting(false);
    }
  };

  // Fetch team visibility settings (OWNER only)
  const fetchTeamSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/team`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTeamVisibility(data.data.visibility);
      }
    } catch (err) {
      console.error('Fetch team settings error:', err);
    }
  };

  // Save team visibility settings
  const handleTeamVisibilityChange = async (key, value) => {
    try {
      setTeamSettingsLoading(true);

      const newVisibility = { ...teamVisibility, [key]: value };
      setTeamVisibility(newVisibility);

      const res = await fetch(`${API_URL}/settings/team`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ visibility: newVisibility }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save team settings');
      }

      setTeamSettingsSaved(true);
      setTimeout(() => setTeamSettingsSaved(false), 2000);
    } catch (err) {
      console.error('Save team settings error:', err);
      setError(err.message);
      // Revert on error
      fetchTeamSettings();
    } finally {
      setTeamSettingsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer maxWidth="md" className="relative py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-blade-blue animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="md" className="relative py-4 sm:py-6">
      {/* Background atmosphere - void glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-coxswain-violet/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary mb-1 tracking-[-0.02em]">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-text-secondary">
              Manage your profile, integrations, and team settings
            </p>
          </div>
          {activeTab !== 'billing' && activeTab !== 'integrations' && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
                transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                ${hasChanges
                  ? 'bg-blade-blue text-void-deep border border-blade-blue hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] active:scale-[0.98]'
                  : saved
                  ? 'bg-blade-blue/10 text-blade-blue border border-blade-blue/20'
                  : 'bg-void-elevated/50 text-text-muted border border-white/[0.06] cursor-not-allowed'
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
        <div className="flex flex-wrap gap-2">
          <TabButton active={activeTab === 'profile'} onClick={() => handleTabChange('profile')} icon={User}>
            Profile
          </TabButton>
          <TabButton active={activeTab === 'preferences'} onClick={() => handleTabChange('preferences')} icon={Palette}>
            Preferences
          </TabButton>
          <TabButton active={activeTab === 'security'} onClick={() => handleTabChange('security')} icon={Shield}>
            Security
          </TabButton>
          <TabButton active={activeTab === 'integrations'} onClick={() => handleTabChange('integrations')} icon={Plug}>
            Integrations
          </TabButton>
          {isOwner && (
            <TabButton active={activeTab === 'team'} onClick={() => handleTabChange('team')} icon={Users}>
              Team
            </TabButton>
          )}
          {isOwner && (
            <TabButton active={activeTab === 'billing'} onClick={() => handleTabChange('billing')} icon={CreditCard}>
              Billing
            </TabButton>
          )}
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-danger-red/10 border border-danger-red/20"
        >
          <p className="text-sm text-danger-red">{error}</p>
        </motion.div>
      )}

      {/* Settings Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <SettingsSection title="Profile" icon={User} accentColor="green">
          {/* Avatar */}
          <div className="flex items-center gap-6 pb-4 border-b border-white/[0.04]">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-blade-blue/20 border border-blade-blue/30 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,112,243,0.15)]">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-display font-bold text-blade-blue">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-void-deep/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                <Camera className="w-6 h-6 text-blade-blue" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-text-primary">
                {profile.firstName} {profile.lastName}
              </h4>
              <p className="text-text-secondary">{profile.role}</p>
              <div className="flex gap-2 mt-3">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-void-elevated/50 border border-white/[0.06] text-sm text-text-secondary hover:bg-void-elevated hover:border-white/10 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {profile.avatar && (
                  <button
                    onClick={() => handleProfileChange('avatar', null)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-danger-red/10 border border-danger-red/20 text-sm text-danger-red hover:bg-danger-red/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                First Name
              </label>
              <InputField
                type="text"
                value={profile.firstName}
                onChange={(e) => handleProfileChange('firstName', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
                Last Name
              </label>
              <InputField
                type="text"
                value={profile.lastName}
                onChange={(e) => handleProfileChange('lastName', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
              Role / Title
            </label>
            <InputField
              type="text"
              value={profile.role}
              onChange={(e) => handleProfileChange('role', e.target.value)}
              placeholder="e.g., Head Coach, Assistant Coach"
              className="w-full"
            />
          </div>
        </SettingsSection>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <>
            {/* Notifications Section */}
            <SettingsSection title="Notifications" icon={Bell} accentColor="orange">
              <SettingRow
                label="Email Notifications"
                description="Receive updates about your team via email"
              >
                <Toggle
                  enabled={preferences.emailNotifications}
                  onChange={(v) => handlePreferenceChange('emailNotifications', v)}
                />
              </SettingRow>

              <SettingRow
                label="Push Notifications"
                description="Get instant alerts on your device"
              >
                <Toggle
                  enabled={preferences.pushNotifications}
                  onChange={(v) => handlePreferenceChange('pushNotifications', v)}
                />
              </SettingRow>
            </SettingsSection>

            {/* Appearance Section */}
            <SettingsSection title="Appearance" icon={Palette} accentColor="green">
              <SettingRow
                label="Dark Mode"
                description="Use dark theme across the app"
              >
                <Toggle
                  enabled={preferences.darkMode}
                  onChange={(v) => handlePreferenceChange('darkMode', v)}
                />
              </SettingRow>

              <SettingRow
                label="Compact View"
                description="Show more content with reduced spacing"
              >
                <Toggle
                  enabled={preferences.compactView}
                  onChange={(v) => handlePreferenceChange('compactView', v)}
                />
              </SettingRow>

              <SettingRow
                label="Auto-Save"
                description="Automatically save changes as you work"
              >
                <Toggle
                  enabled={preferences.autoSave}
                  onChange={(v) => handlePreferenceChange('autoSave', v)}
                />
              </SettingRow>
            </SettingsSection>
          </>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <SettingsSection title="Email & Security" icon={Mail} accentColor="violet">
          <SettingRow
            label="Email Address"
            description="Used for account recovery and notifications"
          >
            <InputField
              type="email"
              value={profile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              className="w-full sm:w-64"
            />
          </SettingRow>

          <SettingRow
            label="Change Password"
            description="Update your account password"
          >
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-secondary hover:bg-void-elevated hover:border-white/10 transition-all">
              <Lock className="w-4 h-4" />
              Change
              <ChevronRight className="w-4 h-4" />
            </button>
          </SettingRow>

          <SettingRow
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
          >
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-secondary hover:bg-void-elevated hover:border-white/10 transition-all">
              <Shield className="w-4 h-4" />
              Setup
              <ChevronRight className="w-4 h-4" />
            </button>
          </SettingRow>
        </SettingsSection>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <>
            <SettingsSection title="Concept2 Logbook" icon={Plug} accentColor="green">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-void-elevated/30 border border-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blade-blue/20 border border-blade-blue/30 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blade-blue" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Concept2 Logbook</h4>
                      {integrations.concept2Connected ? (
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blade-blue" />
                            <span className="text-sm text-blade-blue">Connected as {integrations.concept2Username}</span>
                          </div>
                          {integrations.concept2LastSynced && (
                            <p className="text-xs text-text-muted">
                              Last synced: {new Date(integrations.concept2LastSynced).toLocaleDateString()} at{' '}
                              {new Date(integrations.concept2LastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted mt-1">Import erg data automatically</p>
                      )}
                    </div>
                  </div>
                  {integrations.concept2Connected ? (
                    <button
                      onClick={handleDisconnectConcept2}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red hover:bg-danger-red/20 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectConcept2}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blade-blue text-void-deep border border-blade-blue hover:shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-all"
                    >
                      <Plug className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-muted">
                  Connect your Concept2 Logbook to automatically import erg test results into RowLab.
                </p>
              </div>
            </SettingsSection>

            <SettingsSection title="Strava" icon={Plug} accentColor="orange">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-void-elevated/30 border border-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning-orange/20 border border-warning-orange/30 flex items-center justify-center">
                      <span className="text-xl">🏃</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Strava Activities</h4>
                      {integrations.stravaConnected ? (
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-warning-orange" />
                            <span className="text-sm text-warning-orange">Connected as {integrations.stravaUsername}</span>
                          </div>
                          {integrations.stravaLastSynced && (
                            <p className="text-xs text-text-muted">
                              Last synced: {new Date(integrations.stravaLastSynced).toLocaleDateString()} at{' '}
                              {new Date(integrations.stravaLastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted mt-1">Sync rowing and training activities</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.stravaConnected && (
                      <button
                        onClick={handleSyncStrava}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-void-elevated/50 border border-white/[0.06] text-text-secondary hover:bg-void-elevated hover:border-white/10 transition-all"
                      >
                        Sync Now
                      </button>
                    )}
                    {integrations.stravaConnected ? (
                      <button
                        onClick={handleDisconnectStrava}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red hover:bg-danger-red/20 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectStrava}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning-orange text-void-deep border border-warning-orange hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                      >
                        <Plug className="w-4 h-4" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-muted">
                  Connect Strava to automatically import rowing activities, cross-training, and other workouts.
                </p>
              </div>
            </SettingsSection>

            <SettingsSection title="Coming Soon" icon={Plug} accentColor="violet">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-void-elevated/30 border border-white/[0.04] opacity-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-coxswain-violet/20 border border-coxswain-violet/30 flex items-center justify-center">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">TrainingPeaks</h4>
                      <p className="text-sm text-text-muted">Import training plans</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-text-muted px-3 py-1 rounded-full bg-void-elevated border border-white/[0.06]">
                    Coming Soon
                  </span>
                </div>

              </div>
            </SettingsSection>

            <SettingsSection title="Garmin .FIT Import" icon={Upload} accentColor="green">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-void-elevated/30 border border-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success-green/20 border border-success-green/30 flex items-center justify-center">
                      <span className="text-xl">⌚</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Import .FIT Files</h4>
                      <p className="text-sm text-text-muted">Upload files from Garmin, Polar, Suunto, Wahoo, or Concept2</p>
                    </div>
                  </div>
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                    fitImporting
                      ? 'bg-void-elevated/50 border border-white/[0.06] text-text-muted'
                      : 'bg-success-green text-void-deep border border-success-green hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  }`}>
                    {fitImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Select Files
                      </>
                    )}
                    <input
                      type="file"
                      accept=".fit"
                      multiple
                      onChange={handleFitImport}
                      disabled={fitImporting}
                      className="hidden"
                    />
                  </label>
                </div>

                {fitResults && (
                  <div className="p-4 rounded-xl bg-void-elevated/30 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-success-green" />
                      <span className="font-medium text-text-primary">
                        Imported {fitResults.imported} workout{fitResults.imported !== 1 ? 's' : ''}
                      </span>
                      {fitResults.failed > 0 && (
                        <span className="text-sm text-warning-orange">
                          ({fitResults.failed} failed)
                        </span>
                      )}
                    </div>

                    {fitResults.results.imported.length > 0 && (
                      <div className="space-y-2">
                        {fitResults.results.imported.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-void-deep/30">
                            <div className="flex items-center gap-3">
                              <span className="text-xs px-2 py-1 rounded bg-success-green/10 text-success-green border border-success-green/20">
                                {formatWorkoutType(item.type)}
                              </span>
                              <span className="text-sm text-text-secondary truncate max-w-[200px]">
                                {item.filename}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-text-muted">
                              <span>{formatDuration(item.duration)}</span>
                              <span>{formatDistance(item.distance)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {fitResults.results.failed.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-text-muted">Failed imports:</p>
                        {fitResults.results.failed.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-danger-red/5 border border-danger-red/10">
                            <XCircle className="w-4 h-4 text-danger-red flex-shrink-0" />
                            <span className="text-sm text-text-secondary truncate">{item.filename}</span>
                            <span className="text-xs text-danger-red">{item.error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-sm text-text-muted">
                  Import .FIT files directly from your fitness devices. Supports rowing, running, cycling, and cross-training activities.
                </p>
              </div>
            </SettingsSection>
          </>
        )}

        {/* Team Tab (OWNER only) */}
        {activeTab === 'team' && isOwner && (
          <SettingsSection title="Athlete Visibility" icon={Users} accentColor="violet">
            <div className="space-y-1 mb-4">
              <p className="text-text-secondary">
                Control what information athletes can see about the team and other athletes.
              </p>
              {teamSettingsSaved && (
                <p className="text-sm text-blade-blue flex items-center gap-1">
                  <Check className="w-4 h-4" /> Settings saved
                </p>
              )}
            </div>

            <SettingRow
              label="Athletes Can See Rankings"
              description="Allow athletes to see their ranking position among team members"
            >
              <Toggle
                enabled={teamVisibility.athletesCanSeeRankings}
                onChange={(v) => handleTeamVisibilityChange('athletesCanSeeRankings', v)}
              />
            </SettingRow>

            <SettingRow
              label="Athletes Can See Others' Erg Data"
              description="Allow athletes to view erg test results of other team members"
            >
              <Toggle
                enabled={teamVisibility.athletesCanSeeOthersErgData}
                onChange={(v) => handleTeamVisibilityChange('athletesCanSeeOthersErgData', v)}
              />
            </SettingRow>

            <SettingRow
              label="Athletes Can See Lineups"
              description="Allow athletes to view full lineup assignments and boat configurations"
            >
              <Toggle
                enabled={teamVisibility.athletesCanSeeOthersLineups}
                onChange={(v) => handleTeamVisibilityChange('athletesCanSeeOthersLineups', v)}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && isOwner && (
          <>
            {/* Current Plan */}
            <SettingsSection title="Current Plan" icon={Crown} accentColor="violet">
              {billingLoading && !subscription ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-coxswain-violet animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-void-elevated/30 border border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-coxswain-violet/20 border border-coxswain-violet/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                        <Crown className="w-8 h-8 text-coxswain-violet" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-xl font-display font-bold text-text-primary">
                            {subscription?.planId ? subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1) : 'Free'}
                          </h4>
                          {subscription?.status && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blade-blue/10 text-blade-blue border border-blade-blue/20">
                              {subscription.status.replace('_', ' ').charAt(0).toUpperCase() + subscription.status.slice(1).replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {subscription?.currentPeriodEnd && subscription?.planId !== 'free' && (
                          <p className="text-sm text-text-muted">
                            Next billing: {formatDate(subscription.currentPeriodEnd)}
                          </p>
                        )}
                      </div>
                    </div>
                    {subscription?.planId !== 'free' && (
                      <button
                        onClick={handleManageBilling}
                        disabled={billingLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-void-elevated/50 text-text-secondary border border-white/[0.06] hover:bg-void-elevated hover:border-white/10 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              )}
            </SettingsSection>

            {/* Usage Stats */}
            <SettingsSection title="Usage" icon={BarChart3} accentColor="green">
              {billingLoading && !usage ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blade-blue animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <UsageBar
                    label="Athletes"
                    used={usage?.athletes?.used || 0}
                    limit={usage?.athletes?.limit || 15}
                    icon={Users}
                  />
                  <UsageBar
                    label="Coaches"
                    used={usage?.coaches?.used || 0}
                    limit={usage?.coaches?.limit || 1}
                    icon={UserCog}
                  />
                </div>
              )}
            </SettingsSection>

            {/* Upgrade Options */}
            <SettingsSection title="Upgrade" icon={CreditCard} accentColor="orange">
              <div className="space-y-3">
                <p className="text-text-secondary">
                  Unlock more features and increase your team capacity.
                </p>
                <a
                  href="/app/billing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blade-blue text-void-deep border border-blade-blue hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
                >
                  View All Plans
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </SettingsSection>
          </>
        )}

        {/* Show message if user tries to access billing but is not owner */}
        {activeTab === 'billing' && !isOwner && (
          <motion.div variants={fadeInUp}>
            <SpotlightCard
              spotlightColor="rgba(245, 158, 11, 0.08)"
              className="rounded-xl p-8 text-center bg-void-elevated border border-warning-orange/20"
            >
              <AlertTriangle className="w-12 h-12 text-warning-orange mx-auto mb-4" />
              <h2 className="text-xl font-display font-semibold text-text-primary mb-2">Access Restricted</h2>
              <p className="text-text-secondary">
                Only team owners can manage billing and subscription settings.
                Please contact your team owner to make changes.
              </p>
            </SpotlightCard>
          </motion.div>
        )}

        {/* Danger Zone - shown on security tab */}
        {activeTab === 'security' && (
          <motion.div variants={fadeInUp}>
          <SpotlightCard
            spotlightColor="rgba(239, 68, 68, 0.08)"
            className={`
              rounded-xl
              bg-void-elevated border border-danger-red/20
            `}
          >
            <div className="flex items-center gap-3 p-5 border-b border-danger-red/10 bg-danger-red/5">
              <div className="w-10 h-10 rounded-xl bg-danger-red/10 border border-danger-red/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <LogOut className="w-5 h-5 text-danger-red" />
              </div>
              <h3 className="text-lg font-display font-semibold text-text-primary tracking-[-0.02em]">Danger Zone</h3>
            </div>
            <div className="p-5">
              <SettingRow
                label="Sign Out"
                description="Sign out of your account on this device"
              >
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red hover:bg-danger-red/20 transition-all">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </SettingRow>

              <SettingRow
                label="Delete Account"
                description="Permanently delete your account and all data"
              >
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger-red/30 text-danger-red hover:bg-danger-red/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </SettingRow>
            </div>
          </SpotlightCard>
        </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
}

export default SettingsPage;
