# Phase 21: Predictive Analytics

## Phase Goal

Coaches and athletes can see data-driven predictions for performance, including 2k potential estimates, race outcome predictions, and injury risk indicators.

## Background

Rowing generates substantial data that can inform predictions. A steady-state erg session contains signal about 2k potential. Training load patterns can indicate injury risk. Historical race data can predict outcomes. This phase brings predictive modeling to RowLab.

## Requirements

### PRED-01: Predictive 2k Calculator
- Estimate 2k potential from sub-maximal data
- Input sources: steady state, 6k, intervals, lifting tests
- Show confidence interval on prediction
- Track prediction accuracy over time

### PRED-02: Race Outcome Predictions
- Model probability of placement (1st, 2nd, 3rd, etc.)
- Factor in team rankings, course conditions, weather
- Update predictions as regatta progresses
- Historical accuracy tracking

### PRED-03: Training Response Modeling
- Predict adaptation to training load
- Optimal taper recommendations
- Recovery time estimates
- Peaking timing suggestions

### PRED-04: Injury Risk Indicators
- Flag athletes at elevated injury risk
- Factor in: training load spike, sleep/recovery, history
- Provide risk score with contributing factors
- Recommend load adjustments

### PRED-05: Progress Projections
- Project where athlete will be in N weeks
- Based on current training trajectory
- Show multiple scenarios (aggressive vs. conservative)
- Compare actual vs. projected progress

### PRED-06: Team Speed Estimates
- Estimate boat speed from athlete combinations
- Factor in synergy, rigging, conditions
- Compare estimated vs. actual race times
- Identify boat configurations with upside

### PRED-07: Confidence & Uncertainty
- All predictions include confidence intervals
- Clearly communicate uncertainty
- Explain data requirements for better predictions
- Flag predictions with insufficient data

### PRED-08: Prediction Dashboard
- Unified view of all predictions
- Athlete-level and team-level views
- Filter by prediction type, confidence
- Export predictions for review

## Dependencies

- Phase 7: Erg data for performance modeling
- Phase 10: Training plans for load analysis
- Phase 14: Rankings for prediction inputs
- Phase 19: Telemetry for technique factors

## Success Criteria

1. 2k predictions are within 3 seconds of actual result 80% of the time
2. Injury risk indicators flag athletes before injury with >60% accuracy
3. Race outcome predictions outperform naive baseline (rankings alone)
4. Athletes can see clear, understandable progress projections
5. All predictions include appropriate uncertainty communication

## Design Considerations

- Avoid false precision: communicate uncertainty honestly
- Ethical considerations: injury predictions shouldn't stigmatize
- Data requirements: clearly state what's needed for predictions
- Calibration: regularly verify and adjust model accuracy
