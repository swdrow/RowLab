import { Outlet } from 'react-router-dom';
import { useTheme } from '@v2/hooks/useTheme';
import { AuthStoreContext, SettingsStoreContext } from '@v2/hooks/useSharedStores';
import { ThemeToggle } from '@v2/components/shell/ThemeToggle';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import '@v2/styles/v2.css';

export default function V2Layout() {
  const { theme } = useTheme();

  return (
    <AuthStoreContext.Provider value={useAuthStore}>
      <SettingsStoreContext.Provider value={useSettingsStore}>
        <div
          className="v2 min-h-screen bg-bg-surface"
          data-theme={theme === 'dark' ? undefined : theme}
        >
          <header className="bg-bg-elevated border-b border-border-default px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-display text-text-primary">
                  RowLab V2
                </h1>
                <span className="px-2 py-0.5 text-xs font-medium bg-action-primary/20 text-action-primary rounded">
                  BETA
                </span>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <main className="min-h-[calc(100vh-57px)]">
            <Outlet />
          </main>
        </div>
      </SettingsStoreContext.Provider>
    </AuthStoreContext.Provider>
  );
}
