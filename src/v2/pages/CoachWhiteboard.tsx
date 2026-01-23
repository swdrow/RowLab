import { useState } from 'react';
import { useWhiteboard } from '../hooks/useWhiteboard';
import { WhiteboardView, WhiteboardEditor } from '../components/whiteboard';
import { useV2Auth } from '../hooks/useSharedStores';

export default function CoachWhiteboard() {
  const [isEditing, setIsEditing] = useState(false);
  const { whiteboard, isLoading, saveWhiteboard, isSaving } = useWhiteboard();

  // Get user role from auth store
  const authStore = useV2Auth();
  const user = authStore((state) => state.user);
  const canEdit = user?.activeTeamRole === 'COACH' || user?.activeTeamRole === 'OWNER';

  const handleSave = (content: string) => {
    const today = new Date().toISOString().split('T')[0];
    saveWhiteboard({ date: today, content }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/3" />
          <div className="h-64 bg-surface rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-txt-primary mb-6">Team Whiteboard</h1>

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
  );
}
