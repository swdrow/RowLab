import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, type ToastType, type ToastData } from '../components/common/Toast';

/**
 * ToastContext - Global toast notification system
 *
 * Provides useToast hook for showing toast notifications from any component.
 * Toasts auto-dismiss after 5 seconds and stack in top-right corner.
 *
 * Usage:
 * ```tsx
 * // In App.tsx - wrap with provider
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In any component
 * const { showToast } = useToast();
 * showToast('success', 'Settings saved successfully');
 * showToast('error', 'Failed to save settings');
 * ```
 */

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastData = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after timeout
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container - fixed position top-right */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        aria-label="Notifications"
        role="region"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
