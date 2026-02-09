import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingFallback } from './components/LoadingFallback';
import { LegacyRedirect } from './components/LegacyRedirect';
import './App.css';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const InviteClaimPage = lazy(() => import('./pages/auth/InviteClaimPage'));

// Integration callback pages
const Concept2CallbackPage = lazy(() => import('./pages/Concept2CallbackPage'));

// V2 routes (new) - using @v2 path alias
const V2Layout = lazy(() => import('@v2/layouts/V2Layout'));
const ShellLayout = lazy(() => import('@v2/layouts/ShellLayout'));
const BetaHome = lazy(() => import('@v2/pages/BetaHome'));
const MeDashboard = lazy(() => import('@v2/pages/MeDashboard'));
const CoachDashboard = lazy(() => import('@v2/pages/coach/CoachDashboard'));
const CoachWhiteboard = lazy(() => import('@v2/pages/CoachWhiteboard'));
const CoachFleet = lazy(() => import('@v2/pages/CoachFleet'));
const CoachAvailability = lazy(() => import('@v2/pages/CoachAvailability'));
const V2AthletesPage = lazy(() => import('@v2/pages/AthletesPage'));
const V2AttendancePage = lazy(() => import('@v2/pages/AttendancePage'));
const V2ErgTestsPage = lazy(() => import('@v2/pages/ErgTestsPage'));
const V2LineupBuilderPage = lazy(() => import('@v2/pages/LineupBuilderPage'));
const V2SeatRacingPage = lazy(() => import('@v2/pages/SeatRacingPage'));
const CoachTrainingPage = lazy(() => import('@v2/pages/CoachTrainingPage'));
const RegattasPage = lazy(() => import('@v2/pages/RegattasPage'));
const RaceDayCommandCenter = lazy(() => import('@v2/pages/RaceDayCommandCenter'));
const RankingsPage = lazy(() => import('@v2/pages/RankingsPage'));
const V2SettingsPage = lazy(() => import('@v2/features/settings/pages/SettingsPage'));
const SessionsPage = lazy(() => import('@v2/pages/training/SessionsPage'));
const SessionDetailPage = lazy(() => import('@v2/pages/training/SessionDetailPage'));
const LiveSessionPage = lazy(() => import('@v2/pages/training/LiveSessionPage'));
const AdvancedRankingsPage = lazy(() => import('@v2/pages/AdvancedRankingsPage'));
const MatrixPlannerPage = lazy(() => import('@v2/pages/MatrixPlannerPage'));
const RecruitingPage = lazy(() => import('@v2/pages/RecruitingPage'));
const AchievementsPage = lazy(() => import('@v2/pages/AchievementsPage'));
const ChallengesPage = lazy(() => import('@v2/pages/ChallengesPage'));
const V2AthleteDetailPage = lazy(() => import('./v2/features/athletes/pages/AthleteDetailPage'));

// Canvas prototype routes (design/canvas branch)
const CanvasLayout = lazy(() => import('@v2/layouts/CanvasLayout'));
const CanvasDashboard = lazy(() => import('@v2/pages/canvas/CanvasDashboard'));
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

// Timeline prototype routes (Direction E: chronological stream)
const TimelineLayout = lazy(() => import('@v2/layouts/TimelineLayout'));

// Gradient Mesh prototype routes (Direction H: vivid gradients + frosted glass)
const GradientMeshLayout = lazy(() => import('@v2/layouts/GradientMeshLayout'));
const MeshDashboard = lazy(() => import('@v2/pages/mesh/MeshDashboard'));

// Publication prototype routes (design/publication branch)
const PublicationLayout = lazy(() => import('@v2/layouts/PublicationLayout'));
const PublicationDashboard = lazy(() => import('@v2/pages/publication/PublicationDashboard'));
const PublicationAthletes = lazy(() => import('@v2/pages/publication/PublicationAthletes'));

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
              {/* Routes with shell (rail + sidebar + content) */}
              <Route
                element={
                  <Suspense
                    fallback={<LoadingFallback variant="component" message="Loading shell..." />}
                  >
                    <ShellLayout />
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
                      <MeDashboard />
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
                      <MeDashboard />
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
                      <CoachDashboard />
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
                      <CoachWhiteboard />
                    </Suspense>
                  }
                />
                <Route
                  path="coach/fleet"
                  element={
                    <Suspense
                      fallback={<LoadingFallback variant="component" message="Loading fleet..." />}
                    >
                      <CoachFleet />
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
                      <CoachAvailability />
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
                      <V2AthleteDetailPage />
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
                      <V2AthletesPage />
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
                      <V2AttendancePage />
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
                      <V2ErgTestsPage />
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
                      <V2LineupBuilderPage />
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
                      <V2SeatRacingPage />
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
                      <AdvancedRankingsPage />
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
                      <MatrixPlannerPage />
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
                      <CoachTrainingPage />
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
                      <RegattasPage />
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
                      <RegattasPage />
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
                      <RaceDayCommandCenter />
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
                      <RankingsPage />
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
                      <SessionsPage />
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
                      <SessionDetailPage />
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
                      <LiveSessionPage />
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
                      <V2SettingsPage />
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
                      <RecruitingPage />
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
                      <AchievementsPage />
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
                      <ChallengesPage />
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
                      <ChallengesPage />
                    </Suspense>
                  }
                />
              </Route>

              {/* Routes without shell (future: onboarding, etc.) can go here */}
            </Route>

            {/* ============================================ */}
            {/* Canvas prototype routes at /canvas */}
            {/* Design exploration: floating dock, zone gradients, no sidebar */}
            {/* ============================================ */}
            <Route path="/canvas" element={<V2Layout />}>
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
                        <LoadingFallback
                          variant="component"
                          message="Loading canvas dashboard..."
                        />
                      }
                    >
                      <CanvasDashboard />
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

                {/* ---- Canvas versions of remaining routes ---- */}
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
            </Route>

            {/* ============================================ */}
            {/* Timeline prototype routes at /timeline */}
            {/* Design exploration: Direction E - chronological stream, time-based nav */}
            {/* ============================================ */}
            <Route path="/timeline" element={<V2Layout />}>
              <Route
                element={
                  <Suspense
                    fallback={<LoadingFallback variant="component" message="Loading timeline..." />}
                  >
                    <TimelineLayout />
                  </Suspense>
                }
              >
                <Route index element={null} />
                <Route
                  path="athletes"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading athletes..." />
                      }
                    >
                      <V2AthletesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="training"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading training..." />
                      }
                    >
                      <CoachTrainingPage />
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
                      <RegattasPage />
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
                      <V2ErgTestsPage />
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
                      <RankingsPage />
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
                      <V2SettingsPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            {/* ============================================ */}
            {/* Gradient Mesh prototype routes at /mesh */}
            {/* Direction H: vivid gradient mesh bg, frosted glass sidebar, Stripe energy */}
            {/* ============================================ */}
            <Route path="/mesh" element={<V2Layout />}>
              <Route
                element={
                  <Suspense
                    fallback={<LoadingFallback variant="component" message="Loading mesh..." />}
                  >
                    <GradientMeshLayout />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading mesh dashboard..." />
                      }
                    >
                      <MeshDashboard />
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
                      <V2AthletesPage />
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
                      <V2AttendancePage />
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
                      <V2ErgTestsPage />
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
                      <RankingsPage />
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
                      <RegattasPage />
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
                      <V2SeatRacingPage />
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
                      <CoachTrainingPage />
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
                      <V2LineupBuilderPage />
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
                      <V2SettingsPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            {/* ============================================ */}
            {/* Publication prototype routes at /app/publication */}
            {/* Design exploration: editorial magazine layout, no sidebar */}
            {/* ============================================ */}
            <Route path="/app/publication" element={<V2Layout />}>
              <Route
                element={
                  <Suspense
                    fallback={
                      <LoadingFallback variant="component" message="Loading publication..." />
                    }
                  >
                    <PublicationLayout />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback
                          variant="component"
                          message="Loading publication dashboard..."
                        />
                      }
                    >
                      <PublicationDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="athletes"
                  element={
                    <Suspense
                      fallback={<LoadingFallback variant="component" message="Loading roster..." />}
                    >
                      <PublicationAthletes />
                    </Suspense>
                  }
                />
                {/* Placeholder routes for nav links — show existing pages */}
                <Route
                  path="training"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading training..." />
                      }
                    >
                      <CoachTrainingPage />
                    </Suspense>
                  }
                />
                <Route
                  path="racing"
                  element={
                    <Suspense
                      fallback={<LoadingFallback variant="component" message="Loading racing..." />}
                    >
                      <RegattasPage />
                    </Suspense>
                  }
                />
                <Route
                  path="analysis"
                  element={
                    <Suspense
                      fallback={
                        <LoadingFallback variant="component" message="Loading analysis..." />
                      }
                    >
                      <RankingsPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            {/* Legacy V1 routes — redirect to /app equivalents */}
            <Route path="/legacy/*" element={<LegacyRedirect />} />

            {/* Beta routes — redirect to /app for bookmark compatibility */}
            <Route path="/beta/*" element={<LegacyRedirect />} />

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-dark-card dark:to-dark-bg flex items-center justify-center p-4">
                  <div className="glass-card p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">🚣</div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
                    <p className="text-text-secondary mb-4">Looks like you've rowed off course!</p>
                    <a
                      href="/app"
                      className="inline-block px-4 py-2 bg-blade-blue text-white rounded-lg hover:bg-blade-blue/90 transition-colors"
                    >
                      Back to Dashboard
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
