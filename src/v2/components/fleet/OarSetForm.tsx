import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { OarSet } from '../../types/coach';

const oarSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['SWEEP', 'SCULL']),
  count: z.coerce.number().min(1, 'Count must be at least 1').max(100, 'Count must not exceed 100'),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
  notes: z.string().max(500).optional(),
});

type OarSetFormData = z.infer<typeof oarSetSchema>;

interface OarSetFormProps {
  initialData?: OarSet;
  onSubmit: (data: OarSetFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function OarSetForm({ initialData, onSubmit, onCancel, isSubmitting }: OarSetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OarSetFormData>({
    resolver: zodResolver(oarSetSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      type: initialData.type,
      count: initialData.count,
      status: initialData.status,
      notes: initialData.notes || '',
    } : {
      status: 'AVAILABLE',
      type: 'SWEEP',
      count: 8,
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
          placeholder="e.g., Set A - Sweep Oars"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* Type and Count in grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Type</label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={isSubmitting}
          >
            <option value="SWEEP">Sweep</option>
            <option value="SCULL">Scull</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Count</label>
          <input
            type="number"
            {...register('count')}
            className="w-full px-3 py-2 rounded-lg border border-bdr-primary bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={isSubmitting}
            min="1"
            max="100"
          />
          {errors.count && <p className="mt-1 text-sm text-red-500">{errors.count.message}</p>}
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
          {isSubmitting ? 'Saving...' : initialData ? 'Update Oar Set' : 'Add Oar Set'}
        </button>
      </div>
    </form>
  );
}
