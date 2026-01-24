# RowLab Complete Scope: v2.0 and Beyond

**Created:** 2026-01-24
**Purpose:** Comprehensive inventory of ALL features for the RowLab platform
**Status:** Planning document for future milestone roadmaps

---

## Design Philosophy: "Precision Instrument"

**CRITICAL:** Every feature must be built with exceptional UI/UX quality. We are not just migrating features — we are reimagining them through our design lens.

### Design Inspirations
| Reference | What We Take |
|-----------|--------------|
| **Raycast** | Void backgrounds, neon glows, glass with noise texture, command palette UX |
| **Linear** | Thin sidebars, micro-borders, keyboard-first navigation, buttery animations |
| **Vercel** | Gradient masks, fade-to-void edges, confidence in whitespace |
| **Whoop** | Circular progress rings, data-first UI, recovery visualization |
| **Rauno Freiberg** | Spring physics, mouse velocity tracking, micro-interactions |

### Core Principles
1. **Color = Meaning** — Structural UI uses neutrals. Color is reserved for data, metrics, and semantic meaning.
2. **Data is the Hero** — Numbers and metrics should be instantly scannable. Typography hierarchy is critical.
3. **Precision Over Decoration** — Sharp edges, clear hierarchy, no gratuitous ornamentation.
4. **Instant Feedback** — Every interaction responds immediately with spring physics and haptic-feel animations.
5. **Void-Deep Backgrounds** — Warm void (#08080A), not pure black. Glass morphism with subtle noise texture.

### Color System
| Purpose | Dark Mode | Light Mode |
|---------|-----------|------------|
| Background | `#0D0D0F` | `#FAFAFA` |
| Elevated | `#1A1A1D` | `#FFFFFF` |
| Primary Accent | Blade Green `#00E599` | — |
| Activity/Strain | `#FF7A4D` | `#FF6B35` |
| Recovery/Rest | `#5BA3EC` | `#4A90D9` |
| Port | `#EF4444` | — |
| Starboard | `#22C55E` | — |
| Coxswain | `#7C3AED` | — |

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headlines | Fraunces | 600 | 28-48px |
| UI Text | Inter | 400-600 | 14-16px |
| Metrics/Data | JetBrains Mono | 500-700 | 16-32px |

### Every Feature Should Ask:
- [ ] Does this feel like a precision instrument?
- [ ] Is color used meaningfully (not decoratively)?
- [ ] Are animations spring-based and responsive?
- [ ] Does it work beautifully in dark mode?
- [ ] Is the data immediately scannable?
- [ ] Would this fit on Raycast's or Linear's website?

---

## Scope Categories

| Category | Description |
|----------|-------------|
| **MIGRATE** | Existing V1 feature → V2 with same functionality |
| **IMPROVE** | Existing V1 feature → V2 with enhancements |
| **NEW** | Brand new feature not in V1 |
| **INTEGRATE** | External service integration |

---

## 1. V1 FEATURE MIGRATION (Must Have)

### 1.1 Core Lineup & Selection

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Lineup Builder** | IMPROVE | High | P0 | Kanban-style boat assignment with drag-drop, undo/redo, boat configs. V2 adds better mobile support and real-time collaboration indicators. |
| **Seat Racing** | MIGRATE | High | P0 | Session management, multi-boat piece entry, ELO rankings with confidence intervals. |
| **Smart Seat Racing Matrix** | NEW | Medium | P1 | AI-generated optimal switch sequence to minimize pieces while maximizing statistical confidence. |

### 1.2 Competition & Racing

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Regatta Management** | MIGRATE | High | P1 | Regatta CRUD, race entries, heat sheets. |
| **Race Results** | MIGRATE | Medium | P1 | Finish times, placements, margin calculations. |
| **Team Rankings** | MIGRATE | Medium | P1 | Inter-team speed estimates and rankings. |
| **Live Race Day View** | IMPROVE | High | P2 | Real-time race day dashboard with countdown timers, progression tracking, warm-up scheduling. |
| **Regatta Day Command Center** | NEW | High | P2 | Unified dashboard: trailer status, boat rigging, heat sheets, warm-up launch times. |

### 1.3 Training & Programming

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Training Plans** | MIGRATE | High | P1 | Periodized programs, calendar view, workout templates. |
| **Athlete Assignments** | MIGRATE | Medium | P1 | Assign plans to individuals or groups. |
| **Workout Completion** | MIGRATE | Medium | P1 | Track completion, compliance metrics. |
| **TSS/Load Tracking** | IMPROVE | Medium | P2 | Training load visualization with PMC chart (CTL/ATL/TSB). |

### 1.4 Performance Data

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Erg Data Page** | IMPROVE | Medium | P0 | Full test CRUD, trend charts, filtering. V2 adds better comparison tools. |
| **CSV Import** | MIGRATE | Medium | P1 | Bulk erg data import with field mapping. |
| **Concept2 Sync UI** | IMPROVE | Medium | P1 | Connection management, sync status, per-athlete controls. |
| **On-Water Sessions** | IMPROVE | High | P1 | GPS map visualization, piece detection, lineup overlay, coach notes. |

### 1.5 Team Management

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Athletes Page** | IMPROVE | Medium | P0 | Roster grid/list, search, filtering by side/weight/status. |
| **Bulk Import** | MIGRATE | Medium | P1 | CSV athlete import with field mapping. |
| **Communication/Announcements** | MIGRATE | Medium | P1 | Pinning, priority levels, audience targeting, read tracking. |
| **Settings Page** | MIGRATE | Medium | P1 | Profile, Team Management, Privacy tabs. |

### 1.6 Advanced Features

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Telemetry Import** | MIGRATE | High | P2 | Empower, Peach, NK SpeedCoach sensor data. |
| **Combined Scoring** | MIGRATE | High | P2 | Multi-metric rankings (erg + seat race + telemetry). |
| **AI Lineup Optimizer** | IMPROVE | High | P2 | GPT/Claude-powered lineup generation with constraints. V2 adds better explanation of recommendations. |

### 1.7 Specialized Views

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Coxswain View** | IMPROVE | High | P1 | Mobile-first, offline support, on-water data entry. V2 adds better piece detection. |
| **2D Boat View** | MIGRATE | Low | P2 | Static seat visualization. |
| **3D Boat Viewer** | MIGRATE | Medium | P3 | Three.js interactive visualization. |
| **PDF Export** | MIGRATE | Low | P2 | Lineup PDF generation. |

---

## 2. DESIGN SYSTEM POLISH (Should Have)

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Light Theme Fix** | FIX | Low | P1 | CSS variable cascade issue preventing light theme from rendering. |
| **Field Mode** | NEW | Medium | P1 | High-contrast outdoor theme for bright sunlight, larger touch targets. |
| **Component Library** | NEW | Medium | P2 | Storybook or similar for V2 design system documentation. |
| **Animation System** | IMPROVE | Medium | P2 | Consistent Framer Motion patterns, spring physics for interactions. |
| **Accessibility Audit** | NEW | Medium | P2 | WCAG 2.1 AA compliance, keyboard navigation, screen reader support. |

---

## 3. NEW FEATURES - AI & ANALYTICS (Nice to Have)

### 3.1 AI-Powered Features

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **AI Video Technique Overlay** | NEW | Very High | P3 | Computer vision pose estimation on rowing video, automatic catch/finish angle calculation. |
| **Coxswain Voice Analysis** | NEW | High | P3 | Audio transcription, call pattern analysis, correlation with boat speed data. |
| **Predictive 2k Calculator** | NEW | Medium | P2 | Estimate 2k potential from sub-maximal data (steady state, intervals, lifting). |
| **Rigging Recommendation Engine** | NEW | High | P3 | ML-based rigging suggestions from biometrics + telemetry. |
| **Natural Language Queries** | NEW | Medium | P3 | "Show me all athletes who improved their 2k this season" → instant answer. |

### 3.2 Advanced Analytics

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Boat Margin Visualizer** | NEW | Medium | P1 | Top-down PNG shell silhouettes showing margin between boats. Simplified hull graphics scaled to actual boat lengths (8+, 4+, 2x, 1x). Distance gap shown visually with bow ball positions. |
| **Conditions-Normalized Leaderboards** | NEW | Medium | P2 | Weather/current normalization for fair on-water time comparison. |
| **Interactive 3D Shell Replay** | NEW | High | P3 | Visualize boat pitch, roll, yaw from accelerometer data. |
| **Team Trend Reports** | NEW | Medium | P2 | Auto-generated weekly/monthly performance summaries. |
| **Injury Risk Prediction** | NEW | High | P3 | ML model to flag athletes at risk based on load, recovery, history. |

---

## 4. NEW FEATURES - INTEGRATIONS (Nice to Have)

### 4.1 Wearable Integrations

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Biometric Recovery Dashboard** | NEW | Medium | P2 | HRV, sleep, resting HR from Whoop/Garmin/Apple Health. Flag under-recovered athletes. |
| **Garmin Connect Integration** | INTEGRATE | Medium | P2 | OAuth sync for on-water GPS activities. |
| **Apple Health Integration** | INTEGRATE | Medium | P2 | iOS HealthKit for workout sync. |
| **Whoop Integration** | INTEGRATE | Medium | P2 | Recovery and strain scores. |

### 4.2 External Services

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **RowCast Weather** | INTEGRATE | Medium | P2 | AI weather forecasting with rowing-specific recommendations. |
| **RegattaCentral Scraper** | NEW | Medium | P3 | Auto-import race results from public sources. |
| **Calendar Sync** | NEW | Low | P2 | Export team schedule to Google Calendar / iCal. |

---

## 5. NEW FEATURES - TEAM OPERATIONS (Nice to Have)

### 5.1 Equipment & Logistics

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Equipment Check-In/Out** | NEW | Medium | P2 | QR code scanning, damage reports, usage tracking for maintenance scheduling. |
| **Gear & Uniform Management** | NEW | Low | P3 | Track unisuits, sizing, bulk ordering integration. |
| **Travel Planning** | NEW | Medium | P3 | Regatta trip logistics, trailer manifests, hotel rooming. |

### 5.2 Team Collaboration

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Ghost Boat AR** | NEW | Very High | P4 | Mobile AR overlay showing target pace boat during practice. |
| **Coxswain Load Balancing** | NEW | Low | P3 | Auto-scheduler for fair coxswain rotation across boats. |
| **Real-Time Collaboration** | IMPROVE | High | P2 | Socket.IO presence for lineup editing, live updates. |

### 5.3 Program Management

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Recruitment Intelligence** | NEW | High | P3 | Track recruits, scrape public erg scores, adjusted speed metrics. |
| **Alumni/Booster Portal** | NEW | Medium | P3 | Public feed for donors, micro-donation options. |
| **Multi-Team Support** | NEW | High | P4 | Support athletes/coaches on multiple teams (club + national). |

---

## 6. BILLING & MONETIZATION (Required for SaaS)

| Feature | Type | Complexity | Priority | Description |
|---------|------|------------|----------|-------------|
| **Stripe Billing UI** | IMPROVE | Medium | P1 | Plan selection, upgrade/downgrade, payment method management. |
| **Usage Limits Enforcement** | MIGRATE | Medium | P1 | Athlete/coach limits per plan tier. |
| **Trial Period Management** | MIGRATE | Low | P1 | Free trial flow, conversion prompts. |
| **Invoice History** | NEW | Low | P2 | Download past invoices. |

---

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | 4 | Critical for V2 to be useful (Lineup, Athletes, Erg Data, Seat Racing) |
| **P1** | 18 | Core features for complete product |
| **P2** | 20 | Important enhancements and new features |
| **P3** | 14 | Nice-to-have innovations |
| **P4** | 2 | Future vision (AR, multi-team) |

---

## Proposed Milestone Structure

### Milestone v2.0 — Core Migration (Est. 8-10 weeks)
Complete V1 → V2 feature parity for core workflows.

**Phases:**
- Phase 6: Athletes & Roster Management
- Phase 7: Erg Data & Performance Tracking
- Phase 8: Lineup Builder
- Phase 9: Seat Racing & Selection
- Phase 10: Settings & Billing

### Milestone v2.1 — Competition & Training (Est. 6-8 weeks)
Racing, training plans, and on-water features.

**Phases:**
- Phase 11: Racing & Regattas
- Phase 12: Training Plans & Programming
- Phase 13: On-Water Sessions & GPS
- Phase 14: Communication & Announcements

### Milestone v2.2 — Advanced Analytics (Est. 6-8 weeks)
AI features, telemetry, and advanced analytics.

**Phases:**
- Phase 15: Telemetry & Combined Scoring
- Phase 16: AI Lineup Optimizer (v2)
- Phase 17: Predictive Analytics
- Phase 18: Coxswain View (Mobile)

### Milestone v2.3 — Integrations & Polish (Est. 4-6 weeks)
External integrations and platform polish.

**Phases:**
- Phase 19: Wearable Integrations (Whoop/Garmin/Apple)
- Phase 20: Design System Polish (themes, accessibility)
- Phase 21: Equipment Management
- Phase 22: Weather & Calendar Integration

### Milestone v3.0 — Innovation (Future)
Cutting-edge features for competitive advantage.

**Features:**
- AI Video Technique Analysis
- Coxswain Voice Analysis
- Ghost Boat AR
- Recruitment Intelligence
- 3D Shell Replay

---

## Dependency Graph

```
v2.0 Core Migration
├── Athletes Page (foundation for all selection features)
│   ├── Lineup Builder (requires athletes)
│   │   ├── Seat Racing (requires lineups)
│   │   ├── AI Optimizer (requires lineups)
│   │   └── PDF Export (requires lineups)
│   └── Training Plans (requires athletes)
│       └── Workout Assignments
├── Erg Data Page
│   ├── Predictive 2k (requires erg history)
│   └── Combined Scoring (requires erg + seat race)
└── Settings/Billing (standalone)

v2.1 Competition & Training
├── Racing/Regattas (standalone)
│   └── Race Day Command Center
├── Training Plans (from v2.0)
│   └── TSS/PMC Charts
└── On-Water Sessions
    └── Conditions Normalization

v2.2 Advanced
├── Telemetry Import (standalone)
│   ├── Combined Scoring (requires telemetry)
│   └── Rigging Recommendations (requires telemetry)
├── AI Optimizer v2 (requires lineups + data)
└── Coxswain View (requires on-water sessions)

v2.3 Integrations
├── Wearables (standalone)
│   └── Recovery Dashboard
├── Weather (standalone)
│   └── RowCast Integration
└── Equipment Management (standalone)
```

---

## Success Metrics

### v2.0 Success Criteria
- [ ] All P0 features migrated and functional
- [ ] Zero V1-only features for core workflows
- [ ] <5% of users opting back to legacy mode
- [ ] All automated tests passing

### v2.1 Success Criteria
- [ ] Complete racing workflow in V2
- [ ] Training plan creation and assignment
- [ ] On-water session visualization with maps

### v2.2 Success Criteria
- [ ] Telemetry import working for Empower/Peach
- [ ] AI recommendations actionable and accurate
- [ ] Coxswain view functional offline

### v2.3 Success Criteria
- [ ] At least 2 wearable integrations live
- [ ] Field mode theme working
- [ ] WCAG 2.1 AA compliance achieved

---

## Estimated Timeline

| Milestone | Duration | End Date (Est.) |
|-----------|----------|-----------------|
| v2.0 Core Migration | 8-10 weeks | March 2026 |
| v2.1 Competition & Training | 6-8 weeks | May 2026 |
| v2.2 Advanced Analytics | 6-8 weeks | July 2026 |
| v2.3 Integrations & Polish | 4-6 weeks | August 2026 |
| v3.0 Innovation | TBD | 2027 |

**Total for full V2 platform: ~6-8 months**

---

*Created: 2026-01-24*
*This document serves as the master scope for all future milestone planning.*
