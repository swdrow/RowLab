import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, User, Users, Shield, Loader2 } from 'lucide-react';
import type { RaceChecklistItem } from '../../types/regatta';
import { useRaceChecklist, useToggleChecklistItem, useChecklistTemplates, useCreateRaceChecklist } from '../../hooks/useChecklists';

type UserRole = 'coach' | 'coxswain' | 'athlete';

type PreRaceChecklistProps = {
  raceId: string;
  raceName: string;
  userRole: UserRole;
  userId?: string;
  userName?: string;
};

export function PreRaceChecklist({
  raceId,
  raceName,
  userRole,
}: PreRaceChecklistProps) {
  const { data: checklist, isLoading } = useRaceChecklist(raceId);
  const { data: templates } = useChecklistTemplates();
  const toggleItem = useToggleChecklistItem();
  const createChecklist = useCreateRaceChecklist();


  // Calculate progress
  const progress = useMemo(() => {
    if (!checklist?.items) return { total: 0, completed: 0, percentage: 0 };
    const total = checklist.items.length;
    const completed = checklist.items.filter(i => i.completed).length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [checklist]);

  // Handle toggle
  const handleToggle = (item: RaceChecklistItem) => {
    // Can only toggle if:
    // 1. Item is for your role or "anyone"
    // 2. Coach can toggle any item
    const canToggle =
      userRole === 'coach' ||
      item.role === 'anyone' ||
      item.role === userRole;

    if (!canToggle) return;

    toggleItem.mutate({
      itemId: item.id,
      completed: !item.completed,
      raceId,
    });
  };

  // Initialize checklist from template
  const handleInitialize = (templateId: string) => {
    createChecklist.mutate({ raceId, templateId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-txt-tertiary" />
      </div>
    );
  }

  // No checklist yet - show template selection
  if (!checklist) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <CheckCircle2 className="w-10 h-10 mx-auto text-txt-tertiary opacity-40" />
          <p className="mt-2 text-txt-secondary">No checklist for this race yet</p>
          {userRole === 'coach' && templates && templates.length > 0 && (
            <p className="text-sm text-txt-tertiary">Select a template to get started</p>
          )}
        </div>

        {userRole === 'coach' && templates && templates.length > 0 && (
          <div className="space-y-2">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleInitialize(template.id)}
                disabled={createChecklist.isPending}
                className="w-full p-4 text-left rounded-lg border border-bdr-default
                         hover:border-accent-primary hover:bg-accent-primary/5
                         transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-txt-primary">{template.name}</p>
                <p className="text-sm text-txt-secondary mt-1">
                  {template.items?.length || 0} items
                  {template.isDefault && ' - Default template'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-txt-primary">Pre-Race Checklist</h4>
          <p className="text-sm text-txt-secondary">{raceName}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-accent-primary">{progress.percentage}%</p>
          <p className="text-xs text-txt-tertiary">{progress.completed}/{progress.total} complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Items grouped by role */}
      <div className="space-y-4">
        {/* Coach items (only visible to coach) */}
        {userRole === 'coach' && (
          <ChecklistSection
            title="Coach Tasks"
            icon={Shield}
            items={checklist.items.filter(i => i.role === 'coach')}
            onToggle={handleToggle}
            canToggle={true}
            isPending={toggleItem.isPending}
          />
        )}

        {/* Coxswain items */}
        {(userRole === 'coach' || userRole === 'coxswain') && (
          <ChecklistSection
            title="Coxswain Tasks"
            icon={User}
            items={checklist.items.filter(i => i.role === 'coxswain')}
            onToggle={handleToggle}
            canToggle={userRole === 'coach' || userRole === 'coxswain'}
            isPending={toggleItem.isPending}
          />
        )}

        {/* Anyone items */}
        <ChecklistSection
          title="Team Tasks"
          icon={Users}
          items={checklist.items.filter(i => i.role === 'anyone')}
          onToggle={handleToggle}
          canToggle={true}
          isPending={toggleItem.isPending}
        />
      </div>
    </div>
  );
}

// Section component
function ChecklistSection({
  title,
  icon: Icon,
  items,
  onToggle,
  canToggle,
  isPending,
}: {
  title: string;
  icon: typeof User;
  items: RaceChecklistItem[];
  onToggle: (item: RaceChecklistItem) => void;
  canToggle: boolean;
  isPending: boolean;
}) {
  if (items.length === 0) return null;

  const completedCount = items.filter(i => i.completed).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-txt-tertiary" />
        <span className="text-sm font-medium text-txt-secondary">{title}</span>
        <span className="text-xs text-txt-tertiary">
          {completedCount}/{items.length}
        </span>
      </div>

      <div className="space-y-1">
        <AnimatePresence>
          {items
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={() => onToggle(item)}
                canToggle={canToggle}
                isPending={isPending}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Individual item row
function ChecklistItemRow({
  item,
  onToggle,
  canToggle,
  isPending,
}: {
  item: RaceChecklistItem;
  onToggle: () => void;
  canToggle: boolean;
  isPending: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        item.completed
          ? 'bg-green-500/5'
          : 'bg-surface-elevated hover:bg-surface-hover'
      }`}
    >
      <button
        onClick={onToggle}
        disabled={!canToggle || isPending}
        className={`flex-shrink-0 mt-0.5 ${
          canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
        }`}
      >
        {item.completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-txt-tertiary hover:text-accent-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            item.completed ? 'text-txt-secondary line-through' : 'text-txt-primary'
          }`}
        >
          {item.text}
        </p>

        {item.completed && item.completedBy && (
          <p className="text-xs text-txt-tertiary mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.completedAt
              ? formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })
              : 'Just now'}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Progress summary component for dashboard
export function ChecklistProgress({
  raceId,
  raceName,
}: {
  raceId: string;
  raceName: string;
}) {
  const { data: checklist } = useRaceChecklist(raceId);

  if (!checklist) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated">
        <div className="w-10 h-10 rounded-full bg-surface-default flex items-center justify-center">
          <Circle className="w-5 h-5 text-txt-tertiary" />
        </div>
        <div>
          <p className="text-sm font-medium text-txt-primary truncate">{raceName}</p>
          <p className="text-xs text-txt-tertiary">No checklist</p>
        </div>
      </div>
    );
  }

  const total = checklist.items.length;
  const completed = checklist.items.filter(i => i.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated">
      <div
        className={`relative w-10 h-10 rounded-full flex items-center justify-center ${
          percentage === 100 ? 'bg-green-500/10' : 'bg-surface-default'
        }`}
      >
        {percentage === 100 ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <span className="text-sm font-bold text-accent-primary">{percentage}%</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-txt-primary truncate">{raceName}</p>
        <p className="text-xs text-txt-tertiary">{completed}/{total} items</p>
      </div>
    </div>
  );
}
