import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useTheme } from '@v2/hooks/useTheme';
import { useRouteAnalytics } from '@v2/hooks/useRouteAnalytics';
import { useAuth } from '@v2/contexts/AuthContext';
import { SettingsStoreContext } from '@v2/hooks/useSharedStores';
import { ThemeToggle } from '@v2/components/shell/ThemeToggle';
import { ToastProvider as SonnerToast } from '@v2/components/common';
import { ToastProvider } from '@v2/contexts/ToastContext';
import { AuthProvider } from '@v2/contexts/AuthContext';
import { initBroadcastSync } from '@v2/lib/broadcastSync';
import { queryClient } from '../queryClient';
import useSettingsStore from '../../store/settingsStore';
import '@v2/styles/v2.css';

export default function V2Layout() {
  const { theme } = useTheme();

  // Track V2 route views
  useRouteAnalytics('v2');

  // Initialize BroadcastChannel for multi-tab sync
  useEffect(() => {
    initBroadcastSync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsStoreContext.Provider value={useSettingsStore}>
          <ToastProvider>
            <div className="v2" data-theme={theme}>
              <div className="min-h-screen bg-ink-deep">
                <header className="bg-ink-base/80 backdrop-blur-md border-b border-ink-border px-4 py-3">
                  <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                      <h1 className="text-xl font-display text-ink-bright">RowLab</h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                    </div>
                  </div>
                </header>
                <main className="min-h-[calc(100vh-57px)]">
                  <Outlet />
                </main>
              </div>
            </div>
          </ToastProvider>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </SettingsStoreContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
