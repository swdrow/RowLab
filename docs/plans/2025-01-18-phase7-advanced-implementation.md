# Phase 7: Advanced Implementation Plan

## Overview
Implement advanced features: telemetry imports, combined scoring, and AI-powered lineup optimization.

## Existing Schema (from prisma/schema.prisma)

```prisma
model AthleteTelemetry {
  id             String   @id @default(uuid())
  athleteId      String
  sessionDate    DateTime
  source         String   // empower, peach, nk
  seatNumber     Int?
  avgWatts       Decimal? @db.Decimal(6, 2)
  peakWatts      Decimal? @db.Decimal(6, 2)
  workPerStroke  Decimal? @db.Decimal(8, 2)
  slipDegrees    Decimal? @db.Decimal(5, 2)
  washDegrees    Decimal? @db.Decimal(5, 2)
  catchAngle     Decimal? @db.Decimal(5, 2)
  finishAngle    Decimal? @db.Decimal(5, 2)
  peakForceAngle Decimal? @db.Decimal(5, 2)
  techScore      Decimal? @db.Decimal(5, 2)
  createdAt      DateTime @default(now())

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  @@index([athleteId])
  @@map("athlete_telemetry")
}

model AthleteRating {
  id              String   @id @default(uuid())
  athleteId       String
  teamId          String
  ratingType      String   // seat_race_elo, combined
  ratingValue     Decimal  @default(1000) @db.Decimal(8, 2)
  confidenceScore Decimal? @db.Decimal(4, 3)
  racesCount      Int      @default(0)
  lastCalculatedAt DateTime @default(now())

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  @@unique([athleteId, ratingType])
  @@map("athlete_ratings")
}
```

---

## Tasks

### Task 1: Telemetry Service
**File**: `server/services/telemetryService.js`

Functions:
- `createTelemetryEntry(athleteId, data)` - Create single entry
- `batchImportTelemetry(teamId, entries[])` - Batch import with athlete matching
- `getTelemetryByAthlete(athleteId, { startDate, endDate })` - Get athlete's telemetry
- `getTelemetryBySession(teamId, sessionDate)` - Get all telemetry for a date
- `deleteTelemetry(id)` - Delete entry
- `parseCsvRow(row, source)` - Parse CSV row based on source format

CSV parsing for sources:
- **Empower**: avgWatts, peakWatts, workPerStroke, catchAngle, finishAngle, slipDegrees, washDegrees
- **Peach**: Similar metrics, different column names
- **NK**: Basic power data

**Verification**: `node --check server/services/telemetryService.js`

---

### Task 2: Telemetry Routes
**File**: `server/routes/telemetry.js`

Endpoints:
- `GET /athlete/:athleteId` - Get athlete's telemetry history
- `GET /session/:date` - Get team's telemetry for date
- `POST /` - Create single entry
- `POST /import` - Batch import from CSV (multipart/form-data)
- `DELETE /:id` - Delete entry

Auth: COACH+ for all write operations

**Verification**: `node --check server/routes/telemetry.js`

---

### Task 3: Combined Scoring Service
**File**: `server/services/combinedScoringService.js`

Algorithm to create unified athlete score:
```
Combined Score = (0.4 × Erg Score) + (0.3 × Seat Race Elo) + (0.3 × Telemetry Score)
```

Functions:
- `calculateErgScore(athleteId)` - Normalize erg performance (weighted by test type)
- `getSeatRaceElo(athleteId)` - Get current Elo rating
- `calculateTelemetryScore(athleteId)` - Composite from recent telemetry
- `calculateCombinedScore(athleteId)` - Master calculation
- `recalculateTeamScores(teamId)` - Batch recalculate all athletes
- `getTeamRankingsByCombined(teamId)` - Ranked list

Normalization:
- Erg scores: Z-score within team, then map to 0-100 scale
- Telemetry: Weight recent sessions higher, normalize metrics
- Elo: Already normalized around 1000

Store results in AthleteRating with ratingType='combined'

**Verification**: `node --check server/services/combinedScoringService.js`

---

### Task 4: Combined Scoring Routes
**File**: `server/routes/combinedScoring.js`

Endpoints:
- `GET /rankings` - Get team rankings by combined score
- `GET /athlete/:athleteId` - Get athlete's score breakdown
- `POST /recalculate` - Trigger recalculation (COACH+ only)
- `GET /history/:athleteId` - Score history over time

**Verification**: `node --check server/routes/combinedScoring.js`

---

### Task 5: AI Lineup Optimizer Service
**File**: `server/services/aiLineupOptimizerService.js`

Genetic algorithm approach:
1. **Chromosome**: Lineup configuration (seat assignments)
2. **Fitness**: Combined speed estimate from athlete scores + compatibility
3. **Selection**: Tournament selection
4. **Crossover**: Swap seats between parents
5. **Mutation**: Random seat swaps

Functions:
- `generateOptimalLineup(teamId, boatClass, constraints)` - Main optimizer
- `evaluateFitness(lineup, athleteScores)` - Score a lineup
- `generateInitialPopulation(athletes, boatClass, size)` - Create starting population
- `crossover(parent1, parent2)` - Combine two lineups
- `mutate(lineup, rate)` - Random modifications
- `selectParents(population, fitnesses)` - Tournament selection
- `enforceConstraints(lineup, constraints)` - Side preferences, coxswain

Constraints:
- Side preferences (Port, Starboard, Both)
- Coxswain position
- Required athletes (must include)
- Excluded athletes

**Verification**: `node --check server/services/aiLineupOptimizerService.js`

---

### Task 6: AI Lineup Routes
**File**: `server/routes/aiLineup.js`

Endpoints:
- `POST /optimize` - Generate optimal lineup
  - Body: { boatClass, constraints, generations?, populationSize? }
  - Returns: top N lineup suggestions with fitness scores
- `POST /evaluate` - Evaluate a specific lineup
  - Body: { lineup }
  - Returns: fitness score and breakdown

**Verification**: `node --check server/routes/aiLineup.js`

---

### Task 7: Race Predictor Service
**File**: `server/services/racePredictorService.js`

Regression-based prediction:
1. Use historical race data to build model
2. Input: lineup's combined scores + boat class
3. Output: predicted time + confidence interval

Functions:
- `predictRaceTime(lineupId, courseType)` - Predict time for a lineup
- `compareLineups(lineup1Id, lineup2Id, courseType)` - Head-to-head prediction
- `getConfidenceInterval(prediction, sampleSize)` - Calculate CI
- `trainModel(teamId, boatClass)` - Update regression coefficients

Simple linear regression: `time = β0 + β1×avgCombinedScore + β2×boatClass_factor`

**Verification**: `node --check server/services/racePredictorService.js`

---

### Task 8: Mount All Routes
**File**: `server/index.js`

Add:
```javascript
import telemetryRoutes from './routes/telemetry.js';
import combinedScoringRoutes from './routes/combinedScoring.js';
import aiLineupRoutes from './routes/aiLineup.js';

app.use('/api/v1/telemetry', apiLimiter, telemetryRoutes);
app.use('/api/v1/combined-scoring', apiLimiter, combinedScoringRoutes);
app.use('/api/v1/ai-lineup', apiLimiter, aiLineupRoutes);
```

**Note**: Race Predictor endpoints are bundled into `aiLineupRoutes` (see Task 7 in racePredictorService.js). The AI Lineup Optimizer internally uses race prediction for lineup scoring.

**Verification**: Server starts without errors

---

### Task 9: Telemetry Store
**File**: `src/store/telemetryStore.js`

State: telemetryData[], loading, error
Actions: fetchByAthlete, fetchBySession, importCsv, deleteEntry

---

### Task 10: Combined Scoring Store
**File**: `src/store/combinedScoringStore.js`

State: rankings[], athleteBreakdown, loading, error
Actions: fetchRankings, fetchAthleteBreakdown, recalculate

---

### Task 11: AI Lineup Store
**File**: `src/store/aiLineupStore.js`

State: suggestions[], evaluationResult, loading, error
Actions: optimizeLineup, evaluateLineup, clearSuggestions

---

### Task 12: TelemetryImport Component
**File**: `src/components/Advanced/TelemetryImport.jsx`

Features:
- File upload (CSV)
- Source selection (Empower, Peach, NK)
- Date picker for session
- Preview parsed data
- Import button
- Success/error feedback

---

### Task 13: CombinedRankings Component
**File**: `src/components/Advanced/CombinedRankings.jsx`

Features:
- Table with columns: Rank, Name, Combined Score, Erg Score, Elo, Telemetry Score
- Click to see breakdown
- Recalculate button (COACH+)
- Score trend sparklines (optional)

---

### Task 14: AILineupOptimizer Component
**File**: `src/components/Advanced/AILineupOptimizer.jsx`

Features:
- Boat class selector
- Constraint builder (side preferences, required/excluded athletes)
- "Generate Optimal Lineups" button
- Results: Top 3-5 suggestions with fitness scores
- Click suggestion to view details
- "Use This Lineup" to apply

---

### Task 15: AdvancedPage
**File**: `src/pages/AdvancedPage.jsx`

Tabs:
1. Telemetry - Import and view telemetry data
2. Combined Scoring - Team rankings by combined score
3. AI Optimizer - Generate optimal lineups
4. Race Predictor - Predict race outcomes (optional, can be simplified)

---

### Task 16: Add Route and Navigation
- Add /app/advanced route to App.jsx
- Add "Advanced" link to sidebar with brain/sparkles icon

---

## Verification Checklist

- [ ] All backend files pass `node --check`
- [ ] Frontend build passes
- [ ] Telemetry CSV import works
- [ ] Combined scoring calculates correctly
- [ ] AI optimizer generates valid lineups
- [ ] Routes mounted and accessible

## Notes

- Genetic algorithm: Start with small population (50) and few generations (100) for quick results
- Race predictor: Simple regression is sufficient; can enhance later with ML
- Telemetry: Support common CSV formats, be lenient with parsing
