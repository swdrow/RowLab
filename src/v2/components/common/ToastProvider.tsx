import { Toaster } from 'sonner';

/**
 * ToastProvider wraps the Sonner Toaster component with V2 styling.
 * Place this once at the app root level.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        className: 'bg-surface-elevated border-bdr text-txt-primary',
        style: {
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-bdr)',
          color: 'var(--color-txt-primary)',
        },
      }}
      richColors
      closeButton
    />
  );
}

// Re-export toast function for convenience
export { toast } from 'sonner';
