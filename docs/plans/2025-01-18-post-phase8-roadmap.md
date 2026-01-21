# Post-Phase 8 Roadmap: Testing, Styling & Feature Enhancements

## Overview
After Phase 8 (Scale) completion, this roadmap covers quality assurance, design polish, and additional features to make RowLab production-ready.

---

## Phase 9: Testing & Quality Assurance

### 9.1 Unit Testing Setup
**Priority: HIGH**

#### Backend Unit Tests
- **Framework**: Vitest or Jest with @prisma/client mocking
- **Coverage Target**: 80%+ for services

| Service | Test File | Key Tests |
|---------|-----------|-----------|
| athleteService | `server/__tests__/services/athleteService.test.js` | CRUD, validation, team isolation |
| lineupService | `server/__tests__/services/lineupService.test.js` | Creation, seat assignments, validation |
| seatRaceService | `server/__tests__/services/seatRaceService.test.js` | Elo calculations, piece analysis |
| regattaService | `server/__tests__/services/regattaService.test.js` | Race results, speed normalization |
| announcementService | `server/__tests__/services/announcementService.test.js` | CRUD, read tracking, visibility |
| telemetryService | `server/__tests__/services/telemetryService.test.js` | CSV parsing, batch import |
| combinedScoringService | `server/__tests__/services/combinedScoringService.test.js` | Score calculations, weighting |
| aiLineupOptimizerService | `server/__tests__/services/aiLineupOptimizer.test.js` | Genetic algorithm, constraints |

#### Frontend Unit Tests
- **Framework**: Vitest + React Testing Library
- **Coverage Target**: 70%+ for components

| Component Category | Focus Areas |
|-------------------|-------------|
| Form components | Validation, submission, error states |
| Data display | Rendering, empty states, loading |
| Modals | Open/close, form integration |
| Stores | Actions, state mutations |

### 9.2 Integration Testing
**Priority: HIGH**

#### API Integration Tests
- **Framework**: Supertest + Vitest
- **Database**: Test database with fixtures

```javascript
// Example structure
describe('POST /api/v1/lineups', () => {
  it('creates lineup with valid data', async () => {});
  it('rejects unauthorized users', async () => {});
  it('validates seat assignments', async () => {});
  it('enforces team isolation', async () => {});
});
```

| Route Category | Test File | Scenarios |
|---------------|-----------|-----------|
| Auth routes | `auth.integration.test.js` | Login, register, refresh, logout |
| Athlete routes | `athletes.integration.test.js` | CRUD, bulk import, filters |
| Lineup routes | `lineups.integration.test.js` | Creation, assignments, validation |
| Seat race routes | `seatRaces.integration.test.js` | Sessions, pieces, Elo updates |
| Regatta routes | `regattas.integration.test.js` | Races, results, rankings |
| Announcement routes | `announcements.integration.test.js` | CRUD, read tracking |
| AI routes | `aiLineup.integration.test.js` | Optimization, predictions |

### 9.3 End-to-End Testing
**Priority: MEDIUM**

#### Framework: Playwright
- Browser testing: Chrome, Firefox, Safari
- Mobile viewport testing

| User Flow | Test File | Steps |
|-----------|-----------|-------|
| Onboarding | `onboarding.e2e.ts` | Register → Create team → Add athletes |
| Lineup creation | `lineup.e2e.ts` | Select shell → Assign seats → Save |
| Seat racing | `seatRacing.e2e.ts` | Create session → Add pieces → View results |
| Erg data import | `ergData.e2e.ts` | Upload CSV → Map columns → Verify |
| AI optimizer | `aiOptimizer.e2e.ts` | Set constraints → Generate → Apply |

### 9.4 Performance Testing
**Priority: MEDIUM**

- **Tool**: k6 or Artillery
- **Scenarios**:
  - 100 concurrent users loading dashboard
  - 50 concurrent lineup saves
  - AI optimizer under load
  - Large CSV imports (1000+ rows)

### 9.5 Test Infrastructure
- [ ] Test database seeding scripts
- [ ] CI pipeline integration (GitHub Actions)
- [ ] Coverage reporting (Codecov)
- [ ] Pre-commit hooks for tests

---

## Phase 10: Design System & Styling

### 10.1 Design Token System
**Priority: HIGH**

#### Create Design Tokens File
**File**: `src/styles/tokens.css` or Tailwind config

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary palette
        'brand-primary': '#2563eb',
        'brand-secondary': '#1e40af',
        'brand-accent': '#f59e0b',

        // Semantic colors
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',

        // Rowing-specific
        'port': '#dc2626',      // Red for port side
        'starboard': '#16a34a', // Green for starboard
        'cox': '#7c3aed',       // Purple for coxswain

        // Score colors
        'score-excellent': '#10b981',  // 80+
        'score-good': '#f59e0b',       // 60-79
        'score-average': '#ef4444',    // <60
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'sidebar': '280px',
        'header': '64px',
      },
    },
  },
};
```

### 10.2 Component Library Polish
**Priority: HIGH**

| Component | Improvements |
|-----------|-------------|
| Button | Consistent sizing (sm/md/lg), loading states, icon support |
| Input | Error states, helper text, character counts |
| Select | Search/filter, multi-select, async loading |
| Card | Hover effects, clickable variants, loading skeletons |
| Table | Sorting indicators, row selection, pagination |
| Modal | Sizes (sm/md/lg/full), animations, backdrop blur |
| Badge | More variants, dot indicators, removable |
| Toast | Stacking, progress bars, actions |
| Tabs | Vertical option, icons, badges |
| Avatar | Sizes, groups, status indicators |

### 10.3 Animation & Micro-interactions
**Priority: MEDIUM**

```javascript
// Framer Motion presets
export const animations = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  scaleIn: { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  stagger: { transition: { staggerChildren: 0.05 } },
};
```

| Area | Animation |
|------|-----------|
| Page transitions | Fade + slight slide |
| Modal open/close | Scale + fade |
| Dropdown menus | Slide down + fade |
| List items | Staggered fade |
| Loading states | Pulse/skeleton |
| Success actions | Checkmark animation |
| Drag & drop | Smooth reorder |
| Score changes | Number counting |

### 10.4 Responsive Design Audit
**Priority: HIGH**

| Breakpoint | Target | Components to Review |
|------------|--------|---------------------|
| Mobile (< 640px) | Phone portrait | Sidebar collapse, tables → cards, touch targets |
| Tablet (640-1024px) | iPad | Two-column layouts, drawer nav |
| Desktop (> 1024px) | Full experience | Multi-column, sidebars visible |

### 10.5 Dark Mode Enhancement
**Priority: MEDIUM**

- [ ] Audit all components for dark mode
- [ ] Fix contrast issues
- [ ] Add dark mode toggle persistence
- [ ] System preference detection
- [ ] Smooth transition between modes

### 10.6 Accessibility (a11y)
**Priority: HIGH**

- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation for all features
- [ ] Focus indicators (visible, consistent)
- [ ] Screen reader testing (NVDA, VoiceOver)
- [ ] Color contrast (WCAG AA minimum)
- [ ] Reduced motion support
- [ ] Form error announcements

---

## Phase 11: Communication Enhancements

### 11.1 Email Notifications
**Priority: HIGH**

#### Infrastructure
- **Provider**: SendGrid, Resend, or AWS SES
- **Templates**: React Email or MJML

| Email Type | Trigger | Content |
|------------|---------|---------|
| Welcome | User registration | Getting started guide |
| Team invite | Invite created | Join link, team info |
| Announcement | New urgent/important | Title, preview, link |
| Lineup published | Coach publishes | Lineup details, your seat |
| Erg reminder | Weekly | Outstanding tests |
| Weekly digest | Sunday | Team activity summary |

#### Implementation Tasks
- [ ] Email service setup (server/services/emailService.js)
- [ ] Template system (server/email-templates/)
- [ ] User notification preferences (schema + UI)
- [ ] Unsubscribe handling
- [ ] Email queue (Bull)

### 11.2 Push Notifications
**Priority: MEDIUM**

- **Web**: Service workers + Web Push API
- **Mobile**: Firebase Cloud Messaging (FCM) / APNs

| Notification | Channel | Priority |
|--------------|---------|----------|
| Urgent announcement | Push + Email | High |
| Lineup published | Push | Medium |
| Practice reminder | Push | Low |
| Message received | Push | Medium |

### 11.3 In-App Notifications
**Priority: HIGH**

- [ ] Notification center (bell icon dropdown)
- [ ] Unread count badge
- [ ] Mark as read/unread
- [ ] Notification preferences
- [ ] Real-time updates (WebSocket/SSE)

### 11.4 Direct Messaging (Future)
**Priority: LOW**

- WebSocket infrastructure
- 1:1 and group chats
- File/image sharing
- Message search

---

## Phase 12: Data & Analytics

### 12.1 Dashboard Enhancements
**Priority: HIGH**

| Widget | Description |
|--------|-------------|
| Team Overview | Active athletes, recent activity |
| Erg Leaderboard | Top performers by test type |
| Lineup Status | Draft vs published lineups |
| Upcoming Events | Regattas, practices |
| Score Trends | Combined score over time |
| Quick Actions | Common tasks |

### 12.2 Advanced Analytics
**Priority: MEDIUM**

- [ ] Athlete progress tracking (erg splits over time)
- [ ] Seat race performance trends
- [ ] Team comparison vs external teams
- [ ] Regatta performance analysis
- [ ] Predictive insights ("Based on trends, athlete X...")

### 12.3 Data Export
**Priority: MEDIUM**

| Export Type | Format | Data |
|-------------|--------|------|
| Athlete roster | CSV, PDF | Names, erg PRs, ratings |
| Lineup | PDF | Boat diagram, seat assignments |
| Erg tests | CSV | All test data |
| Season report | PDF | Comprehensive season summary |

### 12.4 Data Import Improvements
**Priority: MEDIUM**

- [ ] Drag-and-drop CSV upload
- [ ] Column auto-detection
- [ ] Data validation preview
- [ ] Duplicate detection
- [ ] Import history/undo

---

## Phase 13: Infrastructure & DevOps

### 13.1 Monitoring & Observability
**Priority: HIGH**

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking |
| Prometheus + Grafana | Metrics |
| Structured logging | Pino/Winston with correlation IDs |
| Health checks | /health, /ready endpoints |

### 13.2 Performance Optimization
**Priority: HIGH**

| Area | Optimization |
|------|-------------|
| Database | Query optimization, indexes, connection pooling |
| Caching | Redis for sessions, API responses |
| Frontend | Code splitting (done), lazy loading, image optimization |
| API | Response compression, pagination, field selection |

### 13.3 Security Hardening
**Priority: HIGH**

- [ ] Security headers audit (Helmet.js)
- [ ] Rate limiting per endpoint
- [ ] Input sanitization
- [ ] SQL injection prevention (Prisma handles)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] Secrets management

### 13.4 CI/CD Pipeline
**Priority: HIGH**

```yaml
# GitHub Actions workflow
jobs:
  test:
    - Lint (ESLint)
    - Type check (if TypeScript)
    - Unit tests
    - Integration tests
    - Coverage report

  build:
    - Build frontend
    - Build Docker image

  deploy:
    - Deploy to staging (on PR)
    - Deploy to production (on main)
```

### 13.5 Database Management
**Priority: MEDIUM**

- [ ] Automated backups
- [ ] Point-in-time recovery
- [ ] Migration rollback procedures
- [ ] Data archival strategy
- [ ] GDPR compliance (data deletion)

---

## Phase 14: Mobile App (Extended)

### 14.1 React Native App
**Priority: MEDIUM**

| Screen | Features |
|--------|----------|
| Login | Email/password, biometric |
| Dashboard | Team overview, quick actions |
| Athletes | List, search, profile |
| Lineups | View, (coach) edit |
| Erg Data | View results, log workout |
| Announcements | Feed, mark read |
| Profile | Settings, notifications |

### 14.2 PM5 Bluetooth Integration
**Priority: HIGH (for mobile)**

- CoreBluetooth (iOS) / Android BLE
- Real-time metrics display
- Automatic workout logging
- Multi-erg support (team workout)

### 14.3 Offline Support
**Priority: MEDIUM**

- Local database (SQLite/Realm)
- Sync queue for offline actions
- Conflict resolution
- Offline indicator UI

---

## Phase 15: Advanced Features (Future)

### 15.1 Video Analysis
- Frame-by-frame stroke analysis
- Side-by-side comparison
- AI stroke detection
- Annotation tools

### 15.2 Wearable Integration
- Garmin Connect API
- Apple HealthKit
- Heart rate zones
- Training load tracking

### 15.3 GPS Boat Tracking
- On-water route recording
- Speed/stroke rate mapping
- Water conditions overlay
- Practice analysis

### 15.4 Team Collaboration
- Shared calendars
- Practice planning
- Resource booking (boats, ergs)
- Parent/supporter portal

---

## Implementation Priority Matrix

| Priority | Phases | Timeline |
|----------|--------|----------|
| **Critical** | 9 (Testing), 10.1-10.2 (Design), 13.1-13.3 (Infra) | Immediate |
| **High** | 10.3-10.6 (Design), 11.1-11.3 (Comms), 12.1 (Dashboard) | Next sprint |
| **Medium** | 12.2-12.4 (Analytics), 13.4-13.5 (DevOps), 14.1-14.2 (Mobile) | Following sprints |
| **Low** | 11.4 (DM), 14.3 (Offline), 15.x (Future) | Backlog |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Test coverage (backend) | > 80% |
| Test coverage (frontend) | > 70% |
| Lighthouse performance | > 90 |
| Lighthouse accessibility | > 95 |
| API response time (p95) | < 200ms |
| Error rate | < 0.1% |
| Uptime | > 99.9% |

---

## Notes

- Prioritize testing and security before adding new features
- Design system should be extracted to shared package if building mobile app
- Consider feature flags for gradual rollouts
- Document all APIs with OpenAPI/Swagger
