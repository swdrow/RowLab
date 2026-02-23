/**
 * ProfileTabs -- horizontal tab bar with 4 sections.
 *
 * Strava-style underline tabs with copper accent on active tab.
 * Uses semantic tab roles for accessibility.
 */

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'training-log', label: 'Training Log' },
  { id: 'prs', label: 'PRs' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'analytics', label: 'Analytics' },
] as const;

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-edge-default mt-6">
      <div className="flex gap-6 px-4 overflow-x-auto" role="tablist" aria-label="Profile sections">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-accent-teal text-text-bright'
                  : 'border-transparent text-text-dim hover:text-text-bright'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
