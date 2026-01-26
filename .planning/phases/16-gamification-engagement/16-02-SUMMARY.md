---
phase: 16
plan: 02
subsystem: type-system
tags: [typescript, types, gamification, achievements, challenges, personal-records, streaks]

dependencies:
  requires: []
  provides:
    - gamification-type-definitions
    - gamification-feature-toggle
  affects:
    - 16-03-achievements-schema
    - 16-04-achievements-ui
    - 16-05-challenges-schema
    - 16-06-challenges-ui
    - 16-07-pr-tracking
    - 16-08-streaks

tech-stack:
  added: []
  patterns:
    - typescript-type-definitions
    - feature-toggle-registration

key-files:
  created:
    - src/v2/types/gamification.ts
  modified:
    - src/v2/types/feature-toggles.ts

decisions:
  - id: gamification-as-advanced-feature
    decision: "Gamification is an advanced feature (defaultEnabled: false)"
    rationale: "Per CONTEXT.md, gamification is an engagement system that teams can toggle off entirely if not needed"
    alternatives: ["Make gamification a core feature"]
    impact: "Teams must explicitly enable gamification features in settings"

  - id: pr-scope-levels
    decision: "PR tracking supports all-time, season, and training-block scopes"
    rationale: "Athletes care about different contexts - all-time bests, season bests, and recent training block progress"
    alternatives: ["Only track all-time PRs"]
    impact: "More granular PR detection and celebration opportunities"

  - id: challenge-types
    decision: "Challenges support both individual and collective types"
    rationale: "Individual challenges create personal competition, collective challenges build team unity"
    alternatives: ["Only individual challenges"]
    impact: "Enables both competitive and collaborative engagement mechanics"

  - id: streak-grace-periods
    decision: "Streaks include grace period tracking (days used per week)"
    rationale: "Prevents discouragement from single missed day due to valid reasons (class, illness)"
    alternatives: ["Strict daily streaks with no grace period"]
    impact: "More forgiving streak mechanics that maintain engagement"

metrics:
  duration: "123 seconds"
  completed: "2026-01-26"
---

# Phase 16 Plan 02: Gamification Type Definitions Summary

**One-liner:** Comprehensive TypeScript type definitions for achievements, challenges, PRs, and streaks with gamification as toggleable advanced feature

## What Was Built

Created the complete type system foundation for the gamification engine:

1. **Achievement Types (26 interfaces total)**
   - Categories: Erg, Attendance, Racing
   - Types: first-time, volume, performance, consistency
   - Rarity tiers: Common, Rare, Epic, Legendary
   - Achievement criteria for unlock logic
   - Progress tracking interfaces

2. **Challenge System Types**
   - Challenge types: individual, collective
   - Scoring metrics: meters, workouts, attendance, composite
   - Formula configuration for weighted scoring
   - Handicap system for fair competition
   - Leaderboard entry structures

3. **Personal Record Types**
   - PR scopes: all-time, season, training-block
   - PR context detection with improvement deltas
   - Team record tracking
   - PR celebration data for UI

4. **Streak Types**
   - Streak categories: attendance, workout, pr, challenge
   - Grace period tracking
   - Streak display info with status (active, at-risk, broken)

5. **Season Journey Types**
   - Milestone tracking (PRs, achievements, challenges, races)
   - Season summary statistics
   - Narrative generation support

6. **Shareable Card Types**
   - Data structure for generating social media cards
   - Workout info, PR context, team rankings

7. **API Response Types**
   - Standard response wrapper
   - Achievement, challenge, PR, and streak responses

## Technical Decisions

### Achievement Criteria Structure
Designed flexible criteria system:
```typescript
interface AchievementCriteria {
  type: 'volume' | 'count' | 'streak' | 'performance' | 'time-based';
  target: number;
  metric?: string;
  testType?: string;
  conditions?: Record<string, unknown>;
}
```

Supports diverse unlock conditions while remaining type-safe.

### Challenge Formula Configuration
Enabled complex scoring with typed formulas:
```typescript
interface ChallengeFormula {
  type: 'sum' | 'average' | 'max' | 'weighted';
  weights?: Record<string, number>;
  customExpression?: string;
}
```

Balances simplicity for basic challenges with power for advanced scoring.

### PR Context Detection
Multi-scope PR detection:
```typescript
type PRScope = 'all-time' | 'season' | 'training-block';
```

Athletes see PR celebrations in all relevant contexts.

### Streak Grace Periods
Forgiving streak mechanics:
```typescript
interface Streak {
  gracePeriodUsed: number;
  gracePeriodMax: number;
  isActive: boolean;
}
```

Maintains engagement without discouraging athletes with single missed days.

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

Verification completed:
- TypeScript compilation passes (--skipLibCheck for clean build)
- 366 lines of comprehensive type definitions
- 26+ exported interfaces
- All major types present: Achievement, Challenge, PersonalRecord, Streak
- Gamification feature ID registered in feature-toggles.ts

## Next Phase Readiness

**Ready for Phase 16-03 (Achievements Schema):**
- All achievement types defined
- Achievement criteria structure ready for Prisma schema
- Progress tracking types ready for database mapping

**Ready for Phase 16-05 (Challenges Schema):**
- Challenge types and status enums defined
- Challenge formula and handicap structures ready
- Leaderboard entry types ready for API responses

**Ready for Phase 16-07 (PR Tracking):**
- PR scope types defined
- PR context detection structures ready
- PR celebration data types ready for UI

**Ready for Phase 16-08 (Streaks):**
- Streak category types defined
- Grace period tracking structures ready
- Streak display types ready for UI

**Blockers:** None

**Concerns:** None - comprehensive type coverage provides strong foundation

## Performance Characteristics

Type-only definitions - no runtime impact.

## Migration/Deployment Notes

None required - new types only.

## Known Issues

None.

## Usage Examples

### Achievement Progress Display
```typescript
const achievement: AchievementWithProgress = {
  id: '...',
  name: 'Century Mark',
  description: 'Row 100,000 meters',
  category: 'Erg',
  type: 'volume',
  rarity: 'Rare',
  criteria: {
    type: 'volume',
    target: 100000,
    metric: 'meters'
  },
  progress: 75000,
  target: 100000,
  percentComplete: 75,
  isUnlocked: false,
  isPinned: true,
  createdAt: '2026-01-26T00:00:00Z'
};
```

### Challenge Creation
```typescript
const challenge: CreateChallengeInput = {
  name: 'January Million Meter Challenge',
  type: 'collective',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  metric: 'meters',
  formula: {
    type: 'sum'
  }
};
```

### PR Detection
```typescript
const prContext: PRContext = {
  scope: 'all-time',
  isPR: true,
  previousBest: 412.5,
  improvement: 2.3,  // 2.3 seconds faster
  rank: 3
};
```

## Screenshots/Artifacts

Type definitions: `src/v2/types/gamification.ts` (366 lines)

## Lessons Learned

1. **Comprehensive Type Coverage**: Defining all types upfront prevents type mismatches across schema, API, and UI layers
2. **Flexible Criteria System**: Record<string, unknown> for conditions allows extensibility without breaking type safety
3. **Multi-Scope PR Tracking**: Supporting multiple PR contexts adds complexity but provides richer athlete experience
4. **Grace Period Design**: Streak grace periods require careful tracking but prevent engagement drop-off

## Resources

- Type definitions: `src/v2/types/gamification.ts`
- Feature toggle: `src/v2/types/feature-toggles.ts`
- Research: `.planning/phases/16-gamification-engagement/16-RESEARCH.md`
- Context: `.planning/phases/16-gamification-engagement/16-CONTEXT.md`
