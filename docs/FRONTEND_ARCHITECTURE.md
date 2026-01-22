# RowLab Frontend Architecture

**Version:** 1.0.0
**Last Updated:** 2026-01-22
**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Zustand 4, React Router 6

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Routing System](#routing-system)
4. [State Management](#state-management)
5. [Component Architecture](#component-architecture)
6. [Authentication Flow](#authentication-flow)
7. [API Integration](#api-integration)
8. [Design System](#design-system)
9. [Performance Optimizations](#performance-optimizations)
10. [Development Guidelines](#development-guidelines)

---

## Overview

RowLab is a modern React-based web application for managing rowing team lineups, athlete data, training plans, and race results. The frontend follows a component-driven architecture with centralized state management using Zustand.

### Key Technologies

- **Build Tool:** Vite 5 - Fast HMR and optimized builds
- **UI Framework:** React 18 - Component-based UI with hooks
- **Routing:** React Router 6 - Client-side routing with lazy loading
- **State:** Zustand 4 - Lightweight state management
- **Styling:** Tailwind CSS 3 - Utility-first CSS framework
- **Animation:** Framer Motion - Smooth transitions and animations
- **3D Graphics:** React Three Fiber - 3D boat visualization
- **Charts:** Recharts - Data visualization
- **Forms:** React Hook Form - Form validation

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Card, Input, etc.)
│   ├── compound/       # Compound components (Sidebar, etc.)
│   ├── Layout/         # Layout components (TopNav, MobileDock, etc.)
│   ├── AI/             # AI assistant components
│   ├── Auth/           # Authentication modals and forms
│   ├── Dashboard/      # Dashboard widgets
│   ├── AthleteBank/    # Athlete selection components
│   ├── BoatDisplay/    # Boat visualization
│   ├── Charts/         # Data visualization charts
│   ├── Communication/  # Team announcements
│   ├── Concept2/       # Concept2 integration
│   ├── Coxswain/       # Coxswain-specific views
│   ├── ErgData/        # Erg test data components
│   ├── Racing/         # Regatta and race results
│   ├── SeatRacing/     # Seat racing tools
│   ├── TrainingPlans/  # Training plan management
│   ├── 3D/             # 3D boat models (React Three Fiber)
│   └── ...
├── pages/              # Page-level components
│   ├── auth/           # Auth pages (Login, Register, InviteClaimPage)
│   ├── Dashboard.jsx
│   ├── AthleteDashboard.jsx
│   ├── LineupBuilder.jsx
│   ├── AthletesPage.jsx
│   ├── ErgDataPage.jsx
│   ├── AnalyticsPage.jsx
│   ├── TrainingPlanPage.jsx
│   ├── RacingPage.jsx
│   ├── SeatRacingPage.jsx
│   ├── CommunicationPage.jsx
│   ├── AdvancedPage.jsx
│   ├── SettingsPage.jsx
│   ├── CoxswainView.jsx
│   └── LandingPage.jsx
├── store/              # Zustand stores (state management)
│   ├── authStore.js            # Authentication & team switching
│   ├── ergDataStore.js         # Erg test data
│   ├── trainingPlanStore.js    # Training plans
│   ├── lineupStore.js          # Lineup builder state (with undo/redo)
│   ├── announcementStore.js    # Team announcements
│   ├── shellStore.js           # Boats/shells
│   ├── seatRaceStore.js        # Seat racing data
│   ├── regattaStore.js         # Race results
│   ├── rankingsStore.js        # Athlete rankings
│   ├── aiLineupStore.js        # AI lineup suggestions
│   ├── settingsStore.js        # User/team settings
│   ├── subscriptionStore.js    # Billing/subscription
│   ├── boatConfigStore.js      # Boat configurations
│   ├── csvImportStore.js       # CSV import state
│   ├── telemetryStore.js       # Telemetry data
│   ├── teamRankingsStore.js    # Team rankings
│   ├── combinedScoringStore.js # Combined scoring
│   └── undoMiddleware.js       # Undo/redo middleware
├── hooks/              # Custom React hooks
│   ├── useAuth.js              # Auth wrapper with navigation
│   ├── useDarkMode.js          # Dark mode toggle
│   ├── useMediaQuery.js        # Responsive breakpoints
│   └── useLineupKeyboardShortcuts.js
├── layouts/            # Layout wrapper components
│   ├── AppLayout.jsx           # Main app layout with sidebar
│   └── DockNavigation.jsx      # Mobile dock navigation
├── services/           # API service modules
│   ├── aiService.js            # AI API calls
│   ├── concept2Service.js      # Concept2 API integration
│   ├── stravaService.js        # Strava API integration
│   ├── fitImportService.js     # FIT file import
│   └── lineupExportService.js  # Lineup export utilities
├── utils/              # Utility functions
│   ├── api.js                  # API response handlers
│   ├── csvParser.js            # CSV parsing utilities
│   ├── fileLoader.js           # File loading helpers
│   ├── pdfExport.js            # PDF export
│   ├── boatConfig.js           # Boat configuration helpers
│   └── errorUtils.js           # Error handling utilities
├── theme/              # Design system tokens
│   ├── index.js
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   ├── shadows.js
│   └── animations.js
├── App.jsx             # Root component with routing
├── index.jsx           # Entry point
└── App.css             # Global styles
```

### File Organization Principles

1. **Components by Feature:** Components grouped by feature domain (Racing, Coxswain, etc.)
2. **Co-location:** Related files kept together
3. **Separation of Concerns:** Store, components, services separated
4. **Index Exports:** Use index.js for cleaner imports

---

## Routing System

### Route Configuration

Routes are defined in `/src/App.jsx` using React Router 6 with lazy loading for code splitting.

#### Public Routes

```jsx
/ → LandingPage (public marketing page)
/login → LoginPage
/register → RegisterPage
/join → InviteClaimPage (team invite claim)
```

#### Protected Routes (under /app)

All routes under `/app/*` are protected and require authentication via `AppLayout`:

```jsx
/app → DashboardRouter (role-based dashboard routing)
/app/athlete-dashboard → AthleteDashboard
/app/athletes → AthletesPage (team roster)
/app/athletes/:id → AthleteDashboard (specific athlete)
/app/lineup → LineupBuilder (drag-and-drop lineup creation)
/app/boat-view → BoatViewPage (3D boat visualization)
/app/erg → ErgDataPage (erg test data)
/app/analytics → AnalyticsPage
/app/seat-racing → SeatRacingPage
/app/training-plans → TrainingPlanPage
/app/racing → RacingPage (regatta results)
/app/communication → CommunicationPage (team announcements)
/app/advanced → AdvancedPage (telemetry, combined scoring)
/app/settings → SettingsPage
/app/billing → Redirects to /app/settings?tab=billing
/app/coxswain → CoxswainView (coxswain-specific interface)
```

#### Integration Callbacks

```jsx
/concept2/callback → Concept2CallbackPage (OAuth callback)
/settings/integrations → Concept2CallbackPage (settings redirect)
```

### Lazy Loading

All pages are lazy-loaded using React's `lazy()` and `Suspense`:

```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

**Benefits:**
- Reduced initial bundle size
- Faster time-to-interactive
- Better performance on slow connections

### Error Handling

- **404 Fallback:** Custom 404 page with rowing theme
- **Error Boundary:** Global ErrorBoundary catches rendering errors

---

## State Management

RowLab uses **Zustand** for state management - a lightweight, hook-based alternative to Redux.

### Store Architecture

Each feature has its own Zustand store located in `/src/store/`. Stores follow a consistent pattern:

```javascript
const useStore = create((set, get) => ({
  // State
  data: [],
  loading: false,
  error: null,

  // Actions
  fetchData: async () => { /* ... */ },
  createItem: async (item) => { /* ... */ },
  updateItem: async (id, updates) => { /* ... */ },
  deleteItem: async (id) => { /* ... */ },

  // Helpers
  clearError: () => set({ error: null }),
}));
```

### Core Stores

#### 1. authStore (`/src/store/authStore.js`)

**Purpose:** Authentication, user session, team switching

**Key Features:**
- JWT access token (in-memory)
- Refresh token (HTTP-only cookie)
- Multi-team support
- Automatic token refresh on 401

**State:**
```javascript
{
  user: { id, email, name, isAdmin },
  teams: [{ id, name, slug, role }],
  activeTeamId: string,
  activeTeamRole: 'OWNER' | 'COACH' | 'ATHLETE' | 'COXSWAIN',
  activeTeamIsCoxswain: boolean,
  accessToken: string (not persisted),
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null
}
```

**Key Actions:**
- `login(email, password)` - Login and set session
- `register({ email, password, name })` - Register new user
- `logout()` - Clear session and revoke tokens
- `refreshAccessToken()` - Refresh access token using refresh token cookie
- `switchTeam(teamId)` - Switch active team context
- `createTeam({ name, isPublic })` - Create new team
- `joinTeamByCode(code)` - Join team via invite code
- `authenticatedFetch(url, options)` - Fetch with auto token refresh

**Token Flow:**
1. Login → Access token (memory) + Refresh token (HTTP-only cookie)
2. API request → Include access token in Authorization header
3. 401 response → Refresh access token using refresh token
4. Retry request with new access token

---

#### 2. ergDataStore (`/src/store/ergDataStore.js`)

**Purpose:** Erg test data and workout management

**State:**
```javascript
{
  ergTests: [],
  workouts: [],
  leaderboard: [],
  loading: boolean,
  error: string | null,
  filters: { testType, athleteId, fromDate, toDate }
}
```

**Key Actions:**
- `fetchErgTests(filters)` - Get erg tests with filters
- `fetchLeaderboard(testType, limit)` - Get team leaderboard
- `createErgTest(testData)` - Add new erg test
- `updateErgTest(testId, updates)` - Update erg test
- `deleteErgTest(testId)` - Delete erg test
- `setFilters(filters)` - Update query filters

---

#### 3. trainingPlanStore (`/src/store/trainingPlanStore.js`)

**Purpose:** Training plan CRUD, workout management, athlete assignments

**State:**
```javascript
{
  plans: [],
  selectedPlan: object | null,
  selectedWorkout: object | null,
  templates: [],
  athletePlans: [],
  trainingLoad: object | null,
  loading: boolean,
  error: string | null
}
```

**Key Actions:**
- `fetchPlans(filters)` - Get training plans
- `createPlan(planData)` - Create new plan
- `updatePlan(planId, updates)` - Update plan
- `deletePlan(planId)` - Delete plan
- `addWorkout(planId, workoutData)` - Add workout to plan
- `updateWorkout(planId, workoutId, updates)` - Update workout
- `deleteWorkout(planId, workoutId)` - Delete workout
- `assignToAthletes(planId, athleteIds, dateRange)` - Assign plan to athletes
- `recordCompletion(planId, workoutId, athleteId, data)` - Record workout completion
- `fetchTrainingLoad(athleteId, startDate, endDate)` - Get training load metrics

---

#### 4. lineupStore (`/src/store/lineupStore.js`)

**Purpose:** Lineup builder with drag-and-drop, undo/redo support

**Special Features:**
- **Undo/Redo:** Powered by `undoMiddleware` (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- Tracks only `activeBoats` for undo/redo (50 state history limit)

**State:**
```javascript
{
  athletes: [],
  boatConfigs: [],
  shells: [],
  activeBoats: [],
  ergData: [],
  lineupName: string,
  selectedAthlete: object | null,
  selectedSeats: [{ boatId, seatNumber, isCoxswain }],
  headshotMap: Map,
  currentLineupId: string | null
}
```

**Key Actions:**
- `addBoat(boatConfig, shellName)` - Add boat to workspace
- `removeBoat(boatId)` - Remove boat
- `assignToSeat(boatId, seatNumber, athlete)` - Assign athlete to seat
- `assignToCoxswain(boatId, athlete)` - Assign coxswain
- `swapAthletes()` - Swap two selected seats
- `toggleSeatSelection(boatId, seatNumber, isCoxswain)` - Select seat for swapping
- `saveLineupToAPI(name, notes)` - Save lineup to database
- `fetchLineups()` - Load saved lineups
- `loadLineupFromData(lineup, athletes, boatConfigs, shells)` - Restore lineup
- `undo()` - Undo last change (auto-provided by middleware)
- `redo()` - Redo last undone change (auto-provided by middleware)

---

#### 5. announcementStore (`/src/store/announcementStore.js`)

**Purpose:** Team announcements with read tracking

**State:**
```javascript
{
  announcements: [],
  selectedAnnouncement: object | null,
  unreadCount: number,
  loading: boolean,
  error: string | null,
  filter: 'all' | 'unread' | 'important' | 'urgent'
}
```

**Key Actions:**
- `fetchAnnouncements(params)` - Get announcements with filters
- `createAnnouncement(data)` - Create announcement
- `updateAnnouncement(id, data)` - Update announcement
- `deleteAnnouncement(id)` - Delete announcement
- `markAsRead(id)` - Mark as read
- `markAllAsRead()` - Mark all as read
- `togglePin(id)` - Pin/unpin announcement

---

#### 6. shellStore (`/src/store/shellStore.js`)

**Purpose:** Manage physical boats/shells

**State:**
```javascript
{
  shells: [],
  groupedShells: { '8+': [...], '4-': [...] },
  loading: boolean,
  error: string | null
}
```

**Key Actions:**
- `fetchShells()` - Get all shells
- `fetchGroupedShells()` - Get shells grouped by boat class
- `createShell(data)` - Add new shell
- `updateShell(shellId, updates)` - Update shell
- `deleteShell(shellId)` - Delete shell

---

#### 7. Other Stores

- **seatRaceStore** - Seat racing sessions and results
- **regattaStore** - Regatta and race management
- **rankingsStore** - Athlete power rankings
- **aiLineupStore** - AI lineup suggestions
- **settingsStore** - User preferences and feature flags
- **subscriptionStore** - Billing and subscription status
- **boatConfigStore** - Boat class configurations
- **csvImportStore** - CSV import wizard state
- **telemetryStore** - NK telemetry data
- **teamRankingsStore** - Inter-team rankings
- **combinedScoringStore** - Combined ranking algorithms

---

### Undo/Redo Middleware

The `undoMiddleware` wraps stores to provide undo/redo functionality:

**Usage:**
```javascript
const useLineupStore = create(
  undoMiddleware({
    trackedKeys: ['activeBoats'],
    historyLimit: 50
  })((set, get) => ({ /* store definition */ }))
);
```

**Auto-provided actions:**
- `undo()` - Revert to previous state
- `redo()` - Reapply undone change
- `checkpoint()` - Force history checkpoint
- `clearHistory()` - Clear undo/redo history

---

## Component Architecture

### Component Patterns

#### 1. Page Components (`/src/pages/`)

Page components are top-level route components that:
- Fetch data on mount
- Compose multiple feature components
- Handle page-level state
- Implement page-specific layouts

**Example:**
```jsx
function AthletesPage() {
  const { athletes, loading, fetchAthletes } = useAthleteStore();

  useEffect(() => {
    fetchAthletes();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6">
      <AthleteTable athletes={athletes} />
    </div>
  );
}
```

---

#### 2. Feature Components (`/src/components/[Feature]/`)

Organized by feature domain:

- **Dashboard/** - Dashboard widgets (PersonalBests, TrainingVolumeChart, PMCChart)
- **AthleteBank/** - Athlete selection and cards
- **BoatDisplay/** - Boat visualization components
- **Racing/** - Regatta list, race entry forms
- **SeatRacing/** - Seat race session management
- **TrainingPlans/** - Plan creation, workout builder
- **Communication/** - Announcement cards and lists
- **Coxswain/** - Coxswain-specific boat roster, workout entry

---

#### 3. UI Components (`/src/components/ui/`)

Reusable, unstyled (or minimally styled) base components:

- **Button.jsx** - Primary, secondary, ghost, danger variants
- **Card.jsx** - Container with glass effect
- **Input.jsx** - Text inputs with validation states
- **Badge.jsx** - Status badges
- **Typography.jsx** - Text components (Heading, Body, Label)

**Design Principles:**
- Accept `className` for Tailwind overrides
- Use `forwardRef` for ref forwarding
- Support variants via props
- Minimal styling - composable with Tailwind

**Example:**
```jsx
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Save Lineup
</Button>
```

---

#### 4. Compound Components (`/src/components/compound/`)

Complex components composed of multiple parts:

- **Sidebar** - App navigation sidebar
- **Modal** - Accessible modal dialogs
- **Dropdown** - Accessible dropdown menus

---

#### 5. Layout Components (`/src/components/Layout/`)

Layout-level components:

- **TopNav** - Top navigation bar with breadcrumbs
- **MobileDock** - Bottom mobile navigation
- **Breadcrumbs** - Navigation breadcrumbs
- **WorkspaceSwitcher** - Team switcher dropdown
- **CommandPalette** - Cmd+K quick actions
- **CollaborationPresence** - Real-time user presence indicators

---

### AppLayout Component

`/src/layouts/AppLayout.jsx` is the main authenticated layout wrapper:

**Responsibilities:**
1. Authentication check (redirects to login if unauthenticated)
2. Load global data (athletes, boats, shells, erg data)
3. Render sidebar, top nav, mobile dock
4. Provide context for modals (login, admin panel, AI assistant)
5. Handle command palette (Cmd+K)
6. Real-time collaboration presence

**Structure:**
```jsx
<AppLayout>
  <Sidebar />
  <TopNav />
  <main>
    <Outlet /> {/* React Router outlet for page content */}
  </main>
  <MobileDock />
  <Modals />
  <CommandPalette />
</AppLayout>
```

---

## Authentication Flow

### JWT Token Architecture

RowLab uses a **dual-token system** for security:

1. **Access Token:**
   - Short-lived (15 minutes)
   - Stored in memory only (not localStorage)
   - Sent in `Authorization: Bearer <token>` header
   - Contains: userId, teamId, role

2. **Refresh Token:**
   - Long-lived (7 days)
   - Stored in HTTP-only cookie (httpOnly, secure, sameSite)
   - Used to obtain new access tokens
   - Rotates on each refresh

### Auth Flow Diagram

```
[Login Page]
    │
    ├─ POST /api/v1/auth/login { email, password }
    │
    └─> [Backend]
         │
         ├─ Validate credentials
         ├─ Generate access token (15min)
         ├─ Generate refresh token (7d)
         └─ Set refresh token in HTTP-only cookie
         │
         └─> Response: { accessToken, user, teams, activeTeamId }
              │
              └─> [Frontend authStore]
                   │
                   ├─ Store accessToken in memory
                   ├─ Store user, teams, activeTeamId in Zustand (persisted to localStorage)
                   └─> Navigate to /app
```

### Token Refresh Flow

```
[API Request]
    │
    ├─ Include Authorization: Bearer <accessToken>
    │
    └─> [Backend]
         │
         ├─ Verify access token
         │
         ├─ If expired (401)
         │   └─> [Frontend authStore.authenticatedFetch]
         │        │
         │        ├─ POST /api/v1/auth/refresh (includes refresh token cookie)
         │        │
         │        └─> [Backend]
         │             │
         │             ├─ Validate refresh token from cookie
         │             ├─ Generate new access token
         │             ├─ Rotate refresh token (optional)
         │             └─> Response: { accessToken }
         │                  │
         │                  └─> [Frontend] Retry original request with new token
         │
         └─ If valid, proceed with request
```

### Team Switching

RowLab supports **multi-team membership**. When switching teams:

1. User selects team from workspace switcher
2. `authStore.switchTeam(teamId)` called
3. Backend validates team membership
4. New access token issued with updated `teamId` and `role` claims
5. Frontend reloads to fetch team-specific data

### Role-Based Access Control (RBAC)

**Roles:**
- `OWNER` - Full team control (settings, billing, delete team)
- `COACH` - Manage athletes, lineups, training plans
- `ATHLETE` - View own data, submit workouts
- `COXSWAIN` - Athlete + coxswain-specific views

**Implementation:**

Use `useAuth` hook:
```jsx
const { activeTeamRole, isCoachOrOwner, hasRole } = useAuth();

// Check role
if (isCoachOrOwner()) {
  // Show admin features
}

// Or use hook
const { hasAccess } = useRequireRole('OWNER', 'COACH');
```

---

## API Integration

### Base Configuration

**API URL:** `/api/v1` (relative to frontend origin)

Configured in store files:
```javascript
const API_URL = '/api/v1';
```

### Authenticated Requests

**Pattern:** Use `authStore.authenticatedFetch()` for all authenticated requests

**Benefits:**
- Automatic token refresh on 401
- Consistent error handling
- Credentials included for refresh token cookie

**Example:**
```javascript
const { authenticatedFetch } = useAuthStore.getState();

const response = await authenticatedFetch('/api/v1/athletes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(athleteData)
});

const data = await response.json();
```

### API Response Format

**Standard Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "teams": [ ... ]
  },
  "meta": {
    "timestamp": "2026-01-22T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": { ... }
  }
}
```

### Error Handling

**Utility:** `/src/utils/api.js` provides `handleApiResponse()`

```javascript
import { handleApiResponse } from '@utils/api';

const response = await fetch('/api/v1/athletes');
const data = await handleApiResponse(response, 'Failed to fetch athletes');
```

**Handles:**
- Non-OK responses (4xx, 5xx)
- JSON parsing errors (when server returns HTML)
- Consistent error messages

**Store Error Pattern:**
```javascript
fetchData: async () => {
  set({ loading: true, error: null });
  try {
    const response = await authenticatedFetch('/api/v1/data');
    const data = await handleApiResponse(response);
    set({ data: data.data.items, loading: false });
    return data.data.items;
  } catch (error) {
    set({ error: error.message, loading: false });
    throw error; // Re-throw for component-level handling
  }
}
```

### Integration Services

#### Concept2 API (`/src/services/concept2Service.js`)

OAuth integration for syncing erg workouts from Concept2 Logbook.

**Flow:**
1. User clicks "Connect Concept2"
2. Redirect to Concept2 OAuth consent
3. Callback to `/concept2/callback` with authorization code
4. Exchange code for access token
5. Fetch workouts and sync to RowLab

#### Strava API (`/src/services/stravaService.js`)

Upload workouts to Strava for cross-training tracking.

---

## Design System

RowLab uses a **Precision Instrument** design system inspired by Raycast, Linear, and Apple.

### Color Palette

**Theme:** Dark mode with neon accents ("Void + Neon")

#### Surface Colors (Void Scale)

```javascript
void: {
  deep: '#08080A',      // Main app background
  surface: '#0c0c0e',   // Input backgrounds
  elevated: '#121214',  // Card surfaces
}
```

#### Text Hierarchy (WCAG 2.1 AA Compliant)

```javascript
text: {
  primary: '#F4F4F5',   // Headlines (zinc-100) - 16.8:1 contrast
  secondary: '#A1A1AA', // Body text (zinc-400) - 9.0:1
  muted: '#71717A',     // Captions (zinc-500) - 5.5:1
  disabled: '#52525B',  // Disabled states (zinc-600)
}
```

#### Accent Colors

```javascript
blade: {
  blue: '#0070F3',      // Primary action (inspired by Vercel blue)
}

coxswain: {
  violet: '#7C3AED',    // Coxswain/leadership accent
}

warning: {
  orange: '#F59E0B',
}

danger: {
  red: '#EF4444',
}
```

#### Spectrum Colors (Rainbow Variety)

Used for data visualization and athlete avatars:

```javascript
spectrum: {
  blue: '#4285F4',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  purple: '#9B72CB',
  fuchsia: '#D946EF',
  pink: '#EC4899',
  rose: '#D96570',
  red: '#EF4444',
  orange: '#F97316',
  amber: '#F59E0B',
  yellow: '#EAB308',
  lime: '#84CC16',
  green: '#22C55E',
  emerald: '#10B981',
  teal: '#14B8A6',
  cyan: '#06B6D4',
}
```

#### Rowing-Specific Colors

```javascript
port: '#EF4444',        // Port side (red)
starboard: '#10B981',   // Starboard (green)
```

---

### Typography

**Font Stack:**

```javascript
// Display font (headlines, hero text)
'display': [
  '"Space Grotesk"',
  'system-ui',
  'sans-serif',
]

// Body font (UI, paragraphs)
'sans': [
  '"DM Sans"',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  'sans-serif',
]

// Monospace (times, stats, data)
'mono': [
  '"JetBrains Mono"',
  '"SF Mono"',
  'ui-monospace',
  'Menlo',
  'Monaco',
  'Consolas',
  'monospace',
]
```

**Font Sizes:**

```javascript
fontSize: {
  xs: ['0.75rem', { lineHeight: '1rem' }],           // 12px
  sm: ['0.8125rem', { lineHeight: '1.25rem' }],      // 13px
  base: ['0.9375rem', { lineHeight: '1.5rem' }],     // 15px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],       // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],        // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px
  '3xl': ['2.25rem', { lineHeight: '2.5rem' }],      // 36px
  '4xl': ['3rem', { lineHeight: '1.15' }],           // 48px
  '5xl': ['4.5rem', { lineHeight: '1.1' }],          // 72px
}
```

---

### Shadows & Elevation

**Card Shadow System:**

Multi-layer shadows for physical depth:

```javascript
boxShadow: {
  // Card system - 3 layers for physical feel
  card: '0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',

  'card-hover': '0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25)',

  // Blue glow for primary actions
  'glow-blue': '0 0 0 1px rgba(0,112,243,0.3), 0 0 20px -5px rgba(0,112,243,0.4)',
}
```

---

### Transitions & Animations

**Philosophy:** Fast, snappy transitions with no perceived latency

**Timing:**
```javascript
transitionDuration: {
  fast: '100ms',    // Hover states, instant feedback
  normal: '150ms',  // Most transitions
  slow: '200ms',    // Complex animations (max)
}
```

**Easing Curves:**
```javascript
transitionTimingFunction: {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',        // General purpose
  snap: 'cubic-bezier(0, 0, 0.2, 1)',            // Instant feel, ease-out only
  precision: 'cubic-bezier(0.16, 1, 0.3, 1)',    // Premium ease-out
}
```

**Animations:**
```javascript
animation: {
  'fade-in': 'fadeIn 0.15s ease-out',
  'fade-in-up': 'fadeInUp 0.15s ease-out',
  'slide-in-right': 'slideInRight 0.15s ease-out',
  'scale-in': 'scaleIn 0.1s ease-out',
  'data-flash': 'dataFlash 0.15s ease-out',  // Highlight data changes
}
```

---

### Tailwind Configuration

Full design system tokens in `/tailwind.config.js`:

**Custom Utilities:**

```jsx
// Glass effect (frosted glass with subtle border)
<div className="glass-card">...</div>

// Gradient backgrounds
<div className="bg-gradient-to-b from-void-deep to-void-surface">...</div>

// Blade blue glow
<button className="shadow-glow-blue hover:shadow-glow-blue-lg">...</button>
```

---

## Performance Optimizations

### 1. Code Splitting

**Route-Level Splitting:**

All pages lazy-loaded via React.lazy():
```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LineupBuilder = lazy(() => import('./pages/LineupBuilder'));
```

**Benefits:**
- Reduced initial bundle size (~40% reduction)
- Faster time-to-interactive
- On-demand loading of heavy features (3D viewer, charts)

---

### 2. Image Optimization

**Headshot Preloading:**
```javascript
// /src/utils/fileLoader.js
const headshotMap = await preloadHeadshots(athletes);
```

Preloads all athlete headshots in parallel on app load.

---

### 3. Zustand Persistence

Selected stores persist to localStorage:

```javascript
persist(
  (set, get) => ({ /* store */ }),
  {
    name: 'rowlab-auth-v2',
    partialize: (state) => ({
      user: state.user,
      teams: state.teams,
      activeTeamId: state.activeTeamId,
    })
  }
)
```

**Benefits:**
- Instant app load (no auth check needed)
- Survive page refreshes
- Selective persistence (e.g., tokens excluded for security)

---

### 4. Memoization

Use `React.memo`, `useMemo`, `useCallback` for expensive components:

```jsx
const AthleteCard = React.memo(({ athlete }) => { ... });
```

---

### 5. Virtualization

Large lists use virtualization (if implemented):
- Athlete roster with 100+ athletes
- Erg test history tables

---

### 6. Vite Optimizations

**Vite config optimizations:**
- Tree shaking
- Minification (Terser)
- CSS purging (Tailwind)
- Chunk splitting

---

## Development Guidelines

### Component Guidelines

1. **Functional Components Only:** Use hooks instead of class components
2. **Single Responsibility:** Each component has one clear purpose
3. **Props over Context:** Pass data via props unless deeply nested
4. **Controlled Components:** Forms use controlled inputs
5. **Error Boundaries:** Wrap async components in error boundaries

---

### File Naming Conventions

- **Components:** PascalCase (e.g., `AthleteCard.jsx`)
- **Stores:** camelCase with "Store" suffix (e.g., `authStore.js`)
- **Utilities:** camelCase (e.g., `csvParser.js`)
- **Hooks:** camelCase with "use" prefix (e.g., `useAuth.js`)

---

### Import Aliases

Configured in Vite:

```javascript
import useAuthStore from '@store/authStore';
import { Button } from '@components/ui';
import { csvParser } from '@utils/csvParser';
```

Aliases defined in `vite.config.js`:
```javascript
resolve: {
  alias: {
    '@': '/src',
    '@components': '/src/components',
    '@store': '/src/store',
    '@utils': '/src/utils',
    '@hooks': '/src/hooks',
    '@theme': '/src/theme',
  }
}
```

---

### State Management Best Practices

1. **Collocate State:** Keep state close to where it's used
2. **Derive Don't Duplicate:** Compute derived values instead of storing them
3. **Normalize Data:** Store data in normalized form (e.g., by ID)
4. **Optimistic Updates:** Update UI immediately, sync with server asynchronously
5. **Error Recovery:** Always provide error messages and retry mechanisms

**Example - Optimistic Update:**
```javascript
deleteAthlete: async (id) => {
  const backup = get().athletes.find(a => a.id === id);

  // Optimistic update
  set(state => ({
    athletes: state.athletes.filter(a => a.id !== id)
  }));

  try {
    await authenticatedFetch(`/api/v1/athletes/${id}`, { method: 'DELETE' });
  } catch (error) {
    // Rollback on error
    set(state => ({
      athletes: [...state.athletes, backup],
      error: error.message
    }));
  }
}
```

---

### Testing

**Framework:** Vitest + Testing Library

**Test Files:** Co-located with components
```
Button.jsx
Button.test.jsx
```

**Run Tests:**
```bash
npm test          # Watch mode
npm run test:run  # Single run
npm run test:coverage  # With coverage
```

---

### Performance Monitoring

**Key Metrics:**
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Bundle size (via `rollup-plugin-visualizer`)

**Tools:**
- React DevTools Profiler
- Lighthouse
- Vite bundle analyzer

---

## Adding New Features

### Checklist for New Features

1. **Create Store:**
   - Define state shape in `/src/store/[feature]Store.js`
   - Implement CRUD actions
   - Add error handling

2. **Create Components:**
   - Page component in `/src/pages/[Feature]Page.jsx`
   - Feature components in `/src/components/[Feature]/`
   - Reusable UI components in `/src/components/ui/`

3. **Add Route:**
   - Register route in `/src/App.jsx`
   - Add navigation link in Sidebar

4. **API Integration:**
   - Create service file if needed in `/src/services/`
   - Use `authenticatedFetch` for API calls

5. **Testing:**
   - Unit tests for store actions
   - Component tests for UI
   - Integration tests for flows

6. **Documentation:**
   - Update this document
   - Add JSDoc comments to functions

---

## Troubleshooting

### Common Issues

#### 1. "Unexpected token '<'" Error

**Cause:** Server returning HTML error page instead of JSON

**Solution:** Use `handleApiResponse()` from `/src/utils/api.js`

```javascript
const data = await handleApiResponse(response, 'Failed to fetch');
```

---

#### 2. 401 Unauthorized on API Calls

**Cause:** Expired access token

**Solution:** Use `authStore.authenticatedFetch()` instead of raw `fetch()`

```javascript
const { authenticatedFetch } = useAuthStore.getState();
const response = await authenticatedFetch('/api/v1/data');
```

---

#### 3. State Not Persisting

**Cause:** Store not wrapped in `persist()` middleware

**Solution:** Add persist middleware:
```javascript
const useMyStore = create(
  persist(
    (set, get) => ({ /* store */ }),
    { name: 'my-store' }
  )
);
```

---

#### 4. Slow Page Load

**Causes:**
- Large bundle size
- Too many API calls on mount
- Unoptimized images

**Solutions:**
- Use lazy loading for heavy components
- Batch API calls
- Preload critical images
- Use `React.memo` for expensive renders

---

## Future Enhancements

### Planned Features

1. **Real-time Collaboration:**
   - Multi-user lineup editing
   - Live presence indicators
   - Conflict resolution

2. **Offline Support:**
   - Service workers for offline access
   - Background sync for data

3. **Advanced Analytics:**
   - ML-powered lineup suggestions
   - Predictive performance modeling

4. **Mobile App:**
   - React Native version for iOS/Android
   - Shared codebase with web

5. **WebGL 3D Viewer:**
   - Enhanced boat visualization
   - Stroke analysis animation

---

## Additional Resources

### Official Documentation

- [React Docs](https://react.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Vite](https://vitejs.dev/)

### RowLab-Specific Docs

- `/docs/API_REFERENCE.md` - Backend API documentation
- `/docs/DEPLOYMENT.md` - Deployment guide
- `/docs/CONTRIBUTING.md` - Contribution guidelines
- `/server/README.md` - Backend architecture

---

## Changelog

### v1.0.0 (2026-01-22)

- Initial frontend architecture documentation
- Comprehensive routing, state, and component documentation
- Design system reference
- Development guidelines

---

**Maintained by:** RowLab Development Team
**Last Review:** 2026-01-22
