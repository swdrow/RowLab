/**
 * /settings route -- user settings page with integrations and analytics thresholds.
 */
import { useState, useCallback, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { IntegrationsSection } from '@/features/integrations';
import { useAnalyticsSettings, useUpdateAnalyticsSettings } from '@/features/analytics/api';
import { Activity, Save, Check } from 'lucide-react';
import type { AnalyticsSettings } from '@/features/analytics/types';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
  staticData: {
    breadcrumb: 'Settings',
  },
});

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
      <section className="mt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-ink-border/50" />
          <div className="h-64 rounded-xl bg-ink-border/30" />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-accent-copper" />
        <h2 className="text-lg font-semibold text-ink-primary">Analytics Thresholds</h2>
      </div>
      <p className="text-sm text-ink-secondary mb-4">
        Configure your training zones for more accurate performance analytics. Leave blank to use
        defaults.
      </p>

      <div className="rounded-xl border border-ink-border bg-ink-raised p-5 space-y-5">
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
              bg-accent-copper text-ink-inverse hover:bg-accent-copper/90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Thresholds'}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
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
        <label className="text-sm font-medium text-ink-primary">{label}</label>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
      <input
        type={type}
        step={step}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="
          flex-1 px-3 py-2 rounded-lg text-sm
          bg-ink-base border border-ink-border text-ink-primary
          placeholder:text-ink-muted
          focus:outline-none focus:ring-1 focus:ring-accent-copper/50 focus:border-accent-copper
          transition-colors
        "
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SettingsPage                                                        */
/* ------------------------------------------------------------------ */

function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-ink-primary mb-8">Settings</h1>
      <IntegrationsSection />
      <AnalyticsSettingsSection />
    </div>
  );
}
