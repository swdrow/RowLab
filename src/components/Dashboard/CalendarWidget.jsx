import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit2,
  Trash2,
  Repeat,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isPast,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';

/**
 * CalendarWidget - Full calendar with event creation
 *
 * Features:
 * - Week and month views
 * - Click to create events
 * - Color coding by workout type
 * - Quick edit/delete
 * - Recurring events support (future)
 */

// Workout type colors and labels
const WORKOUT_TYPES = [
  { id: 'erg-test', name: '2k/6k Test', color: 'danger-red', short: 'TEST' },
  { id: 'erg-pieces', name: 'Erg Pieces', color: 'blade-blue', short: 'ERG' },
  { id: 'steady-state', name: 'Steady State', color: 'success', short: 'SS' },
  { id: 'water', name: 'On Water', color: 'spectrum-cyan', short: 'OTW' },
  { id: 'weights', name: 'Weights', color: 'warning-orange', short: 'WT' },
  { id: 'race', name: 'Race', color: 'coxswain-violet', short: 'RACE' },
  { id: 'off', name: 'Off Day', color: 'text-muted', short: 'OFF' },
];

function CalendarWidget({
  events = [], // Array of { id, date, type, title, time?, notes?, completed?, missed?, visibility? }
  onEventCreate,
  onEventEdit,
  onEventDelete,
  onEventComplete,
  view = 'week', // 'week' | 'month'
  className = '',
  // Permission props for role-based access control
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canSetVisibility = false, // Only coaches can set visibility
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentView, setCurrentView] = useState(view);

  // Event form state
  const [eventForm, setEventForm] = useState({
    type: 'erg-pieces',
    title: '',
    time: '',
    notes: '',
    visibility: 'all', // 'all' | 'coaches'
  });

  // Get days to display based on view
  const displayDays = useMemo(() => {
    if (currentView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, currentView]);

  // Map events to days
  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach(event => {
      const dayKey = format(new Date(event.date), 'yyyy-MM-dd');
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey).push(event);
    });
    return map;
  }, [events]);

  // Navigate
  const navigate = (direction) => {
    if (currentView === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  // Handle day click - only open create modal if user has permission
  const handleDayClick = (day) => {
    if (!canCreate) return; // No permission to create events
    setSelectedDay(day);
    setEditingEvent(null);
    setEventForm({ type: 'erg-pieces', title: '', time: '', notes: '', visibility: 'all' });
    setShowEventModal(true);
  };

  // Handle event click - always allow viewing event details
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedDay(new Date(event.date));
    setEditingEvent(event);
    setEventForm({
      type: event.type || event.eventType || 'erg-pieces',
      title: event.title || '',
      time: event.time || event.startTime || '',
      notes: event.notes || '',
      visibility: event.visibility || 'all',
    });
    setShowEventModal(true);
  };

  // Save event
  const handleSaveEvent = () => {
    const eventData = {
      ...eventForm,
      date: selectedDay,
    };

    if (editingEvent) {
      onEventEdit?.({ ...editingEvent, ...eventData });
    } else {
      onEventCreate?.(eventData);
    }

    setShowEventModal(false);
    setSelectedDay(null);
    setEditingEvent(null);
    setEventForm({ type: 'erg-pieces', title: '', time: '', notes: '', visibility: 'all' });
  };

  // Delete event
  const handleDeleteEvent = () => {
    if (editingEvent) {
      onEventDelete?.(editingEvent.id);
    }
    setShowEventModal(false);
    setEditingEvent(null);
  };

  // Get workout type config
  const getWorkoutType = (typeId) => {
    return WORKOUT_TYPES.find(t => t.id === typeId) || WORKOUT_TYPES[0];
  };

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-spectrum-cyan/10 border border-spectrum-cyan/20 flex items-center justify-center">
            <Calendar size={20} className="text-spectrum-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              {format(currentDate, currentView === 'week' ? "'Week of' MMM d" : 'MMMM yyyy')}
            </h3>
            <p className="text-xs text-text-muted">
              {events.length} scheduled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg bg-void-surface border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => setCurrentView('week')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                currentView === 'week'
                  ? 'bg-blade-blue/10 text-blade-blue'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCurrentView('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                currentView === 'month'
                  ? 'bg-blade-blue/10 text-blade-blue'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('prev')}
              aria-label={`Previous ${currentView}`}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              Today
            </button>
            <button
              onClick={() => navigate('next')}
              aria-label={`Next ${currentView}`}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-[10px] font-medium uppercase tracking-wider text-text-muted py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className={`grid grid-cols-7 gap-1 ${currentView === 'month' ? 'auto-rows-[80px]' : 'auto-rows-[100px]'}`}>
          {displayDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(dayKey) || [];
            const today = isToday(day);
            const past = isPast(day) && !today;
            const inMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={dayKey}
                onClick={() => handleDayClick(day)}
                role={canCreate ? "button" : undefined}
                tabIndex={canCreate ? 0 : undefined}
                className={`
                  relative flex flex-col p-2 rounded-lg border text-left transition-all
                  ${today
                    ? 'bg-blade-blue/5 border-blade-blue/30 ring-1 ring-blade-blue/20'
                    : 'bg-void-surface border-white/[0.04] hover:border-white/10 hover:bg-white/[0.02]'
                  }
                  ${!inMonth && currentView === 'month' ? 'opacity-40' : ''}
                  ${canCreate ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {/* Day number */}
                <span className={`text-xs font-mono font-medium ${today ? 'text-blade-blue' : 'text-text-secondary'}`}>
                  {format(day, 'd')}
                </span>

                {/* Events */}
                <div className="flex-1 mt-1 overflow-hidden space-y-0.5">
                  {dayEvents.slice(0, currentView === 'month' ? 2 : 3).map(event => {
                    const type = getWorkoutType(event.type);
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`
                          flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium truncate
                          bg-${type.color}/10 text-${type.color}
                          ${event.completed ? 'line-through opacity-60' : ''}
                          hover:bg-${type.color}/20 transition-colors cursor-pointer
                        `}
                        style={{
                          backgroundColor: `var(--${type.color}, rgba(255,255,255,0.1))`.replace('var(--', 'color-mix(in srgb, '),
                        }}
                      >
                        {event.time && <Clock size={8} className="shrink-0" />}
                        <span className="truncate">{event.title || type.name}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > (currentView === 'month' ? 2 : 3) && (
                    <span className="text-[9px] text-text-muted">+{dayEvents.length - (currentView === 'month' ? 2 : 3)} more</span>
                  )}
                </div>

                {/* Add button on hover - only show if user can create */}
                {canCreate && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={12} className="text-text-muted" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void-deep/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-void-elevated border border-white/[0.08] shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="font-medium text-text-primary">
                    {editingEvent ? (canEdit ? 'Edit Event' : 'View Event') : 'New Event'}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  aria-label="Close event dialog"
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Modal content */}
              <div className="p-4 space-y-4">
                {/* Permission note for view-only mode */}
                {editingEvent && !canEdit && (
                  <div className="px-3 py-2 rounded-lg bg-blade-blue/5 border border-blade-blue/20 text-xs text-text-muted">
                    You can view this event but don't have permission to edit.
                  </div>
                )}

                {/* Workout type */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {WORKOUT_TYPES.filter(t => t.id !== 'off').map(type => {
                      const isSelected = eventForm.type === type.id;
                      const isDisabled = editingEvent && !canEdit;
                      return (
                        <button
                          key={type.id}
                          onClick={() => !isDisabled && setEventForm({ ...eventForm, type: type.id })}
                          disabled={isDisabled}
                          className={`
                            px-2 py-2 rounded-lg text-xs font-medium text-center transition-all
                            ${isSelected
                              ? `bg-${type.color}/20 text-${type.color} border border-${type.color}/40`
                              : 'bg-void-surface border border-white/[0.06] text-text-secondary hover:border-white/10'
                            }
                            ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
                          `}
                        >
                          {type.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder={getWorkoutType(eventForm.type).name}
                    readOnly={editingEvent && !canEdit}
                    className={`w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all ${editingEvent && !canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    readOnly={editingEvent && !canEdit}
                    className={`w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/40 transition-all ${editingEvent && !canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Notes
                  </label>
                  <textarea
                    value={eventForm.notes}
                    onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                    placeholder="Add workout details..."
                    rows={2}
                    readOnly={editingEvent && !canEdit}
                    className={`w-full px-3 py-2.5 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/40 transition-all resize-none ${editingEvent && !canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Visibility - only shown to coaches */}
                {canSetVisibility && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Visibility
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEventForm({ ...eventForm, visibility: 'all' })}
                        disabled={editingEvent && !canEdit}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          eventForm.visibility === 'all'
                            ? 'bg-blade-blue/10 text-blade-blue border border-blade-blue/30'
                            : 'bg-void-surface border border-white/[0.06] text-text-secondary hover:border-white/10'
                        } ${editingEvent && !canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        All Team
                      </button>
                      <button
                        onClick={() => setEventForm({ ...eventForm, visibility: 'coaches' })}
                        disabled={editingEvent && !canEdit}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          eventForm.visibility === 'coaches'
                            ? 'bg-warning-orange/10 text-warning-orange border border-warning-orange/30'
                            : 'bg-void-surface border border-white/[0.06] text-text-secondary hover:border-white/10'
                        } ${editingEvent && !canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        Coaches Only
                      </button>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5">
                      {eventForm.visibility === 'coaches'
                        ? 'Only coaches and owners can see this event'
                        : 'All team members can see this event'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Modal actions */}
              <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
                {/* Delete button - only show if editing and has permission */}
                {editingEvent && canDelete ? (
                  <button
                    onClick={handleDeleteEvent}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-danger-red text-sm hover:bg-danger-red/10 transition-all"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
                  >
                    {editingEvent && !canEdit ? 'Close' : 'Cancel'}
                  </button>
                  {/* Save/Create button - only show if creating (canCreate) or editing with permission */}
                  {(!editingEvent || canEdit) && (
                    <button
                      onClick={handleSaveEvent}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
                    >
                      <Check size={14} />
                      {editingEvent ? 'Save' : 'Create'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CalendarWidget;
