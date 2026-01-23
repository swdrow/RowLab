import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '@v2/styles/v2.css';

type Theme = 'dark' | 'light' | 'field';

export default function V2Layout() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('v2-theme') as Theme | null;
    if (saved && ['dark', 'light', 'field'].includes(saved)) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('v2-theme', theme);
  }, [theme]);

  return (
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              className="text-sm bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="field">Field</option>
            </select>
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-57px)]">
        <Outlet />
      </main>
    </div>
  );
}
