# Phase 18: Lineup & Boat Configuration Improvements

## Phase Goal

Enhance lineup builder with advanced boat configuration options, rigging customization, equipment tracking, and improved visualization.

## Background

The current lineup builder handles basic seat assignment. Coaches need more sophisticated tools for:
- Custom boat configurations beyond standard classes
- Rigging adjustments per boat/athlete
- Equipment assignment and tracking
- Visual lineup comparison and analysis

## Requirements

### BOAT-01: Custom Boat Configurations
- Create custom boat types beyond standard (8+, 4+, etc.)
- Define seat count, coxswain presence, weight class
- Name and save custom configurations
- Share configurations across team
- Archive unused configurations

### BOAT-02: Rigging Profiles
- Store rigging settings per boat
- Spread, span, catch angle, oar length
- Default rigging per boat class
- Athlete-specific rigging preferences
- Rigging history tracking

### BOAT-03: Equipment Assignment
- Link shells to lineups
- Link oar sets to boats
- Equipment availability checking
- Conflict warnings (double-booking)
- Equipment condition tracking

### BOAT-04: Shell Fleet Integration
- Visual shell picker in lineup builder
- Shell characteristics display (weight, age, condition)
- Preferred shell recommendations
- Shell usage history

### LINEUP-01: Lineup Comparison View
- Side-by-side lineup comparison
- Highlight differences between lineups
- Performance prediction comparison
- What-if scenario analysis

### LINEUP-02: Historical Lineup Analysis
- Search past lineups by criteria
- Filter by athletes, boat class, date
- Success metrics per lineup
- Pattern detection (winning combinations)

### LINEUP-03: Lineup Templates
- Save lineups as templates
- Apply templates to new events
- Template variations (A-boat, B-boat)
- Quick duplicate and modify

### LINEUP-04: Visual Enhancements
- Improved boat diagram rendering
- Athlete photo integration
- Color-coded by preference match
- Side indicator visualization
- Weight distribution display

### LINEUP-05: Print & Export Improvements
- Enhanced PDF layout
- Multiple boats per page
- Include rigging settings
- QR code to digital version
- Excel export for external tools

## Dependencies

- Phase 8: Lineup builder foundation
- Phase 4: Fleet management (shells, oars)

## Success Criteria

1. Coach can create and manage custom boat configurations
2. Rigging settings can be stored and applied per boat
3. Equipment assignment is tracked and conflicts warned
4. Lineups can be compared side-by-side
5. Historical lineup search works across seasons
6. PDF export includes rigging and equipment details

## Design Considerations

- Keep simple use case simple (basic lineup still quick)
- Progressive disclosure for advanced features
- Mobile-friendly equipment selection
- Clear visual hierarchy in comparisons
- Performance: handle large lineup libraries
