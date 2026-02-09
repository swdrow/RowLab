/**
 * PublicationLayout - Full-width editorial layout
 *
 * Replaces the sidebar-based ShellLayout with a thin top nav
 * and full-width content area. Each page has complete editorial
 * control of its layout within max-w-6xl containment.
 *
 * Features:
 * - Thin PublicationNav top bar (48px)
 * - Full-width content below nav
 * - AnimatePresence page transitions
 * - max-w-6xl content containment
 * - Command palette integration
 */

import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PublicationNav } from '@v2/components/shell/PublicationNav';
import { CommandPalette } from '@v2/features/search/components/CommandPalette';
import { useRequireAuth } from '@/hooks/useAuth';
import { LoadingSkeleton, SkeletonLine } from '@v2/components/common';

export function PublicationLayout() {
  const location = useLocation();
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Auth loading state
  if (isAuthLoading) {
    return (
      <div className="v2 h-screen flex items-center justify-center bg-ink-deep">
        <LoadingSkeleton>
          <div className="space-y-4 w-64">
            <SkeletonLine height={40} />
            <SkeletonLine height={200} />
            <SkeletonLine height={100} />
          </div>
        </LoadingSkeleton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-deep">
      {/* Global command palette */}
      <CommandPalette />

      {/* Editorial top nav */}
      <PublicationNav />

      {/* Page content with transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pt-12"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

export default PublicationLayout;
