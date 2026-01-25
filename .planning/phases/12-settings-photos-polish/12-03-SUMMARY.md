---
phase: 12-settings-photos-polish
plan: 03
subsystem: ui
tags: [settings, tabs, profile, preferences, security, v2-components]

# Dependency graph
requires:
  - phase: 12-01
    provides: SPRING_CONFIG, LoadingSkeleton, animations
  - phase: 12-02
    provides: UserProfile, UserPreferences, SettingsTab types
provides:
  - SettingsTabs component for tab navigation
  - SettingsLayout wrapper with header, save button, error banner
  - ProfileSection with avatar upload and form fields
  - PreferencesSection with toggle switches for notifications/appearance
  - SecuritySection with email, password, 2FA, and danger zone
affects: [12-04, 12-05, settings-page, SET-01]

# Tech tracking
tech-stack:
  added: []
  patterns: [toggle-component, setting-row-pattern, section-card-pattern]

key-files:
  created:
    - src/v2/features/settings/components/SettingsTabs.tsx
    - src/v2/features/settings/components/SettingsLayout.tsx
    - src/v2/features/settings/components/ProfileSection.tsx
    - src/v2/features/settings/components/PreferencesSection.tsx
    - src/v2/features/settings/components/SecuritySection.tsx
    - src/v2/features/settings/components/index.ts
  modified: []

key-decisions:
  - "Toggle uses Framer Motion with SPRING_CONFIG for smooth animation"
  - "SettingRow pattern extracted for consistent label+description+action layout"
  - "SectionCard pattern with icon and accent color for visual hierarchy"
  - "InputField pattern with V2 design tokens for consistent form styling"
  - "Danger Zone uses status-error tokens with red background accent"

patterns-established:
  - "Tab navigation with icon + label buttons"
  - "AnimatePresence for error banner transitions"
  - "Avatar upload via FileReader for preview"
  - "SettingRow responsive layout (column on mobile, row on desktop)"

# Metrics
duration: 5min 29s
completed: 2026-01-25
---

# Phase 12 Plan 03: Settings Core Components Summary

**Settings core components migrated to V2: SettingsTabs, SettingsLayout, ProfileSection, PreferencesSection, SecuritySection with V2 design tokens and SPRING_CONFIG animations**

## Performance

- **Duration:** 5min 29s
- **Started:** 2026-01-25T17:27:38Z
- **Completed:** 2026-01-25T17:33:07Z
- **Tasks:** 3
- **Files created:** 6

## Accomplishments

### Task 1: SettingsTabs and SettingsLayout
Created the tab navigation and layout wrapper components:

**SettingsTabs.tsx:**
- Tab buttons for Profile, Preferences, Security, Integrations, Team (owner), Billing (owner)
- Lucide icons for each tab
- Active/inactive styling with focus-visible accessibility
- isOwner prop controls visibility of Team and Billing tabs

**SettingsLayout.tsx:**
- Header with title "Settings" and subtitle
- Save button with hasChanges/saving/saved states
- Error banner with AnimatePresence animation
- LoadingSkeleton integration for loading state
- Renders SettingsTabs and children content

### Task 2: ProfileSection
Migrated profile editing from V1 to V2:
- Avatar display with initials fallback (first+last name)
- Camera icon overlay on hover for upload hint
- FileReader-based avatar upload with data URL preview
- Upload and Remove buttons for avatar management
- 2-column grid for First Name / Last Name on sm+ screens
- Role/Title input with placeholder
- All inputs use V2 InputField pattern

### Task 3: PreferencesSection and SecuritySection
Created preferences and security components:

**PreferencesSection.tsx:**
- Notifications section: Email Notifications, Push Notifications toggles
- Appearance section: Dark Mode, Compact View, Auto-Save toggles
- Animated Toggle component using Framer Motion SPRING_CONFIG
- SettingRow pattern for consistent layout
- SectionCard wrapper with icon and accent color

**SecuritySection.tsx:**
- Email input field
- Change Password button with Lock icon and ChevronRight
- Two-Factor Authentication setup button with Shield icon
- Danger Zone section:
  - Red-tinted background and border
  - Sign Out button (filled danger style)
  - Delete Account button (outline danger style)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Toggle animation | Framer Motion layout with SPRING_CONFIG | Consistent with all V2 animations per 08-03 decision |
| SettingRow pattern | Responsive flex (column mobile, row desktop) | Matches V1 layout while improving mobile UX |
| SectionCard pattern | Icon + title header with accent colors | Visual hierarchy and brand consistency |
| Danger Zone styling | status-error/5 bg, status-error/20 border | Clear visual separation for destructive actions |
| InputField pattern | Inline component with V2 tokens | Reusable across all settings forms |

## Files Created

| File | Purpose |
|------|---------|
| `src/v2/features/settings/components/SettingsTabs.tsx` | Tab navigation for settings |
| `src/v2/features/settings/components/SettingsLayout.tsx` | Layout wrapper with header and save |
| `src/v2/features/settings/components/ProfileSection.tsx` | Profile editing with avatar upload |
| `src/v2/features/settings/components/PreferencesSection.tsx` | Notification and appearance toggles |
| `src/v2/features/settings/components/SecuritySection.tsx` | Email, password, 2FA, danger zone |
| `src/v2/features/settings/components/index.ts` | Barrel exports |

## Commits

| Hash | Message |
|------|---------|
| `a12db69` | feat(12-03): create SettingsTabs and SettingsLayout components |
| `56fe526` | feat(12-03): create ProfileSection component |
| `dc76d0a` | feat(12-03): create PreferencesSection and SecuritySection components |

## Deviations from Plan

None - plan executed exactly as written.

## How to Use

### SettingsLayout with tabs
```tsx
import { SettingsLayout, ProfileSection, PreferencesSection, SecuritySection } from '@/v2/features/settings/components';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState<UserProfile>({...});

  return (
    <SettingsLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isOwner={true}
      hasChanges={hasChanges}
      onSave={handleSave}
      saving={saving}
      saved={saved}
    >
      {activeTab === 'profile' && (
        <ProfileSection
          profile={profile}
          onChange={(field, value) => setProfile(p => ({...p, [field]: value}))}
        />
      )}
      {activeTab === 'preferences' && (
        <PreferencesSection
          preferences={preferences}
          onChange={(field, value) => setPreferences(p => ({...p, [field]: value}))}
        />
      )}
      {activeTab === 'security' && (
        <SecuritySection
          email={email}
          onEmailChange={setEmail}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </SettingsLayout>
  );
}
```

## Next Phase Readiness

Ready for 12-04 (Integrations Section) - core settings structure complete.

**Blockers:** None
**Concerns:** None
