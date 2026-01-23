# Phase 3: Vertical Slice (Personal Dashboard) - Research

**Researched:** 2026-01-23
**Domain:** React dashboard UI with external API integrations, adaptive personalization, and widget customization
**Confidence:** HIGH

## Summary

Phase 3 implements a personalized athlete dashboard with adaptive headline widget, third-party data integrations (Concept2 and Strava), and unified activity feed with cross-source deduplication. The dashboard uses a bento grid layout with customizable widgets that users can reorder and show/hide, with preferences synced server-side.

The standard approach combines CSS Grid with `auto-fit` and `grid-auto-flow: dense` for the bento layout, @dnd-kit (already installed) for drag-and-drop reordering, and TanStack Query (React Query) for API data fetching with built-in caching. The existing Prisma schema already has `DashboardPreferences`, `Activity`, `Concept2Auth`, and `StravaAuth` models, reducing new model requirements to zero.

**Primary recommendation:** Use CSS Grid with `grid-auto-flow: dense` for bento layout (no library needed), leverage already-installed @dnd-kit for widget reordering, add TanStack Query v5 for external API data fetching with automatic caching, and implement simple heuristic rules (not ML) for adaptive headline selection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Grid | Native | Bento grid layout | Modern browsers natively support advanced grid features (auto-fit, dense, subgrid). No external library needed. |
| @dnd-kit/core | ^6.1.0 | Drag-and-drop | Already installed. Lightweight, accessible, performant React DnD with keyboard support. Industry standard for React DnD. |
| @dnd-kit/sortable | ^8.0.0 | Widget reordering | Already installed. Provides sorting strategies for grid layouts. |
| TanStack Query | v5 latest | External API data fetching | De facto standard for server-state management in React. Automatic caching, background updates, request deduplication. |
| Framer Motion | ^11.18.2 | Widget animations | Already installed. Used throughout V2 for micro-interactions. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| axios | ^1.13.2 | HTTP client | Already installed. Use as queryFn in TanStack Query for API calls with better error handling than fetch. |
| express-validator | ^7.3.1 | API validation | Already installed. Use for new backend endpoints (dashboard preferences, activity feed). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Query | SWR | SWR is lighter but TanStack Query has superior devtools, better TypeScript support, and handles complex invalidation patterns better. Industry momentum is with TanStack Query. |
| @dnd-kit | react-beautiful-dnd | react-beautiful-dnd is deprecated. @dnd-kit is the successor with better performance and accessibility. |
| CSS Grid | react-grid-layout | react-grid-layout adds complexity and bundle size for features we don't need (pixel-perfect positioning, resize handles). CSS Grid handles bento layouts natively. |

**Installation:**
```bash
npm install @tanstack/react-query@latest
```

## Architecture Patterns

### Recommended Project Structure
```
src/v2/
├── pages/
│   └── MeDashboard.tsx          # Main dashboard page at /beta/me
├── components/
│   └── dashboard/
│       ├── DashboardGrid.tsx     # Bento grid container with DnD
│       ├── HeadlineWidget.tsx    # Hero section with adaptive headline
│       ├── C2LogbookWidget.tsx   # Concept2 data display
│       ├── StravaFeedWidget.tsx  # Strava activity feed
│       ├── UnifiedActivityFeed.tsx # Deduplicated cross-source feed
│       └── WidgetWrapper.tsx     # Common widget chrome (pin/hide controls)
├── hooks/
│   ├── useAdaptiveHeadline.ts   # Heuristic-based headline selection
│   ├── useC2Logbook.ts          # TanStack Query hook for C2 data
│   ├── useStravaActivities.ts   # TanStack Query hook for Strava data
│   ├── useActivityFeed.ts       # Unified feed with deduplication
│   └── useDashboardPrefs.ts     # Dashboard customization state
├── stores/
│   └── dashboardStore.ts        # Dashboard preferences (Zustand + persist)
server/
├── routes/v1/
│   ├── dashboardPreferences.js  # CRUD for dashboard prefs
│   ├── activities.js            # Unified activity feed endpoint
│   └── integrations/
│       ├── concept2.js          # C2 logbook proxy
│       └── strava.js            # Strava API proxy
└── services/
    ├── activityService.js       # Activity deduplication logic
    ├── concept2Service.js       # C2 API wrapper
    └── stravaService.js         # Strava API wrapper
```

### Pattern 1: Bento Grid with CSS Grid Dense Packing

**What:** CSS Grid layout with `grid-auto-flow: dense` automatically fills holes with smaller items, creating the "bento box" aesthetic.

**When to use:** For dashboard layouts where widgets have varying sizes and you want efficient space utilization without manual positioning.

**Example:**
```css
/* Source: CSS-Tricks, web.dev */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: 200px;
  grid-auto-flow: dense; /* Key property - fills gaps automatically */
  gap: 1rem;
}

/* Widget size variants */
.widget-small { grid-column: span 1; grid-row: span 1; }
.widget-medium { grid-column: span 2; grid-row: span 1; }
.widget-large { grid-column: span 2; grid-row: span 2; }
.widget-hero { grid-column: 1 / -1; grid-row: span 2; } /* Full width */
```

**Why this works:**
- `auto-fit` collapses empty tracks (no placeholder gaps)
- `dense` packing maximizes space efficiency
- `minmax(280px, 1fr)` ensures responsive behavior without media queries
- `grid-column: 1 / -1` for hero section spans full width

### Pattern 2: TanStack Query for External API Data

**What:** Declarative data fetching with automatic caching, background updates, and request deduplication.

**When to use:** For all external API calls (Concept2, Strava) and backend endpoints. Replaces useEffect + useState patterns.

**Example:**
```typescript
// Source: https://tanstack.com/query/v5/docs/framework/react/overview
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Custom hook for C2 logbook data
export function useC2Logbook() {
  return useQuery({
    queryKey: ['c2-logbook'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/integrations/concept2/workouts');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: !!userId, // Only fetch if user is authenticated
  });
}

// Usage in component
function C2LogbookWidget() {
  const { data, isLoading, error, refetch } = useC2Logbook();

  if (isLoading) return <WidgetSkeleton />;
  if (error) return <EmptyState message="Unable to load C2 data" />;

  return <LogbookTable workouts={data} onRefresh={refetch} />;
}
```

**Why this works:**
- Automatic background refetching keeps data fresh
- Request deduplication prevents redundant API calls
- Built-in loading/error states eliminate boilerplate
- Query invalidation simplifies cache updates

### Pattern 3: Activity Deduplication with Primary Source Selection

**What:** Unified activity feed that detects duplicate activities across sources (C2, Strava) and designates a primary source for display.

**When to use:** When aggregating data from multiple external APIs where the same physical activity may appear in both systems.

**Example:**
```typescript
// Source: Best practices from event deduplication research
interface Activity {
  id: string;
  source: 'CONCEPT2' | 'STRAVA' | 'MANUAL';
  sourceId: string; // Unique ID from source system
  date: Date;
  activityType: string;
  data: any; // Source-specific data
}

interface DeduplicatedActivity extends Activity {
  isPrimary: boolean;
  duplicates?: Activity[]; // Other sources with same activity
}

// Deduplication logic (backend service)
function deduplicateActivities(activities: Activity[]): DeduplicatedActivity[] {
  const groups = new Map<string, Activity[]>();

  // Group by date + type (within 5-minute window)
  activities.forEach(activity => {
    const key = `${activity.activityType}-${getDateWindow(activity.date)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(activity);
  });

  // For each group, select primary source
  return Array.from(groups.values()).map(group => {
    // C2 is always primary for rowing (canonical erg data)
    const primary = group.find(a =>
      (a.activityType === 'rowing' || a.activityType === 'erg') && a.source === 'CONCEPT2'
    ) || group[0]; // Fallback to first activity

    const duplicates = group.filter(a => a.id !== primary.id);

    return {
      ...primary,
      isPrimary: true,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
    };
  });
}

// Frontend display
function ActivityCard({ activity }: { activity: DeduplicatedActivity }) {
  return (
    <div className="activity-card">
      <SourceBadge source={activity.source} isPrimary={activity.isPrimary} />
      <ActivityMetrics data={activity.data} />
      {activity.duplicates && (
        <DuplicateIndicator count={activity.duplicates.length} sources={activity.duplicates.map(d => d.source)} />
      )}
    </div>
  );
}
```

**Why this works:**
- C2 is canonical for rowing data (decision from phase context)
- Time-window matching catches activities that may have slight timestamp differences
- UI shows primary source prominently while indicating other sources exist
- Backend handles deduplication (not frontend) for consistency

### Pattern 4: @dnd-kit Sortable Grid for Widget Reordering

**What:** Drag-and-drop widget reordering using @dnd-kit's sortable preset with persistence to backend.

**When to use:** For user-customizable dashboard layouts where widgets can be reordered.

**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Widget wrapper with sortable behavior
function SortableWidget({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// Dashboard grid with DnD
function DashboardGrid() {
  const [widgets, setWidgets] = useState(['headline', 'c2-logbook', 'strava-feed', 'activity-feed']);
  const { mutate: saveLayout } = useMutation({
    mutationFn: (widgetOrder: string[]) =>
      axios.put('/api/v1/dashboard-preferences', { pinnedModules: widgetOrder })
  });

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setWidgets(items => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveLayout(newOrder); // Persist to backend
        return newOrder;
      });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
        <div className="dashboard-grid">
          {widgets.map(widgetId => (
            <SortableWidget key={widgetId} id={widgetId}>
              <WidgetComponent widgetId={widgetId} />
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

**Why this works:**
- @dnd-kit is already installed (zero new dependencies)
- Automatic keyboard accessibility
- Smooth animations with Framer Motion integration
- Server-side persistence ensures same layout across devices

### Pattern 5: Simple Heuristic-Based Personalization

**What:** Rule-based headline selection using recent activity data and schedule, not machine learning.

**When to use:** For adaptive UI that responds to user behavior without requiring ML infrastructure.

**Example:**
```typescript
// Source: Enterprise dashboard heuristics research (2026)
interface HeadlineContext {
  recentWorkouts: Activity[];
  upcomingWorkouts: CalendarEvent[];
  goals: Goal[];
  streakDays: number;
  personalBests: PersonalBest[];
}

type HeadlineType =
  | 'streak-celebration'
  | 'pb-achieved'
  | 'rest-day-reminder'
  | 'workout-due'
  | 'goal-progress'
  | 'welcome-back';

interface Headline {
  type: HeadlineType;
  message: string;
  cta?: { label: string; action: string };
  priority: number; // Higher = more important
}

function useAdaptiveHeadline(context: HeadlineContext): Headline {
  const candidates: Headline[] = [];

  // Heuristic 1: Celebrate PB (highest priority)
  const recentPB = context.personalBests.find(pb =>
    isWithinDays(pb.achievedAt, 7)
  );
  if (recentPB) {
    candidates.push({
      type: 'pb-achieved',
      message: `New PR: ${recentPB.metric} - ${recentPB.value}!`,
      cta: { label: 'View details', action: '/beta/progress' },
      priority: 100,
    });
  }

  // Heuristic 2: Workout streak
  if (context.streakDays >= 5) {
    candidates.push({
      type: 'streak-celebration',
      message: `${context.streakDays} day streak - keep it going!`,
      priority: 80,
    });
  }

  // Heuristic 3: Upcoming workout (within 2 hours)
  const nextWorkout = context.upcomingWorkouts
    .find(w => isWithinHours(w.startTime, 2));
  if (nextWorkout) {
    candidates.push({
      type: 'workout-due',
      message: `${nextWorkout.title} starts soon`,
      cta: { label: 'View workout', action: `/beta/workouts/${nextWorkout.id}` },
      priority: 90,
    });
  }

  // Heuristic 4: Rest day reminder (no workout in 3+ days)
  if (daysSinceLastWorkout(context.recentWorkouts) >= 3) {
    candidates.push({
      type: 'rest-day-reminder',
      message: 'Taking a rest? Remember to stay hydrated.',
      priority: 40,
    });
  }

  // Heuristic 5: Goal progress (if behind)
  const goalBehind = context.goals.find(g => g.progress < g.expectedProgress);
  if (goalBehind) {
    candidates.push({
      type: 'goal-progress',
      message: `Goal: ${goalBehind.name} needs attention`,
      cta: { label: 'Review goal', action: '/beta/progress' },
      priority: 70,
    });
  }

  // Default: Generic welcome
  candidates.push({
    type: 'welcome-back',
    message: getTimeOfDayGreeting(),
    priority: 10,
  });

  // Return highest priority
  return candidates.sort((a, b) => b.priority - a.priority)[0];
}
```

**Why this works:**
- No ML infrastructure needed (V1 scope)
- Predictable and debuggable
- Can be refined based on user feedback
- Heuristic priority system is transparent

### Anti-Patterns to Avoid

- **Using react-grid-layout for bento grids:** Overkill - CSS Grid handles this natively. react-grid-layout is for pixel-perfect positioning with resize handles, which we don't need.
- **Fetching external API data directly in components:** Always proxy through backend for security (API keys), rate limiting, and error handling consistency.
- **Client-side deduplication logic:** Deduplication should happen server-side to ensure consistency across all clients and avoid N+1 query problems.
- **Storing widget layout in localStorage:** Use server-side preferences for cross-device sync (requirement in phase context).
- **ML-based personalization for V1:** Rule-based heuristics are sufficient and maintainable. ML adds complexity without proven user value yet.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| External API data fetching | Custom useEffect + useState + caching | TanStack Query | Handles caching, deduplication, background updates, request cancellation, retry logic, and error recovery. Hand-rolled solutions miss edge cases. |
| Drag-and-drop | Custom mouse event handlers | @dnd-kit (already installed) | Accessibility (keyboard support), touch support, screen reader support, and collision detection are complex to implement correctly. |
| Activity deduplication | Duplicate key detection in map | Time-windowed fuzzy matching | Activities from different sources have timestamp drift. Need flexible matching within time windows (±5 minutes). |
| Dashboard layout | Absolute positioning or Flexbox | CSS Grid with `auto-fit` and `dense` | Grid handles responsive behavior, gap collapsing, and dense packing natively. Flexbox can't achieve true grid layouts. |
| API rate limiting | Custom request throttling | express-rate-limit (already installed) | Distributed rate limiting with Redis support, per-route configuration, and standard headers. |

**Key insight:** External API integrations (C2, Strava) require OAuth token management, refresh token handling, rate limiting awareness, webhook processing for real-time sync, and graceful degradation when services are down. These are standard problems with standard solutions - don't build custom abstractions.

## Common Pitfalls

### Pitfall 1: CSS Grid Dense Packing Creates Unexpected Order

**What goes wrong:** `grid-auto-flow: dense` fills gaps by moving items out of DOM order, breaking logical reading order for screen readers and keyboard navigation.

**Why it happens:** CSS visual order doesn't match DOM order when dense packing rearranges items to fill gaps.

**How to avoid:**
1. Keep hero section (headline widget) outside the dense grid - give it fixed position at top
2. Only apply `dense` to widget grid below hero
3. Test with keyboard navigation to verify tab order makes sense
4. Use `aria-flowto` if reading order is critical

**Warning signs:** Users report confusing tab order, screen reader jumps around unpredictably.

### Pitfall 2: External API Token Expiration Not Handled

**What goes wrong:** OAuth access tokens expire (Strava: 6 hours, C2: varies), causing widgets to show stale error states.

**Why it happens:** Initial implementation works but tokens expire during long sessions. No automatic refresh logic.

**How to avoid:**
1. Implement refresh token flow in backend services (`concept2Service.js`, `stravaService.js`)
2. Middleware automatically refreshes tokens before API calls
3. Return 401 from backend if refresh fails, trigger re-auth flow in frontend
4. Store `tokenExpiresAt` in database, proactively refresh 5 minutes before expiry

**Warning signs:** Widgets work initially but fail after several hours. Manual re-auth fixes the issue temporarily.

### Pitfall 3: Activity Deduplication False Positives

**What goes wrong:** Two different workouts on same day get merged as duplicates.

**Why it happens:** Deduplication logic only matches on date + activity type, not considering time or distance.

**How to avoid:**
1. Use time windows (±5 minutes) not just date matching
2. Compare primary metrics (distance, duration) with tolerance (±10%)
3. Require multiple matching attributes: time window + activity type + distance similarity
4. Provide UI to manually unlink false duplicates

**Warning signs:** User reports "missing" workouts that were incorrectly merged with another activity.

### Pitfall 4: TanStack Query Fetching on Every Render

**What goes wrong:** API calls fire on every component re-render, hammering external APIs and hitting rate limits.

**Why it happens:** `queryKey` includes unstable references (objects, functions) that change on every render.

**How to avoid:**
```typescript
// BAD: Object created every render
useQuery({ queryKey: ['activities', { userId, date: new Date() }], ... });

// GOOD: Stable primitive values
const dateString = format(date, 'yyyy-MM-dd');
useQuery({ queryKey: ['activities', userId, dateString], ... });
```

**Warning signs:** Network tab shows duplicate requests, rate limit errors from external APIs, slow dashboard performance.

### Pitfall 5: Concept2 Duplicate Workout Rejections

**What goes wrong:** Attempting to post workout to C2 Logbook returns "Duplicate Entry" error.

**Why it happens:** C2 filters for duplicate workouts (same date, time, distance) and rejects them.

**How to avoid:**
1. Use C2's Online Validator tool during development
2. Check for existing workout before posting (GET /workouts endpoint)
3. Handle duplicate error gracefully - show "Already synced" message instead of error
4. Validate split/interval data types (must be integers, not decimals)

**Warning signs:** C2 sync fails silently or shows "Duplicate Entry" errors in logs.

## Code Examples

Verified patterns from official sources:

### TanStack Query Setup (App Level)

```typescript
// Source: https://tanstack.com/query/v5/docs/framework/react/overview
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create client (outside component to avoid recreating on render)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in v5)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on tab focus
    },
  },
});

// Wrap app
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <V2Layout />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Backend API Pattern (Express + Prisma)

```typescript
// Source: Existing patterns from server/routes/v1/shells.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, teamIsolation } from '../../middleware/auth.js';

const router = express.Router();

// GET /api/v1/dashboard-preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const prefs = await prisma.dashboardPreferences.findUnique({
      where: { userId: req.user.userId },
    });

    res.json({
      success: true,
      data: prefs || { pinnedModules: [], hiddenSources: [] },
    });
  } catch (error) {
    logger.error('Get dashboard preferences error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to load preferences' },
    });
  }
});

// PUT /api/v1/dashboard-preferences
router.put(
  '/',
  authenticateToken,
  [
    body('pinnedModules').isArray().optional(),
    body('hiddenSources').isArray().optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: errors.array() },
      });
    }

    try {
      const prefs = await prisma.dashboardPreferences.upsert({
        where: { userId: req.user.userId },
        update: req.body,
        create: { userId: req.user.userId, ...req.body },
      });

      res.json({ success: true, data: prefs });
    } catch (error) {
      logger.error('Update dashboard preferences error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to save preferences' },
      });
    }
  }
);

export default router;
```

### Concept2 API Integration Pattern

```typescript
// Source: https://log.concept2.com/developers/documentation/
// Backend service for C2 API proxy

import axios from 'axios';
import logger from '../utils/logger.js';

const C2_API_BASE = process.env.C2_API_BASE || 'https://log.concept2.com/api';

export async function getC2Workouts(userId: string, options?: { limit?: number; offset?: number }) {
  try {
    // Get stored auth from database
    const auth = await prisma.concept2Auth.findUnique({ where: { userId } });
    if (!auth) throw new Error('C2 auth not found');

    // Check token expiration, refresh if needed
    if (new Date(auth.tokenExpiresAt) <= new Date()) {
      await refreshC2Token(userId);
    }

    // Fetch workouts from C2 API
    const response = await axios.get(`${C2_API_BASE}/users/${auth.c2UserId}/results`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      params: { limit: options?.limit || 20, offset: options?.offset || 0 },
    });

    return response.data;
  } catch (error) {
    logger.error('C2 API error', { userId, error: error.message });
    throw error;
  }
}

async function refreshC2Token(userId: string) {
  const auth = await prisma.concept2Auth.findUnique({ where: { userId } });
  if (!auth) throw new Error('C2 auth not found');

  const response = await axios.post(`${C2_API_BASE}/oauth/token`, {
    grant_type: 'refresh_token',
    refresh_token: auth.refreshToken,
    client_id: process.env.C2_CLIENT_ID,
    client_secret: process.env.C2_CLIENT_SECRET,
  });

  // Update stored tokens
  await prisma.concept2Auth.update({
    where: { userId },
    data: {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-grid-layout for all layouts | CSS Grid with native features | 2023-2024 | CSS Grid browser support reached 98%+. Native grid is faster, smaller bundle, and easier to maintain. |
| Redux for all state | Zustand for UI state, TanStack Query for server state | 2022-2023 | Separation of concerns: Zustand handles UI state (theme, context), TanStack Query handles server state (external APIs). Less boilerplate. |
| SWR for data fetching | TanStack Query (React Query) | 2023-2024 | TanStack Query has better devtools, TypeScript support, and handles complex invalidation patterns. Industry momentum shifted. |
| localStorage for preferences | Server-side preferences with sync | 2023-present | Cross-device sync requirement. localStorage doesn't sync across browsers/devices. |
| react-beautiful-dnd | @dnd-kit | 2021-2022 | react-beautiful-dnd deprecated. @dnd-kit is actively maintained successor with better accessibility. |

**Deprecated/outdated:**
- **react-grid-layout:** Still maintained but unnecessary for bento grids. CSS Grid handles this use case natively.
- **SWR:** Still valid but TanStack Query has become the de facto standard with better ecosystem support.
- **react-beautiful-dnd:** Officially deprecated by Atlassian. Use @dnd-kit instead.

## Open Questions

Things that couldn't be fully resolved:

1. **Concept2 API Rate Limits**
   - What we know: Official docs don't specify rate limits. Community reports suggest ~100 requests/hour.
   - What's unclear: Exact rate limit thresholds, whether limits apply per user or per app.
   - Recommendation: Implement conservative caching (5-10 minute `staleTime`) and monitor for rate limit errors. Add exponential backoff retry logic.

2. **Strava Activity Deduplication Heuristics**
   - What we know: Strava and C2 activities may have timestamp drift. Need fuzzy matching.
   - What's unclear: Optimal time window tolerance (±5 minutes? ±10 minutes?) and distance tolerance (±5%? ±10%?).
   - Recommendation: Start with ±5 minute window and ±10% distance tolerance. Make configurable for tuning based on real-world data.

3. **Dashboard Widget Size System**
   - What we know: Context says "Claude's discretion" for widget sizes. Bento grids typically use small/medium/large.
   - What's unclear: Exact grid-column/grid-row span values for each size class.
   - Recommendation: Use 3-size system: Small (1x1), Medium (2x1), Large (2x2). Hero section is full-width (1 / -1).

4. **Headline Refresh Strategy**
   - What we know: Adaptive headline should update based on context. Context says "Claude's discretion" for refresh frequency.
   - What's unclear: Should headline update on every dashboard visit, or periodically while dashboard is open?
   - Recommendation: Recalculate on page load and when activity data changes (via TanStack Query invalidation). Don't auto-refresh on timer (could be distracting).

## Sources

### Primary (HIGH confidence)
- [TanStack Query v5 Documentation](https://tanstack.com/query/v5/docs/framework/react/overview) - useQuery patterns, caching strategies
- [@dnd-kit Documentation](https://docs.dndkit.com/presets/sortable) - Sortable grid implementation
- [Concept2 Logbook API Documentation](https://log.concept2.com/developers/documentation/) - OAuth flow, workout endpoints, validation
- [Strava API Documentation](https://developers.strava.com/docs/getting-started/) - Authentication, rate limits, activity endpoints
- [CSS-Tricks: Auto-Sizing Columns in CSS Grid](https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/) - auto-fit vs auto-fill behavior
- [web.dev: RAM (Repeat, Auto, Minmax) Pattern](https://web.dev/patterns/layout/repeat-auto-minmax) - Responsive grid layouts

### Secondary (MEDIUM confidence)
- [React.dev: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) - Hook patterns and best practices
- [DEV Community: Building Responsive Bento Grid with Tailwind CSS](https://dev.to/velox-web/how-to-build-a-responsive-bento-grid-with-tailwind-css-no-masonryjs-3f2c) - Dense packing with `grid-auto-flow: dense`
- [Medium: Building Customizable Dashboard Widgets Using React Grid Layout](https://medium.com/@antstack/building-customizable-dashboard-widgets-using-react-grid-layout-234f7857c124) - Dashboard patterns (verified with official docs)
- [AufaitUX: AI Design Patterns Enterprise Dashboards](https://www.aufaitux.com/blog/ai-design-patterns-enterprise-dashboards/) - 2026 adaptive dashboard trends

### Tertiary (LOW confidence)
- [Martech Zone: Deduplication Best Practices](https://martech.zone/deduplication-strategies-and-best-practices/) - General deduplication strategies (adapted for activity feeds)
- [Medium: Hyper-Personalization & Adaptive UI/UX](https://medium.com/@l8707287/hyper-personalization-adaptive-ui-ux-redefining-user-engagement-in-2025-72b879514da9) - Heuristic-based personalization trends

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TanStack Query, @dnd-kit, and CSS Grid are industry standards with official documentation
- Architecture: HIGH - Patterns verified with official docs and existing codebase conventions
- Pitfalls: MEDIUM - Based on common issues from community (Stack Overflow, GitHub issues) and official API docs warnings

**Research date:** 2026-01-23
**Valid until:** ~30 days (stable ecosystem - React, CSS Grid, TanStack Query have mature APIs)

**Notes:**
- Existing Prisma schema already has all required models (DashboardPreferences, Activity, Concept2Auth, StravaAuth, ActivitySource enum). Zero new models needed.
- @dnd-kit is already installed at correct versions. Zero new drag-drop dependencies.
- Axios is already installed. Can be used as queryFn in TanStack Query.
- Only new dependency: TanStack Query v5 (core library for external API data fetching).
