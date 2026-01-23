import { motion } from 'framer-motion';
import { useContextStore } from '@v2/stores/contextStore';
import type { Context } from '@v2/types/context';

/**
 * ContextRail Component
 *
 * Vertical rail (64px wide) for switching between Me/Coach/Admin persona contexts.
 * Uses Framer Motion layoutId for animated active indicator.
 *
 * Accessibility:
 * - Proper ARIA labels on nav and buttons
 * - aria-current on active button
 * - Keyboard focusable (native button behavior)
 * - Keyboard shortcut hints in aria-label (implementation in Plan 04)
 */

interface ContextButton {
  id: Context;
  label: string;
  icon: React.FC<{ className?: string }>;
  ariaLabel: string;
}

// Inline SVG Icons (Lucide-style)
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const contexts: ContextButton[] = [
  {
    id: 'me',
    label: 'Me',
    icon: UserIcon,
    ariaLabel: 'Me workspace (Ctrl+1)',
  },
  {
    id: 'coach',
    label: 'Coach',
    icon: UsersIcon,
    ariaLabel: 'Coach workspace (Ctrl+2)',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: SettingsIcon,
    ariaLabel: 'Admin workspace (Ctrl+3)',
  },
];

export function ContextRail() {
  const { activeContext, setActiveContext } = useContextStore();

  return (
    <nav
      className="w-16 h-full bg-bg-surface-elevated border-r border-border-default flex flex-col items-center py-4 gap-2"
      aria-label="Workspace contexts"
    >
      {contexts.map((context) => {
        const isActive = activeContext === context.id;
        const Icon = context.icon;

        return (
          <button
            key={context.id}
            onClick={() => setActiveContext(context.id)}
            aria-label={context.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            className="relative w-12 h-12 rounded-lg flex items-center justify-center hover:bg-bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-action-primary focus:ring-offset-2 focus:ring-offset-bg-surface-elevated"
          >
            {/* Active indicator background - animates between buttons */}
            {isActive && (
              <motion.div
                layoutId="activeContext"
                className="absolute inset-0 bg-action-primary/10 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* Icon - relative positioning to appear above indicator */}
            <Icon
              className={`relative w-6 h-6 transition-colors ${
                isActive ? 'text-text-primary' : 'text-text-secondary'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
