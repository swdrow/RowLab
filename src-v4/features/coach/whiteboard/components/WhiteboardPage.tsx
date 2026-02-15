/**
 * WhiteboardPage -- structured notes board with view/edit toggle.
 *
 * Coaches can view and edit the whiteboard. Athletes with team access
 * see a read-only view. Save triggers POST /api/v1/whiteboards via
 * useSaveWhiteboard mutation.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/features/auth/useAuth';
import { whiteboardOptions, useSaveWhiteboard } from '../api';
import { WhiteboardView } from './WhiteboardView';
import { WhiteboardEditor } from './WhiteboardEditor';

export function WhiteboardPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { activeTeamRole } = useAuth();

  const canEdit =
    activeTeamRole === 'OWNER' || activeTeamRole === 'ADMIN' || activeTeamRole === 'COACH';
  const readOnly = !canEdit;

  const { data: whiteboard, isLoading } = useQuery(whiteboardOptions());
  const saveMutation = useSaveWhiteboard();

  const handleSave = (content: string) => {
    const today = new Date().toISOString().split('T')[0]!;
    saveMutation.mutate({ date: today, content }, { onSuccess: () => setIsEditing(false) });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-ink-border/50" />
          <div className="h-4 w-32 animate-pulse rounded bg-ink-border/30" />
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-ink-border/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 pb-20 md:pb-6">
      <motion.div variants={listContainerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={listItemVariants} transition={SPRING_SMOOTH} className="mb-6">
          <SectionHeader
            title="Whiteboard"
            description="Team Notes"
            icon={<ClipboardList className="h-4 w-4" />}
            action={
              readOnly ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-well px-3 py-1.5 text-xs text-ink-muted border border-ink-border">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Read Only
                </span>
              ) : undefined
            }
          />
        </motion.div>

        {/* Content */}
        <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
          {isEditing ? (
            <WhiteboardEditor
              initialContent={whiteboard?.content ?? ''}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isSaving={saveMutation.isPending}
            />
          ) : (
            <WhiteboardView
              whiteboard={whiteboard ?? null}
              canEdit={canEdit}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
