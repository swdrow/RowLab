/**
 * OarSetForm: create/edit form for an oar set.
 *
 * Uses react-hook-form + zod. Rendered inside a dialog overlay.
 * On submit calls the appropriate mutation and closes the dialog.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { OarSet } from '../types';
import { OAR_TYPE_DISPLAY, STATUS_DISPLAY } from '../types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const oarSetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['SWEEP', 'SCULL'] as const),
  count: z.number().int().min(1, 'Count must be at least 1'),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'] as const),
  notes: z.string().optional(),
});

type OarSetFormData = z.infer<typeof oarSetSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OarSetFormProps {
  oarSet?: OarSet | null;
  onSubmit: (data: OarSetFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// ---------------------------------------------------------------------------
// Styled select (matches Input component styling)
// ---------------------------------------------------------------------------

function SelectField({
  label,
  error,
  options,
  ...props
}: {
  label: string;
  error?: string;
  options: Record<string, string>;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const selectId = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-text-default">
        {label}
      </label>
      <select
        id={selectId}
        className={`
          h-10 w-full rounded-xl px-3.5 text-sm
          bg-void-raised text-text-bright
          border transition-colors duration-150
          ${
            error
              ? 'border-data-poor focus:border-data-poor focus:ring-1 focus:ring-data-poor/30'
              : 'border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30'
          }
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
        `.trim()}
        {...props}
      >
        {Object.entries(options).map(([value, display]) => (
          <option key={value} value={value}>
            {display}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-data-poor">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OarSetForm({ oarSet, onSubmit, onCancel, isPending }: OarSetFormProps) {
  const isEdit = !!oarSet;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OarSetFormData>({
    resolver: zodResolver(oarSetSchema),
    defaultValues: {
      name: oarSet?.name ?? '',
      type: oarSet?.type ?? 'SWEEP',
      count: oarSet?.count ?? 8,
      status: oarSet?.status ?? 'AVAILABLE',
      notes: oarSet?.notes ?? '',
    },
  });

  useEffect(() => {
    if (oarSet) {
      reset({
        name: oarSet.name,
        type: oarSet.type,
        count: oarSet.count,
        status: oarSet.status,
        notes: oarSet.notes ?? '',
      });
    }
  }, [oarSet, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-lg font-display font-semibold text-text-bright">
        {isEdit ? 'Edit Oar Set' : 'Add Oar Set'}
      </h2>

      <Input
        label="Name"
        placeholder="e.g. Croker M35"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Type"
          error={errors.type?.message}
          options={OAR_TYPE_DISPLAY as Record<string, string>}
          {...register('type')}
        />
        <Input
          label="Count"
          type="number"
          min={1}
          error={errors.count?.message}
          {...register('count', { valueAsNumber: true })}
        />
      </div>

      <SelectField
        label="Status"
        error={errors.status?.message}
        options={STATUS_DISPLAY as Record<string, string>}
        {...register('status')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="oar-notes" className="text-sm font-medium text-text-default">
          Notes
        </label>
        <textarea
          id="oar-notes"
          rows={3}
          placeholder="Optional notes..."
          className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-void-raised text-text-bright placeholder:text-text-faint border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 resize-none"
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={isPending}>
          {isEdit ? 'Save Changes' : 'Add Oar Set'}
        </Button>
      </div>
    </form>
  );
}
