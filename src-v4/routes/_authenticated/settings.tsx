/**
 * /settings route -- comprehensive settings page with sidebar navigation.
 * 6 sections: Profile, Notifications, Integrations, Analytics, Privacy, Account.
 * Desktop: sidebar + content grid. Mobile: horizontal scrollable tab bar.
 */
import { useState, useCallback, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import {
  IconUser,
  IconBell,
  IconPlug,
  IconActivity,
  IconShield,
  IconSettings,
  IconSave,
  IconCheck,
} from '@/components/icons';
import { IntegrationsSection } from '@/features/integrations';
import { useAnalyticsSettings, useUpdateAnalyticsSettings } from '@/features/analytics/api';
import { ProfileSection } from '@/features/settings/components/ProfileSection';
import { NotificationsSection } from '@/features/settings/components/NotificationsSection';
import { PrivacySection } from '@/features/settings/components/PrivacySection';
import { AccountSection } from '@/features/settings/components/AccountSection';
import type { AnalyticsSettings } from '@/features/analytics/types';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Settings',
  },
});

/* ------------------------------------------------------------------ */
/* Settings Sections Config                                             */
/* ------------------------------------------------------------------ */

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: IconUser },
  { id: 'notifications', label: 'Notifications', icon: IconBell },
  { id: 'integrations', label: 'Integrations', icon: IconPlug },
  { id: 'analytics', label: 'Analytics', icon: IconActivity },
  { id: 'privacy', label: 'Privacy', icon: IconShield },
  { id: 'account', label: 'Account', icon: IconSettings },
] as const;

type SectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

/* ------------------------------------------------------------------ */
/* Analytics Settings Section                                          */
/* ------------------------------------------------------------------ */

function AnalyticsSettingsSection() {
  const { data: settings, isLoading } = useAnalyticsSettings();
  const updateMutation = useUpdateAnalyticsSettings();

  const [formState, setFormState] = useState<Partial<AnalyticsSettings>>({});
  const [saved, setSaved] = useState(false);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setFormState({
        dateOfBirth: settings.dateOfBirth
          ? new Date(settings.dateOfBirth).toISOString().split('T')[0]
          : null,
        maxHeartRate: settings.maxHeartRate,
        lactateThresholdHR: settings.lactateThresholdHR,
        functionalThresholdPower: settings.functionalThresholdPower,
        tsbAlertThreshold: settings.tsbAlertThreshold,
        acwrAlertThreshold: settings.acwrAlertThreshold,
      });
    }
  }, [settings]);

  const handleChange = useCallback((field: keyof AnalyticsSettings, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]:
        value === ''
          ? null
          : field === 'dateOfBirth'
            ? value
            : field === 'acwrAlertThreshold'
              ? parseFloat(value)
              : parseInt(value, 10),
    }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    updateMutation.mutate(formState, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }, [formState, updateMutation]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-shimmer space-y-4">
          <div className="h-6 w-48 rounded bg-edge-default/50" />
          <div className="h-64 rounded-xl bg-edge-default/30" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <IconActivity className="w-4 h-4 text-accent-teal" />
        <h2 className="text-lg font-display font-semibold text-text-bright">
          Analytics Thresholds
        </h2>
      </div>
      <p className="text-sm text-text-dim mb-4">
        Configure your training zones for more accurate performance analytics. Leave blank to use
        defaults.
      </p>

      <div className="panel rounded-xl p-5 space-y-5">
        {/* Date of Birth */}
        <SettingsField
          label="Date of Birth"
          description="Used to auto-calculate max HR (220 - age)"
          type="date"
          value={formState.dateOfBirth ?? ''}
          onChange={(v) => handleChange('dateOfBirth', v)}
        />

        {/* Max Heart Rate */}
        <SettingsField
          label="Max Heart Rate"
          description="bpm"
          type="number"
          placeholder="185 (default)"
          value={formState.maxHeartRate ?? ''}
          onChange={(v) => handleChange('maxHeartRate', v)}
        />

        {/* Lactate Threshold HR */}
        <SettingsField
          label="Lactate Threshold HR"
          description="bpm"
          type="number"
          placeholder="157 (default)"
          value={formState.lactateThresholdHR ?? ''}
          onChange={(v) => handleChange('lactateThresholdHR', v)}
        />

        {/* FTP */}
        <SettingsField
          label="Functional Threshold Power (FTP)"
          description="watts"
          type="number"
          placeholder="200W (default)"
          value={formState.functionalThresholdPower ?? ''}
          onChange={(v) => handleChange('functionalThresholdPower', v)}
        />

        {/* TSB Alert Threshold */}
        <SettingsField
          label="Overtraining TSB Threshold"
          description="Triggers warning when form drops below this value"
          type="number"
          placeholder="-30 (default)"
          value={formState.tsbAlertThreshold ?? ''}
          onChange={(v) => handleChange('tsbAlertThreshold', v)}
        />

        {/* ACWR Alert Threshold */}
        <SettingsField
          label="Overtraining ACWR Threshold"
          description="Triggers warning when acute:chronic ratio exceeds this"
          type="number"
          step="0.1"
          placeholder="1.5 (default)"
          value={formState.acwrAlertThreshold ?? ''}
          onChange={(v) => handleChange('acwrAlertThreshold', v)}
        />

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              bg-accent-teal text-void-deep hover:bg-accent-teal/90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors cursor-pointer
            "
          >
            {saved ? (
              <>
                <IconCheck className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <IconSave className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Thresholds'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SettingsField                                                        */
/* ------------------------------------------------------------------ */

interface SettingsFieldProps {
  label: string;
  description: string;
  type: 'text' | 'number' | 'date';
  placeholder?: string;
  value: string | number;
  step?: string;
  onChange: (value: string) => void;
}

function SettingsField({
  label,
  description,
  type,
  placeholder,
  value,
  step,
  onChange,
}: SettingsFieldProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <div className="sm:w-56 shrink-0">
        <label className="text-sm font-medium text-text-bright">{label}</label>
        <p className="text-xs text-text-faint">{description}</p>
      </div>
      <input
        type={type}
        step={step}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="
          flex-1 px-3 py-2 rounded-lg text-sm
          bg-void-surface border border-edge-default text-text-bright
          placeholder:text-text-faint
          focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent-teal
          transition-colors
        "
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar Navigation                                                   */
/* ------------------------------------------------------------------ */

function SettingsSidebar({
  activeSection,
  onSelect,
}: {
  activeSection: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav className="hidden lg:flex flex-col gap-1" aria-label="Settings sections">
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={`
              group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
              transition-colors duration-150 cursor-pointer
              ${
                isActive
                  ? 'bg-void-deep text-text-bright font-medium'
                  : 'text-text-dim hover:text-text-bright hover:bg-void-overlay'
              }
            `.trim()}
          >
            {/* Copper left indicator */}
            {isActive && (
              <motion.div
                layoutId="settings-nav-indicator"
                className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent-teal"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="w-4 h-4 shrink-0" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile Tab Bar                                                       */
/* ------------------------------------------------------------------ */

function MobileTabBar({
  activeSection,
  onSelect,
}: {
  activeSection: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav
      className="flex lg:hidden overflow-x-auto gap-1 px-4 py-2 -mx-4 no-scrollbar"
      aria-label="Settings sections"
    >
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap
              transition-colors duration-150 shrink-0 cursor-pointer
              ${
                isActive
                  ? 'bg-accent-teal/10 text-accent-teal font-medium'
                  : 'text-text-dim hover:text-text-bright hover:bg-void-overlay'
              }
            `.trim()}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{section.label}</span>
            {isActive && (
              <motion.div
                layoutId="settings-tab-indicator"
                className="absolute inset-0 rounded-full border border-accent-teal/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Section Content Renderer                                             */
/* ------------------------------------------------------------------ */

function SectionContent({ section }: { section: SectionId }) {
  switch (section) {
    case 'profile':
      return <ProfileSection />;
    case 'notifications':
      return <NotificationsSection />;
    case 'integrations':
      return <IntegrationsSection />;
    case 'analytics':
      return <AnalyticsSettingsSection />;
    case 'privacy':
      return <PrivacySection />;
    case 'account':
      return <AccountSection />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* SettingsPage                                                        */
/* ------------------------------------------------------------------ */

function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('profile');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold text-heading-gradient mb-6">Settings</h1>

      {/* Mobile tab bar */}
      <MobileTabBar activeSection={activeSection} onSelect={setActiveSection} />

      {/* Desktop: sidebar + content grid */}
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 mt-4 lg:mt-0">
        <SettingsSidebar activeSection={activeSection} onSelect={setActiveSection} />

        <div className="min-w-0">
          <SectionContent section={activeSection} />
        </div>
      </div>
    </div>
  );
}
