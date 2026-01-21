# RowLab Product Roadmap

**Last Updated**: January 21, 2026
**Status**: v2.0 - Active Development
**Full Plan**: [docs/plans/2026-01-19-comprehensive-improvement-plan.md](docs/plans/2026-01-19-comprehensive-improvement-plan.md)

---

## Executive Summary

RowLab is positioned to become the definitive rowing team management platform by combining:
- **Modern SaaS design** (Linear/Raycast-inspired "Precision Instrument" aesthetic)
- **AI-powered lineup optimization** (unique in the market)
- **Statistical seat racing analysis** (data science approach)
- **Unified platform** (management + analytics + optimization)

---

## Current Status: v2.0 ✅

### Recently Completed (January 2026)

- [x] Precision Instrument UI redesign
- [x] Multi-tenant team management
- [x] Seat racing with Elo ratings
- [x] AI lineup recommendations (genetic algorithm)
- [x] Combined scoring system
- [x] **40+ CodeRabbit fixes applied**:
  - Security vulnerabilities (Stripe, authorization)
  - Runtime errors (null checks, input validation)
  - Code quality (SpotlightCard extraction, duplicate removal)
- [x] Comprehensive documentation (API, database, components)

---

## Short Term (Q1 2026)

### 🔥 Phase 1: App Layout Redesign (Weeks 1-4)

**Goal**: Modern SaaS navigation patterns

```
┌─────────────────────────────────────────────────────┐
│ TopNav [Breadcrumbs] [🔍 Search] [Notifications] [👤]│
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Content Area (max-w-6xl standardized)   │
│ [Team]   │ ┌────────────────────────────────────┐  │
│ Dashboard│ │ PageHeader + Toolbar               │  │
│ Lineup*  │ │                                    │  │
│ Athletes │ │ Consistent Container               │  │
│ Erg Data │ │                                    │  │
└──────────┴─┴────────────────────────────────────┴──┘

Mobile: [🏠] [⚓] [👥] [···]  ← Bottom Dock
```

| Task | Status | Priority |
|------|--------|----------|
| PageContainer standardization | ✅ Complete | P0 |
| TopNav with GlobalSearch | ✅ Complete | P0 |
| MobileDock (bottom navigation) | ✅ Complete | P0 |
| Breadcrumbs navigation | ✅ Complete | P1 |
| Command palette (Cmd+K) UI | ✅ Complete | P1 |
| WorkspaceSwitcher for teams | ✅ Complete | P2 |

### ✅ Phase 2: Real-Time Collaboration (Weeks 3-4)

**Goal**: Multiple coaches editing lineups simultaneously
**Status**: Completed January 21, 2026

| Task | Status | Priority |
|------|--------|----------|
| Collaboration presence UI | ✅ Complete | P0 |
| Live cursor positions | 🔲 Pending | P1 |
| Change history logging | 🔲 Pending | P1 |
| Conflict resolution | 🔲 Pending | P2 |

*Note: WebSocket server already exists (`server/socket/collaboration.js`)*
*Components: PresenceAvatarStack, CollaborationStatus, CollaborationPresence*

### ✅ Phase 3: Regatta Day Mode (Weeks 5-6)

**Goal**: Race-day interface with live timing
**Status**: Completed January 21, 2026

| Task | Status | Priority |
|------|--------|----------|
| Race day schedule view | ✅ Complete | P0 |
| Live results display | ✅ Complete | P0 |
| Live standings calculation | ✅ Complete | P0 |
| Countdown timers | ✅ Complete | P1 |
| Margin prediction | 🔲 Pending | P2 |

*Components: CountdownTimer, RaceScheduleTimeline, LiveResultsBoard, RaceDayView*
*Features: Auto-refresh, view mode switching, own team highlighting*

---

## Medium Term (Q2 2026)

### Phase 4: Integration Hub (Weeks 7-8)

| Integration | Status | Effort |
|-------------|--------|--------|
| Concept2 Logbook (complete) | 🔲 Pending | Medium |
| Strava activities | 🔲 Pending | Medium |
| Garmin .FIT import | 🔲 Pending | Medium |
| Background sync jobs | 🔲 Pending | Small |

### Phase 5: Design Token Migration ✅ COMPLETE

**Status**: Completed January 21, 2026

| Scope | Status | Details |
|-------|--------|---------|
| Initial audit | ✅ | 200+ gray-* occurrences in 33 files |
| Phase 1 migration | ✅ | 9 high-priority files (84 occurrences) |
| Phase 2 migration | ✅ | 6 medium-priority files (45 occurrences) |
| Phase 3 migration | ✅ | 20+ remaining files |
| **Final result** | ✅ | **Only 11 gray-* remaining (2 legacy "Old" files)** |

Files migrated include: BoatDisplay, Seat, CoxswainSeat, PerformanceModal, PDFExportModal, ErgDataModal, ShellManagementModal, LineupToolbar, AthleteBank, BoatSelectionModal, SavedLineupsModal, LineupAssistant, BoatViewPage, AssignmentControls, BoatVisualizer, Boat3DViewer, PerformanceChart, GlassModal, GlassButton, GlassInput, GlassBadge, GlassContainer, AuthButton, App.jsx, and more.

### Phase 6: Training Plans (Weeks 11-12)

| Feature | Status | Effort |
|---------|--------|--------|
| Plan builder calendar | 🔲 Pending | Large |
| Workout assignments | 🔲 Pending | Medium |
| Training load charts | 🔲 Pending | Medium |
| Periodization templates | 🔲 Pending | Small |

---

## Long Term (Q3-Q4 2026)

### Phase 7: Advanced Features

| Feature | Effort | Priority | Competition |
|---------|--------|----------|-------------|
| Weather Integration | Small (5d) | P2 | None have it |
| Video Analysis | X-Large (16d) | P3 | CrewLAB has it |
| Recruitment Tools | Large (10d) | P3 | None have it |
| Alumni Network | Medium (8d) | P4 | None have it |

### Phase 8: Mobile App (Q4 2026)

| Platform | Approach | Timeline |
|----------|----------|----------|
| iOS | React Native | Q4 2026 |
| Android | React Native | Q4 2026 |

---

## Technical Debt Priorities

### P0 - Critical (Must Fix)

| Issue | Location | Status |
|-------|----------|--------|
| Team auth on telemetry | `server/routes/telemetry.js` | 🔲 Pending |
| Test coverage (1 file → 70%+) | All services/components | 🔲 Pending |
| Replace console.log (26 files) | Backend services | 🔲 Pending |

### P1 - High Priority

| Issue | Impact |
|-------|--------|
| WCAG 2.1 AA compliance | Accessibility |
| Component splitting (4 files > 500 lines) | Maintainability |
| React.memo on expensive components | Performance |

### P2 - Medium Priority

| Issue | Decision |
|-------|----------|
| TypeScript migration | Full TS vs JSDoc |
| Error handling standardization | Unified pattern |
| CSS cleanup | Remove unused styles |

---

## Competitive Landscape

| Feature | RowLab | RegattaCentral | CrewLAB | iCrew |
|---------|--------|----------------|---------|-------|
| Modern UI | ✅ | ❌ | ⚠️ | ❌ |
| AI Lineup Optimization | ✅ | ❌ | ❌ | ❌ |
| Seat Racing Analytics | ✅ | ❌ | ⚠️ | ❌ |
| Real-Time Collaboration | 🔲 Soon | ❌ | ❌ | ❌ |
| Video Analysis | 🔲 Planned | ❌ | ✅ | ❌ |
| Weather Data | 🔲 Planned | ❌ | ❌ | ❌ |
| Mobile App | 🔲 Planned | ❌ | ⚠️ | ❌ |

**Key Differentiators**:
1. Only platform with AI-powered lineup optimization
2. Modern "Precision Instrument" UI (competitors stuck in 2010)
3. Statistical seat racing analysis (regression models vs gut feeling)
4. Accessible pricing for club programs

---

## Pricing Strategy (Proposed)

| Tier | Price | Athletes | Key Features |
|------|-------|----------|--------------|
| **Free** | $0/mo | Personal | Training log, basic erg |
| **Team** | $39/mo | Up to 30 | Lineup builder, analytics |
| **Pro** | $149/mo | Unlimited | AI optimization, integrations |
| **Enterprise** | Custom | Multi-team | API, support, customization |

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Test Coverage | ~0% | 70%+ | 8 weeks |
| Lighthouse Performance | TBD | 90+ | 4 weeks |
| Lighthouse Accessibility | TBD | 90+ | 4 weeks |
| Teams Signed Up | 0 | 50 | 3 months |
| Paid Conversion | - | 10% | 6 months |
| MRR | $0 | $5,000 | 12 months |

---

## Release Timeline

| Version | Target | Focus |
|---------|--------|-------|
| **v2.1** | Feb 2026 | Layout redesign, collaboration |
| **v2.2** | Mar 2026 | Regatta day mode, integrations |
| **v2.3** | Apr 2026 | Training plans, design tokens |
| **v3.0** | Q3 2026 | Video analysis, mobile app |

---

## How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Priority for Contributors

1. **Layout components** - Help build new navigation
2. **Tests** - Reach 70% coverage goal
3. **Accessibility** - WCAG compliance
4. **Documentation** - Improve guides

### Getting Started

Look for issues labeled:
- `good first issue` - Beginner friendly
- `help wanted` - Community input needed
- `priority:P0` - Critical path items

---

## Resources

- **Full Plan**: [docs/plans/2026-01-19-comprehensive-improvement-plan.md](docs/plans/2026-01-19-comprehensive-improvement-plan.md)
- **API Docs**: [docs/api/README.md](docs/api/README.md)
- **Design System**: [.claude/design-standard.md](.claude/design-standard.md)
- **CodeRabbit Review**: [docs/CODERABBIT_REVIEW.md](docs/CODERABBIT_REVIEW.md)

---

*Last updated: January 19, 2026*


---

## Future (2027+)

### Native PM5 Companion App

**Status**: Concept / Research  
**Estimated Timeline**: 2027

iOS/Android app that connects directly to Concept2 PM5 monitors via Bluetooth to enable:

1. **Real-time split streaming** - Stream workout data live to RowLab web dashboard during erg sessions
2. **Push workout configurations** - Send pre-built workouts from RowLab directly to the erg monitor
3. **Wireless erg racing** - Synchronize multiple ergs to start/race together with countdown
4. **Live leaderboard display** - Show real-time leaderboard during team erg sessions on any screen

#### Technical Considerations

| Aspect | Details |
|--------|---------|
| Protocol | Bluetooth LE (CSAFE protocol) |
| SDK | Concept2 has SDK documentation for third-party apps |
| Framework | React Native or Flutter for cross-platform |
| Backend | Real-time WebSocket connection to RowLab for live data streaming |

#### Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Live Workout Dashboard | Pending | Data consumer must be built first |
| Concept2 Developer Partnership | Pending | May need developer approval/partnership |
| Phase 8: Mobile App Foundation | Pending | Core mobile infrastructure required |

#### Use Cases

- **Practice Sessions**: Coach sees all rowers' splits in real-time on the RowLab dashboard
- **Erg Tests**: Synchronized starts ensure fair 2k/6k tests with live rankings
- **Team Racing**: Fun competition mode with head-to-head display
- **Remote Athletes**: Athletes training at home can still join team sessions

#### Competitive Advantage

No existing rowing platform offers native PM5 integration with live coaching dashboard. This would position RowLab as the only end-to-end platform for both on-water and erg training management.

---

### Shell Margin Visualization

**Status**: Concept / Backlog  
**Priority**: P3  
**Estimated Effort**: Large (10-15 days)

Visual representation of time/distance margins between boats during water workouts, accounting for shell type differences.

#### Features

| Feature | Description | Effort |
|---------|-------------|--------|
| Distance margin conversion | Convert time gaps to physical distance (e.g., "1V beat 2V by 2.3 seconds = ~8 meters") | Medium |
| Shell type speed adjustment | Account for baseline speed differences between shell types (8+ vs 4+ vs 4- vs 2x) | Medium |
| Visual margin representation | Show boats spaced by their actual margin in an intuitive visualization | Medium |
| Animated race replay | Replay showing how margins changed throughout pieces | Large |
| "What-if" analysis | "If 2V maintained their piece 1 pace, they would have won by X meters" | Medium |

#### Technical Considerations

- **Speed/velocity models**: Need baseline speed data for different shell types at various stroke rates
- **Margin calculation**: `time_gap * boat_speed = distance_margin`
- **Environmental factors**: May need to account for water conditions, head/tail wind
- **Future integration**: Could integrate with GPS data from SpeedCoach or NK devices

#### Use Cases

1. **Race analysis**: Help coaches understand how close races actually were
2. **Pacing feedback**: Identify where boats gained/lost margin during pieces
3. **Fair comparison**: Compare performance across different shell types fairly
4. **Training decisions**: Data-driven boat selection and lineup changes

#### Dependencies

- Regatta Day Mode (Phase 3) for live timing data
- Integration Hub (Phase 4) for potential SpeedCoach/NK device data

