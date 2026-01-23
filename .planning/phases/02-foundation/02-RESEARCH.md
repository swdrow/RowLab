# Phase 2: Foundation (Shell & Context) - Research

**Researched:** 2026-01-23
**Domain:** React shell layout architecture, context-aware navigation, theme management
**Confidence:** HIGH

## Summary

Phase 2 builds the application shell with a **rail + sidebar + content** layout pattern, context-aware navigation for three personas (Me/Coach/Admin), and theme system with persistence. Research reveals this is a well-established pattern in modern React applications, with strong ecosystem support from Zustand for shared state, Framer Motion for layout transitions, and established accessibility patterns.

The **key technical challenge** is integrating V2's shell with existing V1 Zustand stores while maintaining CSS isolation via the `.v2` selector strategy. The three-level token system (already implemented from Phase 1) provides solid foundation for theme switching.

**Primary recommendation:** Use shadcn/ui's Sidebar pattern as architectural reference (rail + sidebar structure with keyboard shortcuts), leverage React Router v6's nested routes with `Outlet` for context-aware navigation, and share Zustand store instances (not values) via React Context for V1/V2 integration.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 4.4.7 | Shared state management | Already in project, perfect for cross-version state sharing via React Context pattern |
| Framer Motion | 11.18.2 | Layout animations | Already in project, industry standard for React layout transitions and shared element animations |
| React Router | 6.30.2 | Context-aware routing | Already in project, v6's Outlet + useOutletContext enables context-aware nested routes |
| react-focus-lock | 2.13.7 | Focus management | Already in project, essential for keyboard navigation and accessibility in modals/sidebars |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 3.4.1 | Styling with selector isolation | Already in project with `.v2` important selector strategy |
| CSS Custom Properties | Native | Theme tokens | Three-level token system already implemented in Phase 1 |
| window.matchMedia | Native | System preference detection | For `prefers-color-scheme` media query listening |
| localStorage API | Native | Theme persistence | Store user's manual theme overrides |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand + Context | Redux Toolkit | Zustand simpler for V1/V2 bridging, already in codebase |
| Framer Motion | React Spring | Framer Motion better layout animation support, already in project |
| CSS Custom Properties | Styled Components | Custom props work better with existing Tailwind setup |

**Installation:**
All required packages already in package.json. No additional dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/v2/
├── components/
│   ├── shell/           # Shell-specific components
│   │   ├── ContextRail.tsx
│   │   ├── WorkspaceSidebar.tsx
│   │   └── ThemeToggle.tsx
│   └── common/          # Reusable components
├── layouts/
│   ├── V2Layout.tsx     # Existing root layout (enhance)
│   └── ShellLayout.tsx  # New shell wrapper
├── stores/
│   └── contextStore.ts  # Context switching state
└── hooks/
    ├── useTheme.ts      # Theme management hook
    └── useContextNav.ts # Context-aware navigation
```

### Pattern 1: Zustand Store Sharing Between V1/V2
**What:** Share store *instances* via React Context, not store values
**When to use:** When multiple app versions need to access same state
**Example:**
```typescript
// Recommended approach - share store instance
import { createContext, useContext } from 'react';
import useAuthStore from '@/store/authStore';

const AuthStoreContext = createContext(useAuthStore);

export function V2Layout({ children }) {
  return (
    <AuthStoreContext.Provider value={useAuthStore}>
      {children}
    </AuthStoreContext.Provider>
  );
}

// V2 components use context to get store
export function useSharedAuthStore() {
  return useContext(AuthStoreContext);
}
```
**Source:** [Zustand and React Context](https://tkdodo.eu/blog/zustand-and-react-context), [React Context with Zustand](https://tuffstuff9.hashnode.dev/react-context-managing-single-and-multi-instance-contexts-using-zustand)

### Pattern 2: Theme with System Preference + Persistence
**What:** Triple-mode theme (dark/light/field) with system detection and localStorage
**When to use:** When theme should respect OS settings but allow manual override
**Example:**
```typescript
// Hook that combines system preference + localStorage
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Check localStorage first (user override)
    const saved = localStorage.getItem('v2-theme');
    if (saved) return saved as Theme;

    // 2. Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only update if user hasn't set manual preference
      if (!localStorage.getItem('v2-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('v2-theme', newTheme);
  };

  return { theme, setTheme: updateTheme };
}
```
**Source:** [Syncing React with System Color Scheme](https://blog.bitsrc.io/how-to-sync-your-react-app-with-the-system-color-scheme-78c0ad00074b), [Dark Mode with localStorage](https://elanmed.dev/blog/dark-mode-client-side-approach)

### Pattern 3: Context-Aware Navigation with React Router v6
**What:** Use nested routes with `Outlet` and `useOutletContext` for persona-specific navigation
**When to use:** When navigation items change based on user context (Me/Coach/Admin)
**Example:**
```typescript
// ShellLayout.tsx - provides context to nested routes
function ShellLayout() {
  const { activeContext } = useContextStore();

  return (
    <div className="v2 shell-layout">
      <ContextRail />
      <WorkspaceSidebar context={activeContext} />
      <main>
        <Outlet context={{ activeContext }} />
      </main>
    </div>
  );
}

// Child route component
function WorkspaceView() {
  const { activeContext } = useOutletContext<{ activeContext: Context }>();
  // Navigation items automatically filtered by context
}
```
**Source:** [React Router v6 Nested Routes](https://dev.to/tywenk/how-to-use-nested-routes-in-react-router-6-4jhd), [React Router v6 Guide](https://trio.dev/guide-to-react-router-v6/)

### Pattern 4: Rail + Sidebar Shell Layout
**What:** Fixed rail (48-64px) for context switching, expandable sidebar for navigation
**When to use:** Multi-workspace applications with context-specific navigation
**Example:**
```typescript
// CSS Grid-based shell layout
<div className="v2 h-screen grid grid-cols-[auto_1fr]">
  {/* Rail - always visible */}
  <aside className="w-16 bg-bg-surface-elevated border-r border-border-default">
    <ContextRail />
  </aside>

  {/* Sidebar + Content */}
  <div className="grid grid-cols-[auto_1fr]">
    {/* Sidebar - collapsible */}
    <aside className="w-64 bg-bg-surface border-r border-border-default">
      <WorkspaceSidebar />
    </aside>

    {/* Main content area */}
    <main className="overflow-auto">
      <Outlet />
    </main>
  </div>
</div>
```
**Source:** [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar), [Shadcn Sidebar Architecture](https://medium.com/@rivainasution/shadcn-ui-react-series-part-11-sidebar-architecting-a-scalable-sidebar-system-in-react-f45274043863)

### Pattern 5: Keyboard Navigation with Focus Management
**What:** Keyboard shortcuts for context switching with proper focus management
**When to use:** All shell navigation for WCAG 2.2 compliance
**Example:**
```typescript
// Keyboard shortcuts for context switching (Ctrl+1, Ctrl+2, Ctrl+3)
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '1') switchContext('me');
      if (e.key === '2') switchContext('coach');
      if (e.key === '3') switchContext('admin');
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);

// Focus management when context switches
const switchContext = (context: Context) => {
  setActiveContext(context);

  // Move focus to first navigation item in new sidebar
  const firstNavItem = document.querySelector('.workspace-sidebar [role="link"]');
  if (firstNavItem) {
    (firstNavItem as HTMLElement).focus();
  }
};
```
**Source:** [Keyboard Accessibility in React](https://www.freecodecamp.org/news/designing-keyboard-accessibility-for-complex-react-experiences/), [WCAG 2.2 Focus Management](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html)

### Anti-Patterns to Avoid
- **Storing Zustand state values in React Context** - Share store instances, not values (causes re-render issues)
- **Using `!important` for style overrides** - Leverage selector strategy (`.v2`) and specificity instead
- **Hard-coding navigation items** - Make navigation context-aware based on active persona
- **Forgetting focus management** - Always reset focus when context switches
- **Setting theme without localStorage** - Always persist manual theme changes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trapping in modals | Custom tab index management | react-focus-lock (already installed) | Handles portals, positive tab indexes, all edge cases correctly |
| System preference detection | Manual media query polling | window.matchMedia with event listeners | Native API handles changes automatically |
| Layout animations | Custom CSS transitions for layout | Framer Motion `layout` prop | Can't animate justify-content, grid changes with CSS alone |
| Z-index management | Manual z-index values | Tailwind z-index scale + stacking context awareness | Prevents conflicts across components |
| Shared state between versions | Custom event system | Zustand + React Context pattern | Already in codebase, proven pattern |
| Keyboard shortcut conflicts | Manual event handler coordination | react-focus-lock's pause/resume for nested contexts | Handles nested focus traps (dropdown in modal) |

**Key insight:** Shell layouts involve multiple stacking contexts (rail, sidebar, modals, dropdowns). Understanding CSS stacking contexts is more important than z-index values. Properties like `transform`, `opacity < 1`, `position: fixed/sticky` create new stacking contexts where z-index only works within that context.

## Common Pitfalls

### Pitfall 1: Overflow + Sticky Positioning Conflicts
**What goes wrong:** Sidebar with `position: sticky` elements stops working when parent has `overflow: hidden`
**Why it happens:** CSS spec: `overflow: hidden` creates a new positioning context that prevents sticky from working
**How to avoid:**
- Use CSS Grid for shell layout instead of flexbox with overflow
- Apply overflow only to content area, not layout containers
- Use React Portals for dropdowns/tooltips to escape overflow constraints
**Warning signs:**
- Sticky headers/footers in sidebar not sticking
- Navigation tooltips getting clipped

**Source:** [React Portals for Overflow](https://medium.com/@haridharanka20/a-real-world-css-challenge-addressed-through-a-powerful-react-feature-d872920c0eb0), [CSS Positioning Pitfalls](https://blog.pixelfreestudio.com/layering-issues-understanding-css-positioning-pitfalls/)

### Pitfall 2: Z-index Wars from Multiple Stacking Contexts
**What goes wrong:** Rail at `z-50`, sidebar at `z-40`, but dropdown in sidebar appears behind rail
**Why it happens:** Rail and sidebar create separate stacking contexts via `transform` or other properties
**How to avoid:**
- Establish global z-index scale (Tailwind provides: dropdown: 20, sticky: 30, overlay: 50, modal: 60)
- Understand when new stacking contexts are created (transform, opacity, filter, position: fixed/sticky)
- Use React Portals to render modals/dropdowns outside shell hierarchy
**Warning signs:**
- Adjusting z-index doesn't fix layering
- Element with `z-[9999]` still appears behind lower z-index element

**Source:** [Z-index and Stacking Context](https://www.developerway.com/posts/positioning-and-portals-in-react), [Today I Learned: Z-Index Trap](https://dev.to/minoosh/today-i-learned-layouts-and-the-z-index-trap-in-react-366f)

### Pitfall 3: Zustand Store Re-render Loops with Context
**What goes wrong:** Entire app re-renders when Zustand store updates, defeating Zustand's optimization
**Why it happens:** Storing Zustand state values in React Context instead of store instance
**How to avoid:**
- Share store *instance* via Context: `<Context.Provider value={useAuthStore}>`
- NOT store values: `<Context.Provider value={useAuthStore()}>` (wrong!)
- Components use selectors as normal: `const user = useContext(StoreContext)((state) => state.user)`
**Warning signs:**
- Performance degradation with Zustand
- DevTools showing excessive re-renders
- Store updates causing full tree re-render

**Source:** [Zustand and React Context](https://tkdodo.eu/blog/zustand-and-react-context), [Multiple Zustand Instances](https://github.com/pmndrs/zustand/discussions/2637)

### Pitfall 4: Focus Lost on Context Switch
**What goes wrong:** When switching contexts (Me → Coach), keyboard focus disappears or jumps to document body
**Why it happens:** React unmounts old navigation tree, focused element no longer exists
**How to avoid:**
- Programmatically move focus to logical destination (first nav item in new sidebar)
- Use `aria-live` region to announce context change to screen readers
- Store focus state before switch, restore to equivalent item
**Warning signs:**
- Tab navigation breaks after context switch
- Screen readers don't announce context change
- Users must click to regain keyboard context

**Source:** [React Accessibility - Focus Management](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_accessibility), [Keyboard Events in React](https://useful.codes/keyboard-events-and-accessibility-in-react/)

### Pitfall 5: WCAG 2.2 Focus Not Obscured Violations
**What goes wrong:** Focused navigation item hidden behind sticky header or rail
**Why it happens:** Overlapping shell elements obscure keyboard focus indicator
**How to avoid:**
- Implement WCAG 2.2 Success Criterion 2.4.11 (Level AA): Focus indicator must not be entirely hidden
- When sidebar scrolls, ensure focused item remains visible (not behind sticky elements)
- Use `scrollIntoView({ block: 'nearest' })` when focusing navigation items
- Test keyboard navigation at different viewport sizes
**Warning signs:**
- Focused item hidden when using Tab key
- Focus indicator partially or fully obscured by fixed/sticky elements

**Source:** [WCAG 2.2 Focus Not Obscured](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/), [WCAG 2.2 Compliance Guide](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025)

### Pitfall 6: Tailwind `.v2` Selector Strategy Side Effects
**What goes wrong:** V2 styles inadvertently affect V1 components or vice versa
**Why it happens:** Selector strategy makes all Tailwind utilities require `.v2` ancestor, but global CSS still applies
**How to avoid:**
- Never use Tailwind utilities in V1 components (they won't work without `.v2`)
- Keep V2 CSS scoped to V2 files (already configured in tailwind.v2.config.js)
- Remember `.v2` selector increases specificity of ALL utilities
- Use cascade layers for third-party styles to prevent conflicts
**Warning signs:**
- V1 styles leaking into V2
- Tailwind utilities not applying in V2
- Specificity conflicts requiring `!important`

**Source:** [CSS Specificity Best Practices](https://blogs.halodoc.io/best-practices-that-we-follow-to-avoid-specificity-issues/), [Cascade Layers for Isolation](https://matuzo.at/blog/2026/lowering-specificity-of-multiple-rules)

## Code Examples

Verified patterns from official sources:

### Context Rail Component Structure
```typescript
// ContextRail.tsx - Vertical rail for context switching
import { motion } from 'framer-motion';

const contexts = [
  { id: 'me', label: 'Me', icon: UserIcon, shortcut: '⌘1' },
  { id: 'coach', label: 'Coach', icon: CoachIcon, shortcut: '⌘2' },
  { id: 'admin', label: 'Admin', icon: AdminIcon, shortcut: '⌘3' },
];

export function ContextRail() {
  const { activeContext, setActiveContext } = useContextStore();

  return (
    <nav
      className="flex flex-col gap-2 p-2"
      aria-label="Workspace contexts"
    >
      {contexts.map((context) => (
        <button
          key={context.id}
          onClick={() => setActiveContext(context.id)}
          aria-label={`${context.label} workspace (${context.shortcut})`}
          aria-current={activeContext === context.id ? 'page' : undefined}
          className="relative w-12 h-12 rounded-lg flex items-center justify-center
                     hover:bg-bg-hover transition-colors"
        >
          <context.icon className="w-6 h-6 text-text-secondary" />

          {/* Active indicator */}
          {activeContext === context.id && (
            <motion.div
              layoutId="activeContext"
              className="absolute inset-0 bg-action-primary/10 rounded-lg"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
```

### Workspace Sidebar with Context-Aware Navigation
```typescript
// WorkspaceSidebar.tsx
import { useLocation } from 'react-router-dom';

const navigationByContext = {
  me: [
    { to: '/beta/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/beta/workouts', label: 'My Workouts', icon: ActivityIcon },
    { to: '/beta/progress', label: 'Progress', icon: TrendingUpIcon },
  ],
  coach: [
    { to: '/beta/athletes', label: 'Athletes', icon: UsersIcon },
    { to: '/beta/plans', label: 'Training Plans', icon: CalendarIcon },
    { to: '/beta/lineups', label: 'Lineups', icon: BoatIcon },
  ],
  admin: [
    { to: '/beta/users', label: 'Users', icon: UsersIcon },
    { to: '/beta/teams', label: 'Teams', icon: TeamIcon },
    { to: '/beta/settings', label: 'Settings', icon: SettingsIcon },
  ],
};

export function WorkspaceSidebar() {
  const { activeContext } = useContextStore();
  const location = useLocation();

  const navItems = navigationByContext[activeContext] || [];

  return (
    <nav
      className="flex flex-col gap-1 p-4"
      aria-label={`${activeContext} workspace navigation`}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;

        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              'transition-colors duration-150',
              isActive
                ? 'bg-action-primary text-button-primary-text'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

### Theme Toggle with System Preference
```typescript
// ThemeToggle.tsx
export function ThemeToggle() {
  const { theme, setTheme, isSystemDefault } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-muted">Theme:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="text-sm bg-bg-surface border border-border-default rounded px-2 py-1"
        aria-label="Select theme"
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="field">Field</option>
      </select>

      {isSystemDefault && (
        <span className="text-xs text-text-muted">(System)</span>
      )}
    </div>
  );
}

// useTheme.ts hook
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('v2-theme');
    if (saved) return saved as Theme;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const [isSystemDefault, setIsSystemDefault] = useState(
    !localStorage.getItem('v2-theme')
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (isSystemDefault) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [isSystemDefault]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('v2-theme', newTheme);
    setIsSystemDefault(false);
  };

  return { theme, setTheme, isSystemDefault };
}
```

### Shared Zustand Store Integration
```typescript
// stores/index.ts - V2 store access layer
import { createContext, useContext } from 'react';
import useAuthStore from '@/store/authStore';
import useSettingsStore from '@/store/settingsStore';

// Create contexts for store instances
export const AuthStoreContext = createContext(useAuthStore);
export const SettingsStoreContext = createContext(useSettingsStore);

// V2-specific hooks
export function useV2Auth() {
  return useContext(AuthStoreContext);
}

export function useV2Settings() {
  return useContext(SettingsStoreContext);
}

// ShellLayout.tsx - Provide store instances to V2
export function ShellLayout() {
  return (
    <AuthStoreContext.Provider value={useAuthStore}>
      <SettingsStoreContext.Provider value={useSettingsStore}>
        <div className="v2 shell">
          {/* Shell components */}
        </div>
      </SettingsStoreContext.Provider>
    </AuthStoreContext.Provider>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shared layout components | Isolated V2 shell with CSS scoping | Phase 1 (2026) | Complete CSS isolation between V1/V2 |
| Single theme toggle | Triple mode (dark/light/field) with system detection | Phase 2 (2026) | Better UX, outdoor use case support |
| Global Redux state | Zustand with React Context bridging | V1 baseline | Simpler state management, V1/V2 sharing |
| CSS-in-JS | CSS Custom Properties + Tailwind | Phase 1 (2026) | Three-level token system, better performance |
| WCAG 2.0/2.1 | WCAG 2.2 (Focus Not Obscured) | 2024 | New focus visibility requirements |
| Manual focus management | react-focus-lock + focus restoration | Current | Better accessibility, less custom code |

**Deprecated/outdated:**
- Framer Motion's `AnimateSharedLayout` component - replaced by `layoutId` prop directly on motion components
- React Router's `Switch` component - replaced by `Routes` in v6
- CSS `@import` for themes - replaced by CSS Custom Properties with data attributes

## Open Questions

Things that couldn't be fully resolved:

1. **V1 Navigation Coexistence**
   - What we know: V1 has existing navigation that will remain during migration
   - What's unclear: How to handle navigation between V1 and V2 routes during transition period
   - Recommendation: Link from V2 to V1 routes as external navigation, accept full page navigation for now

2. **Context Switching Performance**
   - What we know: Context switches unmount/remount navigation trees
   - What's unclear: Whether this causes performance issues with large navigation structures
   - Recommendation: Implement and test; optimize with React.memo if needed

3. **Field Theme Validation**
   - What we know: Field theme designed for outdoor high-contrast use
   - What's unclear: Whether current contrast ratios meet outdoor visibility needs
   - Recommendation: Mark as LOW confidence until field-tested with actual users outdoors

## Sources

### Primary (HIGH confidence)
- [Zustand Official Docs](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - Persistence patterns
- [Framer Motion Layout Animations](https://motion.dev/docs/react-layout-animations) - Layout prop and layoutId
- [Framer Motion LayoutGroup](https://motion.dev/docs/react-layout-group) - Scoping layoutId
- [React Router v6 Nested Routes](https://dev.to/tywenk/how-to-use-nested-routes-in-react-router-6-4jhd) - Outlet pattern
- [WCAG 2.2 What's New](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) - Official W3C guidance
- [WCAG 2.4.11 Focus Not Obscured](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html) - Official success criteria
- [MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) - Media query spec
- [MDN aria-label](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label) - ARIA best practices
- [MDN navigation role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/navigation_role) - Navigation landmarks

### Secondary (MEDIUM confidence)
- [Zustand and React Context](https://tkdodo.eu/blog/zustand-and-react-context) - WebSearch verified with official Zustand patterns
- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar) - Industry reference implementation
- [Shadcn Sidebar Architecture](https://medium.com/@rivainasution/shadcn-ui-react-series-part-11-sidebar-architecting-a-scalable-sidebar-system-in-react-f45274043863) - Detailed architectural breakdown
- [React Syncing with System Color Scheme](https://blog.bitsrc.io/how-to-sync-your-react-app-with-the-system-color-scheme-78c0ad00074b) - System preference pattern
- [Dark Mode localStorage Implementation](https://elanmed.dev/blog/dark-mode-client-side-approach) - Persistence strategy
- [React Focus Lock GitHub](https://github.com/theKashey/react-focus-lock) - Official library documentation
- [Keyboard Accessibility in React](https://www.freecodecamp.org/news/designing-keyboard-accessibility-for-complex-react-experiences/) - Focus management patterns
- [React Portals for Overflow](https://medium.com/@haridharanka20/a-real-world-css-challenge-addressed-through-a-powerful-react-feature-d872920c0eb0) - Overflow escape pattern
- [Z-index and Stacking Context](https://www.developerway.com/posts/positioning-and-portals-in-react) - Stacking context deep dive
- [CSS Specificity Best Practices](https://blogs.halodoc.io/best-practices-that-we-follow-to-avoid-specificity-issues/) - Specificity management
- [Cascade Layers 2026](https://matuzo.at/blog/2026/lowering-specificity-of-multiple-rules) - Modern CSS isolation technique

### Tertiary (LOW confidence - community best practices)
- [React Context with Zustand](https://tuffstuff9.hashnode.dev/react-context-managing-single-and-multi-instance-contexts-using-zustand) - Implementation guide
- [Collapsible Sidebar with React Router](https://dev.to/cristiansifuentes/building-a-collapsible-admin-sidebar-with-react-router-uselocation-pro-patterns-7im) - useLocation patterns
- [React Router v6 Guide](https://trio.dev/guide-to-react-router-v6/) - General v6 overview
- [Preferred Color Scheme in React](https://www.reactstateofmind.com/preferred-color-scheme-in-react/) - Implementation example
- [Keyboard Events in React](https://useful.codes/keyboard-events-and-accessibility-in-react/) - Event handling patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, versions verified
- Architecture: HIGH - Patterns verified with official docs and multiple credible sources
- Pitfalls: MEDIUM - Based on community experiences and official specs, some untested in this codebase
- Code examples: HIGH - Patterns drawn from official documentation and established libraries

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable ecosystem, unlikely to change rapidly)

**Notes:**
- Phase 1 already established CSS isolation strategy (`.v2` selector)
- Phase 1 already created three-level token system (palette → semantic → component)
- Existing V2Layout.tsx has basic theme switching implemented
- All required dependencies already in package.json (no installation needed)
