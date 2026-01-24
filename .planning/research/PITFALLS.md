# Domain Pitfalls: v2.0 Rowing Features

**Domain:** Rowing team management - adding complex features to existing app
**Researched:** 2026-01-24
**Context:** V2 shell production-ready, adding Lineup Builder, Seat Racing, Athletes, Erg Data, Training Plans, Racing/Regattas
**Architecture:** In-Place Strangler pattern, shared Zustand stores, TanStack Query

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Drag-Drop State Synchronization Hell

**What goes wrong:** Lineup Builder requires drag-drop with undo/redo across shared Zustand stores between V1 and V2. Without careful state architecture, you get:
- Undo/redo that breaks when state is shared with V1
- Optimistic updates that conflict with V1's state expectations
- Lost lineup changes when toggling between V1 and V2 views
- Infinite re-renders from circular state updates

**Why it happens:**
- V1 and V2 share the same Zustand stores (by design, for strangler pattern)
- Drag-drop libraries render all items upfront (not virtualized)
- [Undo/redo requires history stack](https://medium.com/@adresh/how-to-implement-drag-and-drop-with-undo-redo-in-a-react-4bc4ec4e3ac1) that conflicts with shared state
- [Deep merge during drag operations is too expensive](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)

**Consequences:**
- User drags athlete to boat, lineup corruption causes data loss
- Undo reverts V1 state that V2 shouldn't touch
- Race condition between V1 and V2 polling intervals
- Production-breaking bugs that require disabling the feature

**Prevention:**

1. **Isolated undo/redo state** - Don't put history stack in shared Zustand store:
   ```typescript
   // BAD - shared store with undo/redo
   const useLineupStore = create(persist((set) => ({
     lineups: [],
     history: [], // V1 doesn't understand this
     undo: () => {...}
   })))

   // GOOD - V2-only undo state
   const useLineupEditorState = create((set) => ({
     past: [],
     present: lineupStore.getState().activeLineup,
     future: [],
     undo: () => {...} // Only affects V2 editor
   }))
   ```

2. **Optimistic updates with rollback snapshots** - [Capture state before mutation](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/):
   ```typescript
   const onDragEnd = async (result) => {
     const snapshot = lineupStore.getState().activeLineup;

     // Optimistic update
     lineupStore.updateAssignments(optimisticState);

     try {
       await api.updateLineup(result);
     } catch (error) {
       // Rollback to snapshot
       lineupStore.setActiveLineup(snapshot);
       showError('Update failed');
     }
   }
   ```

3. **Lightweight drag library** - Use [@hello-pangea/dnd](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) or [dnd-kit](https://reactscript.com/best-drag-drop/) (5KB), not react-virtualized (heavy)

4. **V1/V2 state isolation via namespacing** - Separate concerns:
   ```typescript
   // Shared store (both versions read)
   lineupStore: {
     lineups: [], // Source of truth
     activeLineupId: string
   }

   // V2-only state (V1 ignores)
   lineupEditorStore: {
     draftState: {}, // Unsaved changes
     history: { past, present, future },
     isDirty: boolean
   }
   ```

**Detection:**
- User reports "lineup disappeared after switching to V1"
- Console errors: "Cannot read property of undefined" in V1 pages
- Undo button causes V1 features to break
- Performance profiling shows 300+ component mounts on drag

**Phase-specific notes:**
- Phase 8 (Lineup Builder): MUST address this before feature flag enabled
- Include explicit V1/V2 state isolation tests in TDD suite
- Test: "Drag athlete in V2, switch to V1 legacy, verify lineup still valid"

---

### Pitfall 2: Calendar Component Virtualization Blindness

**What goes wrong:** Training Plans and Racing calendars render 52 weeks of days upfront (364 components), causing 800ms+ lag on initial mount and frozen UI during scroll.

**Why it happens:**
- [Calendar libraries don't virtualize like FlatList](https://medium.com/@domwozniak/react-compiler-wont-save-you-from-this-performance-mistake-a257541fe533)
- Assumption that calendar components are "lightweight" (they're not)
- Every day component mounts immediately, even if off-screen
- React Compiler optimizes renders, but not architectural decisions

**Consequences:**
- Training Plans page takes 3+ seconds to load
- Mobile devices freeze when scrolling calendar
- User abandons feature ("too slow")
- Production incident: "Calendar broken on iPhone"

**Prevention:**

1. **Verify virtualization before choosing library:**
   - [Check documentation explicitly](https://medium.com/@domwozniak/react-compiler-wont-save-you-from-this-performance-mistake-a257541fe533): Does it say "virtualized" or "windowing"?
   - Test with 365 days of data before committing
   - Profile on real mobile device (not just Chrome DevTools)

2. **Use month/week view by default** - Don't render year view initially:
   ```typescript
   // BAD - renders all 52 weeks upfront
   <Calendar view="year" />

   // GOOD - start with month, lazy-load on demand
   <Calendar
     view="month"
     onViewChange={(view) => {
       if (view === 'year') {
         // Warn or suggest week view
       }
     }}
   />
   ```

3. **Lazy-load calendar events** - Don't fetch entire year:
   ```typescript
   const { data: workouts } = useQuery({
     queryKey: ['workouts', startDate, endDate],
     queryFn: () => api.getWorkouts({
       // Only fetch visible month range
       start: startOfMonth(currentView),
       end: endOfMonth(currentView)
     })
   })
   ```

4. **Consider headless calendar with custom renderer:**
   - Build virtualized day grid with [TanStack Virtual](https://tanstack.com/virtual/latest)
   - Use headless date logic library (date-fns or Temporal API)
   - [Example: Sub-millisecond performance with TanStack Virtual](https://tanstack.com/blog/tanstack-db-0.5-query-driven-sync)

**Detection:**
- Lighthouse performance score < 70 on Training Plans page
- React DevTools Profiler shows >500ms initial render for Calendar component
- Mobile testing reveals frozen scroll
- User feedback: "Calendar is laggy"

**Phase-specific notes:**
- Phase 12 (Training Plans): Test with 365 days of mock workouts during development
- Phase 13 (Racing/Regattas): Race entries likely sparse, but test with 50+ regattas
- Set performance budget: Calendar must render in <200ms on iPhone 12

---

### Pitfall 3: ELO Calculation Edge Cases Causing Ranking Corruption

**What goes wrong:** Seat racing ELO rankings become nonsensical when:
- New athlete added mid-season (no baseline rating)
- Athletes with <30 pieces ([provisional ratings](https://www.omnicalculator.com/sports/elo)) treated as stable
- Unequal piece counts between athletes (confidence intervals ignored)
- Draw outcomes not handled ([ELO designed for chess, not rowing](https://towardsdatascience.com/rating-sports-teams-elo-vs-win-loss-d46ee57c1314/))

**Why it happens:**
- [ELO needs ~30 matches to converge](https://en.wikipedia.org/wiki/Elo_rating_system) on true skill
- Rowing seat racing rarely provides 30+ pieces per athlete
- [K-factor tuning is sport-specific](https://dubstat.com/elo-ratings-the-ultimate-sports-ranking-system/) (baseball K=10, tennis K=32)
- Coaches trust rankings blindly, unaware of statistical limitations

**Consequences:**
- Freshman with 3 pieces ranked above senior with 25 pieces
- Coach makes lineup decisions based on garbage data
- Team loses race because "ELO said this was the fast boat"
- Feature blamed and abandoned: "ELO doesn't work for rowing"

**Prevention:**

1. **Display confidence intervals, not just ratings:**
   ```typescript
   interface EloRating {
     rating: number;
     pieceCount: number;
     confidence: 'PROVISIONAL' | 'LOW' | 'MEDIUM' | 'HIGH';
     confidenceInterval: [number, number]; // ±95% CI
   }

   // Example: "1450 ± 120 (LOW confidence, 8 pieces)"
   ```

2. **Provisional rating period:**
   - Athletes with <10 pieces: Show "PROVISIONAL" badge
   - Athletes with 10-29 pieces: Show "LOW confidence"
   - Athletes with 30+ pieces: Show actual confidence from margin variance

3. **Handle edge cases explicitly:**
   - **New athlete**: Start at team median, not arbitrary 1500
   - **Draw outcome**: Treat as 0.5-0.5 result (both gain/lose half expected)
   - **Unequal shell performance**: Normalize for shell speed differences

4. **K-factor tuning for rowing:**
   - Research optimal K-factor (likely 24-32, not chess's 16)
   - Allow coach to adjust K-factor per session type (high-stakes vs practice)
   - Test with historical data to validate convergence

5. **Statistical validation UI:**
   ```typescript
   // Show "Smart Seat Racing Matrix" feature (FULL-SCOPE-v2.0.md line 77)
   // "AI-generated optimal switch sequence to minimize pieces
   //  while maximizing statistical confidence"

   // Warn if: "Need 4 more pieces to reach MEDIUM confidence"
   ```

**Detection:**
- Coach reports: "Rankings don't make sense"
- Athlete with 2 pieces has higher rating than 20-piece athlete
- Variance in piece margins exceeds ±30 seconds
- Confidence intervals overlap significantly but rankings differ by 100+ points

**Phase-specific notes:**
- Phase 9 (Seat Racing): MUST implement confidence intervals before MVP
- Include edge case unit tests: new athlete, draw, unequal counts
- Research flag: "Optimal K-factor for rowing seat racing" (unknown)

---

### Pitfall 4: Strangler Pattern State Synchronization Drift

**What goes wrong:** V1 and V2 share Zustand stores, but during active development:
- V2 adds new field to shared store schema
- V1 code breaks because it doesn't expect new field
- Or: V1 updates athlete roster, V2 doesn't see change until page reload
- Or: [Dual writes to both systems fail](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html), causing data inconsistency

**Why it happens:**
- [Strangler pattern hardest part is maintaining data consistency](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig)
- [Dual writes require transaction management](https://www.altexsoft.com/blog/strangler-fig-legacy-system-migration/)
- V1 and V2 developed in parallel (different PRs)
- No enforcement of shared store schema versioning

**Consequences:**
- V1 crashes with "TypeError: Cannot read property 'newField' of undefined"
- User adds athlete in V1, V2 doesn't show them (cache inconsistency)
- Data loss when V1 and V2 write to same store simultaneously
- Production rollback required, blocking v2.0 launch

**Prevention:**

1. **Schema versioning for shared stores:**
   ```typescript
   // src/stores/athleteStore.ts
   interface AthleteStoreV1 {
     version: 1;
     athletes: Athlete[];
     fetchAthletes: () => Promise<void>;
   }

   interface AthleteStoreV2 extends AthleteStoreV1 {
     version: 2;
     // New V2 fields (optional for V1 compatibility)
     athleteFilters?: FilterState;
     sortPreferences?: SortConfig;
   }

   // V1 code checks version
   const store = useAthleteStore();
   if (store.version === undefined || store.version === 1) {
     // V1 behavior
   }
   ```

2. **Synchronizing agents pattern:**
   - [Use event queue for state changes](https://circleci.com/blog/strangler-pattern-implementation-for-safe-microservices-transition/)
   - V2 writes to store → emit 'athlete.updated' event → V1 listeners refresh
   ```typescript
   // Shared event bus
   const storeEventBus = mitt();

   // V2 mutation
   athleteStore.updateAthlete((id, data) => {
     // Update store
     set((state) => ({
       athletes: state.athletes.map(a =>
         a.id === id ? { ...a, ...data } : a
       )
     }));
     // Notify V1
     storeEventBus.emit('athlete.updated', { id, data });
   });

   // V1 listener
   useEffect(() => {
     storeEventBus.on('athlete.updated', (event) => {
       // V1 refresh logic (or ignore if V1 doesn't care)
     });
   }, []);
   ```

3. **Read-only V1 during V2 development (gradual):**
   - Once V2 feature reaches beta, make V1 version read-only with banner:
     "This feature is being upgraded. Use /beta for latest version."
   - Prevents dual-write conflicts

4. **TanStack Query cache synchronization:**
   ```typescript
   // V2 mutation invalidates both V1 and V2 caches
   const mutation = useMutation({
     mutationFn: api.updateAthlete,
     onSuccess: (data) => {
       // Invalidate V2 cache
       queryClient.invalidateQueries({ queryKey: ['athletes'] });

       // Update shared Zustand store (V1 reads this)
       athleteStore.updateAthlete(data.id, data);
     }
   })
   ```

5. **Gradual data migration, not big-bang:**
   - [Use synchronizing agents](https://www.thoughtworks.com/en-cn/insights/articles/embracing-strangler-fig-pattern-legacy-modernization-part-three) for eventual consistency
   - Accept temporary inconsistency (show loading states)
   - Test rollback plan: "Can we revert to V1 without data loss?"

**Detection:**
- V1 pages show console errors about undefined fields
- User reports: "Changes I made in beta disappeared"
- [Data synchronization lag](https://swimm.io/learn/legacy-code/strangler-fig-pattern-modernizing-it-without-losing-it) > 1 second between V1 and V2
- Automated tests: "V1 CRUD → verify V2 sees changes"

**Phase-specific notes:**
- ALL PHASES: Establish shared store contract before Phase 6
- Create `STORE-SCHEMA-V2.md` documenting breaking changes
- CI check: "Does this PR modify shared Zustand store? → Requires V1 compatibility test"

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

### Pitfall 5: Feature Creep in "One More Thing" Sports Features

**What goes wrong:** Rowing team management has infinite feature possibilities:
- "Can we add coxswain rotation scheduling?"
- "What about gear and uniform management?"
- "Shouldn't we track equipment check-in/out with QR codes?"
- Each feature seems small, but [leads to component sprawl and brand dilution](https://rydarashid.medium.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563)

**Why it happens:**
- [Sports team apps have feature bloat problem](https://www.ezfacility.com/blog/sports-team-management-apps/) - competitors add features that aren't used
- Product feels incomplete without "table stakes" features
- Coach requests are persuasive: "This would save me hours"
- No clear prioritization framework

**Consequences:**
- v2.0 timeline extends from 8 weeks to 20 weeks
- Design system inconsistency ([minimal component props prevent API sprawl](https://wearebrain.com/blog/the-future-of-design-systems/))
- Features shipped half-baked because time ran out
- User confusion: "Where is the feature for X?"

**Prevention:**

1. **Use FULL-SCOPE-v2.0.md priority framework:**
   - P0: Critical for v2.0 to be useful (4 features: Lineup, Athletes, Erg, Seat Racing)
   - P1: Core features for complete product (18 features)
   - P2-P4: Future milestones

2. **"Table stakes vs differentiators" filter:**
   ```
   Is this feature:
   - Table stakes? (Users expect it) → P1
   - Differentiator? (Unique value) → P0 or P1
   - Nice-to-have? (Convenience) → P2+
   - Feature creep? (Solves edge case) → Out of scope
   ```

3. **Defer to milestone boundaries:**
   - Coach asks for "Equipment Management" during v2.0 → Note in backlog for v2.3
   - Don't add mid-sprint unless P0 blocker

4. **"Does this fit the precision instrument philosophy?":**
   - Equipment check-in with QR codes → Adds complexity, not core rowing value → P3
   - Coxswain rotation → Nice-to-have automation, but manual works → P3
   - AI Lineup Optimizer → Differentiator, high value → P1

**Detection:**
- Milestone sprint count grows beyond original estimate
- Design system has 50+ components (should be ~30 for v2.0)
- Features shipped without full UX polish
- User testing reveals confusion about feature location

**Phase-specific notes:**
- Phase 6-10: Stick to P0/P1 features only
- Create "Deferred to v2.1" document for P2 requests
- Review with product owner weekly: "Are we scope-creeping?"

---

### Pitfall 6: TanStack Query Performance Degradation with Large Rosters

**What goes wrong:** Athletes Page with 100+ athletes causes:
- [Unnecessary re-renders when unrelated data changes](https://borstch.com/blog/development/optimizing-your-react-query-performance-with-tanstack-config)
- Cache overflow when fetching 1000+ erg test results
- Slow initial load (2-3 seconds) on Athletes Page

**Why it happens:**
- [TanStack Query subscribes components to entire query result by default](https://tanstack.com/query/v4/docs/framework/react/guides/optimistic-updates)
- Structural sharing enabled but not optimized for large arrays
- No pagination or virtualization for athlete lists
- [gcTime too long, cache fills with stale data](https://github.com/TanStack/query/discussions/7482)

**Consequences:**
- Athletes Page feels sluggish (fails "precision instrument" test)
- Mobile devices struggle with 100+ athlete roster
- Erg Data page times out fetching 1000+ test results
- User complains: "Why is this so slow?"

**Prevention:**

1. **Use select option to optimize subscriptions:**
   ```typescript
   // BAD - entire athletes array
   const { data: athletes } = useQuery({
     queryKey: ['athletes'],
     queryFn: api.getAthletes
   });

   // GOOD - only subscribe to IDs for list view
   const { data: athleteIds } = useQuery({
     queryKey: ['athletes'],
     queryFn: api.getAthletes,
     select: (data) => data.map(a => a.id) // Only re-render if IDs change
   });
   ```

2. **Pagination for large datasets:**
   ```typescript
   const { data } = useInfiniteQuery({
     queryKey: ['athletes', filters],
     queryFn: ({ pageParam = 0 }) =>
       api.getAthletes({
         offset: pageParam * 50,
         limit: 50
       }),
     getNextPageParam: (lastPage, pages) =>
       lastPage.hasMore ? pages.length : undefined
   });
   ```

3. **Virtualization with TanStack Virtual:**
   - [React-window or TanStack Virtual for 100+ row lists](https://tanstack.com/virtual/latest)
   - [Renders only visible rows, sub-millisecond performance](https://medium.com/@ignatovich.dm/virtualization-in-react-improving-performance-for-large-lists-3df0800022ef)

4. **Optimize gcTime for high-churn data:**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         gcTime: 5 * 60 * 1000, // 5 minutes (default is 30 min)
         staleTime: 30 * 1000, // 30 seconds
       }
     }
   })
   ```

5. **Use TanStack DB for client-side queries (2026 feature):**
   - [Sub-millisecond queries across large datasets](https://tanstack.com/blog/tanstack-db-0.5-query-driven-sync)
   - On-demand mode for 50K+ rows
   - 60% reduction in API calls

**Detection:**
- React DevTools Profiler: Athletes Page render time > 500ms
- Network tab: Fetching 100+ athletes in single request
- User scrolls list, UI stutters
- Lighthouse performance score < 80

**Phase-specific notes:**
- Phase 6 (Athletes): Test with 200 mock athletes during development
- Phase 7 (Erg Data): Test with 1000+ test results per athlete
- Set performance budget: Lists must render in <200ms

---

### Pitfall 7: Design System Consistency Degradation with Component Sprawl

**What goes wrong:** As v2.0 adds 5 major features (Athletes, Lineup, Seat Racing, Erg, Training Plans):
- Each feature adds 5-10 new components
- Components use slightly different spacing, colors, animations
- [Brand dilution from inconsistent voice and visual sprawl](https://wearebrain.com/blog/the-future-of-design-systems/)
- [Component quality tiers unclear](https://rydarashid.medium.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563) (which are "Stable" vs "Experimental"?)

**Why it happens:**
- Multiple developers working in parallel
- No design system governance during rapid feature development
- Copy-pasting components instead of using shared primitives
- [AI coding tools multiply code volume and inconsistency](https://rydarashid.medium.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563)

**Consequences:**
- Buttons have 3 different styles across features
- Spacing inconsistent (some use 16px, others 20px)
- Animations feel jarring (some 200ms linear, others 300ms spring)
- Design no longer "precision instrument" quality
- Refactoring required post-launch (expensive)

**Prevention:**

1. **Establish component quality tiers:**
   ```typescript
   // src/v2/components/README.md

   ## Component Tiers

   | Tier | Stability | Use When |
   |------|-----------|----------|
   | **Stable** | Production-ready, documented, tested | Always use for features |
   | **Beta** | Works but API may change | Prototyping only |
   | **Experimental** | Proof-of-concept | Local development only |

   Stable components:
   - Button, Input, Select, Card, Modal
   - Must have Storybook story + unit tests

   Before adding new component:
   - [ ] Can I use existing Stable component?
   - [ ] Is this a one-off or reusable pattern?
   - [ ] Does it follow design tokens?
   ```

2. **Design tokens enforcement:**
   ```typescript
   // BAD - magic numbers
   <div className="p-5 rounded-lg bg-gray-800">

   // GOOD - design tokens
   <div className="p-4 rounded-md bg-elevated">

   // Tailwind config enforces tokens
   theme: {
     spacing: {
       0: '0px',
       1: '4px',
       2: '8px',
       3: '12px',
       4: '16px', // Standard padding
       6: '24px',
       8: '32px'
     }
   }
   ```

3. **Automated consistency checks:**
   ```bash
   # CI check for design token violations
   npm run lint:design-tokens

   # Flags:
   # - Hardcoded colors (use CSS variables)
   # - Magic number spacing (use theme.spacing)
   # - Inline styles (use Tailwind classes)
   ```

4. **Component review checklist:**
   ```markdown
   ## New Component PR Checklist

   - [ ] Uses design tokens (no magic numbers)
   - [ ] Follows Framer Motion spring physics pattern
   - [ ] Works in dark/light/field themes
   - [ ] Responsive (mobile + desktop)
   - [ ] Keyboard accessible
   - [ ] Documented in Storybook (if Stable tier)
   - [ ] Unit tests (if Stable tier)
   ```

5. **Weekly design system review:**
   - Review new components added this week
   - Promote Beta → Stable when ready
   - Deprecate duplicate components
   - [AI-powered drift detection](https://rydarashid.medium.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563) (2026 tooling)

**Detection:**
- Design review flags inconsistent spacing/colors
- Component count grows beyond 50 (should be ~30 for v2.0)
- User feedback: "Some pages feel different than others"
- Storybook shows duplicated component patterns

**Phase-specific notes:**
- Before Phase 6: Establish component tier framework
- Each phase PR: "Does this add new component or use existing?"
- Post-v2.0: Component audit and consolidation sprint

---

### Pitfall 8: Optimistic Update Rollback Failures in Lineup Builder

**What goes wrong:** User drags athlete to boat, API call fails (network error), UI doesn't revert:
- Athlete appears in boat but server state is old lineup
- User continues editing, compounds the corruption
- Save fails with cryptic error: "Conflict detected"
- User loses 20 minutes of lineup work

**Why it happens:**
- [Optimistic updates assume success](https://blog.openreplay.com/optimistic-updates-make-apps-faster/)
- Rollback logic not tested (failure is rare in development)
- [Snapshot captured incorrectly or not at all](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/)
- Financial/destructive actions use optimistic updates (anti-pattern)

**Consequences:**
- User reports: "Lineup disappeared after saving"
- Data corruption requires manual DB fix
- Loss of trust in feature: "I don't trust auto-save anymore"
- Rollback to manual Save button (defeats UX goal)

**Prevention:**

1. **Snapshot before every mutation:**
   ```typescript
   // src/v2/features/lineup/hooks/useLineupMutations.ts

   const updateLineup = useMutation({
     mutationFn: api.updateLineup,
     onMutate: async (newData) => {
       // Cancel in-flight queries
       await queryClient.cancelQueries({ queryKey: ['lineups', lineupId] });

       // Snapshot previous state
       const snapshot = queryClient.getQueryData(['lineups', lineupId]);

       // Optimistic update
       queryClient.setQueryData(['lineups', lineupId], newData);

       // Return rollback context
       return { snapshot };
     },
     onError: (error, variables, context) => {
       // Rollback to snapshot
       if (context?.snapshot) {
         queryClient.setQueryData(['lineups', lineupId], context.snapshot);
       }

       // Show error toast
       toast.error('Failed to update lineup. Changes reverted.');
     },
     onSettled: () => {
       // Always refetch to sync with server truth
       queryClient.invalidateQueries({ queryKey: ['lineups', lineupId] });
     }
   });
   ```

2. **Don't use optimistic updates for destructive actions:**
   ```typescript
   // BAD - optimistic delete
   const deleteAthlete = useMutation({
     onMutate: () => {
       // Remove from UI immediately
     }
   });

   // GOOD - confirm before delete, then optimistic
   const deleteAthlete = useMutation({
     mutationFn: async (id) => {
       const confirmed = await confirmDialog('Delete athlete?');
       if (!confirmed) throw new Error('Cancelled');
       return api.deleteAthlete(id);
     },
     // Now safe to optimistic update
   });
   ```

3. **Test failure scenarios:**
   ```typescript
   // cypress/e2e/lineup-builder.cy.ts

   it('reverts optimistic update on API failure', () => {
     cy.intercept('PUT', '/api/v1/lineups/*', {
       statusCode: 500,
       body: { error: 'Server error' }
     }).as('updateFails');

     cy.dragAthlete('athlete-1', 'boat-2x-bow');
     cy.wait('@updateFails');

     // Should revert to original position
     cy.get('[data-testid="boat-4x-bow"]').should('contain', 'Athlete 1');
     cy.get('[data-testid="error-toast"]').should('be.visible');
   });
   ```

4. **Visual rollback feedback:**
   ```typescript
   // Show "reverting..." animation when rollback happens
   onError: (error, variables, context) => {
     // Animate rollback
     const element = document.querySelector(`[data-athlete-id="${variables.athleteId}"]`);
     element?.classList.add('animate-rollback');

     // Then restore snapshot
     setTimeout(() => {
       queryClient.setQueryData(['lineups', lineupId], context.snapshot);
     }, 200);
   }
   ```

5. **Eventual consistency with refetch:**
   - Even on success, refetch server state after 2 seconds
   - Catches edge cases where server state differs from optimistic state

**Detection:**
- User reports: "Saved lineup doesn't match what I see"
- Server logs show 409 Conflict errors
- Cypress tests fail on network error simulation
- Manual test: Disconnect wifi during drag-drop

**Phase-specific notes:**
- Phase 8 (Lineup Builder): Critical - test rollback before feature flag
- Phase 9 (Seat Racing): Test rollback for piece entry
- Phase 6 (Athletes): Test rollback for athlete updates

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 9: Seat Racing Statistical Assumptions Not Validated

**What goes wrong:** Seat racing matrix assumes:
- All pieces are same distance (1500m)
- Environmental conditions are consistent
- Boats are identical (shell speed differences ignored)
- Athletes are interchangeable (ignore side/position preferences)

When assumptions violated: Rankings are meaningless.

**Prevention:**
- Display assumptions on Seat Racing page
- Allow coach to mark pieces as "exhibition" (excluded from ELO)
- Normalize for distance (convert 1000m piece to 1500m equivalent)
- Flag when shell speed variance is high

**Detection:**
- Coach reports: "Port boat always wins, rankings are skewed"
- Piece distances vary significantly (500m to 2000m)
- Wind/current changes between pieces

**Phase-specific notes:**
- Phase 9 (Seat Racing): Document assumptions in UI
- Research flag: "Shell speed normalization methods"

---

### Pitfall 10: Erg Data Import CSV Parsing Fragility

**What goes wrong:** CSV import fails when:
- Concept2 export format changes
- User exports from Garmin instead of Concept2 (different columns)
- Special characters in names (accents, emojis)
- Dates in non-US format (DD/MM/YYYY vs MM/DD/YYYY)

**Prevention:**
- Robust CSV parser with encoding detection
- Column mapping UI (let user specify which column is "time")
- Preview first 5 rows before import
- Error handling with line numbers: "Row 23: Invalid date format"

**Detection:**
- User reports: "CSV import failed"
- Server logs show parsing errors
- Test with 10+ different CSV formats

**Phase-specific notes:**
- Phase 7 (Erg Data): Test with Concept2, Garmin, RowPro exports
- Include sample CSVs in test fixtures

---

### Pitfall 11: Training Plan Calendar Mobile UX Degradation

**What goes wrong:** Desktop calendar doesn't adapt to mobile:
- Touch targets too small (32px minimum required)
- Horizontal scroll doesn't work with pinch-zoom
- Month picker hidden behind mobile keyboard
- Day cells unreadable on 375px screen

**Prevention:**
- Mobile-first calendar design
- Touch targets 44px minimum (iOS HIG)
- Test on real iPhone 12/13 (not just Chrome DevTools)
- Consider week view as default for mobile

**Detection:**
- Mobile user reports: "Can't tap on days"
- Lighthouse mobile score < 90
- Touch target audit fails

**Phase-specific notes:**
- Phase 12 (Training Plans): Mobile testing required before MVP

---

### Pitfall 12: Zustand Persist Middleware Race Conditions

**What goes wrong:** Zustand persist writes to localStorage on every state change:
- Rapid updates (drag-drop) cause localStorage quota exceeded
- Race condition: Read stale state during write
- LocalStorage blocked in private browsing mode (Safari)

**Prevention:**
- Debounce persist writes (500ms delay)
- Use IndexedDB for large state (ergStore with 1000+ tests)
- Graceful degradation when localStorage unavailable
- Don't persist draft state (only committed changes)

**Detection:**
- Console error: "QuotaExceededError"
- Safari private browsing mode: "Storage access denied"
- State reverts unexpectedly

**Phase-specific notes:**
- ALL PHASES: Review which stores need persistence
- Lineup draft state: Don't persist (too large, too frequent)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Phase 6: Athletes** | TanStack Query performance with 100+ athletes | Virtualization + pagination |
| **Phase 7: Erg Data** | CSV import parsing fragility | Robust parser + column mapping UI |
| **Phase 8: Lineup Builder** | Drag-drop state synchronization hell (CRITICAL) | Isolated undo/redo + rollback snapshots |
| **Phase 9: Seat Racing** | ELO edge cases causing ranking corruption (CRITICAL) | Confidence intervals + provisional ratings |
| **Phase 10: Settings** | Strangler pattern state drift | Schema versioning + event bus |
| **Phase 12: Training Plans** | Calendar virtualization blindness (CRITICAL) | Month view default + lazy load |
| **Phase 13: Racing** | Feature creep (regatta logistics) | Stick to P0/P1 scope |
| **Phase 14: On-Water** | GPS data visualization performance | Simplify to static maps for MVP |

---

## Integration-Specific Warnings

### Shared Zustand Store Pitfalls (V1/V2 Strangler Pattern)

**Critical risks:**
1. **V2 adds field to shared store → V1 breaks** (Pitfall 4)
2. **Optimistic updates conflict with V1 polling** (Pitfall 1)
3. **Persist middleware race conditions** (Pitfall 12)

**Mitigation checklist:**
- [ ] Schema versioning on all shared stores
- [ ] Event bus for cross-version notifications
- [ ] V1 compatibility tests in CI
- [ ] Gradual read-only migration for V1 features

### TanStack Query + Zustand Integration

**Risks:**
- Query cache and Zustand store out of sync
- Optimistic updates in both layers (duplication)
- Unclear which is source of truth

**Best practice:**
- TanStack Query = server state source of truth
- Zustand = client-only state (UI preferences, draft edits)
- Never duplicate server data in Zustand

---

## Research Gaps

Areas where more investigation is needed during phase-specific research:

1. **Optimal ELO K-factor for rowing seat racing** (LOW confidence)
   - Need historical data analysis
   - May require A/B testing with coaches

2. **Shell speed normalization methods** (LOW confidence)
   - How to adjust for port/starboard boat differences?
   - Environmental condition normalization?

3. **Virtualized calendar library for React** (MEDIUM confidence)
   - [TanStack Virtual](https://tanstack.com/virtual/latest) + custom calendar logic?
   - Or headless calendar + virtualized renderer?
   - Needs prototyping to validate

4. **Strangler pattern state sync at scale** (MEDIUM confidence)
   - How do companies handle dual writes in production?
   - Event sourcing vs eventual consistency?

---

## Sources

### Drag-Drop State Management
- [How to Implement Drag-and-Drop with Undo/Redo in React](https://medium.com/@adresh/how-to-implement-drag-and-drop-with-undo-redo-in-a-react-4bc4ec4e3ac1)
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [10 Best Drag And Drop Components For React (2026)](https://reactscript.com/best-drag-drop/)
- [React Flow: Undo and Redo](https://reactflow.dev/examples/interaction/undo-redo)

### ELO Ranking Systems
- [Elo rating system - Wikipedia](https://en.wikipedia.org/wiki/Elo_rating_system)
- [Elo Ratings: The Ultimate Sports Ranking System - DubStat](https://dubstat.com/elo-ratings-the-ultimate-sports-ranking-system/)
- [Elo Calculator](https://www.omnicalculator.com/sports/elo)
- [Rating Sports Teams - Elo vs. Win-Loss](https://towardsdatascience.com/rating-sports-teams-elo-vs-win-loss-d46ee57c1314/)

### Calendar Performance
- [React Compiler Won't Save You From This Performance Mistake](https://medium.com/@domwozniak/react-compiler-wont-save-you-from-this-performance-mistake-a257541fe533)
- [Best React scheduler component libraries - LogRocket](https://blog.logrocket.com/best-react-scheduler-component-libraries/)

### TanStack Query Performance
- [TanStack DB 0.5 - Query-Driven Sync](https://tanstack.com/blog/tanstack-db-0.5-query-driven-sync)
- [Performance issue with large dataset - GitHub Discussion](https://github.com/TanStack/query/discussions/7482)
- [Optimizing Your React Query Performance with TanStack Config](https://borstch.com/blog/development/optimizing-your-react-query-performance-with-tanstack-config)
- [TanStack in 2026: From Query to Full-Stack](https://www.codewithseb.com/blog/tanstack-ecosystem-complete-guide-2026)

### Design System Consistency
- [Design Systems in 2026: Predictions, Pitfalls, and Power Moves](https://rydarashid.medium.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563)
- [The future of design systems in 2026](https://wearebrain.com/blog/the-future-of-design-systems/)

### Optimistic Updates
- [Understanding optimistic UI and React's useOptimistic Hook](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/)
- [Optimistic Updates - TanStack Query Docs](https://tanstack.com/query/v4/docs/framework/react/guides/optimistic-updates)
- [How Optimistic Updates Make Apps Feel Faster](https://blog.openreplay.com/optimistic-updates-make-apps-faster/)

### Strangler Pattern
- [Strangler Fig Pattern - AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)
- [Strangler Fig Pattern - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig)
- [Strangler Fig Pattern: Modernizing It Without Losing It - Swimm](https://swimm.io/learn/legacy-code/strangler-fig-pattern-modernizing-it-without-losing-it)
- [Strangler Fig Pattern and Legacy System Migration Methods](https://www.altexsoft.com/blog/strangler-fig-legacy-system-migration/)
- [Embracing the Strangler Fig pattern for legacy modernization](https://www.thoughtworks.com/en-cn/insights/articles/embracing-strangler-fig-pattern-legacy-modernization-part-three)
- [Strangler pattern implementation for safe microservices transition](https://circleci.com/blog/strangler-pattern-implementation-for-safe-microservices-transition/)

### Virtualization
- [Virtualization in React: Improving Performance for Large Lists](https://medium.com/@ignatovich.dm/virtualization-in-react-improving-performance-for-large-lists-3df0800022ef)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Rendering large lists with React Virtualized - LogRocket](https://blog.logrocket.com/rendering-large-lists-react-virtualized/)

### Zustand State Management
- [Zustand and React Context - TkDodo's blog](https://tkdodo.eu/blog/zustand-and-react-context)
- [Working with Zustand - TkDodo's blog](https://tkdodo.eu/blog/working-with-zustand)
- [Good practice: One global store, or separate stores - GitHub Discussion](https://github.com/pmndrs/zustand/discussions/2486)

### Seat Racing Methodology
- [Seat racing - British Rowing Plus](https://plus.britishrowing.org/2024/01/02/seat-racing/)
- [GitHub: Seat Racing Discussion](https://github.com/lindig/seat-racing)
- [The Data Science of Rowing Crew Selection](https://medium.com/@harry.powell72/the-data-science-of-rowing-crew-selection-16e5692cca79)

### Testing Stateful UI
- [A 2026 Guide for React UI Testing - Trio](https://trio.dev/react-ui-testing/)
- [Developing and testing sortable Drag and Drop components - DEV Community](https://dev.to/wolfriend/developing-and-testing-sortable-drag-and-drop-components-part-2-testing-13lj)

---

*Created: 2026-01-24*
*Confidence: HIGH (architectural patterns), MEDIUM (ELO methodology), LOW (optimal K-factor)*
