---
phase: 10
plan: 09
subsystem: training-compliance
tags: [ncaa, compliance, warnings, audit-report, react, typescript]
completed: 2026-01-25
duration: 5.5 minutes

requires:
  - 10-08 # Compliance Dashboard Components
  - src/v2/utils/ncaaRules.ts # NCAA limit calculations
  - src/v2/hooks/useNcaaCompliance.ts # Compliance report data hook

provides:
  - NCAA20HourWarning component
  - NCAAWarningBadge component
  - NCAAAuditReport component
  - Proactive compliance warnings
  - Audit-ready reporting

affects:
  - 10-10 # Workout creation will use NCAA20HourWarning
  - Future workout scheduling UIs
  - Future training plan assignment flows

tech-stack:
  added: []
  patterns:
    - "Proactive warning pattern for constraint enforcement"
    - "Print-optimized HTML generation with inline styles"
    - "Conditional rendering for warnings (null if no warning)"

key-files:
  created:
    - src/v2/components/training/compliance/NCAA20HourWarning.tsx
    - src/v2/components/training/compliance/NCAAAuditReport.tsx
  modified:
    - src/v2/components/training/compliance/index.ts

decisions:
  - id: NCAA-WARN-01
    choice: "Warning component returns null when no warning needed"
    rationale: "Cleaner than passing showWarning prop, enables conditional rendering in parent"
    alternatives: ["Always render with visibility control", "Separate check function"]

  - id: NCAA-WARN-02
    choice: "Separate NCAAWarningBadge for inline display"
    rationale: "Reusable badge for tables/forms without full warning panel, different UX context"
    alternatives: ["Single component with display mode prop", "Only full warning component"]

  - id: NCAA-AUDIT-01
    choice: "Print via window.open with inline styles"
    rationale: "No external dependencies, works in all browsers, styles guaranteed to render"
    alternatives: ["jsPDF library", "Server-side PDF generation", "CSS @media print only"]

  - id: NCAA-AUDIT-02
    choice: "Report uses off-screen render ref for printing"
    rationale: "Maintains separation between screen UI and print layout, full print control"
    alternatives: ["Print current screen with @media print", "Hidden iframe approach"]

  - id: NCAA-AUDIT-03
    choice: "Activity type labels via Record<ActivityType, string>"
    rationale: "Type-safe mapping ensures all activity types covered, no runtime errors"
    alternatives: ["Switch statement", "Inline ternaries", "Enum with values"]

  - id: NCAA-AUDIT-04
    choice: "Sort sessions by date within athlete section"
    rationale: "Chronological order aids review, easier to verify continuous tracking"
    alternatives: ["Group by activity type", "Sort by duration", "No sorting"]

issues: []

tests: []
---

# Phase 10 Plan 09: NCAA Warning & Audit Components Summary

**One-liner:** Proactive NCAA compliance warnings and printable audit reports for 20-hour rule enforcement

## What Was Built

### NCAA20HourWarning Component
**Purpose:** Warn coaches when adding an activity would approach or exceed NCAA 20-hour weekly limit

**Features:**
- Calculates projected daily and weekly hours using `wouldExceedLimit` from ncaaRules
- Shows current vs. projected hours for both daily (4h) and weekly (20h) limits
- Color-coded warnings:
  - Yellow for approaching limit (18-20h weekly)
  - Red for exceeding limit (>20h weekly or >4h daily)
- Displays special handling for competitions (counted as 3h)
- Optional action buttons (Proceed/Cancel) for workflow integration
- Returns `null` when no warning needed (clean conditional rendering)

**Props:**
```typescript
{
  athleteId: string;
  athleteName?: string;
  proposedDate: Date;
  proposedDurationMinutes: number;
  isCompetition?: boolean;
  existingSessions: PracticeSession[];
  onProceed?: () => void;
  onCancel?: () => void;
  className?: string;
}
```

**Usage Example:**
```tsx
<NCAA20HourWarning
  athleteId="athlete-123"
  athleteName="Sarah Johnson"
  proposedDate={new Date('2024-03-15')}
  proposedDurationMinutes={120}
  isCompetition={false}
  existingSessions={weekSessions}
  onProceed={handleAddWorkout}
  onCancel={handleCancel}
/>
```

### NCAAWarningBadge Component
**Purpose:** Inline warning indicator for forms and tables

**Features:**
- Compact badge showing projected weekly hours
- Warning icon for visual attention
- Color-coded (yellow 18-20h, red >20h)
- Returns `null` if under 18h (no noise for compliant athletes)

**Usage Example:**
```tsx
<NCAAWarningBadge projectedWeeklyHours={19.5} />
// Renders: 🔺 19.5h (yellow background)
```

### NCAAAuditReport Component
**Purpose:** Generate printable NCAA compliance audit reports for weekly review

**Features:**
- Fetches report data via `useNcaaComplianceReport` hook
- Summary section with key metrics:
  - Total athletes
  - Athletes near limit (18-20h)
  - Athletes over limit (>20h)
- NCAA rules reference box (20h weekly, 4h daily, 3h competition)
- Per-athlete breakdown:
  - Chronologically sorted activity list
  - Activity type badges (Practice, Competition, Strength, etc.)
  - Daily duration with special competition formatting
  - Week total with compliance status color
- Print functionality:
  - Opens formatted document in new window
  - Inline styles for guaranteed print rendering
  - Page-break controls for clean multi-page reports
  - Professional layout for NCAA audit retention

**Props:**
```typescript
{
  weekStart: Date;
  teamName?: string;
  onClose?: () => void;
  className?: string;
}
```

**Usage Example:**
```tsx
<NCAAAuditReport
  weekStart={currentWeekStart}
  teamName="University Rowing Team"
  onClose={handleCloseReport}
/>
```

## Technical Approach

### Warning Logic
- Uses `wouldExceedLimit(athleteId, proposedDate, durationMinutes, isCompetition, sessions)` from ncaaRules
- Returns projected daily/weekly hours and boolean flags for exceeding limits
- Component focuses on presentation, all calculation logic in shared utility

### Audit Report Rendering
- **Screen UI:** React component with TanStack Query for data fetching
- **Print UI:** HTML string with inline styles written to new window
- **Separation:** `printRef` captures print-optimized layout separate from screen controls
- **Print workflow:** Print button → window.open → inject HTML → trigger print dialog

### Type Safety
- All components strongly typed with training.ts types
- Activity type labels via `Record<ActivityType, string>` prevents missing cases
- PracticeSession, NCAAAuditEntry, NCAAComplianceReport from shared types

## Design Patterns

### Conditional Rendering Pattern
Both warning components return `null` when not needed:
```typescript
if (!hasWarning) return null;
if (projectedWeeklyHours < 18) return null;
```
Enables clean parent code without prop drilling:
```tsx
{/* Shows only when needed, no extra logic */}
<NCAA20HourWarning {...props} />
```

### Print Optimization Pattern
Inline styles in print window ensure consistent rendering:
```typescript
const printWindow = window.open('', '_blank');
printWindow.document.write(`
  <style>
    /* All styles inline, no external dependencies */
    body { font-family: -apple-system, ... }
    @media print { ... }
  </style>
  ${printRef.current.innerHTML}
`);
printWindow.print();
```

### Utility-First Calculation
Components call ncaaRules utilities, don't duplicate logic:
```typescript
// ✅ Good - single source of truth
const { wouldExceedWeekly, projectedWeeklyHours } = wouldExceedLimit(...);

// ❌ Bad - duplicating calculation logic
const projectedHours = existingSessions.reduce(...) + proposed;
```

## Integration Points

### NCAA20HourWarning Integration
Will be used in:
- **Workout creation modal** (Plan 10-10): Show warning before adding workout to plan
- **Training plan assignment**: Warn when assigning plan would exceed limits
- **Calendar drag-drop**: Show warning when rescheduling creates compliance issue

Example integration:
```tsx
function WorkoutForm() {
  const [showWarning, setShowWarning] = useState(false);
  const proposedWorkout = useWatch({ control, name: 'workout' });

  return (
    <form>
      {/* Form fields */}
      <NCAA20HourWarning
        athleteId={athlete.id}
        athleteName={athlete.name}
        proposedDate={proposedWorkout.date}
        proposedDurationMinutes={proposedWorkout.duration}
        existingSessions={weekSessions}
        onProceed={handleSubmit}
        onCancel={() => setShowWarning(false)}
      />
    </form>
  );
}
```

### NCAAAuditReport Integration
Will be used in:
- **ComplianceDashboard**: Button to generate weekly report
- **Settings page**: Generate report for any week
- **Export workflow**: Bulk export for semester/year

Example integration:
```tsx
function ComplianceDashboard() {
  const [showReport, setShowReport] = useState(false);

  return (
    <div>
      <button onClick={() => setShowReport(true)}>
        Generate Audit Report
      </button>
      {showReport && (
        <Modal>
          <NCAAAuditReport
            weekStart={currentWeek}
            teamName={team.name}
            onClose={() => setShowReport(false)}
          />
        </Modal>
      )}
    </div>
  );
}
```

## Verification Results

All tasks completed successfully:

### Task 1: NCAA20HourWarning
- ✅ File created: 175 lines (>50 min)
- ✅ Imports `wouldExceedLimit` from ncaaRules
- ✅ Exports NCAA20HourWarning and NCAAWarningBadge
- ✅ Shows projected daily/weekly hours
- ✅ Color-coded warnings (yellow/red)
- ✅ Action buttons (Proceed/Cancel)

### Task 2: NCAAAuditReport
- ✅ File created: 244 lines (>100 min)
- ✅ Uses `useNcaaComplianceReport` hook
- ✅ Summary stats (total athletes, near/over limit)
- ✅ Per-athlete activity breakdown
- ✅ Print functionality with inline styles
- ✅ NCAA rules reference included
- ✅ Handles loading/error states

### Task 3: Index Exports
- ✅ NCAA20HourWarning exported
- ✅ NCAAWarningBadge exported
- ✅ NCAAAuditReport exported
- ✅ All 6 compliance components now exported

### Key Links Verified
- ✅ NCAA20HourWarning → ncaaRules.wouldExceedLimit ✓
- ✅ NCAAAuditReport → useNcaaCompliance.useNcaaComplianceReport ✓

## Success Criteria Met

- ✅ **NCAA-01:** System tracks daily practice hours per athlete (via PracticeSession type)
- ✅ **NCAA-02:** System calculates weekly total against 20-hour limit (wouldExceedLimit utility)
- ✅ **NCAA-03:** Coach receives warning when approaching limit (NCAA20HourWarning component)
- ✅ **NCAA-04:** Coach can view compliance report for audit purposes (NCAAAuditReport component)

## Commits

| Hash    | Message |
|---------|---------|
| 87470ee | feat(10-09): add NCAA 20-hour warning component |
| 64670c3 | feat(10-09): add NCAA audit report component |
| 3df1738 | feat(10-09): export NCAA warning and audit components |

## Next Steps

**Immediate (Plan 10-10):**
- Integrate NCAA20HourWarning into workout creation modal
- Show warning before adding workout that would exceed limits
- Use NCAAWarningBadge in workout assignment table

**Future Enhancements:**
- Email digest of weekly compliance report to head coach
- Historical compliance trends (% of weeks compliant over semester)
- Athlete-facing view showing their remaining hours for week
- Bulk report export for entire season (PDF compilation)

## Files Created/Modified

**Created:**
- `src/v2/components/training/compliance/NCAA20HourWarning.tsx` (175 lines)
- `src/v2/components/training/compliance/NCAAAuditReport.tsx` (244 lines)

**Modified:**
- `src/v2/components/training/compliance/index.ts` (+2 exports)

**Total:** 419 lines of production code
