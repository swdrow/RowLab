# Phase 19: Telemetry & Combined Scoring

## Phase Goal

Coach can import telemetry data from rowing sensors (Empower, Peach, NK SpeedCoach), view detailed stroke metrics, and create combined athlete rankings using multiple data sources.

## Background

Elite rowing programs use telemetry systems that measure force curves, stroke timing, and biomechanics. This data is currently siloed in vendor apps. By importing it into RowLab, coaches can correlate technique metrics with erg performance and seat racing results to build comprehensive athlete profiles.

## Requirements

### TEL-01: Empower Import
- Import Empower .csv exports
- Parse force curve data per stroke
- Extract per-stroke metrics (peak force, drive time, slip, wash)
- Handle multi-athlete boat sessions

### TEL-02: Peach Import
- Import Peach session files
- Parse biomechanics data
- Extract catch/finish angles
- Support video frame correlation

### TEL-03: NK SpeedCoach Import
- Import NK GPS+Speed data
- Parse stroke rate, speed, distance
- Extract per-stroke variations
- Merge with GPS track data

### TEL-04: Telemetry Visualization
- Force curve display (individual strokes)
- Stroke-to-stroke comparison overlay
- Session trend charts
- Crew synchronization analysis

### TEL-05: Athlete Telemetry Profile
- Aggregate telemetry stats per athlete
- Track improvement over time
- Compare against team averages
- Identify technique patterns

### TEL-06: Combined Scoring Engine
- Configurable multi-metric formula
- Inputs: Erg score, seat race ELO, telemetry metrics, attendance
- Weighted combination with normalization
- Confidence scoring based on data availability

### TEL-07: Combined Rankings View
- Sortable rankings table
- Breakdown showing each component contribution
- Filter by boat class, side, date range
- Export rankings (CSV, PDF)

### TEL-08: Scoring Profiles
- Preset profiles (Power-focused, Technique-focused, Balanced)
- Custom profile creation
- Save and share profiles
- A/B comparison of different weightings

## Dependencies

- Phase 7: Erg data for combined scoring
- Phase 14: ELO ratings and composite rankings foundation

## Success Criteria

1. Coach can import telemetry files from Empower, Peach, or NK SpeedCoach
2. Athletes see telemetry data in their performance profile
3. Coach can view force curves and stroke timing visualizations
4. Combined scoring produces rankings using multiple data sources
5. Coach can customize scoring weights and see component breakdown

## Design Considerations

- File format detection: auto-detect vendor from file structure
- Large file handling: streaming parse for 10,000+ stroke sessions
- Visualization performance: canvas-based rendering for force curves
- Mobile: simplified telemetry view (key metrics only)
