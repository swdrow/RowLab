import { useState } from 'react';
import { AvailabilityCell } from './AvailabilityCell';
import type { AvailabilityDay, AvailabilitySlot } from '../../types/coach';

interface AvailabilityEditorProps {
  athleteId: string;
  athleteName: string;
  dates: Date[];
  availability: AvailabilityDay[];
  onSave: (availability: AvailabilityDay[]) => void;
  onCancel: () => void;
}

/**
 * Slot selector buttons for editing
 */
function SlotSelector({
  value,
  onChange,
  label,
}: {
  value: AvailabilitySlot;
  onChange: (slot: AvailabilitySlot) => void;
  label: string;
}) {
  const slots: { value: AvailabilitySlot; label: string; color: string }[] = [
    { value: 'AVAILABLE', label: '✓', color: 'bg-status-success text-white hover:bg-status-success/80' },
    { value: 'MAYBE', label: '?', color: 'bg-status-warning text-white hover:bg-status-warning/80' },
    { value: 'UNAVAILABLE', label: '✗', color: 'bg-status-error text-white hover:bg-status-error/80' },
    { value: 'NOT_SET', label: '—', color: 'bg-bg-hover text-text-secondary hover:bg-bg-active' },
  ];

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      <div className="flex gap-1">
        {slots.map((slot) => (
          <button
            key={slot.value}
            type="button"
            onClick={() => onChange(slot.value)}
            className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              value === slot.value
                ? slot.color
                : 'bg-bg-surface text-text-muted hover:bg-bg-hover'
            }`}
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * AvailabilityEditor - Individual athlete availability editing
 *
 * Features:
 * - Edit morning/evening slots for each date
 * - Visual slot selector buttons
 * - Preview via AvailabilityCell
 * - Save/Cancel actions
 */
export function AvailabilityEditor({
  athleteId,
  athleteName,
  dates,
  availability,
  onSave,
  onCancel,
}: AvailabilityEditorProps) {
  // Initialize local state with existing availability or defaults
  const [editedAvailability, setEditedAvailability] = useState<AvailabilityDay[]>(() => {
    return dates.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const existing = availability.find((d) => d.date === dateStr);
      return existing || { date: dateStr, morningSlot: 'NOT_SET', eveningSlot: 'NOT_SET' };
    });
  });

  const updateSlot = (dateStr: string, slot: 'morningSlot' | 'eveningSlot', value: AvailabilitySlot) => {
    setEditedAvailability((prev) =>
      prev.map((day) => (day.date === dateStr ? { ...day, [slot]: value } : day))
    );
  };

  const handleSave = () => {
    onSave(editedAvailability);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border-default pb-4">
        <h3 className="text-lg font-semibold text-text-primary">Edit Availability</h3>
        <p className="text-sm text-text-secondary mt-1">
          Set availability for <span className="font-medium text-text-primary">{athleteName}</span>
        </p>
      </div>

      {/* Date editors */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {dates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayData = editedAvailability[index];

          return (
            <div key={dateStr} className="p-4 rounded-lg bg-bg-surface border border-border-subtle">
              {/* Date header */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-text-primary">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                {/* Preview */}
                <div className="w-24">
                  <AvailabilityCell morningSlot={dayData.morningSlot} eveningSlot={dayData.eveningSlot} />
                </div>
              </div>

              {/* Slot selectors */}
              <div className="grid grid-cols-2 gap-4">
                <SlotSelector
                  label="Morning"
                  value={dayData.morningSlot}
                  onChange={(value) => updateSlot(dateStr, 'morningSlot', value)}
                />
                <SlotSelector
                  label="Evening"
                  value={dayData.eveningSlot}
                  onChange={(value) => updateSlot(dateStr, 'eveningSlot', value)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t border-border-default pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded bg-bg-surface text-text-primary hover:bg-bg-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded bg-interactive-primary text-white hover:bg-interactive-hover transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
