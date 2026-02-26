/**
 * User-pinnable nav favorites stored in localStorage.
 * Maximum 5 favorites. Persists across sessions.
 */
import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'oarbit:nav-favorites';
const MAX_FAVORITES = 5;

// Listeners for external store subscription
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function getServerSnapshot(): string[] {
  return [];
}

// Stable reference for empty arrays to avoid re-renders
let cachedSnapshot: string[] = [];
let cachedRaw: string | null = null;

function getStableSnapshot(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = getSnapshot();
  }
  return cachedSnapshot;
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getStableSnapshot, getServerSnapshot);

  const toggleFavorite = useCallback((id: string) => {
    const current = getSnapshot();
    let next: string[];

    if (current.includes(id)) {
      next = current.filter((fav) => fav !== id);
    } else {
      if (current.length >= MAX_FAVORITES) return; // silently ignore if at limit
      next = [...current, id];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Reset cache so getStableSnapshot picks up the change
    cachedRaw = null;
    notifyListeners();
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
