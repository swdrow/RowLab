# Component Documentation

RowLab frontend is built with React 18, featuring a modern component architecture with TypeScript support, Zustand state management, and a custom design system called "Precision Instrument".

## Technology Stack

### Core
- **React**: 18.x with hooks and concurrent features
- **React Router**: 6.x for navigation
- **Vite**: Fast build tool and dev server

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state and caching (future)

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Design Tokens**: Precision Instrument design system
- **CSS Variables**: Dynamic theming

### UI Components
- **@dnd-kit**: Drag and drop for lineup builder
- **Recharts**: Data visualization
- **React Hook Form**: Form handling

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base design system components
│   ├── compound/       # Complex reusable components
│   ├── domain/         # Domain-specific components
│   ├── AthleteBank/    # Athlete management
│   ├── Assignment/     # Lineup builder
│   ├── BoatDisplay/    # Boat visualization
│   ├── ErgData/        # Performance data
│   ├── Racing/         # Regatta management
│   ├── SeatRacing/     # Selection system
│   └── Auth/           # Authentication UI
├── pages/              # Page components
├── store/              # Zustand stores
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── theme/              # Design tokens
└── layouts/            # Layout components
```

## Design System

### Precision Instrument Design

RowLab uses a custom design system inspired by precision athletic equipment and professional instrumentation.

**Design Principles:**
1. **Clarity**: Information hierarchy optimized for decision-making
2. **Performance**: Minimal re-renders, optimized animations
3. **Consistency**: Reusable components with predictable behavior
4. **Accessibility**: WCAG 2.1 AA compliance

**Visual Language:**
- **Dark Theme**: Low-light rowing conditions
- **Neon Accents**: High-visibility CTAs and indicators
- **Gradient Borders**: Premium, technical aesthetic
- **Mono Font**: Performance metrics (numbers, times)
- **System Font**: Interface text (readable, fast)

### Color System

```css
/* Design Tokens (design-tokens.css) */
--void-bg: #0A0B0D;              /* Background */
--void-elevated: #131418;         /* Cards, surfaces */
--text-primary: #E8EAED;          /* Primary text */
--text-muted: #9AA0A6;            /* Secondary text */
--blade-blue: #0070F3;            /* Primary action */
--blade-blue-hover: #0061D5;      /* Hover states */
--danger-red: #FF3B30;            /* Errors, alerts */
--success-green: #34C759;         /* Success states */
```

### Typography

```css
/* Headings: SF Pro Display (system fallback) */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Body: System UI stack */
font-family: system-ui, -apple-system, sans-serif;

/* Metrics: SF Mono (monospace) */
font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
```

### Spacing Scale

```css
/* Tailwind scale (rem) */
0.5 = 2px    /* Hairline */
1 = 4px      /* Tight */
2 = 8px      /* Base */
3 = 12px     /* Comfortable */
4 = 16px     /* Spacious */
6 = 24px     /* Section */
8 = 32px     /* Large section */
12 = 48px    /* Page section */
```

## Component Categories

### 1. Base UI Components (`/components/ui/`)

Foundation components used throughout the app.

- **Button**: Primary, secondary, danger, ghost variants
- **Input**: Text input with validation states
- **Card**: Container with glass morphism effect
- **Typography**: Heading, body, label, metric text
- **Badge**: Status indicators and tags
- **Modal**: Overlay dialogs

See [Design System Documentation](./design-system.md)

### 2. Compound Components (`/components/compound/`)

Complex reusable components combining multiple base components.

- **Sidebar**: Navigation with collapsible sections
- **DataTable**: Sortable, filterable tables
- **Form**: Field groups with validation
- **EmptyState**: Placeholder for empty lists
- **LoadingState**: Skeleton screens and spinners

### 3. Domain Components

#### Athlete Management (`/components/AthleteBank/`)
- **AthleteCard**: Draggable athlete profile card
- **AthleteBank**: Roster management interface
- **AthleteDetail**: Detailed athlete profile view

[Athlete Components Documentation](./athletes.md)

#### Lineup Builder (`/components/Assignment/`)
- **LineupToolbar**: Actions (save, load, clear)
- **BoatSelectionModal**: Choose boat configuration
- **SavedLineupsModal**: Manage saved lineups
- **AssignmentControls**: Lineup management UI

[Lineup Components Documentation](./lineups.md)

#### Boat Display (`/components/BoatDisplay/`)
- **BoatDisplay**: Visual boat representation
- **Seat**: Individual seat with drag/drop
- **CoxswainSeat**: Coxswain position
- **CompactBoatView**: Minimal boat visualization

[Boat Display Documentation](./boat-display.md)

#### Performance Data (`/components/ErgData/`)
- **ErgDataTable**: Test results table
- **ErgDataModal**: Add/edit erg tests
- **AddErgTestModal**: Quick test entry
- **PerformanceChart**: Time series visualization

[Performance Components Documentation](./performance.md)

#### Racing (`/components/Racing/`)
- **RegattaList**: List of regattas
- **RaceCard**: Individual race details
- **ResultsTable**: Race results with margins
- **PredictionDisplay**: Speed estimates

#### Seat Racing (`/components/SeatRacing/`)
- **SessionList**: Seat racing sessions
- **PieceEditor**: Configure race pieces
- **ResultsCalculator**: Margin calculations
- **RankingsDisplay**: ELO-based rankings

#### Authentication (`/components/Auth/`)
- **LoginModal**: User authentication
- **RegisterModal**: Account creation
- **AuthButton**: Login/logout toggle
- **AdminPanel**: User management (admin only)

### 4. Layout Components (`/layouts/`)

Page-level layout wrappers.

- **AppLayout**: Main app shell with sidebar
- **AuthLayout**: Centered layout for auth pages
- **LandingLayout**: Marketing site layout

## State Management

### Zustand Stores (`/store/`)

RowLab uses Zustand for client-side state management.

**Store Pattern:**
```javascript
import { create } from 'zustand';

const useAthleteStore = create((set, get) => ({
  // State
  athletes: [],
  loading: false,
  error: null,

  // Actions
  fetchAthletes: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/v1/athletes');
      const data = await response.json();
      set({ athletes: data.data.athletes, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addAthlete: (athlete) => set((state) => ({
    athletes: [...state.athletes, athlete]
  })),

  updateAthlete: (id, updates) => set((state) => ({
    athletes: state.athletes.map(a =>
      a.id === id ? { ...a, ...updates } : a
    )
  })),

  removeAthlete: (id) => set((state) => ({
    athletes: state.athletes.filter(a => a.id !== id)
  }))
}));
```

**Available Stores:**
- `authStore` - User authentication and session
- `athleteStore` - Athlete roster data
- `lineupStore` - Lineup builder state
- `ergDataStore` - Erg test data
- `rankingsStore` - Athlete rankings
- `seatRaceStore` - Seat racing sessions
- `regattaStore` - Regatta and race data
- `settingsStore` - User preferences
- `announcementStore` - Team announcements

See [State Management Documentation](./state-management.md)

## Custom Hooks (`/hooks/`)

Reusable logic extracted into hooks.

### Data Fetching Hooks
```javascript
// useAthletes.js
export function useAthletes(options = {}) {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAthletes();
  }, [options]);

  const fetchAthletes = async () => {
    try {
      const response = await fetch('/api/v1/athletes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAthletes(data.data.athletes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { athletes, loading, error, refetch: fetchAthletes };
}
```

**Available Hooks:**
- `useAuth` - Authentication state and actions
- `useAthletes` - Fetch and manage athletes
- `useErgData` - Fetch erg test data
- `useLineups` - Lineup management
- `useDebounce` - Debounce input values
- `useLocalStorage` - Persist state to localStorage
- `useMediaQuery` - Responsive breakpoints
- `useClickOutside` - Detect clicks outside element

## Component Patterns

### Container/Presenter Pattern

```javascript
// Container (logic)
function AthleteListContainer() {
  const { athletes, loading } = useAthletes();

  if (loading) return <LoadingSpinner />;

  return <AthleteList athletes={athletes} />;
}

// Presenter (UI)
function AthleteList({ athletes }) {
  return (
    <div className="grid gap-4">
      {athletes.map(athlete => (
        <AthleteCard key={athlete.id} athlete={athlete} />
      ))}
    </div>
  );
}
```

### Compound Components

```javascript
function Tabs({ children }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }) {
  return <div className="flex border-b">{children}</div>;
};

Tabs.Tab = function Tab({ index, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      className={activeTab === index ? 'active' : ''}
      onClick={() => setActiveTab(index)}
    >
      {children}
    </button>
  );
};

// Usage
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Athletes</Tabs.Tab>
    <Tabs.Tab index={1}>Lineups</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel index={0}>...</Tabs.Panel>
  <Tabs.Panel index={1}>...</Tabs.Panel>
</Tabs>
```

### Render Props

```javascript
function DataLoader({ url, children }) {
  const [data, loading, error] = useFetch(url);

  return children({ data, loading, error });
}

// Usage
<DataLoader url="/api/v1/athletes">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    return <AthleteList athletes={data} />;
  }}
</DataLoader>
```

## Performance Optimization

### Memoization

```javascript
import { memo, useMemo } from 'react';

// Memo component
const AthleteCard = memo(({ athlete }) => {
  return <div>{athlete.name}</div>;
}, (prevProps, nextProps) => {
  return prevProps.athlete.id === nextProps.athlete.id;
});

// Memoized value
function AthleteStats({ athletes }) {
  const avgWeight = useMemo(() => {
    return athletes.reduce((sum, a) => sum + a.weightKg, 0) / athletes.length;
  }, [athletes]);

  return <div>Average weight: {avgWeight} kg</div>;
}
```

### Lazy Loading

```javascript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Virtual Scrolling

For large lists, use virtualization:
```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function AthleteList({ athletes }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: athletes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <AthleteCard athlete={athletes[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing

### Component Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { AthleteCard } from './AthleteCard';

describe('AthleteCard', () => {
  const mockAthlete = {
    id: '123',
    firstName: 'John',
    lastName: 'Smith',
    side: 'Port'
  };

  it('renders athlete name', () => {
    render(<AthleteCard athlete={mockAthlete} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<AthleteCard athlete={mockAthlete} onClick={handleClick} />);

    fireEvent.click(screen.getByText('John Smith'));
    expect(handleClick).toHaveBeenCalledWith(mockAthlete);
  });
});
```

### Hook Tests

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAthletes } from './useAthletes';

describe('useAthletes', () => {
  it('fetches athletes on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAthletes());

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.athletes).toHaveLength(10);
  });
});
```

## Accessibility

### Keyboard Navigation

```javascript
function Button({ onClick, children }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {children}
    </button>
  );
}
```

### ARIA Labels

```javascript
function AthleteCard({ athlete }) {
  return (
    <div
      role="article"
      aria-label={`Athlete: ${athlete.fullName}`}
    >
      <img
        src={athlete.avatar}
        alt={`${athlete.fullName} profile picture`}
      />
      <h3 id={`athlete-${athlete.id}`}>{athlete.fullName}</h3>
      <p aria-describedby={`athlete-${athlete.id}`}>
        {athlete.side} side rower
      </p>
    </div>
  );
}
```

### Focus Management

```javascript
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef();

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return isOpen ? (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  ) : null;
}
```

## Component Documentation Index

- [Design System](./design-system.md)
- [Athlete Components](./athletes.md)
- [Lineup Components](./lineups.md)
- [Performance Components](./performance.md)
- [State Management](./state-management.md)

---

**React Version**: 18.2
**Last Updated**: 2026-01-19
