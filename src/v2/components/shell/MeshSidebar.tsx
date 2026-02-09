/**
 * MeshSidebar - Frosted glass sidebar navigation for the Gradient Mesh prototype
 *
 * A semi-transparent sidebar with heavy backdrop blur that sits over the
 * animated mesh gradient background. Features:
 * - RowLab wordmark in gradient text
 * - Navigation groups with category-specific color accents
 * - Framer Motion hover/press effects on items
 * - User avatar + team info at the bottom
 * - Colored left border on active item with subtle glow
 *
 * Color scheme per group:
 *   Overview  = blue (#60a5fa)
 *   Team      = teal (#14b8a6)
 *   Perform.  = indigo (#818cf8)
 *   Compete   = coral (#fb7185)
 *   Planning  = amber (#fbbf24)
 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Gauge,
  Sailboat,
  Swords,
  Calendar,
  LayoutList,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@v2/contexts/AuthContext';

// ============================================
// NAV CONFIG — groups, items, colors
// ============================================

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  color: string; // Tailwind text color for active state
  accentHex: string; // Raw hex for CSS glow
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    color: 'text-blue-400',
    accentHex: '#60a5fa',
    items: [{ label: 'Dashboard', path: '/mesh', icon: LayoutDashboard }],
  },
  {
    title: 'Team',
    color: 'text-teal-400',
    accentHex: '#14b8a6',
    items: [
      { label: 'Athletes', path: '/mesh/athletes', icon: Users },
      { label: 'Attendance', path: '/mesh/attendance', icon: ClipboardCheck },
    ],
  },
  {
    title: 'Performance',
    color: 'text-indigo-400',
    accentHex: '#818cf8',
    items: [
      { label: 'Erg Tests', path: '/mesh/erg-tests', icon: Gauge },
      { label: 'Rankings', path: '/mesh/rankings', icon: BarChart3 },
    ],
  },
  {
    title: 'Competition',
    color: 'text-rose-400',
    accentHex: '#fb7185',
    items: [
      { label: 'Regattas', path: '/mesh/regattas', icon: Sailboat },
      { label: 'Seat Racing', path: '/mesh/coach/seat-racing', icon: Swords },
    ],
  },
  {
    title: 'Planning',
    color: 'text-amber-400',
    accentHex: '#fbbf24',
    items: [
      { label: 'Training', path: '/mesh/coach/training', icon: Calendar },
      { label: 'Lineup Builder', path: '/mesh/coach/lineup-builder', icon: LayoutList },
    ],
  },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================

export function MeshSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const firstName = user?.name?.split(' ')[0] || 'Coach';
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'RL';

  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 w-[220px] z-30 flex flex-col
                 mesh-glass-strong rounded-r-2xl mesh-scrollbar overflow-y-auto"
    >
      {/* ============================================
          WORDMARK
          ============================================ */}
      <div className="px-5 pt-6 pb-4">
        <Link to="/mesh" className="block">
          <h1 className="text-xl font-display font-bold tracking-tight mesh-gradient-text">
            RowLab
          </h1>
        </Link>
        <p className="text-[11px] text-white/30 mt-0.5 font-mono tracking-widest uppercase">
          Gradient Mesh
        </p>
      </div>

      {/* ============================================
          NAVIGATION GROUPS
          ============================================ */}
      <nav className="flex-1 px-3 space-y-5 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {/* Group header */}
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/25 px-2 mb-1.5">
              {group.title}
            </p>

            {/* Group items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/mesh' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    item={item}
                    isActive={isActive}
                    groupColor={group.color}
                    accentHex={group.accentHex}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ============================================
          BOTTOM: SETTINGS + USER
          ============================================ */}
      <div className="px-3 pb-5 mt-auto space-y-1 border-t border-white/[0.06] pt-3">
        {/* Settings */}
        <Link
          to="/mesh/settings"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                     text-white/40 hover:text-white/70 hover:bg-white/[0.04]
                     transition-colors text-[13px]"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px]
                        font-semibold bg-gradient-to-br from-indigo-500 to-purple-600 text-white
                        ring-1 ring-white/10 shrink-0"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-white/80 font-medium truncate">{firstName}</p>
            <p className="text-[10px] text-white/30 truncate">
              {user?.email || 'coach@rowlab.app'}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="text-white/25 hover:text-white/60 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

// ============================================
// NAV LINK — individual item with hover/active FX
// ============================================

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  groupColor: string;
  accentHex: string;
}

function NavLink({ item, isActive, groupColor, accentHex }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link to={item.path}>
      <motion.div
        whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.04)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={`
          relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px]
          transition-colors duration-150 group
          ${
            isActive
              ? `${groupColor} bg-white/[0.06] font-medium`
              : 'text-white/45 hover:text-white/70'
          }
        `}
      >
        {/* Active left accent bar */}
        {isActive && (
          <motion.div
            layoutId="mesh-sidebar-active"
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
            style={{
              backgroundColor: accentHex,
              boxShadow: `0 0 12px ${accentHex}60, 0 0 4px ${accentHex}40`,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}

        {/* Icon */}
        <Icon
          className={`w-4 h-4 shrink-0 ${isActive ? groupColor : 'text-white/35 group-hover:text-white/55'}`}
        />

        {/* Label */}
        <span>{item.label}</span>
      </motion.div>
    </Link>
  );
}

export default MeshSidebar;
