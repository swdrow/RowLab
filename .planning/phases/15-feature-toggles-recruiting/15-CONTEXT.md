# Phase 15: Feature Toggles & Recruiting

## Phase Goal

Implement progressive unlock system for advanced features and basic recruit visit management functionality.

## Background

From the approved design document (2026-01-26-phase14-improvements-design.md):
- RowLab should work for all levels (Club, High School, Collegiate, Elite)
- Advanced features should be toggleable in settings
- Recruiting is a common need for collegiate programs

## Requirements

### TOGGLE-01: Progressive Unlock System
- Feature toggle UI in team settings
- Toggle groups: Basic (always on) vs Advanced (opt-in)
- Per-feature toggles within advanced groups
- UI hides/shows features based on toggles
- Persist toggle state per team

### TOGGLE-02: Feature Groups
**Core Features (Always On):**
- Roster & Attendance
- Lineup Builder
- Erg Data Tracking
- Training Calendar
- Basic Seat Racing

**Advanced Features (Toggle On):**
- Matrix Seat Racing & Bradley-Terry Rankings
- Periodization Blocks & TSS Tracking
- NCAA Compliance Tracking
- Racing & Regatta Management
- Recruiting & Visit Management

### RECRUIT-01: Recruit Visit Calendar Event
- New calendar event type: "Recruit Visit"
- Fields: Recruit name, date/time, host athlete
- Optional: notes, follow-up tasks
- Visible to coaches and assigned host

### RECRUIT-02: Visit Schedule
- PDF upload for visit schedule
- OR rich text editor for custom schedule
- Print/export schedule option
- Share link for recruit/parents

### RECRUIT-03: Host Athlete Integration
- Host athlete sees visits in their dashboard
- Notification when assigned as host
- View recruit details and schedule
- Optional check-in/notes

### NOTIFY-01: Smart Notifications Foundation
- Notification preferences in settings
- Notification types (email, in-app, push)
- Per-feature notification controls
- Quiet hours settings

## Dependencies

- Phase 12: Settings infrastructure
- Phase 10: Training calendar for visit events

## Success Criteria

1. Coach can toggle advanced features on/off in settings
2. UI adapts to show only enabled features
3. Coach can create recruit visit events with host assignment
4. Host athlete sees assigned visits in their dashboard
5. Visit schedules can be uploaded or created inline

## Design Considerations

- Feature discovery: show "upgrade" hints for disabled features
- Smooth transitions when features are enabled/disabled
- Mobile-friendly toggle interface
- Clear visual distinction between core and advanced
