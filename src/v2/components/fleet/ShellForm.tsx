import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shell } from '../../types/coach';

const shellSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  boatClass: z.string().min(1, 'Boat class is required'),
  type: z.enum(['EIGHT', 'FOUR', 'QUAD', 'DOUBLE', 'PAIR', 'SINGLE']),
  weightClass: z.enum(['HEAVYWEIGHT', 'LIGHTWEIGHT', 'OPENWEIGHT']),
  rigging: z.enum(['SWEEP', 'SCULL']),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
  notes: z.string().max(500).optional(),
});

type ShellFormData = z.infer<typeof shellSchema>;

interface ShellFormProps {
  initialData?: Shell;
  onSubmit: (data: ShellFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ShellForm({ initialData, onSubmit, onCancel, isSubmitting }: ShellFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShellFormData>({
    resolver: zodResolver(shellSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      boatClass: initialData.boatClass,
      type: initialData.type,
      weightClass: initialData.weightClass,
      rigging: initialData.rigging,
      status: initialData.status,
      notes: initialData.notes || '',
    } : {
      status: 'AVAILABLE',
      type: 'EIGHT',
      weightClass: 'OPENWEIGHT',
      rigging: 'SWEEP',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name field */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">Name</label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          disabled={isSubmitting}
          placeholder="e.g., Resolute"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* Boat class field */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">Boat Class</label>
        <select
          {...register('boatClass')}
          className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          disabled={isSubmitting}
        >
          <option value="">Select...</option>
          <option value="1x">1x (Single)</option>
          <option value="2-">2- (Pair)</option>
          <option value="2x">2x (Double)</option>
          <option value="4-">4- (Four)</option>
          <option value="4x">4x (Quad)</option>
          <option value="4+">4+ (Coxed Four)</option>
          <option value="8+">8+ (Eight)</option>
        </select>
        {errors.boatClass && <p className="mt-1 text-sm text-red-500">{errors.boatClass.message}</p>}
      </div>

      {/* Type, Weight Class, Rigging selects in grid */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Type</label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={isSubmitting}
          >
            <option value="SINGLE">Single</option>
            <option value="PAIR">Pair</option>
            <option value="DOUBLE">Double</option>
            <option value="FOUR">Four</option>
            <option value="QUAD">Quad</option>
            <option value="EIGHT">Eight</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Weight</label>
          <select
            {...register('weightClass')}
            className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={isSubmitting}
          >
            <option value="OPENWEIGHT">Open</option>
            <option value="LIGHTWEIGHT">Lightweight</option>
            <option value="HEAVYWEIGHT">Heavyweight</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Rigging</label>
          <select
            {...register('rigging')}
            className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={isSubmitting}
          >
            <option value="SWEEP">Sweep</option>
            <option value="SCULL">Scull</option>
          </select>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          disabled={isSubmitting}
        >
          <option value="AVAILABLE">Available</option>
          <option value="IN_USE">In Use</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
          disabled={isSubmitting}
          placeholder="Optional notes about condition, maintenance, etc."
        />
        {errors.notes && <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-txt-primary border border-bdr-primary rounded-lg hover:bg-surface-hover transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Shell' : 'Add Shell'}
        </button>
      </div>
    </form>
  );
}
