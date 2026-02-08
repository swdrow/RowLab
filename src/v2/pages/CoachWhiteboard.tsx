import { useState } from 'react';
import { useWhiteboard } from '../hooks/useWhiteboard';
import { WhiteboardView, WhiteboardEditor } from '../components/whiteboard';
import { useAuth } from '../contexts/AuthContext';

export default function CoachWhiteboard() {
  const [isEditing, setIsEditing] = useState(false);
  const { whiteboard, isLoading, saveWhiteboard, isSaving } = useWhiteboard();

  const { activeTeamRole } = useAuth();
  const canEdit = activeTeamRole === 'COACH' || activeTeamRole === 'OWNER';

  const handleSave = (content: string) => {
    const today = new Date().toISOString().split('T')[0];
    saveWhiteboard(
      { date: today, content },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              Team Communication
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Whiteboard
            </h1>
            <p className="text-sm text-ink-secondary mt-2">Daily team messages and announcements</p>
          </div>
        </div>
        <div className="px-6 animate-pulse">
          <div className="h-64 bg-ink-raised rounded" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        {/* Decorative copper line at bottom */}
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
            Team Communication
          </p>
          <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
            Whiteboard
          </h1>
          <p className="text-sm text-ink-secondary mt-2">Daily team messages and announcements</p>
        </div>
      </div>

      <div className="px-6 max-w-4xl">
        {isEditing ? (
          <WhiteboardEditor
            initialContent={whiteboard?.content || ''}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        ) : (
          <WhiteboardView
            whiteboard={whiteboard || null}
            canEdit={canEdit}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>
    </div>
  );
}
