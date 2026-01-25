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
 * based on the active context (Me/Coach/Admin).
 *
 * Features:
 * - Dynamically updates navigation when context switches
 * - Highlights active route with V2 design tokens
 * - Accessible with proper ARIA labels and landmarks
 * - Keyboard navigable with native Link focus behavior
 * - Supports onNavigate callback for mobile menu close
 */
export function WorkspaceSidebar({ onNavigate }: WorkspaceSidebarProps = {}) {
  const { activeContext, getActiveConfig } = useContextStore();
  const location = useLocation();

  // Get navigation items for the current context
  const config = getActiveConfig();
  const navItems = config?.navItems || [];

  return (
    <nav
      aria-label={`${activeContext} workspace navigation`}
      className="workspace-sidebar flex flex-col gap-1 p-4 w-64 h-full bg-bg-surface border-r border-bdr-default"
    >
      {navItems.map((item) => {
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
                ? 'bg-interactive-primary text-button-primary-text'
                : 'text-txt-secondary hover:bg-bg-hover hover:text-txt-primary'
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
