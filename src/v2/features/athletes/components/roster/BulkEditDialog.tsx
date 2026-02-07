import { Fragment, useState, useCallback } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Athlete, AthleteStatus, SidePreference } from '@v2/types/athletes';

export interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAthletes: Athlete[];
  onBulkUpdate: (updates: BulkEditFields) => Promise<void>;
}

export interface BulkEditFields {
  status?: AthleteStatus;
  side?: SidePreference;
  classYear?: number | null;
}

const STATUS_OPTIONS: Array<{ value: AthleteStatus | ''; label: string }> = [
  { value: '', label: 'No change' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'injured', label: 'Injured' },
  { value: 'graduated', label: 'Graduated' },
];

const SIDE_OPTIONS: Array<{ value: SidePreference | ''; label: string }> = [
  { value: '', label: 'No change' },
  { value: 'Port', label: 'Port' },
  { value: 'Starboard', label: 'Starboard' },
  { value: 'Both', label: 'Both' },
  { value: 'Cox', label: 'Cox' },
];

const selectClassName = `
  w-full px-3 py-2
  bg-bg-surface border border-bdr-default rounded-lg
  text-sm text-txt-primary
  focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
  transition-all
`;

/**
 * Modal dialog for bulk editing selected athletes.
 * Allows changing status, side preference, and class year.
 * Uses optimistic UI with toast notifications.
 */
export function BulkEditDialog({
  isOpen,
  onClose,
  selectedAthletes,
  onBulkUpdate,
}: BulkEditDialogProps) {
  const [status, setStatus] = useState<AthleteStatus | ''>('');
  const [side, setSide] = useState<SidePreference | ''>('');
  const [classYear, setClassYear] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const count = selectedAthletes.length;

  const hasChanges = status !== '' || side !== '' || classYear !== '';

  const handleSubmit = useCallback(async () => {
    if (!hasChanges) return;

    const updates: BulkEditFields = {};
    if (status !== '') updates.status = status;
    if (side !== '') updates.side = side;
    if (classYear !== '') {
      const parsed = parseInt(classYear, 10);
      if (!isNaN(parsed)) updates.classYear = parsed;
    }

    setIsSubmitting(true);
    try {
      await onBulkUpdate(updates);
      toast.success(`Updated ${count} athlete${count !== 1 ? 's' : ''}`);
      onClose();
      // Reset form
      setStatus('');
      setSide('');
      setClassYear('');
    } catch (error) {
      toast.error('Failed to update athletes. Changes have been rolled back.');
    } finally {
      setIsSubmitting(false);
    }
  }, [hasChanges, status, side, classYear, count, onBulkUpdate, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md bg-bg-surface border border-bdr-default rounded-xl shadow-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <DialogTitle className="text-lg font-semibold text-txt-primary">
                    Bulk Edit
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-txt-tertiary hover:text-txt-primary hover:bg-bg-hover transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-txt-secondary mb-6">
                  Apply changes to{' '}
                  <span className="font-medium text-txt-primary tabular-nums">{count}</span>{' '}
                  selected athlete{count !== 1 ? 's' : ''}. Only fields you change will be updated.
                </p>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AthleteStatus | '')}
                      className={selectClassName}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Side Preference */}
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                      Side Preference
                    </label>
                    <select
                      value={side ?? ''}
                      onChange={(e) =>
                        setSide(e.target.value === '' ? '' : (e.target.value as SidePreference))
                      }
                      className={selectClassName}
                    >
                      {SIDE_OPTIONS.map((opt) => (
                        <option key={opt.value ?? 'none'} value={opt.value ?? ''}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Year */}
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                      Class Year
                    </label>
                    <input
                      type="number"
                      value={classYear}
                      onChange={(e) => setClassYear(e.target.value)}
                      placeholder="No change"
                      min={2000}
                      max={2040}
                      className={selectClassName}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-8">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary border border-bdr-default rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!hasChanges || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-interactive-primary hover:bg-interactive-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? 'Applying...'
                      : `Apply to ${count} athlete${count !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default BulkEditDialog;
