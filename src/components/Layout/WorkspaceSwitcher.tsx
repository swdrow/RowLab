import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Team {
  id: string;
  name: string;
  role: string;
  slug?: string;
}

interface WorkspaceSwitcherProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const mockTeams: Team[] = [
  { id: '1', name: 'Varsity Men', role: 'coach' },
  { id: '2', name: 'Varsity Women', role: 'assistant' },
  { id: '3', name: 'JV Crew', role: 'viewer' },
];

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Extract initials from team name (max 2 characters)
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Format role for display
 */
function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: [0, 0, 0.2, 1], // ease-snap
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: [0.4, 0, 1, 1], // ease-in
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -4 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.1,
      ease: [0, 0, 0.2, 1],
    },
  }),
};

// -----------------------------------------------------------------------------
// WorkspaceSwitcher Component
// -----------------------------------------------------------------------------

export function WorkspaceSwitcher({ className = '' }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get auth state
  const { teams: authTeams, activeTeamId, switchTeam, isAuthenticated } = useAuthStore();

  // Use mock teams if not authenticated or no teams available
  const teams: Team[] = isAuthenticated && authTeams.length > 0 ? authTeams : mockTeams;
  const currentTeamId = activeTeamId || teams[0]?.id;
  const currentTeam = teams.find((t) => t.id === currentTeamId) || teams[0];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Handle team selection
  const handleSelectTeam = async (teamId: string) => {
    if (teamId === currentTeamId) {
      setIsOpen(false);
      return;
    }

    if (isAuthenticated && switchTeam) {
      await switchTeam(teamId);
    }
    setIsOpen(false);
  };

  // Handle create team click
  const handleCreateTeam = () => {
    // TODO: Open create team modal
    setIsOpen(false);
  };

  if (!currentTeam) {
    return null;
  }

  const initials = getInitials(currentTeam.name);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2.5 px-2.5 py-1.5
          rounded-lg
          bg-transparent
          hover:bg-white/[0.04]
          active:bg-white/[0.06]
          transition-colors duration-100
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blade-blue/50
          group
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Team Avatar */}
        <div
          className="
            w-7 h-7 rounded-lg
            bg-blade-blue/20
            flex items-center justify-center
            flex-shrink-0
          "
        >
          <span className="text-xs font-bold text-blade-blue tracking-tight">
            {initials}
          </span>
        </div>

        {/* Team Name */}
        <span
          className="
            text-sm font-medium text-text-primary
            max-w-[140px] truncate
          "
        >
          {currentTeam.name}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`
            w-4 h-4 text-text-tertiary
            transition-transform duration-100
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              absolute top-full left-0 mt-2
              min-w-[220px] w-max
              bg-void-surface/95 backdrop-blur-xl
              border border-white/10
              rounded-xl
              shadow-2xl
              overflow-hidden
              z-50
            "
            role="listbox"
            aria-label="Select workspace"
          >
            {/* Teams List */}
            <div className="py-1.5">
              {teams.map((team, index) => {
                const isSelected = team.id === currentTeamId;
                const teamInitials = getInitials(team.name);

                return (
                  <motion.button
                    key={team.id}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => handleSelectTeam(team.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2
                      text-left
                      transition-colors duration-100
                      ${isSelected
                        ? 'bg-blade-blue/10'
                        : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
                      }
                      focus:outline-none focus-visible:bg-white/[0.06]
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {/* Team Avatar */}
                    <div
                      className={`
                        w-8 h-8 rounded-lg
                        flex items-center justify-center
                        flex-shrink-0
                        ${isSelected
                          ? 'bg-blade-blue/20'
                          : 'bg-white/[0.06]'
                        }
                      `}
                    >
                      <span
                        className={`
                          text-xs font-bold tracking-tight
                          ${isSelected ? 'text-blade-blue' : 'text-text-secondary'}
                        `}
                      >
                        {teamInitials}
                      </span>
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`
                          text-sm font-medium truncate
                          ${isSelected ? 'text-text-primary' : 'text-text-secondary'}
                        `}
                      >
                        {team.name}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {formatRole(team.role)}
                      </div>
                    </div>

                    {/* Check Icon */}
                    {isSelected && (
                      <Check className="w-4 h-4 text-blade-blue flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 mx-3" />

            {/* Create Team Option */}
            <div className="py-1.5">
              <motion.button
                custom={teams.length}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                onClick={handleCreateTeam}
                className="
                  w-full flex items-center gap-3 px-3 py-2
                  text-left
                  hover:bg-white/[0.04] active:bg-white/[0.06]
                  transition-colors duration-100
                  focus:outline-none focus-visible:bg-white/[0.06]
                "
              >
                {/* Plus Icon */}
                <div
                  className="
                    w-8 h-8 rounded-lg
                    bg-white/[0.06]
                    flex items-center justify-center
                    flex-shrink-0
                  "
                >
                  <Plus className="w-4 h-4 text-text-tertiary" />
                </div>

                {/* Label */}
                <span className="text-sm font-medium text-text-secondary">
                  Create new team
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WorkspaceSwitcher;
