# Phase 20: AI Lineup Optimizer (v2)

## Phase Goal

Coach receives AI-powered lineup recommendations with clear explanations, constraint handling, and scenario comparison to build optimal boat configurations.

## Background

V1 has a basic AI lineup optimizer, but coaches need better explanations of WHY certain combinations are recommended. V2 enhances this with constraint-aware optimization, scenario modeling, and transparent reasoning that coaches can trust.

## Requirements

### AI-01: Enhanced Optimization Algorithm
- Multi-objective optimization (speed, balance, compatibility)
- Constraint satisfaction (side preference, weight limits, conflicts)
- Handle partial data gracefully
- Produce confidence scores for recommendations

### AI-02: Constraint Configuration
- Side preference requirements (hard/soft constraints)
- Weight distribution targets
- Athlete conflicts/pairings (who works well together)
- Shell-specific requirements (rigging, reach)

### AI-03: Scenario Comparison
- Generate multiple lineup options
- Side-by-side comparison view
- Highlight trade-offs between options
- "What if" modeling (swap athletes between scenarios)

### AI-04: Explanation System
- Clear reasoning for each recommendation
- Identify limiting constraints
- Show data sources used in decision
- Flag low-confidence suggestions

### AI-05: Coach Override Integration
- Accept coach modifications
- Explain impact of manual changes
- Learn from coach preferences over time
- Track override patterns

### AI-06: Race-Specific Optimization
- Optimize for specific race conditions
- Consider opponent strengths
- Weather/course factor adjustments
- Sprint vs. endurance lineup variations

### AI-07: Squad Building Mode
- Select lineups for multiple boats simultaneously
- Avoid athlete double-booking
- Optimize across entire regatta entry list
- Balance depth across events

### AI-08: LLM Integration (Optional)
- Natural language queries ("best bow pair for the 4+")
- Conversational lineup building
- GPT/Claude API for explanation generation
- Coach Q&A about recommendations

## Dependencies

- Phase 8: Lineup builder for applying recommendations
- Phase 14: Rankings for optimization inputs
- Phase 19: Telemetry for technique-aware optimization

## Success Criteria

1. AI generates lineup recommendations with clear explanations
2. Constraints are respected and violations flagged
3. Coach can compare multiple scenarios side-by-side
4. System learns from coach overrides over time
5. Multi-boat optimization produces balanced squad selections

## Design Considerations

- Transparency: coaches must understand WHY, not just WHAT
- Fallback: system works without AI for simpler recommendations
- Performance: optimize in <5 seconds for single boat
- Privacy: consider where AI processing happens (local vs. cloud)
