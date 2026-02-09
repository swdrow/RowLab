/**
 * CanvasLayout - Full-screen fluid workspace layout for The Canvas prototype
 *
 * Replaces ShellLayout with:
 * - No sidebar, no rail
 * - Full-width content
 * - Animated zone background gradients
 * - Floating dock (bottom) + floating toolbar (top)
 * - Framer Motion page transitions between zones
 *
 * Design: design/canvas branch prototype
 */

import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { LoadingSkeleton, SkeletonLine } from '@v2/components/common';
import { CanvasDock, useZone } from '@v2/components/shell/CanvasDock';
import { CanvasToolbar } from '@v2/components/shell/CanvasToolbar';

// ============================================
// CANVAS LAYOUT
// ============================================

export function CanvasLayout() {
  const zone = useZone();
  const location = useLocation();

  // Require authentication
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Show loading state while auth is verified
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
    <div className="v2 min-h-screen bg-ink-deep relative overflow-hidden">
      {/* ============================================ */}
      {/* AMBIENT ZONE GRADIENT - very subtle, background layer */}
      {/* ============================================ */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{ background: zone.bgGradient }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Secondary ambient glow — lower, more diffuse */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: `radial-gradient(ellipse 120% 60% at 50% 100%, rgba(${zone.accentRgb}, 0.03) 0%, transparent 60%)`,
        }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />

      {/* Subtle noise texture overlay for depth */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* ============================================ */}
      {/* FLOATING TOOLBAR - top */}
      {/* ============================================ */}
      <CanvasToolbar zone={zone} />

      {/* ============================================ */}
      {/* CONTENT AREA - full width, with page transitions */}
      {/* ============================================ */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 pt-20 pb-28 px-6 max-w-7xl mx-auto min-h-screen"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* ============================================ */}
      {/* FLOATING DOCK - bottom */}
      {/* ============================================ */}
      <CanvasDock />

      {/* Bottom fade for dock breathing room */}
      <div
        className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40
                      bg-gradient-to-t from-ink-deep/80 via-ink-deep/40 to-transparent"
      />
    </div>
  );
}

export default CanvasLayout;
