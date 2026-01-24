# Phase 9: Seat Racing & Selection - Research

**Researched:** 2026-01-24
**Domain:** ELO rating systems, seat racing methodology, statistical confidence intervals, multi-step forms
**Confidence:** MEDIUM

## Summary

Phase 9 implements a seat racing system using ELO-based rankings to compare athlete performance. The core technical challenges are: (1) implementing ELO rating calculations adapted for rowing crew boat comparisons, (2) building confidence intervals based on sample size (piece count), (3) designing an optimal switch sequence generator to minimize pieces needed for statistical significance, and (4) creating an intuitive multi-step form for session/piece/assignment entry.

Research reveals **ELO systems are well-established for pairwise comparisons** and can be adapted to rowing where boat results are decomposed into athlete-vs-athlete comparisons. However, **seat racing introduces unique challenges**: athletes must stay on their assigned side (port/starboard), boat composition affects individual contribution measurement, and traditional one-swap methods create incomplete rankings. The **two-swaps method** (Purcer method) provides more complete data by swapping two athletes per piece and ranking sides independently.

**Database schema already exists** in Prisma (SeatRaceSession, SeatRacePiece, SeatRaceBoat, SeatRaceAssignment, AthleteRating), and **V1 implementation** provides working API routes and Zustand store. The V2 migration primarily requires building modern UI components with TanStack Query integration.

For confidence intervals, **small sample sizes (n < 30 pieces) require t-distribution** instead of normal distribution. Confidence levels can be mapped: PROVISIONAL (0-2 pieces), LOW (3-5 pieces), MEDIUM (6-10 pieces), HIGH (10+ pieces).

**Primary recommendation:** Implement basic ELO calculations in backend with configurable K-factor (default 32). Use piece count to determine confidence tiers rather than complex statistical formulas for MVP. Build multi-step wizard for session creation (metadata → pieces → assignments → switches). Defer optimal switch sequence generator to future enhancement (Phase 9.5) as it requires complex combinatorial optimization.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Query | v5.90.20 | API state management | Already in project (Phase 7-8), handles caching/invalidation for sessions |
| react-hook-form | 7.71.1 | Form validation | Already in project, handles multi-step wizard state |
| Zod | 4.3.4 | Schema validation | Already in project, validates session/piece/assignment data |
| recharts | 2.10.3 | Data visualization | Already in project, displays ELO trends and rankings |
| Framer Motion | 11.18.2 | UI transitions | Already in project, step transitions in wizard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @headlessui/react | 2.2.9 | UI components | Already in project, use for wizard step navigation, dropdowns |
| Existing V1 API | - | Backend logic | /api/v1/seat-races routes already implemented, reuse with TanStack Query |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom ELO implementation | elo.js npm package | Custom gives full control over K-factor, multi-way comparisons. Package is minimal (K=32 only) |
| Piece-count confidence tiers | Statistical t-distribution | T-distribution is more accurate but adds complexity. Tiers are simpler for MVP, upgrade later |
| Full switch optimizer | Manual coach entry | Optimizer requires complex algorithms (NP-hard). Manual entry sufficient for Phase 9, optimize in 9.5 |

**Installation:**
No additional dependencies needed. All required packages already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/v2/features/seat-racing/
├── components/
│   ├── SessionWizard.tsx           # Multi-step session creation wizard
│   ├── SessionMetadata.tsx         # Step 1: Date, conditions, boat class
│   ├── PieceManager.tsx            # Step 2: Add pieces with boats
│   ├── BoatTimeEntry.tsx           # Time input for each boat
│   ├── AthleteAssignment.tsx       # Step 3: Assign athletes to seats
│   ├── SwitchRecorder.tsx          # Step 4: Record switches between pieces
│   ├── RankingsTable.tsx           # ELO rankings with confidence badges
│   ├── RankingTrendChart.tsx       # Recharts line chart of ELO over time
│   ├── ConfidenceBadge.tsx         # Visual confidence indicator
│   ├── SessionList.tsx             # List of past sessions
│   └── SessionDetail.tsx           # Single session view with pieces
├── hooks/
│   ├── useSeatRaceSessions.ts      # TanStack Query hooks for sessions
│   ├── useAthleteRatings.ts        # TanStack Query hooks for ratings
│   └── useSessionWizard.ts         # Multi-step wizard state management
└── pages/
    ├── SeatRacingPage.tsx          # Main seat racing page
    └── SessionDetailPage.tsx       # Individual session detail
```

### Pattern 1: Multi-Step Wizard with react-hook-form

**What:** Wizard manages session creation across 4 steps: metadata → pieces → assignments → switches

**When to use:** Complex data entry requiring multiple related forms with state preservation

**Example:**
```typescript
// Source: https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const sessionSchema = z.object({
  date: z.date(),
  boatClass: z.string().min(1),
  conditions: z.enum(['calm', 'variable', 'rough']).optional(),
  pieces: z.array(z.object({
    sequenceOrder: z.number(),
    boats: z.array(z.object({
      name: z.string(),
      finishTimeSeconds: z.number().positive(),
      assignments: z.array(z.object({
        athleteId: z.string(),
        seatNumber: z.number().min(1).max(9),
        side: z.enum(['Port', 'Starboard', 'Cox']),
      })),
    })),
  })),
});

function SessionWizard() {
  const [step, setStep] = useState(0);
  const methods = useForm({
    resolver: zodResolver(sessionSchema),
    mode: 'onChange',
  });

  const steps = [
    <SessionMetadata key="metadata" />,
    <PieceManager key="pieces" />,
    <AthleteAssignment key="assignments" />,
    <SwitchRecorder key="switches" />,
  ];

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (isValid) setStep(step + 1);
  };

  const handleSubmit = methods.handleSubmit(async (data) => {
    // Submit to API via TanStack Query mutation
    await createSession(data);
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit}>
        {/* Step indicator */}
        <StepIndicator currentStep={step} totalSteps={4} />

        {/* Current step */}
        {steps[step]}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)}>
              Previous
            </button>
          )}
          {step < steps.length - 1 ? (
            <button type="button" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="submit">Create Session</button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
```

### Pattern 2: ELO Rating Calculation

**What:** Calculate new ELO ratings from boat race results

**When to use:** After piece completion when boat times are entered

**Example:**
```typescript
// Source: https://github.com/moroshko/elo.js + rowing adaptation
// Backend implementation (server/routes/seatRaces.js)

const K_FACTOR = 32; // Configurable per session

function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function getNewRating(
  currentRating: number,
  opponentRating: number,
  actualScore: number, // 1 = win, 0.5 = draw, 0 = loss
  kFactor: number = K_FACTOR
): number {
  const expected = getExpectedScore(currentRating, opponentRating);
  return currentRating + kFactor * (actualScore - expected);
}

// Rowing-specific: Convert boat times to pairwise comparisons
function processBoatPiece(boats: SeatRaceBoat[]) {
  // Sort boats by finish time (faster = better)
  const sorted = boats.sort((a, b) => a.finishTimeSeconds - b.finishTimeSeconds);

  // Generate all pairwise comparisons
  const comparisons: Comparison[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const winner = sorted[i];
      const loser = sorted[j];

      // For each athlete in winner boat vs each in loser boat
      winner.assignments.forEach(winnerAthlete => {
        loser.assignments.forEach(loserAthlete => {
          // Only compare athletes on same side (port vs port, starboard vs starboard)
          if (winnerAthlete.side === loserAthlete.side && winnerAthlete.side !== 'Cox') {
            comparisons.push({
              winnerAthleteId: winnerAthlete.athleteId,
              loserAthleteId: loserAthlete.athleteId,
              actualScore: 1, // Winner gets 1, loser gets 0
            });
          }
        });
      });
    }
  }

  return comparisons;
}

// Update ratings for all athletes in session
async function calculateRatings(sessionId: string) {
  const session = await prisma.seatRaceSession.findUnique({
    where: { id: sessionId },
    include: {
      pieces: {
        include: {
          boats: {
            include: { assignments: true },
          },
        },
      },
    },
  });

  // Get all comparisons from all pieces
  const allComparisons = session.pieces.flatMap(processBoatPiece);

  // Get current ratings for all athletes
  const athleteRatings = await prisma.athleteRating.findMany({
    where: {
      athleteId: { in: allComparisons.map(c => [c.winnerAthleteId, c.loserAthleteId]).flat() },
      ratingType: 'seat_race_elo',
    },
  });

  const ratingMap = new Map(athleteRatings.map(r => [r.athleteId, r]));

  // Apply all comparisons to update ratings
  allComparisons.forEach(({ winnerAthleteId, loserAthleteId, actualScore }) => {
    const winnerRating = ratingMap.get(winnerAthleteId)?.ratingValue || 1000;
    const loserRating = ratingMap.get(loserAthleteId)?.ratingValue || 1000;

    const newWinnerRating = getNewRating(winnerRating, loserRating, 1);
    const newLoserRating = getNewRating(loserRating, winnerRating, 0);

    // Update map with new ratings
    ratingMap.set(winnerAthleteId, {
      ...ratingMap.get(winnerAthleteId),
      ratingValue: newWinnerRating,
      racesCount: (ratingMap.get(winnerAthleteId)?.racesCount || 0) + 1,
    });
    ratingMap.set(loserAthleteId, {
      ...ratingMap.get(loserAthleteId),
      ratingValue: newLoserRating,
      racesCount: (ratingMap.get(loserAthleteId)?.racesCount || 0) + 1,
    });
  });

  // Persist updated ratings
  await Promise.all(
    Array.from(ratingMap.entries()).map(([athleteId, rating]) =>
      prisma.athleteRating.upsert({
        where: { athleteId_ratingType: { athleteId, ratingType: 'seat_race_elo' } },
        update: {
          ratingValue: rating.ratingValue,
          racesCount: rating.racesCount,
          confidenceScore: calculateConfidence(rating.racesCount),
          lastCalculatedAt: new Date(),
        },
        create: {
          athleteId,
          teamId: session.teamId,
          ratingType: 'seat_race_elo',
          ratingValue: rating.ratingValue,
          racesCount: rating.racesCount,
          confidenceScore: calculateConfidence(rating.racesCount),
        },
      })
    )
  );
}
```

### Pattern 3: Confidence Calculation (Simple Tier-Based)

**What:** Map piece count to confidence tiers for MVP simplicity

**When to use:** Displaying confidence badges, sorting by reliability

**Example:**
```typescript
// Simple tier-based approach for Phase 9
function calculateConfidence(racesCount: number): number {
  if (racesCount === 0) return 0;
  if (racesCount <= 2) return 0.25;  // PROVISIONAL
  if (racesCount <= 5) return 0.50;  // LOW
  if (racesCount <= 10) return 0.75; // MEDIUM
  return 0.95;                       // HIGH
}

function getConfidenceLabel(confidenceScore: number): string {
  if (confidenceScore === 0) return 'UNRATED';
  if (confidenceScore < 0.5) return 'PROVISIONAL';
  if (confidenceScore < 0.75) return 'LOW';
  if (confidenceScore < 0.95) return 'MEDIUM';
  return 'HIGH';
}

// Component usage
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const label = getConfidenceLabel(confidence);
  const colors = {
    UNRATED: 'bg-gray-500',
    PROVISIONAL: 'bg-red-500',
    LOW: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-green-500',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[label]}`}>
      {label}
    </span>
  );
}
```

### Pattern 4: TanStack Query Integration

**What:** Replace V1 Zustand store with TanStack Query for API state

**When to use:** All server data fetching (sessions, ratings, pieces)

**Example:**
```typescript
// Source: TanStack Query v5 patterns (consistent with Phase 7-8)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useSeatRaceSessions(teamId: string) {
  return useQuery({
    queryKey: ['seatRaceSessions', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/seat-races?teamId=${teamId}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: SessionCreate) => {
      const res = await fetch('/api/v1/seat-races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seatRaceSessions'] });
      queryClient.invalidateQueries({ queryKey: ['athleteRatings'] });
    },
  });
}

function useAthleteRatings(teamId: string, ratingType = 'seat_race_elo') {
  return useQuery({
    queryKey: ['athleteRatings', teamId, ratingType],
    queryFn: async () => {
      const res = await fetch(`/api/v1/athletes/ratings?teamId=${teamId}&type=${ratingType}`);
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

### Pattern 5: Rankings Visualization with Recharts

**What:** Display ELO rankings in sortable table and trend chart

**When to use:** Showing athlete rankings page

**Example:**
```typescript
// Source: Recharts documentation + existing Phase 7 patterns
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function RankingsChart({ rankings }: { rankings: AthleteRating[] }) {
  // Sort by rating descending
  const sorted = [...rankings].sort((a, b) => b.ratingValue - a.ratingValue);

  const data = sorted.map(r => ({
    name: r.athlete.lastName,
    rating: Math.round(r.ratingValue),
    confidence: r.confidenceScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis domain={[800, 1200]} />
        <Tooltip />
        <Bar
          dataKey="rating"
          fill="#3b82f6"
          opacity={(entry) => 0.3 + (entry.confidence * 0.7)} // Visual confidence via opacity
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Anti-Patterns to Avoid

- **Don't compare athletes across sides**: Port and starboard rowers have different roles. Rankings must be side-specific.
- **Don't use global K-factor without configuration**: Different teams may need different K-factors (16 for stable rankings, 32 for active, 64 for rapid adjustment).
- **Don't skip confidence indicators**: Coaches need to know when rankings are provisional vs. reliable.
- **Don't mutate wizard form state directly**: Use react-hook-form's setValue() to ensure validation triggers.
- **Don't calculate ratings client-side**: ELO calculations must be server-side to ensure consistency and prevent tampering.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-step form state | Custom step manager with useState | react-hook-form with wizard pattern | Handles validation, field persistence, error states automatically |
| ELO rating formula | Custom math | Proven formula: `E = 1/(1+10^((Rb-Ra)/400))`, `R' = R + K*(S-E)` | Well-tested in chess, sports, gaming. Standard 400-point spread for 10:1 odds |
| Confidence intervals | Complex t-distribution | Simple tier-based mapping for MVP | Statistical accuracy less important than UX clarity. Upgrade to t-distribution in future if needed |
| Optimal switch sequences | Greedy algorithm | Manual entry for Phase 9, defer optimizer | Optimal sequencing is NP-hard combinatorial problem. Requires linear programming or genetic algorithms |
| Time input parsing | Regex parser | Existing parseTimeToSeconds from Phase 7 | Already handles MM:SS.s, MM:SS, HH:MM:SS formats |

**Key insight:** Seat racing analysis is more art than science. Coaches value clarity and trust over statistical precision. Simple tier-based confidence is more useful than complex formulas that obscure meaning.

## Common Pitfalls

### Pitfall 1: Incomplete Pairwise Comparisons

**What goes wrong:** Using one-swap method creates incomplete ranking graphs where some athletes are never directly or indirectly compared.

**Why it happens:** One swap per piece only compares 2 athletes. With 8+ athletes, many pairs never race together.

**How to avoid:** Support both one-swap and two-swap methods. Recommend two-swap (Purcer method) for complete rankings. Warn coaches when comparison graph has disconnected components.

**Warning signs:** Some athletes have no rating changes, rankings have "islands" of comparable athletes with no bridge between groups

### Pitfall 2: Side Imbalance in Comparisons

**What goes wrong:** ELO ratings treat port and starboard as interchangeable, leading to invalid comparisons.

**Why it happens:** Athletes are assigned to one side (port or starboard) and cannot be compared across sides meaningfully.

**How to avoid:** Filter pairwise comparisons to only compare athletes on the same side. Maintain separate rankings for port and starboard.
```typescript
// WRONG - compares athletes on different sides
if (winner.assignments && loser.assignments) {
  comparisons.push({ winner: winner.assignments[0], loser: loser.assignments[0] });
}

// CORRECT - only compare same side
winner.assignments.forEach(winnerAthlete => {
  loser.assignments.forEach(loserAthlete => {
    if (winnerAthlete.side === loserAthlete.side && winnerAthlete.side !== 'Cox') {
      comparisons.push({ winner: winnerAthlete, loser: loserAthlete });
    }
  });
});
```

**Warning signs:** Port and starboard athletes ranked together, port athlete rated higher than stroke seat on starboard

### Pitfall 3: Wizard Form Doesn't Preserve State on Navigation

**What goes wrong:** User fills out Step 1, moves to Step 2, returns to Step 1, and all data is lost.

**Why it happens:** Form state is cleared on component unmount or not properly persisted.

**How to avoid:** Use FormProvider from react-hook-form to wrap entire wizard. Form state persists across step navigation.
```typescript
// WRONG - separate forms per step lose state
function Step1() {
  const { register } = useForm();
  return <input {...register('date')} />;
}

// CORRECT - shared form context
function SessionWizard() {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <Step1 />
      <Step2 />
    </FormProvider>
  );
}

function Step1() {
  const { register } = useFormContext(); // Accesses shared form state
  return <input {...register('date')} />;
}
```

**Warning signs:** Users report "losing my work when I go back", form validation errors on submit for fields in earlier steps

### Pitfall 4: K-Factor Too High or Too Low

**What goes wrong:** K=64 causes wild rating swings, K=16 makes ratings stagnant.

**Why it happens:** K-factor controls rating volatility. Higher K = more change per game.

**How to avoid:** Start with K=32 (industry standard). Make K-factor configurable per session. Consider reducing K for experienced athletes with many pieces.
```typescript
// Adaptive K-factor based on experience
function getKFactor(racesCount: number, baseK: number = 32): number {
  if (racesCount < 5) return baseK; // New athletes: full volatility
  if (racesCount < 20) return baseK * 0.75; // Intermediate: reduce volatility
  return baseK * 0.5; // Veterans: stable ratings
}
```

**Warning signs:** Athlete jumps 200 points in one piece (K too high), athlete wins 5 pieces in row but rating doesn't change (K too low)

### Pitfall 5: Ignoring Environmental Factors

**What goes wrong:** Downstream pieces weighted same as upstream, windy pieces same as calm.

**Why it happens:** Raw ELO doesn't account for conditions. Faster absolute times don't mean better relative performance.

**How to avoid:** Store conditions (wind, direction) per piece. Allow coaches to mark pieces as "exhibition" (don't count toward ratings). Add handicap field to boats for known shell speed differences.
```typescript
// Schema already supports this
model SeatRaceBoat {
  handicapSeconds Decimal @default(0) @db.Decimal(5, 2)
}

model SeatRacePiece {
  direction String? // upstream, downstream
}

// Apply handicap when determining winner
const adjustedTimeA = boatA.finishTimeSeconds + boatA.handicapSeconds;
const adjustedTimeB = boatB.finishTimeSeconds + boatB.handicapSeconds;
const winner = adjustedTimeA < adjustedTimeB ? boatA : boatB;
```

**Warning signs:** Coaches complain "this piece doesn't count, conditions changed", downstream pieces skewing ratings

## Code Examples

Verified patterns from official sources:

### Time Input Component (Reuse from Phase 7)
```typescript
// Source: Phase 7 implementation (/src/v2/features/erg/utils.ts)
function parseTimeToSeconds(timeStr: string): number {
  // Handles MM:SS.s, MM:SS, HH:MM:SS formats
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    // MM:SS or MM:SS.s
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  // Assume numeric seconds
  return parseFloat(timeStr);
}

function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}
```

### Step Indicator Component
```typescript
// Source: Multi-step wizard best practices
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = ['Session Info', 'Add Pieces', 'Assign Athletes', 'Record Switches'];

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, index) => (
        <div key={index} className="flex items-center">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2
            ${index < currentStep ? 'bg-green-500 border-green-500 text-white' : ''}
            ${index === currentStep ? 'border-blue-500 text-blue-500' : ''}
            ${index > currentStep ? 'border-gray-300 text-gray-300' : ''}
          `}>
            {index < currentStep ? '✓' : index + 1}
          </div>
          <span className="ml-2 text-sm font-medium">{label}</span>
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Rankings Table with Sorting
```typescript
// Source: Existing V1 RankingsDisplay.jsx + TanStack Table patterns
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

function RankingsTable() {
  const { data: ratings, isLoading } = useAthleteRatings(teamId);
  const [sorting, setSorting] = useState([{ id: 'ratingValue', desc: true }]);

  const columns = [
    { accessorKey: 'rank', header: 'Rank', size: 60 },
    { accessorKey: 'athlete.lastName', header: 'Athlete', size: 200 },
    { accessorKey: 'ratingValue', header: 'ELO Rating', size: 100 },
    { accessorKey: 'racesCount', header: 'Pieces', size: 80 },
    {
      accessorKey: 'confidenceScore',
      header: 'Confidence',
      cell: ({ row }) => <ConfidenceBadge confidence={row.original.confidenceScore} />,
      size: 120,
    },
  ];

  const table = useReactTable({
    data: ratings || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                className="cursor-pointer"
              >
                {header.column.columnDef.header}
                {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted()] ?? null}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple margin tracking | ELO-based rankings | 2010s+ | ELO provides transitive comparisons (A beat B, B beat C → A likely beats C) vs. direct margins only |
| Manual switch planning | Algorithm-generated sequences | Research area | Optimal sequences minimize pieces for statistical significance, but NP-hard to compute |
| Single global rating | Side-specific ratings | Rowing best practice | Port/starboard are different skills, must rank separately |
| Fixed K-factor | Adaptive K-factor | Modern implementations | New athletes need higher volatility, veterans need stability |
| Zustand for API state | TanStack Query | 2023+ in RowLab | Query provides caching, invalidation, loading states automatically |

**Deprecated/outdated:**
- One-swap method without side filtering: Creates invalid cross-side comparisons
- Client-side ELO calculations: Opens ratings to manipulation, inconsistency
- Confidence based on margin size: Sample size (piece count) is better confidence indicator

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal Switch Sequence Algorithm**
   - What we know: Requires minimizing pieces while maximizing pairwise comparison coverage
   - What's unclear: What algorithm is computationally feasible for 8-16 athletes? Greedy heuristic vs. exact solver?
   - Recommendation: Defer to Phase 9.5. Manual entry sufficient for Phase 9 MVP. Consider linear programming (pulp/scipy) or genetic algorithm in Python microservice.

2. **Cross-Session Rating Persistence**
   - What we know: AthleteRating table tracks ratings, racesCount, confidence
   - What's unclear: Do ratings reset per season? Per boat class? Or lifetime accumulation?
   - Recommendation: Start with lifetime accumulation. Add season/class filtering in UI. Coach can manually reset ratings if needed.

3. **Handicap Application**
   - What we know: Schema has handicapSeconds field on SeatRaceBoat
   - What's unclear: How do coaches determine handicap? Shell speed database? Manual input?
   - Recommendation: Manual input only for Phase 9. Coach knows which shells are faster. Future: build shell speed database from race history.

4. **Statistical Confidence Formula**
   - What we know: T-distribution requires sample size, standard deviation
   - What's unclear: What is "standard deviation" of ELO ratings in rowing? Unknown variance?
   - Recommendation: Use simple tier-based mapping for Phase 9 (0-2 pieces = PROVISIONAL, 3-5 = LOW, etc.). If coaches demand statistical rigor, research ELO rating variance in rowing literature for Phase 9.5.

## Sources

### Primary (HIGH confidence)
- **/recharts/recharts** (Context7) - Bar/line charts for rankings visualization
- **Prisma schema** (/home/swd/RowLab/prisma/schema.prisma) - Existing seat racing tables (SeatRaceSession, SeatRacePiece, SeatRaceBoat, SeatRaceAssignment, AthleteRating)
- **Existing V1 implementation** (/home/swd/RowLab/src/store/seatRaceStore.js, /home/swd/RowLab/src/components/SeatRacing/RankingsDisplay.jsx) - Working API patterns

### Secondary (MEDIUM confidence)
- [Elo rating system - Wikipedia](https://en.wikipedia.org/wiki/Elo_rating_system) - ELO formula, expected score calculation
- [elo.js GitHub](https://github.com/moroshko/elo.js) - JavaScript ELO implementation (K=32, getNewRating, getRatingDelta)
- [Why rate when you could compare? Using the "EloChoice" package](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0190393) - Pairwise comparison applications
- [Extension of the Elo rating system to margin of victory](https://www.sciencedirect.com/science/article/abs/pii/S0169207020300157) - Margin-adjusted ELO (future enhancement)
- [Crew Selection Part 6 - Seat Racing Protocol - row2k.com](https://www.row2k.com/features/5486/Crew-Selection-Part-6---Seat-Racing-Protocol/) - Rowing seat racing methods
- [GitHub - lindig/seat-racing](https://github.com/lindig/seat-racing) - Seat racing methodology analysis (one-swap vs. two-swap methods)
- [Build a Multistep Form With React Hook Form](https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form) - React wizard pattern
- [React: Building a Multi-Step Form with Wizard Pattern](https://medium.com/@vandanpatel29122001/react-building-a-multi-step-form-with-wizard-pattern-85edec21f793) - Multi-step UX patterns
- [Construct a confidence interval for a small sample size](https://medium.com/@andersongimino/construct-a-confidence-interval-for-a-small-sample-size-bc223f170869) - T-distribution for n < 30

### Tertiary (LOW confidence)
- WebSearch results on ELO K-factor optimization, confidence intervals - General concepts, not rowing-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, proven in Phase 7-8
- Architecture: MEDIUM - ELO formula proven, but rowing-specific adaptations (side-filtering, two-swap method) less documented
- Pitfalls: MEDIUM - Common ELO issues well-known, seat racing pitfalls inferred from GitHub discussion and row2k article

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, ELO mathematics unchanged for decades)
