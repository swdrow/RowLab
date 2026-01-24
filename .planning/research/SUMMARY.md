# Project Research Summary

**Project:** RowLab v2.0 — Rowing Team Management Migration
**Domain:** Sports team management (rowing-specific)
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

RowLab v2.0 is migrating 7 core rowing features (Lineup Builder, Seat Racing, Athletes, Erg Data, Training Plans, Racing, Boat Margin Visualizer) from V1 to a modernized V2 architecture using TanStack Query + Zustand state management. Research shows the **existing stack already covers 80% of needs** — only 3 new dependencies required (date-fns, react-big-calendar, react-window). The architecture follows proven patterns: TanStack Query for server state, Zustand only for complex client state (Lineup Builder undo/redo).

The recommended approach is **feature-based organization** with a clear dependency chain: Athletes → Lineup Builder → Seat Racing → Training Plans → Racing. Build in this order to avoid rework. The V2 shell is production-ready, so focus on rowing domain features rather than infrastructure. Total estimated duration: 17-23 days across 6 major features.

Key risks center on **state synchronization in the strangler pattern**: V1 and V2 share Zustand stores, which requires careful schema versioning and event bus synchronization. The Lineup Builder (drag-drop with undo/redo) is the highest technical complexity and must implement isolated state history to avoid corrupting V1. ELO ranking calculations need confidence intervals to handle edge cases (new athletes, <30 pieces). Calendar virtualization must be verified upfront to avoid 800ms+ initial render performance issues.

## Key Findings

### Recommended Stack

**No wholesale changes needed.** The existing RowLab stack (@dnd-kit, recharts, papaparse, react-hook-form + Zod, framer-motion, Zustand, TanStack Query) already supports v2.0 requirements. Research recommends **3 targeted additions** totaling ~45KB gzipped:

**Core additions:**
- **date-fns v4.1.0** — Date utilities for training plans and race scheduling. Tree-shakeable (6KB vs moment.js 70KB), native TypeScript support, react-big-calendar has built-in dateFnsLocalizer.
- **react-big-calendar v1.19.4** — Calendar component for training plans and regattas. MIT licensed (no premium tiers like FullCalendar), 625K weekly downloads, Google Calendar-inspired UX.
- **react-window v1.8.10** — List virtualization for 100+ athlete rosters and large erg data tables. Lighter than react-virtualized (11KB vs 200KB), 60 FPS with 10,000+ rows.

**Custom implementation (not library):**
- **ELO rating calculation** — 60 lines of custom code for seat racing. Existing libraries unmaintained, rowing needs are sport-specific (multi-athlete adjustments, boat class weighting).

**Anti-recommendations (do NOT add):**
- AG Grid, TanStack Table (unnecessary complexity for athlete roster)
- FullCalendar (premium tier required, 2x bundle size vs react-big-calendar)
- Chart.js, Visx (recharts already installed, proven)
- moment.js, lodash (bundle bloat)

### Expected Features

Research identified **table stakes vs differentiators** across 7 feature categories:

**Must have (P0 — critical for v2.0):**
- **Athletes Page:** Roster CRUD, port/starboard preference, bulk CSV import, performance snapshot (erg PRs + seat racing rank)
- **Lineup Builder:** Drag-drop boat assignments, boat type configurations (1x, 2x, 4+, 8+), port/starboard assignment, lineup history
- **Erg Data:** Manual test entry (2k, 6k, 30min), personal records tracking, team leaderboards, basic trend visualization
- **Seat Racing:** Race result entry, athlete swap tracking, ELO-style ranking system, side-specific rankings (port/starboard separate)

**Should have (P1 — competitive feature set):**
- **Training Plans:** Calendar view (week/month), workout templates, periodization phase definition, athlete view of assigned workouts
- **Racing/Regattas:** Regatta list with dates/locations, entry management, results entry, heat/final structure
- **Seat Racing (advanced):** Confidence intervals on rankings, inferred comparisons (transitive), visual race matrix heatmap

**Differentiators (unique to RowLab):**
- Drag-drop lineup interface (no rowing-specific tools found with this UX)
- ELO-based seat racing rankings (novel in rowing; standard is simple win margins)
- Unified workflow (most tools are single-purpose: erg data OR lineup building, not both)

**Defer to v2.1+ (nice-to-have, not essential):**
- Boat Margin Visualizer (low priority vs core workflows)
- Bluetooth PM5 sync (high complexity; manual entry sufficient)
- RegattaCentral API integration (external dependency; manual entry acceptable initially)
- Auto-generated optimal lineups (rowing decisions involve nuance algorithms can't capture)

### Architecture Approach

V2 architecture follows **TanStack Query for server state + Zustand for client state** wrapped in feature-based component organization. The existing V2 shell (ContextRail + WorkspaceSidebar + ShellLayout) provides navigation foundation. New rowing features integrate as context-aware pages under `/app/coach/*`.

**Major components:**

1. **Athletes Page (`/app/coach/athletes`)** — TanStack Query exclusively, virtualized table with filters. Depends on: none. Required by: all other features (athlete roster is foundation).

2. **Lineup Builder (`/app/coach/lineup`)** — Dedicated Zustand store with time-travel middleware (zundo) for undo/redo. Uses @dnd-kit for drag-drop. Optimistic updates with rollback snapshots. Depends on: Athletes (athlete pool).

3. **Seat Racing (`/app/coach/seat-racing`)** — TanStack Query exclusively, session-based data with nested structure. ELO calculation server-side. Depends on: Athletes (assignments).

4. **Erg Data (`/app/coach/erg-data`)** — TanStack Query for test management, recharts for trend visualization. CSV import with papaparse. Depends on: Athletes (test assignment).

5. **Training Plans (`/app/coach/training`)** — TanStack Query + react-big-calendar. Month/week view default (not year view — performance). Depends on: Athletes (workout assignments).

6. **Racing/Regattas (`/app/coach/racing`)** — TanStack Query exclusively, hierarchical structure (Regatta > Race > Result). Depends on: Lineup Builder (boat configurations for entries).

**State management pattern:**
- **TanStack Query (80% of needs):** Server data, CRUD operations, optimistic updates, pagination
- **Zustand (20% of needs):** Lineup Builder undo/redo, draft state, complex client state requiring time-travel
- **Shared V1 stores (via Context):** Auth, settings only — NOT rowing domain data

**Component structure:**
```
src/v2/features/          # NEW: Feature-based organization
├── athletes/
│   ├── components/       # AthletesTable, AthleteForm, BulkImport
│   ├── hooks/            # useAthletes.ts (TanStack Query)
│   └── types/
├── lineup/
│   ├── components/       # LineupBoard, BoatColumn, AthleteBank
│   ├── hooks/            # useDragDrop.ts
│   ├── store/            # lineupStore.ts (Zustand + zundo)
│   └── types/
[... other features]
```

### Critical Pitfalls

Research identified **4 critical pitfalls** (cause rewrites or major issues) and **4 moderate pitfalls** (cause delays):

**CRITICAL:**

1. **Drag-Drop State Synchronization Hell** — Lineup Builder requires undo/redo across shared Zustand stores between V1 and V2. Without isolated history stack, undo reverts V1 state that V2 shouldn't touch, causing data loss. **Prevention:** Isolated V2-only undo state (don't put history in shared store), optimistic updates with rollback snapshots, lightweight drag library (@hello-pangea/dnd or dnd-kit, not react-virtualized).

2. **Calendar Component Virtualization Blindness** — Training Plans calendar rendering 52 weeks upfront (364 components) causes 800ms+ lag. Calendar libraries don't virtualize like FlatList. **Prevention:** Verify virtualization before choosing library, use month/week view by default (not year), lazy-load calendar events (only visible month range), consider TanStack Virtual + headless calendar.

3. **ELO Calculation Edge Cases Causing Ranking Corruption** — Seat racing ELO rankings become nonsensical when: new athlete added mid-season (no baseline), athletes with <30 pieces treated as stable, unequal piece counts (confidence intervals ignored). **Prevention:** Display confidence intervals (PROVISIONAL/LOW/MEDIUM/HIGH), provisional rating period (<10 pieces = badge), handle edge cases (new athlete starts at team median, not 1500), K-factor tuning for rowing (24-32, not chess 16).

4. **Strangler Pattern State Synchronization Drift** — V1 and V2 share Zustand stores, but during active development V2 adds new field → V1 breaks. Dual writes require transaction management. **Prevention:** Schema versioning for shared stores, synchronizing agents pattern (event bus), gradual read-only V1 migration, TanStack Query cache synchronization across versions.

**MODERATE:**

5. **Feature Creep in Sports Features** — Rowing has infinite feature possibilities ("coxswain rotation scheduling?" "equipment check-in with QR codes?"). **Prevention:** Use FULL-SCOPE-v2.0.md priority framework (P0 critical, P1 core, P2+ future), defer to milestone boundaries, "Does this fit precision instrument philosophy?"

6. **TanStack Query Performance Degradation with Large Rosters** — 100+ athletes causes unnecessary re-renders, cache overflow with 1000+ erg tests. **Prevention:** Use `select` option to optimize subscriptions, pagination with useInfiniteQuery, virtualization with TanStack Virtual, optimize gcTime (5 min vs 30 min default).

7. **Design System Consistency Degradation** — 5 major features add 5-10 components each, multiple developers in parallel → spacing/colors/animations inconsistency. **Prevention:** Component quality tiers (Stable/Beta/Experimental), design tokens enforcement (no magic numbers), automated consistency checks in CI, weekly design system review.

8. **Optimistic Update Rollback Failures** — User drags athlete to boat, API fails, UI doesn't revert → data corruption. **Prevention:** Snapshot before every mutation, don't use optimistic for destructive actions, test failure scenarios in Cypress, visual rollback feedback, eventual consistency with refetch.

## Implications for Roadmap

Based on research, suggested 6-phase structure follows **dependency chain: Athletes → Complex Features → Scheduling → Competition**:

### Phase 1: Athletes Page (Foundation)
**Rationale:** Roster must exist before all other features. No dependencies. Simple CRUD = low complexity, fast to ship.
**Delivers:** Athlete roster with filtering, search, bulk CSV import, port/starboard preference tracking.
**Addresses:** Table stakes from FEATURES.md (basic profiles, squad assignment, active/inactive status, performance snapshot).
**Avoids:** TanStack Query performance pitfall (virtualization + pagination), CSV parsing fragility (robust parser + column mapping UI).
**Estimated duration:** 1-2 days
**Research flag:** SKIP (standard CRUD patterns, well-documented)

### Phase 2: Erg Data Tracking
**Rationale:** Performance data foundation for other features. No dependencies on other rowing features (athlete selection via API).
**Delivers:** Manual test entry, personal records, team leaderboards, trend visualization with recharts.
**Addresses:** Table stakes (standard distances, PR tracking, basic charts) and differentiators (compare to previous tests, age-adjusted rankings).
**Avoids:** CSV import fragility (test with Concept2, Garmin, RowPro formats), recharts performance (downsample >1000 points).
**Estimated duration:** 2-3 days
**Research flag:** SKIP (chart library already used in V1, CSV patterns established)

### Phase 3: Lineup Builder (Complex Client State)
**Rationale:** Highest coaching value (daily use), but also highest technical complexity. Requires Athletes foundation. Build after proving state patterns in simpler features.
**Delivers:** Drag-drop boat assignments, undo/redo with zundo, multiple boat types (1x, 2x, 4+, 8+), lineup history.
**Addresses:** Differentiator from FEATURES.md (no rowing tools have drag-drop UX), table stakes (port/starboard, availability integration).
**Avoids:** **CRITICAL** drag-drop state synchronization hell (isolated undo/redo, V1/V2 state namespacing, optimistic updates with rollback snapshots).
**Estimated duration:** 4-5 days
**Research flag:** NEEDED — Complex @dnd-kit integration with Zustand temporal middleware. Research drag-drop patterns with shared state during phase planning.

### Phase 4: Seat Racing (ELO Rankings)
**Rationale:** Selection season-specific (less frequent than lineup building). Requires Athletes for assignments. Independent of Lineup Builder.
**Delivers:** Session management, piece entry, ELO rankings with confidence intervals, side-specific leaderboards (port/starboard).
**Addresses:** Differentiator (ELO-style rankings novel in rowing), table stakes (race result entry, athlete swap tracking, win margin calculation).
**Avoids:** **CRITICAL** ELO edge cases (confidence intervals for <30 pieces, provisional ratings, new athlete handling, K-factor tuning).
**Estimated duration:** 3-4 days
**Research flag:** NEEDED — Optimal K-factor for rowing seat racing unknown. Statistical validation methods need deeper research. Use `/gsd:research-phase` for ELO implementation details.

### Phase 5: Training Plans (Calendar Integration)
**Rationale:** Scheduling feature builds on Athletes foundation. Optionally integrates Erg Data (test scheduling). Complex calendar library integration.
**Delivers:** Calendar view (week/month), workout templates, periodization phase definition, athlete assignments.
**Addresses:** Table stakes (calendar view, workout assignment), differentiators (periodization templates, training load tracking).
**Avoids:** **CRITICAL** calendar virtualization blindness (month view default, lazy-load events, verify library performance before committing), mobile UX degradation (touch targets 44px minimum).
**Estimated duration:** 4-5 days
**Research flag:** NEEDED — react-big-calendar customization for Precision Instrument design, mobile-first calendar patterns. Test with 365 days mock data during development.

### Phase 6: Racing/Regattas (Competition Features)
**Rationale:** Ties everything together. Depends on Lineup Builder (boat configurations for entries). Seasonal feature (not daily use). Build last.
**Delivers:** Regatta management, race entries, results tracking, heat/final structure.
**Addresses:** Table stakes (regatta list, entry management, results entry), nice-to-have (margin calculation, historical comparisons).
**Avoids:** Feature creep (regatta logistics, travel planning out of scope — stick to P0/P1).
**Estimated duration:** 3-4 days
**Research flag:** SKIP (standard CRUD with hierarchical data, established patterns)

### Phase Ordering Rationale

**Why this order:**
- **Athletes first:** Zero dependencies, required by all other features. Fast win to prove V2 patterns.
- **Erg Data second:** Independent feature, proves TanStack Query + recharts patterns before complex features.
- **Lineup Builder third:** Highest complexity (Zustand + undo/redo), tackle after proving state patterns in Athletes/Erg.
- **Seat Racing fourth:** Independent of Lineup Builder, can develop in parallel with Training Plans if needed.
- **Training Plans fifth:** Calendar integration is complex, build after core features stable.
- **Racing last:** Depends on Lineup Builder, ties everything together. Seasonal use = lower priority than daily workflows.

**Dependency graph:**
```
Athletes (foundation)
    ↓
    ├─→ Erg Data (independent)
    ├─→ Lineup Builder (complex state) ─→ Racing (depends on lineups)
    ├─→ Seat Racing (independent)
    └─→ Training Plans (independent)
```

**How this avoids pitfalls:**
- Build Athletes first → Proves virtualization pattern before Lineup Builder needs it
- Build Erg Data early → Validates TanStack Query patterns before complex features
- Build Lineup Builder mid-phase → V1/V2 state synchronization established, event bus proven
- Defer Racing → Feature creep risk contained by building last

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Lineup Builder):** Drag-drop with undo/redo in shared Zustand store. Complex @dnd-kit integration patterns. Use `/gsd:research-phase` to research drag-drop state management best practices.
- **Phase 4 (Seat Racing):** Optimal K-factor for rowing ELO, statistical confidence interval methods, shell speed normalization. Research gap: "How do other sports adapt ELO?"
- **Phase 5 (Training Plans):** react-big-calendar customization for Precision Instrument design, virtualization verification, mobile-first calendar patterns.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Athletes):** Standard CRUD with virtualization, well-documented patterns.
- **Phase 2 (Erg Data):** Chart library already used, CSV patterns established.
- **Phase 6 (Racing):** Standard hierarchical CRUD, established patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack covers 80% of needs. Only 3 new dependencies (date-fns, react-big-calendar, react-window). All libraries have >500K weekly downloads, proven in production. |
| Features | MEDIUM | WebSearch verified with official sources (British Rowing, Concept2, row2k). Some rowing-specific features lack direct comparables (ELO for seat racing is novel). Table stakes vs differentiators validated with multiple sports management platforms. |
| Architecture | HIGH | TanStack Query + Zustand pattern is 2025-2026 best practice for React apps. Feature-based organization proven in Bulletproof React. Existing V2 shell provides navigation foundation. Clear state management separation (server vs client). |
| Pitfalls | HIGH | Strangler pattern risks well-documented (AWS, Azure guidance). Drag-drop state synchronization validated with React Flow undo/redo examples. ELO edge cases documented in Wikipedia + sports analytics research. Calendar virtualization verified with React performance research. |

**Overall confidence:** HIGH

### Gaps to Address

**Known unknowns (research gaps):**
- **Optimal ELO K-factor for rowing seat racing** (LOW confidence) — Need historical data analysis or A/B testing with coaches. Chess uses K=16, tennis K=32. Rowing likely 24-32, but needs validation. **Mitigation:** Start with K=32 (configurable), allow coach to adjust per session type.
- **Shell speed normalization methods** (LOW confidence) — How to adjust for port/starboard boat speed differences? Environmental condition normalization? **Mitigation:** Phase 4 research flag — research during seat racing implementation. Document assumptions in UI.
- **Virtualized calendar library performance** (MEDIUM confidence) — react-big-calendar may not virtualize. Needs prototyping to validate. **Mitigation:** Test with 365 days of mock workouts during Phase 5 planning. Set performance budget: <200ms initial render on iPhone 12.
- **Strangler pattern state sync at scale** (MEDIUM confidence) — How do companies handle dual writes in production? Event sourcing vs eventual consistency? **Mitigation:** Schema versioning + event bus pattern established in research. Test V1/V2 compatibility in CI.

**Known limitations:**
- ELO needs ~30 matches to converge on true skill. Rowing seat racing rarely provides 30+ pieces per athlete. **Solution:** Display confidence intervals (PROVISIONAL/LOW/MEDIUM/HIGH), don't hide statistical limitations from coaches.
- Calendar libraries don't virtualize like FlatList. Year view will lag. **Solution:** Month view default, warn on year view switch, consider TanStack Virtual + headless calendar for v2.1.
- V1 and V2 share Zustand stores during strangler migration. Breaking changes in shared schema will break V1. **Solution:** Schema versioning, V1 compatibility tests in CI, gradual read-only migration.

## Sources

### Primary (HIGH confidence)
- **STACK.md** — Technology recommendations (date-fns, react-big-calendar, react-window), integration patterns, anti-recommendations. Sources: npm stats, official docs, LogRocket/Medium comparisons.
- **FEATURES.md** — Domain research on rowing team management (British Rowing, Concept2 Logbook, RowHero, RegattaCentral official sites). Table stakes vs differentiators validated across 7 feature categories.
- **ARCHITECTURE.md** — TanStack Query + Zustand patterns (official TanStack docs, Zustand GitHub), feature-based organization (Bulletproof React, Robin Wieruch 2025 guide), build order dependencies (existing Prisma schema analysis).
- **PITFALLS.md** — Strangler pattern risks (AWS/Azure official guidance), drag-drop state sync (React Flow examples, Medium tutorials), ELO methodology (Wikipedia, sports analytics research), calendar performance (React Compiler perf research).

### Secondary (MEDIUM confidence)
- npm trends data (weekly downloads for library comparisons)
- Community consensus on TanStack Query vs Zustand separation
- React performance research (virtualization, structural sharing)
- Sports team management app feature comparisons (TeamSnap, Connecteam patterns)

### Tertiary (LOW confidence)
- Optimal K-factor for rowing ELO (inferred from chess/tennis, needs validation)
- Shell speed normalization methods (research gap)
- react-big-calendar virtualization performance (needs prototyping)

---
*Research completed: 2026-01-24*
*Ready for roadmap: yes*
