/**
 * LineupToolbar -- top bar with save/load/clear/undo/redo controls.
 *
 * Shows the current lineup name (or "New Lineup") with a dirty indicator dot.
 * Responsive: icons-only on mobile, icons + labels on desktop.
 * Read-only mode hides mutation buttons (only Load remains visible).
 */
import { IconFolderOpen, IconRedo, IconSave, IconTrash, IconUndo } from '@/components/icons';
import type { IconComponent } from '@/types/icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LineupToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  readOnly?: boolean;
  lineupName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LineupToolbar({
  onSave,
  onLoad,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDirty,
  readOnly = false,
  lineupName,
}: LineupToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 panel rounded-xl">
      {/* Left: lineup name + dirty indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-display font-semibold text-text-bright truncate">
          {lineupName || 'New Lineup'}
        </h2>
        {isDirty && (
          <span
            className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-teal animate-pulse"
            title="Unsaved changes"
            aria-label="Unsaved changes"
          />
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        {/* Undo / Redo (hidden in readOnly) */}
        {!readOnly && (
          <>
            <ToolbarButton
              icon={IconUndo}
              label="Undo"
              onClick={onUndo}
              disabled={!canUndo}
              shortcut="Ctrl+Z"
            />
            <ToolbarButton
              icon={IconRedo}
              label="Redo"
              onClick={onRedo}
              disabled={!canRedo}
              shortcut="Ctrl+Shift+Z"
            />

            <div className="w-px h-5 bg-edge-default/40 mx-1" aria-hidden />
          </>
        )}

        {/* Load (always visible) */}
        <ToolbarButton icon={IconFolderOpen} label="Load" onClick={onLoad} />

        {/* Save + Clear (hidden in readOnly) */}
        {!readOnly && (
          <>
            <ToolbarButton icon={IconSave} label="Save" onClick={onSave} shortcut="Ctrl+S" accent />
            <ToolbarButton icon={IconTrash} label="Clear" onClick={onClear} />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToolbarButton: responsive icon button with optional label
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  icon: IconComponent;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
  accent?: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  shortcut,
  accent = false,
}: ToolbarButtonProps) {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium
        transition-colors duration-100
        disabled:opacity-35 disabled:pointer-events-none
        ${
          accent
            ? 'text-accent-teal hover:bg-accent-teal/10'
            : 'text-text-dim hover:text-text-bright hover:bg-void-overlay'
        }
      `.trim()}
    >
      <Icon width={15} height={15} className="flex-shrink-0" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
