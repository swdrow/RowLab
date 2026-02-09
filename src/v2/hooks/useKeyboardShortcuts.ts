import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import { SHORTCUTS } from '../lib/keyboardShortcuts';

interface UseKeyboardShortcutsOptions {
  onOpenPalette?: () => void;
  onOpenShortcutsModal?: () => void;
}

/**
 * Global keyboard shortcuts hook
 * Binds all application shortcuts and handles their actions
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const navigate = useNavigate();

  // Command Palette (Cmd+K)
  useHotkeys(
    'mod+k',
    (e) => {
      e.preventDefault();
      options.onOpenPalette?.();
    },
    { enableOnFormTags: false }
  );

  // Show shortcuts modal (?)
  useHotkeys(
    'shift+/',
    (e) => {
      // Only trigger if not in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
      options.onOpenShortcutsModal?.();
    },
    { enableOnFormTags: false }
  );

  // Action shortcuts
  useHotkeys(
    'mod+n',
    (e) => {
      e.preventDefault();
      navigate('/app/athletes?action=create');
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    'mod+e',
    (e) => {
      e.preventDefault();
      navigate('/app/erg-tests?action=create');
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    'mod+p',
    (e) => {
      e.preventDefault();
      navigate('/app/training/sessions?action=create');
    },
    { enableOnFormTags: false }
  );

  // Navigation shortcuts
  useHotkeys(
    'mod+shift+d',
    (e) => {
      e.preventDefault();
      navigate('/app');
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    'mod+shift+a',
    (e) => {
      e.preventDefault();
      navigate('/app/athletes');
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    'mod+shift+e',
    (e) => {
      e.preventDefault();
      navigate('/app/erg-tests');
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    'mod+shift+l',
    (e) => {
      e.preventDefault();
      navigate('/app/coach/lineup-builder');
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    'mod+shift+t',
    (e) => {
      e.preventDefault();
      navigate('/app/training');
    },
    { enableOnFormTags: false }
  );
}
