import { NavLink, useLocation } from 'react-router-dom';
import {
  House,
  Boat,
  Users,
  Timer,
  ChartLine,
  Sparkle,
  Megaphone,
  CreditCard,
  Gear,
  Sun,
  Moon,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  User as UserIcon,
  ArrowsLeftRight,
  Microphone,
  Notebook,
} from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../../store/authStore';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSettingsClick?: () => void;
  isAdmin?: boolean;
}

// Section color themes for visual variety
const sectionColors = {
  main: {
    active: 'text-blade-blue',
    border: 'border-blade-blue',
    bg: 'bg-blade-blue/10',
  },
  analytics: {
    active: 'text-spectrum-cyan',
    border: 'border-spectrum-cyan',
    bg: 'bg-spectrum-cyan/10',
  },
  management: {
    active: 'text-spectrum-violet',
    border: 'border-spectrum-violet',
    bg: 'bg-spectrum-violet/10',
  },
};

// Navigation sections for better organization
// Coach/Owner main navigation
const coachMainNavItems = [
  { label: 'Dashboard', icon: House, path: '/app', end: true },
  { label: 'Lineup', icon: Boat, path: '/app/lineup', end: false },
  { label: 'Coxswain', icon: Microphone, path: '/app/coxswain', end: false },
  { label: 'Athletes', icon: Users, path: '/app/athletes', end: false },
  { label: 'Erg Data', icon: Timer, path: '/app/erg', end: false },
  { label: 'Training Plans', icon: Notebook, path: '/app/training-plans', end: false },
];

// Athlete main navigation (simplified)
const athleteMainNavItems = [
  { label: 'My Dashboard', icon: UserIcon, path: '/app/athlete-dashboard', end: true },
  { label: 'Erg Data', icon: Timer, path: '/app/erg', end: false },
];

const analyticsNavItems = [
  { label: 'Analytics', icon: ChartLine, path: '/app/analytics', end: false },
  { label: 'Advanced', icon: Sparkle, path: '/app/advanced', end: false },
];

const managementNavItems = [
  { label: 'Communication', icon: Megaphone, path: '/app/communication', end: false },
  { label: 'Settings', icon: Gear, path: '/app/settings', end: false },
];

export default function Sidebar({ isOpen = true, onClose, onSettingsClick, isAdmin = false }: SidebarProps) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewAsAthlete, setViewAsAthlete] = useState(false);

  // Get user role from auth store
  const { activeTeamRole } = useAuthStore();
  const isAthlete = activeTeamRole === 'ATHLETE';
  const isCoachOrOwner = activeTeamRole === 'OWNER' || activeTeamRole === 'COACH';

  // Determine which navigation items to show
  const mainNavItems = isAthlete || viewAsAthlete ? athleteMainNavItems : coachMainNavItems;

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    // Check saved collapsed state
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true');
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    // Update CSS variable on root for main content margin
    document.documentElement.style.setProperty(
      '--sidebar-width',
      newState ? '68px' : '240px'
    );
  };

  // Set initial sidebar width on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    document.documentElement.style.setProperty(
      '--sidebar-width',
      savedCollapsed ? '68px' : '240px'
    );
  }, []);

  const renderNavItems = (items: typeof mainNavItems, colorScheme: typeof sectionColors.main) => (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? `bg-white/[0.06] ${colorScheme.active} border-l-2 ${colorScheme.border} border-t-0 border-r-0 border-b-0`
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border-l-2 border-transparent'
              } ${isCollapsed ? 'justify-center px-2.5' : ''}`
            }
            onClick={onClose}
            title={isCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-all duration-200 ${
                    isActive ? colorScheme.active : 'group-hover:text-text-primary'
                  }`}
                />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden ${
                        isActive ? colorScheme.active : ''
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        );
      })}
    </>
  );

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-30
        ${isCollapsed ? 'w-[68px]' : 'w-[240px]'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        transition-all duration-150 ease-out

        /* Glass morphism background */
        bg-void-surface/80 backdrop-blur-xl saturate-[180%]

        /* Border on right edge */
        border-r border-white/[0.06]

        flex flex-col
      `}
    >
      {/* Header */}
      <div className={`px-4 py-5 border-b border-white/[0.06] flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-blade-blue/20 border border-blade-blue/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.2)]">
          <Boat size={18} className="text-blade-blue" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display text-lg font-semibold text-text-primary tracking-[-0.02em]"
            >
              RowLab
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6">
        {/* Main Section */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 mb-2 font-mono text-[10px] font-medium tracking-widest uppercase text-blade-blue/60">
              {isAthlete || viewAsAthlete ? 'Personal' : 'Main'}
            </div>
          )}
          {renderNavItems(mainNavItems, sectionColors.main)}
        </div>

        {/* Analytics Section - Hide for athletes unless in view-as-athlete mode */}
        {(!isAthlete || (isCoachOrOwner && viewAsAthlete)) && (
          <div className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 mb-2 font-mono text-[10px] font-medium tracking-widest uppercase text-spectrum-cyan/60">
                Analytics
              </div>
            )}
            {renderNavItems(analyticsNavItems, sectionColors.analytics)}
          </div>
        )}

        {/* Management Section - Hide for athletes unless in view-as-athlete mode */}
        {(!isAthlete || (isCoachOrOwner && viewAsAthlete)) && (
          <div className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 mb-2 font-mono text-[10px] font-medium tracking-widest uppercase text-spectrum-violet/60">
                Management
              </div>
            )}
            {renderNavItems(managementNavItems, sectionColors.management)}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-1.5">
        {/* View as Athlete Toggle - only for coaches/owners */}
        {isCoachOrOwner && (
          <button
            className={`
              group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              ${viewAsAthlete ? 'text-blade-blue bg-blade-blue/10 border-l-2 border-blade-blue' : 'text-text-secondary hover:text-text-primary border-l-2 border-transparent'}
              hover:bg-white/[0.04]
              transition-all duration-200
              ${isCollapsed ? 'justify-center px-2.5' : ''}
            `}
            onClick={() => setViewAsAthlete(!viewAsAthlete)}
            title={isCollapsed ? (viewAsAthlete ? 'Coach View' : 'Athlete View') : undefined}
          >
            <ArrowsLeftRight size={18} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {viewAsAthlete ? 'Coach View' : 'Athlete View'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          className={`
            group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-text-secondary hover:text-text-primary
            hover:bg-white/[0.04] border-l-2 border-transparent
            transition-all duration-200
            ${isCollapsed ? 'justify-center px-2.5' : ''}
          `}
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Admin Panel - only visible for admin users */}
        {isAdmin && (
          <button
            className={`
              group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-coxswain-violet hover:text-coxswain-violet
              hover:bg-coxswain-violet/10 border-l-2 border-transparent hover:border-coxswain-violet/40
              transition-all duration-200
              ${isCollapsed ? 'justify-center px-2.5' : ''}
            `}
            onClick={onSettingsClick}
            title={isCollapsed ? 'Admin Panel' : undefined}
          >
            <ShieldCheck size={18} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  Admin Panel
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Collapse Toggle (desktop only) */}
        <button
          className={`
            hidden md:flex group w-full items-center gap-3 px-3 py-2.5 rounded-xl
            text-text-muted hover:text-text-secondary
            hover:bg-white/[0.04] border-l-2 border-transparent
            transition-all duration-200
            ${isCollapsed ? 'justify-center px-2.5' : ''}
          `}
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <CaretRight size={18} /> : <CaretLeft size={18} />}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}
