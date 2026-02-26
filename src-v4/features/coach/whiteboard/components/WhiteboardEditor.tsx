/**
 * WhiteboardEditor -- textarea-based editor with view/edit toggle.
 *
 * Uses a plain textarea for editing with markdown hints in the toolbar.
 * Save and Cancel buttons control the flow.
 */
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconBold, IconHeading, IconItalic, IconList, IconSave, IconX } from '@/components/icons';

interface WhiteboardEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/** Insert markdown syntax at cursor position or wrap selection */
function insertMarkdown(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  setContent: (value: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);

  const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
  setContent(newText);

  // Restore cursor position after state update
  requestAnimationFrame(() => {
    textarea.focus();
    const cursorPos = selected
      ? start + prefix.length + selected.length + suffix.length
      : start + prefix.length;
    textarea.setSelectionRange(cursorPos, cursorPos);
  });
}

export function WhiteboardEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: WhiteboardEditorProps) {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
    }
  };

  const toolbarActions = [
    {
      icon: IconBold,
      label: 'Bold',
      action: (ta: HTMLTextAreaElement) => insertMarkdown(ta, '**', '**', setContent),
    },
    {
      icon: IconItalic,
      label: 'Italic',
      action: (ta: HTMLTextAreaElement) => insertMarkdown(ta, '_', '_', setContent),
    },
    {
      icon: IconHeading,
      label: 'Heading',
      action: (ta: HTMLTextAreaElement) => insertMarkdown(ta, '## ', '', setContent),
    },
    {
      icon: IconList,
      label: 'List',
      action: (ta: HTMLTextAreaElement) => insertMarkdown(ta, '- ', '', setContent),
    },
  ];

  return (
    <Card padding="none">
      {/* Header */}
      <div className="px-6 py-4 border-b border-edge-default">
        <h2 className="text-base font-display font-semibold text-text-bright">Edit Whiteboard</h2>
        <p className="text-xs text-text-faint mt-0.5">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-edge-default/50">
        {toolbarActions.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={() => {
              const ta = document.getElementById('whiteboard-editor') as HTMLTextAreaElement | null;
              if (ta) action(ta);
            }}
            className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-void-overlay hover:text-text-dim"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <span className="ml-2 text-[10px] text-text-faint">Markdown supported</span>
      </div>

      {/* Textarea */}
      <div className="p-6">
        <textarea
          id="whiteboard-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter today's whiteboard content (markdown supported)..."
          rows={16}
          className="w-full resize-y rounded-lg border border-edge-default bg-void-surface px-4 py-3 text-sm text-text-bright placeholder:text-text-faint focus:border-accent-teal focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono leading-relaxed"
          maxLength={50000}
        />
        <p className="mt-1 text-right text-[10px] text-text-faint">
          {content.length.toLocaleString()} / 50,000
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-edge-default">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          <IconX className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          loading={isSaving}
        >
          <IconSave className="h-4 w-4" />
          Save Whiteboard
        </Button>
      </div>
    </Card>
  );
}
