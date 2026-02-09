/**
 * CanvasTabs - Ruled line tabs with active indicator
 *
 * Tab navigation with Canvas design language:
 * - Ruled line that draws in under active tab
 * - Uppercase tracking for labels
 * - Optional count badges
 * - Layout ID for smooth transition
 *
 * Design: Canvas tabs primitive
 */

import { motion } from 'framer-motion';

export interface CanvasTabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function CanvasTabs({ tabs, activeTab, onChange, className = '' }: CanvasTabsProps) {
  return (
    <div className={`flex items-center gap-6 border-b border-white/[0.06] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
              isActive ? 'text-ink-bright' : 'text-ink-muted hover:text-ink-secondary'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-2 font-mono text-ink-tertiary">{tab.count}</span>
            )}

            {/* Active indicator — ruled line that draws in */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-white/20 to-transparent"
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
