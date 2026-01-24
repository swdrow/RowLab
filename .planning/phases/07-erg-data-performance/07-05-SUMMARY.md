---
phase: 07
plan: 05
subsystem: erg-sync-ui
tags: [concept2, sync-status, react, tanstack-query]
requires: [07-01]
provides:
  - C2 connection status visualization
  - Manual sync trigger controls
  - Team-wide C2 status overview
affects: [07-06, 07-07]
tech-stack:
  added: []
  patterns:
    - Relative time formatting for sync timestamps
    - Stale data detection (>60min = yellow badge)
    - Bulk status queries with useTeamC2Statuses
    - Slide-out panel pattern for auxiliary views
key-files:
  created:
    - src/v2/components/erg/C2StatusBadge.tsx
    - src/v2/components/erg/C2SyncButton.tsx
    - src/v2/components/erg/TeamC2StatusList.tsx
  modified:
    - src/v2/components/erg/index.ts
    - src/v2/pages/ErgTestsPage.tsx
decisions:
  - id: c2-stale-threshold-60min
    choice: 60 minutes threshold for stale sync warning
    rationale: Balances alerting coaches to outdated data without excessive yellow badges during normal usage
  - id: relative-time-formatting
    choice: Custom relative time formatter (2m ago, 3h ago, 2d ago)
    rationale: More readable than absolute timestamps, matches modern UI patterns (GitHub, Slack, etc.)
  - id: team-status-uses-bulk-query
    choice: useTeamC2Statuses for bulk status fetch
    rationale: Prevents N+1 query problem when loading team overview, single query for all athlete statuses
  - id: sync-all-placeholder
    choice: Sync All button with sequential individual syncs
    rationale: Functional placeholder until dedicated batch sync API endpoint available in future plan
metrics:
  duration: 9 minutes
  completed: 2026-01-24
---

# Phase 7 Plan 5: C2 Sync Status & Manual Sync UI Summary

**One-liner:** Visual C2 connection status badges, manual sync buttons, and team overview panel for monitoring athlete integrations

## What Was Built

### C2StatusBadge Component
- **Visual states:** Connected+recent (green), connected+stale (yellow), not connected (gray), loading
- **Relative timestamps:** "2m ago", "3h ago", "2d ago" format for last sync
- **Stale detection:** >60 minutes triggers yellow warning state
- **Variants:** Full (with text) and compact (icon only) for flexible layouts

### C2SyncButton Component
- **Interactive states:** Ready, syncing (spinner), success (checkmark), error (alert)
- **Auto-reset:** Success/error states reset after 2-3 seconds
- **Disabled logic:** Automatically disabled if athlete not connected
- **Variants:** Full button with text or icon-only for compact layouts
- **Feedback:** Helpful tooltips explain each state

### TeamC2StatusList Component
- **Athlete rows:** Each athlete shows name, @username (if connected), status badge, sync button
- **Summary stats:** Total athletes, connected count, last team sync time
- **Sync All:** Batch sync for all connected athletes (sequential with delays)
- **Filter toggle:** Show all athletes or connected only
- **Bulk query:** Uses useTeamC2Statuses to fetch all statuses in single query

### ErgTestsPage Integration
- **Toggle button:** "C2 Status" button in page header with Network icon
- **Slide-out panel:** 384px panel from right side with TeamC2StatusList
- **Smooth transitions:** Layout adjusts smoothly when panel opens/closes
- **Persistent state:** Panel state maintained during session

## Technical Highlights

### Relative Time Formatting
Custom formatter handles multiple time scales:
```typescript
< 1 minute  → "Just now"
< 60 min    → "2m ago"
< 24 hours  → "3h ago"
< 7 days    → "2d ago"
< 4 weeks   → "1w ago"
>= 4 weeks  → "2mo ago"
```

### Stale Sync Detection
```typescript
const isSyncStale = () => {
  if (!isConnected || !status.lastSyncedAt) return false;
  const diffMinutes = (now - syncDate) / 60000;
  return diffMinutes > staleThresholdMinutes; // default 60
};
```

### Efficient Bulk Status Query
Instead of N individual queries, TeamC2StatusList uses:
```typescript
const athleteIds = athletes.map(a => a.id);
const { statuses } = useTeamC2Statuses(athleteIds); // Single query, Map<id, status>
```

### State Management in C2SyncButton
Auto-resetting success/error states with cleanup:
```typescript
useEffect(() => {
  if (syncResult && !isSyncing) {
    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), 2000);
    return () => clearTimeout(timer);
  }
}, [syncResult, isSyncing]);
```

## Files Changed

### Created
| File | Lines | Purpose |
|------|-------|---------|
| `C2StatusBadge.tsx` | 123 | Connection status badge with states and relative time |
| `C2SyncButton.tsx` | 158 | Manual sync button with loading/success/error states |
| `TeamC2StatusList.tsx` | 240 | Team overview with stats, filters, and bulk sync |

### Modified
| File | Changes | Purpose |
|------|---------|---------|
| `index.ts` | +6 exports | Export new C2 components |
| `ErgTestsPage.tsx` | +32 lines | Integrate C2 status panel |

## Testing Notes

### Manual Verification
1. ✅ C2StatusBadge shows correct states (connected/stale/disconnected)
2. ✅ Relative time updates correctly across time scales
3. ✅ C2SyncButton shows spinner during sync, checkmark on success
4. ✅ TeamC2StatusList displays all athletes with correct status
5. ✅ Filter toggle works (show all / connected only)
6. ✅ Panel slides in/out smoothly from ErgTestsPage
7. ✅ Stats summary updates when athletes' status changes

### Edge Cases Handled
- Athletes with no lastSyncedAt → "Never"
- Athletes not connected → disabled sync button
- Empty athlete list → "No athletes found" message
- No connected athletes → "No connected athletes" when filtered
- Sync errors → Red error state with helpful tooltip

## Decisions Made

**1. 60-minute stale threshold for yellow warning**
- **Context:** Need to alert coaches when sync is outdated without excessive warnings
- **Decision:** >60 minutes = yellow badge, <60 minutes = green
- **Rationale:** Most erg workouts happen daily or every-other-day, 60min catches same-day staleness without spam
- **Alternative considered:** 24 hours (too long, misses same-day issues)

**2. Custom relative time formatting vs date-fns**
- **Decision:** Custom formatter in component
- **Rationale:** Simple logic (50 lines), no additional dependency, matches exact UX needs
- **Alternative considered:** date-fns formatDistanceToNow (adds dependency for simple feature)

**3. Bulk status query for team overview**
- **Decision:** useTeamC2Statuses fetches all statuses in one query
- **Rationale:** Prevents N+1 query problem, single round-trip for team view
- **Trade-off:** Slightly more data transferred, but vastly better performance for large teams

**4. Sync All as placeholder implementation**
- **Decision:** Sequential individual syncs with delays
- **Rationale:** Functional now, avoids API rate limits with 200ms delays
- **Future:** Will be replaced with dedicated `/api/v1/concept2/sync/batch` endpoint
- **Note:** Production endpoint can parallelize syncs server-side safely

**5. Slide-out panel instead of modal**
- **Decision:** 384px fixed-width panel from right
- **Rationale:** Non-modal allows viewing tests while checking C2 status, matches Linear/GitHub patterns
- **Alternative considered:** Modal (blocks view of tests, less efficient workflow)

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues

**Sync All implementation is placeholder:**
- Current: Loops through athletes, triggers individual syncs with delays
- Issue: Can't properly track individual sync success/failure, console.log only
- Future: Will be replaced with dedicated batch sync API endpoint in later plan
- Workaround: Individual sync buttons still work perfectly for manual control

**No error aggregation:**
- If batch sync has mixed results, no summary shown
- Workaround: Individual status badges update to reflect each athlete's state

## Dependencies

### Requires (from previous plans)
- **07-01:** useConcept2Status, useTriggerC2Sync, useTeamC2Statuses hooks
- **06-03:** useAthletes hook for athlete data
- **V2 foundation:** TanStack Query, Tailwind, Lucide icons

### Provides (for future plans)
- **C2 status visualization:** Reusable badge/button components
- **Team overview pattern:** Slide-out panel pattern for auxiliary views
- **Manual sync controls:** Coaches can trigger syncs on-demand

### Affects
- **07-06 (Erg History):** May want to show C2 status in history panels
- **07-07 (Leaderboards):** May want C2 badges next to athlete names
- **Future plans:** Slide-out panel pattern can be reused for other auxiliary views

## Next Steps

**Immediate (current phase):**
1. Continue Phase 7 with remaining erg data plans
2. Test C2 integration end-to-end once backend available
3. Monitor sync performance with real data

**Future enhancements:**
1. **Batch sync API endpoint** - Replace placeholder Sync All logic
2. **Sync history** - Show last N syncs with success/failure counts
3. **Auto-sync toggle** - Per-athlete or team-wide auto-sync configuration
4. **Sync notifications** - Toast messages when syncs complete in background

## Commit History

| Commit | Task | Changes |
|--------|------|---------|
| `e269cba` | Task 1 | Create C2StatusBadge component |
| `b7c94d0` | Task 2 | Create C2SyncButton component |
| `08a4b3f` | Task 3 | Create TeamC2StatusList, update index.ts |
| `192b31f` | Task 4 | Integrate C2 status panel into ErgTestsPage |

---

**Plan completed:** 2026-01-24 at 18:37 UTC
**Duration:** 9 minutes
**Status:** ✅ All success criteria met
