# Erg Test Form UX Improvements

## Overview

The Add/Edit Erg Test form (`src/v2/components/erg/ErgTestForm.tsx`) has been enhanced to provide a streamlined user experience for the most common use case: quickly logging a test result.

## Key Improvements

### 1. Smart Defaults

**Date Defaults to Today**
- New tests automatically default to today's date
- No need to manually select the current date

**Distance Auto-fills by Test Type**
- 2K test → 2000m
- 6K test → 6000m
- 500m test → 500m
- 30min test → 0m (time-based)

### 2. Weight is Optional

**Auto-filled from Athlete Profile**
- When you select an athlete, their weight is automatically filled in if available
- Weight is completely optional - you can leave it blank for quick test entry
- Useful for quick logging when you just want to record time

### 3. Enhanced Auto-Calculation

The form now intelligently calculates missing fields based on what you enter:

**Enter Time → Auto-calculates Split and Watts**
```
User enters: 2K time of 6:30.0
Form calculates:
  - Split: 1:37.5 per 500m
  - Watts: ~378W
```

**Enter Split → Auto-calculates Watts**
```
User enters: Split of 1:45.0
Form calculates:
  - Watts: ~302W
```

**Enter Watts → Auto-calculates Split**
```
User enters: 250 watts
Form calculates:
  - Split: 1:51.9 per 500m
```

### 4. Clearer UI Labels

All labels now clearly indicate:
- Which fields are required (marked with *)
- Which fields are auto-calculated
- Which fields are optional
- What format to use (MM:SS.s or seconds)

## Technical Details

### Concept2 Erg Formula

The form uses the standard Concept2 rowing ergometer power formula:

```
Watts = 2.80 / pace³
```

Where:
- `pace` = seconds per meter
- To convert split per 500m to pace: `pace = split / 500`
- To convert pace to split per 500m: `split = pace × 500`

### Calculation Functions

**`timeToSplit(timeSeconds, distanceM)`**
- Calculates split per 500m from total time and distance
- Formula: `split = (time / distance) × 500`
- Example: 390s for 2000m → 97.5s/500m (1:37.5)

**`splitToWatts(splitSeconds)`**
- Converts split per 500m to watts
- Formula: `watts = 2.80 / (split/500)³`
- Example: 105s split → ~302 watts

**`wattsToSplit(watts)`**
- Converts watts to split per 500m
- Formula: `split = ((2.80/watts)^(1/3)) × 500`
- Example: 250 watts → ~112s (1:51.9)

## User Workflows

### Quick Test Entry (Most Common)

1. Select athlete from dropdown
2. Select test type (defaults to 2K)
3. Enter time (e.g., "6:30.0")
4. Click "Create Test"

**That's it!** Split, watts, date, and distance are all auto-filled.

### Power User Entry

Power users can still manually override any field:
- Enter split directly instead of time
- Enter watts directly
- Adjust distance for non-standard tests
- Add stroke rate
- Add notes

### Editing Existing Tests

- All fields are pre-filled with existing values
- Auto-calculation still works when you change values
- Distance and test type remain locked to prevent accidental changes

## Testing

### Unit Tests

Comprehensive test suite in `src/v2/components/erg/ErgTestForm.test.tsx`:

- ✅ Time parsing (MM:SS.s format and plain seconds)
- ✅ Time formatting (seconds to MM:SS.s display)
- ✅ Watts to split conversion
- ✅ Split to watts conversion
- ✅ Time to split calculation (for distance-based tests)
- ✅ Full workflow validations (17 tests total)

All tests passing, verifying correct Concept2 formula implementation.

### Manual Verification

To manually test the form:

1. Navigate to `/app/data/erg-tests` in the V2 interface
2. Click "ADD TEST" button
3. Verify smart defaults:
   - Date shows today
   - Test type defaults to 2K
   - Distance shows 2000m
4. Select an athlete with a weight in their profile
   - Verify weight auto-fills
5. Enter a time (e.g., "6:30.0")
   - Verify split and watts auto-calculate
6. Clear the auto-filled values
7. Enter just a split (e.g., "1:45.0")
   - Verify watts auto-calculates
8. Clear and enter just watts (e.g., "250")
   - Verify split auto-calculates

## Backwards Compatibility

- All existing functionality preserved
- Edit mode works exactly as before
- Optional fields remain optional
- No breaking changes to API contracts
- Validation schema unchanged (weight was already optional)

## Future Enhancements

Potential future improvements:
- Remember last-used test type per athlete
- Suggest expected watts/split based on previous PRs
- Mobile-optimized number pad for time entry
- Voice input for hands-free test logging
- Bulk test entry wizard
