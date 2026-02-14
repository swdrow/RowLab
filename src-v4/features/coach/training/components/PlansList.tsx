/**
 * PlansList -- Training plan cards with create form and empty state.
 *
 * Displays plan name, description, phase badge, and workout count.
 * Inline create form for new plans. Click to select/expand.
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, FileText, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { plansOptions, createPlan, trainingKeys } from '../api';
import type { TrainingPlan, TrainingPhase, CreateTrainingPlanInput } from '../types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { slideUp, listContainerVariants, listItemVariants } from '@/lib/animations';

// ---------------------------------------------------------------------------
// Phase badge colors
// ---------------------------------------------------------------------------

const PHASE_COLORS: Record<TrainingPhase, { bg: string; text: string }> = {
  Base: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
  Build: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  Peak: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
  Taper: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  Recovery: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};

function PhaseBadge({ phase }: { phase: TrainingPhase }) {
  const colors = PHASE_COLORS[phase];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text}`}
    >
      {phase}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlansListProps {
  teamId: string;
  readOnly: boolean;
  onSelectPlan?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// PlansList
// ---------------------------------------------------------------------------

export function PlansList({ teamId, readOnly, onSelectPlan }: PlansListProps) {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useQuery(plansOptions());
  const [showForm, setShowForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Separate plans and templates
  const { activePlans, templates } = useMemo(() => {
    if (!plans) return { activePlans: [], templates: [] };
    return {
      activePlans: plans.filter((p) => !p.isTemplate),
      templates: plans.filter((p) => p.isTemplate),
    };
  }, [plans]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedPlanId((prev) => (prev === id ? null : id));
      onSelectPlan?.(id);
    },
    [onSelectPlan]
  );

  if (isLoading) {
    return <PlansListSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <Layers className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold text-ink-primary">{activePlans.length}</span>
          active plans
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <FileText className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold text-ink-primary">{templates.length}</span>
          templates
        </span>
      </div>

      {/* Create button */}
      {!readOnly && (
        <Button variant="primary" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'New Plan'}
        </Button>
      )}

      {/* Inline create form */}
      <AnimatePresence>
        {showForm && !readOnly && (
          <motion.div {...slideUp}>
            <CreatePlanForm
              onCreated={() => {
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: trainingKeys.plans() });
              }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans list */}
      {activePlans.length === 0 && templates.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No training plans"
          description="Create your first training plan to start scheduling workouts for your team."
          action={
            !readOnly ? { label: 'Create Plan', onClick: () => setShowForm(true) } : undefined
          }
        />
      ) : (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {activePlans.map((plan) => (
            <motion.div key={plan.id} variants={listItemVariants}>
              <PlanCard
                plan={plan}
                isSelected={selectedPlanId === plan.id}
                onSelect={handleSelect}
              />
            </motion.div>
          ))}

          {templates.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ink-border/40 to-ink-border/40" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                  TEMPLATES
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-ink-border/40 to-ink-border/40" />
              </div>
              {templates.map((plan) => (
                <motion.div key={plan.id} variants={listItemVariants}>
                  <PlanCard
                    plan={plan}
                    isSelected={selectedPlanId === plan.id}
                    onSelect={handleSelect}
                  />
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanCard
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: TrainingPlan;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const workoutCount = plan.workouts?.length ?? plan._count?.assignments ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`w-full text-left rounded-xl p-4 transition-all ${
        isSelected
          ? 'bg-ink-raised border border-accent-copper/30 shadow-sm'
          : 'bg-ink-raised/60 border border-white/[0.04] hover:bg-ink-raised hover:border-white/[0.08]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-ink-primary truncate">{plan.name}</h3>
            {plan.phase && <PhaseBadge phase={plan.phase} />}
            {plan.isTemplate && (
              <span className="inline-flex items-center rounded-md bg-ink-well/50 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted uppercase tracking-wider">
                Template
              </span>
            )}
          </div>
          {plan.description && (
            <p className="text-xs text-ink-secondary line-clamp-2 mb-1.5">{plan.description}</p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="font-mono">
              {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
            </span>
            {plan.startDate && (
              <span>
                Starts{' '}
                {new Date(plan.startDate + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${
            isSelected ? 'rotate-90 text-accent-copper' : ''
          }`}
        />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Create plan form
// ---------------------------------------------------------------------------

const PHASES: TrainingPhase[] = ['Base', 'Build', 'Peak', 'Taper', 'Recovery'];

function CreatePlanForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<TrainingPhase | ''>('');
  const [isTemplate, setIsTemplate] = useState(false);

  const mutation = useMutation({
    mutationFn: (input: CreateTrainingPlanInput) => createPlan(input),
    onSuccess: () => onCreated(),
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      mutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        phase: phase || undefined,
        isTemplate,
      });
    },
    [name, description, phase, isTemplate, mutation]
  );

  return (
    <GlassCard padding="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-primary">New Training Plan</h3>

        <input
          type="text"
          placeholder="Plan name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          className="w-full rounded-lg border border-white/[0.06] bg-ink-well/50 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted transition-colors focus:border-accent-copper/50 focus:outline-none"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-ink-well/50 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted transition-colors focus:border-accent-copper/50 focus:outline-none resize-none"
        />

        <div className="flex items-center gap-3">
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as TrainingPhase | '')}
            className="rounded-lg border border-white/[0.06] bg-ink-well/50 px-3 py-2 text-sm text-ink-primary transition-colors focus:border-accent-copper/50 focus:outline-none"
          >
            <option value="">No phase</option>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-ink-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              className="rounded border-ink-border text-accent-copper focus:ring-accent-copper/50"
            />
            Template
          </label>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" variant="primary" size="sm" loading={mutation.isPending}>
            <Plus className="h-3.5 w-3.5" />
            Create Plan
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-xs text-rose-400">Failed to create plan. Please try again.</p>
        )}
      </form>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PlansListSkeleton() {
  return (
    <SkeletonGroup className="space-y-2">
      <div className="flex gap-4 mb-4">
        <Skeleton width="6rem" height="1rem" />
        <Skeleton width="5rem" height="1rem" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-ink-raised/60 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton width="40%" height="1rem" />
            <Skeleton width="3rem" height="1.25rem" rounded="md" />
          </div>
          <Skeleton width="70%" height="0.75rem" />
          <Skeleton width="5rem" height="0.625rem" />
        </div>
      ))}
    </SkeletonGroup>
  );
}
