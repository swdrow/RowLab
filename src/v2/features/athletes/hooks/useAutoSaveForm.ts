import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useForm,
  useFormState,
  type UseFormReturn,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { toast } from 'sonner';
import { queryKeys } from '../../../lib/queryKeys';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveFormConfig<T extends FieldValues> {
  athleteId: string;
  defaultValues: T;
  onSave: (data: T) => Promise<unknown>;
  /** Fields that should save immediately (no debounce). Typically toggles and dropdowns. */
  immediateFields?: Path<T>[];
}

interface AutoSaveFormReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSaving: boolean;
  isSaved: boolean;
  saveStatus: SaveStatus;
}

/**
 * Auto-save form hook with debounced saves and optimistic rollback.
 *
 * Text inputs are debounced (1.5s trailing edge).
 * Toggles and dropdowns (immediateFields) save immediately.
 * On error: rolls back form values and shows toast.
 * On success: shows brief "Saved" indicator that resets after 1.5s.
 */
export function useAutoSaveForm<T extends FieldValues>(
  config: AutoSaveFormConfig<T>
): AutoSaveFormReturn<T> {
  const { athleteId, defaultValues, onSave, immediateFields = [] } = config;
  const queryClient = useQueryClient();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const previousValuesRef = useRef<T>(defaultValues);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const form = useForm<T>({
    defaultValues: defaultValues as never,
    mode: 'onChange',
  });

  const { dirtyFields } = useFormState({ control: form.control });

  const performSave = useCallback(
    async (data: T) => {
      setSaveStatus('saving');
      const snapshot = previousValuesRef.current;

      // Optimistic cache update
      queryClient.setQueryData(queryKeys.athletes.detail(athleteId), (old: unknown) =>
        old ? { ...(old as Record<string, unknown>), ...data } : old
      );

      try {
        await onSave(data);
        previousValuesRef.current = { ...data };
        setSaveStatus('saved');

        // Reset "saved" indicator after 1.5s
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
      } catch {
        // Roll back form to previous values
        form.reset(snapshot as never);
        // Roll back cache
        queryClient.invalidateQueries({ queryKey: queryKeys.athletes.detail(athleteId) });
        setSaveStatus('error');
        toast.error('Failed to save changes. Reverted to last saved state.');
      }
    },
    [athleteId, onSave, queryClient, form]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((data: T) => {
      performSave(data);
    }, 1500),
    [performSave]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [debouncedSave]);

  // Watch all fields and trigger save on changes
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Only save when there are dirty fields
      const hasDirty = Object.keys(dirtyFields).length > 0;
      if (!hasDirty || !name) return;

      const currentValues = values as T;

      // Check if this field should save immediately (toggles, dropdowns)
      if (immediateFields.includes(name as Path<T>)) {
        debouncedSave.cancel();
        performSave(currentValues);
      } else {
        debouncedSave(currentValues);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, dirtyFields, debouncedSave, performSave, immediateFields]);

  // Update default values when athleteId changes
  useEffect(() => {
    form.reset(defaultValues as never);
    previousValuesRef.current = defaultValues;
  }, [athleteId, defaultValues, form]);

  return {
    form,
    isSaving: saveStatus === 'saving',
    isSaved: saveStatus === 'saved',
    saveStatus,
  };
}
