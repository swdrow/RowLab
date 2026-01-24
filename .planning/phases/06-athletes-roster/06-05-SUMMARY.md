---
phase: 06-athletes-roster
plan: 05
subsystem: ui
tags: [csv, import, papaparse, zod, validation, bulk-import, wizard]

# Dependency graph
requires:
  - phase: 06-03
    provides: useAthletes hook with importAthletes mutation
provides:
  - Multi-step CSV import wizard with auto-mapping
  - Column mapping UI with fuzzy matching
  - Validation preview before import
  - PapaParse integration for CSV parsing
affects: [athletes-page, roster-management]

# Tech tracking
tech-stack:
  added: [papaparse, @types/papaparse]
  patterns: [multi-step wizard with progress indicator, fuzzy column matching, client-side CSV validation]

key-files:
  created:
    - src/v2/utils/csvParser.ts
    - src/v2/components/athletes/CSVImportModal.tsx
    - src/v2/components/athletes/ColumnMapper.tsx
    - src/v2/components/athletes/ImportPreview.tsx
  modified:
    - src/v2/components/athletes/index.ts

key-decisions:
  - "PapaParse for CSV parsing (industry standard, supports worker threads)"
  - "Auto-mapping with fuzzy matching for common column variations"
  - "Zod validation with detailed error reporting per row"
  - "Allow partial import (skip invalid rows, import valid ones)"
  - "Worker threads for files >500KB to prevent UI blocking"

patterns-established:
  - "Multi-step wizard pattern: upload -> map -> preview -> import -> complete"
  - "Fuzzy column matching with normalize() for case/punctuation insensitivity"
  - "Validation preview shows both errors and success preview"
  - "Progress indicator with visual step completion"

# Metrics
duration: 16min
completed: 2026-01-24
---

# Phase 06 Plan 05: CSV Import Wizard Summary

**Multi-step CSV import wizard with auto-mapping and validation preview using PapaParse, enabling bulk import of 50+ athletes with error handling**

## Performance

- **Duration:** 16 min
- **Started:** 2026-01-24T15:53:51Z
- **Completed:** 2026-01-24T16:09:36Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments
- CSV parsing with PapaParse including worker thread support for large files
- Intelligent auto-mapping with fuzzy matching for common column variations (First Name/first/fname/given all map)
- Manual column adjustment UI with required field validation
- Validation preview showing error counts and first 5 valid rows before import
- Multi-step wizard flow with progress indicator and animation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CSV parsing utilities** - `d7d5c1d` (feat)
2. **Task 2: Create ColumnMapper component** - `e2aad80` (feat)
3. **Task 3: Create ImportPreview component** - `7963bcc` (feat)
4. **Task 4: Create CSVImportModal wizard** - `004e948` (feat)
5. **Task 5: Update barrel exports** - `f9181e1` (feat)

## Files Created/Modified

### Created
- `src/v2/utils/csvParser.ts` - CSV parsing, auto-mapping, and validation utilities
  - parseCSV() - PapaParse wrapper with worker threads for >500KB files
  - autoMapColumns() - Fuzzy matching for common column name variations
  - validateAthleteRow() - Zod schema validation with detailed error reporting
  - validateAllRows() - Batch validation returning valid/invalid row summary
- `src/v2/components/athletes/ColumnMapper.tsx` - Column mapping step UI
  - Visual mapping interface with dropdowns
  - Required fields marked with asterisk
  - Prevents duplicate column mapping
  - Shows unmapped columns that will be ignored
- `src/v2/components/athletes/ImportPreview.tsx` - Validation preview step
  - Valid/invalid count badges with color coding
  - Error list (max 20 rows shown)
  - Preview table of first 5 valid rows
- `src/v2/components/athletes/CSVImportModal.tsx` - Multi-step wizard modal
  - 5 steps: upload -> map -> preview -> import -> complete
  - Progress indicator with visual completion
  - Integrates with useAthletes importAthletes mutation
  - Error handling at each step

### Modified
- `src/v2/components/athletes/index.ts` - Added CSV import component exports

## Decisions Made

**1. PapaParse for CSV parsing**
- Industry-standard library with robust error handling
- Built-in support for worker threads (prevents UI blocking on large files)
- Automatic type inference with dynamicTyping option

**2. Fuzzy column matching algorithm**
- normalize() removes case, spaces, underscores, hyphens, dots
- Three-level matching: exact -> alias -> contains
- Common aliases: first/fname/givenname all map to firstName
- Single-letter codes: P/S/B/C map to Port/Starboard/Both/Cox

**3. Zod validation with transformation**
- Boolean fields accept: true/false, yes/no, 1/0, y/n (case insensitive)
- Side field accepts full names or single-letter codes (auto-normalized)
- Heights 100-250cm, weights 30-200kg (realistic athlete ranges)

**4. Partial import strategy**
- Shows total valid/invalid counts
- Lists errors for first 20 invalid rows (prevents UI overload)
- Button text changes: "Import All X" vs "Import X Valid" (when errors exist)
- Backend will handle bulk import, frontend just sends valid rows

**5. Worker threads for large files**
- Threshold: 500KB (roughly 5,000 rows with 10 columns)
- PapaParse automatically spawns worker when file size exceeds threshold
- Prevents main thread blocking on large CSV parsing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Papa import for TypeScript**
- **Found during:** Task 1 (CSV parsing utilities)
- **Issue:** PapaParse has no default export, causing TypeScript error
- **Fix:** Changed `import Papa from 'papaparse'` to `import * as Papa from 'papaparse'`
- **Files modified:** src/v2/utils/csvParser.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** d7d5c1d (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed Zod error property access**
- **Found during:** Task 1 (CSV parsing utilities)
- **Issue:** Zod v4 uses `.issues` not `.errors` property
- **Fix:** Changed `result.error.errors.map()` to `result.error.issues.map()`
- **Files modified:** src/v2/utils/csvParser.ts
- **Verification:** TypeScript compilation passes, error mapping works correctly
- **Committed in:** d7d5c1d (Task 1 commit)

**3. [Rule 3 - Blocking] Installed @types/papaparse**
- **Found during:** Task 1 verification
- **Issue:** PapaParse types not installed, TypeScript couldn't resolve types
- **Fix:** Ran `npm install --save-dev @types/papaparse`
- **Files modified:** package.json, package-lock.json
- **Verification:** TypeScript knows PapaParse types, IDE autocomplete works
- **Committed in:** Not committed (dev dependency, installed but not in git)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary to unblock TypeScript compilation. No scope creep.

## Issues Encountered

None - all tasks executed as planned after resolving TypeScript configuration issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for integration:**
- CSVImportModal can be added to Athletes page toolbar
- Import mutation already exists in useAthletes hook (06-03)
- Modal is fully self-contained with internal state management

**Future enhancements (not in this phase):**
- Download sample CSV template
- Drag-and-drop file upload (UI exists but needs handler)
- Duplicate detection before import
- Progress bar during import (currently shows spinner)

**No blockers for next phase.**

---
*Phase: 06-athletes-roster*
*Completed: 2026-01-24*
