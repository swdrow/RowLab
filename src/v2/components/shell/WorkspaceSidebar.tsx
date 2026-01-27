import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  LayoutGrid,
  Clipboard,
  Trophy,
  Flag,
  BarChart2,
} from 'lucide-react';
import { useContextStore } from '@v2/stores/contextStore';
import { useFeaturePreferenceStore } from '@v2/stores/featurePreferenceStore';
import { FeatureId } from '@v2/types/feature-toggles';

/**
 * Icon map for navigation items
 * Maps icon names from contextStore to Lucide React components
 */
const ICON_MAP = {
  home: Home,
  activity: Activity,
  'trending-up': TrendingUp,
  users: Users,
  calendar: Calendar,
  settings: Settings,
  team: Users, // Using Users icon as placeholder for team
  boat: Activity, // Using Activity icon as placeholder for boat
  layout: LayoutGrid, // Grid layout for lineup builder
  clipboard: Clipboard, // Clipboard for whiteboard
  trophy: Trophy, // Trophy for seat racing
  flag: Flag, // Flag for regattas
  'bar-chart': BarChart2, // Bar chart for rankings
} as const;

/**
 * Feature mapping for navigation items
 * Maps route paths to feature IDs for feature-gating
 * Routes without a mapping (null) are always visible (core features)
 */
const NAV_ITEM_FEATURES: Record<string, FeatureId | null> = {
  // Core features (always show) - these routes map to always-enabled features
  '/app/coach/whiteboard': null, // Core roster/attendance functionality
  '/app/coach/fleet': null, // Core boat management
  '/app/coach/availability': null, // Core attendance
  '/app/coach/lineup-builder': null, // Core lineup builder
  '/app/coach/seat-racing': 'basic-seat-racing', // Core seat racing
  '/app/coach/training': null, // Core training calendar
  '/app/settings': null, // Settings always available
  '/beta/dashboard': null, // Athlete dashboard
  '/beta/workouts': null, // Athlete workouts
  '/beta/progress': null, // Athlete progress
  '/beta/users': null, // Admin users
  '/beta/teams': null, // Admin teams
  // Advanced features (feature-gated)
  '/app/regattas': 'racing-regattas',
  '/app/rankings': 'bradley-terry',
  '/app/recruiting': 'recruiting',
  '/app/achievements': 'gamification',
  '/app/challenges': 'gamification',
};

/**
 * Simple className utility for conditional classes
 */
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * WorkspaceSidebar Props
 */
interface WorkspaceSidebarProps {
  /** Callback when a navigation item is clicked (used by mobile menu) */
  onNavigate?: () => void;
}

/**
 * WorkspaceSidebar Component
 *
 * Context-aware navigation sidebar that displays different navigation items
 * based on the active context (Me/Coach/Admin) and enabled features.
 *
 * Features:
 * - Dynamically updates navigation when context switches
 * - Filters navigation items based on feature toggle state
 * - Core features always appear, advanced features only when enabled
 * - Highlights active route with V2 design tokens
 * - Accessible with proper ARIA labels and landmarks
 * - Keyboard navigable with native Link focus behavior
 * - Supports onNavigate callback for mobile menu close
 */
export function WorkspaceSidebar({ onNavigate }: WorkspaceSidebarProps = {}) {
  const { activeContext, getActiveConfig } = useContextStore();
  const location = useLocation();
  const isFeatureEnabled = useFeaturePreferenceStore((state) => state.isFeatureEnabled);

  // Get navigation items for the current context
  const config = getActiveConfig();
  const navItems = config?.navItems || [];

  // Filter navigation items based on feature toggles
  const visibleNavItems = navItems.filter((item) => {
    const featureId = NAV_ITEM_FEATURES[item.to];

    // If no feature mapping (null), always show
    if (featureId === null || featureId === undefined) {
      return true;
    }

    // If feature mapping exists, show only if enabled
    return isFeatureEnabled(featureId);
  });

  return (
    <nav
      aria-label={`${activeContext} workspace navigation`}
      className="workspace-sidebar flex flex-col gap-1 p-4 w-64 h-full bg-ink-base border-r border-ink-border"
    >
      {visibleNavItems.map((item) => {
        const isActive = location.pathname === item.to;
        const IconComponent = ICON_MAP[item.icon as keyof typeof ICON_MAP];

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              'transition-colors duration-150',
              isActive
                ? 'text-ink-bright bg-ink-raised'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-ink-raised/50'
            )}
          >
            {IconComponent && <IconComponent className="w-5 h-5" />}
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
