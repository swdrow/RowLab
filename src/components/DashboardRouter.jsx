import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Lazy load dashboards for code splitting
const Dashboard = lazy(() => import('../pages/Dashboard'));
const AthleteDashboard = lazy(() => import('../pages/AthleteDashboard'));
const CoxswainView = lazy(() => import('../pages/CoxswainView'));

/**
 * DashboardRouter - Routes users to appropriate dashboard based on role
 *
 * Routing Logic:
 * - OWNER/COACH → Coach Dashboard (default)
 * - COXSWAIN → Coxswain View (dedicated coxswain role)
 * - ATHLETE → Athlete Dashboard
 * - ATHLETE + isCoxswain + Mobile → Coxswain View (legacy coxswain attribute)
 * - Admin without team → Coach Dashboard
 * - No role → Coach Dashboard (handles onboarding)
 */
function DashboardRouter() {
  const { user, activeTeamRole, activeTeamIsCoxswain } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fallback loading
  const LoadingFallback = () => (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blade-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // 1. Admins or users without a team role → Coach Dashboard
  if (!activeTeamRole) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Dashboard />
      </Suspense>
    );
  }

  // 2. COXSWAIN role → Coxswain View (dedicated coxswain role)
  if (activeTeamRole === 'COXSWAIN') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CoxswainView />
      </Suspense>
    );
  }

  // 3. Athlete routing
  if (activeTeamRole === 'ATHLETE') {
    // Check for coxswain status from store or user object (legacy attribute)
    const isCoxswain = activeTeamIsCoxswain || user?.isCoxswain;

    // Coxswains on mobile get the optimized coxswain view
    if (isCoxswain && isMobile) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <CoxswainView />
        </Suspense>
      );
    }

    // Regular athletes get athlete dashboard
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AthleteDashboard />
      </Suspense>
    );
  }

  // 4. OWNER/COACH → Coach Dashboard
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Dashboard />
    </Suspense>
  );
}

export default DashboardRouter;
