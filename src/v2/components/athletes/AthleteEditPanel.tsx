import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AthleteAvatar } from './AthleteAvatar';
import type { Athlete, SidePreference } from '@v2/types/athletes';

export interface AthleteEditPanelProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Athlete> & { id: string }) => void;
  isSaving?: boolean;
}

// Validation schema
const athleteSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').nullable().or(z.literal('')),
  side: z.enum(['Port', 'Starboard', 'Both', 'Cox']).nullable(),
  canScull: z.boolean(),
  canCox: z.boolean(),
  weightKg: z.coerce
    .number()
    .positive('Weight must be positive')
    .max(300, 'Weight seems unrealistic')
    .nullable()
    .or(z.literal('')),
  heightCm: z.coerce
    .number()
    .positive('Height must be positive')
    .max(300, 'Height seems unrealistic')
    .nullable()
    .or(z.literal('')),
});

type AthleteFormData = z.infer<typeof athleteSchema>;

export function AthleteEditPanel({
  athlete,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: AthleteEditPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AthleteFormData>({
    resolver: zodResolver(athleteSchema),
  });

  // Reset form when athlete changes
  useEffect(() => {
    if (athlete) {
      reset({
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        email: athlete.email || '',
        side: athlete.side,
        canScull: athlete.canScull,
        canCox: athlete.canCox,
        weightKg: athlete.weightKg ?? '',
        heightCm: athlete.heightCm ?? '',
      } as any);
    }
  }, [athlete, reset]);

  const onSubmit = (data: AthleteFormData) => {
    if (!athlete) return;

    // Convert empty strings to null
    const payload = {
      id: athlete.id,
      ...data,
      email: data.email === '' ? null : data.email,
      weightKg: data.weightKg === '' ? null : Number(data.weightKg),
      heightCm: data.heightCm === '' ? null : Number(data.heightCm),
    };

    onSave(payload);
  };

  const handleClose = () => {
    if (!isDirty || confirm('You have unsaved changes. Are you sure you want to close?')) {
      onClose();
    }
  };

  if (!isOpen || !athlete) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-bg-surface shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-bdr-default">
          <div className="flex items-center gap-4">
            <AthleteAvatar
              firstName={athlete.firstName}
              lastName={athlete.lastName}
              size="lg"
            />
            <div>
              <h2 className="text-xl font-semibold text-txt-primary">
                Edit Athlete
              </h2>
              <p className="text-sm text-txt-tertiary">
                {athlete.firstName} {athlete.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-txt-tertiary hover:text-txt-primary transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-txt-primary mb-2">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName')}
                  className={`
                    w-full px-3 py-2 bg-bg-input border rounded-lg
                    text-txt-primary placeholder:text-txt-tertiary
                    focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
                    ${errors.firstName ? 'border-red-500' : 'border-bdr-default'}
                  `}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-txt-primary mb-2">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName')}
                  className={`
                    w-full px-3 py-2 bg-bg-input border rounded-lg
                    text-txt-primary placeholder:text-txt-tertiary
                    focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
                    ${errors.lastName ? 'border-red-500' : 'border-bdr-default'}
                  `}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-txt-primary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`
                  w-full px-3 py-2 bg-bg-input border rounded-lg
                  text-txt-primary placeholder:text-txt-tertiary
                  focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
                  ${errors.email ? 'border-red-500' : 'border-bdr-default'}
                `}
                placeholder="athlete@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Side Preference */}
            <div>
              <label htmlFor="side" className="block text-sm font-medium text-txt-primary mb-2">
                Side Preference
              </label>
              <select
                id="side"
                {...register('side')}
                className="
                  w-full px-3 py-2 bg-bg-input border border-bdr-default rounded-lg
                  text-txt-primary
                  focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
                  cursor-pointer
                "
              >
                <option value="">None</option>
                <option value="Port">Port</option>
                <option value="Starboard">Starboard</option>
                <option value="Both">Both</option>
                <option value="Cox">Cox</option>
              </select>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-txt-primary">Capabilities</p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canScull')}
                  className="
                    w-4 h-4 rounded border-bdr-default
                    text-interactive-primary
                    focus:ring-2 focus:ring-interactive-primary focus:ring-offset-0
                    cursor-pointer
                  "
                />
                <span className="text-sm text-txt-primary">Can scull</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canCox')}
                  className="
                    w-4 h-4 rounded border-bdr-default
                    text-interactive-primary
                    focus:ring-2 focus:ring-interactive-primary focus:ring-offset-0
                    cursor-pointer
                  "
                />
                <span className="text-sm text-txt-primary">Can cox</span>
              </label>
            </div>

            {/* Biometrics */}
            <div className="pt-4 border-t border-bdr-subtle">
              <p className="text-sm font-medium text-txt-primary mb-4">Biometrics</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weightKg" className="block text-sm font-medium text-txt-primary mb-2">
                    Weight (kg)
                  </label>
                  <input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    {...register('weightKg')}
                    className={`
                      w-full px-3 py-2 bg-bg-input border rounded-lg
                      text-txt-primary placeholder:text-txt-tertiary
                      focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
                      ${errors.weightKg ? 'border-red-500' : 'border-bdr-default'}
                    `}
                    placeholder="70.5"
                  />
                  {errors.weightKg && (
                    <p className="mt-1 text-xs text-red-500">{errors.weightKg.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="heightCm" className="block text-sm font-medium text-txt-primary mb-2">
                    Height (cm)
                  </label>
                  <input
                    id="heightCm"
                    type="number"
                    step="0.1"
                    {...register('heightCm')}
                    className={`
                      w-full px-3 py-2 bg-bg-input border rounded-lg
                      text-txt-primary placeholder:text-txt-tertiary
                      focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
                      ${errors.heightCm ? 'border-red-500' : 'border-bdr-default'}
                    `}
                    placeholder="175.0"
                  />
                  {errors.heightCm && (
                    <p className="mt-1 text-xs text-red-500">{errors.heightCm.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-bdr-default">
          <button
            type="button"
            onClick={handleClose}
            className="
              flex-1 px-4 py-2 text-sm font-medium
              text-txt-primary bg-bg-surface border border-bdr-default rounded-lg
              hover:bg-bg-hover transition-colors
            "
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty}
            className="
              flex-1 px-4 py-2 text-sm font-medium
              text-white bg-interactive-primary rounded-lg
              hover:bg-interactive-primary-hover
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}

export default AthleteEditPanel;
