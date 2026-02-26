/**
 * Team switcher for the TopBar.
 *
 * States:
 * - Zero teams: "Join or create a team" CTA button
 * - Has teams: Dropdown trigger with active team name + role badge
 *
 * Dropdown shows:
 * - All teams with name, role badge, member count, checkmark on active
 * - Team initial in colored circle
 * - Divider + "Create team" shortcut at bottom
 *
 * Same-page switching: on team pages, retains the current sub-path.
 * On personal pages, stays in place.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { IconChevronsUpDown, IconCheck, IconPlus, IconUsers } from '@/components/icons';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/useAuth';
import { ROLE_DISPLAY, isCoachOrAbove } from '@/features/team/types';
import { SPRING_SNAPPY } from '@/lib/animations';
import type { Team } from '@/types/auth';

interface TeamSwitcherProps {
  className?: string;
}

/** Deterministic color from team name for the initial circle */
const TEAM_COLORS = [
  'bg-accent-teal/20 text-accent-teal',
  'bg-accent-teal-primary/20 text-accent-teal-primary',
  'bg-data-excellent/20 text-data-excellent',
  'bg-accent-teal-primary/20 text-accent-teal-primary',
  'bg-data-warning/20 text-data-warning',
  'bg-data-poor/20 text-data-poor',
  'bg-accent-teal-primary/20 text-accent-teal-primary',
  'bg-accent-teal-primary/20 text-accent-teal-primary',
];

function getTeamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length]!;
}

/** Role badge styling: Admin gets copper accent, Coach/Athlete get subtle */
function getRoleBadgeClass(role: string): string {
  const upper = role.toUpperCase();
  if (upper === 'OWNER') {
    return 'bg-accent-teal/15 text-accent-teal';
  }
  return 'bg-void-raised text-text-dim';
}

/**
 * Check if the active team role has permission for a given sub-path.
 * Coach-only paths require COACH or OWNER role.
 */
function hasPermissionForPath(subPath: string, role: string | null): boolean {
  const coachPaths = ['coach', 'lineups', 'seat-racing', 'fleet', 'attendance'];
  const firstSegment = subPath.split('/')[0] ?? '';
  if (coachPaths.includes(firstSegment)) {
    return isCoachOrAbove(role);
  }
  return true;
}

export function TeamSwitcher({ className }: TeamSwitcherProps) {
  const { teams, activeTeamId, activeTeamRole, switchTeam } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
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

  const handleSwitch = useCallback(
    async (team: Team) => {
      if (team.id === activeTeamId) {
        setIsOpen(false);
        return;
      }

      setIsOpen(false);
      setIsSwitching(true);

      try {
        await switchTeam(team.id);

        // Same-page switching logic
        const isTeamPage = currentPath.startsWith('/team/') || currentPath === '/team';
        if (isTeamPage && currentPath.startsWith('/team/')) {
          // Extract sub-path after /team/{identifier}/
          const segments = currentPath.split('/');
          // /team/{identifier}/{sub-path...}
          const subPath = segments.slice(3).join('/');
          const teamIdentifier = team.slug || team.generatedId || team.id;

          if (subPath && hasPermissionForPath(subPath, team.role)) {
            void navigate({ to: `/team/${teamIdentifier}/${subPath}` as string });
          } else {
            void navigate({ to: `/team/${teamIdentifier}/dashboard` as string });
          }
        }
        // If on personal page, stay in place (context already switched)
      } finally {
        // Brief delay for visual feedback
        setTimeout(() => setIsSwitching(false), 300);
      }
    },
    [activeTeamId, switchTeam, currentPath, navigate]
  );

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  // Zero teams: show CTA
  if (teams.length === 0) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => void navigate({ to: '/create-team' as string })}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-text-dim transition-colors hover:bg-void-overlay hover:text-text-bright"
        >
          <IconUsers width={16} height={16} className="text-text-faint" />
          <span>Join or create a team</span>
        </button>
      </div>
    );
  }

  const teamInitial = activeTeam?.name.charAt(0).toUpperCase() ?? '?';
  const activeTeamColor = activeTeam ? getTeamColor(activeTeam.name) : TEAM_COLORS[0]!;
  const roleLabel = activeTeamRole
    ? (ROLE_DISPLAY[activeTeamRole.toUpperCase()] ?? activeTeamRole)
    : '';

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Trigger button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        animate={{ opacity: isSwitching ? 0.6 : 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-void-overlay"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Team initial */}
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${activeTeamColor}`}
        >
          {teamInitial}
        </div>

        {/* Team name + role */}
        <div className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="max-w-[120px] truncate text-sm font-medium text-text-bright">
            {activeTeam?.name ?? 'Select team'}
          </span>
          {roleLabel && (
            <span className="text-[10px] font-medium text-text-faint">{roleLabel}</span>
          )}
        </div>

        <IconChevronsUpDown width={14} height={14} className="shrink-0 text-text-faint" />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={SPRING_SNAPPY}
            className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-edge-default bg-void-overlay shadow-md"
            role="listbox"
            aria-label="Select team"
          >
            {/* Team list */}
            <div className="max-h-64 overflow-y-auto py-1">
              {teams.map((team) => {
                const isActive = team.id === activeTeamId;
                const color = getTeamColor(team.name);
                const teamRole = ROLE_DISPLAY[team.role.toUpperCase()] ?? team.role;

                return (
                  <button
                    key={team.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => void handleSwitch(team)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-void-overlay ${
                      isActive ? 'bg-void-raised/50' : ''
                    }`}
                  >
                    {/* Team initial circle */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${color}`}
                    >
                      {team.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + role + member count */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-text-bright">
                          {team.name}
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${getRoleBadgeClass(team.role)}`}
                        >
                          {teamRole}
                        </span>
                      </div>
                      {team.memberCount != null && (
                        <span className="text-xs text-text-faint">
                          {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      )}
                    </div>

                    {/* Active checkmark */}
                    {isActive && (
                      <IconCheck width={16} height={16} className="shrink-0 text-accent-teal" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-edge-default" />

            {/* Create team shortcut */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                void navigate({ to: '/create-team' as string });
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-text-dim transition-colors hover:bg-void-overlay hover:text-text-bright"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-edge-default text-text-faint">
                <IconPlus width={16} height={16} />
              </div>
              <span>Create team</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
