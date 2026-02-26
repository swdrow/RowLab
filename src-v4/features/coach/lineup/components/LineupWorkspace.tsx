/**
 * LineupWorkspace -- the main lineup builder assembly.
 *
 * Ties together: AthleteBank, BoatView, LineupToolbar, SaveLineupDialog,
 * AddBoatButton, MobileAthleteSelector, and keyboard shortcuts.
 *
 * Layout:
 *   Desktop (>=768px): Toolbar (top) + AthleteBank (left 280px) + Boats (main area)
 *   Mobile  (<768px):  Toolbar (top) + Boats (stacked) + MobileAthleteSelector (sheet)
 *
 * Data flow:
 *   - useLineupState() for ephemeral editing state
 *   - lineupDetailOptions / lineupsOptions for server data
 *   - useSaveLineup / useUpdateLineup for persistence
 *   - Athletes loaded from /api/v1/athletes via inline query
 *
 * Keyboard shortcuts: Ctrl+Z=undo, Ctrl+Shift+Z=redo, Ctrl+S=save, N=add boat
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';

import { useLineupState } from '../hooks/useLineupState';
import { lineupsOptions, lineupDetailOptions, useSaveLineup, useUpdateLineup } from '../api';
import type { BoatClass, Lineup } from '../types';
import type { AthleteInfo } from './DraggableAthleteCard';

import { AthleteBank } from './AthleteBank';
import { BoatView } from './BoatView';
import { LineupToolbar } from './LineupToolbar';
import { SaveLineupDialog, type SaveLineupFormData } from './SaveLineupDialog';
import { AddBoatButton } from './AddBoatButton';
import { MobileAthleteSelector } from './MobileAthleteSelector';
import { IconShip } from '@/components/icons';

// ---------------------------------------------------------------------------
// Athletes query (team-scoped via auth header)
// ---------------------------------------------------------------------------

interface RawAthlete {
  id: string;
  firstName: string;
  lastName: string;
  side?: string;
  weight?: number | null;
  height?: number | null;
  erg2k?: string | null;
}

function useTeamAthletes(teamId: string) {
  return useQuery<RawAthlete[]>({
    queryKey: ['athletes', teamId, 'roster'],
    queryFn: async () => {
      const res = await api.get('/api/v1/athletes');
      return res.data.data.athletes as RawAthlete[];
    },
    staleTime: 120_000,
    enabled: !!teamId,
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LineupWorkspaceProps {
  teamId: string;
  lineupId?: string | null;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LineupWorkspace({ teamId, lineupId, readOnly = false }: LineupWorkspaceProps) {
  const isMobile = useIsMobile();

  // ---- State management ----
  const { state, dispatch, canUndo, canRedo, toAssignments } = useLineupState();

  // ---- Server data ----
  const { data: athletes = [], isLoading: isAthletesLoading } = useTeamAthletes(teamId);
  const { data: lineups = [] } = useQuery(lineupsOptions(teamId));
  const { data: existingLineup } = useQuery(lineupDetailOptions(teamId, lineupId ?? ''));

  // ---- Mutations ----
  const saveLineup = useSaveLineup(teamId);
  const updateLineup = useUpdateLineup(teamId);

  // ---- Dialogs ----
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<{
    isOpen: boolean;
    seatLabel?: string;
    onSelect?: (athleteId: string) => void;
  }>({ isOpen: false });

  // Track the active lineup id (for update vs create)
  const [activeLineupId, setActiveLineupId] = useState<string | null>(lineupId ?? null);
  const [activeLineupName, setActiveLineupName] = useState<string | undefined>(undefined);
  const [activeLineupNotes, setActiveLineupNotes] = useState<string | undefined>(undefined);

  // ---- Build athlete map ----
  const athleteMap = useMemo(() => {
    const map = new Map<string, AthleteInfo>();
    for (const a of athletes) {
      map.set(a.id, {
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        side: a.side as AthleteInfo['side'],
        weight: a.weight,
        height: a.height,
        erg2k: a.erg2k,
      });
    }
    return map;
  }, [athletes]);

  const allAthleteIds = useMemo(() => athletes.map((a) => a.id), [athletes]);

  // ---- Load existing lineup on mount (or when lineupId changes) ----
  useEffect(() => {
    if (existingLineup && allAthleteIds.length > 0) {
      dispatch({ type: 'LOAD_LINEUP', lineup: existingLineup, allAthleteIds });
      setActiveLineupId(existingLineup.id);
      setActiveLineupName(existingLineup.name);
      setActiveLineupNotes(existingLineup.notes);
    }
  }, [existingLineup, allAthleteIds, dispatch]);

  // ---- Initialize unassigned athletes when athletes load (new lineup) ----
  useEffect(() => {
    if (
      !existingLineup &&
      allAthleteIds.length > 0 &&
      state.boats.length === 0 &&
      state.unassigned.length === 0
    ) {
      // For a new lineup, load all athletes as unassigned
      dispatch({
        type: 'LOAD_LINEUP',
        lineup: { assignments: [] } as unknown as Lineup,
        allAthleteIds,
      });
    }
  }, [existingLineup, allAthleteIds, state.boats.length, state.unassigned.length, dispatch]);

  // ---- Unsaved work protection ----
  useEffect(() => {
    if (!state.isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state.isDirty]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Guard: skip if focused on input/textarea/select/contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+S even in inputs
        if (!(e.ctrlKey && e.key === 's')) return;
      }

      // Ctrl+Z: undo
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (!readOnly) dispatch({ type: 'UNDO' });
        return;
      }

      // Ctrl+Shift+Z: redo
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        if (!readOnly) dispatch({ type: 'REDO' });
        return;
      }

      // Ctrl+S: save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!readOnly) setIsSaveOpen(true);
        return;
      }

      // N: add boat (when not in an input)
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only fire if not in an input field (already guarded above)
        if (!readOnly) {
          dispatch({ type: 'ADD_BOAT', boatClass: '8+' });
        }
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [readOnly, dispatch]);

  // ---- Save handler ----
  const handleSave = useCallback(
    (data: SaveLineupFormData) => {
      const assignments = toAssignments();

      if (activeLineupId) {
        // Update existing
        updateLineup.mutate(
          {
            id: activeLineupId,
            name: data.name,
            notes: data.notes,
            assignments,
          },
          {
            onSuccess: () => {
              setActiveLineupName(data.name);
              setActiveLineupNotes(data.notes);
              setIsSaveOpen(false);
            },
          }
        );
      } else {
        // Create new
        saveLineup.mutate(
          { name: data.name, notes: data.notes, assignments },
          {
            onSuccess: (newLineup) => {
              setActiveLineupId(newLineup.id);
              setActiveLineupName(newLineup.name);
              setActiveLineupNotes(newLineup.notes);
              setIsSaveOpen(false);
            },
          }
        );
      }
    },
    [activeLineupId, toAssignments, saveLineup, updateLineup]
  );

  // ---- Load lineup handler ----
  const handleLoadLineup = useCallback(
    (lineup: Lineup) => {
      dispatch({ type: 'LOAD_LINEUP', lineup, allAthleteIds });
      setActiveLineupId(lineup.id);
      setActiveLineupName(lineup.name);
      setActiveLineupNotes(lineup.notes);
      setIsLoadOpen(false);
    },
    [dispatch, allAthleteIds]
  );

  // ---- Clear handler ----
  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    setActiveLineupId(null);
    setActiveLineupName(undefined);
    setActiveLineupNotes(undefined);
  }, [dispatch]);

  // ---- Add boat handler ----
  const handleAddBoat = useCallback(
    (config: { boatClass: BoatClass }) => {
      dispatch({ type: 'ADD_BOAT', boatClass: config.boatClass });
    },
    [dispatch]
  );

  // ---- Remove boat handler ----
  const handleRemoveBoat = useCallback(
    (boatIndex: number) => {
      dispatch({ type: 'REMOVE_BOAT', boatIndex });
    },
    [dispatch]
  );

  const isSubmitting = saveLineup.isPending || updateLineup.isPending;

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Section header */}
      <SectionHeader
        title="Lineup Builder"
        description={activeLineupName ?? 'Build and arrange boat lineups'}
        icon={<IconShip width={18} height={18} />}
        action={
          <LineupToolbar
            onSave={() => setIsSaveOpen(true)}
            onLoad={() => setIsLoadOpen(true)}
            onClear={handleClear}
            onUndo={() => dispatch({ type: 'UNDO' })}
            onRedo={() => dispatch({ type: 'REDO' })}
            canUndo={canUndo}
            canRedo={canRedo}
            isDirty={state.isDirty}
            readOnly={readOnly}
            lineupName={activeLineupName}
          />
        }
      />

      {/* Main content area */}
      {isMobile ? (
        // --- MOBILE LAYOUT: boats stacked vertically ---
        <div className="flex-1 overflow-y-auto space-y-3">
          {state.boats.length === 0 ? (
            <EmptyState
              icon={IconShip}
              title="No boats yet"
              description="Add a boat to start building your lineup."
              action={
                !readOnly
                  ? {
                      label: 'Add Boat',
                      onClick: () => dispatch({ type: 'ADD_BOAT', boatClass: '8+' }),
                    }
                  : undefined
              }
              className="py-16"
            />
          ) : (
            <>
              {state.boats.map((boat, idx) => (
                <BoatView
                  key={`boat-${idx}`}
                  boat={boat}
                  boatIndex={idx}
                  dispatch={dispatch}
                  readOnly={readOnly}
                  athletes={athleteMap}
                  selectedAthleteId={state.selectedAthleteId}
                  onRemoveBoat={() => handleRemoveBoat(idx)}
                />
              ))}

              {/* Add boat CTA */}
              {!readOnly && (
                <div className="flex justify-center py-4">
                  <AddBoatButton onAdd={handleAddBoat} readOnly={readOnly} />
                </div>
              )}
            </>
          )}

          {/* Unassigned count banner */}
          {state.unassigned.length > 0 && !readOnly && (
            <button
              onClick={() =>
                setMobileSheet({
                  isOpen: true,
                  seatLabel: 'Unassigned Athletes',
                  onSelect: undefined,
                })
              }
              className="
                sticky bottom-0 w-full py-3 px-4 text-center
                text-sm font-medium text-accent-teal
                bg-void-surface
                border-t border-edge-default/30
              "
            >
              {state.unassigned.length} unassigned athlete{state.unassigned.length !== 1 ? 's' : ''}
              {' \u2014 '} Tap to view
            </button>
          )}
        </div>
      ) : (
        // --- DESKTOP LAYOUT: AthleteBank (left) + Boats (right) ---
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Athlete bank sidebar */}
          <div className="w-[280px] flex-shrink-0">
            <AthleteBank
              athletes={athleteMap}
              unassignedIds={state.unassigned}
              dispatch={dispatch}
              readOnly={readOnly}
              selectedAthleteId={state.selectedAthleteId}
              isLoading={isAthletesLoading}
            />
          </div>

          {/* Boats area with subtle background grid pattern */}
          <div
            className="flex-1 overflow-y-auto space-y-3 pr-1 rounded-xl"
            style={{
              backgroundImage:
                'radial-gradient(circle, oklch(0.35 0.01 285 / 0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {state.boats.length === 0 ? (
              <EmptyState
                icon={IconShip}
                title="No boats yet"
                description="Add a boat to start building your lineup."
                action={
                  !readOnly
                    ? {
                        label: 'Add Boat',
                        onClick: () => dispatch({ type: 'ADD_BOAT', boatClass: '8+' }),
                      }
                    : undefined
                }
                className="py-20"
              />
            ) : (
              <>
                {state.boats.map((boat, idx) => (
                  <BoatView
                    key={`boat-${idx}`}
                    boat={boat}
                    boatIndex={idx}
                    dispatch={dispatch}
                    readOnly={readOnly}
                    athletes={athleteMap}
                    selectedAthleteId={state.selectedAthleteId}
                    onRemoveBoat={() => handleRemoveBoat(idx)}
                  />
                ))}

                {/* Add boat CTA */}
                {!readOnly && (
                  <div className="flex justify-center py-4">
                    <AddBoatButton onAdd={handleAddBoat} readOnly={readOnly} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ---- DIALOGS ---- */}

      {/* Save dialog */}
      <SaveLineupDialog
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        onSave={handleSave}
        existingName={activeLineupName}
        existingNotes={activeLineupNotes}
        isSubmitting={isSubmitting}
      />

      {/* Load lineup modal */}
      {isLoadOpen && (
        <LoadLineupModal
          lineups={lineups}
          onSelect={handleLoadLineup}
          onClose={() => setIsLoadOpen(false)}
        />
      )}

      {/* Mobile athlete selector */}
      <MobileAthleteSelector
        isOpen={mobileSheet.isOpen}
        onClose={() => setMobileSheet({ isOpen: false })}
        onSelect={(athleteId) => {
          if (mobileSheet.onSelect) {
            mobileSheet.onSelect(athleteId);
          }
          // Also set selection for tap-assign
          dispatch({ type: 'SELECT_ATHLETE', athleteId });
          setMobileSheet({ isOpen: false });
        }}
        athletes={athleteMap}
        unassignedIds={state.unassigned}
        seatLabel={mobileSheet.seatLabel}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoadLineupModal -- simple modal listing saved lineups
// ---------------------------------------------------------------------------

function LoadLineupModal({
  lineups,
  onSelect,
  onClose,
}: {
  lineups: Lineup[];
  onSelect: (lineup: Lineup) => void;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} aria-hidden />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Load lineup"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="panel rounded-2xl shadow-xl w-full max-w-lg max-h-[70vh] flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-edge-default/30">
            <h2 className="text-lg font-display font-semibold text-text-bright">Load Lineup</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-faint hover:text-text-bright hover:bg-void-overlay transition-colors"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path
                  d="M4.5 4.5l9 9M13.5 4.5l-9 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Lineup list */}
          <div className="flex-1 overflow-y-auto p-3">
            {lineups.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-text-faint">No saved lineups yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {lineups.map((lineup) => (
                  <button
                    key={lineup.id}
                    onClick={() => onSelect(lineup)}
                    className="
                      w-full text-left px-4 py-3 rounded-xl
                      bg-void-raised/60 border border-edge-default
                      hover:bg-void-overlay hover:border-edge-hover
                      active:scale-[0.99]
                      transition-all duration-100
                    "
                  >
                    <p className="text-sm font-medium text-text-bright">{lineup.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-faint">
                      <span>{lineup.assignments.length} assignments</span>
                      <span>{lineup.status}</span>
                      <span>{new Date(lineup.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {lineup.notes && (
                      <p className="text-xs text-text-dim mt-1 truncate">{lineup.notes}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
