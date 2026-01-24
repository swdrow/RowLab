import { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown, Clock, Copy, Trash2, Loader2 } from 'lucide-react';
import { useLineups, useDuplicateLineup, useDeleteLineup } from '../../hooks/useLineups';
import type { Lineup } from '../../hooks/useLineups';
import useLineupStore from '../../../store/lineupStore';

/**
 * Props for VersionHistory dropdown component
 */
export interface VersionHistoryProps {
  onSaveDialogOpen: (lineup?: Lineup) => void;
  className?: string;
}

/**
 * Confirmation dialog state
 */
interface ConfirmDeleteState {
  isOpen: boolean;
  lineup: Lineup | null;
}

/**
 * Version history dropdown component
 *
 * Features:
 * - Shows all saved lineups sorted by date (newest first)
 * - Load button: loads lineup into workspace via loadLineupFromData
 * - Duplicate button: opens save dialog with "(Copy)" suffix
 * - Delete button: removes lineup with confirmation
 * - Empty state when no lineups saved
 *
 * Per CONTEXT.md: "Version history accessed via dropdown menu - compact, keeps builder clean"
 */
export function VersionHistory({ onSaveDialogOpen, className = '' }: VersionHistoryProps) {
  const { lineups, isLoading } = useLineups();
  const { duplicateLineupAsync, isDuplicating } = useDuplicateLineup();
  const { deleteLineupAsync, isDeleting } = useDeleteLineup();
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({ isOpen: false, lineup: null });
  const [loadingLineupId, setLoadingLineupId] = useState<string | null>(null);
  const [duplicatingLineupId, setDuplicatingLineupId] = useState<string | null>(null);

  const loadLineupFromData = useLineupStore((state) => state.loadLineupFromData);
  const athletes = useLineupStore((state) => state.athletes);
  const boatConfigs = useLineupStore((state) => state.boatConfigs);
  const shells = useLineupStore((state) => state.shells);
  const setCurrentLineupId = useLineupStore((state) => state.setCurrentLineupId);
  const setLineupName = useLineupStore((state) => state.setLineupName);

  // Sort lineups by date (newest first)
  const sortedLineups = [...lineups].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  /**
   * Load lineup into workspace
   */
  const handleLoadLineup = (lineup: Lineup) => {
    setLoadingLineupId(lineup.id);
    try {
      loadLineupFromData(lineup, athletes, boatConfigs, shells);
      setCurrentLineupId(lineup.id);
      setLineupName(lineup.name);
    } catch (error) {
      console.error('Failed to load lineup:', error);
    } finally {
      setLoadingLineupId(null);
    }
  };

  /**
   * Duplicate lineup and open in workspace
   */
  const handleDuplicateLineup = async (lineup: Lineup) => {
    setDuplicatingLineupId(lineup.id);
    try {
      const newName = `${lineup.name} (Copy)`;
      const duplicated = await duplicateLineupAsync({ id: lineup.id, name: newName });

      // Load the duplicated lineup
      loadLineupFromData(duplicated, athletes, boatConfigs, shells);
      setCurrentLineupId(duplicated.id);
      setLineupName(duplicated.name);
    } catch (error) {
      console.error('Failed to duplicate lineup:', error);
    } finally {
      setDuplicatingLineupId(null);
    }
  };

  /**
   * Delete lineup with confirmation
   */
  const handleDeleteLineup = async () => {
    if (!confirmDelete.lineup) return;

    try {
      await deleteLineupAsync(confirmDelete.lineup.id);
      setConfirmDelete({ isOpen: false, lineup: null });
    } catch (error) {
      console.error('Failed to delete lineup:', error);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  /**
   * Count boats in lineup
   */
  const getBoatCount = (lineup: Lineup): number => {
    const boatClasses = new Set(lineup.assignments.map(a => a.boatClass));
    return boatClasses.size;
  };

  return (
    <>
      <Menu as="div" className={`relative ${className}`}>
        <Menu.Button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-txt-primary bg-surface-secondary hover:bg-surface-hover border border-bdr-primary rounded-lg transition-colors">
          <Clock size={16} />
          <span>History</span>
          <ChevronDown size={16} className="text-txt-secondary" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-96 origin-top-right rounded-xl bg-card-bg border border-bdr-primary shadow-lg focus:outline-none z-50 max-h-96 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-sm font-semibold text-txt-primary mb-3">Saved Lineups</h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-txt-secondary" />
                </div>
              ) : sortedLineups.length === 0 ? (
                <div className="text-center py-8 text-txt-secondary text-sm">
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No saved lineups yet</p>
                  <p className="text-xs mt-1">Save your first lineup to see it here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedLineups.map((lineup) => {
                    const isLoadingThis = loadingLineupId === lineup.id;
                    const isDuplicatingThis = duplicatingLineupId === lineup.id;
                    const boatCount = getBoatCount(lineup);

                    return (
                      <div
                        key={lineup.id}
                        className="p-3 bg-surface-primary hover:bg-surface-hover border border-bdr-primary rounded-lg transition-colors"
                      >
                        {/* Lineup info */}
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-txt-primary truncate">
                            {lineup.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-txt-tertiary mt-1">
                            <span>{formatDate(lineup.updatedAt)}</span>
                            <span>•</span>
                            <span>{boatCount} boat{boatCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadLineup(lineup)}
                            disabled={isLoadingThis}
                            className="flex-1 px-2 py-1.5 text-xs font-medium text-txt-primary bg-surface-secondary hover:bg-accent-primary hover:text-white border border-bdr-primary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoadingThis ? 'Loading...' : 'Load'}
                          </button>
                          <button
                            onClick={() => handleDuplicateLineup(lineup)}
                            disabled={isDuplicatingThis || isDuplicating}
                            className="px-2 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary bg-surface-secondary hover:bg-surface-hover border border-bdr-primary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Duplicate lineup"
                          >
                            {isDuplicatingThis ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ isOpen: true, lineup })}
                            disabled={isDeleting}
                            className="px-2 py-1.5 text-xs font-medium text-txt-secondary hover:text-red-400 bg-surface-secondary hover:bg-surface-hover border border-bdr-primary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete lineup"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Delete confirmation dialog */}
      {confirmDelete.isOpen && confirmDelete.lineup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-bdr-primary rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-txt-primary mb-2">Delete Lineup?</h3>
            <p className="text-sm text-txt-secondary mb-4">
              Are you sure you want to delete "{confirmDelete.lineup.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete({ isOpen: false, lineup: null })}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLineup}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
