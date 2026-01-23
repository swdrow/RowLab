import { Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useTheme } from '@v2/hooks/useTheme';
import { AuthStoreContext, SettingsStoreContext } from '@v2/hooks/useSharedStores';
import { ThemeToggle } from '@v2/components/shell/ThemeToggle';
import { queryClient } from '../queryClient';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import '@v2/styles/v2.css';

export default function V2Layout() {
  const { theme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthStoreContext.Provider value={useAuthStore}>
        <SettingsStoreContext.Provider value={useSettingsStore}>
          <div
            className="v2"
            data-theme={theme === 'dark' ? undefined : theme}
          >
            <div className="min-h-screen bg-bg-surface">
            <header className="bg-bg-surface-elevated border-b border-bdr-default px-4 py-3">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-display text-txt-primary">
                    RowLab V2
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-medium bg-interactive-primary/20 text-interactive-primary rounded">
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
          </div>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </SettingsStoreContext.Provider>
      </AuthStoreContext.Provider>
    </QueryClientProvider>
  );
}
