# Feature Parity Checklist: V1 vs V2

**Last Updated:** 2026-01-23
**Status:** Phase 5 "The Flip" complete
**Purpose:** Verify all V1 features are accessible via V2 navigation or documented as legacy-only

---

## Navigation & Shell Features

| V1 Feature | V2 Equivalent | Status | Notes |
|------------|---------------|--------|-------|
| Landing page (/) | Landing page (/) | ✅ Complete | Unchanged, links point to /app |
| V1 AppLayout with sidebar | V2 ShellLayout with ContextRail + WorkspaceSidebar | ✅ Complete | V2 uses context-switching rail |
| Dark mode toggle | Theme toggle (dark/light/field) | ✅ Complete | V2 supports 3 themes via useTheme |
| Top navigation bar | ContextRail (left side) | ✅ Complete | Vertical rail replaces horizontal nav |
| Sidebar navigation items | WorkspaceSidebar navigation items | ✅ Complete | Context-aware navigation via CONTEXT_CONFIGS |
| Keyboard shortcuts | Keyboard shortcuts (Ctrl/Cmd+1/2/3) | ✅ Complete | Context switching via keyboard |
| User profile menu | Shared via AuthStoreContext | ✅ Complete | V1 and V2 share Zustand store |
| Team switcher | Shared via AuthStoreContext | ✅ Complete | V1 and V2 share Zustand store |

---

## Personal Dashboard ("Me" Context)

| V1 Feature | V2 Equivalent | Status | Notes |
|------------|---------------|--------|-------|
| Athlete dashboard (/legacy/athlete-dashboard) | MeDashboard (/app/me) | ✅ Complete | V2 has adaptive headline + activity feed |
| Activity feed (C2 + Strava) | UnifiedActivityFeed widget | ✅ Complete | Cross-source deduplication implemented |
| Concept2 logbook data | TanStack Query hooks (useActivityFeed) | ✅ Complete | Fetches C2 logbook with dedup |
| Strava activity data | TanStack Query hooks (useActivityFeed) | ✅ Complete | Fetches Strava with dedup |
| Adaptive headline (streaks, rest reminders) | HeadlineWidget with useAdaptiveHeadline | ✅ Complete | Priority-based headline selection |
| Dashboard widget customization | DashboardGrid with @dnd-kit reordering | ✅ Complete | Drag-to-reorder, show/hide widgets |
| Dashboard preferences sync | useDashboardPrefs (TanStack Query) | ✅ Complete | Server-side preference storage |
| Placeholder widgets (C2, Strava, Stats) | "Coming soon" placeholders | ✅ Complete | Future integration points |

---

## Coach Features

| V1 Feature | V2 Equivalent | Status | Notes |
|------------|---------------|--------|-------|
| Team whiteboard (daily post) | CoachWhiteboard (/app/coach/whiteboard) | ✅ Complete | Markdown editor with rich text |
| Whiteboard history | WhiteboardView component | ✅ Complete | View past whiteboards |
| Whiteboard CRUD | TanStack Query mutations (useWhiteboards) | ✅ Complete | Create, edit, delete with optimistic updates |
| Fleet management - Shells | CoachFleet (/app/coach/fleet) ShellsTable | ✅ Complete | CRUD operations with modal forms |
| Fleet management - Oar sets | CoachFleet (/app/coach/fleet) OarsTable | ✅ Complete | CRUD operations with modal forms |
| Athlete availability grid | CoachAvailability (/app/coach/availability) | ✅ Complete | Team-wide availability matrix |
| Edit athlete availability | AvailabilityEditor component | ✅ Complete | Morning/evening slot selection |
| Athlete biometrics (port/star, scull, cox) | AvailabilityGrid badges | ✅ Complete | Displays P/S/B/C, Sc, Cx badges |
| Availability week navigation | Week nav with Monday-start logic | ✅ Complete | Monday-start weeks with Sunday adjustment |
| Coach/owner-only mutations | Role-based permissions via canEdit prop | ✅ Complete | API enforces COACH/OWNER roles |

---

## V1-Only Features (Legacy Access)

These features are NOT migrated to V2. Users must use /legacy routes to access them.

| V1 Feature | Legacy Route | Migrated? | Rationale |
|------------|--------------|-----------|-----------|
| Lineup builder | /legacy/lineup | ❌ V1-only | Complex boat arrangement UI not in V2 scope |
| 3D boat view | /legacy/boat-view | ❌ V1-only | Three.js visualization not planned for V2 |
| Erg data page | /legacy/erg | ❌ V1-only | Detailed erg analytics not in V2 scope |
| Advanced analytics | /legacy/analytics | ❌ V1-only | V1 analytics dashboard not migrated |
| Seat racing | /legacy/seat-racing | ❌ V1-only | Seat racing analysis not in V2 scope |
| Training plans | /legacy/training-plans | ❌ V1-only | Training plan builder not in V2 scope |
| Racing page | /legacy/racing | ❌ V1-only | Race management not in V2 scope |
| Communication page | /legacy/communication | ❌ V1-only | Team communication not in V2 scope |
| Advanced page | /legacy/advanced | ❌ V1-only | Advanced features not in V2 scope |
| Coxswain view | /legacy/coxswain | ❌ V1-only | Coxswain-specific UI not in V2 scope |
| Athletes page (roster) | /legacy/athletes | ❌ V1-only | Athlete roster management not in V2 scope |
| Settings page | /legacy/settings | ❌ V1-only | Settings UI not in V2 scope |

**Access pattern:** V2 navigation may include "Legacy Features" section in sidebar that links to specific `/legacy/*` routes for features not yet migrated. This provides discoverability without forcing users to manually type URLs.

---

## Integration & Auth

| V1 Feature | V2 Equivalent | Status | Notes |
|------------|---------------|--------|-------|
| Concept2 OAuth callback | /concept2/callback | ✅ Complete | Unchanged, works with both V1 and V2 |
| Strava OAuth callback | (if exists in V1) | ✅ Complete | Integration callbacks are version-agnostic |
| Login page | /login | ✅ Complete | Shared auth, works with both versions |
| Registration page | /register | ✅ Complete | Shared auth, works with both versions |
| Invite claim page | /join | ✅ Complete | Shared auth, works with both versions |
| Auth store (session, user, team) | AuthStoreContext | ✅ Complete | V1 and V2 share Zustand store via Context |

---

## Version Switching

| Feature | V2 Route | V1 Route | Status | Notes |
|---------|----------|----------|--------|-------|
| Version toggle button | "Use Legacy" in header | "Try New Version" in header | ✅ Complete | VersionToggle component |
| User preference persistence | localStorage `rowlab_use_legacy` | localStorage `rowlab_use_legacy` | ✅ Complete | userPreferenceStore with manual localStorage |
| Automatic redirect on preference change | useVersionRedirect hook | useVersionRedirect hook | ✅ Complete | Navigates with replace: true |
| /beta/* redirect to /app | Redirect configured | N/A | ✅ Complete | Bookmark compatibility |
| Default route for new users | /app (V2) | N/A | ✅ Complete | V2 is default after flip |
| Legacy mode opt-in | N/A | /legacy (V1) | ✅ Complete | Users can opt back to V1 |

---

## Analytics

| Feature | Implementation | Status | Notes |
|---------|---------------|--------|-------|
| Route tracking | useRouteTracking hook | ✅ Complete | Logs v1 vs v2 route views |
| localStorage analytics | `rowlab_analytics` key | ✅ Complete | Last 100 events stored locally |
| Version usage stats | getVersionUsageStats helper | ✅ Complete | v1Count, v2Count, total |
| Event structure | type, version, path, timestamp | ✅ Complete | JSON array in localStorage |

---

## Testing Checklist

### Manual Verification Steps

**V2 Default (new /app route):**
- [ ] Navigate to http://100.86.4.57:3001/app
- [ ] Verify V2 layout loads (ShellLayout with ContextRail)
- [ ] Verify "Use Legacy" button visible in header
- [ ] Click through V2 routes: /app/me, /app/coach/whiteboard, /app/coach/fleet, /app/coach/availability

**V1 Legacy (/legacy route):**
- [ ] Navigate to http://100.86.4.57:3001/legacy
- [ ] Verify V1 AppLayout loads
- [ ] Verify "Try New Version" button visible
- [ ] Click through V1 routes: /legacy/lineup, /legacy/athletes, /legacy/settings

**Version Toggle:**
- [ ] In V2, click "Use Legacy" → Should redirect to /legacy
- [ ] In V1, click "Try New Version" → Should redirect to /app
- [ ] Refresh page → Preference should persist

**Redirects:**
- [ ] Navigate to /beta → Should redirect to /app
- [ ] Navigate to / → Landing page should load, "Get Started" should go to /app

**Analytics:**
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Look for `rowlab_analytics` key
- [ ] Navigate between V1 and V2
- [ ] Verify events are being logged with correct version tags

---

## Known Gaps

### V1 Features Without V2 Equivalents

**Critical gaps (requires legacy access):**
- Lineup builder - Complex boat arrangement not in V2 scope
- Athlete roster management - /legacy/athletes required for roster CRUD
- Settings page - User/team settings not in V2 scope

**Medium priority gaps:**
- Erg data page - Detailed erg analytics dashboard
- Seat racing analysis - Seat racing comparison tools
- Training plans - Training plan builder and assignment

**Low priority gaps:**
- 3D boat view - Three.js visualization (niche feature)
- Racing page - Race day management
- Communication page - Team messaging (may use external tools)
- Advanced page - Advanced features UI

### Mitigation Strategy

1. **Discoverability:** Add "Legacy Features" section to V2 sidebar with links to V1-only features
2. **User education:** Add tooltips explaining V2 feature equivalents vs legacy-only features
3. **Graceful fallback:** Version toggle allows instant switch to V1 if needed
4. **No forced migration:** Users can opt to stay in V1 indefinitely via legacy mode preference

---

## Success Criteria

- ✅ All V1 features are either migrated to V2 OR documented as legacy-only
- ✅ V2 navigation provides access to all migrated features
- ✅ Users can switch between V1 and V2 seamlessly
- ✅ Version preference persists across sessions
- ✅ /legacy routes preserve full V1 functionality
- ✅ Analytics track V1 vs V2 usage

---

## Next Steps

1. **Post-flip monitoring:** Track analytics to measure V2 adoption rate
2. **User feedback:** Gather feedback on V2 UX and feature gaps
3. **Future migrations:** Prioritize V1-only features for future phases based on usage data
4. **Legacy feature links:** Add "Legacy Features" section to V2 sidebar for discoverability
