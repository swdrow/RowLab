import { useTheme, type Theme } from '@v2/hooks/useTheme';

/**
 * ThemeToggle Component
 *
 * Standalone theme selector dropdown that uses the useTheme hook.
 * Displays current theme with "(System)" indicator when using OS preference.
 *
 * Features:
 * - Three theme options: Dark, Light, Field
 * - "Use System" option to clear manual override
 * - Shows "(System)" when no manual preference is set
 * - Matches V2 design token styling
 */
export function ThemeToggle() {
  const { theme, setTheme, isSystemDefault, clearThemePreference } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === 'system') {
      clearThemePreference();
    } else {
      setTheme(value as Theme);
    }
  };

  // Display value: show 'system' when using system default, otherwise show actual theme
  const displayValue = isSystemDefault ? 'system' : theme;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-txt-muted">Theme:</span>
      <select
        value={displayValue}
        onChange={handleChange}
        className="text-sm bg-bg-surface border border-bdr-default rounded px-2 py-1 text-txt-primary"
        aria-label="Select theme"
      >
        <option value="system">
          Use System {isSystemDefault ? '(Current)' : ''}
        </option>
        <option value="dark">Dark {isSystemDefault ? '' : theme === 'dark' ? '(Current)' : ''}</option>
        <option value="light">Light {isSystemDefault ? '' : theme === 'light' ? '(Current)' : ''}</option>
        <option value="field">Field {isSystemDefault ? '' : theme === 'field' ? '(Current)' : ''}</option>
      </select>
    </div>
  );
}
