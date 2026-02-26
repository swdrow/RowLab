/**
 * VisitForm: create/edit recruit visit form.
 *
 * Uses react-hook-form + zod v4 for validation.
 * Fields: name (required), email, phone, school, grad year, date, start/end time, notes.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { RecruitVisit, CreateVisitInput, VisitStatus } from '../types';
import { VISIT_STATUS_OPTIONS } from '../types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const visitSchema = z.object({
  recruitName: z.string().min(1, 'Name is required'),
  recruitEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  recruitPhone: z.string().optional(),
  recruitSchool: z.string().optional(),
  recruitGradYear: z.union([z.number().min(2020).max(2040), z.nan()]).optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Required (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Required (HH:MM)'),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
});

type FormData = z.infer<typeof visitSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VisitFormProps {
  visit?: RecruitVisit;
  onSubmit: (data: CreateVisitInput & { status?: VisitStatus }) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VisitForm({ visit, onSubmit, onCancel, isPending = false }: VisitFormProps) {
  const isEditing = !!visit;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      recruitName: visit?.recruitName ?? '',
      recruitEmail: visit?.recruitEmail ?? '',
      recruitPhone: visit?.recruitPhone ?? '',
      recruitSchool: visit?.recruitSchool ?? '',
      recruitGradYear: visit?.recruitGradYear ?? undefined,
      date: visit?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      startTime: visit?.startTime ?? '09:00',
      endTime: visit?.endTime ?? '17:00',
      notes: visit?.notes ?? '',
      status: visit?.status ?? 'scheduled',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    const gradYear =
      data.recruitGradYear != null && !Number.isNaN(data.recruitGradYear)
        ? data.recruitGradYear
        : undefined;

    const input: CreateVisitInput & { status?: VisitStatus } = {
      recruitName: data.recruitName,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      ...(data.recruitEmail ? { recruitEmail: data.recruitEmail } : {}),
      ...(data.recruitPhone ? { recruitPhone: data.recruitPhone } : {}),
      ...(data.recruitSchool ? { recruitSchool: data.recruitSchool } : {}),
      ...(gradYear ? { recruitGradYear: gradYear } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
      ...(data.status ? { status: data.status } : {}),
    };
    await onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Recruit info */}
      <div className="space-y-3">
        <h4 className="text-sm font-display font-medium text-text-dim uppercase tracking-wider">
          Recruit Info
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Name *"
            {...register('recruitName')}
            error={errors.recruitName?.message}
            placeholder="Full name"
          />
          <Input
            label="Email"
            type="email"
            {...register('recruitEmail')}
            error={errors.recruitEmail?.message}
            placeholder="email@school.edu"
          />
          <Input label="Phone" {...register('recruitPhone')} placeholder="(555) 123-4567" />
          <Input label="School" {...register('recruitSchool')} placeholder="High school name" />
          <Input
            label="Grad Year"
            type="number"
            {...register('recruitGradYear', { valueAsNumber: true })}
            error={errors.recruitGradYear?.message}
            placeholder="2027"
          />
        </div>
      </div>

      {/* Visit schedule */}
      <div className="space-y-3">
        <h4 className="text-sm font-display font-medium text-text-dim uppercase tracking-wider">
          Visit Schedule
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Date *" type="date" {...register('date')} error={errors.date?.message} />
          <Input
            label="Start Time *"
            type="time"
            {...register('startTime')}
            error={errors.startTime?.message}
          />
          <Input
            label="End Time *"
            type="time"
            {...register('endTime')}
            error={errors.endTime?.message}
          />
        </div>
      </div>

      {/* Status (edit only) */}
      {isEditing && (
        <div className="space-y-3">
          <h4 className="text-sm font-display font-medium text-text-dim uppercase tracking-wider">
            Status
          </h4>
          <select
            {...register('status')}
            className="h-10 w-full rounded-xl px-3.5 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none"
          >
            {VISIT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-3">
        <h4 className="text-sm font-display font-medium text-text-dim uppercase tracking-wider">
          Notes
        </h4>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none resize-none placeholder:text-text-faint"
          placeholder="Internal notes for coaching staff"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-edge-default">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {isEditing ? 'Update Visit' : 'Create Visit'}
        </Button>
      </div>
    </form>
  );
}
