import { useFormContext } from 'react-hook-form';
import type { SessionCreateInput } from '@/v2/types/seatRacing';

/**
 * Step 1: Session metadata entry
 *
 * Fields:
 * - Date (required): Session date
 * - Boat Class (required): '8+', '4+', '4-', '4x', '2-', '2x', '1x'
 * - Conditions (optional): 'calm', 'variable', 'rough'
 * - Location (optional): Free text location
 * - Description (optional): Notes about the session (max 500 chars)
 *
 * Uses useFormContext - form is provided by parent SessionWizard
 */
export function SessionMetadataStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SessionCreateInput>();

  const boatClassOptions = ['8+', '4+', '4-', '4x', '2-', '2x', '1x'];
  const conditionsOptions = [
    { value: '', label: 'Not specified' },
    { value: 'calm', label: 'Calm' },
    { value: 'variable', label: 'Variable' },
    { value: 'rough', label: 'Rough' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-txt-primary mb-1">Session Information</h3>
        <p className="text-sm text-txt-secondary">
          Enter basic details about this seat race session.
        </p>
      </div>

      {/* Date - Required */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-txt-primary mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          type="date"
          {...register('date')}
          className={`w-full px-3 py-2 bg-bg-surface border rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary transition-colors ${
            errors.date ? 'border-red-500' : 'border-bdr-default'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      {/* Boat Class - Required */}
      <div>
        <label htmlFor="boatClass" className="block text-sm font-medium text-txt-primary mb-1">
          Boat Class <span className="text-red-500">*</span>
        </label>
        <select
          id="boatClass"
          {...register('boatClass')}
          className={`w-full px-3 py-2 bg-bg-surface border rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary transition-colors ${
            errors.boatClass ? 'border-red-500' : 'border-bdr-default'
          }`}
        >
          <option value="">Select boat class...</option>
          {boatClassOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.boatClass && (
          <p className="mt-1 text-sm text-red-600">{errors.boatClass.message}</p>
        )}
      </div>

      {/* Conditions - Optional */}
      <div>
        <label htmlFor="conditions" className="block text-sm font-medium text-txt-primary mb-1">
          Water Conditions
        </label>
        <select
          id="conditions"
          {...register('conditions')}
          className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary transition-colors"
        >
          {conditionsOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location - Optional */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-txt-primary mb-1">
          Location
        </label>
        <input
          id="location"
          type="text"
          {...register('location')}
          placeholder="e.g., Charles River"
          className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary placeholder:text-txt-tertiary transition-colors"
        />
      </div>

      {/* Description - Optional */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-txt-primary mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          placeholder="Notes about this seat race..."
          maxLength={500}
          rows={4}
          className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary placeholder:text-txt-tertiary resize-none transition-colors"
        />
        <p className="mt-1 text-xs text-txt-tertiary">Maximum 500 characters</p>
      </div>
    </div>
  );
}
