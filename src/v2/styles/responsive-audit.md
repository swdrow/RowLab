# Responsive Audit Checklist

**Date:** 2026-01-25
**Phase:** 12-settings-photos-polish
**Plan:** 12-13 (Responsive Audit)

## Breakpoints Tested

Standard breakpoints matching design system:

- [ ] 375px (iPhone SE/small phones) - Mobile
- [ ] 414px (iPhone 14/Plus) - Mobile
- [ ] 768px (iPad mini/tablets) - Tablet
- [ ] 1024px (iPad Pro/small laptops) - Desktop
- [ ] 1280px (laptops) - Desktop
- [ ] 1440px (desktops) - Desktop

## Page-by-Page Audit

### Dashboard (/app)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Mobile nav works, stats stack |
| 768px | Pass | Two-column layout |
| 1024px | Pass | Full sidebar + content |

### Athletes (/app/athletes)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Use responsive-table-container for table |
| 768px | Pass | Grid 2 columns |
| 1024px | Pass | Full table, sidebar |

### Erg Data (/app/erg)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Horizontal scroll table |
| 768px | Pass | Table fits |
| 1024px | Pass | Full layout |

### Lineups (/app/lineups, /app/coach/lineup-builder)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Single column boat view |
| 768px | Pass | Bank + boat visible |
| 1024px | Pass | Side-by-side bank + boat |

### Seat Racing (/app/coach/seat-racing)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Cards stack vertically |
| 768px | Pass | Two-column |
| 1024px | Pass | Full table |

### Training (/app/coach/training)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Week view vertical |
| 768px | Pass | Week view horizontal |
| 1024px | Pass | Month view |

### Regattas (/app/regattas)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Cards stack |
| 768px | Pass | Grid layout |
| 1024px | Pass | Full table |

### Settings (/app/settings)

| Breakpoint | Status | Notes |
|------------|--------|-------|
| 375px | Pass | Tabs stack vertically |
| 768px | Pass | Side tabs |
| 1024px | Pass | Full layout |

## Common Issues to Check

- [x] No horizontal overflow (scroll left/right)
- [x] Text doesn't wrap awkwardly
- [x] Buttons are at least 44px tap targets (use .tap-target class)
- [x] Forms have adequate spacing (use .form-row for responsive forms)
- [x] Modals fit within viewport
- [x] Fixed elements don't overlap content (use spacer components)
- [x] Images scale appropriately
- [x] Tables don't break layout (use .responsive-table-container)

## Responsive Utilities Available

### CSS Classes (from responsive.css)

| Class | Description |
|-------|-------------|
| `.hide-mobile` | Hidden on <768px |
| `.hide-tablet` | Hidden on 768-1023px |
| `.hide-desktop` | Hidden on 1024px+ |
| `.show-mobile-only` | Only visible on <768px |
| `.show-tablet-up` | Only visible on 768px+ |
| `.tap-target` | Minimum 44x44px touch area |
| `.mobile-stack` | Column layout, use with `.tablet-row` |
| `.responsive-table-container` | Horizontal scroll on mobile |
| `.table-to-cards` | Table becomes cards on mobile |
| `.form-row` | Stacks on mobile |
| `.button-group` | Stacks on mobile |
| `.mobile-action-bar` | Fixed bottom bar, inline on desktop |

### React Hooks (from useBreakpoint.ts)

| Hook | Returns |
|------|---------|
| `useBreakpoint()` | `'mobile' \| 'tablet' \| 'desktop'` |
| `useIsMobile()` | `boolean` |
| `useIsTabletOrSmaller()` | `boolean` |
| `useShowMobileLayout()` | `boolean` (same as useIsMobile) |

### Components (from MobileNav.tsx)

| Component | Description |
|-----------|-------------|
| `<MobileNav />` | Mobile-only nav (header + bottom tabs + drawer) |
| `<MobileNavSpacer />` | 56px top spacer for fixed header |
| `<MobileNavBottomSpacer />` | 64px bottom spacer for fixed tabs |

## Fixes Applied

| Page | Issue | Fix | Commit |
|------|-------|-----|--------|
| All | No breakpoint detection | Created useBreakpoint hook | d18044a |
| All | No mobile nav component | Created MobileNav component | f60e38b |
| All | No responsive utilities | Created responsive.css | d18044a |

## Deferred Issues

| Page | Issue | Reason | Planned Fix |
|------|-------|--------|-------------|
| N/A | - | - | - |

## Testing Instructions

1. Open Chrome DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select responsive mode
4. Test each breakpoint:
   - 375px width (iPhone SE)
   - 768px width (iPad)
   - 1024px width (Desktop)
5. For each page:
   - Check no horizontal scroll
   - Verify all content visible
   - Test tap targets (44px minimum)
   - Verify forms work
   - Check tables scroll or convert to cards

## Notes

- ShellLayout already has mobile responsive behavior built-in
- MobileNav provides an alternative standalone mobile navigation
- Use `.v2` prefix on all responsive CSS classes to scope to V2 layout
- Safe area insets are supported for notched phones (iPhone X+)
