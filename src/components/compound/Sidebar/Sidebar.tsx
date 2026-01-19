import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Anchor,
  BarChart3,
  Dumbbell,
  Settings,
  Shield,
  Megaphone,
  Sparkles,
  CreditCard,
  Layers,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSettingsClick?: () => void;
}

// Navigation sections for better organization
const mainNavItems = [
  { label: 'Dashboard', icon: Home, path: '/app', end: true },
  { label: 'Lineup', icon: Anchor, path: '/app/lineup', end: false },
  { label: 'Athletes', icon: Users, path: '/app/athletes', end: false },
  { label: 'Erg Data', icon: Dumbbell, path: '/app/erg', end: false },
];

const analyticsNavItems = [
  { label: 'Analytics', icon: BarChart3, path: '/app/analytics', end: false },
  { label: 'Advanced', icon: Sparkles, path: '/app/advanced', end: false },
];

const managementNavItems = [
  { label: 'Communication', icon: Megaphone, path: '/app/communication', end: false },
  { label: 'Billing', icon: CreditCard, path: '/app/billing', end: false },
  { label: 'Settings', icon: Settings, path: '/app/settings', end: false },
];

export default function Sidebar({ isOpen = true, onClose, onSettingsClick }: SidebarProps) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const renderNavItems = (items: typeof mainNavItems) => (
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
                  ? 'bg-blade-green/10 text-blade-green border border-blade-green/20 shadow-[0_0_15px_rgba(0,229,153,0.15)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-void-elevated/50 border border-transparent'
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
                    isActive ? 'text-blade-green' : 'group-hover:text-text-primary'
                  }`}
                />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden ${
                        isActive ? 'text-blade-green' : ''
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blade-green rounded-full shadow-[0_0_8px_rgba(0,229,153,0.6)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
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
        transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]

        /* Glass morphism background */
        bg-void-surface/95 backdrop-blur-2xl saturate-[200%]

        /* Gradient stroke border on right edge */
        border-r border-transparent
        [background-image:linear-gradient(rgba(12,12,14,0.95),rgba(12,12,14,0.95)),linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]
        [background-origin:padding-box,border-box]
        [background-clip:padding-box,border-box]

        flex flex-col
      `}
    >
      {/* Header */}
      <div className={`px-4 py-5 border-b border-white/[0.04] flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-blade-green/20 border border-blade-green/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,153,0.2)]">
          <Layers size={18} className="text-blade-green" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display text-lg font-semibold text-text-primary tracking-tight"
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
            <div className="px-3 mb-2 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-text-muted">
              Main
            </div>
          )}
          {renderNavItems(mainNavItems)}
        </div>

        {/* Analytics Section */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 mb-2 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-text-muted">
              Analytics
            </div>
          )}
          {renderNavItems(analyticsNavItems)}
        </div>

        {/* Management Section */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 mb-2 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-text-muted">
              Management
            </div>
          )}
          {renderNavItems(managementNavItems)}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.04] space-y-1.5">
        {/* Theme Toggle */}
        <button
          className={`
            group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-text-secondary hover:text-text-primary
            hover:bg-void-elevated/50 border border-transparent
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

        {/* Admin Panel */}
        <button
          className={`
            group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-coxswain-violet hover:text-coxswain-violet
            hover:bg-coxswain-violet/10 border border-transparent hover:border-coxswain-violet/20
            transition-all duration-200
            ${isCollapsed ? 'justify-center px-2.5' : ''}
          `}
          onClick={onSettingsClick}
          title={isCollapsed ? 'Admin Panel' : undefined}
        >
          <Shield size={18} />
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

        {/* Collapse Toggle (desktop only) */}
        <button
          className={`
            hidden md:flex group w-full items-center gap-3 px-3 py-2.5 rounded-xl
            text-text-muted hover:text-text-secondary
            hover:bg-void-elevated/30 border border-transparent
            transition-all duration-200
            ${isCollapsed ? 'justify-center px-2.5' : ''}
          `}
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
