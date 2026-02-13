/**
 * Team switcher for sidebar.
 * - 0 teams: renders nothing
 * - 1 team: shows team name (non-interactive)
 * - 2+ teams: dropdown to switch teams
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/useAuth';
import { SPRING_SNAPPY } from '@/lib/animations';

interface TeamSwitcherProps {
  collapsed?: boolean;
}

export function TeamSwitcher({ collapsed = false }: TeamSwitcherProps) {
  const { teams, activeTeamId, switchTeam } = useAuth();
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

  const handleSwitch = useCallback(
    async (teamId: string) => {
      setIsOpen(false);
      if (teamId !== activeTeamId) {
        await switchTeam(teamId);
      }
    },
    [activeTeamId, switchTeam]
  );

  // No teams: render nothing
  if (teams.length === 0) return null;

  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const teamInitial = activeTeam?.name.charAt(0).toUpperCase() ?? '?';

  // Collapsed: just show team initial
  if (collapsed) {
    return (
      <div className="flex items-center justify-center px-2 py-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-raised text-xs font-semibold text-ink-primary"
          title={activeTeam?.name ?? 'No team'}
        >
          {teamInitial}
        </div>
      </div>
    );
  }

  // Single team: non-interactive display
  if (teams.length === 1) {
    return (
      <div className="mx-3 mb-2 rounded-lg bg-ink-raised/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-border/30 text-[10px] font-semibold text-ink-secondary">
            {teamInitial}
          </div>
          <span className="truncate text-sm font-medium text-ink-primary">{activeTeam?.name}</span>
        </div>
      </div>
    );
  }

  // Multiple teams: dropdown
  return (
    <div ref={containerRef} className="relative mx-3 mb-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-lg bg-ink-raised/50 px-3 py-2 transition-colors hover:bg-ink-hover"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-border/30 text-[10px] font-semibold text-ink-secondary">
          {teamInitial}
        </div>
        <span className="flex-1 truncate text-left text-sm font-medium text-ink-primary">
          {activeTeam?.name ?? 'Select team'}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-ink-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={SPRING_SNAPPY}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-ink-border bg-ink-float/95 shadow-card backdrop-blur-xl"
            role="listbox"
            aria-label="Select team"
          >
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                role="option"
                aria-selected={team.id === activeTeamId}
                onClick={() => void handleSwitch(team.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-ink-hover"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-border/30 text-[10px] font-semibold text-ink-secondary">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm text-ink-primary">{team.name}</span>
                {team.id === activeTeamId && (
                  <Check size={14} className="shrink-0 text-accent-copper" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
