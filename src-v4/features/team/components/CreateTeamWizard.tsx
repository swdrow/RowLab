/**
 * 3-step Create Team wizard.
 *
 * Step 1: Team info (name, sport, description)
 * Step 2: Configure (summary + isPublic toggle)
 * Step 3: Invite (generate invite codes, copy links, skip/finish)
 *
 * Uses react-hook-form + zod for validation. Calls createTeam API
 * directly (not the hook) to control post-creation flow within the
 * wizard instead of auto-navigating.
 */
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { IconArrowLeft, IconArrowRight } from '@/components/icons';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { createTeam } from '../api';
import type { TeamDetail, CreateTeamInput } from '../types';
import { InviteCodeGenerator } from './InviteCodeGenerator';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const teamInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be under 100 characters'),
  sport: z.string().optional(),
  description: z
    .string()
    .max(500, 'Description must be under 500 characters')
    .optional()
    .or(z.literal('')),
});

type TeamInfoData = z.infer<typeof teamInfoSchema>;

// ---------------------------------------------------------------------------
// Sport options
// ---------------------------------------------------------------------------

const SPORT_OPTIONS = [
  { value: '', label: 'Select a sport (optional)' },
  { value: 'Rowing', label: 'Rowing' },
  { value: 'Cycling', label: 'Cycling' },
  { value: 'Running', label: 'Running' },
  { value: 'Swimming', label: 'Swimming' },
  { value: 'Other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: 'Team Info' },
    { num: 2, label: 'Configure' },
    { num: 3, label: 'Invite' },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`
                flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200
                ${
                  step.num === current
                    ? 'bg-accent-teal text-void-deep'
                    : step.num < current
                      ? 'bg-accent-teal/20 text-accent-teal'
                      : 'bg-void-raised text-text-faint'
                }
              `}
            >
              {step.num < current ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                step.num === current ? 'text-text-bright' : 'text-text-faint'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 transition-colors duration-200 ${
                step.num < current ? 'bg-accent-teal/40' : 'bg-edge-default'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard component
// ---------------------------------------------------------------------------

export function CreateTeamWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [teamData, setTeamData] = useState<Partial<CreateTeamInput>>({});
  const [isPublic, setIsPublic] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<TeamDetail | null>(null);
  const { refreshAuth, switchTeam } = useAuth();
  const navigate = useNavigate();

  const goToStep = useCallback(
    (target: 1 | 2 | 3) => {
      setDirection(target > step ? 1 : -1);
      setStep(target);
    },
    [step]
  );

  // Create team mutation (no auto-navigate -- wizard controls flow)
  const createMutation = useMutation<TeamDetail, Error, CreateTeamInput>({
    mutationFn: (input) => createTeam(input),
    onSuccess: async (team) => {
      setCreatedTeam(team);
      await refreshAuth();
      // Switch to the newly created team
      await switchTeam(team.id);
      goToStep(3);
    },
    onError: (error) => {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message = axiosError?.response?.data?.error?.message || 'Failed to create team.';
      toast.error(message);
    },
  });

  const handleStep1Complete = useCallback(
    (data: TeamInfoData) => {
      setTeamData(data);
      goToStep(2);
    },
    [goToStep]
  );

  const handleCreateTeam = useCallback(() => {
    const input: CreateTeamInput = {
      name: teamData.name!,
      description: teamData.description || undefined,
      sport: teamData.sport || undefined,
      isPublic,
    };
    createMutation.mutate(input);
  }, [teamData, isPublic, createMutation]);

  const handleFinish = useCallback(() => {
    if (createdTeam) {
      toast.success(`Team "${createdTeam.name}" is ready!`);
      void navigate({ to: '/' as string });
    }
  }, [createdTeam, navigate]);

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void-deep p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-bright font-display">
          oar<span className="text-accent-teal">bit</span>
        </h1>
        <p className="mt-1 text-sm text-text-dim">Create your team</p>
      </div>

      <div className="w-full max-w-xl">
        <StepIndicator current={step} />

        <Card padding="lg" className="rounded-2xl overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.6 }}
              >
                <Step1TeamInfo
                  defaultValues={teamData as TeamInfoData}
                  onNext={handleStep1Complete}
                  onCancel={() => void navigate({ to: '/' as string })}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.6 }}
              >
                <Step2Configure
                  teamData={teamData}
                  isPublic={isPublic}
                  onTogglePublic={setIsPublic}
                  onBack={() => goToStep(1)}
                  onCreate={handleCreateTeam}
                  isCreating={createMutation.isPending}
                />
              </motion.div>
            )}

            {step === 3 && createdTeam && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.6 }}
              >
                <Step3Invite team={createdTeam} onFinish={handleFinish} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Team Info
// ---------------------------------------------------------------------------

function Step1TeamInfo({
  defaultValues,
  onNext,
  onCancel,
}: {
  defaultValues: Partial<TeamInfoData>;
  onNext: (data: TeamInfoData) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamInfoData>({
    resolver: zodResolver(teamInfoSchema),
    defaultValues: {
      name: defaultValues.name ?? '',
      sport: defaultValues.sport ?? '',
      description: defaultValues.description ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5" noValidate>
      <div>
        <h2 className="text-lg font-display font-semibold text-text-bright">Team Information</h2>
        <p className="mt-1 text-sm text-text-dim">
          Give your team a name and pick a sport to get started.
        </p>
      </div>

      <Input
        label="Team name"
        type="text"
        placeholder="e.g. Riverside Rowing Club"
        autoFocus
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Sport dropdown */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sport" className="text-sm font-medium text-text-default">
          Sport
        </label>
        <select
          id="sport"
          className="h-10 w-full rounded-xl px-3.5 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 appearance-none cursor-pointer"
          {...register('sport')}
        >
          {SPORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description textarea */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-text-default">
          Description <span className="text-text-faint font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-void-raised text-text-bright placeholder:text-text-faint border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 resize-none"
          placeholder="Describe your team..."
          maxLength={500}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-data-poor">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-text-dim hover:text-text-bright transition-colors"
        >
          Cancel
        </button>
        <Button type="submit" size="md">
          Next
          <IconArrowRight width={16} height={16} />
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Configure
// ---------------------------------------------------------------------------

function Step2Configure({
  teamData,
  isPublic,
  onTogglePublic,
  onBack,
  onCreate,
  isCreating,
}: {
  teamData: Partial<CreateTeamInput>;
  isPublic: boolean;
  onTogglePublic: (val: boolean) => void;
  onBack: () => void;
  onCreate: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-display font-semibold text-text-bright">Review & Configure</h2>
        <p className="mt-1 text-sm text-text-dim">Confirm your team details before creating.</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl bg-void-raised/50 border border-edge-default p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-faint">Name</span>
          <span className="text-sm font-medium text-text-bright">{teamData.name}</span>
        </div>
        {teamData.sport && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-faint">Sport</span>
            <span className="text-sm font-medium text-text-bright">{teamData.sport}</span>
          </div>
        )}
        {teamData.description && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-text-faint">Description</span>
            <span className="text-sm text-text-default">{teamData.description}</span>
          </div>
        )}
      </div>

      {/* Public toggle */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => onTogglePublic(!isPublic)}
          className={`
            relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal/60
            ${isPublic ? 'bg-accent-teal' : 'bg-edge-default'}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
              ${isPublic ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-bright">Public team</span>
          <span className="text-xs text-text-faint mt-0.5">
            {isPublic
              ? 'Anyone can discover and request to join this team.'
              : 'Only people with an invite link can join.'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="md" onClick={onBack} disabled={isCreating}>
          <IconArrowLeft width={16} height={16} />
          Back
        </Button>
        <Button size="md" onClick={onCreate} loading={isCreating}>
          {isCreating ? 'Creating...' : 'Create Team'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Invite
// ---------------------------------------------------------------------------

function Step3Invite({ team, onFinish }: { team: TeamDetail; onFinish: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-teal/10">
          <svg
            className="h-6 w-6 text-accent-teal"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-lg font-display font-semibold text-text-bright">Team created!</h2>
        <p className="mt-1 text-sm text-text-dim">
          <span className="font-medium text-text-bright">{team.name}</span> is ready. Invite your
          teammates to get started.
        </p>
      </div>

      <InviteCodeGenerator teamId={team.id} />

      <div className="flex flex-col gap-2 pt-2">
        <Button size="md" className="w-full" onClick={onFinish}>
          Go to team dashboard
        </Button>
        <button
          type="button"
          onClick={onFinish}
          className="text-sm font-medium text-text-dim hover:text-text-bright transition-colors text-center py-1"
        >
          Skip -- I&apos;ll invite later
        </button>
      </div>
    </div>
  );
}
