# Phase 22: Coxswain Mobile View

## Phase Goal

Coxswains have a dedicated mobile-optimized interface for on-water use with offline support, piece timing, lineup reference, and coach communication.

## Background

Coxswains need access to RowLab while on the water, but current interfaces aren't optimized for mobile or low-connectivity situations. This phase creates a purpose-built coxswain view with large touch targets, offline capability, and rowing-specific tools.

## Requirements

### COX-01: Mobile-Optimized Layout
- Large touch targets (56px minimum)
- High contrast for outdoor visibility
- Portrait and landscape support
- Swipe navigation between sections

### COX-02: Lineup Reference
- Current boat lineup display
- Athlete names and seat positions
- Tap for athlete details (side, weight, notes)
- Quick switch between boats if multiple assigned

### COX-03: Piece Timer
- Start/stop piece timing
- Lap splits with auto-save
- Visual countdown for intervals
- Audio cues (beeps for timing)

### COX-04: Stroke Rate Counter
- Manual tap counting mode
- Rate calculation and display
- Target rate indicator
- History of recent rates

### COX-05: Notes & Commands
- Quick note entry (voice or text)
- Timestamped auto-save
- Pre-set command templates
- Sync notes to coach view

### COX-06: Offline Mode
- Cache lineup and schedule data
- Record times/notes offline
- Background sync when connected
- Clear offline/online status indicator

### COX-07: Race Day Mode
- Race schedule countdown
- Progression rules reference
- Lane assignment display
- Warm-up checklist

### COX-08: Coach Communication
- Receive real-time messages from coach
- Send quick status updates
- Voice message recording
- Emergency alert button

## Dependencies

- Phase 13: Session model for piece data
- PWA infrastructure: Service workers, IndexedDB

## Success Criteria

1. Coxswain can view lineup and time pieces entirely offline
2. Interface is usable in direct sunlight with touch controls
3. Piece times sync automatically when connectivity restored
4. Coach receives coxswain notes in real-time when connected
5. Race day mode shows countdown and progression information

## Design Considerations

- Battery optimization: minimize background processing
- Data usage: compress sync payloads for cellular
- Accessibility: screen reader support
- Water resistance: assume phone in waterproof case, large targets
- Voice-first options where safe (not during racing)

## Technical Notes

- PWA with service worker for offline
- IndexedDB for local data storage
- Background sync API for deferred uploads
- Web Audio API for timing beeps
- Vibration API for haptic feedback
