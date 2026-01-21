import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Wifi, WifiOff, Save, Check, Loader2 } from 'lucide-react';
import { BoatRoster, WorkoutEntry, CommunicationPanel } from '../components/Coxswain';
import useLineupStore from '../store/lineupStore';
import useAuthStore from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

/**
 * CoxswainView - Mobile-first coxswain interface
 *
 * Combines BoatRoster, WorkoutEntry, and CommunicationPanel
 * for on-water data capture and communication.
 *
 * Features:
 * - Pull-to-refresh gesture support
 * - Boat switching persists in localStorage
 * - Offline capability for piece entry
 * - Auto-save drafts
 */
function CoxswainView() {
  const { user } = useAuthStore();
  const { authenticatedFetch } = useAuth();
  const { boatConfigs, athletes } = useLineupStore();

  // State
  const [activeBoat, setActiveBoat] = useState(null);
  const [coxswainBoats, setCoxswainBoats] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [preWorkoutNotes, setPreWorkoutNotes] = useState(null);
  const [postWorkoutNotes, setPostWorkoutNotes] = useState(null);
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [commsCollapsed, setCommsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'
  const [sessionHistory, setSessionHistory] = useState([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved boat preference from localStorage
  useEffect(() => {
    const savedBoatId = localStorage.getItem('coxswain-active-boat');
    if (savedBoatId && coxswainBoats.length > 0) {
      const boat = coxswainBoats.find(
        (b) => b.id === savedBoatId || b.name === savedBoatId
      );
      if (boat) {
        setActiveBoat(boat);
      }
    }
  }, [coxswainBoats]);

  // Find boats where user is coxswain
  useEffect(() => {
    if (!user || !boatConfigs) return;

    // For demo purposes, create mock boats if no real data
    // In production, this would filter by actual coxswain assignment
    const mockBoats = [
      {
        id: 'varsity-8',
        name: 'Varsity 8+',
        coxswain: { name: user.name || 'Coxswain' },
        seats: [
          { number: 8, athlete: { name: 'Smith' }, side: 'P' },
          { number: 7, athlete: { name: 'Jones' }, side: 'S' },
          { number: 6, athlete: { name: 'Brown' }, side: 'P' },
          { number: 5, athlete: { name: 'Wilson' }, side: 'S' },
          { number: 4, athlete: { name: 'Davis' }, side: 'P' },
          { number: 3, athlete: { name: 'Lee' }, side: 'S' },
          { number: 2, athlete: { name: 'Kim' }, side: 'P' },
          { number: 1, athlete: { name: 'Chen' }, side: 'S' },
        ],
      },
      {
        id: 'jv-8',
        name: 'JV 8+',
        coxswain: { name: user.name || 'Coxswain' },
        seats: [
          { number: 8, athlete: { name: 'Taylor' }, side: 'P' },
          { number: 7, athlete: { name: 'Anderson' }, side: 'S' },
          { number: 6, athlete: { name: 'Thomas' }, side: 'P' },
          { number: 5, athlete: { name: 'Jackson' }, side: 'S' },
          { number: 4, athlete: { name: 'White' }, side: 'P' },
          { number: 3, athlete: { name: 'Harris' }, side: 'S' },
          { number: 2, athlete: { name: 'Martin' }, side: 'P' },
          { number: 1, athlete: { name: 'Garcia' }, side: 'S' },
        ],
      },
    ];

    // Use real boats if available, otherwise use mock data
    const userBoats =
      boatConfigs && boatConfigs.length > 0
        ? boatConfigs.filter(
            (b) =>
              b.coxswain?.id === user.id ||
              b.coxswain?.name === user.name ||
              b.coxswainId === user.id
          )
        : mockBoats;

    setCoxswainBoats(userBoats.length > 0 ? userBoats : mockBoats);

    // Set default boat if none selected
    if (!activeBoat && userBoats.length > 0) {
      setActiveBoat(userBoats[0]);
    } else if (!activeBoat && mockBoats.length > 0) {
      setActiveBoat(mockBoats[0]);
    }
  }, [user, boatConfigs, athletes]);

  // Load saved pieces and notes from localStorage
  useEffect(() => {
    if (!activeBoat) return;

    const boatKey = activeBoat.id || activeBoat.name;

    // Load pieces
    try {
      const savedPieces = localStorage.getItem(`coxswain-pieces-${boatKey}`);
      if (savedPieces) {
        setPieces(JSON.parse(savedPieces));
      } else {
        setPieces([]);
      }
    } catch (e) {
      console.warn('Failed to load pieces:', e);
      setPieces([]);
    }

    // Load post-workout notes
    try {
      const savedNotes = localStorage.getItem(`coxswain-post-notes-${boatKey}`);
      if (savedNotes) {
        setPostWorkoutNotes(JSON.parse(savedNotes));
      } else {
        setPostWorkoutNotes(null);
      }
    } catch (e) {
      console.warn('Failed to load notes:', e);
      setPostWorkoutNotes(null);
    }

    // Mock pre-workout notes (would come from coach in production)
    setPreWorkoutNotes({
      instructions: '3x1500m at race pace. Focus on consistent splits and clean catches.',
      focusPoints: [
        'Maintain connection through the drive',
        'Quick, clean catches - no sky rowing',
        'Keep the rate at 32-34 for pieces',
      ],
      technicalCues: [
        'Hands away before the body moves',
        'Stay long at the catch',
      ],
      createdAt: new Date().toISOString(),
    });
  }, [activeBoat]);

  // Handle boat switch
  const handleBoatSwitch = useCallback((boat) => {
    setActiveBoat(boat);
    const boatKey = boat.id || boat.name;
    localStorage.setItem('coxswain-active-boat', boatKey);
  }, []);

  // Handle athlete click
  const handleAthleteClick = useCallback((athlete) => {
    if (athlete) {
      // TODO: Open athlete detail modal or navigate to athlete page
    }
  }, []);

  // Handle save piece
  const handleSavePiece = useCallback(
    async (piece) => {
      const boatKey = activeBoat?.id || activeBoat?.name;
      if (!boatKey) return;

      // Add or update piece
      const updatedPieces = [...pieces];
      const existingIndex = updatedPieces.findIndex(
        (p) => p.number === piece.number
      );
      if (existingIndex >= 0) {
        updatedPieces[existingIndex] = piece;
      } else {
        updatedPieces.push(piece);
      }

      // Sort by piece number
      updatedPieces.sort((a, b) => a.number - b.number);

      setPieces(updatedPieces);
      localStorage.setItem(
        `coxswain-pieces-${boatKey}`,
        JSON.stringify(updatedPieces)
      );

      // If offline, queue for sync
      if (!isOnline) {
        setOfflineQueue((prev) => [
          ...prev,
          { type: 'piece', boatKey, piece, timestamp: Date.now() },
        ]);
      }
    },
    [activeBoat, pieces, isOnline]
  );

  // Handle delete piece
  const handleDeletePiece = useCallback(
    (pieceNumber) => {
      const boatKey = activeBoat?.id || activeBoat?.name;
      if (!boatKey) return;

      const updatedPieces = pieces.filter((p) => p.number !== pieceNumber);
      setPieces(updatedPieces);
      localStorage.setItem(
        `coxswain-pieces-${boatKey}`,
        JSON.stringify(updatedPieces)
      );
    },
    [activeBoat, pieces]
  );

  // Handle save notes
  const handleSaveNotes = useCallback(
    async (notes) => {
      const boatKey = activeBoat?.id || activeBoat?.name;
      if (!boatKey) return;

      setPostWorkoutNotes(notes);
      localStorage.setItem(
        `coxswain-post-notes-${boatKey}`,
        JSON.stringify(notes)
      );

      // If offline, queue for sync
      if (!isOnline) {
        setOfflineQueue((prev) => [
          ...prev,
          { type: 'notes', boatKey, notes, timestamp: Date.now() },
        ]);
      }
    },
    [activeBoat, isOnline]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In production, this would fetch latest data from server
    setIsRefreshing(false);
  }, []);

  // Sync offline queue when back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      // Auto-save when coming back online
      handleSaveWorkout();
    }
  }, [isOnline, offlineQueue]);

  // Fetch session history on mount
  useEffect(() => {
    if (authenticatedFetch) {
      fetchSessionHistory();
    }
  }, [authenticatedFetch]);

  // Fetch coxswain's session history
  const fetchSessionHistory = async () => {
    try {
      const response = await authenticatedFetch('/api/v1/water-sessions/history?limit=10');
      if (response.ok) {
        const data = await response.json();
        setSessionHistory(data.data?.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch session history:', error);
    }
  };

  // Save workout to server
  const handleSaveWorkout = useCallback(async () => {
    if (!activeBoat || pieces.length === 0) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await authenticatedFetch('/api/v1/water-sessions/boat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          boatId: activeBoat.id,
          boatName: activeBoat.name,
          notes: postWorkoutNotes?.notes || '',
          pieces: pieces.map((p, index) => ({
            number: p.number || index + 1,
            distance: p.distance || null,
            time: p.time || null,
            rate: p.strokeRate || p.rate || null,
            type: p.type || 'steady',
            notes: p.notes || '',
          })),
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setOfflineQueue([]); // Clear offline queue on successful save

        // Optionally clear local storage after successful save
        const boatKey = activeBoat?.id || activeBoat?.name || 'default';
        localStorage.removeItem(`coxswain-pieces-${boatKey}`);

        // Refresh history
        fetchSessionHistory();

        // Reset after a delay
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 5000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      // Add to offline queue if we're offline
      if (!isOnline) {
        setOfflineQueue(prev => [...prev, { type: 'workout', pieces, timestamp: Date.now() }]);
      }
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [activeBoat, pieces, postWorkoutNotes, authenticatedFetch, isOnline]);

  return (
    <div className="min-h-full pb-20 md:pb-0">
      {/* Header with refresh and online status */}
      <div className="sticky top-0 z-10 bg-void-deep/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display text-lg font-semibold text-text-primary">
            Coxswain View
          </h1>
          <div className="flex items-center gap-3">
            {/* Online status indicator */}
            <div
              className={`flex items-center gap-1.5 text-xs ${
                isOnline ? 'text-success' : 'text-warning-orange'
              }`}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="hidden sm:inline">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-text-muted hover:text-text-secondary transition-colors duration-100"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        {/* Offline queue indicator */}
        {offlineQueue.length > 0 && (
          <div className="px-4 py-2 bg-warning-orange/10 border-t border-warning-orange/20">
            <p className="text-xs text-warning-orange">
              {offlineQueue.length} change{offlineQueue.length > 1 ? 's' : ''}{' '}
              waiting to sync
            </p>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="p-4 space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {/* Left column on desktop: Boat Roster */}
        <div className="md:col-span-1 space-y-4">
          {/* Collapsible wrapper for mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setRosterCollapsed(!rosterCollapsed)}
              className="w-full flex items-center justify-between px-4 py-3 bg-void-elevated border border-white/[0.06] rounded-lg mb-2"
            >
              <span className="text-sm font-medium text-text-primary">
                Boat Roster
              </span>
              {rosterCollapsed ? (
                <ChevronDown size={16} className="text-text-muted" />
              ) : (
                <ChevronUp size={16} className="text-text-muted" />
              )}
            </button>
          </div>

          {/* Roster - always visible on desktop, collapsible on mobile */}
          <div className={`${rosterCollapsed ? 'hidden md:block' : ''}`}>
            <BoatRoster
              boat={activeBoat}
              boats={coxswainBoats}
              onBoatSwitch={handleBoatSwitch}
              onAthleteClick={handleAthleteClick}
            />
          </div>
        </div>

        {/* Right column on desktop: Workout Entry + Communication */}
        <div className="md:col-span-1 space-y-4">
          {/* Workout Entry - always prominent */}
          <WorkoutEntry
            pieces={pieces}
            onSavePiece={handleSavePiece}
            onDeletePiece={handleDeletePiece}
            workoutTemplate="3x1500m"
          />

          {/* Save Workout Button */}
          {pieces.length > 0 && (
            <button
              onClick={handleSaveWorkout}
              disabled={isSaving || !isOnline}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
                ${saveStatus === 'success'
                  ? 'bg-success/20 border border-success/40 text-success'
                  : saveStatus === 'error'
                    ? 'bg-danger-red/20 border border-danger-red/40 text-danger-red'
                    : 'bg-blade-blue text-void-deep hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <Check size={16} />
                  <span>Saved to Server</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <span>Save Failed - Retry</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Workout ({pieces.length} pieces)</span>
                </>
              )}
            </button>
          )}

          {/* Communication Panel - collapsible on mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setCommsCollapsed(!commsCollapsed)}
              className="w-full flex items-center justify-between px-4 py-3 bg-void-elevated border border-white/[0.06] rounded-lg mb-2"
            >
              <span className="text-sm font-medium text-text-primary">
                Communication
              </span>
              {commsCollapsed ? (
                <ChevronDown size={16} className="text-text-muted" />
              ) : (
                <ChevronUp size={16} className="text-text-muted" />
              )}
            </button>
          </div>

          <div className={`${commsCollapsed ? 'hidden md:block' : ''}`}>
            <CommunicationPanel
              preWorkoutNotes={preWorkoutNotes}
              postWorkoutNotes={postWorkoutNotes}
              onSaveNotes={handleSaveNotes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoxswainView;
