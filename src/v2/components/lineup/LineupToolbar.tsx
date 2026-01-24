import { Undo2, Redo2 } from 'lucide-react';
import useLineupStore from '@/store/lineupStore';

/**
 * Props for LineupToolbar
 */
interface LineupToolbarProps {
  className?: string;
}

/**
 * LineupToolbar - Toolbar with undo/redo buttons and future action slots
 *
 * Features:
 * - Undo button: Disabled when !_history.canUndo, shows undo count in tooltip
 * - Redo button: Disabled when !_history.canRedo, shows redo count in tooltip
 * - Tooltips include keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
 * - Horizontal button group with V2 design tokens
 * - Space reserved for future buttons (save, export - added in later plans)
 *
 * Per RESEARCH.md:
 * "Wire existing undoMiddleware to UI with keyboard shortcuts"
 *
 * Per CONTEXT.md:
 * "Undo/redo covers every action - each drag, swap, removal is individually undoable"
 */
export function LineupToolbar({ className = '' }: LineupToolbarProps) {
  const undo = useLineupStore((state) => state.undo);
  const redo = useLineupStore((state) => state.redo);
  const history = useLineupStore((state) => state._history);

  const handleUndo = () => {
    if (history.canUndo) {
      undo();
    }
  };

  const handleRedo = () => {
    if (history.canRedo) {
      redo();
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!history.canUndo}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium
          transition-all duration-150
          ${
            history.canUndo
              ? 'bg-bg-surface hover:bg-bg-hover text-txt-primary border border-bdr-default hover:border-bdr-hover'
              : 'bg-bg-surface text-txt-disabled border border-bdr-default cursor-not-allowed opacity-50'
          }
        `}
        title={
          history.canUndo
            ? `Undo (Ctrl+Z) - ${history.undoCount} ${history.undoCount === 1 ? 'change' : 'changes'}`
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
        disabled={!history.canRedo}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium
          transition-all duration-150
          ${
            history.canRedo
              ? 'bg-bg-surface hover:bg-bg-hover text-txt-primary border border-bdr-default hover:border-bdr-hover'
              : 'bg-bg-surface text-txt-disabled border border-bdr-default cursor-not-allowed opacity-50'
          }
        `}
        title={
          history.canRedo
            ? `Redo (Ctrl+Shift+Z) - ${history.redoCount} ${history.redoCount === 1 ? 'change' : 'changes'}`
            : 'Redo (Ctrl+Shift+Z)'
        }
        aria-label="Redo"
      >
        <Redo2 className="w-4 h-4" />
        <span className="hidden md:inline">Redo</span>
      </button>

      {/* Future buttons will go here (save, export, etc.) */}
    </div>
  );
}
