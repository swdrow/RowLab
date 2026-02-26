import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingFallback } from './components/LoadingFallback';
import { LegacyRedirect } from './components/LegacyRedirect';
import { SplashScreen } from './components/SplashScreen';
import './App.css';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const InviteClaimPage = lazy(() => import('./pages/auth/InviteClaimPage'));

// Integration callback pages
const Concept2CallbackPage = lazy(() => import('./pages/Concept2CallbackPage'));

// Public share page (no auth required)
const SharePage = lazy(() => import('./v2/features/share-cards/routes/SharePage.tsx'));

// V2 Layout
const V2Layout = lazy(() => import('@v2/layouts/V2Layout'));

// Canvas pages (promoted to /app)
const CanvasLayout = lazy(() => import('@v2/layouts/CanvasLayout'));
const CanvasAthletesPage = lazy(() =>
  import('./v2/pages/canvas/CanvasAthletesPage').then((m) => ({ default: m.CanvasAthletesPage }))
);
const CanvasAttendancePage = lazy(() =>
  import('./v2/pages/canvas/CanvasAttendancePage').then((m) => ({
    default: m.CanvasAttendancePage,
  }))
);
const CanvasCoachTrainingPage = lazy(() =>
  import('./v2/pages/canvas/CanvasCoachTrainingPage').then((m) => ({
    default: m.CanvasCoachTrainingPage,
  }))
);
const CanvasSeatRacingPage = lazy(() =>
  import('./v2/pages/canvas/CanvasSeatRacingPage').then((m) => ({
    default: m.CanvasSeatRacingPage,
  }))
);
const CanvasErgTestsPage = lazy(() =>
  import('./v2/pages/canvas/CanvasErgTestsPage').then((m) => ({ default: m.CanvasErgTestsPage }))
);
const CanvasWorkoutsPage = lazy(() =>
  import('./v2/pages/canvas/CanvasWorkoutsPage').then((m) => ({ default: m.CanvasWorkoutsPage }))
);
const CanvasRegattasPage = lazy(() =>
  import('./v2/pages/canvas/CanvasRegattasPage').then((m) => ({ default: m.CanvasRegattasPage }))
);
const CanvasRankingsPage = lazy(() =>
  import('./v2/pages/canvas/CanvasRankingsPage').then((m) => ({ default: m.CanvasRankingsPage }))
);
const CanvasSettingsPage = lazy(() =>
  import('./v2/pages/canvas/CanvasSettingsPage').then((m) => ({ default: m.CanvasSettingsPage }))
);
const CanvasSessionsPage = lazy(() =>
  import('./v2/pages/canvas/CanvasSessionsPage').then((m) => ({ default: m.CanvasSessionsPage }))
);
const CanvasMeDashboard = lazy(() =>
  import('./v2/pages/canvas/CanvasMeDashboard').then((m) => ({ default: m.CanvasMeDashboard }))
);
const CanvasCoachDashboardPage = lazy(() =>
  import('./v2/pages/canvas/CanvasCoachDashboardPage').then((m) => ({
    default: m.CanvasCoachDashboardPage,
  }))
);
const CanvasWhiteboardPage = lazy(() =>
  import('./v2/pages/canvas/CanvasWhiteboardPage').then((m) => ({
    default: m.CanvasWhiteboardPage,
  }))
);
const CanvasFleetPage = lazy(() =>
  import('./v2/pages/canvas/CanvasFleetPage').then((m) => ({ default: m.CanvasFleetPage }))
);
const CanvasAvailabilityPage = lazy(() =>
  import('./v2/pages/canvas/CanvasAvailabilityPage').then((m) => ({
    default: m.CanvasAvailabilityPage,
  }))
);
const CanvasAthleteDetailPage = lazy(() =>
  import('./v2/pages/canvas/CanvasAthleteDetailPage').then((m) => ({
    default: m.CanvasAthleteDetailPage,
  }))
);
const CanvasLineupBuilderPage = lazy(() =>
  import('./v2/pages/canvas/CanvasLineupBuilderPage').then((m) => ({
    default: m.CanvasLineupBuilderPage,
  }))
);
const CanvasAdvancedRankingsPage = lazy(() =>
  import('./v2/pages/canvas/CanvasAdvancedRankingsPage').then((m) => ({
    default: m.CanvasAdvancedRankingsPage,
  }))
);
const CanvasMatrixPlannerPage = lazy(() =>
  import('./v2/pages/canvas/CanvasMatrixPlannerPage').then((m) => ({
    default: m.CanvasMatrixPlannerPage,
  }))
);
const CanvasRaceDayPage = lazy(() =>
  import('./v2/pages/canvas/CanvasRaceDayPage').then((m) => ({ default: m.CanvasRaceDayPage }))
);
const CanvasSessionDetailPage = lazy(() =>
  import('./v2/pages/canvas/CanvasSessionDetailPage').then((m) => ({
    default: m.CanvasSessionDetailPage,
  }))
);
const CanvasLiveSessionPage = lazy(() =>
  import('./v2/pages/canvas/CanvasLiveSessionPage').then((m) => ({
    default: m.CanvasLiveSessionPage,
  }))
);
const CanvasRecruitingPage = lazy(() =>
  import('./v2/pages/canvas/CanvasRecruitingPage').then((m) => ({
    default: m.CanvasRecruitingPage,
  }))
);
const CanvasAchievementsPage = lazy(() =>
  import('./v2/pages/canvas/CanvasAchievementsPage').then((m) => ({
    default: m.CanvasAchievementsPage,
  }))
);
const CanvasChallengesPage = lazy(() =>
  import('./v2/pages/canvas/CanvasChallengesPage').then((m) => ({
    default: m.CanvasChallengesPage,
  }))
);

// Error Boundary for catching rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-dark-card dark:to-dark-bg flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h1>
            <p className="text-text-secondary mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blade-blue text-white rounded-lg hover:bg-blade-blue/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <SplashScreen />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback message="Loading RowLab..." />}>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes */}
            <Route
              path="/login"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route
              path="/register"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <RegisterPage />
                </Suspense>
              }
            />
            <Route
              path="/join"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <InviteClaimPage />
                </Suspense>
              }
            />

            {/* Public share page (no auth) */}
            <Route
              path="/share/:shareId"
              element={
                <Suspense fallback={<LoadingFallback message="Loading share card..." />}>
                  <SharePage />
                </Suspense>
              }
            />

            {/* Integration callbacks */}
            <Route
              path="/settings/integrations"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <Concept2CallbackPage />
                </Suspense>
              }
            />
            <Route
              path="/concept2/callback"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <Concept2CallbackPage />
                </Suspense>
              }
            />

            {/* V2 routes at /app (new default for authenticated users) */}
            <Route path="/app" element={<V2Layout />}>
              {/* Routes with Canvas layout (floating dock + toolbar) */}
              <Route
                element={
                  <Suspense
                    fallback={<LoadingFallback variant="component" message="Loading canvas..." />}
                  >
                    <CanvasLayout />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading dashboard..." />
                      }
                    >
                      <CanvasMeDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="me"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading dashboard..." />
                      }
                    >
                      <CanvasMeDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/dashboard"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading coach dashboard..." />
                      }
                    >
                      <CanvasCoachDashboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/whiteboard"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading whiteboard..." />
                      }
                    >
                      <CanvasWhiteboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/fleet"
                  element={
                    <Suspense
                      fallback={<LoadingFallback variant="component" message="Loading fleet..." />}
                    >
                      <CanvasFleetPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/availability"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading availability..." />
                      }
                    >
                      <CanvasAvailabilityPage />
                    </Suspense>
                  }
                />
                <Route
                  path="athletes/:id"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading athlete..." />
                      }
                    >
                      <CanvasAthleteDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="athletes"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading athletes..." />
                      }
                    >
                      <CanvasAthletesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="attendance"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading attendance..." />
                      }
                    >
                      <CanvasAttendancePage />
                    </Suspense>
                  }
                />
                <Route
                  path="erg-tests"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading erg tests..." />
                      }
                    >
                      <CanvasErgTestsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="workouts"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading workouts..." />
                      }
                    >
                      <CanvasWorkoutsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/lineup-builder"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading lineup builder..." />
                      }
                    >
                      <CanvasLineupBuilderPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/seat-racing"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading seat racing..." />
                      }
                    >
                      <CanvasSeatRacingPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/seat-racing/advanced-rankings"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback
                          variant="component"
                          message="Loading advanced rankings..."
                        />
                      }
                    >
                      <CanvasAdvancedRankingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/seat-racing/matrix-planner"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading matrix planner..." />
                      }
                    >
                      <CanvasMatrixPlannerPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/training"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading training..." />
                      }
                    >
                      <CanvasCoachTrainingPage />
                    </Suspense>
                  }
                />
                <Route
                  path="regattas"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading regattas..." />
                      }
                    >
                      <CanvasRegattasPage />
                    </Suspense>
                  }
                />
                <Route
                  path="regattas/:regattaId"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading regatta..." />
                      }
                    >
                      <CanvasRegattasPage />
                    </Suspense>
                  }
                />
                <Route
                  path="regattas/:regattaId/race-day"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading race day..." />
                      }
                    >
                      <CanvasRaceDayPage />
                    </Suspense>
                  }
                />
                <Route
                  path="rankings"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading rankings..." />
                      }
                    >
                      <CanvasRankingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="training/sessions"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading sessions..." />
                      }
                    >
                      <CanvasSessionsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="training/sessions/:sessionId"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading session..." />
                      }
                    >
                      <CanvasSessionDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="training/sessions/:sessionId/live"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading live session..." />
                      }
                    >
                      <CanvasLiveSessionPage />
                    </Suspense>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading settings..." />
                      }
                    >
                      <CanvasSettingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="recruiting"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading recruiting..." />
                      }
                    >
                      <CanvasRecruitingPage />
                    </Suspense>
                  }
                />
                <Route
                  path="achievements"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading achievements..." />
                      }
                    >
                      <CanvasAchievementsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="challenges"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading challenges..." />
                      }
                    >
                      <CanvasChallengesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="challenges/:id"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading challenge..." />
                      }
                    >
                      <CanvasChallengesPage />
                    </Suspense>
                  }
                />
              </Route>

              {/* Routes without canvas layout (future: onboarding, etc.) can go here */}
            </Route>

            {/* Legacy V1 routes — redirect to /app equivalents */}
            <Route path="/legacy/*" element={<LegacyRedirect />} />

            {/* Beta routes — redirect to /app for bookmark compatibility */}
            <Route path="/beta/*" element={<LegacyRedirect />} />

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <NotFoundPage />
                </Suspense>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
