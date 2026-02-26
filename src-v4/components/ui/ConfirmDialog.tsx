/**
 * Confirmation dialog — oarbit design system.
 *
 * Composes Dialog + Button components.
 * Uses Button destructive variant (not raw button).
 * Loading: shimmer, never a spinner.
 */

import { Dialog } from './Dialog';
import { Button } from './Button';

type ConfirmVariant = 'danger' | 'warning';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: ConfirmVariant;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          size="md"
          onClick={onConfirm}
          disabled={loading}
          loading={loading}
          className={variant === 'warning' ? 'bg-data-warning hover:bg-data-warning/90' : ''}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
