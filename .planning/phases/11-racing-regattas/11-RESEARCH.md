# Phase 11: Racing & Regattas - Research

**Researched:** 2026-01-25
**Domain:** Regatta management, race day operations, timeline scheduling, external rankings integration
**Confidence:** MEDIUM

## Summary

This phase implements regatta management with three-tier hierarchy (Regatta → Event → Race), race day command center with timeline visualization, external rankings import from multiple sources, and comprehensive results tracking with rowing-specific margin calculations.

Research focused on understanding:
1. **Timeline UI patterns** for race day command center with horizontal day views
2. **CSV import patterns** for bulk results entry (already established in codebase)
3. **External rankings data sources** (Row2k, USRowing, RegattaCentral) - APIs not publicly documented
4. **Heat progression systems** from World Rowing official rules
5. **Collaborative checklist patterns** for pre-race logistics

The codebase already has strong patterns from Phase 10 (training calendar with react-big-calendar) and Phase 7 (CSV import workflow with column mapping). These patterns should be extended for regatta management.

**Primary recommendation:** Build on existing calendar/timeline patterns (react-big-calendar), extend CSV import patterns for results, implement manual entry as primary method for external rankings with optional scraping as future enhancement, and use established form patterns (react-hook-form + Zod) for race entries and checklists.

## Standard Stack

### Core (Already in Codebase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-big-calendar | Latest (used in Phase 10) | Calendar and timeline views | Already used for training calendar, supports custom views, drag-drop, and timeline rendering |
| @headlessui/react | Latest (used throughout) | Tabs and modals | Established pattern for UI components, used in training page |
| react-hook-form | v7.x (used throughout) | Form management | Standard form library, used in all V2 forms |
| zod | Latest (used throughout) | Schema validation | Standard validation library paired with react-hook-form |
| date-fns | Latest (used in Phase 10) | Date/time calculations | Already used for calendar operations, warmup time calculations |
| framer-motion | Latest (used throughout) | Animations | Standard animation library for modals, transitions |
| recharts | v3.7.0 (used in Phase 7) | Data visualization | Used for erg progress charts, suitable for rankings visualization |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-papaparse | Latest | CSV parsing | Results import for large regattas - pattern established in Phase 7 |
| @tanstack/react-query | v5 (used throughout) | Server state management | Already standard for data fetching, mutations |
| zustand | Latest (used for complex state) | Client state (if needed) | Only for complex race day command center state if needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-big-calendar | react-calendar-timeline | Timeline library has better horizontal timeline support, but adds new dependency. Stick with react-big-calendar and create custom day view. |
| Manual ranking entry | Automated scraping | No public APIs documented for Row2k/USRowing/RegattaCentral. Manual entry is reliable, scraping would require maintenance. Start manual, add scraping later if needed. |
| Custom checklist | react-checklist npm package | Package is 4 years old. Build simple custom checklist with existing patterns (better maintainability). |

**Installation:**
```bash
# No new dependencies required - all libraries already in package.json
# Verify versions:
npm list react-big-calendar @headlessui/react react-hook-form zod date-fns framer-motion recharts react-papaparse
```

## Architecture Patterns

### Recommended Project Structure

```
src/v2/
├── components/
│   ├── regatta/
│   │   ├── RegattaForm.tsx              # Regatta CRUD form (react-hook-form + Zod)
│   │   ├── RegattaList.tsx              # List view (default)
│   │   ├── RegattaCalendar.tsx          # Calendar view (toggle)
│   │   ├── EventForm.tsx                # Event creation within regatta
│   │   ├── RaceForm.tsx                 # Race creation within event
│   │   ├── RaceEntryForm.tsx            # Link lineup or create custom entry
│   │   ├── ResultsForm.tsx              # Place + time entry with auto-margin calculation
│   │   ├── ResultsCSVImport.tsx         # Bulk results import (extend Phase 7 pattern)
│   │   ├── MarginDisplay.tsx            # Toggle between "1 length" and "5.2s"
│   │   └── index.ts                     # Barrel export
│   ├── race-day/
│   │   ├── CommandCenter.tsx            # Main race day page
│   │   ├── DayTimeline.tsx              # Horizontal timeline (custom react-big-calendar view)
│   │   ├── NextRaceCard.tsx             # Current/next race info
│   │   ├── HeatSheet.tsx                # Heat listings with progression rules
│   │   ├── WarmupSchedule.tsx           # Auto-calculated launch times
│   │   ├── PreRaceChecklist.tsx         # Role-based checklist component
│   │   ├── ChecklistTemplateForm.tsx    # Template creation (home/away regatta)
│   │   └── index.ts
│   ├── rankings/
│   │   ├── RankingsView.tsx             # Unified view with source badges
│   │   ├── RankingImportForm.tsx        # Manual entry form for external rankings
│   │   ├── RankingCard.tsx              # Team ranking card with confidence
│   │   ├── HeadToHeadTable.tsx          # Historical comparison table
│   │   └── index.ts
│   └── forms/
│       └── [existing form components]
├── pages/
│   ├── RegattasPage.tsx                 # Main regatta management page
│   ├── RaceDayCommandCenter.tsx         # Race day operations page
│   └── RankingsPage.tsx                 # Rankings and comparisons page
├── hooks/
│   ├── useRegattas.ts                   # Regatta CRUD hooks
│   ├── useRaces.ts                      # Race CRUD hooks
│   ├── useRaceResults.ts                # Results entry and margin calculation
│   ├── useRankings.ts                   # External rankings CRUD
│   └── useChecklists.ts                 # Checklist templates and instances
└── utils/
    ├── marginCalculations.ts            # Boat length conversions, terminology
    ├── progressionRules.ts              # Heat → Final qualification logic
    ├── warmupCalculator.ts              # Launch time calculations (date-fns)
    └── rankingConfidence.ts             # Confidence score calculations
```

### Pattern 1: React Big Calendar Custom Day Timeline View

**What:** Create custom view for horizontal day timeline with current time marker
**When to use:** Race day command center needs full-day horizontal view
**Example:**
```typescript
// Source: Existing DragDropCalendar.tsx pattern + react-big-calendar docs
import { Calendar, View, Views } from 'react-big-calendar';

// Custom toolbar to show only day view on race day
const RaceDayToolbar = ({ date, onNavigate }) => (
  <div className="race-day-toolbar">
    <h2>{format(date, 'EEEE, MMMM d, yyyy')}</h2>
    {/* Current time marker updated every minute */}
  </div>
);

// Use existing localizer from training calendar
const RaceDayTimeline = ({ raceDate, events }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Calendar
      localizer={localizer}
      date={raceDate}
      view={Views.DAY}
      onView={() => {}} // Lock to day view
      events={events}
      components={{
        toolbar: RaceDayToolbar,
        // Custom time marker in event renderer
      }}
      step={15} // 15-minute intervals
      timeslots={4} // 4 slots per hour
    />
  );
};
```

### Pattern 2: CSV Import with Column Mapping (Extend Phase 7 Pattern)

**What:** Multi-step import flow: upload → map columns → preview → import
**When to use:** Bulk results entry from regatta organizers
**Example:**
```typescript
// Source: Existing ErgCSVImportModal.tsx pattern (Phase 7)
// Extend for race results:

type ResultColumnMapping = {
  teamName?: string;
  place?: string;
  finishTime?: string;
  eventName?: string;
};

const validateResultRow = (
  row: Record<string, string>,
  mapping: ResultColumnMapping,
  eventName: string
) => {
  const errors: ValidationError[] = [];

  // Team name required
  if (!mapping.teamName || !row[mapping.teamName]) {
    errors.push({ field: 'teamName', message: 'Team name required' });
  }

  // Either place or time required
  const hasPlace = mapping.place && row[mapping.place];
  const hasTime = mapping.finishTime && row[mapping.finishTime];
  if (!hasPlace && !hasTime) {
    errors.push({ field: 'result', message: 'Place or time required' });
  }

  return errors;
};

// Reuse ErgCSVImportModal structure:
// Step 1: Upload → Step 2: Map → Step 3: Preview → Step 4: Import
```

### Pattern 3: External Rankings Manual Entry (Start Simple)

**What:** Manual form entry for rankings from Row2k, USRowing, RegattaCentral
**When to use:** Initial implementation - no public APIs available
**Example:**
```typescript
// Source: react-hook-form + Zod pattern (established)
const rankingSchema = z.object({
  source: z.enum(['row2k', 'usrowing', 'regattacentral', 'manual']),
  teamName: z.string().min(1, 'Team name required'),
  boatClass: z.string().min(1, 'Boat class required'),
  ranking: z.number().int().positive(),
  season: z.string().optional(),
  updatedDate: z.date(),
  notes: z.string().optional(),
});

const RankingImportForm = () => {
  const form = useForm({
    resolver: zodResolver(rankingSchema),
    defaultValues: {
      source: 'manual',
      updatedDate: new Date(),
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Source badge selector */}
      {/* Team autocomplete (existing teams from race results) */}
      {/* Boat class selector */}
      {/* Ranking input */}
      {/* Date picker (shows "Updated 3 days ago" in UI) */}
    </form>
  );
};
```

### Pattern 4: Collaborative Checklist with Role-Based Items

**What:** Template-based checklists with role filtering (coach/coxswain/anyone)
**When to use:** Pre-race logistics tracking
**Example:**
```typescript
// Source: Custom pattern (no library needed - 4yr old npm package)
type ChecklistItem = {
  id: string;
  text: string;
  role: 'coach' | 'coxswain' | 'anyone';
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
};

type ChecklistTemplate = {
  id: string;
  name: string; // "Home Regatta", "Away Regatta"
  items: Omit<ChecklistItem, 'id' | 'completed' | 'completedBy' | 'completedAt'>[];
};

const PreRaceChecklist = ({ raceId, userRole }) => {
  const { checklist, updateItem } = useRaceChecklist(raceId);

  // Filter items by role for display
  const visibleItems = checklist.items.filter(
    item => item.role === 'anyone' || item.role === userRole
  );

  return (
    <div className="checklist">
      {visibleItems.map(item => (
        <ChecklistItem
          key={item.id}
          item={item}
          onToggle={(checked) => updateItem(item.id, checked)}
          showCompletedBy={true} // "✓ by Sarah (10min ago)"
        />
      ))}
      {/* Progress bar: X of Y items complete */}
    </div>
  );
};
```

### Pattern 5: Heat Progression Rules Implementation

**What:** Define progression logic based on World Rowing rules
**When to use:** Determining which crews advance from heats to finals
**Example:**
```typescript
// Source: World Rowing Rules of Racing
type ProgressionRule = {
  fromRound: 'heat' | 'repechage' | 'semifinal';
  toRound: 'repechage' | 'semifinal' | 'final-a' | 'final-b';
  qualifyCount: number; // Top N advance
  condition?: string; // e.g., "if field > 12 boats"
};

const calculateProgression = (
  results: RaceResult[],
  rules: ProgressionRule[]
) => {
  // Sort by place
  const sorted = results.sort((a, b) => (a.place || 99) - (b.place || 99));

  // Apply rules
  rules.forEach(rule => {
    const qualifiers = sorted.slice(0, rule.qualifyCount);
    // Mark qualifiers for next round
  });

  return {
    qualifiers: /* crews advancing */,
    nonQualifiers: /* crews eliminated */,
    suggestion: "Top 3 advance to Final A, 4-6 advance to Final B"
  };
};
```

### Anti-Patterns to Avoid

- **Building custom timeline from scratch:** react-big-calendar already handles complexity of day views, time slots, event rendering. Extend it with custom views rather than replacing.
- **Automatic scraping without fallback:** External ranking sites have no public APIs and may change HTML structure. Always have manual entry as primary/fallback method.
- **Hardcoded progression rules:** Different regattas use different formats. Make progression rules configurable per event (dropdown of common patterns, coach confirms).
- **Storing times without timezone context:** Race times should use ISO 8601 with timezone. Use date-fns for consistent handling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing and validation | Custom file reader + validation | react-papaparse + existing Phase 7 pattern | CSV has edge cases (quotes, escapes, encodings). Papa Parse handles them. Codebase already has proven workflow. |
| Date/time calculations for warmup | Custom math | date-fns sub, add, differenceInMinutes | Warmup time = race time - X minutes. date-fns handles DST, timezones correctly. |
| Margin calculations (seconds ↔ boat lengths) | Manual conversion | Dedicated utility function | Boat length varies by class (8+ = ~60ft, 4+ = ~42ft). Store both seconds and terminology, calculate on display. |
| Calendar/timeline rendering | Custom grid | react-big-calendar custom view | Calendar rendering is complex (month boundaries, time slots, event positioning). Library handles it. |
| Form validation | Custom validators | Zod schemas | Race entry has complex validation (must have lineup OR custom roster, time OR place). Zod provides type-safe schemas. |

**Key insight:** This phase builds on strong patterns from Phases 7 (CSV import) and 10 (calendar). Don't reinvent - extend those patterns. Custom solutions for rankings scraping and margin calculations are simple enough to build in-house.

## Common Pitfalls

### Pitfall 1: Assuming External Rankings Have APIs

**What goes wrong:** Attempting to build automated import from Row2k, USRowing, RegattaCentral without verifying API availability.
**Why it happens:** Common assumption that popular sites have public APIs.
**How to avoid:** Start with manual entry. Build scraping as optional enhancement later if needed.
**Warning signs:** No API documentation found in search results. RegattaCentral mentions "developer APIs" but no public docs.

### Pitfall 2: Hardcoding Heat Progression Logic

**What goes wrong:** Implementing single progression pattern (e.g., "top 3 advance") that doesn't work for all regatta formats.
**Why it happens:** World Rowing has standard rules, but regattas vary.
**How to avoid:** System suggests progression based on results, coach confirms/overrides. Store progression rules per event as data, not code.
**Warning signs:** Code like `if (place <= 3) { advanceToFinal = true; }` - this should be configurable.

### Pitfall 3: Mixing Margin Terminology and Calculations

**What goes wrong:** Storing "1 length" as string, trying to calculate margins from it, or vice versa.
**Why it happens:** Rowing uses both terminology ("open water", "1½ lengths") and exact times.
**How to avoid:** Always store margin in seconds in database. Calculate boat-length equivalents on display. Provide toggle in UI between rowing terms and exact seconds.
**Warning signs:** Database has `marginText: string` instead of `marginBackSeconds: Decimal`. Can't perform calculations.

### Pitfall 4: Not Handling Partial Race Results

**What goes wrong:** Requiring all fields (place AND time) when regattas often have incomplete data.
**Why it happens:** Developer assumes complete results available.
**How to avoid:** Make place and time individually optional, but require at least one. Allow margin calculation from either place order or time differences.
**Warning signs:** Form validation fails when user only knows placement but not exact times.

### Pitfall 5: Race Day Timeline Performance

**What goes wrong:** Re-rendering entire timeline every minute for current time marker.
**Why it happens:** `setCurrentTime(new Date())` in useEffect causes full calendar re-render.
**How to avoid:** Memoize calendar events, use React.memo for timeline components, update only time marker element.
**Warning signs:** Frame drops or lag when timeline updates. React DevTools shows Calendar re-rendering unnecessarily.

### Pitfall 6: Warmup Time Calculation Edge Cases

**What goes wrong:** Simple subtraction (race time - 60 minutes) doesn't account for multi-race conflicts, launch queue, or minimum warmup duration.
**Why it happens:** Initial implementation uses naive calculation.
**How to avoid:**
- Start with auto-calculation (race time - configurable duration)
- Always allow coach override
- Future: detect conflicts (same boat in two races too close together)
**Warning signs:** Coxswains report impossible warmup schedules (not enough time between races).

## Code Examples

Verified patterns from codebase and official sources:

### Margin Calculation Utility

```typescript
// Source: Rowing margin terminology + Phase 9 marginCalculationService.js pattern
// File: src/v2/utils/marginCalculations.ts

// Boat lengths in feet (approximate)
const BOAT_LENGTHS: Record<string, number> = {
  '8+': 60,
  '4+': 42,
  '4-': 42,
  '4x': 42,
  '2+': 34,
  '2-': 27,
  '2x': 27,
  '1x': 26,
};

export function calculateMarginSeconds(
  winnerTimeSeconds: number,
  loserTimeSeconds: number
): number {
  return Math.max(0, loserTimeSeconds - winnerTimeSeconds);
}

export function secondsToBoatLengths(
  marginSeconds: number,
  winnerSpeed: number, // m/s
  boatClass: string
): number {
  // Distance covered in margin time
  const distanceMeters = winnerSpeed * marginSeconds;

  // Convert boat length to meters
  const boatLengthMeters = BOAT_LENGTHS[boatClass] * 0.3048; // feet to meters

  return distanceMeters / boatLengthMeters;
}

export function formatMarginTerminology(
  marginSeconds: number,
  winnerSpeed: number,
  boatClass: string
): string {
  const lengths = secondsToBoatLengths(marginSeconds, winnerSpeed, boatClass);

  if (lengths < 0.25) return 'Canvas'; // Photo finish
  if (lengths >= 10) return 'Open water';

  // Format as fractions: "1¼ lengths", "2½ lengths"
  const whole = Math.floor(lengths);
  const fraction = lengths - whole;

  let fractionStr = '';
  if (fraction >= 0.625) fractionStr = '¾';
  else if (fraction >= 0.375) fractionStr = '½';
  else if (fraction >= 0.125) fractionStr = '¼';

  if (whole === 0) return `${fractionStr} length`;
  if (fractionStr) return `${whole}${fractionStr} lengths`;
  return `${whole} length${whole > 1 ? 's' : ''}`;
}

// Usage in component:
const MarginDisplay = ({ marginSeconds, winnerSpeed, boatClass, showExact }) => {
  const terminology = formatMarginTerminology(marginSeconds, winnerSpeed, boatClass);
  const exact = `${marginSeconds.toFixed(2)}s`;

  return (
    <span>
      {showExact ? exact : terminology}
      <button onClick={() => setShowExact(!showExact)} className="text-xs ml-2">
        {showExact ? 'Show terminology' : 'Show exact'}
      </button>
    </span>
  );
};
```

### Warmup Time Calculator

```typescript
// Source: date-fns documentation + user requirements
// File: src/v2/utils/warmupCalculator.ts

import { subMinutes, format, isBefore, differenceInMinutes } from 'date-fns';

export type WarmupScheduleItem = {
  raceId: string;
  raceName: string;
  raceTime: Date;
  warmupStartTime: Date;
  launchTime: Date;
  durationMinutes: number;
  warning?: string; // Conflict detection
};

export function calculateWarmupSchedule(
  races: Array<{ id: string; name: string; scheduledTime: Date; boatClass: string }>,
  config: {
    warmupDuration: number; // minutes
    travelToStartTime: number; // minutes (launch → starting line)
  }
): WarmupScheduleItem[] {
  const schedule: WarmupScheduleItem[] = [];

  races.forEach(race => {
    const raceTime = race.scheduledTime;
    const launchTime = subMinutes(
      raceTime,
      config.warmupDuration + config.travelToStartTime
    );
    const warmupStartTime = subMinutes(raceTime, config.warmupDuration);

    schedule.push({
      raceId: race.id,
      raceName: race.name,
      raceTime,
      warmupStartTime,
      launchTime,
      durationMinutes: config.warmupDuration,
    });
  });

  // Detect conflicts (same boat in multiple races)
  // Future: group by boat/lineup, check for overlaps

  return schedule.sort((a, b) => a.launchTime.getTime() - b.launchTime.getTime());
}

// Coach can override individual launch times:
export function updateLaunchTime(
  item: WarmupScheduleItem,
  newLaunchTime: Date
): WarmupScheduleItem {
  const warmupStartTime = newLaunchTime; // Start warmup immediately after launch

  // Warn if not enough warmup time
  const minutesBeforeRace = differenceInMinutes(item.raceTime, newLaunchTime);
  const warning = minutesBeforeRace < 30
    ? `Only ${minutesBeforeRace} minutes before race`
    : undefined;

  return {
    ...item,
    launchTime: newLaunchTime,
    warmupStartTime,
    warning,
  };
}
```

### React Big Calendar Custom Day View

```typescript
// Source: Existing DragDropCalendar.tsx + react-big-calendar docs
// File: src/v2/components/race-day/DayTimeline.tsx

import { Calendar, Views, DateLocalizer } from 'react-big-calendar';
import { format } from 'date-fns';

type RaceDayEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'race' | 'warmup' | 'checkin' | 'equipment-prep';
  raceId?: string;
};

const CurrentTimeMarker = ({ currentTime }: { currentTime: Date }) => {
  // Calculate position based on current time
  // This gets rendered over the calendar grid
  return (
    <div
      className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
      style={{
        top: `${calculateTimePosition(currentTime)}%`,
      }}
    >
      <span className="text-xs text-red-500 font-medium bg-white px-1">
        {format(currentTime, 'HH:mm')}
      </span>
    </div>
  );
};

export const DayTimeline = ({
  raceDate,
  events,
  localizer
}: {
  raceDate: Date;
  events: RaceDayEvent[];
  localizer: DateLocalizer;
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Event style by type
  const eventStyleGetter = (event: RaceDayEvent) => {
    const styles: Record<string, any> = {
      race: { backgroundColor: '#3b82f6' },
      warmup: { backgroundColor: '#10b981' },
      checkin: { backgroundColor: '#f59e0b' },
      'equipment-prep': { backgroundColor: '#8b5cf6' },
    };

    return {
      style: styles[event.type] || {},
    };
  };

  return (
    <div className="relative">
      <Calendar
        localizer={localizer}
        date={raceDate}
        view={Views.DAY}
        onView={() => {}} // Lock to day view
        onNavigate={() => {}} // No navigation - single day
        events={events}
        eventPropGetter={eventStyleGetter}
        step={15} // 15-minute grid
        timeslots={4}
        min={new Date(raceDate.setHours(6, 0, 0))} // Start at 6 AM
        max={new Date(raceDate.setHours(20, 0, 0))} // End at 8 PM
        toolbar={false} // Custom toolbar
        className="race-day-timeline"
      />

      {/* Overlay current time marker */}
      {format(currentTime, 'yyyy-MM-dd') === format(raceDate, 'yyyy-MM-dd') && (
        <CurrentTimeMarker currentTime={currentTime} />
      )}
    </div>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate tabs for rankings sources | Unified view with source badges | User decision (Phase 11 context) | Simpler UI, easier comparison across sources |
| Hardcoded progression rules | Configurable + coach confirmation | Best practice from research | Supports different regatta formats |
| CSV-only results import | Manual entry primary, CSV optional | User decision | More reliable for small regattas, faster entry |
| react-big-calendar v0.x | v1.x with TypeScript support | 2023-2024 | Better type safety, improved DX |
| react-hook-form v7 | v8 beta (2026-01-11) | 2026 | Breaking change: useFieldArray uses field.key not field.id |

**Deprecated/outdated:**
- **react-checklist npm package:** Last published 4 years ago. Build custom checklist with existing UI patterns instead.
- **Scraping-first approach for rankings:** No public APIs, scraping is brittle. Manual entry is more maintainable.
- **Client-side only margin calculations:** Phase 9 established server-side marginCalculationService.js. Extend that for race results.

## Open Questions

Things that couldn't be fully resolved:

1. **External Rankings API Access**
   - What we know: RegattaCentral mentions "developer APIs" but no public documentation found. Row2k and USRowing have no documented APIs.
   - What's unclear: Whether APIs exist under NDA/partnership, or if scraping is only option.
   - Recommendation: Implement manual entry first (user decision from context). If demand exists, investigate RegattaCentral partnership or build optional scraper for Row2k HTML.

2. **Regatta Template/Duplicate Feature**
   - What we know: User marked as "Claude's discretion" in context.
   - What's unclear: How often coaches reuse regatta settings (location, events, schedule).
   - Recommendation: Start with "Duplicate" button on existing regatta (copy all metadata, clear results). Simpler than template system, achieves same goal.

3. **Offline Capability for Command Center**
   - What we know: User marked as "Claude's discretion". Race day may have poor connectivity.
   - What's unclear: How critical is offline support vs. complexity cost.
   - Recommendation: Start online-only. If coaches report connectivity issues, add service worker + IndexedDB for offline checklist persistence. Not critical for v2.0 launch.

4. **CSV Import Format for Results**
   - What we know: User marked as "Claude's discretion". Large regattas provide results in various formats.
   - What's unclear: Most common format (RegattaCentral export? Row2k format?).
   - Recommendation: Support flexible column mapping (like Phase 7 erg import). Let coach map whatever columns their regatta provides.

5. **Alert Timing Intervals**
   - What we know: User wants alerts for race, warmup, check-in, equipment prep. Marked as "Claude's discretion" for intervals.
   - What's unclear: Optimal timing (30/15/5 min vs other).
   - Recommendation: Start with configurable defaults: Equipment prep (60 min), Check-in (30 min), Warmup (auto-calculated), Race (15 min warning). Let coach adjust per regatta.

## Sources

### Primary (HIGH confidence)

- [World Rowing Rules of Racing](https://d2cx26qpfwuhvu.cloudfront.net/worldrowing/wp-content/uploads/2021/02/04162055/2021-World-Rowing-Rules-of-Racing-Final-240221.pdf) - Official progression rules, heat formats
- [react-big-calendar GitHub](https://github.com/jquense/react-big-calendar) - Custom view implementation
- [date-fns documentation](https://date-fns.org/) - Time calculations
- Existing codebase patterns: Phase 7 CSV import, Phase 10 calendar implementation

### Secondary (MEDIUM confidence)

- [RegattaCentral](https://www.regattacentral.com/) - Industry leader but no public API docs found
- [Recharts v3.7.0](https://recharts.github.io/en-US/) - Data visualization for rankings
- [react-papaparse](https://react-papaparse.js.org/) - CSV parsing library
- [Headless UI Dialog](https://headlessui.com/react/dialog) and [Tabs](https://headlessui.com/react/tabs) - Modal and tab patterns
- [React Hook Form v8 beta](https://github.com/react-hook-form/react-hook-form/releases/tag/v8.0.0-beta.1) - Breaking changes in useFieldArray

### Tertiary (LOW confidence - WebSearch only)

- [Top React Timeline Libraries 2026](https://demo.mobiscroll.com/react/timeline) - Alternatives to react-big-calendar (decided against)
- [Rowing margin terminology glossaries](https://en.wikipedia.org/wiki/Glossary_of_rowing_terms) - Community definitions, not official standard
- [RegattaMaster](https://regattamaster.com/), [Time-Team](https://time-team.nl/en/info/products/regatta-management) - Competitor research for feature inspiration

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All libraries already in codebase and proven in Phases 7, 10
- Architecture: **MEDIUM** - Patterns extend existing work, but race day timeline and rankings are new domains
- Pitfalls: **MEDIUM** - Based on common issues (margin calculations, partial data, offline) but not all verified in this specific domain
- External rankings: **LOW** - No public API documentation found, manual entry is safe fallback

**Research date:** 2026-01-25
**Valid until:** 30 days (stable domain - World Rowing rules change infrequently, core libraries stable)

## Ready for Planning

Research complete. Key findings:

1. **Extend, don't rebuild:** Phase 7 CSV import and Phase 10 calendar patterns are solid foundations
2. **Manual entry first:** No public APIs for external rankings. Build scraping later if needed.
3. **Simple checklists:** No library needed - custom component with role-based filtering
4. **Auto-calculate, allow override:** Warmup times, margins, progression rules - system suggests, coach confirms
5. **Store seconds, display terminology:** Margin calculations work both ways with toggle

All major technical decisions have clear recommendations. Planner can create task breakdown with confidence.
