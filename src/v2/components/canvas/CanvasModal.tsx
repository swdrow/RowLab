/**
 * CanvasModal - Headless UI Dialog with Canvas chamfer styling
 *
 * Modal overlay with Canvas design language:
 * - Chamfered panel (diagonal corner, not rounded)
 * - Backdrop blur with ink-deep tint
 * - Scale + translate animation
 * - Optional ruled header
 *
 * Design: Canvas modal primitive
 */

import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { RuledHeader } from './RuledHeader';

export interface CanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

export function CanvasModal({ isOpen, onClose, title, size = 'md', children }: CanvasModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog as={motion.div} static open={isOpen} onClose={onClose} className="relative z-[100]">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-ink-deep/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel>
              <motion.div
                className={`canvas-chamfer bg-ink-base border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.4)] w-full ${sizeClasses[size]} p-6`}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {title && <RuledHeader>{title}</RuledHeader>}
                {children}
              </motion.div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
