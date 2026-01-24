# Architecture Patterns: V2 Rowing Features Integration

**Project:** RowLab v2.0 Rowing Features
**Researched:** 2026-01-24
**Overall Confidence:** HIGH

## Executive Summary

The V2 architecture follows a proven pattern: **TanStack Query for server state + Zustand for client state**, wrapped in a feature-based component organization. The existing shell (ContextRail + WorkspaceSidebar + ShellLayout) provides the navigation foundation, while new rowing features integrate as context-aware pages under `/app/coach/*`.

**Key Integration Points:**
- **State**: TanStack Query hooks (80% of state needs) + Zustand stores for complex client state (Lineup Builder undo/redo, drag-drop)
- **Routing**: New pages under `/app/coach/*` in ShellLayout, lazy-loaded via React Router v6
- **API**: REST endpoints at `/api/v1/[resource]` following existing patterns
- **Components**: Feature-based organization in `src/v2/features/[feature-name]/`

**Critical Decision:** Lineup Builder needs dedicated Zustand store with time-travel middleware (zundo) for undo/redo. Other features use TanStack Query exclusively.

---

## 1. Current V2 Architecture (Baseline)

### State Management Pattern

```typescript
// EXISTING PATTERN: Hybrid approach
// 1. TanStack Query for server data (80% of needs)
// 2. Zustand for V2-specific client state (context, theme, user prefs)
// 3. Shared V1 stores via React Context (auth, settings)

// Example: Dashboard Preferences Hook
export function useDashboardPrefs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard-preferences'],
    queryFn: fetchPreferences,
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['dashboard-preferences'], data);
    },
  });

  return { preferences, setPinnedModules, toggleSourceVisibility };
}
```

**Current V2 Zustand Stores:**
- `contextStore.ts` - Active workspace context (me/coach/admin) with persistence
- `userPreferenceStore.ts` - User preferences and UI state

**Shared V1 Stores (via Context):**
- `authStore` - Authentication state, token management
- `settingsStore` - Global application settings

### Component Structure

```
src/v2/
├── components/
│   ├── shell/           # ContextRail, WorkspaceSidebar, ThemeToggle
│   ├── dashboard/       # HeadlineWidget, UnifiedActivityFeed
│   ├── whiteboard/      # WhiteboardView, WhiteboardEditor
│   ├── fleet/           # ShellsTable, OarSetForm
│   ├── availability/    # AvailabilityGrid, AvailabilityCell
│   └── common/          # CrudModal, shared utilities
├── hooks/               # useDashboardPrefs, useActivityFeed, useWhiteboard
├── layouts/             # V2Layout, ShellLayout
├── pages/               # MeDashboard, CoachWhiteboard, CoachFleet
├── stores/              # contextStore, userPreferenceStore
├── types/               # TypeScript interfaces
└── utils/               # api.ts (axios instance)
```

### Routing Structure

```javascript
// App.jsx - V2 Routes at /app/*
<Route path="/app" element={<V2Layout />}>
  <Route element={<ShellLayout />}>  {/* Rail + Sidebar + Content */}
    <Route index element={<MeDashboard />} />
    <Route path="me" element={<MeDashboard />} />
    <Route path="coach/whiteboard" element={<CoachWhiteboard />} />
    <Route path="coach/fleet" element={<CoachFleet />} />
    <Route path="coach/availability" element={<CoachAvailability />} />
  </Route>
</Route>
```

**Context-Aware Navigation:**
- ContextRail switches between Me/Coach/Admin workspaces
- WorkspaceSidebar renders nav items based on active context
- Navigation config in `contextStore.ts` CONTEXT_CONFIGS array

### API Pattern

```typescript
// V2 API utilities (src/v2/utils/api.ts)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

// Interceptors handle:
// - Authorization header from authStore
// - 401 responses trigger token refresh
// - Automatic retry after refresh

// Endpoints: /api/v1/[resource]
// - /api/v1/dashboard-preferences
// - /api/v1/shells
// - /api/v1/oar-sets
// - /api/v1/availability
// - /api/v1/whiteboard
```

---

## 2. Rowing Features Architecture

### 2.1 Lineup Builder

**Complexity:** HIGH - Complex client state with drag-drop, undo/redo, multi-boat management

**State Management:** Zustand store with time-travel middleware (zundo)

```typescript
// NEW: src/v2/stores/lineupStore.ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import { persist } from 'zustand/middleware';

interface LineupStore {
  activeBoats: Boat[];
  selectedAthletes: Athlete[];
  addBoat: (config: BoatConfig) => void;
  removeBoat: (boatId: string) => void;
  assignToSeat: (boatId: string, seatNumber: number, athlete: Athlete) => void;
  assignToCoxswain: (boatId: string, athlete: Athlete) => void;
  clearBoat: (boatId: string) => void;
}

export const useLineupStore = create<LineupStore>()(
  temporal(
    persist(
      (set) => ({
        activeBoats: [],
        selectedAthletes: [],
        // ... actions
      }),
      { name: 'v2-lineup' }
    ),
    {
      limit: 50, // Keep last 50 states for undo/redo
      equality: (pastState, currentState) =>
        JSON.stringify(pastState.activeBoats) === JSON.stringify(currentState.activeBoats),
    }
  )
);

// Access temporal state for undo/redo
const { undo, redo, clear, pastStates, futureStates } = useLineupStore.temporal.getState();
```

**Why Zustand here?**
- Frequent synchronous updates during drag-drop (TanStack Query not designed for this)
- Undo/redo requires time-travel state history (zundo middleware <700B)
- Local-first editing with periodic server sync (draft lineups)
- Complex cross-component state (boats, athletes, assignments)

**TanStack Query for Server Sync:**

```typescript
// NEW: src/v2/hooks/useLineups.ts
export function useLineups() {
  return useQuery({
    queryKey: ['lineups'],
    queryFn: () => api.get('/api/v1/lineups').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveLineup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lineup: LineupData) =>
      api.post('/api/v1/lineups', lineup).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });
}
```

**Component Structure:**

```
src/v2/features/lineup/
├── components/
│   ├── LineupBoard.tsx        # Main drag-drop canvas
│   ├── BoatColumn.tsx         # Single boat with seats
│   ├── SeatSlot.tsx           # Droppable seat slot
│   ├── AthleteBank.tsx        # Draggable athlete list
│   ├── LineupToolbar.tsx      # Save, Load, Undo, Redo buttons
│   └── BoatConfigPicker.tsx   # Add 8+, 4+, 2-, etc.
├── hooks/
│   ├── useLineups.ts          # TanStack Query for server data
│   └── useDragDrop.ts         # dnd-kit integration
├── store/
│   └── lineupStore.ts         # Zustand with zundo
└── types/
    └── lineup.ts              # Boat, Seat, Assignment types
```

**Routes:**
- `/app/coach/lineup` - Main lineup builder
- `/app/coach/lineups` - Saved lineups list

**API Endpoints:**
- `GET /api/v1/lineups` - List all lineups (existing)
- `GET /api/v1/lineups/:id` - Get lineup details (existing)
- `POST /api/v1/lineups` - Create lineup (existing)
- `PUT /api/v1/lineups/:id` - Update lineup (existing)
- `DELETE /api/v1/lineups/:id` - Delete lineup (existing)

**Dependencies:**
- `@dnd-kit/core` - Drag-drop (already in V1, reuse)
- `zundo` - Undo/redo middleware for Zustand (<700B)

---

### 2.2 Seat Racing

**Complexity:** MEDIUM - Session-based data with nested structure, ELO calculations

**State Management:** TanStack Query exclusively (no client state needed)

```typescript
// NEW: src/v2/hooks/useSeatRace.ts
export function useSeatRaceSessions() {
  return useQuery({
    queryKey: ['seat-race-sessions'],
    queryFn: () => api.get('/api/v1/seat-races').then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSeatRaceSession(sessionId: string) {
  return useQuery({
    queryKey: ['seat-race-session', sessionId],
    queryFn: () => api.get(`/api/v1/seat-races/${sessionId}`).then(res => res.data),
    enabled: !!sessionId,
  });
}

export function useCreatePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (piece: PieceData) =>
      api.post('/api/v1/seat-races/pieces', piece).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['seat-race-session', variables.sessionId]
      });
    },
  });
}

export function useAthleteRankings() {
  return useQuery({
    queryKey: ['athlete-rankings'],
    queryFn: () => api.get('/api/v1/rankings').then(res => res.data),
    staleTime: 1 * 60 * 1000,
  });
}
```

**Component Structure:**

```
src/v2/features/seat-racing/
├── components/
│   ├── SessionList.tsx         # List of sessions
│   ├── SessionDetail.tsx       # Session with pieces
│   ├── PieceEditor.tsx         # Create/edit piece
│   ├── BoatAssignment.tsx      # Assign athletes to boats
│   ├── ResultsEntry.tsx        # Enter finish times
│   ├── RankingsTable.tsx       # ELO rankings display
│   └── RankingHistory.tsx      # Rating over time chart
├── hooks/
│   └── useSeatRace.ts          # TanStack Query hooks
└── types/
    └── seat-race.ts            # Session, Piece, Boat, Assignment types
```

**Routes:**
- `/app/coach/seat-racing` - Sessions list
- `/app/coach/seat-racing/:sessionId` - Session detail
- `/app/coach/rankings` - Athlete rankings

**API Endpoints (Existing):**
- `GET /api/v1/seat-races` - List sessions
- `POST /api/v1/seat-races` - Create session
- `GET /api/v1/seat-races/:id` - Get session
- `POST /api/v1/seat-races/pieces` - Add piece to session
- `PUT /api/v1/seat-races/pieces/:id` - Update piece results
- `GET /api/v1/rankings` - Get athlete rankings

**Backend Considerations:**
- ELO calculation triggered after piece results entered (server-side)
- AthleteRating model already exists with `ratingType`, `ratingValue`, `confidenceScore`
- Calculation service: `server/services/seatRaceService.js` (already implemented)

---

### 2.3 Athletes Page

**Complexity:** LOW - Standard CRUD with filtering/search

**State Management:** TanStack Query exclusively

```typescript
// NEW: src/v2/hooks/useAthletes.ts
export function useAthletes(options = {}) {
  return useQuery({
    queryKey: ['athletes', options],
    queryFn: () => api.get('/api/v1/athletes', { params: options }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAthleteSearch(query: string) {
  return useQuery({
    queryKey: ['athletes', 'search', query],
    queryFn: () => api.get(`/api/v1/athletes/search?q=${query}`).then(res => res.data),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useCreateAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (athlete: AthleteData) =>
      api.post('/api/v1/athletes', athlete).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
  });
}

export function useUpdateAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AthleteData> }) =>
      api.patch(`/api/v1/athletes/${id}`, data).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['athlete', variables.id], data);
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
  });
}
```

**Component Structure:**

```
src/v2/features/athletes/
├── components/
│   ├── AthletesTable.tsx       # Main data table
│   ├── AthleteRow.tsx          # Table row with actions
│   ├── AthleteForm.tsx         # Create/edit form
│   ├── AthleteFilters.tsx      # Side filter, search
│   ├── BulkImport.tsx          # CSV import
│   └── AthleteCard.tsx         # Card view option
├── hooks/
│   └── useAthletes.ts          # TanStack Query hooks
└── types/
    └── athlete.ts              # Athlete interface
```

**Routes:**
- `/app/coach/athletes` - Athletes list/table
- `/app/coach/athletes/:id` - Athlete detail (optional, or use modal)

**API Endpoints (Existing):**
- `GET /api/v1/athletes` - List athletes
- `POST /api/v1/athletes` - Create athlete
- `GET /api/v1/athletes/:id` - Get athlete
- `PATCH /api/v1/athletes/:id` - Update athlete
- `DELETE /api/v1/athletes/:id` - Delete athlete
- `GET /api/v1/athletes/search?q=` - Search athletes
- `POST /api/v1/athletes/bulk-import` - Bulk import

---

### 2.4 Erg Data

**Complexity:** MEDIUM - Test management with trend visualization

**State Management:** TanStack Query exclusively

```typescript
// NEW: src/v2/hooks/useErgData.ts
export function useErgTests(athleteId?: string) {
  return useQuery({
    queryKey: ['erg-tests', athleteId],
    queryFn: () => api.get('/api/v1/erg-tests', {
      params: athleteId ? { athleteId } : {}
    }).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateErgTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (test: ErgTestData) =>
      api.post('/api/v1/erg-tests', test).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['erg-tests'] });
      queryClient.invalidateQueries({
        queryKey: ['erg-tests', variables.athleteId]
      });
    },
  });
}

export function useErgTestTrends(athleteId: string, testType: string) {
  return useQuery({
    queryKey: ['erg-trends', athleteId, testType],
    queryFn: () => api.get(`/api/v1/erg-tests/trends`, {
      params: { athleteId, testType }
    }).then(res => res.data),
    enabled: !!(athleteId && testType),
    staleTime: 5 * 60 * 1000,
  });
}
```

**Component Structure:**

```
src/v2/features/erg-data/
├── components/
│   ├── ErgTestsTable.tsx       # Tests table with filters
│   ├── TestEntryForm.tsx       # Create/edit test
│   ├── TrendChart.tsx          # Line chart (splits over time)
│   ├── TestTypeFilter.tsx      # 2k, 6k, 30min, etc.
│   └── AthleteSelector.tsx     # Filter by athlete
├── hooks/
│   └── useErgData.ts           # TanStack Query hooks
└── types/
    └── erg-test.ts             # ErgTest interface
```

**Routes:**
- `/app/coach/erg-data` - Tests table
- `/app/coach/erg-data/trends` - Trend visualization
- `/app/me/erg-data` - Athlete's own data

**API Endpoints:**
- `GET /api/v1/erg-tests` - List tests (existing, needs v1 endpoint)
- `POST /api/v1/erg-tests` - Create test (existing)
- `GET /api/v1/erg-tests/trends` - Get trend data (NEW)
- `DELETE /api/v1/erg-tests/:id` - Delete test (NEW)

**Visualization:**
- Use Recharts (already in package.json, V1 uses it)
- Line chart: Date (x-axis) vs Split Time (y-axis)
- Multiple series for different test types

---

### 2.5 Training Plans

**Complexity:** HIGH - Calendar integration, workout assignments, templating

**State Management:** TanStack Query + react-big-calendar

```typescript
// NEW: src/v2/hooks/useTrainingPlans.ts
export function useCalendarEvents(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['calendar-events', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => api.get('/api/v1/calendar/events', {
      params: { startDate, endDate }
    }).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: CalendarEventData) =>
      api.post('/api/v1/calendar/events', event).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

export function useWorkoutAssignments() {
  return useQuery({
    queryKey: ['workout-assignments'],
    queryFn: () => api.get('/api/v1/workout-assignments').then(res => res.data),
    staleTime: 1 * 60 * 1000,
  });
}
```

**Component Structure:**

```
src/v2/features/training-plans/
├── components/
│   ├── PlanCalendar.tsx        # react-big-calendar wrapper
│   ├── EventModal.tsx          # Create/edit event
│   ├── WorkoutTemplates.tsx    # Reusable workout templates
│   ├── AssignmentPanel.tsx     # Assign to athletes
│   └── EventTypeSelector.tsx   # erg-test, water, lift, etc.
├── hooks/
│   └── useTrainingPlans.ts     # TanStack Query hooks
└── types/
    └── training-plan.ts        # CalendarEvent, WorkoutAssignment types
```

**Routes:**
- `/app/coach/training` - Calendar view
- `/app/me/training` - Athlete's assigned workouts

**API Endpoints:**
- `GET /api/v1/calendar/events` - Get events (CalendarEvent model exists)
- `POST /api/v1/calendar/events` - Create event (NEW)
- `PUT /api/v1/calendar/events/:id` - Update event (NEW)
- `DELETE /api/v1/calendar/events/:id` - Delete event (NEW)
- `GET /api/v1/workout-assignments` - Get assignments (NEW)
- `POST /api/v1/workout-assignments` - Assign workout (NEW)

**Calendar Library:**
- Use **react-big-calendar** (free, MIT license, flexible)
- Alternative: FullCalendar (has premium features but core is free)
- react-big-calendar pros: Free, no licensing, community support
- react-big-calendar cons: Requires custom event editor (build EventModal)

---

### 2.6 Racing/Regattas

**Complexity:** MEDIUM - Event management with hierarchical structure (Regatta > Race > Result)

**State Management:** TanStack Query exclusively

```typescript
// NEW: src/v2/hooks/useRegattas.ts
export function useRegattas() {
  return useQuery({
    queryKey: ['regattas'],
    queryFn: () => api.get('/api/v1/regattas').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegatta(regattaId: string) {
  return useQuery({
    queryKey: ['regatta', regattaId],
    queryFn: () => api.get(`/api/v1/regattas/${regattaId}`).then(res => res.data),
    enabled: !!regattaId,
  });
}

export function useCreateRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (race: RaceData) =>
      api.post('/api/v1/races', race).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['regatta', variables.regattaId]
      });
    },
  });
}
```

**Component Structure:**

```
src/v2/features/racing/
├── components/
│   ├── RegattasList.tsx        # Upcoming/past regattas
│   ├── RegattaDetail.tsx       # Races list for regatta
│   ├── RaceEditor.tsx          # Create/edit race
│   ├── ResultsEntry.tsx        # Enter finish times
│   └── ResultsTable.tsx        # Display race results
├── hooks/
│   └── useRegattas.ts          # TanStack Query hooks
└── types/
    └── regatta.ts              # Regatta, Race, RaceResult types
```

**Routes:**
- `/app/coach/racing` - Regattas list
- `/app/coach/racing/:regattaId` - Regatta detail
- `/app/me/racing` - Athlete's upcoming races

**API Endpoints:**
- `GET /api/v1/regattas` - List regattas (Regatta model exists)
- `POST /api/v1/regattas` - Create regatta (NEW)
- `GET /api/v1/regattas/:id` - Get regatta (NEW)
- `POST /api/v1/races` - Create race (NEW)
- `POST /api/v1/race-results` - Add result (NEW)

---

## 3. Integration Strategy

### 3.1 Navigation Updates

**Update `src/v2/stores/contextStore.ts` CONTEXT_CONFIGS:**

```typescript
export const CONTEXT_CONFIGS: ContextConfig[] = [
  {
    id: 'me',
    label: 'Me',
    icon: 'user',
    shortcut: '⌘1',
    navItems: [
      { to: '/app/me', label: 'Dashboard', icon: 'home' },
      { to: '/app/me/training', label: 'My Training', icon: 'calendar' },
      { to: '/app/me/erg-data', label: 'Erg Data', icon: 'chart' },
      { to: '/app/me/racing', label: 'My Races', icon: 'trophy' },
    ],
  },
  {
    id: 'coach',
    label: 'Coach',
    icon: 'users',
    shortcut: '⌘2',
    navItems: [
      { to: '/app/coach/whiteboard', label: 'Whiteboard', icon: 'clipboard' },
      { to: '/app/coach/athletes', label: 'Athletes', icon: 'users' },
      { to: '/app/coach/lineup', label: 'Lineup Builder', icon: 'boat' },
      { to: '/app/coach/seat-racing', label: 'Seat Racing', icon: 'timer' },
      { to: '/app/coach/erg-data', label: 'Erg Data', icon: 'chart' },
      { to: '/app/coach/training', label: 'Training Plans', icon: 'calendar' },
      { to: '/app/coach/racing', label: 'Racing', icon: 'trophy' },
      { to: '/app/coach/fleet', label: 'Fleet', icon: 'boat' },
      { to: '/app/coach/availability', label: 'Availability', icon: 'calendar' },
    ],
  },
  // ... admin config unchanged
];
```

### 3.2 Route Additions

**Update `src/App.jsx` ShellLayout routes:**

```jsx
<Route element={<ShellLayout />}>
  {/* Existing routes */}
  <Route index element={<MeDashboard />} />
  <Route path="me" element={<MeDashboard />} />
  <Route path="coach/whiteboard" element={<CoachWhiteboard />} />
  <Route path="coach/fleet" element={<CoachFleet />} />
  <Route path="coach/availability" element={<CoachAvailability />} />

  {/* NEW: Rowing features */}
  <Route path="coach/athletes" element={<AthletesPage />} />
  <Route path="coach/lineup" element={<LineupBuilderPage />} />
  <Route path="coach/seat-racing" element={<SeatRacingPage />} />
  <Route path="coach/seat-racing/:sessionId" element={<SessionDetailPage />} />
  <Route path="coach/rankings" element={<RankingsPage />} />
  <Route path="coach/erg-data" element={<ErgDataPage />} />
  <Route path="coach/training" element={<TrainingPlansPage />} />
  <Route path="coach/racing" element={<RacingPage />} />
  <Route path="coach/racing/:regattaId" element={<RegattaDetailPage />} />

  <Route path="me/training" element={<MyTrainingPage />} />
  <Route path="me/erg-data" element={<MyErgDataPage />} />
  <Route path="me/racing" element={<MyRacingPage />} />
</Route>
```

### 3.3 API Endpoints Summary

**New Endpoints Needed:**

```
# Erg Data
GET    /api/v1/erg-tests/trends
DELETE /api/v1/erg-tests/:id

# Calendar/Training Plans
POST   /api/v1/calendar/events
PUT    /api/v1/calendar/events/:id
DELETE /api/v1/calendar/events/:id
GET    /api/v1/workout-assignments
POST   /api/v1/workout-assignments

# Racing/Regattas
POST   /api/v1/regattas
GET    /api/v1/regattas/:id
POST   /api/v1/races
POST   /api/v1/race-results
```

**Existing Endpoints (Reuse):**

```
# Athletes
GET    /api/v1/athletes
POST   /api/v1/athletes
GET    /api/v1/athletes/:id
PATCH  /api/v1/athletes/:id
DELETE /api/v1/athletes/:id
GET    /api/v1/athletes/search
POST   /api/v1/athletes/bulk-import

# Lineups
GET    /api/v1/lineups
POST   /api/v1/lineups
GET    /api/v1/lineups/:id
PUT    /api/v1/lineups/:id
DELETE /api/v1/lineups/:id

# Seat Racing
GET    /api/v1/seat-races
POST   /api/v1/seat-races
GET    /api/v1/seat-races/:id
POST   /api/v1/seat-races/pieces
PUT    /api/v1/seat-races/pieces/:id
GET    /api/v1/rankings

# Erg Tests (V1, migrate to v1 namespace)
GET    /api/erg-tests
POST   /api/erg-tests
GET    /api/erg-tests/:id
```

---

## 4. Build Order & Dependencies

### Phase 1: Foundation (No Dependencies)
**Build first, enables other features:**

1. **Athletes Page** - Roster CRUD, filtering, search
   - No dependencies on other features
   - Required by: Lineup Builder, Seat Racing, Erg Data
   - Estimated complexity: LOW
   - Duration: 1-2 days

2. **Erg Data** - Test management, trend visualization
   - No dependencies (athlete selection uses API)
   - Required by: Rankings (optional), Training Plans (contextual)
   - Estimated complexity: MEDIUM
   - Duration: 2-3 days

### Phase 2: Complex Client State (Depends on Athletes)
**Build after Phase 1 foundation:**

3. **Lineup Builder** - Drag-drop, undo/redo, boat configs
   - Depends on: Athletes (athlete pool)
   - Required by: Racing (lineup assignment)
   - Estimated complexity: HIGH
   - Duration: 4-5 days
   - **Technical complexity:** Zustand store with zundo, dnd-kit integration, multi-boat state

### Phase 3: Analysis Features (Depends on Athletes)
**Build after Phase 1 foundation:**

4. **Seat Racing** - Sessions, pieces, ELO calculations
   - Depends on: Athletes (assignments)
   - Optionally enhances: Rankings display
   - Estimated complexity: MEDIUM
   - Duration: 3-4 days
   - **Backend complexity:** ELO calculation service (already exists)

### Phase 4: Scheduling Features (Depends on Athletes)
**Build after Phase 1 foundation:**

5. **Training Plans** - Calendar, assignments
   - Depends on: Athletes (assignments)
   - Optionally integrates: Erg Data (test scheduling)
   - Estimated complexity: HIGH
   - Duration: 4-5 days
   - **Integration complexity:** Calendar library, event management

### Phase 5: Competition Features (Depends on Lineup Builder)
**Build last, ties everything together:**

6. **Racing/Regattas** - Event management, results
   - Depends on: Lineup Builder (lineup assignment to races)
   - Optionally integrates: Seat Racing (rankings context)
   - Estimated complexity: MEDIUM
   - Duration: 3-4 days

**Total Estimated Duration:** 17-23 days (3.5-4.5 weeks)

---

## 5. Component Organization Pattern

### Feature-Based Structure (Recommended)

```
src/v2/
├── features/               # NEW: Feature-based organization
│   ├── athletes/
│   │   ├── components/     # Feature-specific components
│   │   ├── hooks/          # Feature-specific hooks
│   │   ├── pages/          # Feature pages (if multiple)
│   │   └── types/          # Feature types
│   ├── lineup/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/          # lineupStore.ts (if needed)
│   │   └── types/
│   ├── seat-racing/
│   ├── erg-data/
│   ├── training-plans/
│   └── racing/
├── components/             # EXISTING: Shared components
│   ├── shell/
│   ├── common/
│   └── ...
├── hooks/                  # EXISTING: Shared hooks
├── layouts/                # EXISTING: Layouts
├── pages/                  # EXISTING: Top-level pages (or move to features)
├── stores/                 # EXISTING: Global stores (context, prefs)
└── utils/                  # EXISTING: Shared utilities
```

**Migration Strategy:**
- Keep existing `components/`, `hooks/`, `pages/` for shared/shell components
- Add new `features/` directory for rowing features
- Each feature is self-contained: components, hooks, types together
- Promotes: Code colocation, clear boundaries, easier testing

**When to put something in `features/` vs `components/`:**
- Feature-specific → `features/[feature-name]/components/`
- Used by 2+ features → `components/common/`
- Shell/navigation → `components/shell/`

---

## 6. Anti-Patterns to Avoid

### 6.1 Over-Using Zustand

**Problem:** Adding Zustand stores for every feature
**Why it's bad:** TanStack Query handles 80% of state needs more elegantly (caching, invalidation, loading states)

**When to use Zustand:**
- ✅ Complex client state with frequent synchronous updates (Lineup Builder drag-drop)
- ✅ Time-travel/undo-redo requirements (Lineup Builder history)
- ✅ Cross-feature global state (context, theme, user prefs)

**When to use TanStack Query:**
- ✅ Server data (athletes, tests, sessions, events)
- ✅ CRUD operations with optimistic updates
- ✅ Paginated/infinite scroll data
- ✅ Search/filter results

### 6.2 Mixing V1 and V2 Components

**Problem:** Importing V1 components into V2 pages
**Why it's bad:** Breaks CSS isolation, design inconsistency, shared state conflicts

**Solution:**
- Use V1 stores via `useSharedStores` (auth, settings only)
- Rebuild V1 components in V2 design language if needed
- Keep V1 and V2 component trees separate

### 6.3 Creating Generic "God Components"

**Problem:** Building `<GenericTable />` used by all features
**Why it's bad:** Over-abstraction, hard to customize, feature coupling

**Solution:**
- Start with feature-specific components
- Extract to shared components only after 3+ features use similar patterns
- Prefer composition over configuration

### 6.4 Skipping Optimistic Updates

**Problem:** Waiting for server response before UI updates
**Why it's bad:** Sluggish UX, perceived latency

**Solution:**
- Use TanStack Query `onMutate` for optimistic updates
- Roll back on error with `onError`

```typescript
const mutation = useMutation({
  mutationFn: updateAthlete,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['athlete', id] });
    const previous = queryClient.getQueryData(['athlete', id]);
    queryClient.setQueryData(['athlete', id], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['athlete', id], context.previous);
  },
});
```

---

## 7. Testing Strategy

### Component Testing

```typescript
// Example: Athletes table component test
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AthletesTable } from '@v2/features/athletes/components/AthletesTable';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('displays athletes list', async () => {
  render(<AthletesTable />, { wrapper: createWrapper() });
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Store Testing (Lineup Builder)

```typescript
// Example: Lineup store test
import { renderHook, act } from '@testing-library/react';
import { useLineupStore } from '@v2/features/lineup/store/lineupStore';

test('adds boat to lineup', () => {
  const { result } = renderHook(() => useLineupStore());

  act(() => {
    result.current.addBoat({
      id: '8+',
      name: 'Varsity 8+',
      numSeats: 8,
      hasCoxswain: true
    });
  });

  expect(result.current.activeBoats).toHaveLength(1);
  expect(result.current.activeBoats[0].name).toBe('Varsity 8+');
});

test('undo removes last action', () => {
  const { result } = renderHook(() => useLineupStore());
  const { undo } = result.current.temporal.getState();

  act(() => {
    result.current.addBoat({ id: '4+', name: '4+', numSeats: 4, hasCoxswain: true });
  });
  expect(result.current.activeBoats).toHaveLength(1);

  act(() => undo());
  expect(result.current.activeBoats).toHaveLength(0);
});
```

---

## 8. Performance Considerations

### Code Splitting

- **Lazy load pages:** All feature pages lazy-loaded via React.lazy
- **Route-based splitting:** Automatic with Vite's dynamic imports
- **Component-level splitting:** Heavy components (calendar, charts) lazy-loaded

```tsx
const TrainingCalendar = lazy(() => import('@v2/features/training-plans/components/PlanCalendar'));

function TrainingPlansPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TrainingCalendar />
    </Suspense>
  );
}
```

### Query Optimization

- **Prefetching:** Prefetch related data on hover/mount
- **Stale time:** Set appropriate stale times (5min for athletes, 1min for rankings)
- **Background refetch:** Enable for critical data (rankings, calendar)

```typescript
// Prefetch athletes when hovering over lineup builder nav
function LineupNavItem() {
  const queryClient = useQueryClient();

  return (
    <NavLink
      to="/app/coach/lineup"
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ['athletes'],
          queryFn: fetchAthletes,
        });
      }}
    >
      Lineup Builder
    </NavLink>
  );
}
```

### Bundle Size

- **Lineup Builder:** ~50KB (zundo + dnd-kit already in V1)
- **Training Plans:** ~80KB (react-big-calendar)
- **Erg Data:** ~30KB (Recharts already in V1)
- **Other features:** ~10-20KB each

**Total added:** ~150-200KB gzipped for all rowing features

---

## 9. Migration from V1

### V1 Features to V2 Mapping

| V1 Feature | V1 Location | V2 Equivalent | Migration Notes |
|------------|-------------|---------------|-----------------|
| Lineup Builder | `/lineup` | `/app/coach/lineup` | Rebuild with V2 design, keep lineupStore pattern |
| Athletes Page | `/athletes` | `/app/coach/athletes` | Rebuild table, add filtering |
| Erg Data | `/erg-data` | `/app/coach/erg-data` | Rebuild with TanStack Query |
| Seat Racing | `/seat-racing` | `/app/coach/seat-racing` | Rebuild with V2 design |
| Racing | `/racing` | `/app/coach/racing` | Rebuild with V2 design |
| Training Plans | `/training` | `/app/coach/training` | Rebuild with react-big-calendar |

### Shared Data Stores

**V1 stores accessible in V2:**
- `authStore` - Via `useV2Auth()` hook
- `settingsStore` - Via `useV2Settings()` hook

**Migration strategy:**
- V2 pages use TanStack Query for server data (not V1 stores)
- V1 stores only for auth/settings during transition
- Post-flip: Migrate V1 stores to TanStack Query or V2 Zustand stores

---

## 10. Confidence Assessment

| Area | Confidence | Source | Notes |
|------|------------|--------|-------|
| State Management Pattern | HIGH | [Official TanStack Query docs](https://tanstack.com/query/v4/docs/framework/react/guides/does-this-replace-client-state), [Zustand vs TanStack Query article](https://helloadel.com/blog/zustand-vs-tanstack-query-maybe-both/) | Clear separation: TanStack Query for server state, Zustand for complex client state |
| Undo/Redo Pattern | HIGH | [Zundo GitHub](https://github.com/charkour/zundo), [Zustand-Travel](https://github.com/mutativejs/zustand-travel) | Zundo is official Zustand middleware, <700B, battle-tested |
| Component Organization | HIGH | [React Folder Structure 2025](https://www.robinwieruch.de/react-folder-structure/), [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) | Feature-based organization is 2025-2026 best practice for large apps |
| Calendar Library | MEDIUM | [React calendar components 2025](https://www.builder.io/blog/best-react-calendar-component-ai), [FullCalendar vs Big Calendar](https://bryntum.com/blog/react-fullcalendar-vs-big-calendar/) | react-big-calendar is free but requires custom event editor |
| ELO Calculation | HIGH | [ELO rating system](https://en.wikipedia.org/wiki/Elo_rating_system), existing `seatRaceService.js` | Backend service already implemented, standard algorithm |
| Build Order | MEDIUM | Based on existing Prisma schema dependencies | Athletes → Lineup/Seat Racing → Racing is logical dependency chain |

**Overall Confidence: HIGH**

---

## Sources

- [State Management in 2026: Redux, Context API, and Modern Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)
- [Federated State Done Right: Zustand, TanStack Query, and the Patterns That Actually Work](https://dev.to/martinrojas/federated-state-done-right-zustand-tanstack-query-and-the-patterns-that-actually-work-27c0)
- [Zustand vs. RTK Query vs. TanStack Query: Unpacking the React State Management Toolbox](https://medium.com/@imranrafeek/zustand-vs-rtk-query-vs-tanstack-query-unpacking-the-react-state-management-toolbox-d47893479742)
- [Does TanStack Query replace Redux, MobX or other global state managers?](https://tanstack.com/query/v4/docs/framework/react/guides/does-this-replace-client-state)
- [Zustand vs Tanstack Query: Maybe Both?](https://helloadel.com/blog/zustand-vs-tanstack-query-maybe-both/)
- [Zundo - Undo/redo middleware for Zustand](https://github.com/charkour/zundo)
- [Zustand-Travel - High-performance undo/redo middleware](https://github.com/mutativejs/zustand-travel)
- [React Folder Structure in 5 Steps [2025]](https://www.robinwieruch.de/react-folder-structure/)
- [Bulletproof React - Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [React FullCalendar vs Big Calendar](https://bryntum.com/blog/react-fullcalendar-vs-big-calendar/)
- [React calendar components: 6 best libraries for 2025](https://www.builder.io/blog/best-react-calendar-component-ai)
- [ELO rating system - Wikipedia](https://en.wikipedia.org/wiki/Elo_rating_system)
- [Elo Ratings: The Ultimate Sports Ranking System](https://dubstat.com/elo-ratings-the-ultimate-sports-ranking-system/)
