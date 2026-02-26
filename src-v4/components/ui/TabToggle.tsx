/**
 * Tab toggle — oarbit design system.
 *
 * Container: bg-void-deep, radius-md (6px), space-1 (4px) padding.
 * Active indicator: bg-void-raised behind active tab, animated via layoutId.
 * Active text: text-primary, weight medium.
 * Inactive text: text-dim. Inactive hover: text-bright.
 * Animation: spring-standard via motion layoutId.
 * Every TabGroup instance MUST have a unique layoutId prop.
 */

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { motion as motionTokens } from '@/design-system';

const SPRING_STANDARD = {
  type: 'spring' as const,
  ...motionTokens.spring.standard,
};

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabToggleProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  layoutId?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'text-xs h-8 px-3',
  md: 'text-sm h-9 px-4',
} as const;

export function TabToggle({
  tabs,
  activeTab,
  onTabChange,
  layoutId = 'tab-indicator',
  size = 'md',
  fullWidth = false,
  className = '',
}: TabToggleProps) {
  return (
    <div
      className={`${fullWidth ? 'flex' : 'inline-flex'} items-center gap-1 p-1 rounded-[var(--radius-md)] bg-void-deep ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center justify-center gap-1.5
              ${sizeStyles[size]}
              ${fullWidth ? 'flex-1' : ''}
              rounded-[var(--radius-sm)] font-medium cursor-pointer
              transition-colors duration-150
              ${isActive ? 'text-text-bright' : 'text-text-dim hover:text-text-bright'}
            `.trim()}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-void-raised rounded-[var(--radius-sm)] shadow-sm border-b-2 border-accent-sand"
                transition={SPRING_STANDARD}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
