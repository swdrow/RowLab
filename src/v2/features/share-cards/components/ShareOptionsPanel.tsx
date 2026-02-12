/**
 * ShareOptionsPanel - Live option toggles for share card generation
 * Phase 38-04
 *
 * Features:
 * - Format selector (1:1 Square / 9:16 Story)
 * - Show Name toggle
 * - Branding selector (Personal / Team) — hidden if no teams
 * - Team selector — shown when brandingType === 'team' AND multiple teams
 * - Link Back selector (None / QR Code / URL)
 *
 * Design: Canvas design system with segmented controls and toggle switches
 */

import React from 'react';

interface Team {
  id: string;
  name: string;
  role: string;
}

interface ShareOptions {
  showName: boolean;
  brandingType: 'personal' | 'team';
  teamId: string | null;
  qrCode: boolean;
  printUrl: boolean;
  format: '1:1' | '9:16';
}

interface ShareOptionsPanelProps {
  options: ShareOptions;
  onOptionsChange: (key: keyof ShareOptions, value: any) => void;
  userTeams: Team[];
  format: '1:1' | '9:16';
  onFormatChange: (format: '1:1' | '9:16') => void;
}

/**
 * Segmented control component (Canvas design)
 */
function SegmentedControl({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-txt-secondary mb-2">{label}</label>
      <div className="inline-flex rounded-xl bg-bg-surface-elevated/50 border border-bdr-subtle p-1 gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                value === option.value
                  ? 'bg-interactive-primary text-txt-inverse shadow-sm'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Toggle switch component (Canvas design)
 */
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-txt-secondary">{label}</label>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors
          ${checked ? 'bg-interactive-primary' : 'bg-bg-surface-elevated/50 border border-bdr-subtle'}
        `}
      >
        <span
          className={`
            absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

/**
 * ShareOptionsPanel - Canvas-styled option controls
 */
export function ShareOptionsPanel({
  options,
  onOptionsChange,
  userTeams,
  format,
  onFormatChange,
}: ShareOptionsPanelProps) {
  const hasTeams = userTeams.length > 0;
  const hasMultipleTeams = userTeams.length > 1;

  // Link back mode: derive from qrCode/printUrl flags
  const linkBackMode = options.qrCode ? 'qr' : options.printUrl ? 'url' : 'none';

  const handleLinkBackChange = (mode: string) => {
    onOptionsChange('qrCode', mode === 'qr');
    onOptionsChange('printUrl', mode === 'url');
  };

  return (
    <div className="space-y-6 p-6 rounded-xl bg-bg-surface-elevated/30 border border-bdr-subtle">
      <h3 className="text-lg font-semibold text-txt-primary">Card Options</h3>

      {/* Format selector */}
      <SegmentedControl
        label="Format"
        options={[
          { value: '1:1', label: 'Square' },
          { value: '9:16', label: 'Story' },
        ]}
        value={format}
        onChange={(value) => onFormatChange(value as '1:1' | '9:16')}
      />

      {/* Show Name toggle */}
      <ToggleSwitch
        label="Show Athlete Name"
        checked={options.showName}
        onChange={(checked) => onOptionsChange('showName', checked)}
      />

      {/* Branding selector (hidden if no teams) */}
      {hasTeams && (
        <SegmentedControl
          label="Branding"
          options={[
            { value: 'personal', label: 'Personal' },
            { value: 'team', label: 'Team' },
          ]}
          value={options.brandingType}
          onChange={(value) => onOptionsChange('brandingType', value as 'personal' | 'team')}
        />
      )}

      {/* Team selector (shown when team branding + multiple teams) */}
      {options.brandingType === 'team' && hasMultipleTeams && (
        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-2">Team</label>
          <select
            value={options.teamId || ''}
            onChange={(e) => onOptionsChange('teamId', e.target.value || null)}
            className="w-full px-4 py-2 rounded-xl bg-bg-surface-elevated/50 border border-bdr-subtle text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary/50"
          >
            <option value="">Select team...</option>
            {userTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Auto-select single team when switching to team branding */}
      {options.brandingType === 'team' && userTeams.length === 1 && !options.teamId && (
        <div className="text-xs text-txt-tertiary">
          Using team: {userTeams[0].name}
          {/* Auto-set teamId on mount */}
          {(() => {
            setTimeout(() => onOptionsChange('teamId', userTeams[0].id), 0);
            return null;
          })()}
        </div>
      )}

      {/* Link Back selector */}
      <SegmentedControl
        label="Link Back to RowLab"
        options={[
          { value: 'none', label: 'None' },
          { value: 'qr', label: 'QR Code' },
          { value: 'url', label: 'URL' },
        ]}
        value={linkBackMode}
        onChange={handleLinkBackChange}
      />
    </div>
  );
}
