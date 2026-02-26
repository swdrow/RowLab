/**
 * ShellForm: create/edit form for a shell (boat).
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
import type { Shell } from '../types';
import {
  SHELL_TYPE_DISPLAY,
  WEIGHT_CLASS_DISPLAY,
  RIGGING_DISPLAY,
  STATUS_DISPLAY,
} from '../types';
// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const shellSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  boatClass: z.string().min(1, 'Boat class is required'),
  type: z.enum(['EIGHT', 'FOUR', 'QUAD', 'DOUBLE', 'PAIR', 'SINGLE'] as const),
  weightClass: z.enum(['HEAVYWEIGHT', 'LIGHTWEIGHT', 'OPENWEIGHT'] as const),
  rigging: z.enum(['SWEEP', 'SCULL'] as const),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'] as const),
  notes: z.string().optional(),
});

type ShellFormData = z.infer<typeof shellSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShellFormProps {
  shell?: Shell | null;
  onSubmit: (data: ShellFormData) => void;
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

export function ShellForm({ shell, onSubmit, onCancel, isPending }: ShellFormProps) {
  const isEdit = !!shell;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShellFormData>({
    resolver: zodResolver(shellSchema),
    defaultValues: {
      name: shell?.name ?? '',
      boatClass: shell?.boatClass ?? '',
      type: shell?.type ?? 'EIGHT',
      weightClass: shell?.weightClass ?? 'HEAVYWEIGHT',
      rigging: shell?.rigging ?? 'SWEEP',
      status: shell?.status ?? 'AVAILABLE',
      notes: shell?.notes ?? '',
    },
  });

  // Reset form if the shell prop changes (switching between edit targets)
  useEffect(() => {
    if (shell) {
      reset({
        name: shell.name,
        boatClass: shell.boatClass,
        type: shell.type,
        weightClass: shell.weightClass,
        rigging: shell.rigging,
        status: shell.status,
        notes: shell.notes ?? '',
      });
    }
  }, [shell, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-lg font-display font-semibold text-text-bright">
        {isEdit ? 'Edit Shell' : 'Add Shell'}
      </h2>

      <Input
        label="Name"
        placeholder="e.g. Varsity VIII"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Boat Class"
        placeholder="e.g. Empacher 8+"
        error={errors.boatClass?.message}
        {...register('boatClass')}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Type"
          error={errors.type?.message}
          options={SHELL_TYPE_DISPLAY as Record<string, string>}
          {...register('type')}
        />
        <SelectField
          label="Weight Class"
          error={errors.weightClass?.message}
          options={WEIGHT_CLASS_DISPLAY as Record<string, string>}
          {...register('weightClass')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Rigging"
          error={errors.rigging?.message}
          options={RIGGING_DISPLAY as Record<string, string>}
          {...register('rigging')}
        />
        <SelectField
          label="Status"
          error={errors.status?.message}
          options={STATUS_DISPLAY as Record<string, string>}
          {...register('status')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="shell-notes" className="text-sm font-medium text-text-default">
          Notes
        </label>
        <textarea
          id="shell-notes"
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
          {isEdit ? 'Save Changes' : 'Add Shell'}
        </Button>
      </div>
    </form>
  );
}
