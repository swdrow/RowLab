import React from 'react';
import {
  User,
  Palette,
  Shield,
  Plug,
  Users,
  CreditCard,
} from 'lucide-react';
import type { SettingsTab } from '../../../types/settings';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'team', label: 'Team', icon: Users, ownerOnly: true },
  { id: 'billing', label: 'Billing', icon: CreditCard, ownerOnly: true },
];

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon: Icon,
  children,
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface
      ${active
        ? 'bg-interactive-primary/10 text-interactive-primary border border-interactive-primary/20 shadow-[0_0_12px_rgba(var(--color-interactive-primary-rgb),0.15)]'
        : 'text-txt-secondary hover:text-txt-primary hover:bg-hover border border-transparent'
      }
    `}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  isOwner?: boolean;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  activeTab,
  onTabChange,
  isOwner = false,
}) => {
  const visibleTabs = TABS.filter((tab) => !tab.ownerOnly || isOwner);

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTabs.map((tab) => (
        <TabButton
          key={tab.id}
          active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          icon={tab.icon}
        >
          {tab.label}
        </TabButton>
      ))}
    </div>
  );
};

export default SettingsTabs;
