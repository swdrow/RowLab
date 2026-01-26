---
phase: 16
plan: 09
name: "PR Celebration & Shareable Cards"
subsystem: gamification-ui
tags: [gamification, PR, sharing, celebration, recharts, html-to-image]

dependency:
  requires: ["16-02 (PRContext types)", "16-06 (usePersonalRecords hook)"]
  provides: ["PR celebration components", "PNG card generation", "Social sharing capability"]
  affects: ["16-10 (Leaderboard integration)", "Future workout detail pages"]

tech-stack:
  added: []
  patterns:
    - "html-to-image for PNG generation (3x faster than html2canvas)"
    - "forwardRef pattern for DOM capture"
    - "Inline celebration (no popup disruption)"

files:
  created:
    - src/v2/features/gamification/components/PRSparkline.tsx
    - src/v2/features/gamification/components/PRCelebration.tsx
    - src/v2/features/gamification/components/ShareableCard.tsx
    - src/v2/features/gamification/hooks/useShareCard.ts
  modified:
    - src/v2/features/gamification/index.ts

decisions:
  - id: inline-celebration
    what: "Use inline gold border instead of popup modal"
    why: "Non-disruptive UX - per CONTEXT.md 'visible but not disruptive'"
    alternatives: ["Modal popup", "Toast notification"]

  - id: html-to-image
    what: "Use html-to-image library over html2canvas"
    why: "3x faster per RESEARCH.md, installed in 16-01"
    alternatives: ["html2canvas (slower)", "Canvas API (more code)"]

  - id: fixed-card-size
    what: "Fixed 480x320px card dimensions"
    why: "Consistent PNG output for social sharing (16:9-ish ratio)"
    alternatives: ["Responsive sizing (harder to capture)", "Square format"]

metrics:
  duration: "4m 5s"
  completed: "2026-01-26"

status: complete
---

# Phase 16 Plan 09: PR Celebration & Shareable Cards Summary

**One-liner:** Inline PR celebration with gold highlighting and PNG-exportable shareable cards using html-to-image

## What Was Built

### 1. PRSparkline Component
Simple trend sparkline showing last 5 results for a test type:
- Uses recharts (already installed)
- Color-coded: green for improvement, red for regression
- Minimal 80x24px default size
- Integrates with `useResultTrend` hook from Phase 16-06

### 2. PRCelebration Component
Inline PR celebration display (NOT popup modal):
- **Gold styling:** amber-400 border, amber-50 background
- **Framer Motion animation:** Subtle scale bounce + trophy spin
- **Shows:** Time, improvement delta, PR scope (all-time/season/block), team rank
- **Integrates:** PRSparkline for trend visualization
- **Compact mode:** Optional smaller layout
- **Multi-scope:** Shows additional PR contexts (season + block PRs)

### 3. useShareCard Hook
React hook for PNG generation via html-to-image:
- **Exports:** `downloadPng`, `getDataUrl`, `getBlob`
- **Features:**
  - 2x pixel ratio for high-quality sharing
  - Timestamped filenames via file-saver
  - Error handling with state
  - Loading state tracking
- **Performance:** 3x faster than html2canvas (per RESEARCH.md)

### 4. ShareableCard Component
Fixed-size card for PNG export with full context:
- **Dimensions:** 480x320px (social-friendly aspect ratio)
- **Includes:** Time, delta, rank, athlete name, test type, date, RowLab branding
- **Design:** Dark gradient background with grid pattern
- **PR badge:** Conditional amber badge for PR achievements
- **Ref forwarding:** Uses `forwardRef` for html-to-image DOM capture

### 5. Gamification Index
Updated barrel export file to include:
- `PRCelebration`
- `PRSparkline`
- `ShareableCard`
- `useShareCard`

## Implementation Details

### PRCelebration UX Pattern
Per CONTEXT.md requirement: **"Inline highlight style: Gold badge/border on result, visible but not disruptive"**

Rejected popup modal approach in favor of inline gold border because:
- No interruption to workflow
- Still visually celebratory
- Users can continue immediately
- Gold/amber colors draw attention without blocking

### html-to-image Performance
Chose html-to-image over html2canvas because:
- 3x faster rendering (per 16-RESEARCH.md)
- Already installed in Phase 16-01
- Better React integration with refs
- Smaller bundle size

### Sparkline Integration
PRSparkline shows last 5 results to provide **context** for the PR:
- Green = improving trend (time decreasing)
- Red = regressing trend (time increasing)
- Only shown when >= 2 results exist
- Compact visual (60x28px in celebration)

## Verification Results

✅ PRCelebration uses gold/amber colors (border-amber-400)
✅ PRCelebration is inline (not popup)
✅ PRSparkline uses recharts
✅ ShareableCard includes: time, delta, rank, athlete name, test type, date, RowLab branding
✅ ShareableCard uses forwardRef for DOM capture
✅ useShareCard imports html-to-image (toPng, toBlob)
✅ `npm run build` succeeds (TypeScript compiles)

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

### Current
- **PRSparkline** uses `useResultTrend` from 16-06
- **PRCelebration** integrates PRSparkline
- **Both** use types from `src/v2/types/gamification.ts` (16-02)

### Future
- **16-10 (Leaderboard):** Will integrate PRCelebration for inline PR display
- **Workout detail pages:** Can use ShareableCard + useShareCard for social sharing
- **Athlete profiles:** Can show recent PRs with PRCelebration
- **Challenge results:** Can use ShareableCard for achievement sharing

## File Structure
```
src/v2/features/gamification/
├── components/
│   ├── PRSparkline.tsx          (55 lines) ✅
│   ├── PRCelebration.tsx        (151 lines) ✅
│   └── ShareableCard.tsx        (141 lines) ✅
├── hooks/
│   └── useShareCard.ts          (98 lines) ✅
└── index.ts                     (barrel exports) ✅
```

## Component API Examples

### PRCelebration
```tsx
<PRCelebration
  data={{
    testId: "test123",
    athleteId: "athlete456",
    athleteName: "Sarah Johnson",
    testType: "2k",
    result: 420.5,
    contexts: [
      { scope: 'all-time', isPR: true, improvement: 3.2, rank: 2 }
    ],
    trendData: [425, 423, 422, 421, 420.5]
  }}
  compact={false}
/>
```

### ShareableCard with useShareCard
```tsx
const { cardRef, downloadPng, isGenerating } = useShareCard({
  filename: 'my-pr-card',
  backgroundColor: '#ffffff'
});

<ShareableCard
  ref={cardRef}
  data={{
    athleteName: "Sarah Johnson",
    testType: "2k",
    result: 420.5,
    date: "2026-01-26",
    isPR: true,
    improvement: 3.2,
    teamRank: 2,
    totalAthletes: 24,
    teamName: "Stanford Rowing"
  }}
/>

<button onClick={downloadPng} disabled={isGenerating}>
  Download Card
</button>
```

## Success Criteria Met

✅ PRCelebration displays inline with gold border (not popup)
✅ PRSparkline shows last 5 results trend with recharts
✅ ShareableCard includes: time, delta, rank, athlete name, test type, date, RowLab branding
✅ useShareCard hook generates PNG via html-to-image
✅ Card can be downloaded as PNG
✅ All components exported from feature index

## Next Phase Readiness

### Blockers
None

### Warnings
- **ShareableCard** assumes fixed 480x320px - if different aspect ratios needed, will require new card variants
- **html-to-image** requires DOM element to be visible (display:none breaks capture)

### Recommendations
1. Test PNG generation in production environment (fonts, CORS for external images)
2. Consider adding copy-to-clipboard for data URL sharing
3. Add analytics tracking for card downloads
4. Consider server-side card generation for Open Graph previews

## Related Phases
- **Phase 16-02:** Defined PRContext, PRCelebrationData, ShareableCardData types
- **Phase 16-06:** Created usePersonalRecords, useResultTrend hooks
- **Phase 16-10:** Will integrate PRCelebration in leaderboard
