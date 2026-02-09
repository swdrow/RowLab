/**
 * GradientMeshLayout - Layout wrapper for the Gradient Mesh design prototype
 *
 * Direction H: "The Gradient Mesh" — Bold, modern, unapologetically chromatic.
 * Like Stripe's dashboard meets Linear's precision meets Vercel's gradient energy.
 *
 * Features:
 * - Animated multi-layer mesh gradient background (CSS keyframe-driven)
 * - Frosted glass sidebar navigation (MeshSidebar)
 * - Full-height scrollable content area offset for sidebar
 * - AnimatePresence page transitions on route changes
 * - Auth gate via useRequireAuth
 * - .v2 CSS scoping class on root element
 *
 * Route: /mesh/*
 */

import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { LoadingSkeleton, SkeletonLine } from '@v2/components/common';
import { MeshSidebar } from '@v2/components/shell/MeshSidebar';
import '@v2/styles/gradient-mesh.css';

// ============================================
// LAYOUT COMPONENT
// ============================================

export function GradientMeshLayout() {
  const location = useLocation();
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Auth loading state — match existing prototype pattern
  if (isAuthLoading) {
    return (
      <div
        className="v2 h-screen flex items-center justify-center"
        style={{ background: '#060918' }}
      >
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
    <div className="v2 min-h-screen relative overflow-hidden">
      {/* ============================================
          ANIMATED MESH GRADIENT BACKGROUND
          Multiple layers that drift independently for organic motion.
          See gradient-mesh.css for keyframes and layer definitions.
          ============================================ */}
      <div className="gradient-mesh-bg">
        {/* Layers 1 & 2 are ::before and ::after pseudo-elements */}
        {/* Layer 3: Warm amber accent */}
        <div className="gradient-mesh-layer-3" />
        {/* Layer 4: Dark corner reinforcement */}
        <div className="gradient-mesh-layer-4" />
        {/* Layer 5: Pink/magenta undertone */}
        <div className="gradient-mesh-layer-5" />
        {/* Noise texture for anti-banding */}
        <div className="gradient-mesh-noise" />
      </div>

      {/* ============================================
          FROSTED GLASS SIDEBAR
          220px fixed left sidebar with navigation
          ============================================ */}
      <MeshSidebar />

      {/* ============================================
          CONTENT AREA
          Offset left by sidebar width, scrollable
          ============================================ */}
      <div className="relative z-10 ml-[220px] min-h-screen">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="p-6 lg:p-8 min-h-screen"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GradientMeshLayout;
