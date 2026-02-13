/**
 * User avatar dropdown menu.
 * Shows initials or avatar image with role badge.
 * Dropdown contains: name/email, profile, settings, team switcher (if 2+ teams), logout.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, Check } from 'lucide-react';
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
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-ink-raised text-xs font-semibold text-ink-primary transition-colors hover:bg-ink-hover"
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
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-copper text-[8px] font-bold text-white">
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
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-ink-border bg-ink-float/95 shadow-card backdrop-blur-xl"
            role="menu"
          >
            {/* User info */}
            <div className="border-b border-ink-border px-4 py-3">
              <p className="text-sm font-medium text-ink-primary">{user.name}</p>
              <p className="text-xs text-ink-muted">{user.email}</p>
            </div>

            {/* Navigation items */}
            <div className="border-b border-ink-border py-1">
              <MenuLink
                to="/profile"
                icon={User}
                label="Profile"
                onClick={() => setIsOpen(false)}
              />
              <MenuLink
                to="/settings"
                icon={Settings}
                label="Settings"
                onClick={() => setIsOpen(false)}
              />
            </div>

            {/* Team switcher (inline, only if 2+ teams) */}
            {teams.length >= 2 && (
              <div className="border-b border-ink-border py-1">
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  Switch Team
                </p>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSwitchTeam(team.id)}
                    className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm text-ink-secondary transition-colors hover:bg-ink-hover hover:text-ink-primary"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-ink-border/30 text-[9px] font-semibold text-ink-muted">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{team.name}</span>
                    {team.id === activeTeamId && (
                      <Check size={14} className="shrink-0 text-accent-copper" />
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
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-data-poor transition-colors hover:bg-ink-hover"
              >
                <LogOut size={16} />
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
  icon: React.ComponentType<{ size: number }>;
  label: string;
  onClick?: () => void;
}

function MenuLink({ to, icon: Icon, label, onClick }: MenuLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-ink-secondary transition-colors hover:bg-ink-hover hover:text-ink-primary"
      role="menuitem"
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}
