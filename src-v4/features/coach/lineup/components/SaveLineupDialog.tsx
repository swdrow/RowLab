/**
 * SaveLineupDialog -- modal for saving/updating a lineup.
 *
 * Uses react-hook-form + zod for validation. Rendered as a portal overlay.
 * Pre-fills the name field when updating an existing lineup.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { SPRING_SNAPPY } from '@/lib/animations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IconX } from '@/components/icons';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const saveLineupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export type SaveLineupFormData = z.infer<typeof saveLineupSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SaveLineupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveLineupFormData) => void;
  existingName?: string;
  existingNotes?: string;
  isSubmitting?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SaveLineupDialog({
  isOpen,
  onClose,
  onSave,
  existingName,
  existingNotes,
  isSubmitting = false,
}: SaveLineupDialogProps) {
  const isUpdate = !!existingName;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaveLineupFormData>({
    resolver: zodResolver(saveLineupSchema),
    defaultValues: {
      name: existingName ?? '',
      notes: existingNotes ?? '',
    },
  });

  // Re-populate when dialog opens with new existing values
  useEffect(() => {
    if (isOpen) {
      reset({
        name: existingName ?? '',
        notes: existingNotes ?? '',
      });
    }
  }, [isOpen, existingName, existingNotes, reset]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="save-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
            aria-hidden
          />

          {/* Dialog */}
          <motion.div
            key="save-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={isUpdate ? 'Update lineup' : 'Save lineup'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING_SNAPPY}
            className="
              fixed inset-0 z-50 flex items-center justify-center p-4
              pointer-events-none
            "
          >
            <div className="panel rounded-2xl shadow-xl w-full max-w-md pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-lg font-display font-semibold text-text-bright">
                  {isUpdate ? 'Update Lineup' : 'Save Lineup'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-faint hover:text-text-bright hover:bg-void-overlay transition-colors"
                  aria-label="Close"
                >
                  <IconX width={18} height={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSave)} className="px-5 pb-5 space-y-4">
                <Input
                  label="Lineup Name"
                  placeholder="e.g. Varsity VIII - Spring Race"
                  error={errors.name?.message}
                  autoFocus
                  {...register('name')}
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lineup-notes" className="text-sm font-medium text-text-default">
                    Notes
                  </label>
                  <textarea
                    id="lineup-notes"
                    rows={3}
                    placeholder="Optional notes about this lineup..."
                    className="
                      w-full rounded-xl px-3.5 py-2.5 text-sm
                      bg-void-raised text-text-bright placeholder:text-text-faint
                      border border-edge-default
                      focus:border-accent-teal focus:ring-1 focus:ring-accent/30
                      focus:outline-none transition-colors duration-150 resize-none
                    "
                    {...register('notes')}
                  />
                  {errors.notes?.message && (
                    <p className="text-xs text-data-poor">{errors.notes.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" loading={isSubmitting}>
                    {isUpdate ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
