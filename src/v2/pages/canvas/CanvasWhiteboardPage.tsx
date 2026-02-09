/**
 * CanvasWhiteboardPage - Team whiteboard with Canvas design language
 *
 * Canvas redesign of CoachWhiteboard.tsx with:
 * - Canvas header "Team / Whiteboard"
 * - CanvasButton for Edit/Save/Cancel
 * - Reuses WhiteboardView and WhiteboardEditor components
 * - CanvasConsoleReadout at bottom
 * - NO rounded corners, NO card wrappers
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWhiteboard } from '../../hooks/useWhiteboard';
import { WhiteboardView, WhiteboardEditor } from '../../components/whiteboard';
import { useAuth } from '../../contexts/AuthContext';
import { CanvasButton, CanvasConsoleReadout } from '@v2/components/canvas';

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function CanvasWhiteboardPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { whiteboard, isLoading, saveWhiteboard, isSaving } = useWhiteboard();
  const { activeTeamRole } = useAuth();
  const canEdit = activeTeamRole === 'COACH' || activeTeamRole === 'OWNER';

  const handleSave = (content: string) => {
    const today = new Date().toISOString().split('T')[0] as string;
    saveWhiteboard(
      { date: today, content },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'LOADING WHITEBOARD' }]} />
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* ============================================ */}
      {/* HEADER — text against void */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between pt-2 pb-6">
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
            Team Communication
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Whiteboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && !isEditing && (
            <CanvasButton variant="primary" onClick={() => setIsEditing(true)}>
              Edit
            </CanvasButton>
          )}
          {isEditing && (
            <>
              <CanvasButton variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </CanvasButton>
            </>
          )}
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* WHITEBOARD CONTENT */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="max-w-4xl">
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
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — summary */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <CanvasConsoleReadout
          items={[
            {
              label: 'LAST UPDATED',
              value: whiteboard?.date
                ? new Date(whiteboard.date).toLocaleDateString().toUpperCase()
                : 'NEVER',
            },
            { label: 'MODE', value: isEditing ? 'EDITING' : 'VIEWING' },
            { label: 'STATUS', value: 'ACTIVE' },
          ]}
        />
      </motion.div>
    </motion.div>
  );
}

export default CanvasWhiteboardPage;
