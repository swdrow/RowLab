/**
 * PlansList -- Training plan cards with create form and empty state.
 *
 * Displays plan name, description, phase badge, and workout count.
 * Inline create form for new plans. Click to select/expand.
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { plansOptions, createPlan, trainingKeys } from '../api';
import type { TrainingPlan, TrainingPhase, CreateTrainingPlanInput } from '../types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { slideUp } from '@/lib/animations';
import {
  IconChevronRight,
  IconClipboardList,
  IconFileText,
  IconLayers,
  IconPlus,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Phase badge colors
// ---------------------------------------------------------------------------

const PHASE_COLORS: Record<TrainingPhase, { bg: string; text: string }> = {
  Base: { bg: 'bg-accent-teal-primary/15', text: 'text-accent-teal-primary' },
  Build: { bg: 'bg-data-warning/15', text: 'text-data-warning' },
  Peak: { bg: 'bg-data-poor/15', text: 'text-data-poor' },
  Taper: { bg: 'bg-accent-teal-primary/15', text: 'text-accent-teal-primary' },
  Recovery: { bg: 'bg-data-excellent/15', text: 'text-data-excellent' },
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

export function PlansList({ teamId: _teamId, readOnly, onSelectPlan }: PlansListProps) {
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
        <span className="flex items-center gap-1.5 text-xs text-text-dim">
          <IconLayers className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold text-text-bright">{activePlans.length}</span>
          active plans
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-dim">
          <IconFileText className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold text-text-bright">{templates.length}</span>
          templates
        </span>
      </div>

      {/* Create button */}
      {!readOnly && (
        <Button variant="primary" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          <IconPlus className="h-4 w-4" />
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
          icon={IconClipboardList}
          title="No training plans"
          description="Create your first training plan to start scheduling workouts for your team."
          action={
            !readOnly ? { label: 'Create Plan', onClick: () => setShowForm(true) } : undefined
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-2"
        >
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              onSelect={handleSelect}
            />
          ))}

          {templates.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-edge-default/40 to-edge-default/40" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-faint">
                  TEMPLATES
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-edge-default/40 to-edge-default/40" />
              </div>
              {templates.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlanId === plan.id}
                  onSelect={handleSelect}
                />
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
          ? 'bg-void-raised border border-accent-sand/30 shadow-sm'
          : 'bg-void-raised/60 border border-edge-default/40 hover:bg-void-raised hover:border-edge-default'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-display font-semibold text-text-bright truncate">
              {plan.name}
            </h3>
            {plan.phase && <PhaseBadge phase={plan.phase} />}
            {plan.isTemplate && (
              <span className="inline-flex items-center rounded-md bg-void-deep/50 px-1.5 py-0.5 text-[10px] font-medium text-text-faint uppercase tracking-wider">
                Template
              </span>
            )}
          </div>
          {plan.description && (
            <p className="text-xs text-text-dim line-clamp-2 mb-1.5">{plan.description}</p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-text-faint">
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
        <IconChevronRight
          className={`h-4 w-4 shrink-0 text-text-faint transition-transform ${
            isSelected ? 'rotate-90 text-accent-sand' : ''
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
    <Card padding="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-display font-semibold text-text-bright">New Training Plan</h3>

        <input
          type="text"
          placeholder="Plan name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          className="w-full rounded-lg border border-edge-default bg-void-deep/50 px-3 py-2 text-sm text-text-bright placeholder:text-text-faint transition-colors focus:border-accent-teal/50 focus:outline-none"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-edge-default bg-void-deep/50 px-3 py-2 text-sm text-text-bright placeholder:text-text-faint transition-colors focus:border-accent-teal/50 focus:outline-none resize-none"
        />

        <div className="flex items-center gap-3">
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as TrainingPhase | '')}
            className="rounded-lg border border-edge-default bg-void-deep/50 px-3 py-2 text-sm text-text-bright transition-colors focus:border-accent-teal/50 focus:outline-none"
          >
            <option value="">No phase</option>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-text-dim cursor-pointer">
            <input
              type="checkbox"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              className="rounded border-edge-default text-accent-teal focus:ring-accent/50"
            />
            Template
          </label>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" variant="primary" size="sm" loading={mutation.isPending}>
            <IconPlus className="h-3.5 w-3.5" />
            Create Plan
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-xs text-accent-coral">Failed to create plan. Please try again.</p>
        )}
      </form>
    </Card>
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
        <div key={i} className="rounded-xl bg-void-raised/60 p-4 space-y-2">
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
