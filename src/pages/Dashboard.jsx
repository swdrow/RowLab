import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  ArrowRight,
  BarChart3,
  Dumbbell,
  Anchor,
  LayoutGrid,
  Activity,
  Calendar,
  Trophy,
  ChevronDown,
  Plus,
  Play,
} from 'lucide-react';
import { PageContainer } from '../components/Layout';
import useLineupStore from '../store/lineupStore';
import useAuthStore from '../store/authStore';
import {
  TeamSummary,
  LiveWorkoutDashboard,
  RankingsTable,
  LineupCards,
  AthleteQuickView,
  WorkoutConfigurator,
  CalendarWidget,
  ManualEntryModal,
} from '../components/Dashboard';

/**
 * Coach Dashboard - Customizable tiles with dashboard presets
 *
 * Presets per design document:
 * - Daily Overview: Team Summary, Schedule, Quick Actions
 * - Erg Test Day: Live Workout, Rankings, Athlete Quick-View
 * - Race Week: Lineup Cards, Rankings, Team Summary
 * - Training Review: Team Training Volume, Rankings, Athlete Quick-View
 */

// Dashboard presets configuration
const DASHBOARD_PRESETS = [
  {
    id: 'daily',
    name: 'Daily Overview',
    description: 'Morning check-in view',
    icon: LayoutGrid,
    tiles: ['summary', 'calendar', 'quickActions'],
  },
  {
    id: 'ergTest',
    name: 'Erg Test Day',
    description: 'Test administration',
    icon: Activity,
    tiles: ['liveWorkout', 'rankings', 'athleteQuickView'],
  },
  {
    id: 'raceWeek',
    name: 'Race Week',
    description: 'Competition prep',
    icon: Trophy,
    tiles: ['lineups', 'rankings', 'summary'],
  },
  {
    id: 'training',
    name: 'Training Review',
    description: 'Post-practice analysis',
    icon: BarChart3,
    tiles: ['rankings', 'summary', 'athleteQuickView'],
  },
];

function Dashboard() {
  const { athletes, activeBoats } = useLineupStore();
  const { user, accessToken, activeTeamRole } = useAuthStore();

  // Role check - only coaches and owners can create/edit
  const isCoachOrOwner = ['OWNER', 'COACH'].includes(activeTeamRole);

  // Dashboard state
  const [activePreset, setActivePreset] = useState('daily');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  // Workout state
  const [showWorkoutConfigurator, setShowWorkoutConfigurator] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutData, setWorkoutData] = useState({});
  const [isPolling, setIsPolling] = useState(false);

  // Manual entry modal state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntryTarget, setManualEntryTarget] = useState({ athleteId: null, pieceIndex: null });

  // Calendar events state
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Load calendar events on mount
  useEffect(() => {
    if (accessToken) {
      loadCalendarEvents();
    }
  }, [accessToken]);

  // Load calendar events from API
  const loadCalendarEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch('/api/v1/calendar/events', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.data?.events || []);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const assignedAthletes = activeBoats.reduce((count, boat) => {
      return count + boat.seats.filter(s => s.athlete).length + (boat.coxswain ? 1 : 0);
    }, 0);

    const todayEvents = calendarEvents.filter(e => {
      const eventDate = new Date(e.date);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });

    return {
      totalAthletes: athletes.length,
      activeAthletes: assignedAthletes,
      boatsConfigured: activeBoats.length,
      workoutsToday: todayEvents.length,
      pendingErgData: 0, // Would come from API
    };
  }, [athletes, activeBoats, calendarEvents]);

  // Transform athletes for rankings
  const rankingsData = useMemo(() => {
    return athletes.map(a => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      firstName: a.firstName,
      lastName: a.lastName,
      side: a.side,
      elo: a.eloRating || 1500,
      time2k: a.best2kSeconds,
      time6k: a.best6kSeconds,
      trend: 'stable',
      combinedScore: a.combinedScore || 0,
    }));
  }, [athletes]);

  // Transform lineups
  const lineupsData = useMemo(() => {
    return activeBoats.map(boat => ({
      id: boat.id,
      name: boat.name || `Boat ${boat.id}`,
      boatType: boat.boatType || '8+',
      seats: boat.seats,
      coxswain: boat.coxswain,
      notes: boat.notes,
      versions: boat.versions || [{ number: 1, date: new Date().toISOString() }],
      currentVersion: boat.currentVersion || 1,
    }));
  }, [activeBoats]);

  // Current preset config
  const currentPreset = DASHBOARD_PRESETS.find(p => p.id === activePreset) || DASHBOARD_PRESETS[0];

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick actions for daily overview - filtered by role
  const allQuickActions = [
    { label: 'Build Lineup', desc: 'Create boat assignments', icon: Anchor, to: '/app/lineup', roles: ['OWNER', 'COACH'] },
    { label: 'Athletes', desc: 'Manage your roster', icon: Users, to: '/app/athletes', roles: ['OWNER', 'COACH'] },
    { label: 'Erg Data', desc: 'View erg results', icon: Dumbbell, to: '/app/erg', roles: ['OWNER', 'COACH', 'ATHLETE'] },
    { label: 'Analytics', desc: 'Performance insights', icon: BarChart3, to: '/app/analytics', roles: ['OWNER', 'COACH', 'ATHLETE'] },
  ];

  // Filter actions based on user's role
  const quickActions = allQuickActions.filter(action =>
    !action.roles || (activeTeamRole && action.roles.includes(activeTeamRole))
  );

  // Handle athlete click from rankings
  const handleAthleteClick = (athlete) => {
    setSelectedAthlete({
      ...athlete,
      recentWorkouts: [], // Would come from API
    });
  };

  // Handle workout start
  const handleStartWorkout = (config) => {
    setActiveWorkout({
      ...config,
      startTime: new Date(),
    });
    setShowWorkoutConfigurator(false);
    // Switch to erg test day preset to show live workout
    setActivePreset('ergTest');
  };

  // Handle workout schedule
  const handleScheduleWorkout = async (config) => {
    try {
      await fetch('/api/v1/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'erg-pieces',
          title: config.name,
          date: config.scheduledDate,
          notes: config.notes,
          workoutConfig: config,
        }),
      });
      loadCalendarEvents();
    } catch (err) {
      console.error('Failed to schedule workout:', err);
    }
  };

  // Handle calendar event creation
  const handleEventCreate = async (event) => {
    try {
      const res = await fetch('/api/v1/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: event.title,
          eventType: event.type || 'erg-pieces',
          date: event.date?.toISOString() || new Date().toISOString(),
          startTime: event.time || null,
          notes: event.notes || null,
          visibility: event.visibility || 'all',
        }),
      });
      if (res.ok) {
        loadCalendarEvents();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  // Handle calendar event edit
  const handleEventEdit = async (event) => {
    try {
      await fetch(`/api/v1/calendar/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: event.title,
          eventType: event.type || event.eventType,
          date: event.date instanceof Date ? event.date.toISOString() : event.date,
          startTime: event.time || event.startTime || null,
          notes: event.notes || null,
          visibility: event.visibility || 'all',
        }),
      });
      loadCalendarEvents();
    } catch (err) {
      console.error('Failed to edit event:', err);
    }
  };

  // Handle calendar event delete
  const handleEventDelete = async (eventId) => {
    try {
      await fetch(`/api/v1/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      loadCalendarEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  // Handle manual entry save
  const handleManualEntrySave = (data) => {
    const { athleteId, pieceIndex } = manualEntryTarget;
    if (!athleteId) return;

    setWorkoutData(prev => {
      const athleteData = prev[athleteId] || { pieces: [], status: 'manual' };
      const newPieces = [...athleteData.pieces];

      // Ensure array has enough slots
      while (newPieces.length <= pieceIndex) {
        newPieces.push(null);
      }

      // Set the piece data
      newPieces[pieceIndex] = {
        time: data.time,
        split: data.split,
        strokeRate: data.strokeRate,
        watts: data.watts,
        distance: data.distance,
      };

      return {
        ...prev,
        [athleteId]: {
          ...athleteData,
          pieces: newPieces,
        },
      };
    });

    setShowManualEntry(false);
    setManualEntryTarget({ athleteId: null, pieceIndex: null });
  };

  // Handle export workout data
  const handleExportWorkoutData = () => {
    if (!athletes.length || !Object.keys(workoutData).length) return;

    // Build CSV content
    const headers = ['Athlete', 'Piece', 'Time', 'Split', 'S/M', 'Watts', 'Distance'];
    const rows = [];

    athletes.forEach(athlete => {
      const data = workoutData[athlete.id];
      if (!data?.pieces?.length) return;

      data.pieces.forEach((piece, i) => {
        if (!piece) return;
        rows.push([
          `${athlete.firstName} ${athlete.lastName}`,
          i + 1,
          piece.time ? formatTimeForExport(piece.time) : '',
          piece.split ? formatTimeForExport(piece.split) : '',
          piece.strokeRate || '',
          piece.watts || '',
          piece.distance || '',
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format time for export (M:SS.T)
  const formatTimeForExport = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Render tile based on type
  const renderTile = (tileId) => {
    switch (tileId) {
      case 'summary':
        return (
          <TeamSummary
            key="summary"
            totalAthletes={stats.totalAthletes}
            activeAthletes={stats.activeAthletes}
            boatsConfigured={stats.boatsConfigured}
            workoutsToday={stats.workoutsToday}
            pendingErgData={stats.pendingErgData}
          />
        );

      case 'calendar':
        return (
          <CalendarWidget
            key="calendar"
            events={calendarEvents}
            canCreate={isCoachOrOwner}
            canEdit={isCoachOrOwner}
            canDelete={isCoachOrOwner}
            canSetVisibility={isCoachOrOwner}
            onEventCreate={isCoachOrOwner ? handleEventCreate : null}
            onEventEdit={isCoachOrOwner ? handleEventEdit : null}
            onEventDelete={isCoachOrOwner ? handleEventDelete : null}
            view="week"
          />
        );

      case 'quickActions':
        return (
          <div key="quickActions" className="rounded-xl bg-void-elevated border border-white/[0.06]">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
                  <ArrowRight size={20} className="text-blade-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Quick Actions</h3>
                  <p className="text-xs text-text-muted">Common tasks</p>
                </div>
              </div>
              {isCoachOrOwner && (
                <button
                  onClick={() => setShowWorkoutConfigurator(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blade-blue text-void-deep text-xs font-medium hover:shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-all"
                >
                  <Play size={14} />
                  Start Workout
                </button>
              )}
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex items-center gap-3 p-3 rounded-lg bg-void-surface/50 border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center group-hover:bg-blade-blue group-hover:border-blade-blue transition-all">
                      <Icon size={18} className="text-blade-blue group-hover:text-void-deep transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">{action.label}</div>
                      <div className="text-[10px] text-text-muted truncate">{action.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );

      case 'liveWorkout':
        return (
          <div key="liveWorkout" className="space-y-4">
            {/* Workout header with start button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-semibold text-text-primary">
                  {activeWorkout ? activeWorkout.name : 'Live Workout'}
                </h2>
                {activeWorkout && (
                  <p className="text-xs text-text-muted">
                    Started {new Date(activeWorkout.startTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
              {!activeWorkout && isCoachOrOwner && (
                <button
                  onClick={() => setShowWorkoutConfigurator(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
                >
                  <Plus size={16} />
                  Configure Workout
                </button>
              )}
            </div>
            <LiveWorkoutDashboard
              athletes={athletes.slice(0, 12)}
              workoutData={workoutData}
              activeWorkout={activeWorkout}
              onConfigureWorkout={() => setShowWorkoutConfigurator(true)}
              isPolling={isPolling}
              onManualEntry={(athleteId, pieceIndex) => {
                setManualEntryTarget({ athleteId, pieceIndex });
                setShowManualEntry(true);
              }}
              onExportData={handleExportWorkoutData}
              canConfigure={isCoachOrOwner}
              canExport={isCoachOrOwner}
              canManualEntry={isCoachOrOwner}
              canAddAthlete={isCoachOrOwner}
            />
          </div>
        );

      case 'rankings':
        return (
          <RankingsTable
            key="rankings"
            athletes={rankingsData}
            onAthleteClick={handleAthleteClick}
          />
        );

      case 'lineups':
        return (
          <LineupCards
            key="lineups"
            lineups={lineupsData}
          />
        );

      case 'athleteQuickView':
        return selectedAthlete ? (
          <AthleteQuickView
            key="athleteQuickView"
            athlete={selectedAthlete}
            onClose={() => setSelectedAthlete(null)}
            onViewProfile={(id) => window.location.href = `/app/athletes/${id}`}
          />
        ) : (
          <div key="athleteQuickView" className="rounded-xl bg-void-elevated border border-white/[0.06] p-8 text-center">
            <Users size={32} className="mx-auto mb-3 text-text-muted/50" />
            <p className="text-sm text-text-muted">Select an athlete to view details</p>
            <p className="text-xs text-text-muted/60 mt-1">Click on a name in the rankings table</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer maxWidth="xl" className="relative py-4 sm:py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-[-0.02em]">
            {getGreeting()}{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {currentPreset.description}
          </p>
        </div>

        {/* Preset selector */}
        <div className="relative">
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-void-elevated border border-white/[0.06] hover:border-white/10 transition-all"
          >
            <currentPreset.icon size={18} className="text-blade-blue" />
            <span className="text-sm text-text-primary">{currentPreset.name}</span>
            <ChevronDown
              size={16}
              className={`text-text-muted transition-transform ${showPresetMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showPresetMenu && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-2 w-56 py-2 rounded-xl bg-void-elevated border border-white/10 shadow-2xl z-20"
            >
              {DASHBOARD_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isActive = preset.id === activePreset;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setActivePreset(preset.id);
                      setShowPresetMenu(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left
                      transition-all
                      ${isActive
                        ? 'bg-blade-blue/10 text-blade-blue'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <Icon size={16} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{preset.name}</div>
                      <div className="text-[10px] text-text-muted">{preset.description}</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Dashboard tiles grid - grid-flow-dense fills gaps when col-span-2 items shift rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-min lg:grid-flow-dense">
        {currentPreset.tiles.map((tileId, index) => {
          // Determine which tiles should span full width
          const isFullWidth = tileId === 'liveWorkout' || tileId === 'rankings' || tileId === 'calendar';
          // Determine which tiles should be half width on large screens
          const isHalfWidth = tileId === 'summary' || tileId === 'quickActions' || tileId === 'athleteQuickView';

          return (
            <motion.div
              key={tileId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={isFullWidth ? 'lg:col-span-2' : ''}
            >
              {renderTile(tileId)}
            </motion.div>
          );
        })}
      </div>

      {/* Workout Configurator Modal */}
      <WorkoutConfigurator
        isOpen={showWorkoutConfigurator}
        onClose={() => setShowWorkoutConfigurator(false)}
        onStartWorkout={handleStartWorkout}
        onScheduleWorkout={handleScheduleWorkout}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={showManualEntry}
        onClose={() => {
          setShowManualEntry(false);
          setManualEntryTarget({ athleteId: null, pieceIndex: null });
        }}
        onSave={handleManualEntrySave}
        athleteName={
          manualEntryTarget.athleteId
            ? (() => {
                const athlete = athletes.find(a => a.id === manualEntryTarget.athleteId);
                return athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Unknown';
              })()
            : ''
        }
        pieceNumber={manualEntryTarget.pieceIndex != null ? manualEntryTarget.pieceIndex + 1 : 1}
      />
    </PageContainer>
  );
}

export default Dashboard;
