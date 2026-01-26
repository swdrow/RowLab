import { FileText, Edit3 } from 'lucide-react';
import { RichTextEditor } from '@v2/components/common';
import { PdfUpload } from './PdfUpload';
import type { ScheduleType } from '@v2/types/recruiting';

interface VisitScheduleEditorProps {
  scheduleType: ScheduleType;
  scheduleContent?: string;
  schedulePdfUrl?: string;
  onTypeChange: (type: ScheduleType) => void;
  onContentChange: (content: string) => void;
  onPdfChange: (url: string | null) => void;
  disabled?: boolean;
}

export function VisitScheduleEditor({
  scheduleType,
  scheduleContent,
  schedulePdfUrl,
  onTypeChange,
  onContentChange,
  onPdfChange,
  disabled,
}: VisitScheduleEditorProps) {
  const tabs = [
    { id: 'richtext' as ScheduleType, label: 'Write Schedule', icon: Edit3 },
    { id: 'pdf' as ScheduleType, label: 'Upload PDF', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-txt-primary">
        Visit Schedule
      </label>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 bg-surface rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => !disabled && onTypeChange(tab.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
              ${scheduleType === tab.id
                ? 'bg-interactive-primary text-white'
                : 'text-txt-secondary hover:text-txt-primary hover:bg-hover'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      {scheduleType === 'richtext' ? (
        <RichTextEditor
          initialValue={scheduleContent}
          onChange={onContentChange}
          placeholder="Enter visit schedule details (e.g., 9:00 AM - Campus Tour, 11:00 AM - Meet the Team...)"
          minHeight="200px"
          disabled={disabled}
        />
      ) : (
        <PdfUpload
          value={schedulePdfUrl}
          onChange={onPdfChange}
          disabled={disabled}
        />
      )}

      <p className="text-xs text-txt-tertiary">
        {scheduleType === 'richtext'
          ? 'Create a detailed itinerary with times and activities.'
          : 'Upload a PDF with the visit schedule.'
        }
      </p>
    </div>
  );
}
