import MDEditor from '@uiw/react-md-editor';
import { ClipboardList } from 'lucide-react';
import type { Whiteboard } from '../../types/coach';

interface WhiteboardViewProps {
  whiteboard: Whiteboard | null;
  canEdit: boolean;
  onEdit?: () => void;
}

/**
 * WhiteboardView - Display whiteboard with markdown rendering
 *
 * Shows date and author in header, with edit button for coaches.
 * Empty state when no whiteboard exists.
 */
export function WhiteboardView({ whiteboard, canEdit, onEdit }: WhiteboardViewProps) {
  // Empty state when no whiteboard
  if (!whiteboard) {
    return (
      <div className="rounded-xl border border-bdr-primary bg-card-bg p-8 text-center">
        <ClipboardList className="w-12 h-12 mx-auto mb-4 text-txt-secondary opacity-50" />
        <p className="text-txt-secondary mb-4">
          No whiteboard posted yet
        </p>
        {canEdit && onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            Create Today's Whiteboard
          </button>
        )}
      </div>
    );
  }

  // Format date for display
  const displayDate = new Date(whiteboard.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-bdr-primary bg-card-bg overflow-hidden">
      {/* Header with date and author */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-bdr-primary bg-surface">
        <div>
          <h2 className="text-lg font-semibold text-txt-primary">{displayDate}</h2>
          <p className="text-sm text-txt-secondary">Posted by {whiteboard.author.name}</p>
        </div>
        {canEdit && onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm text-txt-primary border border-bdr-primary rounded-lg hover:bg-surface-hover transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Markdown content */}
      <div className="p-6">
        <div data-color-mode="dark" className="whiteboard-content">
          <MDEditor.Markdown source={whiteboard.content} />
        </div>
      </div>
    </div>
  );
}
