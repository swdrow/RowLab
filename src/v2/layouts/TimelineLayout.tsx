/**
 * TimelineLayout - Chronological stream layout for The Timeline prototype (Direction E)
 *
 * The entire app is organized around time. Instead of feature-based navigation
 * (Athletes, Training, Regattas), the user navigates by zooming in/out of
 * time periods: Today, This Week, This Month, This Season, All Time.
 *
 * Layout structure:
 * - Fixed left rail (60px) with time-scope icons
 * - Fixed top bar with timeline scrubber minimap + search + filters
 * - Scrolling content area: vertical timeline stream
 *
 * Features:
 * - Auth-gated (useRequireAuth)
 * - Framer Motion page transitions
 * - Ambient background effects (noise texture, subtle gradient)
 * - State lifted here so rail, scrubber, and content stay in sync
 *
 * Design: Direction E - The Timeline prototype
 */

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { LoadingSkeleton, SkeletonLine } from '@v2/components/common';
import { TimelineRail, type TimeScope } from '@v2/components/shell/TimelineRail';
import { TimelineScrubber, type EventFilter } from '@v2/components/shell/TimelineScrubber';
import TimelineDashboard from '@v2/pages/timeline/TimelineDashboard';

// ============================================
// TIMELINE LAYOUT
// ============================================

export function TimelineLayout() {
  const location = useLocation();
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Shared state: time scope and event filter
  const [activeScope, setActiveScope] = useState<TimeScope>('season');
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');

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

  // Check if we're on the index route (no sub-path after /timeline)
  const isIndexRoute = location.pathname === '/timeline' || location.pathname === '/timeline/';

  return (
    <div className="v2 min-h-screen bg-ink-deep relative overflow-hidden">
      {/* ============================================ */}
      {/* AMBIENT BACKGROUND EFFECTS */}
      {/* ============================================ */}

      {/* Subtle radial gradient from the center-top */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(251,191,36,0.015) 0%, transparent 60%)',
        }}
      />

      {/* Noise texture overlay for tactile depth */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* ============================================ */}
      {/* LEFT RAIL - Time scope navigation */}
      {/* ============================================ */}
      <TimelineRail activeScope={activeScope} onScopeChange={setActiveScope} />

      {/* ============================================ */}
      {/* TOP BAR - Scrubber minimap + search + filters */}
      {/* ============================================ */}
      <TimelineScrubber
        activeScope={activeScope}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onScopeChange={setActiveScope}
      />

      {/* ============================================ */}
      {/* CONTENT AREA - Timeline stream or nested pages */}
      {/* ============================================ */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 ml-[60px] pt-[72px] pb-16 px-6 min-h-screen"
        >
          {isIndexRoute ? (
            <TimelineDashboard activeFilter={activeFilter} activeScope={activeScope} />
          ) : (
            <Outlet />
          )}
        </motion.main>
      </AnimatePresence>

      {/* Bottom gradient fade */}
      <div
        className="fixed bottom-0 left-[60px] right-0 h-16 pointer-events-none z-20
                    bg-gradient-to-t from-ink-deep/60 to-transparent"
      />
    </div>
  );
}

export default TimelineLayout;
