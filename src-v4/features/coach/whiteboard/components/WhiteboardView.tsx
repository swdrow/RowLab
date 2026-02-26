/**
 * WhiteboardView -- displays formatted whiteboard content in read mode.
 *
 * Shows the date, author, and markdown-rendered content.
 * Provides Edit button for coaches, empty state when no whiteboard exists.
 */
import MDEditor from '@uiw/react-md-editor';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatLongDate } from '@/lib/format';
import type { WhiteboardEntry } from '../types';
import { IconClipboardList, IconPencil } from '@/components/icons';

interface WhiteboardViewProps {
  whiteboard: WhiteboardEntry | null;
  canEdit: boolean;
  onEdit: () => void;
}

export function WhiteboardView({ whiteboard, canEdit, onEdit }: WhiteboardViewProps) {
  // Empty state
  if (!whiteboard) {
    return (
      <Card className="text-center">
        <IconClipboardList className="mx-auto mb-4 h-12 w-12 text-text-faint" />
        <p className="text-sm text-text-faint mb-5">No whiteboard posted yet.</p>
        {canEdit && (
          <Button variant="primary" onClick={onEdit}>
            <IconPencil className="h-4 w-4" />
            Create Today&apos;s Whiteboard
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card padding="none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-edge-default">
        <div>
          <h2 className="text-base font-display font-semibold text-text-bright">
            {formatLongDate(whiteboard.date)}
          </h2>
          <p className="text-xs text-text-faint mt-0.5">Posted by {whiteboard.author.name}</p>
        </div>
        {canEdit && (
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <IconPencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      {/* Content -- rendered markdown */}
      <div className="p-6" data-color-mode="dark">
        <div className="prose prose-invert prose-sm max-w-none whiteboard-content">
          <MDEditor.Markdown source={whiteboard.content} />
        </div>
      </div>

      {/* Footer -- last updated */}
      <div className="border-t border-edge-default px-6 py-3">
        <p className="text-xs text-text-faint">
          Last updated {new Date(whiteboard.updatedAt).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}
