import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingFallback } from './components/LoadingFallback';
import './App.css';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardRouter = lazy(() => import('./components/DashboardRouter'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AthleteDashboard = lazy(() => import('./pages/AthleteDashboard'));
const LineupBuilder = lazy(() => import('./pages/LineupBuilder'));
const BoatViewPage = lazy(() => import('./pages/BoatViewPage'));
const AthletesPage = lazy(() => import('./pages/AthletesPage'));
const ErgDataPage = lazy(() => import('./pages/ErgDataPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SeatRacingPage = lazy(() => import('./pages/SeatRacingPage'));
const RacingPage = lazy(() => import('./pages/RacingPage'));
const TrainingPlanPage = lazy(() => import('./pages/TrainingPlanPage'));
const CommunicationPage = lazy(() => import('./pages/CommunicationPage'));
const AdvancedPage = lazy(() => import('./pages/AdvancedPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const CoxswainView = lazy(() => import('./pages/CoxswainView'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));

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
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Something went wrong
            </h1>
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

            {/* App routes with layout */}
            <Route path="/app" element={<AppLayout />}>
              <Route
                index
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <DashboardRouter />
                  </Suspense>
                }
              />
              <Route
                path="athlete-dashboard"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <AthleteDashboard />
                  </Suspense>
                }
              />
              <Route
                path="lineup"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <LineupBuilder />
                  </Suspense>
                }
              />
              <Route
                path="boat-view"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" message="Loading 3D viewer..." />}>
                    <BoatViewPage />
                  </Suspense>
                }
              />
              <Route
                path="athletes"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <AthletesPage />
                  </Suspense>
                }
              />
              <Route
                path="athletes/:id"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <AthleteDashboard />
                  </Suspense>
                }
              />
              <Route
                path="erg"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <ErgDataPage />
                  </Suspense>
                }
              />
              <Route
                path="analytics"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
              <Route
                path="seat-racing"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <SeatRacingPage />
                  </Suspense>
                }
              />
              <Route
                path="training-plans"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <TrainingPlanPage />
                  </Suspense>
                }
              />
              <Route
                path="racing"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <RacingPage />
                  </Suspense>
                }
              />
              <Route
                path="communication"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <CommunicationPage />
                  </Suspense>
                }
              />
              <Route
                path="advanced"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <AdvancedPage />
                  </Suspense>
                }
              />
              <Route
                path="billing"
                element={<Navigate to="/app/settings?tab=billing" replace />}
              />
              <Route
                path="coxswain"
                element={
                  <Suspense fallback={<LoadingFallback variant="component" />}>
                    <CoxswainView />
                  </Suspense>
                }
              />
            </Route>

            {/* V2 Beta routes - isolated under /beta */}
            <Route path="/beta" element={<V2Layout />}>
              {/* Routes with shell (rail + sidebar + content) */}
              <Route
                element={
                  <Suspense fallback={<LoadingFallback variant="component" message="Loading shell..." />}>
                    <ShellLayout />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<LoadingFallback variant="component" message="Loading V2..." />}>
                      <BetaHome />
                    </Suspense>
                  }
                />
              </Route>

              {/* Routes without shell (future: onboarding, etc.) can go here */}
            </Route>

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-dark-card dark:to-dark-bg flex items-center justify-center p-4">
                  <div className="glass-card p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">🚣</div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">
                      Page Not Found
                    </h1>
                    <p className="text-text-secondary mb-4">
                      Looks like you've rowed off course!
                    </p>
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
