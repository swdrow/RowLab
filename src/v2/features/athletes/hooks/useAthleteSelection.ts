import { useCallback, useMemo, useRef, useState } from 'react';
import type { Athlete } from '../../../types/athletes';

interface AthleteSelectionReturn {
  selectedIds: Set<string>;
  selectedAthletes: Athlete[];
  selectedCount: number;
  toggleSelection: (id: string) => void;
  selectRange: (index: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

/**
 * Multi-select state management for athlete lists.
 *
 * Supports:
 * - Single toggle (click)
 * - Range select (Shift+click from lastSelectedIndex)
 * - Select all / clear all
 */
export function useAthleteSelection(athletes: Athlete[]): AthleteSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedIndexRef = useRef<number | null>(null);

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      // Update last selected index
      const idx = athletes.findIndex((a) => a.id === id);
      if (idx >= 0) {
        lastSelectedIndexRef.current = idx;
      }
    },
    [athletes]
  );

  const selectRange = useCallback(
    (index: number) => {
      const lastIdx = lastSelectedIndexRef.current;
      if (lastIdx === null) {
        // No previous selection, just select this one
        const athlete = athletes[index];
        if (athlete) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.add(athlete.id);
            return next;
          });
          lastSelectedIndexRef.current = index;
        }
        return;
      }

      const start = Math.min(lastIdx, index);
      const end = Math.max(lastIdx, index);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          const athlete = athletes[i];
          if (athlete) {
            next.add(athlete.id);
          }
        }
        return next;
      });
      lastSelectedIndexRef.current = index;
    },
    [athletes]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(athletes.map((a) => a.id)));
    lastSelectedIndexRef.current = null;
  }, [athletes]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedIndexRef.current = null;
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const selectedAthletes = useMemo(
    () => athletes.filter((a) => selectedIds.has(a.id)),
    [athletes, selectedIds]
  );

  return {
    selectedIds,
    selectedAthletes,
    selectedCount: selectedIds.size,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    isSelected,
  };
}
