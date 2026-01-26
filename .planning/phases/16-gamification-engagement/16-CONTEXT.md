# Phase 16: Gamification & Engagement

## Phase Goal

Add achievement system, personal records tracking, team challenges, and engagement features to increase athlete motivation and platform stickiness.

## Background

From the approved design document (2026-01-26-phase14-improvements-design.md):
- Athletes need motivation beyond just seeing data
- PRs should be celebrated with satisfying animations
- Team challenges create healthy competition
- Season journey visualization shows progress over time

## Requirements

### ACH-01: Achievement System
- Define achievement categories (Erg, Attendance, Training, Racing)
- Achievement badges with icons and descriptions
- Unlock conditions (automatic detection)
- Achievement history per athlete
- Team achievements (collective goals)

### ACH-02: Achievement Categories
**Erg Achievements:**
- First 2k, Sub-7:00, Sub-6:30, etc.
- Distance milestones (100k, 500k, 1M meters)
- Consistency (30-day streak)

**Training Achievements:**
- Perfect attendance month
- Completed training block
- All workouts logged

**Racing Achievements:**
- First race, First medal, Regatta sweep

### PR-01: Personal Records Wall
- Dedicated PR section in athlete profile
- All-time PRs by test type
- Season PRs vs all-time comparison
- PR history timeline
- Share PR achievement option

### PR-02: PR Celebrations
- Animated number pop + gold wash
- Badge animation on new PR
- Optional notification to coach
- Social share card generation

### CHAL-01: Team Challenges
- Coach creates challenges (meters, attendance, etc.)
- Challenge duration and goals
- Leaderboard during challenge
- Completion badges
- Historical challenge archive

### CHAL-02: Challenge Types
- Total meters challenge (individual or team sum)
- Attendance streak challenge
- Training completion challenge
- Custom metric challenges

### JOURNEY-01: Season Journey Visualization
- Timeline view of season milestones
- Key events marked (races, PRs, training blocks)
- Progress toward season goals
- Reflective view at season end

### STREAK-01: Streak Tracking
- Training streak (consecutive days)
- Attendance streak
- Workout completion streak
- Visual streak indicators
- Streak recovery grace period

## Dependencies

- Phase 7: Erg data for PR detection
- Phase 6: Attendance for streak tracking
- Phase 14: Rankings for comparison data

## Success Criteria

1. Athletes earn achievements automatically based on activity
2. New PRs trigger celebratory animations
3. Coach can create and manage team challenges
4. Athletes can view their season journey timeline
5. Streak indicators appear on athlete profiles

## Design Considerations

- Celebrations should be satisfying but not disruptive
- Achievements should feel earned, not handed out
- Balance individual and team recognition
- Mobile-first achievement viewing
- Accessible animations (reduced motion support)
