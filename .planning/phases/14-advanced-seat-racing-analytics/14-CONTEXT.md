# Phase 14: Advanced Seat Racing Analytics - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

World-class athlete ranking system using matrix seat racing, Bradley-Terry statistical models, and optimal swap scheduling. This phase establishes RowLab as the definitive platform for rowing selection decisions.

Delivers:
- Matrix session planner (optimal swap schedule generation)
- Bradley-Terry ranking model (replacing/enhancing ELO)
- Boat speed bias correction
- Multi-way swap support (2:2, 3:3)
- Comparison graph visualization
- **Passive ELO from practice data** (unique differentiator)
- **Composite ranking** (on-water + erg + attendance weighting)
- Side-specific ELO (separate rankings per rowing side)

</domain>

<decisions>
## Implementation Decisions

### Matrix Planner UX
- Dedicated "Matrix Planner" page under Seat Racing (not extending existing wizard)
- Athlete selection via multi-select from roster with side/position filters
- Generated swap schedule shown in two views: grid matrix (athletes × pieces) as primary, timeline swimlanes as alternate tab
- Manual adjustments allowed with warnings when breaking statistical validity
- Coach can override algorithmic suggestions but system flags when it hurts comparison coverage

### Ranking Display & Confidence
- Confidence visualization via intervals/error bars (overlapping bars show unclear relative ranking)
- Toggle available to show probability matrix (P(A beats B) for each pair)
- Explanation depth: layered approach — coach-friendly summary by default ("Jane has beaten 5/6 opponents"), "Show methodology" expands to technical details (log-likelihood, standard errors)
- Athlete detail view shows both: comparison history (who they've raced, W/L) AND ranking trajectory over time (chart of position changes)
- Comparison gaps shown via both: network graph visualization (missing edges = gaps) AND actionable list ("Jane and Tom have never raced")

### Side-Specific ELO
- Athletes who can row both sides have separate ELO per side
- Profile displays primary side prominently, secondary side in collapsible section
- Side auto-detected from seat position when assigning to lineup or seat race (no explicit toggle needed)
- Coach-designated "primary side" determines which ELO shows by default
- Head-to-head calculations use the ELO for the side each athlete is currently rowing

### Claude's Discretion (Side ELO Correlation)
- Whether improving on one side should give partial credit to the other side's ELO
- Statistical relationship between port and starboard performance for dual-side athletes

### Passive ELO Integration
- Automatic tracking when lineup + times exist (no opt-in required)
- Simplified input supported: just observed split difference between boats OR just relative finish order (both available)
- Practice observations weighted at 0.5x compared to formal seat races (1.0x)
- Updates happen subtly in background — coach sees cumulative effect over time, no per-update notifications

### Claude's Discretion (Swap Recording)
- Best UX for recording mid-practice swaps (quick button, re-record lineup, or natural language)
- May combine approaches for different contexts

### Composite Ranking Weights
- Composite ranking is default view with expandable breakdown showing component contributions
- Weight configuration: preset profiles available ("Performance-First", "Balanced", "Reliability") + "Custom" unlocks slider controls
- Erg performance factor uses all erg data with type weighting (2k tests weighted higher than steady state/intervals)
- Attendance factor uses streak-based calculation with rolling 30-day window (recent reliability matters most)
- Athlete visibility of rankings is coach-controlled (some teams keep rankings private)
- Changing weights applies to current rankings only — historical rankings stay as calculated
- Ties in composite score broken by secondary sort on on-water ELO

</decisions>

<specifics>
## Specific Ideas

- "An athlete who can row both sides might be better at rowing port than starboard — coach should see that separately"
- Side selection should be automatic from seat position, not require explicit toggle each time
- Simple split observation during steady state can contribute to rankings (e.g., "1V doing 1:50, 2V doing 1:52" = 2 second difference)
- When athletes are swapped during practice, the change in split can inform ELO updates

</specifics>

<deferred>
## Deferred Ideas

### Custom Shell Rigging (Fleet Management Enhancement)
User requested: ability to define custom rigging per shell in fleet management. Standard options (port-rigged, starboard-rigged) plus custom per-seat side assignment (e.g., a 4 could be Port-Starboard-Starboard-Port instead of alternating). Constraint: must have even number of each side.

**Recommendation:** Add to Fleet Management backlog or create separate enhancement phase. Phase 14 can assume shells have defined rigging (standard or custom) and respects it for ELO calculations.

</deferred>

---

*Phase: 14-advanced-seat-racing-analytics*
*Context gathered: 2026-01-26*
