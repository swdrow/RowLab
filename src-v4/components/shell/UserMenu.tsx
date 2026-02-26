/**
 * User avatar dropdown menu.
 * Shows initials or avatar image with role badge.
 * Dropdown contains: name/email, profile, settings, team switcher (if 2+ teams), logout.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { IconUser, IconSettings, IconLogOut, IconCheck } from '@/components/icons';
import { useAuth } from '@/features/auth/useAuth';
import { SPRING_SNAPPY } from '@/lib/animations';

export function UserMenu() {
  const { user, teams, activeTeamId, activeTeamRole, logout, switchTeam } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    await logout();
    void navigate({ to: '/login' });
  }, [logout, navigate]);

  const handleSwitchTeam = useCallback(
    async (teamId: string) => {
      if (teamId !== activeTeamId) {
        await switchTeam(teamId);
      }
      setIsOpen(false);
    },
    [activeTeamId, switchTeam]
  );

  if (!user) return null;

  // Build initials from name
  const initials = user.name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Role badge character
  const roleBadge =
    activeTeamRole === 'coach' || activeTeamRole === 'admin' ? 'C' : activeTeamRole ? 'A' : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger: avatar circle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-void-raised text-xs font-semibold text-text-bright transition-colors hover:bg-void-overlay"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Role badge */}
        {roleBadge && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-teal text-[8px] font-bold text-void-deep">
            {roleBadge}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={SPRING_SNAPPY}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-edge-default bg-void-overlay shadow-md"
            role="menu"
          >
            {/* User info */}
            <div className="border-b border-edge-default px-4 py-3">
              <p className="text-sm font-medium text-text-bright">{user.name}</p>
              <p className="text-xs text-text-faint">{user.email}</p>
            </div>

            {/* Navigation items */}
            <div className="border-b border-edge-default py-1">
              <MenuLink
                to="/profile"
                icon={IconUser}
                label="Profile"
                onClick={() => setIsOpen(false)}
              />
              <MenuLink
                to="/settings"
                icon={IconSettings}
                label="Settings"
                onClick={() => setIsOpen(false)}
              />
            </div>

            {/* Team switcher (inline, only if 2+ teams) */}
            {teams.length >= 2 && (
              <div className="border-b border-edge-default py-1">
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-faint">
                  Switch Team
                </p>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSwitchTeam(team.id)}
                    className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm text-text-dim transition-colors hover:bg-void-overlay hover:text-text-bright"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-edge-default/30 text-[9px] font-semibold text-text-faint">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{team.name}</span>
                    {team.id === activeTeamId && (
                      <IconCheck width={14} height={14} className="shrink-0 text-accent-teal" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Logout */}
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-data-poor transition-colors hover:bg-void-overlay"
              >
                <IconLogOut width={16} height={16} />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* === Sub-components === */

interface MenuLinkProps {
  to: string;
  icon: React.ComponentType<{ width: number; height: number }>;
  label: string;
  onClick?: () => void;
}

function MenuLink({ to, icon: Icon, label, onClick }: MenuLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-text-dim transition-colors hover:bg-void-overlay hover:text-text-bright"
      role="menuitem"
    >
      <Icon width={16} height={16} />
      <span>{label}</span>
    </Link>
  );
}
