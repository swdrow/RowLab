import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import type { WidgetId } from '../../types/dashboard';

/**
 * Widget size variants for bento grid
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'hero';

interface WidgetWrapperProps {
  id: WidgetId;
  size: WidgetSize;
  children: ReactNode;
  isDraggingEnabled?: boolean;
}

/**
 * CSS Grid span classes for each size
 */
const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-1 md:col-span-2 row-span-1',
  large: 'col-span-1 md:col-span-2 row-span-2',
  hero: 'col-span-full row-span-1',
};

/**
 * WidgetWrapper - Sortable widget container
 *
 * Provides DnD behavior via @dnd-kit/sortable and
 * applies grid size classes for bento layout.
 */
export function WidgetWrapper({
  id,
  size,
  children,
  isDraggingEnabled = true,
}: WidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isDraggingEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${SIZE_CLASSES[size]}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
    >
      <div className="relative group h-full">
        {/* Drag handle overlay */}
        {isDraggingEnabled && (
          <div
            {...attributes}
            {...listeners}
            className="
              absolute top-2 right-2 z-10
              p-1.5 rounded-lg bg-card-bg/50
              hover:bg-card-bg transition-colors
              cursor-grab active:cursor-grabbing
              opacity-0 group-hover:opacity-100
            "
            title="Drag to reorder"
          >
            <svg
              className="w-4 h-4 text-txt-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
