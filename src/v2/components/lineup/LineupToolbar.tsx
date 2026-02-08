import { useState } from 'react';
import { Undo2, Redo2, Save } from 'lucide-react';
import { useLineupCommands } from '../../hooks/useLineupCommands';
import { useLineupDraft } from '../../hooks/useLineupDraft';
import { ExportPDFButton } from './ExportPDFButton';
import { VersionHistory } from './VersionHistory';
import { SaveLineupDialog } from './SaveLineupDialog';
import type { Lineup, LineupAssignment } from '../../hooks/useLineups';
import type { ActiveBoat } from '@/types';

/**
 * Props for LineupToolbar
 */
interface LineupToolbarProps {
  className?: string;
  lineupId: string | null;
  cancelAutoSave?: () => void;
  boats?: ActiveBoat[];
  assignments?: LineupAssignment[];
  onLoadLineup?: (lineupId: string) => void;
}

/**
 * LineupToolbar - Toolbar with undo/redo, export PDF, save, and version history
 *
 * Features:
 * - Undo button: Disabled when !_history.canUndo, shows undo count in tooltip
 * - Redo button: Disabled when !_history.canRedo, shows redo count in tooltip
 * - Export PDF button: Disabled when no boats, triggers print-ready PDF export
 * - Save button: Opens SaveLineupDialog for creating/updating lineups
 * - Version history dropdown: Load/duplicate/delete saved lineups
 * - Shows current lineup name if loaded
 * - Tooltips include keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
 * - Horizontal button group with V2 design tokens
 *
 * Layout: [Undo] [Redo] | [Export PDF] | [Current Name] | [Save] [History ▼]
 *
 * Per RESEARCH.md:
 * "Wire existing undoMiddleware to UI with keyboard shortcuts"
 *
 * Per CONTEXT.md:
 * "Undo/redo covers every action - each drag, swap, removal is individually undoable"
 * "Version history accessed via dropdown menu - compact, keeps builder clean"
 */
export function LineupToolbar({
  className = '',
  lineupId,
  cancelAutoSave,
  boats = [],
  assignments = [],
  onLoadLineup,
}: LineupToolbarProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [lineupToUpdate, setLineupToUpdate] = useState<Lineup | null>(null);

  // V3 hooks: command-based undo/redo and draft state
  const { undo, redo, canUndo, canRedo, undoCount, redoCount } = useLineupCommands(
    lineupId,
    cancelAutoSave
  );
  const { draft } = useLineupDraft(lineupId);

  const handleUndo = () => {
    if (canUndo) {
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo();
    }
  };

  /**
   * Open save dialog for new save
   */
  const handleSaveClick = () => {
    setLineupToUpdate(null);
    setIsSaveDialogOpen(true);
  };

  /**
   * Open save dialog for updating specific lineup
   */
  const handleSaveDialogOpen = (lineup?: Lineup) => {
    setLineupToUpdate(lineup || null);
    setIsSaveDialogOpen(true);
  };

  /**
   * Close save dialog
   */
  const handleSaveDialogClose = () => {
    setIsSaveDialogOpen(false);
    setLineupToUpdate(null);
  };

  /**
   * After successful save, handle success
   * Note: The draft query will be invalidated by the save mutation,
   * so the draft name will update automatically.
   */
  const handleSaveSuccess = (_lineup: Lineup) => {
    // No-op: TanStack Query will handle cache updates
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium
          transition-all duration-150
          ${
            canUndo
              ? 'bg-bg-surface hover:bg-bg-hover text-txt-primary border border-bdr-default hover:border-bdr-hover'
              : 'bg-bg-surface text-txt-disabled border border-bdr-default cursor-not-allowed opacity-50'
          }
        `}
        title={
          canUndo
            ? `Undo (Ctrl+Z) - ${undoCount} ${undoCount === 1 ? 'change' : 'changes'}`
            : 'Undo (Ctrl+Z)'
        }
        aria-label="Undo"
      >
        <Undo2 className="w-4 h-4" />
        <span className="hidden md:inline">Undo</span>
      </button>

      {/* Redo Button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium
          transition-all duration-150
          ${
            canRedo
              ? 'bg-bg-surface hover:bg-bg-hover text-txt-primary border border-bdr-default hover:border-bdr-hover'
              : 'bg-bg-surface text-txt-disabled border border-bdr-default cursor-not-allowed opacity-50'
          }
        `}
        title={
          canRedo
            ? `Redo (Ctrl+Shift+Z) - ${redoCount} ${redoCount === 1 ? 'change' : 'changes'}`
            : 'Redo (Ctrl+Shift+Z)'
        }
        aria-label="Redo"
      >
        <Redo2 className="w-4 h-4" />
        <span className="hidden md:inline">Redo</span>
      </button>

      {/* Separator */}
      <div className="w-px h-8 bg-bdr-default mx-1" />

      {/* Export PDF Button */}
      <ExportPDFButton boats={boats} />

      {/* Separator */}
      <div className="w-px h-8 bg-bdr-default mx-1" />

      {/* Current lineup name */}
      {draft?.name && (
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-bdr-default rounded-lg">
          <span className="text-sm font-medium text-txt-primary truncate max-w-xs">
            {draft.name}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save button */}
      <button
        onClick={handleSaveClick}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-primary hover:bg-accent-hover text-white transition-all duration-150"
        title="Save lineup"
        aria-label="Save lineup"
      >
        <Save className="w-4 h-4" />
        <span className="hidden md:inline">Save</span>
      </button>

      {/* Version history dropdown */}
      <VersionHistory
        onSaveDialogOpen={handleSaveDialogOpen}
        onLoadLineup={onLoadLineup || (() => {})}
        currentLineupId={lineupId}
      />

      {/* Save/Update dialog */}
      <SaveLineupDialog
        isOpen={isSaveDialogOpen}
        onClose={handleSaveDialogClose}
        existingLineup={lineupToUpdate}
        onSuccess={handleSaveSuccess}
        assignments={assignments}
        lineupId={lineupId}
      />
    </div>
  );
}
