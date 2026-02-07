/**
 * Widget Catalog Modal
 * Phase 27-05: Browse and add/remove dashboard widgets by category
 */

import { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus } from '@phosphor-icons/react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { getAvailableWidgets } from '../config/widgetRegistry';
import { MODAL_VARIANTS, SPRING_CONFIG } from '../../../utils/animations';
import type { UserRole, WidgetCategory, WidgetConfig } from '../types';

interface WidgetCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  activeWidgets: string[]; // widget types currently on dashboard
  onAddWidget: (widgetType: string) => void;
  onRemoveWidget: (widgetType: string) => void;
}

type CategoryTab = 'all' | WidgetCategory;

const CATEGORIES: { id: CategoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'overview', label: 'Overview' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'activity', label: 'Activity' },
  { id: 'team', label: 'Team' },
];

/**
 * Widget Catalog - Modal for browsing and adding/removing widgets
 *
 * Features:
 * - Category tabs for filtering
 * - Responsive grid (3 cols desktop, 2 tablet, 1 mobile)
 * - Add/remove buttons with visual feedback
 * - Animated transitions with AnimatePresence
 * - Focus trap and keyboard navigation
 */
export function WidgetCatalog({
  isOpen,
  onClose,
  role,
  activeWidgets,
  onAddWidget,
  onRemoveWidget,
}: WidgetCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');

  // Get all widgets available for this role
  const availableWidgets = getAvailableWidgets(role);

  // Filter by category
  const filteredWidgets = availableWidgets.filter((widget) => {
    if (selectedCategory === 'all') return true;
    return widget.category === selectedCategory;
  });

  // Check if widget is active
  const isWidgetActive = (widgetType: string) => activeWidgets.includes(widgetType);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-2"
          >
            <Dialog.Panel className="w-full max-w-4xl max-h-[80vh] flex flex-col bg-surface-elevated border border-bdr-default rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-bdr-default bg-surface-default">
                <Dialog.Title className="text-xl font-semibold text-txt-primary">
                  Widget Catalog
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Tabs */}
              <Tab.Group
                selectedIndex={CATEGORIES.findIndex((c) => c.id === selectedCategory)}
                onChange={(index) => setSelectedCategory(CATEGORIES[index].id)}
              >
                <div className="border-b border-bdr-default bg-surface-default">
                  <Tab.List className="flex gap-2 px-6 py-2">
                    {CATEGORIES.map((category) => (
                      <Tab key={category.id} as={Fragment}>
                        {({ selected }) => (
                          <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                                : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated'
                            }`}
                          >
                            {category.label}
                          </button>
                        )}
                      </Tab>
                    ))}
                  </Tab.List>
                </div>
              </Tab.Group>

              {/* Widget Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={SPRING_CONFIG}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filteredWidgets.map((widget) => (
                      <WidgetCard
                        key={widget.id}
                        widget={widget}
                        isActive={isWidgetActive(widget.id)}
                        onAdd={() => onAddWidget(widget.id)}
                        onRemove={() => onRemoveWidget(widget.id)}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Empty state */}
                {filteredWidgets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-txt-secondary">No widgets found in this category</p>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// ============================================
// WIDGET CARD
// ============================================

interface WidgetCardProps {
  widget: WidgetConfig;
  isActive: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

function WidgetCard({ widget, isActive, onAdd, onRemove }: WidgetCardProps) {
  // Get icon component
  const IconComponent = (PhosphorIcons as any)[widget.icon] || PhosphorIcons.Square;

  // Available sizes
  const sizeKeys = Object.keys(widget.sizes) as ('compact' | 'normal' | 'expanded')[];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative p-4 rounded-lg border transition-all ${
        isActive
          ? 'bg-accent-primary/5 border-accent-primary/30'
          : 'bg-surface-default border-bdr-default hover:border-bdr-focus'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${isActive ? 'bg-accent-primary/10' : 'bg-surface-elevated'}`}
          >
            <IconComponent
              className={`w-5 h-5 ${isActive ? 'text-accent-primary' : 'text-txt-secondary'}`}
              weight="duotone"
            />
          </div>
          <div>
            <h3 className="font-medium text-txt-primary text-sm">{widget.title}</h3>
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="flex-shrink-0">
            <Check className="w-5 h-5 text-accent-primary" weight="bold" />
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-txt-secondary mb-3 line-clamp-2">{widget.description}</p>

      {/* Size indicators */}
      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-txt-tertiary">Sizes:</span>
        {sizeKeys.map((size) => {
          const sizeConfig = widget.sizes[size];
          if (!sizeConfig) return null;

          return (
            <div
              key={size}
              className="px-1.5 py-0.5 rounded bg-surface-elevated text-xs text-txt-secondary"
              title={`${sizeConfig.w}x${sizeConfig.h} cells`}
            >
              {size[0].toUpperCase()}
            </div>
          );
        })}
      </div>

      {/* Action button */}
      <button
        onClick={isActive ? onRemove : onAdd}
        aria-label={isActive ? 'Remove widget' : 'Add widget'}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-surface-default border border-bdr-default text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary'
            : 'bg-accent-primary text-white hover:bg-accent-hover'
        }`}
      >
        {isActive ? (
          <>
            <X className="w-4 h-4" />
            Remove
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add
          </>
        )}
      </button>
    </motion.div>
  );
}
