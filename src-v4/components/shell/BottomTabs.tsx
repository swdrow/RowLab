/**
 * Mobile bottom tab bar for navigation.
 * Only renders when viewport < 768px.
 * Fixed to bottom with iOS safe area padding.
 * Coach/admin users get a "More" tab that opens a sheet with coach tools.
 */
import { useState } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { IconX } from '@/components/icons';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { useAuth } from '@/features/auth/useAuth';
import { getBottomTabItems, getCoachToolItems } from '@/config/navigation';
import { useMemo } from 'react';

export function BottomTabs() {
  const isMobile = useIsMobile();
  const { activeTeamRole, activeTeamId } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const hasTeam = activeTeamId !== null;
  const tabItems = useMemo(
    () => getBottomTabItems(activeTeamRole, hasTeam),
    [activeTeamRole, hasTeam]
  );

  const coachTools = useMemo(() => getCoachToolItems(), []);

  if (!isMobile) return null;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-edge-default bg-void-surface"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Bottom navigation"
      >
        {tabItems.map((item) => {
          const Icon = item.icon;
          const isMore = item.id === 'more';
          const active = isMore
            ? moreOpen
            : item.path === '/'
              ? currentPath === '/'
              : currentPath === item.path || currentPath.startsWith(item.path + '/');

          if (isMore) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMoreOpen((prev) => !prev)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                  active ? 'text-accent-teal' : 'text-text-faint'
                }`}
              >
                <Icon width={20} height={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMoreOpen(false)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                active ? 'text-accent-teal' : 'text-text-faint'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon width={20} height={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Coach tools sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60"
              onClick={() => setMoreOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-16 left-0 right-0 z-35 rounded-t-2xl border-t border-edge-default bg-void-surface"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-display font-semibold text-text-bright">
                    Coach Tools
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    className="p-1 rounded-md hover:bg-void-overlay transition-colors"
                    aria-label="Close"
                  >
                    <IconX width={16} height={16} className="text-text-faint" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {coachTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isActive =
                      currentPath === tool.path || currentPath.startsWith(tool.path + '/');

                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          navigate({ to: tool.path });
                        }}
                        className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors ${
                          isActive
                            ? 'bg-accent-teal/10 text-accent-teal'
                            : 'text-text-dim hover:bg-void-overlay'
                        }`}
                      >
                        <ToolIcon width={20} height={20} />
                        <span className="text-[11px] font-medium leading-tight text-center">
                          {tool.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
