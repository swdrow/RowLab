import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * GlassModal - Liquid Glass Modal Component
 *
 * Usage:
 *   <GlassModal isOpen={isOpen} onClose={handleClose} title="Modal Title">
 *     <p>Modal content...</p>
 *   </GlassModal>
 *
 * Props:
 *   - isOpen: boolean - controls modal visibility
 *   - onClose: function - callback when modal should close
 *   - title: string - modal title
 *   - size: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md')
 *   - showCloseButton: boolean - show X button (default: true)
 *   - closeOnBackdrop: boolean - close on backdrop click (default: true)
 *   - closeOnEscape: boolean - close on ESC key (default: true)
 *   - className: additional CSS classes for modal content
 *   - children: modal content
 */

const GlassModal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  children,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  // Size variants
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      {/* Backdrop - ultra blurred glass */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-xl" />

      {/* Modal content */}
      <div
        className={`
          relative w-full ${sizes[size]}
          glass-strong
          backdrop-blur-2xl
          rounded-2xl
          shadow-floating
          border border-white/20 dark:border-white/10
          overflow-hidden
          animate-scale-in
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top edge highlight (glass realism) */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="relative px-6 py-4 border-b border-white/10 dark:border-white/5">
            <div className="flex items-center justify-between">
              {title && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    ml-auto p-2 rounded-lg
                    text-gray-500 dark:text-gray-400
                    hover:bg-white/10 dark:hover:bg-white/5
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="relative px-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Bottom edge glow (subtle) */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

export default GlassModal;
