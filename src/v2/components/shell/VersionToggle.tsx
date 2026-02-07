import { useNavigate } from 'react-router-dom';
import { useUserPreferenceStore } from '@v2/stores/userPreferenceStore';

interface VersionToggleProps {
  /** Which version this toggle is rendered in */
  currentVersion: 'v1' | 'v2';
}

/**
 * @deprecated Phase 26 consolidated all routes under /app/*.
 * V1/V2 version switching will be removed in Phase 36 (V1/V2 Cleanup).
 *
 * Toggle button to switch between V1 (legacy) and V2 versions.
 * When clicked, updates preference and redirects to the other version.
 */
export function VersionToggle({ currentVersion }: VersionToggleProps) {
  const setLegacyMode = useUserPreferenceStore((state) => state.setLegacyMode);
  const navigate = useNavigate();

  const handleToggle = () => {
    if (currentVersion === 'v2') {
      // Currently on V2, switch to legacy
      setLegacyMode(true);
      navigate('/legacy', { replace: true });
    } else {
      // Currently on V1 legacy, switch to V2
      setLegacyMode(false);
      navigate('/app', { replace: true });
    }
  };

  if (currentVersion === 'v2') {
    return (
      <button
        onClick={handleToggle}
        className="px-3 py-1.5 text-sm text-txt-secondary hover:text-txt-primary hover:bg-bg-surface-elevated rounded-md transition-colors"
        title="Switch to legacy version"
      >
        Use Legacy
      </button>
    );
  }

  // V1 version - use V1 styling (no V2 tokens)
  return (
    <button
      onClick={handleToggle}
      className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-card rounded-md transition-colors"
      title="Try the new RowLab"
    >
      Try New Version
    </button>
  );
}
