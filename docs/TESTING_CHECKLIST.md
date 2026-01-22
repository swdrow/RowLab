# RowLab Testing Checklist & Feature Inventory

## 1. Feature Inventory

### Core Platform
- **Authentication**: Email/Password login, Admin access, Token refresh, Multi-tenant Team isolation.
- **Team Management**: Create team, Edit settings, Invite codes, Visibility (public/private), Role management (Owner, Coach, Athlete).
- **Billing**: Subscription tiers (Free, Pro), Stripe integration.
- **User Settings**: Profile management, Notification preferences (Email/Push), Dark mode.

### Roster & Athletes
- **Roster Management**: Add/Edit/Remove athletes, Bulk management.
- **Profiles**: Physical stats (Height, Weight), Side preference (Port/Starboard/Cox), Profile photos.
- **Invitations**: Email invites, Claim profile flow (connecting a managed profile to a user account).
- **History**: Tracking athlete metrics over time.

### Ergometer Data (ErgDataPage)
- **Workout Management**: Manual entry form, Import (CSV/FIT), Concept2 Sync.
- **Analysis**: Split analysis, Power curves, Personal Bests (PBs), Stroke rate analysis.
- **Testing**: Standardized tests (2k, 6k, 30min, 500m) with ranking.
- **Live Data**: Real-time monitoring via "Coxswain View" (WebSocket telemetry).

### Fleet & Lineups
- **Shell Management**: Boat inventory (Shells), Boat Configs (Seat definitions).
- **Lineups**: Drag-and-drop builder, AI-assisted lineup recommendations.
- **Visualizer**: 3D Boat View (Three.js integration), Seat constraints verification.
- **Racing**: Seat assignments for specific regattas.

### Training & Planning
- **Training Plans**: Periodized schedules (Base, Build, Peak, Taper).
- **Assignments**: Assign workouts to specific athletes, groups, or the whole team.
- **Calendar**: Interactive calendar view, Event management (Practice, Regatta, Test).
- **Compliance**: Tracking workout completion against assignments.

### Racing & Selection
- **Regattas**: Event management, Race scheduling, Location details.
- **Results**: Time entry, Placing, Margins, Speed analysis (% of Gold Standard, Prognostic speeds).
- **Seat Racing**: Session management, Matrix/Switch racing, Elo scoring system, Combined scoring.

### Communication
- **Announcements**: Team news feed, Read receipts, Priority levels (Normal/Urgent/Pinned).

### Integrations
- **Concept2 Logbook**: OAuth connection, Workout sync (Manual & Auto), Webhook handling.
- **Strava**: OAuth connection, Activity sync (Inbound), C2-to-Strava forwarding (Outbound).

---

## 2. Manual Testing Checklist

### Authentication & Setup
- [ ] **Sign Up (New Coach)**: Create account -> Create Team -> Verify "Owner" role.
- [ ] **Sign Up (Athlete)**: Create account -> Join via Invite Code -> Verify "Athlete" role.
- [ ] **Login**: Valid credentials -> Dashboard access.
- [ ] **Logout**: Session cleared -> Redirect to Landing.
- [ ] **Token Refresh**: Wait for access token expiry -> Verify session continues without logout.

### Roster Management
- [ ] **Add Athlete (Manual)**: Coach adds "John Doe" -> Appears in list -> Status "Managed".
- [ ] **Edit Athlete**: Change weight/side -> Save -> Updates reflected.
- [ ] **Invite Athlete**: Send email invite -> Athlete clicks link -> Claims profile -> Status "Active".
- [ ] **Delete Athlete**: Remove athlete -> Verify soft delete (or permanent warning).

### Erg Data & Workouts
- [ ] **Manual Entry**: Form input (Date, Dist, Time, Type) -> Save -> Appears in Log.
- [ ] **Import CSV**: Upload Concept2 CSV export -> Parsed correctly -> Workouts created.
- [ ] **Import FIT**: Upload Garmin .FIT file -> Parsed correctly -> Workout created.
- [ ] **View Detail**: Click workout -> Charts render (Splits/Watts) -> No JS errors.
- [ ] **Personal Best**: Log a faster 2k -> "PB" badge appears on dashboard.
- [ ] **Delete Workout**: Remove workout -> Recalculates stats/PBs if necessary.

### Fleet & Lineups
- [ ] **Create Shell**: Add "Empacher 8+" -> Appears in fleet.
- [ ] **Build Lineup**: Drag 8 athletes to boat -> Save -> Lineup persists.
- [ ] **Constraint Check**: Try putting Port rower in Starboard seat -> Verify warning/visual indicator.
- [ ] **AI Suggestion**: Click "Auto-Fill" -> Seats filled based on ranking/side -> Verify logic.
- [ ] **3D View**: Open Boat3DPage -> Boat renders -> Interaction works.

### Training Plans
- [ ] **Create Plan**: "Winter Training" -> Add 4 weeks -> Save.
- [ ] **Add Planned Workout**: "Steady State" on Tuesday -> Visible on Calendar.
- [ ] **Assign Plan**: Assign to "Varsity Men" -> Athletes see workouts on their dashboard.
- [ ] **Mark Complete (Athlete)**: Athlete checks box -> Coach sees green status/compliance score.
- [ ] **Use Periodization Template**: Select "Base Building" template -> Plan populated with phases.

### Racing & Results
- [ ] **Create Regatta**: "Head of the Charles" -> Add Date -> Save.
- [ ] **Add Race**: "Men's Club 8+" -> Scheduled time.
- [ ] **Enter Result**: Input finish time -> System calculates split & % of Gold Standard.
- [ ] **Prognostic**: Input wind/temp conditions -> Verify adjusted speed calculation.

### Seat Racing
- [ ] **Create Session**: New Seat Race -> 4x 1000m.
- [ ] **Record Piece**: Enter finish times for Boat A & B.
- [ ] **Swap**: Switch pair (Starboards) -> Record next piece.
- [ ] **Result**: View Matrix -> Verify delta calculations and winner determination.

### Communication
- [ ] **Post Announcement**: "Practice Cancelled" (Urgent) -> Post.
- [ ] **View (Athlete)**: Athlete sees banner on dashboard.
- [ ] **Read Receipt**: Athlete opens -> Coach sees "1/20 Read" increment.

---

## 3. Integration Test Scenarios

### Concept2 Logbook
- [ ] **Connect**: Settings -> Integrations -> Connect Concept2 -> OAuth Popup -> Login -> Success.
- [ ] **Sync History**: Click "Sync Now" -> Recent workouts appear in RowLab Erg Data.
- [ ] **Auto-Sync**: Enable "Background Sync" -> Wait for cron job -> New workouts appear automatically.
- [ ] **Disconnect**: Settings -> Disconnect -> Token removed -> Status changes to "Not Connected".
- [ ] **Re-auth Flow**: Token expires -> Trigger sync -> Should prompt re-authorization gracefully.

### Strava
- [ ] **Connect**: Settings -> Integrations -> Connect Strava -> OAuth Popup -> Authorize -> Success.
- [ ] **C2 to Strava**: Enable "Post C2 workouts to Strava" -> Sync a C2 workout -> Verify it appears on Strava.
- [ ] **Disconnect**: Settings -> Disconnect -> Token removed -> Status changes.

### Live Telemetry (Coxswain View)
- [ ] **Connect PM5**: Open Coxswain View -> Start Bluetooth scan -> Connect to erg.
- [ ] **Real-time Data**: Start rowing -> Verify split, stroke rate, distance update live.
- [ ] **Multiple Ergs**: Connect 2+ ergs -> Verify all display simultaneously.
- [ ] **Disconnect**: Stop workout -> Verify graceful disconnection.

---

## 4. Multi-User Testing Strategies (Solo Developer)

To simulate Coach/Athlete interactions without beta testers:

### Browser Isolation Method
1. **Main Browser (Chrome)**: Logged in as **Coach (Owner)**
2. **Incognito Window**: Logged in as **Athlete A**
3. **Firefox/Safari**: Logged in as **Athlete B** or **Assistant Coach**

### Test Account Setup
Create these test accounts in your database:
```
coach@test.com     - Team Owner
assistant@test.com - Coach role
athlete1@test.com  - Athlete role
athlete2@test.com  - Athlete role
```

### Role-Based Testing Scenarios

| Scenario | Coach Window | Athlete Window | Expected |
|----------|-------------|----------------|----------|
| Post Announcement | Create "Practice at 6am" | Refresh dashboard | Announcement visible |
| Assign Workout | Assign 5k to Athlete1 | Check Training Plans | Workout appears |
| View Roster | See all athletes | N/A | Full roster visible |
| Athlete-only View | N/A | Check AthleteDashboard | Only own data visible |
| Mark Complete | N/A | Complete assigned workout | Coach sees completion |

### Real-Time Testing
- Open WebSocket connections in both windows
- Post announcement as Coach -> Verify instant update for Athlete
- Use Coxswain View while Athlete simulates workout

---

## 5. Potential Failure Points & Edge Cases

### Data Integrity
- [ ] Delete Team with active subscription -> Should warn/prevent
- [ ] Delete Athlete in active Lineup -> Should warn or cascade remove
- [ ] Change Athlete side (Port→Starboard) while in lineup -> Should revalidate
- [ ] Duplicate athlete email addresses -> Should reject

### Integration Errors
- [ ] **Expired Token**: Manually set token expiry in DB -> Trigger sync -> Expect re-auth flow
- [ ] **Revoked Access**: Revoke from C2/Strava website -> Trigger sync -> Handle 401 gracefully
- [ ] **Duplicate Sync**: Click "Sync" rapidly multiple times -> No duplicate workouts
- [ ] **Network Timeout**: Simulate slow network -> Proper loading states and error messages

### Performance Edge Cases
- [ ] **Large Team**: 100+ athletes -> Dashboard loads in <3s
- [ ] **History Depth**: 1000+ workouts per athlete -> Erg page loads reasonably
- [ ] **Calendar Density**: 365 days with daily events -> Calendar renders smoothly
- [ ] **Concurrent Users**: Multiple browser tabs -> No state conflicts

### UI/UX Edge Cases
- [ ] **Mobile Responsive**: All pages work on 375px width
- [ ] **Empty States**: New team with no data -> Helpful empty state messages
- [ ] **Long Names**: "Christopher Wellington-Harrington III" -> Text truncates properly
- [ ] **Timezone Handling**: Different timezone than server -> Dates display correctly

---

## 6. Testing Priority Order

### Critical (Test First)
1. Authentication & Login
2. Team Creation & Role Assignment
3. Concept2 Integration (core value prop)
4. Erg Workout Display

### High Priority
5. Athlete Management
6. Strava Integration
7. Training Plans & Assignments
8. Dashboard Data Display

### Medium Priority
9. Announcements
10. Racing & Results
11. Seat Racing
12. Analytics Charts

### Lower Priority
13. 3D Boat View
14. AI Lineup Suggestions
15. Billing/Subscription
16. Advanced Settings

---

## 7. Bug Report Template

When you find an issue, document it:

```markdown
### Bug: [Short Description]

**Page/Feature**:
**Steps to Reproduce**:
1.
2.
3.

**Expected**:
**Actual**:
**Browser/Device**:
**Console Errors**:
**Screenshots**:
```
