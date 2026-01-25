import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical, Shield, User, Users } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChecklistTemplate, ChecklistTemplateFormData, ChecklistRole } from '../../types/regatta';

const itemSchema = z.object({
  text: z.string().min(1, 'Item text is required'),
  role: z.enum(['coach', 'coxswain', 'anyone']),
  sortOrder: z.number(),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  isDefault: z.boolean().default(false),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type FormValues = z.infer<typeof templateSchema>;

type ChecklistTemplateFormProps = {
  template?: ChecklistTemplate;
  onSubmit: (data: ChecklistTemplateFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const ROLE_OPTIONS: Array<{ value: ChecklistRole; label: string; icon: typeof User }> = [
  { value: 'coach', label: 'Coach', icon: Shield },
  { value: 'coxswain', label: 'Coxswain', icon: User },
  { value: 'anyone', label: 'Anyone', icon: Users },
];

const SUGGESTED_ITEMS: Array<{ text: string; role: ChecklistRole }> = [
  { text: 'Confirm lineup assignments with athletes', role: 'coach' },
  { text: 'Check weather conditions and adjust race plan', role: 'coach' },
  { text: 'Brief coxswains on race strategy', role: 'coach' },
  { text: 'Ensure all athletes checked in', role: 'coach' },
  { text: 'Confirm oars and riggers are correct', role: 'coxswain' },
  { text: 'Check cox box battery and volume', role: 'coxswain' },
  { text: 'Review race plan and landmarks', role: 'coxswain' },
  { text: 'Collect race cards from officials', role: 'coxswain' },
  { text: 'Oars taken down to dock', role: 'anyone' },
  { text: 'Shell launched and at dock', role: 'anyone' },
  { text: 'All athletes have water bottles', role: 'anyone' },
  { text: 'Team uniforms checked (matching unis)', role: 'anyone' },
];

export function ChecklistTemplateForm({
  template,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ChecklistTemplateFormProps) {
  const isEditing = !!template;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    // @ts-expect-error - Zod resolver type mismatch with optional defaults
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      isDefault: template?.isDefault || false,
      items: template?.items?.map((item, index) => ({
        text: item.text,
        role: item.role,
        sortOrder: index,
      })) || [{ text: '', role: 'anyone' as ChecklistRole, sortOrder: 0 }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  const addItem = () => {
    append({ text: '', role: 'anyone' as ChecklistRole, sortOrder: fields.length });
  };

  const addSuggestedItem = (suggestion: { text: string; role: ChecklistRole }) => {
    append({ ...suggestion, sortOrder: fields.length });
  };

  const onFormSubmit = (data: FormValues) => {
    const formData: ChecklistTemplateFormData = {
      name: data.name,
      isDefault: data.isDefault,
      items: data.items.map((item, index) => ({
        text: item.text,
        role: item.role,
        sortOrder: index,
      })),
    };
    onSubmit(formData);
  };

  return (
    // @ts-expect-error - FormValues type inference issue with handleSubmit
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Template name */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">
          Template Name *
        </label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-lg
                   text-txt-primary placeholder:text-txt-tertiary
                   focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="e.g., Home Regatta, Away Regatta"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Default template toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('isDefault')}
          className="w-4 h-4 rounded border-bdr-default text-accent-primary focus:ring-accent-primary"
        />
        <span className="text-sm text-txt-primary">Set as default template</span>
      </label>

      {/* Items */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-2">
          Checklist Items *
        </label>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <SortableItem
                  key={field.id}
                  id={field.id}
                  index={index}
                  control={control}
                  register={register}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                  error={errors.items?.[index]?.text?.message}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add item button */}
        <button
          type="button"
          onClick={addItem}
          className="mt-3 w-full py-2 border-2 border-dashed border-bdr-default rounded-lg
                   text-sm text-txt-secondary hover:border-bdr-hover hover:text-txt-primary
                   transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>

        {errors.items?.root && (
          <p className="mt-1 text-sm text-red-500">{errors.items.root.message}</p>
        )}
      </div>

      {/* Suggested items */}
      <div>
        <p className="text-sm font-medium text-txt-secondary mb-2">Quick Add Suggestions</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_ITEMS.filter(s => !fields.some(f => (f as any).text === s.text))
            .slice(0, 6)
            .map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addSuggestedItem(suggestion)}
                className="px-2 py-1 text-xs rounded-full bg-surface-elevated text-txt-secondary
                         hover:bg-surface-hover transition-colors"
              >
                + {suggestion.text.slice(0, 30)}...
              </button>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-bdr-default">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-txt-secondary
                   bg-surface-elevated rounded-lg hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white
                   bg-accent-primary rounded-lg hover:bg-accent-primary-hover
                   disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}

// Sortable item component
function SortableItem({
  id,
  index,
  control,
  register,
  onRemove,
  canRemove,
  error,
}: {
  id: string;
  index: number;
  control: any;
  register: any;
  onRemove: () => void;
  canRemove: boolean;
  error?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 bg-surface-elevated rounded-lg border border-bdr-default"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="flex-shrink-0 p-1 cursor-grab text-txt-tertiary hover:text-txt-secondary"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 space-y-2">
        {/* Item text */}
        <input
          {...register(`items.${index}.text`)}
          className="w-full px-3 py-1.5 bg-surface-default border border-bdr-default rounded
                   text-sm text-txt-primary placeholder:text-txt-tertiary
                   focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="Checklist item..."
        />
        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Role selector */}
        <Controller
          name={`items.${index}.role`}
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              {ROLE_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      field.value === option.value
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-default text-txt-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 p-1 text-txt-tertiary hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
