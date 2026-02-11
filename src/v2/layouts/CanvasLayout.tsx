/**
 * CanvasLayout - Full-screen fluid workspace layout for The Canvas prototype
 *
 * Replaces ShellLayout with:
 * - No sidebar, no rail
 * - Full-width content
 * - Breathing animated zone background gradients
 * - Floating dock (bottom) + floating toolbar (top)
 * - Framer Motion page transitions between zones
 *
 * Background system: Three independently-animated CSS gradient layers
 * that drift slowly, creating an organic "breathing" atmosphere.
 * Zone colors are injected via CSS custom properties and crossfade
 * with Framer Motion when zones change.
 *
 * Design: design/canvas branch prototype
 */

import { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@v2/contexts/AuthContext';
import { LoadingSkeleton, SkeletonLine } from '@v2/components/common';
import { CanvasDock, useZone } from '@v2/components/shell/CanvasDock';
import { CanvasToolbar } from '@v2/components/shell/CanvasToolbar';
import { MobileNav } from '@v2/components/shell/MobileNav';
import { useShowMobileLayout } from '@v2/hooks/useBreakpoint';
import '@v2/styles/canvas-atmosphere.css';

// ============================================
// ZONE → CSS CUSTOM PROPERTY MAPPING
// Each zone gets a unique glow + wash color pair
// ============================================

const ZONE_ATMOSPHERE: Record<string, { glow: string; wash: string }> = {
  home: {
    glow: 'rgba(251, 191, 36, 0.05)',
    wash: 'rgba(245, 158, 11, 0.025)',
  },
  team: {
    glow: 'rgba(20, 184, 166, 0.05)',
    wash: 'rgba(129, 140, 248, 0.025)',
  },
  training: {
    glow: 'rgba(245, 158, 11, 0.05)',
    wash: 'rgba(251, 191, 36, 0.025)',
  },
  racing: {
    glow: 'rgba(248, 113, 113, 0.05)',
    wash: 'rgba(236, 72, 153, 0.025)',
  },
  analysis: {
    glow: 'rgba(129, 140, 248, 0.05)',
    wash: 'rgba(20, 184, 166, 0.025)',
  },
  settings: {
    glow: 'rgba(115, 115, 115, 0.035)',
    wash: 'rgba(115, 115, 115, 0.02)',
  },
};

// ============================================
// CANVAS LAYOUT
// ============================================

export function CanvasLayout() {
  const zone = useZone();
  const location = useLocation();
  const showMobileLayout = useShowMobileLayout();

  // Require authentication (V2 AuthContext — not the V1 stub)
  const { isAuthenticated, isInitialized, isLoading: isAuthLoading } = useAuth();

  // Build CSS custom property values for the current zone
  const atmosphereVars = useMemo(
    () => ({
      '--canvas-zone-glow': ZONE_ATMOSPHERE[zone.id]?.glow ?? ZONE_ATMOSPHERE.home.glow,
      '--canvas-zone-wash': ZONE_ATMOSPHERE[zone.id]?.wash ?? ZONE_ATMOSPHERE.home.wash,
    }),
    [zone.id]
  ) as React.CSSProperties;

  // Wait for AuthContext to finish initializing before making auth decisions
  if (!isInitialized || isAuthLoading) {
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

  // Redirect to login only AFTER auth has fully initialized
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div
      className="v2 canvas-layout min-h-screen bg-ink-deep relative overflow-hidden"
      style={atmosphereVars}
    >
      {/* ============================================ */}
      {/* BREATHING ATMOSPHERE — animated CSS gradient layers */}
      {/* These drift independently via canvas-atmosphere.css keyframes */}
      {/* Zone colors crossfade when zone changes (Framer Motion handles the */}
      {/* CSS custom property transition, CSS handles the drift animation) */}
      {/* ============================================ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Layer 1: Primary zone nebula — slow diagonal drift */}
        <div className="canvas-atmo-layer-1" />

        {/* Layer 2: Secondary wash — complementary tone, counter-orbit */}
        <div className="canvas-atmo-layer-2" />

        {/* Layer 3: Breathing pulse — gentle opacity oscillation */}
        <div className="canvas-atmo-pulse" />

        {/* Layer 4: Edge vignette — grounds the atmosphere */}
        <div className="canvas-atmo-vignette" />
      </div>

      {/* ============================================ */}
      {/* ZONE ACCENT GLOW — Framer Motion crossfade on zone change */}
      {/* This provides the instant zone-color feedback while the CSS */}
      {/* layers provide the continuous breathing motion */}
      {/* ============================================ */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{ background: zone.bgGradient }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Secondary zone glow — bottom edge reflection */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: `radial-gradient(ellipse 120% 60% at 50% 100%, rgba(${zone.accentRgb}, 0.03) 0%, transparent 60%)`,
        }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />

      {/* Subtle noise texture overlay for depth/anti-banding */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* ============================================ */}
      {/* NAVIGATION - Mobile or Desktop */}
      {/* ============================================ */}
      {showMobileLayout ? (
        <MobileNav />
      ) : (
        <>
          {/* FLOATING TOOLBAR - top (desktop only) */}
          <CanvasToolbar zone={zone} />
        </>
      )}

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
          className={`relative z-10 px-6 max-w-7xl mx-auto min-h-screen ${
            showMobileLayout ? 'pt-14 pb-16' : 'pt-36 pb-28'
          }`}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* ============================================ */}
      {/* FLOATING DOCK - bottom (desktop only) */}
      {/* ============================================ */}
      {!showMobileLayout && (
        <>
          <CanvasDock />
          {/* Bottom fade for dock breathing room */}
          <div
            className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40
                          bg-gradient-to-t from-ink-deep/80 via-ink-deep/40 to-transparent"
          />
        </>
      )}
    </div>
  );
}

export default CanvasLayout;
