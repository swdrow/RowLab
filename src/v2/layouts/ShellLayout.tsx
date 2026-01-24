import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ContextRail } from '@v2/components/shell/ContextRail';
import { WorkspaceSidebar } from '@v2/components/shell/WorkspaceSidebar';
import { useContextStore } from '@v2/stores/contextStore';

/**
 * ShellLayout Component
 *
 * Main application shell that composes:
 * - ContextRail (64px vertical rail for Me/Coach/Admin switching)
 * - WorkspaceSidebar (256px context-aware navigation)
 * - Content area (main page content via Outlet)
 *
 * Features:
 * - CSS Grid layout for responsive shell structure
 * - Keyboard shortcuts: Ctrl+1 (Me), Ctrl+2 (Coach), Ctrl+3 (Admin)
 * - Focus management: moves focus to first sidebar item on context switch
 * - Accessibility: screen reader announcements for context changes
 * - Mobile responsive: sidebars hidden on <768px, accessible via hamburger menu
 *
 * Layout structure (desktop):
 * ┌────────┬──────────────────────────────────────┐
 * │        │                                      │
 * │  Rail  │           Content                    │
 * │  64px  │           (flex-1)                   │
 * │        │                                      │
 * │        ├──────────────┬───────────────────────┤
 * │        │   Sidebar    │       Main            │
 * │        │   256px      │       (flex-1)        │
 * │        │              │                       │
 * └────────┴──────────────┴───────────────────────┘
 *
 * Layout structure (mobile):
 * ┌──────────────────────────────────────────────┐
 * │  ☰ Header (hamburger + context)             │
 * ├──────────────────────────────────────────────┤
 * │                                              │
 * │              Content (full width)            │
 * │                                              │
 * └──────────────────────────────────────────────┘
 */
export function ShellLayout() {
  const { activeContext, setActiveContext } = useContextStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext]);

  // Keyboard shortcuts for context switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      if (!(e.ctrlKey || e.metaKey)) return;

      // Map number keys to contexts
      const keyMap: Record<string, 'me' | 'coach' | 'admin'> = {
        '1': 'me',
        '2': 'coach',
        '3': 'admin',
      };

      const context = keyMap[e.key];
      if (context) {
        e.preventDefault();
        setActiveContext(context);

        // Move focus to first sidebar nav item after React renders
        // Use 0ms timeout to wait for React to update the DOM
        setTimeout(() => {
          const firstNavItem = document.querySelector('.workspace-sidebar a') as HTMLElement;
          firstNavItem?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveContext]);

  // Context change announcements for screen readers
  const contextLabels: Record<typeof activeContext, string> = {
    me: 'Me',
    coach: 'Coach',
    admin: 'Admin',
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="v2 h-screen flex flex-col">
        {/* Screen reader live region for context announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          Switched to {contextLabels[activeContext]} workspace
        </div>

        {/* Mobile header */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 bg-bg-surface border-b border-bdr-default">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-bg-hover transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} className="text-txt-primary" />
          </button>
          <span className="text-sm font-medium text-txt-secondary capitalize">
            {activeContext}
          </span>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Main content - full width */}
        <main className="flex-1 overflow-y-auto bg-bg-surface">
          <Outlet />
        </main>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu panel */}
            <div className="relative flex h-full w-80 max-w-[calc(100%-3rem)] bg-bg-base">
              {/* Rail */}
              <aside className="w-16 h-full flex-shrink-0">
                <ContextRail />
              </aside>

              {/* Sidebar */}
              <aside className="flex-1 h-full overflow-y-auto">
                <WorkspaceSidebar onNavigate={() => setMobileMenuOpen(false)} />
              </aside>

              {/* Close button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-lg hover:bg-bg-hover transition-colors"
                aria-label="Close menu"
              >
                <X size={20} className="text-txt-secondary" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="v2 h-screen grid grid-cols-[auto_1fr]">
      {/* Screen reader live region for context announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Switched to {contextLabels[activeContext]} workspace
      </div>

      {/* Left rail - always 64px */}
      <aside className="w-16 h-full">
        <ContextRail />
      </aside>

      {/* Sidebar + Content nested grid */}
      <div className="grid grid-cols-[auto_1fr] h-full">
        {/* Sidebar - 256px with overflow */}
        <aside className="w-64 h-full overflow-y-auto">
          <WorkspaceSidebar />
        </aside>

        {/* Main content area */}
        <main className="h-full overflow-y-auto p-6 bg-bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ShellLayout;
