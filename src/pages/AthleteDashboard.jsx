import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Timer,
  TrendingUp,
  Ship,
  RefreshCw,
  Loader2,
  CheckCircle2,
  LayoutDashboard,
  Dumbbell,
  BarChart3,
  Trophy,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  RecentWorkoutHero,
  TrainingVolumeChart,
  PMCChart,
  PersonalBests,
  ScheduleWidget,
} from '../components/Dashboard';

/**
 * AthleteDashboard - Personal dashboard for athletes
 *
 * Layout: Hybrid Sidebar + Tiles (as per design doc)
 * - Sidebar: Navigation (Overview, Workouts, Stats, Rankings, Schedule)
 * - Main Content: Tiles grid with data visualizations
 */

// Sidebar navigation items
const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'rankings', label: 'Rankings', icon: Trophy },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
];

function AthleteDashboard() {
  const { id: routeAthleteId } = useParams(); // Get athlete ID from URL if present
  const { user, authenticatedFetch, activeTeamRole } = useAuth();
  const canManageAthletes = ['OWNER', 'COACH'].includes(activeTeamRole);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [athleteData, setAthleteData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  // Determine if this is a coach viewing another athlete's dashboard
  const isCoachView = !!routeAthleteId;

  // Fetch athlete data
  useEffect(() => {
    fetchAthleteData();
  }, [routeAthleteId]);

  const fetchAthleteData = async () => {
    try {
      setLoading(true);
      // Use specific endpoint if viewing another athlete, otherwise use /me
      const endpoint = routeAthleteId
        ? `/api/v1/athletes/${routeAthleteId}/dashboard?includeAllHistory=true`
        : '/api/v1/athletes/me?includeAllHistory=true';

      const response = await authenticatedFetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to load athlete data');
      }

      setAthleteData(data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch athlete data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync from Concept2
  const handleSyncC2 = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);

      const response = await authenticatedFetch('/api/v1/concept2/sync/me', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to sync');
      }

      setSyncMessage(`Synced ${data.data.totalFetched} workouts, created ${data.data.ergTestsCreated} erg tests`);
      fetchAthleteData();
    } catch (err) {
      console.error('Sync error:', err);
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Transform erg tests to recent workout format
  const recentWorkout = useMemo(() => {
    if (!athleteData?.ergTests?.length) return null;

    const latestTest = athleteData.ergTests[0];
    return {
      type: latestTest.testType || '2000m',
      date: latestTest.testDate,
      totalTime: latestTest.timeSeconds,
      totalDistance: latestTest.distanceM,
      pieces: latestTest.pieces || [{
        time: latestTest.timeSeconds,
        split: latestTest.splitSeconds || (latestTest.timeSeconds / (latestTest.distanceM / 500)),
        strokeRate: latestTest.strokeRate,
        watts: latestTest.watts,
      }],
    };
  }, [athleteData]);

  // Transform erg tests to training volume data
  const trainingVolumeData = useMemo(() => {
    if (!athleteData?.ergTests?.length) return [];

    // Group by week
    const weeklyData = new Map();
    athleteData.ergTests.forEach(test => {
      const date = new Date(test.testDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { date: weekStart, value: 0 });
      }
      weeklyData.get(weekKey).value += test.distanceM || 0;
    });

    // Convert to array and sort
    const data = Array.from(weeklyData.values())
      .sort((a, b) => a.date - b.date)
      .slice(-8) // Last 8 weeks
      .map((item, i) => ({
        label: `W${i + 1}`,
        value: item.value,
      }));

    return data;
  }, [athleteData]);

  // Transform erg tests to PMC data
  const pmcData = useMemo(() => {
    if (!athleteData?.ergTests?.length) return [];

    return athleteData.ergTests
      .map(test => ({
        date: test.testDate,
        trainingLoad: test.watts || Math.round((test.distanceM || 0) / 100), // Estimate load
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [athleteData]);

  // Transform erg tests to personal bests
  const personalBests = useMemo(() => {
    if (!athleteData?.ergTests?.length) return {};

    const bests = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    athleteData.ergTests.forEach(test => {
      const testType = test.testType || '';
      let key = null;

      if (testType.includes('2000') || testType.includes('2k')) {
        key = '2000m';
      } else if (testType.includes('6000') || testType.includes('6k')) {
        key = '6000m';
      } else if (testType.includes('30') && testType.toLowerCase().includes('min')) {
        key = '30min';
      }

      if (!key) return;

      const current = bests[key];
      const isTime = key !== '30min';

      if (!current) {
        bests[key] = {
          time: isTime ? test.timeSeconds : null,
          distance: !isTime ? test.distanceM : null,
          date: test.testDate,
          isRecent: new Date(test.testDate) > thirtyDaysAgo,
        };
      } else if (isTime && test.timeSeconds < current.time) {
        bests[key] = {
          time: test.timeSeconds,
          date: test.testDate,
          isRecent: new Date(test.testDate) > thirtyDaysAgo,
        };
      } else if (!isTime && test.distanceM > (current.distance || 0)) {
        bests[key] = {
          distance: test.distanceM,
          date: test.testDate,
          isRecent: new Date(test.testDate) > thirtyDaysAgo,
        };
      }
    });

    return bests;
  }, [athleteData]);

  // Schedule data (mock - would come from API)
  const scheduleData = useMemo(() => {
    // In production, this would come from the API
    return [];
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-void-deep flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blade-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !athleteData) {
    return (
      <div className="min-h-screen bg-void-deep flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-xl bg-void-elevated border border-white/[0.06] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blade-blue/10 flex items-center justify-center">
            <User size={32} className="text-blade-blue" />
          </div>
          <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
            No Athlete Profile
          </h2>
          <p className="text-text-secondary mb-6">
            {error?.toLowerCase().includes('no athlete profile') || error?.toLowerCase().includes('not found')
              ? "You don't have an athlete profile linked to your account yet. If you're a coach who also rows, you can create an athlete profile from the Athletes page."
              : error || "Your account is not linked to an athlete profile."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canManageAthletes && (
              <Link
                to="/app/athletes"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
              >
                <User size={16} />
                Go to Athletes
              </Link>
            )}
            <Link
              to="/app"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-void-surface border border-white/[0.06] text-text-secondary text-sm hover:text-text-primary hover:border-white/10 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { athlete, concept2Status, lineups, myRanking, teamVisibility } = athleteData;

  return (
    <div className="min-h-screen bg-void-deep flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-white/[0.06] bg-void-surface/50">
        {/* Profile header */}
        <div className="p-5 border-b border-white/[0.04]">
          {/* Coach view indicator */}
          {isCoachView && (
            <div className="mb-3 px-2 py-1 rounded bg-coxswain-violet/10 border border-coxswain-violet/20 text-coxswain-violet text-[10px] font-medium uppercase tracking-wider text-center">
              Viewing as Coach
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blade-blue/20 border border-blade-blue/30 flex items-center justify-center">
              <User size={20} className="text-blade-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-medium text-text-primary truncate">
                {athlete.firstName} {athlete.lastName}
              </h2>
              <p className="text-xs text-text-muted truncate">
                {athlete.side || 'Athlete'} {athlete.side && '• '}{athlete.team?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-sm transition-all duration-100
                      ${isActive
                        ? 'bg-blade-blue/10 text-blade-blue border border-blade-blue/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* C2 Status - only show for own dashboard, not coach view */}
        {!isCoachView && concept2Status?.connected && (
          <div className="p-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
              <CheckCircle2 size={12} className="text-success" />
              <span className="truncate">{concept2Status.username}</span>
            </div>
            <button
              onClick={handleSyncC2}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blade-blue/10 border border-blade-blue/20 text-blade-blue text-xs hover:bg-blade-blue/20 transition-all disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              <span>Sync Concept2</span>
            </button>
          </div>
        )}

        {/* Back to Athletes button - only show in coach view */}
        {isCoachView && (
          <div className="p-4 border-t border-white/[0.04]">
            <Link
              to="/app/athletes"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary text-xs hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <ArrowLeft size={14} />
              <span>Back to Athletes</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-10 bg-void-deep/95 backdrop-blur-lg border-b border-white/[0.06]">
          {/* Top bar with profile */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blade-blue/20 border border-blade-blue/30 flex items-center justify-center">
                <User size={20} className="text-blade-blue" />
              </div>
              <div>
                <h1 className="text-lg font-display font-semibold text-text-primary">
                  {athlete.firstName} {athlete.lastName}
                </h1>
                <p className="text-xs text-text-muted">{athlete.team?.name}</p>
              </div>
            </div>
            {/* Show sync button for own dashboard, back button for coach view */}
            {!isCoachView && concept2Status?.connected && (
              <button
                onClick={handleSyncC2}
                disabled={syncing}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-blade-blue/10 border border-blade-blue/20 text-blade-blue"
              >
                {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              </button>
            )}
            {isCoachView && (
              <Link
                to="/app/athletes"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary"
              >
                <ArrowLeft size={18} />
              </Link>
            )}
          </div>

          {/* Mobile section tabs - horizontal scroll */}
          <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap
                    min-h-[44px] text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blade-blue/10 text-blade-blue border border-blade-blue/20'
                      : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Sync message */}
        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mx-4 mt-4 px-4 py-3 rounded-lg text-sm ${
              syncMessage.startsWith('Error')
                ? 'bg-danger-red/10 text-danger-red border border-danger-red/20'
                : 'bg-success/10 text-success border border-success/20'
            }`}
          >
            {syncMessage}
          </motion.div>
        )}

        {/* Dashboard tiles */}
        <div className="p-4 lg:p-6 space-y-4 sm:space-y-6 pb-safe">
          {/* Recent Workout Hero - Full width */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RecentWorkoutHero workout={recentWorkout} />
          </motion.div>

          {/* Two-column grid for charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Training Volume */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TrainingVolumeChart
                data={trainingVolumeData}
                metric="distance"
              />
            </motion.div>

            {/* PMC Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <PMCChart data={pmcData} />
            </motion.div>
          </div>

          {/* Two-column grid for stats */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Bests */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PersonalBests bests={personalBests} />
            </motion.div>

            {/* Schedule Widget */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <ScheduleWidget workouts={scheduleData} />
            </motion.div>
          </div>

          {/* Team Ranking (if allowed) */}
          {teamVisibility?.athletesCanSeeRankings && myRanking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-void-elevated border border-white/[0.06] p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-warning-orange/10 border border-warning-orange/20 flex items-center justify-center">
                  <Trophy size={20} className="text-warning-orange" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Team Ranking</h3>
                  <p className="text-xs text-text-muted">Your position among teammates</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-mono font-bold text-warning-orange tabular-nums">
                    #{myRanking.rank}
                  </div>
                  <div className="text-xs text-text-muted">
                    out of {myRanking.totalAthletes} athletes
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono text-text-primary tabular-nums">
                    {myRanking.score?.toFixed(0) || '-'}
                  </div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">
                    Combined Score
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Current Lineups */}
          {lineups && lineups.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-xl bg-void-elevated border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
                <div className="w-10 h-10 rounded-xl bg-spectrum-violet/10 border border-spectrum-violet/20 flex items-center justify-center">
                  <Ship size={20} className="text-spectrum-violet" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Current Lineups</h3>
                  <p className="text-xs text-text-muted">Your boat assignments</p>
                </div>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {lineups.map(lineup => (
                  <div key={lineup.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <h4 className="text-sm font-medium text-text-primary">{lineup.name}</h4>
                      <p className="text-xs text-text-muted">{lineup.boatType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-blade-blue/10 text-blade-blue text-xs font-mono">
                        Seat {lineup.seatNumber}
                      </span>
                      {lineup.isCoxswain && (
                        <span className="px-2.5 py-1 rounded-md bg-coxswain-violet/10 text-coxswain-violet text-xs font-mono">
                          COX
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AthleteDashboard;
