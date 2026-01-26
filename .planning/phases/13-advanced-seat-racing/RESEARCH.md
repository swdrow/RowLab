# Phase 13: Advanced Seat Racing Analytics — Research Document

**Created:** 2026-01-24
**Status:** Research Phase
**Goal:** Establish RowLab as the world-class platform for scientifically rigorous athlete ranking

---

## Executive Summary

This phase will implement advanced statistical methods for athlete ranking that go beyond simple ELO calculations. The key innovations are:

1. **Bradley-Terry Model** — Probabilistic pairwise comparison model with proper confidence intervals
2. **Matrix Seat Racing** — Optimal swap schedule generation using experimental design principles
3. **Passive ELO from Practice** — Continuous ranking updates from regular workout data (unique differentiator)
4. **Boat Speed Bias Correction** — Statistical separation of athlete skill from equipment differences

---

## Part 1: Statistical Ranking Models

### 1.1 Current Implementation (ELO)

**Pros:**
- Simple to understand and implement
- Updates incrementally
- Well-known in gaming/chess contexts

**Cons:**
- Designed for 1v1 competitions, not team sports
- K-factor is arbitrary
- Confidence intervals are count-based (simplistic)
- Doesn't handle margin of victory well
- No rigorous statistical foundation for rowing

### 1.2 Bradley-Terry Model (Recommended)

**Source:** [Bradley-Terry Model and Data-Driven Ranking](https://jameshoward.us/2025/01/31/bradley-terry-model-and-data-driven-ranking)

The Bradley-Terry model (1952) estimates relative strengths from pairwise comparisons:

```
P(i beats j) = exp(β_i) / (exp(β_i) + exp(β_j))
```

Where β_i is the "strength" parameter for athlete i.

**Advantages for Rowing:**
- Produces proper confidence intervals via maximum likelihood estimation
- Handles incomplete comparison graphs (not everyone has raced everyone)
- Can incorporate margin of victory
- Standard errors available for each ranking
- Extensible to include covariates (boat type, conditions)

**Implementation Options:**
1. **JavaScript:** [Bradley-Terry-Sports-Model](https://github.com/sezenack/Bradley-Terry-Sports-Model)
2. **Python/Node:** Custom implementation using Newton-Raphson optimization
3. **Bayesian variant:** PyMC or Stan for uncertainty quantification

### 1.3 Bayesian Bradley-Terry (Advanced)

**Source:** [Bayesian ranking for tennis players in PyMC](https://amsterdam2023.pydata.org/cfp/talk/7RENTH/)

Benefits:
- Prior distributions handle sparse data (few comparisons)
- Credible intervals instead of confidence intervals
- Natural handling of temporal evolution (Dynamic B-T)
- Can encode coach prior beliefs

### 1.4 Comparison: ELO vs Bradley-Terry

| Feature | ELO | Bradley-Terry |
|---------|-----|---------------|
| Statistical rigor | Low | High |
| Confidence intervals | Count-based | MLE-derived |
| Margin of victory | Ad-hoc K scaling | Natural extension |
| Sparse comparisons | Unstable | Handled well |
| Implementation | Simple | Moderate |
| Interpretability | "Rating points" | Probability of winning |

**Recommendation:** Implement Bradley-Terry as the primary model, keep ELO as a familiar secondary display.

---

## Part 2: Experimental Design for Matrix Seat Racing

### 2.1 The Problem

Given:
- N athletes
- K boats
- M pieces available

Goal: Generate a swap schedule that maximizes comparison information while minimizing pieces.

### 2.2 Latin Square Designs

**Source:** [STAT 503 - The Latin Square Design](https://online.stat.psu.edu/stat503/lesson/4/4.3)

Latin squares control for two blocking factors simultaneously. In seat racing:
- Blocking factor 1: Boat (equipment differences)
- Blocking factor 2: Piece (environmental/fatigue differences)
- Treatment: Athlete

A Latin Square ensures each athlete rows in each boat exactly once and in each piece position exactly once.

**Example (4 athletes, 4 boats, 4 pieces):**

|        | Piece 1 | Piece 2 | Piece 3 | Piece 4 |
|--------|---------|---------|---------|---------|
| Boat A |    1    |    2    |    3    |    4    |
| Boat B |    2    |    3    |    4    |    1    |
| Boat C |    3    |    4    |    1    |    2    |
| Boat D |    4    |    1    |    2    |    3    |

### 2.3 Balanced Incomplete Block Designs (BIBD)

**Source:** [Balanced incomplete Latin square designs](https://www.stat.purdue.edu/~dkjlin/documents/publications/2013/2013_JSPI.pdf)

When you have more athletes than seats (common in rowing), use BIBD:
- Each pair of athletes compared equal number of times
- Not all athletes in every piece
- Statistically optimal for given constraints

**Parameters for BIBD:**
- v = number of athletes
- b = number of blocks (pieces × boats)
- r = replications per athlete
- k = athletes per block (seats per boat)
- λ = times each pair appears together

### 2.4 Practical Algorithm for Swap Generation

```
function generateSwapSchedule(athletes, numBoats, numPieces):
  1. Calculate comparison graph completeness target
  2. Use round-robin tournament scheduling as base
  3. Adapt to boat size constraints
  4. Optimize for balance using simulated annealing
  5. Return schedule with expected comparison coverage
```

### 2.5 Comparison Graph Visualization

Track which athletes have been compared:
- Nodes = Athletes
- Edges = Comparisons (weighted by count)
- Color = Confidence level
- Identify gaps (athletes without direct comparison)

---

## Part 3: Boat Speed Bias Correction

### 3.1 The Problem

Different boats have different inherent speeds due to:
- Equipment condition (newer vs. older shells)
- Hull design variations
- Rigging differences
- Weight

### 3.2 Statistical Correction

Use regression to estimate boat fixed effects:

```
Time_ij = μ + Athlete_i + Boat_j + Piece_k + ε_ijk
```

Where:
- μ = overall mean
- Athlete_i = athlete effect (what we want)
- Boat_j = boat fixed effect (nuisance)
- Piece_k = piece/environmental effect (nuisance)
- ε = random error

### 3.3 Multi-Piece Calibration

If boat B is consistently 2 seconds faster than boat A across multiple pieces:
1. Estimate boat speed difference
2. Adjust times before comparison
3. Use adjusted times for Bradley-Terry model

---

## Part 4: Passive ELO from Practice Data

### 4.1 Concept (Unique Differentiator)

Instead of requiring formal seat racing sessions, accumulate comparison data from regular practice:

1. Coach records lineup for each boat at practice
2. Coach records piece times for each boat
3. When athletes float between boats (1V ↔ 2V), system detects "implicit comparison"
4. Over weeks/months, builds robust rankings

### 4.2 Composite Ranking System

**Primary Factor (70-80% weight): On-Water Performance**
- Boat lineups + piece times from workouts
- Formal seat race results
- Bradley-Terry model applied to all comparisons

**Secondary Factors (20-30% weight combined):**

| Factor | Weight | Rationale |
|--------|--------|-----------|
| Erg Performance | 10-15% | Objective fitness/power baseline |
| Attendance | 5-10% | Reliability, commitment, availability |
| Training Load | 5% | Consistency over time |

### 4.3 Erg Performance Integration

**Key Insight:** Use relative rankings from every erg workout, not just normalized times from formal tests.

**Why relative rankings are better:**
- More frequent data points (every erg session, not just 2-3 tests/season)
- Accounts for workout-specific conditions (everyone did the same 4x2k)
- Captures consistency over time, not just peak performance
- Natural "erg ELO" — if you beat your teammates today, you rank higher

```
Erg Ranking Approach:
- Each erg workout → rank all participants by performance
- Apply Bradley-Terry to erg-based pairwise comparisons
- Formal tests (2k, 6k) weighted higher than casual pieces
- Trend analysis: improving position vs declining

Example:
  Workout: 3x2000m @ rate 24
  Results: Athlete A: 6:45, B: 6:48, C: 6:52, D: 6:55
  Rankings: A > B > C > D (pairwise comparisons recorded)
```

**Implementation:**
```javascript
function ergContribution(athlete, teamErgHistory) {
  // Get all erg workouts where athlete participated
  const workouts = teamErgHistory.filter(w => w.hasAthlete(athlete.id));

  // Extract pairwise comparisons from each workout
  const comparisons = [];
  for (const workout of workouts) {
    const rankings = workout.getRankings(); // sorted by performance
    for (let i = 0; i < rankings.length; i++) {
      for (let j = i + 1; j < rankings.length; j++) {
        comparisons.push({
          winner: rankings[i].athleteId,
          loser: rankings[j].athleteId,
          margin: rankings[j].time - rankings[i].time,
          weight: workout.isFormalTest ? 2.0 : 1.0 // tests count more
        });
      }
    }
  }

  // Apply Bradley-Terry to erg comparisons
  const ergStrength = bradleyTerry.fit(comparisons);

  // Recent trend (90-day position change)
  const trend = calculatePositionTrend(athlete, workouts, 90);

  return {
    strength: ergStrength[athlete.id],
    trend: trend,
    comparisonCount: comparisons.filter(c =>
      c.winner === athlete.id || c.loser === athlete.id
    ).length
  };
}
```

**Benefits of this approach:**
1. Every erg session feeds ranking data (not waiting for formal tests)
2. Handles athletes who miss tests but do regular training
3. More robust to single bad/good days
4. Same Bradley-Terry methodology as on-water rankings

### 4.4 Attendance Factor

Attendance reflects reliability and availability:

```
Attendance Score:
- Practice attendance rate (last 30/60/90 days)
- Weighted more heavily for water sessions
- Excused absences handled differently than unexcused

Categories:
- >95% attendance → 100% factor
- 85-95% → 95% factor
- 75-85% → 85% factor
- <75% → 70% factor (red flag)
```

**Philosophy:** Great athletes who aren't available can't make boats faster.

### 4.5 Data Requirements

For each water workout:
- Lineup per boat (which athletes in which seats)
- Piece times per boat
- Distance/conditions per piece

For erg tests:
- 2k and 6k times (stored in existing ErgScore model)
- Test date and conditions

For attendance:
- Practice records (water vs land)
- Excused vs unexcused absences

### 4.6 Comparison Extraction

```
function extractComparisons(workout):
  for each piece in workout:
    for each pair of boats (A, B):
      athletes_only_in_A = boat_A.athletes - boat_B.athletes
      athletes_only_in_B = boat_B.athletes - boat_A.athletes

      if len(athletes_only_in_A) == 1 and len(athletes_only_in_B) == 1:
        // Clean 1:1 swap detected
        record_comparison(athlete_A, athlete_B, time_diff)
      else if len(athletes_only_in_A) == len(athletes_only_in_B) <= 3:
        // Multi-swap (2:2, 3:3) - use partial credit
        record_group_comparison(athletes_A, athletes_B, time_diff)
```

### 4.7 Composite Score Calculation

```javascript
function calculateCompositeRanking(athlete, team) {
  // Primary: On-water performance (Bradley-Terry)
  const waterScore = bradleyTerry.getStrength(athlete);

  // Secondary: Erg performance
  const ergScore = ergContribution(athlete, team.ergStats);

  // Secondary: Attendance
  const attendanceScore = attendanceFactor(athlete, 90);

  // Configurable weights (coach can adjust)
  const weights = team.rankingWeights || {
    water: 0.75,
    erg: 0.15,
    attendance: 0.10
  };

  return {
    composite: (waterScore * weights.water) +
               (ergScore * weights.erg) +
               (attendanceScore * weights.attendance),
    breakdown: {
      water: { score: waterScore, weight: weights.water },
      erg: { score: ergScore, weight: weights.erg },
      attendance: { score: attendanceScore, weight: weights.attendance }
    },
    confidence: calculateConfidence(athlete)
  };
}
```

### 4.8 Coach Configuration

Allow coaches to adjust weights based on team philosophy:

| Profile | Water | Erg | Attendance |
|---------|-------|-----|------------|
| Performance-First | 85% | 10% | 5% |
| Balanced (Default) | 75% | 15% | 10% |
| Reliability-Focus | 65% | 15% | 20% |
| Custom | Coach-defined | Coach-defined | Coach-defined |

### 4.9 Integration Points

- Phase 8 (Lineup Builder) → provides lineup data
- Workout/piece logging → provides time data
- Phase 7 (Erg Data) → provides erg test results
- Attendance tracking → provides availability data
- Phase 13 → processes all factors into composite rankings

---

## Part 5: British Rowing Methodology

### 5.1 GB Rowing Protocol

**Source:** [British Rowing Plus - Seat Racing](https://plus.britishrowing.org/2024/01/02/seat-racing/)

Key practices:
- **Pairs/doubles matrices** as optimal starting point
- **Fours highlight differences** better than eights (less noise)
- **Rate capping** (32-34 spm) for consistency
- **1250-1500m** distances for 2k selection
- **Decide margins before starting** (e.g., 1 second = margin of error)
- **Handle appeals before swaps**

### 5.2 GB U19 Trials Example

```
Spring trials: 32 strokes/minute cap
July trials: 34 strokes/minute cap
Distance: 1500m
Format: Pairs matrix → fours seat racing
```

### 5.3 Selection Philosophy

> "Seat racing should be part of a big tapestry of information, not definitive. A single race result shouldn't overturn year-round performance data."

**Implication for RowLab:** Rankings should show confidence levels and highlight when more data is needed.

---

## Part 6: Implementation Recommendations

### 6.1 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Workout/Lineup  │────▶│  Comparison     │────▶│  Bradley-Terry  │
│     Data        │     │   Extractor     │     │     Model       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐     ┌─────────────────┐            │
│  Matrix Planner │────▶│  Swap Schedule  │            ▼
│    (BIB/Latin)  │     │   Generator     │     ┌─────────────────┐
└─────────────────┘     └─────────────────┘     │    Rankings     │
                                                │  with Confidence│
┌─────────────────┐     ┌─────────────────┐     └─────────────────┘
│  Boat Speed     │────▶│  Bias Corrected │            │
│   Calibration   │     │     Times       │            ▼
└─────────────────┘     └─────────────────┘     ┌─────────────────┐
                                                │   Comparison    │
                                                │     Graph       │
                                                └─────────────────┘
```

### 6.2 Technology Stack

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| Bradley-Terry | Custom JS implementation | Full control, no Python dependency |
| Matrix optimization | js-combinatorics + custom | Generate schedules client-side |
| Graph visualization | D3.js or Cytoscape.js | Interactive comparison networks |
| Statistical computation | stdlib.js or jStat | Browser-side statistics |

### 6.3 Phased Rollout

1. **Phase 13a:** Bradley-Terry model + comparison graph visualization
2. **Phase 13b:** Matrix session planner with swap scheduling
3. **Phase 13c:** Passive ELO from practice data
4. **Phase 13d:** Boat speed bias correction

---

## Part 7: Success Metrics

### 7.1 Technical Metrics

- Rankings correlate with expert coach assessments (r > 0.8)
- Confidence intervals contain true rank 95% of time
- Swap schedule generates 90%+ comparison coverage
- Model handles 100+ athletes without performance issues

### 7.2 User Metrics

- Coaches report higher confidence in selection decisions
- Reduced time spent planning seat race sessions
- Adoption by elite programs (D1, national teams)

### 7.3 Differentiator Validation

- "Passive ELO" feature cited as reason for platform choice
- Scientific methodology referenced in coaching decisions

---

## References

1. Bradley, R.A. and Terry, M.E. (1952). "Rank Analysis of Incomplete Block Designs: I. The Method of Paired Comparisons"
2. [British Rowing Plus - Seat Racing](https://plus.britishrowing.org/2024/01/02/seat-racing/)
3. [Bradley-Terry Model - Wikipedia](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model)
4. [Stanford STATS 200 - Lecture 24: Bradley-Terry Model](https://web.stanford.edu/class/archive/stats/stats200/stats200.1172/Lecture24.pdf)
5. [STAT 503 - Latin Square Design](https://online.stat.psu.edu/stat503/lesson/4/4.3)
6. [Balanced Incomplete Latin Square Designs - Purdue](https://www.stat.purdue.edu/~dkjlin/documents/publications/2013/2013_JSPI.pdf)
7. [Bradley-Terry-Sports-Model (GitHub)](https://github.com/sezenack/Bradley-Terry-Sports-Model)
8. [James Howard - Bradley-Terry Model and Data-Driven Ranking](https://jameshoward.us/2025/01/31/bradley-terry-model-and-data-driven-ranking)

---

*Research compiled: 2026-01-24*
*Ready for requirements definition and planning*
