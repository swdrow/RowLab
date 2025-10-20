# Liquid Glass Implementation Examples

This guide shows how to transform existing RowLab components to use the new Liquid Glass design system.

---

## Example 1: Transform App.jsx (Main Container)

### Before (Original)
```jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import useDarkMode from './hooks/useDarkMode';

function App() {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <header className="bg-white dark:bg-dark-card shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">RowLab</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6">
          {/* Content */}
        </div>
      </main>
    </div>
  );
}

export default App;
```

### After (Liquid Glass)
```jsx
import React from 'react';
import './App.css';
import useDarkMode from './hooks/useDarkMode';
import { GlassContainer, GlassNavbar, GlassCard } from './components/Design';
import DarkModeToggle from './components/DarkModeToggle';

function App() {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <GlassContainer variant="mesh">
      <div className="min-h-screen">
        <GlassNavbar
          title="RowLab"
          leftContent={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-blue-violet" />
            </div>
          }
          rightContent={<DarkModeToggle />}
          sticky
          blur="strong"
        />

        <main className="max-w-7xl mx-auto p-6">
          <GlassCard variant="base" className="p-6 animate-slide-up">
            {/* Content */}
          </GlassCard>
        </main>
      </div>
    </GlassContainer>
  );
}

export default App;
```

**Key Changes:**
- Wrapped app in `<GlassContainer variant="mesh">` for ambient mesh background
- Replaced header with `<GlassNavbar>` component
- Replaced standard card with `<GlassCard variant="base">`
- Added `animate-slide-up` for entrance animation

---

## Example 2: Transform AthleteCard Component

### Before (Original)
```jsx
function AthleteCard({ athlete, onDragStart }) {
  return (
    <div
      className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 cursor-grab hover:shadow-lg transition-shadow"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center gap-3">
        <img
          src={athlete.photo}
          alt={athlete.name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h3 className="font-semibold">{athlete.name}</h3>
          <span className="text-sm text-gray-500">{athlete.side}</span>
        </div>
      </div>
      <div className="mt-2 text-sm">
        <p>2k PR: {athlete.pr2k}</p>
      </div>
    </div>
  );
}
```

### After (Liquid Glass)
```jsx
import { GlassCard, GlassBadge } from '../Design';

function AthleteCard({ athlete, onDragStart }) {
  return (
    <GlassCard
      variant="base"
      interactive
      className="p-4 cursor-grab active:cursor-grabbing transition-glass"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={athlete.photo}
            alt={athlete.name}
            className="w-12 h-12 rounded-full border-2 border-white/30 dark:border-white/20"
          />
          {/* Subtle glow around avatar */}
          <div className="absolute inset-0 rounded-full bg-gradient-blue-violet opacity-0 group-hover:opacity-20 transition-opacity" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {athlete.name}
          </h3>
          <GlassBadge
            variant={athlete.side === 'Port' ? 'port' : 'starboard'}
            size="sm"
          >
            {athlete.side}
          </GlassBadge>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/20 dark:border-white/10">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">2k PR:</span> {athlete.pr2k}
        </p>
      </div>
    </GlassCard>
  );
}
```

**Key Changes:**
- Used `<GlassCard>` with `interactive` prop for hover effects
- Added `<GlassBadge>` for port/starboard indicator
- Enhanced avatar with glass border
- Added subtle divider with glass-style border
- Improved typography contrast for accessibility

---

## Example 3: Transform BoatSelectionModal

### Before (Original)
```jsx
function BoatSelectionModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select Boat Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {boatClasses.map(boat => (
            <button
              key={boat.id}
              onClick={() => onSelect(boat)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
            >
              {boat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### After (Liquid Glass)
```jsx
import { GlassModal, GlassButton, GlassCard } from '../Design';

function BoatSelectionModal({ isOpen, onClose, onSelect, boatClasses }) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Boat Class"
      size="md"
      showCloseButton
      closeOnBackdrop
      closeOnEscape
    >
      <div className="space-y-3">
        {boatClasses.map(boat => (
          <GlassCard
            key={boat.id}
            variant="subtle"
            interactive
            className="p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => onSelect(boat)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {boat.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {boat.seats} seats
                </p>
              </div>
              <div className="text-2xl opacity-50">
                {boat.icon}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/5">
        <GlassButton
          variant="secondary"
          onClick={onClose}
          fullWidth
        >
          Cancel
        </GlassButton>
      </div>
    </GlassModal>
  );
}
```

**Key Changes:**
- Used `<GlassModal>` component with built-in features
- Replaced button list with interactive `<GlassCard>` components
- Added scale animations on interaction
- Improved layout with better spacing and dividers
- Added cancel button with glass styling

---

## Example 4: Transform Form Input

### Before (Original)
```jsx
function LineupNameInput({ value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Lineup Name
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Enter lineup name"
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-card"
      />
    </div>
  );
}
```

### After (Liquid Glass)
```jsx
import { GlassInput } from '../Design';

function LineupNameInput({ value, onChange }) {
  return (
    <GlassInput
      label="Lineup Name"
      placeholder="e.g., Varsity 8+ Practice"
      value={value}
      onChange={onChange}
      required
      helperText="Choose a descriptive name for this lineup"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      }
    />
  );
}
```

**Key Changes:**
- Used `<GlassInput>` component
- Added icon for visual interest
- Included helper text for guidance
- Automatic glass styling with focus states

---

## Example 5: Transform Button Actions

### Before (Original)
```jsx
<div className="flex gap-3">
  <button
    onClick={handleSave}
    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    Save Lineup
  </button>
  <button
    onClick={handleCancel}
    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
  >
    Cancel
  </button>
</div>
```

### After (Liquid Glass)
```jsx
import { GlassButton } from '../Design';

<div className="flex gap-3">
  <GlassButton
    variant="primary"
    size="md"
    onClick={handleSave}
    loading={isSaving}
    icon={
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    }
  >
    Save Lineup
  </GlassButton>

  <GlassButton
    variant="ghost"
    size="md"
    onClick={handleCancel}
    disabled={isSaving}
  >
    Cancel
  </GlassButton>
</div>
```

**Key Changes:**
- Used `<GlassButton>` with variants
- Added loading state support
- Added icon to primary action
- Ghost variant for secondary action

---

## Example 6: Transform Status Badges

### Before (Original)
```jsx
<div className="flex gap-2">
  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
    Complete
  </span>
  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
    Port: 3/4
  </span>
</div>
```

### After (Liquid Glass)
```jsx
import { GlassBadge } from '../Design';

<div className="flex gap-2">
  <GlassBadge variant="success" dot glow>
    Complete
  </GlassBadge>

  <GlassBadge variant="port" size="md">
    Port: 3/4
  </GlassBadge>

  <GlassBadge variant="starboard" size="md">
    Starboard: 4/4
  </GlassBadge>
</div>
```

**Key Changes:**
- Used `<GlassBadge>` with semantic variants
- Added animated dot indicator for status
- Added glow effect for emphasis
- Consistent sizing and spacing

---

## Example 7: Transform Data Table

### Before (Original)
```jsx
<div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-100 dark:bg-gray-800">
      <tr>
        <th className="px-4 py-3 text-left">Name</th>
        <th className="px-4 py-3 text-left">2k Time</th>
      </tr>
    </thead>
    <tbody>
      {athletes.map(athlete => (
        <tr key={athlete.id} className="border-t border-gray-200 dark:border-gray-700">
          <td className="px-4 py-3">{athlete.name}</td>
          <td className="px-4 py-3">{athlete.time2k}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### After (Liquid Glass)
```jsx
import { GlassCard } from '../Design';

<GlassCard variant="base" className="overflow-hidden">
  <table className="w-full">
    <thead className="glass-subtle">
      <tr>
        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
          Name
        </th>
        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
          2k Time
        </th>
      </tr>
    </thead>
    <tbody>
      {athletes.map((athlete, index) => (
        <tr
          key={athlete.id}
          className="border-t border-white/10 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
        >
          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
            {athlete.name}
          </td>
          <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
            {athlete.time2k}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</GlassCard>
```

**Key Changes:**
- Wrapped table in `<GlassCard>`
- Used `.glass-subtle` for table header
- Glass-style borders (white with low opacity)
- Added hover states with glass transitions
- Monospace font for time data

---

## Example 8: Complete Boat Display Component

### Before (Original)
```jsx
function BoatDisplay({ boat, athletes }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">{boat.name}</h2>

      <div className="grid grid-cols-4 gap-4">
        {boat.seats.map(seat => (
          <div
            key={seat.position}
            className="border-2 border-gray-300 rounded-lg p-3 text-center"
          >
            <p className="font-semibold">{seat.position}</p>
            {seat.athlete && (
              <p className="text-sm mt-2">{seat.athlete.name}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleComplete}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        Mark Complete
      </button>
    </div>
  );
}
```

### After (Liquid Glass)
```jsx
import { GlassCard, GlassButton, GlassBadge } from '../Design';

function BoatDisplay({ boat, athletes }) {
  const completionRate = calculateCompletion(boat.seats);

  return (
    <GlassCard variant="elevated" className="p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {boat.name}
        </h2>
        <GlassBadge
          variant={completionRate === 100 ? 'success' : 'warning'}
          dot={completionRate === 100}
        >
          {completionRate}% Complete
        </GlassBadge>
      </div>

      {/* Seats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {boat.seats.map(seat => (
          <GlassCard
            key={seat.position}
            variant="subtle"
            interactive={!seat.athlete}
            className={`p-4 text-center transition-all ${
              seat.athlete ? 'ring-2 ring-accent-blue/30' : ''
            }`}
          >
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Seat {seat.position}
            </div>

            {seat.athlete ? (
              <>
                <img
                  src={seat.athlete.photo}
                  alt={seat.athlete.name}
                  className="w-12 h-12 mx-auto rounded-full border-2 border-white/30 mb-2"
                />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {seat.athlete.name}
                </p>
                <GlassBadge
                  variant={seat.athlete.side === 'Port' ? 'port' : 'starboard'}
                  size="sm"
                  className="mt-1"
                >
                  {seat.athlete.side}
                </GlassBadge>
              </>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 text-sm">
                Empty
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-white/10 dark:border-white/5">
        <GlassButton
          variant={completionRate === 100 ? 'primary' : 'secondary'}
          size="lg"
          fullWidth
          onClick={handleComplete}
          disabled={completionRate < 100}
        >
          {completionRate === 100 ? 'Mark Complete' : 'Fill All Seats'}
        </GlassButton>
      </div>
    </GlassCard>
  );
}
```

**Key Changes:**
- Multi-level glass hierarchy (card > seats)
- Added completion badge with dynamic variant
- Interactive seat cards with ring indicator
- Athlete photos with glass borders
- Conditional button variant based on state
- Enhanced spacing and layout
- Smooth animations

---

## Quick Reference: Component Mapping

| Old Component | New Component | Key Props |
|---------------|---------------|-----------|
| `<div className="bg-white dark:bg-dark-card">` | `<GlassCard>` | `variant="base"` |
| `<button className="bg-blue-600">` | `<GlassButton>` | `variant="primary"` |
| `<input className="border">` | `<GlassInput>` | `label`, `placeholder` |
| Modal backdrop | `<GlassModal>` | `isOpen`, `onClose` |
| Status badge | `<GlassBadge>` | `variant`, `dot` |
| App wrapper | `<GlassContainer>` | `variant="mesh"` |
| Header/Nav | `<GlassNavbar>` | `title`, `leftContent`, `rightContent` |

---

## Common Patterns

### Pattern 1: Interactive Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <GlassCard
      key={item.id}
      variant="base"
      interactive
      glow
      className="p-6 cursor-pointer"
      onClick={() => handleSelect(item)}
    >
      {/* Content */}
    </GlassCard>
  ))}
</div>
```

### Pattern 2: Form Layout
```jsx
<GlassCard variant="elevated" className="p-6">
  <h2 className="text-xl font-semibold mb-6">Create Lineup</h2>

  <div className="space-y-4">
    <GlassInput label="Name" value={name} onChange={setName} />
    <GlassInput label="Boat Class" value={boat} onChange={setBoat} />
  </div>

  <div className="flex gap-3 mt-6">
    <GlassButton variant="secondary" onClick={handleCancel} fullWidth>
      Cancel
    </GlassButton>
    <GlassButton variant="primary" onClick={handleSubmit} fullWidth>
      Create
    </GlassButton>
  </div>
</GlassCard>
```

### Pattern 3: Status Dashboard
```jsx
<div className="flex gap-3">
  <GlassBadge variant="success" dot>
    {completedCount} Complete
  </GlassBadge>
  <GlassBadge variant="warning">
    {pendingCount} Pending
  </GlassBadge>
  <GlassBadge variant="info">
    {totalAthletes} Athletes
  </GlassBadge>
</div>
```

---

## Performance Tips

1. **Limit nested glass**: Don't nest more than 3 levels of blurred elements
2. **Use `will-change` sparingly**: Only for actively animating elements
3. **Prefer transform over position**: Use `transform: scale()` not `width/height` changes
4. **Lazy load heavy blur**: Start with subtle blur, increase on interaction

```jsx
const [isHovered, setIsHovered] = useState(false);

<GlassCard
  variant="base"
  blur={isHovered ? 'strong' : 'base'}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
```

---

Ready to transform your entire app! 🚀
